document.addEventListener('DOMContentLoaded', function () {
    const editor = ace.edit("code-editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/python");

    editor.setFontSize(18);
    editor.renderer.setPadding(10); // Add padding inside the editor

    const fontSizeSelect = document.getElementById('font-size-select');
    fontSizeSelect.addEventListener('change', function () {
        editor.setFontSize(parseInt(this.value, 10));
    });

    const challenges = challengeData || [];
    
    document.querySelectorAll('.challenge-btn').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.challenge-btn').forEach(btn => btn.classList.remove('active-challenge'));
            this.classList.add('active-challenge');

            const challengeId = parseInt(this.dataset.id);
            const challenge = challenges.find(c => c.id === challengeId);
            
            if (challenge) {
                document.getElementById('challenge-title').textContent = challenge.name;
                document.getElementById('instructions-content').innerHTML = `<p>${challenge.instructions}</p>`;
            }
        });
    });

    document.getElementById('submit-btn').addEventListener('click', () => {
        const code = editor.getValue();
        const activeChallenge = document.querySelector('.challenge-btn.active-challenge');

        if (!activeChallenge) {
            showAlert("Please select a challenge.", "warning");
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
            showAlert(data.message, data.success ? "success" : "danger");
            document.getElementById('score').textContent = data.score;

            if (data.success) {
                activeChallenge.innerHTML += ' <i class="fas fa-check-circle text-success"></i>';
            }
        });
    });

    function showAlert(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.className = `alert alert-${type} mt-3`;
        messageDiv.textContent = message;
        messageDiv.classList.remove('d-none');
    }
});
