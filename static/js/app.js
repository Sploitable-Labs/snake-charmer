// Load sound file for hints
const hint_sound = new Audio("/static/sounds/hint.mp3");

document.addEventListener('DOMContentLoaded', function () {
    const editor = ace.edit("code-editor");
    window.editor = editor; // Make the editor accessible globally
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
    const mediaContainer = document.getElementById("challenge-media");
    const inputContainer = document.getElementById("input-container");
    const outputArea = document.getElementById("output");

    let currentChallenge = null;
    let availableScore = 0;

    const challengeButtons = document.querySelectorAll('.challenge-btn');

    // Attach event listeners to each challenge button
    challengeButtons.forEach(button => {
        button.addEventListener('click', async function () {
            console.log("Challenge button clicked:", this.dataset.id);
    
            // Add visual indicators and setup editor
            computerFrame.classList.add('challenge-selected', 'computer-on');
            computerFrame.classList.remove('computer-off'); // Remove the "computer-off" state
    
            // Remove 'active-challenge' class from all buttons
            challengeButtons.forEach(btn => btn.classList.remove('active-challenge'));
            this.classList.add('active-challenge');
    
            // Load challenge details
            const challengeId = parseInt(this.dataset.id);
            currentChallenge = challengeData.find(c => c.id === challengeId);
    
            if (currentChallenge) {
                const type = currentChallenge.type || "code"; // Default to 'code'
                console.log("Selected Challenge Type:", type);
    
                // Update UI elements
                document.getElementById('challenge-title').textContent = currentChallenge.name;
                document.getElementById('instructions-text').innerHTML = `<p>${currentChallenge.instructions}</p>`;
    
                resetHints();
                setupHints(currentChallenge);
    
                // Clear previous content
                const mediaContainer = document.getElementById("challenge-media");
                const inputContainer = document.getElementById("input-container");
                const outputArea = document.getElementById("output");
    
                mediaContainer.innerHTML = ""; // Clear previous media
                inputContainer.innerHTML = ""; // Clear input field
                if (outputArea) outputArea.innerHTML = ""; // Clear output area
    
                // Handle different challenge types
                if (type === "code") {
                    showCodeEditor();
                    submitButton.removeAttribute('disabled');
                } else {
                    hideCodeEditor();
                    loadChallengeMedia(type, currentChallenge.media);
                    setupInputField(type);
                }
    
                // Update the Brython `challenge_id` variable using `window`
                window.challenge_id = challengeId; // Setting globally for Brython
    
                // Update the available score
                availableScore = currentChallenge.score;
                updateAvailableScore();
            } else {
                console.error("Challenge not found:", challengeId);
            }
        });
    });

    // Functions to show/hide elements based on challenge type
    function showCodeEditor() {
        document.querySelector(".code-editor-container").style.display = "block";
        outputArea.style.display = "block";
        submitButton.style.display = "block";
        editor.setReadOnly(false);
    }

    function hideCodeEditor() {
        const codeEditorContainer = document.querySelector(".code-editor-container");
        const outputArea = document.querySelector(".output-area");
        const submitButton = document.getElementById("submit-btn");
    
        if (codeEditorContainer) {
            codeEditorContainer.style.display = "none";
        }
        if (outputArea) {
            outputArea.style.display = "none";
        }
        if (submitButton) {
            submitButton.style.display = "none";
        }
    }
    

    function loadChallengeMedia(type, mediaPath) {
        if (type === "image") {
            mediaContainer.innerHTML = `<img src="${mediaPath}" alt="Challenge Image" class="img-fluid">`;
        } else if (type === "audio") {
            mediaContainer.innerHTML = `<audio controls><source src="${mediaPath}" type="audio/mpeg">Your browser does not support audio playback.</audio>`;
        } else if (type === "video") {
            mediaContainer.innerHTML = `<video controls><source src="${mediaPath}" type="video/mp4">Your browser does not support video playback.</video>`;
        }
    }

    function setupInputField(type) {
        if (["image", "audio", "video"].includes(type)) {
            inputContainer.innerHTML = `
                <input type="text" id="user-response" placeholder="Enter your answer" class="form-control">
                <button id="submit-response" class="btn btn-success mt-3">Submit Answer</button>
            `;
            document.getElementById("submit-response").addEventListener("click", handleUserResponse);
        }
    }

    function handleUserResponse() {
        const userInput = document.getElementById("user-response").value.trim();
        if (!userInput) {
            alert("Please enter a response.");
            return;
        }

        // Submit the response to the server
        fetch('/submit_results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                challenge_id: currentChallenge.id, 
                user_answer: userInput 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Correct! You earned ${data.challenge_score} points.`);
            } else {
                alert("Incorrect. Try again!");
            }
            updateAvailableScore();
        })
        .catch(error => console.error("Error submitting response:", error));
    }

    function updateAvailableScore() {
        availableScoreElement.textContent = availableScore;
    }

    function resetHints() {
        hintContent.innerHTML = "";
        hintButtonsContainer.innerHTML = "";
    }

    function setupHints(challenge) {
        if (challenge.hint_count > 0) {
            hintsHeader.style.display = "block";
            for (let i = 0; i < challenge.hint_count; i++) {
                const hintButton = document.createElement('button');
                hintButton.classList.add('btn', 'btn-outline-secondary', 'hint-btn');
                hintButton.textContent = `Reveal Hint ${i + 1}`;
                hintButton.dataset.hintIndex = i;

                hintButton.addEventListener('click', () => {
                    hint_sound.play();
                    requestHint(challenge.id, i);
                    hintButton.disabled = true;
                });

                hintButtonsContainer.appendChild(hintButton);
            }
        } else {
            hintsHeader.style.display = "none";
        }
    }

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
                availableScore = Math.max(0, availableScore - data.penalty);
                updateAvailableScore();
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(error => console.error("Error fetching hint:", error));
    }
});
