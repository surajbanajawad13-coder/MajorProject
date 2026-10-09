"""
CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
---------------------------------------------------------------------
Module: resume_parser.py
Purpose: Extracts structured data (skills, programming languages, tools,
         projects, certifications, role interests) from uploaded PDF/DOCX files.

Project by: Vikas (USN: 4CB23CS186)
---------------------------------------------------------------------
"""

import re
import io
import zipfile
import xml.etree.ElementTree as ET

try:
    import pdfplumber
    _HAS_PDFPLUMBER = True
except ImportError:
    _HAS_PDFPLUMBER = False

try:
    import pymupdf as fitz  # PyMuPDF, used as a fallback extractor
    _HAS_PYMUPDF = True
except ImportError:
    try:
        import fitz  # older PyMuPDF versions expose the module as `fitz`
        _HAS_PYMUPDF = True
    except ImportError:
        _HAS_PYMUPDF = False


# ─────────────────────────────────────────────────────────────
# Reference knowledge bases used for keyword matching.
# These are intentionally kept as plain Python structures so they
# are easy to extend as the synthetic dataset / curriculum grows.
# ─────────────────────────────────────────────────────────────

PROGRAMMING_LANGUAGES = [
    "python", "java", "c++", "c#", "c", "javascript", "typescript", "go",
    "golang", "rust", "kotlin", "swift", "php", "ruby", "r", "matlab",
    "scala", "dart", "perl", "sql", "html", "css", "bash", "shell",
]

TOOLS_AND_FRAMEWORKS = [
    "react", "react.js", "angular", "vue", "vue.js", "node", "node.js",
    "express", "express.js", "django", "flask", "spring", "spring boot",
    "next.js", "nextjs", "redux", "tailwind", "bootstrap", "mongodb",
    "mysql", "postgresql", "postgres", "firebase", "docker", "kubernetes",
    "git", "github", "gitlab", "jenkins", "aws", "azure", "gcp",
    "google cloud", "linux", "figma", "postman", "jira", "tensorflow",
    "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy",
    "opencv", "power bi", "tableau", "excel", "hadoop", "spark",
    "kafka", "graphql", "rest api", "microservices", "android studio",
    "unity", "webpack", "vite", "npm", "yarn",
]

SOFT_DOMAIN_KEYWORDS = [
    "machine learning", "deep learning", "artificial intelligence",
    "data science", "data analytics", "natural language processing", "nlp",
    "computer vision", "cybersecurity", "cyber security", "blockchain",
    "cloud computing", "devops", "web development", "app development",
    "mobile development", "ui/ux", "ui ux", "iot", "internet of things",
    "big data", "database management", "software engineering",
    "full stack", "full-stack", "backend", "frontend", "front-end",
    "back-end", "competitive programming", "data structures",
    "algorithms", "operating systems", "computer networks",
]

ROLE_INTEREST_KEYWORDS = list(dict.fromkeys(SOFT_DOMAIN_KEYWORDS + [
    "software developer", "software engineer", "web developer",
    "frontend developer", "front-end developer", "backend developer",
    "back-end developer", "full stack developer", "data analyst",
    "data engineer", "machine learning engineer", "ai engineer",
    "cloud engineer", "devops engineer", "cybersecurity analyst",
    "mobile app developer", "ui designer", "ux designer",
]))

CERTIFICATION_KEYWORDS = [
    "nptel", "coursera", "udemy", "aws certified", "azure certified",
    "google certified", "oracle certified", "cisco", "ccna", "comptia",
    "pmp", "certified", "certification", "hackerrank certified",
    "microsoft certified", "ibm", "meta certified", "salesforce certified",
]
GENERIC_CERTIFICATION_KEYWORDS = {"certified", "certification"}

ALL_SKILLS = list(dict.fromkeys(
    PROGRAMMING_LANGUAGES + TOOLS_AND_FRAMEWORKS + SOFT_DOMAIN_KEYWORDS
))


# ─────────────────────────────────────────────────────────────
# Text extraction
# ─────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_stream):
    """
    Extracts raw text from a PDF file-like object.
    Tries pdfplumber first (better layout handling), falls back to
    PyMuPDF (fitz) if pdfplumber is unavailable or fails.

    `file_stream` can be a Flask `FileStorage` object or any
    file-like object supporting `.read()`.
    """
    raw_bytes = file_stream.read()
    text = ""

    if _HAS_PDFPLUMBER:
        try:
            with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception:
            text = ""

    if not text.strip() and _HAS_PYMUPDF:
        try:
            with fitz.open(stream=raw_bytes, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text() + "\n"
        except Exception:
            text = ""

    return text


def extract_text_from_docx(file_bytes):
    """Extract paragraph text from a DOCX archive using the standard library."""
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as document:
            xml_content = document.read("word/document.xml")
    except (KeyError, zipfile.BadZipFile, OSError) as error:
        raise ValueError("Could not read DOCX document.") from error

    root = ET.fromstring(xml_content)
    namespace = {"word": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = []
    for paragraph in root.findall(".//word:p", namespace):
        text = "".join(node.text or "" for node in paragraph.findall(".//word:t", namespace))
        if text.strip():
            paragraphs.append(text.strip())
    return "\n".join(paragraphs)


def clean_extracted_text(text):
    """Normalize extracted document text without removing technical punctuation."""
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")
    text = re.sub(r"[^\S\n]+", " ", text)
    lines = [line.strip(" \t-•|_") for line in text.split("\n")]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def extract_document_text(file_stream, filename=None):
    raw_bytes = file_stream.read()
    extension = (filename or getattr(file_stream, "filename", "")).lower().rsplit(".", 1)
    extension = f".{extension[-1]}" if len(extension) == 2 else ".pdf"
    if extension == ".docx":
        text = extract_text_from_docx(raw_bytes)
    elif extension == ".pdf":
        text = extract_text_from_pdf(io.BytesIO(raw_bytes))
    else:
        raise ValueError("Unsupported document format. Upload a PDF or DOCX file.")
    return clean_extracted_text(text)


# ─────────────────────────────────────────────────────────────
# Section detection helpers
# ─────────────────────────────────────────────────────────────

SECTION_HEADERS = {
    "skills": [r"skills", r"technical skills", r"core competencies"],
    "projects": [r"projects", r"academic projects", r"personal projects"],
    "certifications": [r"certifications", r"certificates", r"licenses"],
    "education": [r"education", r"academic background"],
    "experience": [r"experience", r"work experience", r"internships?"],
}


def _split_into_sections(text):
    """
    Splits resume text into a dict of {section_name: section_text}
    using common resume header keywords as delimiters. Falls back to
    treating the whole document as one section if no headers found.
    """
    lines = text.split("\n")
    lower_lines = [l.strip().lower() for l in lines]

    # Find line indices where a known header appears (short lines only,
    # to avoid matching the word "skills" inside a paragraph).
    header_indices = []  # (line_index, section_name)
    for i, line in enumerate(lower_lines):
        if not line or len(line) > 40:
            continue
        for section, patterns in SECTION_HEADERS.items():
            for pat in patterns:
                if re.fullmatch(pat + r"\s*:?", line) or re.match(r"^" + pat + r"\s*:?$", line):
                    header_indices.append((i, section))
                    break

    if not header_indices:
        return {"full_text": text}

    header_indices.sort(key=lambda x: x[0])
    sections = {}
    for idx, (line_no, name) in enumerate(header_indices):
        start = line_no + 1
        end = header_indices[idx + 1][0] if idx + 1 < len(header_indices) else len(lines)
        sections[name] = "\n".join(lines[start:end]).strip()

    sections["full_text"] = text
    return sections


# ─────────────────────────────────────────────────────────────
# Extraction functions
# ─────────────────────────────────────────────────────────────

def extract_skills(text):
    """
    Returns a sorted list of matched skills/programming languages/tools
    found anywhere in the resume text (case-insensitive, word-boundary
    aware so 'r' or 'c' don't match inside other words).
    """
    text_lower = text.lower()
    found = set()

    for skill in ALL_SKILLS:
        pattern = r"(?<![a-zA-Z0-9+#.])" + re.escape(skill) + r"(?![a-zA-Z0-9+#])"
        if re.search(pattern, text_lower):
            found.add(skill)

    return sorted(found)


def extract_programming_languages(text):
    text_lower = text.lower()
    found = set()
    for lang in PROGRAMMING_LANGUAGES:
        pattern = r"(?<![a-zA-Z0-9+#.])" + re.escape(lang) + r"(?![a-zA-Z0-9+#])"
        if re.search(pattern, text_lower):
            found.add(lang)
    return sorted(found)


def extract_tools(text):
    text_lower = text.lower()
    found = set()
    for tool in TOOLS_AND_FRAMEWORKS:
        pattern = r"(?<![a-zA-Z0-9+#.])" + re.escape(tool) + r"(?![a-zA-Z0-9+#])"
        if re.search(pattern, text_lower):
            found.add(tool)
    return sorted(found)


def extract_role_interest_keywords(text):
    text_lower = text.lower()
    found = set()
    for keyword in ROLE_INTEREST_KEYWORDS:
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(keyword) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found.add(keyword)
    return sorted(found)


def extract_certifications(text):
    """
    Looks for a 'Certifications' section first; if not found, scans the
    whole document for certification-related keywords and returns the
    lines they appear on (trimmed), plus generic keyword hits.
    """
    sections = _split_into_sections(text)
    results = set()

    cert_section = sections.get("certifications")
    if cert_section:
        for line in cert_section.split("\n"):
            line = line.strip(" -•\t")
            if line and len(line) < 150:
                results.add(line)
    else:
        text_lower = text.lower()
        for kw in CERTIFICATION_KEYWORDS:
            if kw not in GENERIC_CERTIFICATION_KEYWORDS and kw in text_lower:
                results.add(kw)

    return sorted(results)


def extract_projects(text):
    """
    Extracts project titles/lines from a 'Projects' section if present.
    Each bullet or short line is treated as a project entry. Also
    extracts keyword-level project tags (technology terms mentioned in
    project descriptions) to aid recommendation scoring.
    """
    sections = _split_into_sections(text)
    project_section = sections.get("projects", "")

    titles = []
    if project_section:
        for line in project_section.split("\n"):
            clean = line.strip(" -•\t")
            if not clean:
                continue
            # Treat capitalized short lines or bullet lines as titles
            if len(clean) < 120:
                titles.append(clean)

    # Keywords mentioned within the projects section (for scoring)
    project_keywords = extract_skills(project_section) if project_section else []

    return {
        "titles": titles[:15],
        "keywords": project_keywords,
    }


def extract_education(text):
    return _split_into_sections(text).get("education", "")


def parse_resume(file_stream, filename=None):
    """
    Full pipeline: PDF/DOCX -> cleaned text -> structured fields.
    Returns a dict matching the `resumes` Mongoose schema's
    parsed_skills / parsed_projects style fields.
    """
    try:
        text = extract_document_text(file_stream, filename)
    except ValueError as error:
        return empty_parse_result(str(error))

    if not text.strip():
        return empty_parse_result("Could not extract text from this resume. The document may be scanned or unreadable.")

    parsed_skills = extract_skills(text)
    projects = extract_projects(text)
    certifications = extract_certifications(text)
    return {
        "extracted_text": text,
        "parsed_skills": parsed_skills,
        "skill_list": parsed_skills,
        "programming_languages": extract_programming_languages(text),
        "tools": extract_tools(text),
        "role_interest_keywords": extract_role_interest_keywords(text),
        "parsed_projects": projects,
        "project_list": projects["titles"],
        "certifications": certifications,
        "certification_list": certifications,
        "education": extract_education(text),
        "keyword_score": len(parsed_skills),
        "missing_skill_flags": [],
    }


def empty_parse_result(error):
    return {
        "extracted_text": "",
        "parsed_skills": [],
        "skill_list": [],
        "programming_languages": [],
        "tools": [],
        "role_interest_keywords": [],
        "parsed_projects": {"titles": [], "keywords": []},
        "project_list": [],
        "certifications": [],
        "certification_list": [],
        "education": "",
        "keyword_score": 0,
        "missing_skill_flags": [],
        "error": error,
    }


def parse_job_description(file_stream, filename=None):
    """Extract structured job requirements from an uploaded PDF or DOCX."""
    text = extract_document_text(file_stream, filename)
    if not text:
        raise ValueError("Could not extract text from this job description. The document may be scanned or unreadable.")

    skills = extract_skills(text)
    projects = extract_projects(text)
    certifications = extract_certifications(text)
    return {
        "extracted_text": text,
        "required_skills": skills,
        "programming_languages": extract_programming_languages(text),
        "tools": extract_tools(text),
        "role_interest_keywords": extract_role_interest_keywords(text),
        "certifications": certifications,
        "keyword_score": len(skills),
        "missing_skill_flags": [],
    }
