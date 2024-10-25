document.addEventListener('DOMContentLoaded', function () {
    // Initialize Ace code editor
    const editor = ace.edit("code-editor");
    //editor.setTheme("ace/theme/monokai");
    editor.setTheme("ace/theme/solarized_dark");
    editor.session.setMode("ace/mode/python");

    // Enable Active Line Highlighting
    editor.setOption("highlightActiveLine", true);

    // Enable Persistent Vertical Scrollbar
    editor.setOption("vScrollBarAlwaysVisible", true);

    // Set the editor to be read-only initially
    editor.setFontSize(20);
    editor.renderer.setPadding(10);

    const submitButton = document.getElementById('submit-btn');

    // Attach event listeners to each challenge button
    document.querySelectorAll('.challenge-btn').forEach(button => {
        button.addEventListener('click', function () {
            // Log to verify which challenge is selected
            console.log("Challenge button clicked:", this.dataset.id);

            // Set active challenge style and remove it from other buttons
            document.querySelectorAll('.challenge-btn').forEach(btn => btn.classList.remove('active-challenge'));
            this.classList.add('active-challenge');

            // Enable the code editor and submit button
            editor.setReadOnly(false);
            submitButton.removeAttribute('disabled');
  
            // Update the challenge title and instructions
            const challengeId = parseInt(this.dataset.id);
            const challenge = challengeData.find(c => c.id === challengeId);

            if (challenge) {
                console.log("Challenge found:", challenge);
                document.getElementById('challenge-title').textContent = challenge.name;
                document.getElementById('instructions-text').innerHTML = `<p>${challenge.instructions}</p>`;
            } else {
                console.error("Challenge not found:", challengeId);
            }
        });
    });

    // Handle code submission (remaining functionality)
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
            body: `code=${encodeURIComponent(code)}&challenge_id=${challengeId}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showModal("Congratulations!", `Challenge completed! You earned ${data.challenge_score} points.`, "fas fa-trophy text-success");

                activeChallenge.classList.add('completed-challenge');

                // Add a single tick mark if the challenge is completed
                if (!activeChallenge.querySelector('.tick-mark')) {
                    activeChallenge.innerHTML += ' <i class="fas fa-check-circle tick-mark"></i>';
                }

                // Update the score on the page without refreshing
                document.getElementById('score').textContent = data.score;
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

    // Function to display modal with title, message, and icon
    function showModal(title, message, iconClass) {
        document.getElementById('notificationModalLabel').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-icon').className = iconClass;
        new bootstrap.Modal(document.getElementById('notificationModal')).show();
    }
});