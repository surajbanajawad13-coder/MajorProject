"""
CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
---------------------------------------------------------------------
Module: app.py
Purpose: Flask microservice entrypoint. Exposes:
    POST /resume/upload      -> parse a PDF resume, return structured data
    POST /recommend/jobs     -> legacy-shaped placement recommendation
    POST /recommend/events   -> legacy-shaped event recommendation
    POST /recommend          -> combined events + placements recommendation
                                 using the strict point-scoring rubric
                                 (called by the Node.js
                                 GET /api/recommendations/:userId route)
    GET  /health              -> simple liveness check

Project by: Vikas (USN: 4CB23CS186)
---------------------------------------------------------------------

Run locally:
    cd ai
    pip install -r requirements.txt
    python app.py
    # service listens on http://localhost:5000
"""

from flask import Flask, request, jsonify

from recommender import recommend, recommend_jobs, recommend_events
from resume_parser import parse_resume

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "campusconnect-ai"})


# ================= RESUME PARSER =================
@app.route("/resume/upload", methods=["POST"])
def upload_resume():
    """
    Accepts a multipart/form-data file upload under the field name
    'file' and returns the full structured parse (skills, languages,
    tools, projects, certifications, raw extracted text).
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Expected form field 'file'."}), 400

    file = request.files["file"]
    result = parse_resume(file)
    return jsonify(result)


# ================= COMBINED RECOMMENDATION (strict scoring) =================
@app.route("/recommend", methods=["POST"])
def recommend_api():
    """
    Body shape:
    {
      "profile": { skills, interests, department, year, cgpa,
                   certifications, projects },
      "resume": { parsed_skills, parsed_projects, certifications } | null,
      "events": [ {...event fields} ],
      "placements": [ {...placement fields} ]
    }

    Returns events and placements each scored + ranked using the
    strict point-based rubric, sorted highest score first.
    """
    data = request.get_json(force=True) or {}

    profile = data.get("profile", {})
    resume = data.get("resume")
    events = data.get("events", [])
    placements = data.get("placements", [])

    event_results = recommend(profile, events, resume=resume, opportunity_type="event")
    placement_results = recommend(profile, placements, resume=resume, opportunity_type="placement")

    combined = sorted(event_results + placement_results, key=lambda r: r["score"], reverse=True)

    return jsonify({
        "events": event_results,
        "placements": placement_results,
        "combined": combined,
    })


# ================= LEGACY-SHAPED ENDPOINTS (kept for compatibility) =================
@app.route("/recommend/jobs", methods=["POST"])
def recommend_jobs_api():
    data = request.get_json(force=True) or {}
    student = data.get("student", {})
    companies = data.get("companies", [])
    result = recommend_jobs(student, companies)
    return jsonify(result)


@app.route("/recommend/events", methods=["POST"])
def recommend_events_api():
    data = request.get_json(force=True) or {}
    student = data.get("student", {})
    events = data.get("events", [])
    result = recommend_events(student, events)
    return jsonify(result)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
