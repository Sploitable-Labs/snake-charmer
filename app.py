from flask import Flask, render_template, request, jsonify, session
import json
from glob import glob
import os
from datetime import timedelta
import secrets

app = Flask(__name__)

app.secret_key = secrets.token_hex(32)  # Generates a secure 64-character hexadecimal key

app.config.update(
    PERMANENT_SESSION_LIFETIME=timedelta(days=365 * 100),  # Set session lifetime to a very high value
    SESSION_COOKIE_SAMESITE="Lax",  # "Lax" if cross-site is not required
    SESSION_COOKIE_SECURE=False       # Set to True if using HTTPS
)

# Load all challenges from JSON files at startup
challenges = []

def load_all_challenges():
    global challenges
    challenges.clear()  # Clear existing data if reloading

    challenges_dir = os.path.join(app.root_path, 'data/challenges')
    all_challenges = []

    # Load each JSON file in the challenges directory
    for filepath in glob(os.path.join(challenges_dir, '*.json')):
        with open(filepath, 'r') as file:
            data = json.load(file)
            all_challenges.extend(data)  # Assuming each JSON file contains a list of challenges

    # Assign a unique ID to each challenge
    for index, challenge in enumerate(all_challenges, start=1):
        challenge['id'] = index  # Assign IDs sequentially
    challenges.extend(all_challenges)

    # Add `hint_count` dynamically for each challenge
    for challenge in challenges:
        challenge['hint_count'] = len(challenge.get('hints', []))  # Count hints if available

    return challenges

@app.route('/')
def index():
    load_all_challenges()

    # Initialize user_data in session if it doesn't exist
    if 'user_data' not in session:
        session['user_data'] = {
            'score': 0,
            'completed_challenges': []
        }

    # Prepare sanitized challenges for the frontend
    sanitized_challenges = [
        {
            "id": challenge["id"],
            "name": challenge["name"],
            "category": challenge["category"],
            "difficulty": challenge["difficulty"],
            "score": challenge["score"],
            "instructions": challenge["instructions"],
            "hint_count": challenge["hint_count"]
        }
        for challenge in challenges
    ]

    return render_template('index.html', challenges=sanitized_challenges, user_data=session['user_data'])


@app.route('/get_test_arguments', methods=['GET'])
def get_test_arguments():
    """Endpoint to fetch test arguments for a specific challenge."""
    challenge_id = request.args.get('challenge_id', type=int)
    challenge = next((c for c in challenges if c['id'] == challenge_id), None)
    
    if not challenge:
        return jsonify({"success": False, "message": "Challenge not found."})
    

    # Return only the inputs for test cases, not the expected outputs
    test_arguments = [test_case['input'] for test_case in challenge['test_cases']]
    return jsonify({"success": True, "test_arguments": test_arguments})

import json
from flask import request, jsonify, session

@app.route('/submit_results', methods=['POST'])
def submit_result():
    """Endpoint to receive the list of results from the user's code execution."""
    data = request.json
    challenge_id = data.get('challenge_id')
    results = data.get('results')  # List of results from user's code
    
    # Find the challenge by ID to access expected outputs and score
    challenge = next((c for c in challenges if c['id'] == int(challenge_id)), None)

    if not challenge:
        return jsonify({"success": False, "message": "Challenge not found."})

    # Check if the user's results match the expected outputs
    expected_outputs = [test_case['expected_output'] for test_case in challenge['test_cases']]
    passed_tests = sum(1 for result, expected in zip(results, expected_outputs) if result == expected)
    
    # Determine if the challenge is fully passed
    success = passed_tests == len(expected_outputs)
    base_score = challenge['score']  # Base score defined in the JSON

    # Calculate penalties based on hints used
    used_hints = session.get('used_hints', {}).get(challenge_id, set())
    total_penalty = sum(challenge['hints'][i]['penalty'] for i in used_hints)

    # Adjust final score if the challenge is successfully completed
    final_score = max(base_score - total_penalty, 0) if success else 0

    # Initialize session data if it doesn't exist
    user_data = session.get('user_data', {'score': 0, 'completed_challenges': []})

    # Update user score and completed challenges only if challenge is successfully passed
    if success and challenge_id not in user_data['completed_challenges']:
        user_data['completed_challenges'].append(challenge_id)
        user_data['score'] += final_score  # Add the adjusted score
        session['user_data'] = user_data  # Update session with new user_data

    # Prepare the response message
    message = f"{passed_tests}/{len(expected_outputs)} tests passed."
    
    return jsonify({
        "success": success,
        "message": message,
        "score": user_data['score'],
        "completed_challenges": user_data['completed_challenges'],
        "challenge_score": final_score,  # Return the score for this challenge after penalties
        "passed_tests": passed_tests,
        "total_tests": len(expected_outputs)
    })

@app.route("/get_hint", methods=["POST"])
def get_hint():
    data = request.json
    challenge_id = data.get("challenge_id")
    hint_index = data.get("hint_index")

    # Validate challenge and hint index
    challenge = challenges[challenge_id - 1]
    if not challenge or hint_index >= len(challenge["hints"]):
        return jsonify({"error": "Invalid challenge or hint index"}), 400

    # Track accessed hints in session
    used_hints = session.setdefault("used_hints", {}).setdefault(str(challenge_id), [])

    # Add hint index to the list if not already present
    if hint_index not in used_hints:
        used_hints.append(hint_index)

    # Save the updated hints data back to session
    session.modified = True

    hint_text = challenge["hints"][hint_index]["text"]
    penalty = challenge["hints"][hint_index]["penalty"]

    return jsonify({"hint_text": hint_text, "penalty": penalty})


if __name__ == '__main__':
    app.run(debug=True)