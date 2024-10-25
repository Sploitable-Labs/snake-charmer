from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Load challenges data from JSON
with open('data/challenges.json') as f:
    challenges = json.load(f)

# Load or initialize user data
try:
    with open('data/config.json') as f:
        user_data = json.load(f)
except FileNotFoundError:
    user_data = {"score": 0, "completed_challenges": []}

def run_user_code(code, test_cases):
    """
    Executes the user's code and checks it against test cases.
    The code must define a function named 'foo' to be tested.
    """
    try:
        # Execute the user code in a restricted local environment
        local_scope = {}
        exec(code, {}, local_scope)
        
        # Retrieve the 'foo' function
        foo = local_scope.get("foo")
        if not foo:
            return False, "Function 'foo' is not defined.", 0

        # Run test cases
        passed_tests = 0
        for test in test_cases:
            if foo(*test['input']) == test['expected_output']:
                passed_tests += 1

        # Calculate the percentage of tests passed
        success = passed_tests == len(test_cases)
        percentage = (passed_tests / len(test_cases)) * 100
        return success, f"{percentage}% of tests passed.", passed_tests

    except Exception as e:
        # Capture any exceptions in user code execution
        return False, f"Error: {str(e)}", 0

@app.route('/')
def index():
    # Pass the challenges and user data to the frontend
    return render_template('index.html', challenges=challenges, user_data=user_data)

@app.route('/submit', methods=['POST'])
def submit():
    code = request.form['code']
    challenge_id = int(request.form['challenge_id'])
    available_score = int(request.form['available_score'])  # Get the adjusted score after hints

    # Find the challenge by ID
    challenge = next((c for c in challenges if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({"success": False, "message": "Challenge not found."})

    # Run user code against the challenge's test cases
    success, message, points = run_user_code(code, challenge['test_cases'])
    
    if success:
        challenge_score = 0  # Initialize variable for points awarded for this challenge
        if challenge_id not in user_data['completed_challenges']:
            challenge_score = available_score  # Award points based on available score
            user_data['score'] += challenge_score  # Update the user's total score
            user_data['completed_challenges'].append(challenge_id)  # Mark challenge as completed
            message = f"Challenge completed! You earned {challenge_score} points."

        # Save user progress to config.json
        with open('data/config.json', 'w') as f:
            json.dump(user_data, f)

        # Return success, the total score, and the points for the current challenge
        return jsonify({"success": success, "message": message, "score": user_data['score'], "challenge_score": challenge_score})

    return jsonify({"success": False, "message": message})

if __name__ == '__main__':
    app.run(debug=True)
