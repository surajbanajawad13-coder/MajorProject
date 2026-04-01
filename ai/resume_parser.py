import PyPDF2


# EXTRACT TEXT FROM PDF
def extract_text_from_pdf(file):
    text = ""
    reader = PyPDF2.PdfReader(file)

    for page in reader.pages:
        if page.extract_text():
            text += page.extract_text()

    return text


# SIMPLE SKILL EXTRACTION
def extract_skills(text):
    skills_db = [
        "python", "java", "react", "node", "mongodb",
        "sql", "machine learning", "ai", "html", "css"
    ]

    text = text.lower()
    found_skills = []

    for skill in skills_db:
        if skill in text:
            found_skills.append(skill)

    return found_skills