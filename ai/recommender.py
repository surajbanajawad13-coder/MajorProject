from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ================= JOB RECOMMENDATION =================
def recommend_jobs(student, companies):
    results = []

    student_text = " ".join(student.get("skills", []))

    for company in companies:
        # CGPA FILTER
        if student.get("cgpa", 0) >= company.get("cutoff", 0):

            company_text = company.get("skills", "")

            tfidf = TfidfVectorizer()
            vectors = tfidf.fit_transform([student_text, company_text])

            score = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

            results.append({
                "company": company.get("name"),
                "match": round(score * 100, 2),
                "status": company.get("status", "Unknown")
            })

    # SORT BY MATCH %
    results.sort(key=lambda x: x["match"], reverse=True)

    return results


# ================= EVENT RECOMMENDATION =================
def recommend_events(student, events):
    results = []

    student_text = " ".join(
        student.get("skills", []) + student.get("interests", [])
    )

    for event in events:
        event_text = event.get("tags", "") + " " + event.get("description", "")

        tfidf = TfidfVectorizer()
        vectors = tfidf.fit_transform([student_text, event_text])

        score = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

        results.append({
            "event": event.get("name"),
            "match": round(score * 100, 2)
        })

    results.sort(key=lambda x: x["match"], reverse=True)

    return results