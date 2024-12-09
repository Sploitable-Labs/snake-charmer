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
ninja_challenges = []

ninja_unlock_threshold = 500

def load_all_challenges():
    global challenges, ninja_challenges
    challenges.clear()
    ninja_challenges.clear()

    challenges_dir = os.path.join(app.root_path, 'data/challenges')
    all_challenges = []

    # Extend challenge loader to include new types
    for filepath in glob(os.path.join(challenges_dir, '*.json')):
        with open(filepath, 'r') as file:
            data = json.load(file)
            for challenge in data:
                challenge['type'] = challenge.get('type', 'code')  # Default to 'code'
                challenge['hint_count'] = len(challenge.get('hints', []))
                if challenge['category'] == 'Ninja':
                    ninja_challenges.append(challenge)
                else:
                    challenges.append(challenge)

load_all_challenges()

@app.template_filter('sort_ninja_last')
def sort_ninja_last(categories):
    # Sort categories, keeping "Ninja" at the end
    sorted_categories = sorted(categories, key=lambda x: (x[0] == 'Ninja', x[0]))
    return sorted_categories

@app.route('/')
def index():
    session.permanent = True

    # Initialize user data in session if it doesn't exist
    if 'user_data' not in session:
        session['user_data'] = {
            'score': 0,
            'completed_challenges': []
        }

    ninja_unlocked = session['user_data']['score'] >= ninja_unlock_threshold
    session['ninja_unlocked'] = ninja_unlocked

    # Only send Ninja challenges if they are unlocked
    challenges_to_send = challenges + (ninja_challenges if ninja_unlocked else [])

    # Sanitize challenges data
    sanitized_challenges = [
        {
            "id": challenge["id"],
            "name": challenge["name"],
            "category": challenge["category"],
            "difficulty": challenge["difficulty"],
            "score": challenge["score"],
            "instructions": challenge["instructions"],
            "hint_count": challenge["hint_count"],
            "type": challenge.get("type", "code"),  # Ensure the 'type' is included
            "media": challenge.get("media", None)   # Include 'media' for non-code challenges
        }
        for challenge in challenges_to_send
    ]

    return render_template('index.html', challenges=sanitized_challenges, user_data=session['user_data'])


@app.route('/submit_results', methods=['POST'])
def submit_results():
    data = request.json
    challenge_id = data.get('challenge_id')
    results = data.get('results', [])  # Default to an empty list for non-code challenges
    user_answer = data.get('user_answer', "").strip().lower()  # For non-code challenges

    # Find the challenge by ID
    challenge = next((c for c in challenges + ninja_challenges if c['id'] == int(challenge_id)), None)

    if not challenge:
        return jsonify({"success": False, "message": "Challenge not found."}), 404

    # Default values
    success = False
    final_score = 0
    user_data = session.get('user_data', {'score': 0, 'completed_challenges': []})
    used_hints = session.get('used_hints', {}).get(str(challenge_id), [])
    total_penalty = sum(challenge['hints'][i]['penalty'] for i in used_hints)

    # Handle different challenge types
    if challenge["type"] == "code":
        # Validate coding challenges
        expected_outputs = [test_case['expected_output'] for test_case in challenge['test_cases']]
        passed_tests = sum(1 for result, expected in zip(results, expected_outputs) if result == expected)

        success = passed_tests == len(expected_outputs)
        base_score = challenge['score']
        final_score = max(base_score - total_penalty, 0) if success else 0

    elif challenge["type"] in ["image", "audio", "video"]:
        # Validate non-coding challenges
        expected_answer = challenge["answer"].strip().lower()
        success = expected_answer == user_answer
        base_score = challenge['score']
        final_score = max(base_score - total_penalty, 0) if success else 0

    # Update user data
    if success and challenge_id not in user_data['completed_challenges']:
        user_data['completed_challenges'].append(challenge_id)
        user_data['score'] += final_score
        session['user_data'] = user_data

    # Check for Ninja unlock
    ninja_unlocked = session['user_data']['score'] >= ninja_unlock_threshold
    session['ninja_unlocked'] = ninja_unlocked

    # Response
    response = {
        "success": success,
        "message": "Challenge completed successfully!" if success else "Challenge failed. Try again!",
        "score": user_data['score'],
        "completed_challenges": user_data['completed_challenges'],
        "challenge_score": final_score,
        "ninja_unlocked": ninja_unlocked,
    }

    if challenge["type"] == "code":
        response.update({
            "passed_tests": passed_tests,
            "total_tests": len(expected_outputs),
        })

    return jsonify(response)

@app.route('/get_test_arguments', methods=['GET'])
def get_test_arguments():
    """Endpoint to fetch test arguments for a specific challenge."""
    challenge_id = request.args.get('challenge_id', type=int)
    challenge = next((c for c in challenges + ninja_challenges if c['id'] == challenge_id), None)
    
    if not challenge:
        return jsonify({"success": False, "message": "Challenge not found."})
    

    # Return only the inputs for test cases, not the expected outputs
    test_arguments = [test_case['input'] for test_case in challenge['test_cases']]
    return jsonify({"success": True, "test_arguments": test_arguments})

@app.route("/get_hint", methods=["POST"])
def get_hint():
    data = request.json
    challenge_id = data.get("challenge_id")
    hint_index = data.get("hint_index")    

    # Find the challenge by ID
    challenge = next((c for c in challenges + ninja_challenges if c["id"] == challenge_id), None)

    # Validate challenge and hint index
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
    app.run(debug=True, port=5003)