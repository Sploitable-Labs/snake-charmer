from flask import Flask, render_template, request, jsonify
import json
from glob import glob
import os

app = Flask(__name__)

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

    return challenges

# Load or initialize user data
try:
    with open('data/config.json') as f:
        user_data = json.load(f)
except FileNotFoundError:
    user_data = {"score": 0, "completed_challenges": []}

@app.route('/')
def index():
    # Load challenges for the frontend
    load_all_challenges()
    return render_template('index.html', challenges=challenges, user_data=user_data)

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

@app.route('/submit_result', methods=['POST'])
def submit_result():
    """Endpoint to receive the list of results from the user's code execution."""
    data = request.json
    challenge_id = data.get('challenge_id')
    results = data.get('results')  # List of results from user's code
    
    # Find the challenge by ID to access expected outputs
    challenge = next((c for c in challenges if c['id'] == int(challenge_id)), None)

    print(f"Challenge ID: {challenge_id}")
    print(f"c: {challenge}")

    if not challenge:
        return jsonify({"success": False, "message": "Challenge not found."})

    # Check if the user's results match the expected outputs
    expected_outputs = [test_case['expected_output'] for test_case in challenge['test_cases']]
    passed_tests = sum(1 for result, expected in zip(results, expected_outputs) if result == expected)
    
    # Determine if the challenge is fully passed
    success = passed_tests == len(expected_outputs)
    if success and challenge_id not in user_data['completed_challenges']:
        user_data['completed_challenges'].append(challenge_id)
        user_data['score'] += challenge['score']  # Assume challenge score is defined in the JSON

        # Save updated user data to config.json
        with open('data/config.json', 'w') as f:
            json.dump(user_data, f)

    message = f"{passed_tests}/{len(expected_outputs)} tests passed."
    return jsonify({
        "success": success,
        "message": message,
        "score": user_data['score'],
        "passed_tests": passed_tests,
        "total_tests": len(expected_outputs)
    })

if __name__ == '__main__':
    app.run(debug=True)