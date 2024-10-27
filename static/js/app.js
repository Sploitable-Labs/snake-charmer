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

    function isChallengeCompleted(challengeId) {
        // Check if user_data.completed_challenges contains the challenge ID
        return window.user_data.completed_challenges.includes(String(challengeId));
    }

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

            // Remove 'active-challenge' class from all buttons
            challengeButtons.forEach(btn => btn.classList.remove('active-challenge'));

            // Add 'active-challenge' class to the clicked button
            this.classList.add('active-challenge');

            // Load challenge details
            const challengeId = parseInt(this.dataset.id);

            // Clear the output area by setting its innerHTML to an empty string
            const outputArea = document.getElementById("output");
            if (outputArea) {
                outputArea.innerHTML = "";  // Clear the output area
            }

            // Update the Brython `challenge_id` variable using `window`
            window.challenge_id = parseInt(challengeId);  // Setting globally for Brython

            currentChallenge = challengeData.find(c => c.id === challengeId);
            if (currentChallenge) {
                document.getElementById('challenge-title').textContent = currentChallenge.name;
                document.getElementById('instructions-text').innerHTML = `<p>${currentChallenge.instructions}</p>`;
                availableScore = currentChallenge.score;
                updateAvailableScore();
                resetHints();

                // Clear previous hint buttons
                hintButtonsContainer.innerHTML = "";

                // Display hints if available
                if (currentChallenge.hint_count > 0) {
                    hintsHeader.style.display = 'block';
                    
                    // Create hint buttons based on `hint_count`
                    for (let i = 0; i < currentChallenge.hint_count; i++) {
                        const hintButton = document.createElement('button');
                        hintButton.classList.add('btn', 'btn-outline-secondary', 'hint-btn');
                        hintButton.textContent = `Reveal Hint ${i + 1}`;
                        hintButton.dataset.hintIndex = i;

                        console.log(currentChallenge.id);
                        console.log(isChallengeCompleted(currentChallenge.id));
                        if(isChallengeCompleted(currentChallenge.id)){
                            hintButton.disabled = true;
                            submitButton.disabled = true;
                        }
                        console.log(hintButton);

                        // Attach click event to request the hint from the server
                        hintButton.addEventListener('click', () => {
                            requestHint(challengeId, i);  // Fetch hint text from the server
                            // Disable the button after it's clicked
                            hintButton.disabled = true;
                        });

                        hintButtonsContainer.appendChild(hintButton);
                    }
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

    function updateAvailableScore() {
        availableScoreElement.textContent = availableScore;
    }

    function resetHints() {
        hintContent.innerHTML = "";
        hintButtonsContainer.innerHTML = "";
    }

    function showModal(title, message, iconClass) {
        document.getElementById('notificationModalLabel').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-icon').className = iconClass;
        new bootstrap.Modal(document.getElementById('notificationModal')).show();
    }

    document.addEventListener('keydown', function(event) {
        // Find the key on the screen using the key code class (e.g., "c13" for Enter)
        const keyElement = document.querySelector(`.c${event.keyCode}`);
    
        if (keyElement) {
            // Add the highlight class to the key
            keyElement.classList.add('highlighted');
        }
    });
    
    document.addEventListener('keyup', function(event) {
        // Remove the highlight when the key is released
        const keyElement = document.querySelector(`.c${event.keyCode}`);
        if (keyElement) {
            keyElement.classList.remove('highlighted');
        }
    });
    
    // Function to request a hint from the server
    function requestHint(challengeId, hintIndex) {
        fetch('/get_hint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ challenge_id: challengeId, hint_index: hintIndex })
        })
        .then(response => response.json())
        .then(data => {
            if (data.hint_text) {
                hintContent.innerHTML += `<p>${data.hint_text}</p>`;
                 
                if(!isChallengeCompleted(currentChallenge)) { // TODO: change condition to check if challenge is not solved
                    availableScore = Math.max(0, availableScore - data.penalty); // Deduct score but keep non-negative
                    updateAvailableScore()
                }
                
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(error => console.error("Error fetching hint:", error));
    }
});

