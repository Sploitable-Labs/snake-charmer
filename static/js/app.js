document.addEventListener('DOMContentLoaded', function () {
    const editor = ace.edit("code-editor");
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
        
        // Assuming `editor` is your Ace editor instance
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
    document.querySelectorAll('.challenge-btn').forEach(button => {
        button.addEventListener('click', function () {
            console.log("Challenge button clicked:", this.dataset.id);

            // Add 'challenge-selected' class to make the power light green
            computerFrame.classList.add('challenge-selected');

            // Add the computer-on class to trigger the fade-out effect
            computerFrame.classList.add('computer-on');

            // Listen for the end of the transition before removing .computer-off
            computerFrame.addEventListener('transitionend', function handler() {
                computerFrame.classList.remove('computer-off');
                computerFrame.removeEventListener('transitionend', handler); // Clean up event listener
            });

            // Remove 'active-challenge' class from all buttons
            challengeButtons.forEach(btn => btn.classList.remove('active-challenge'));

            // Add 'active-challenge' class to the clicked button
            this.classList.add('active-challenge');

            editor.setReadOnly(false);
            submitButton.removeAttribute('disabled');
  
            const challengeId = parseInt(this.dataset.id);
            currentChallenge = challengeData.find(c => c.id === challengeId);

            if (currentChallenge) {
                console.log("Challenge found:", currentChallenge);
                document.getElementById('challenge-title').textContent = currentChallenge.name;
                document.getElementById('instructions-text').innerHTML = `<p>${currentChallenge.instructions}</p>`;

                availableScore = currentChallenge.score;
                updateAvailableScore();

                // Generate hints based on the current challenge's hints
                resetHints();
                if (currentChallenge.hints && currentChallenge.hints.length > 0) {
                    hintsHeader.style.display = 'block'; // Show the hints header
                    currentChallenge.hints.forEach((hint, index) => {
                        const hintButton = document.createElement('button');
                        hintButton.classList.add('btn', 'btn-outline-secondary', 'hint-btn');
                        hintButton.textContent = `Reveal Hint ${index + 1}`;
                        hintButton.dataset.hintIndex = index;
                        hintButton.addEventListener('click', () => revealHint(index, hint.penalty, hint.text));
                        hintButtonsContainer.appendChild(hintButton);
                    });
                } else {
                    hintsHeader.style.display = 'none'; // Hide the hints header if no hints
                }
            } else {
                console.error("Challenge not found:", challengeId);
            }
        });
    });

    // Function to reveal a hint and apply penalty
    function revealHint(index, penalty, text) {
        availableScore = Math.max(0, availableScore - penalty); // Deduct score but keep non-negative
        updateAvailableScore();

        // Display the hint text in the hint content section
        hintContent.innerHTML += `<p>${text}</p>`;

        // Disable the hint button after revealing
        document.querySelector(`.hint-btn[data-hint-index="${index}"]`).disabled = true;
    }

    // Function to update the available score display
    function updateAvailableScore() {
        availableScoreElement.textContent = availableScore;
    }

    // Function to reset hints and re-enable hint buttons for a new challenge
    function resetHints() {
        hintContent.innerHTML = "";
        hintButtonsContainer.innerHTML = ""; // Clear previous hint buttons
    }

    submitButton.addEventListener('click', () => {
        const code = editor.getValue();
        const activeChallenge = document.querySelector('.challenge-btn.active-challenge');

        if (!activeChallenge) {
            showModal("Warning", "Please select a challenge.", "fas fa-exclamation-triangle text-warning");
            return;
        }

        const challengeId = activeChallenge.dataset.id;

        fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `code=${encodeURIComponent(code)}&challenge_id=${challengeId}&available_score=${availableScore}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showModal("Congratulations!", `Challenge completed! You earned ${data.challenge_score} points.`, "fas fa-trophy text-success");

                if (!activeChallenge.querySelector('.tick-mark')) {
                    activeChallenge.innerHTML += ' <i class="fas fa-check-circle tick-mark"></i>';
                }

                document.getElementById('score').textContent = data.score;

                availableScore = 0;
                updateAvailableScore();
            } else {
                const failureMessages = [
                    "Oops! Better luck next time.",
                    "Close, but not quite!",
                    "Almost there! Keep trying!",
                    "Hmm... something went awry!"
                ];
                const randomMessage = failureMessages[Math.floor(Math.random() * failureMessages.length)];
                showModal("Try Again!", randomMessage, "fas fa-times-circle text-danger");
            }
        })
        .catch(error => {
            console.error("Error submitting code:", error);
            showModal("Error", "An error occurred while submitting the code.", "fas fa-exclamation-triangle text-warning");
        });
    });

    function showModal(title, message, iconClass) {
        document.getElementById('notificationModalLabel').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-icon').className = iconClass;
        new bootstrap.Modal(document.getElementById('notificationModal')).show();
    }
});

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
