document.addEventListener('DOMContentLoaded', function () {
    const editor = ace.edit("code-editor");
    window.editor = editor;  // Make the editor accessible globally
    editor.setTheme("ace/theme/solarized_dark");
    editor.session.setMode("ace/mode/python");
    editor.setOption("highlightActiveLine", true);
    editor.setOption("vScrollBarAlwaysVisible", true);
    editor.setFontSize(20);
    editor.renderer.setPadding(10);
    editor.setReadOnly(true);

    // Initialize settings modal
    document.getElementById('settings-icon').addEventListener('click', () => {
        const settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
        settingsModal.show();
    });

    // Apply settings to the editor
    document.getElementById('apply-settings').addEventListener('click', () => {
        const theme = document.getElementById('theme-select').value;
        const fontSize = document.getElementById('font-size-input').value;
        editor.setTheme(`ace/theme/${theme}`);
        editor.setFontSize(`${fontSize}px`);

        // Close the modal after applying settings
        const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settings-modal'));
        settingsModal.hide();
    });

    const submitButton = document.getElementById('submit-btn');
    const availableScoreElement = document.getElementById('available-score');
    const hintButtonsContainer = document.getElementById('hint-buttons');
    const hintContent = document.getElementById('hint-content');
    const hintsHeader = document.getElementById('hints-header');
    const computerFrame = document.querySelector('.computer-frame');

    let currentChallenge = null;
    let availableScore = 0;

    const challengeButtons = document.querySelectorAll('.challenge-btn');

    // Attach event listeners to each challenge button
    challengeButtons.forEach(button => {
        button.addEventListener('click', async function () {
            console.log("Challenge button clicked:", this.dataset.id);

            // Add visual indicators and setup editor
            computerFrame.classList.add('challenge-selected', 'computer-on');
            editor.setReadOnly(false);
            submitButton.removeAttribute('disabled');

            // Load challenge details
            const challengeId = parseInt(this.dataset.id);

            // Update the Brython `challenge_id` variable using `window`
            window.challenge_id = parseInt(challengeId);  // Setting globally for Brython

            currentChallenge = challengeData.find(c => c.id === challengeId);
            if (currentChallenge) {
                document.getElementById('challenge-title').textContent = currentChallenge.name;
                document.getElementById('instructions-text').innerHTML = `<p>${currentChallenge.instructions}</p>`;
                availableScore = currentChallenge.score;
                updateAvailableScore();
                resetHints();

                // Display hints if available
                if (currentChallenge.hints?.length > 0) {
                    hintsHeader.style.display = 'block';
                    currentChallenge.hints.forEach((hint, index) => {
                        const hintButton = document.createElement('button');
                        hintButton.classList.add('btn', 'btn-outline-secondary', 'hint-btn');
                        hintButton.textContent = `Reveal Hint ${index + 1}`;
                        hintButton.dataset.hintIndex = index;
                        hintButton.addEventListener('click', () => revealHint(index, hint.penalty, hint.text));
                        hintButtonsContainer.appendChild(hintButton);
                    });
                } else {
                    hintsHeader.style.display = 'none';
                }

                // Fetch and run test arguments
                fetchTestArguments(challengeId);
            } else {
                console.error("Challenge not found:", challengeId);
            }
        });
    });

    // Function to fetch test arguments for the selected challenge
    async function fetchTestArguments(challengeId) {
        try {
            const response = await fetch(`/get_test_arguments?challenge_id=${challengeId}`);
            const data = await response.json();
            if (data.success) {
                console.log("Test arguments:", data.test_arguments);
                window.testArguments = data.test_arguments;
            } else {
                console.error("Failed to load test arguments.");
            }
        } catch (error) {
            console.error("Error fetching test arguments:", error);
        }
    }

    // Function to reveal a hint and apply penalty
    function revealHint(index, penalty, text) {
        availableScore = Math.max(0, availableScore - penalty);
        updateAvailableScore();
        hintContent.innerHTML += `<p>${text}</p>`;
        document.querySelector(`.hint-btn[data-hint-index="${index}"]`).disabled = true;
    }

    function updateAvailableScore() {
        availableScoreElement.textContent = availableScore;
    }

    function resetHints() {
        hintContent.innerHTML = "";
        hintButtonsContainer.innerHTML = "";
    }

    submitButton.addEventListener('click', () => {
        const code = editor.getValue();
        const activeChallenge = document.querySelector('.challenge-btn.active-challenge');

        if (!activeChallenge) {
            showModal("Warning", "Please select a challenge.", "fas fa-exclamation-triangle text-warning");
            return;
        }

        const challengeId = activeChallenge.dataset.id;

        // Execute the user code with Brython
        executeUserCode(code, window.testArguments, challengeId);
    });

    function executeUserCode(code, testArguments, challengeId) {
        const localScope = {};
        const results = [];

        try {
            // Execute the user's code in an isolated scope
            exec(code, {}, localScope);

            // Check if the function 'foo' exists and execute it with each argument set
            if ('foo' in localScope) {
                const foo = localScope['foo'];
                testArguments.forEach(args => results.push(foo(...args)));
                submitResults(challengeId, results);
            } else {
                showModal("Error", "Function 'foo' is not defined.", "fas fa-exclamation-circle text-danger");
            }
        } catch (error) {
            console.error("Error executing code:", error);
            showModal("Error", "An error occurred while running your code.", "fas fa-exclamation-circle text-danger");
        }
    }

    // Submit the list of results back to the server for validation
    function submitResults(challengeId, results) {
        fetch('/submit_result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challenge_id: challengeId, results: results })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showModal("Congratulations!", `${data.message} You earned ${availableScore} points.`, "fas fa-trophy text-success");
                document.getElementById('score').textContent = data.score;
                availableScore = 0;
                updateAvailableScore();
            } else {
                showModal("Try Again!", data.message, "fas fa-times-circle text-danger");
            }
        })
        .catch(error => {
            console.error("Error submitting results:", error);
            showModal("Error", "An error occurred while submitting results.", "fas fa-exclamation-triangle text-warning");
        });
    }

    function showModal(title, message, iconClass) {
        document.getElementById('notificationModalLabel').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-icon').className = iconClass;
        new bootstrap.Modal(document.getElementById('notificationModal')).show();
    }
});