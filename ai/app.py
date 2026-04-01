from flask import Flask, request, jsonify
from recommender import recommend_jobs, recommend_events
from resume_parser import extract_text_from_pdf, extract_skills

app = Flask(__name__)


# ================= JOB RECOMMENDATION =================
@app.route('/recommend/jobs', methods=['POST'])
def recommend_jobs_api():
    data = request.json

    student = data.get("student")
    companies = data.get("companies")

    result = recommend_jobs(student, companies)

    return jsonify(result)


# ================= EVENT RECOMMENDATION =================
@app.route('/recommend/events', methods=['POST'])
def recommend_events_api():
    data = request.json

    student = data.get("student")
    events = data.get("events")

    result = recommend_events(student, events)

    return jsonify(result)


# ================= RESUME PARSER =================
@app.route('/resume/upload', methods=['POST'])
def upload_resume():
    file = request.files['file']

    text = extract_text_from_pdf(file)
    skills = extract_skills(text)

    return jsonify({
        "skills": skills
    })


if __name__ == '__main__':
    app.run(port=5000, debug=True)