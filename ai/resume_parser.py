"""
CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
---------------------------------------------------------------------
Module: resume_parser.py
Purpose: Extracts structured data (skills, programming languages, tools,
         projects, certifications) from an uploaded resume (PDF).

Project by: Vikas (USN: 4CB23CS186)
---------------------------------------------------------------------
"""

import re
import io

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

CERTIFICATION_KEYWORDS = [
    "nptel", "coursera", "udemy", "aws certified", "azure certified",
    "google certified", "oracle certified", "cisco", "ccna", "comptia",
    "pmp", "certified", "certification", "hackerrank certified",
    "microsoft certified", "ibm", "meta certified", "salesforce certified",
]

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

    # Fallback / supplement: keyword scan across full text
    text_lower = text.lower()
    for kw in CERTIFICATION_KEYWORDS:
        if kw in text_lower:
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


def parse_resume(file_stream):
    """
    Full pipeline: PDF -> text -> structured fields.
    Returns a dict matching the `resumes` Mongoose schema's
    parsed_skills / parsed_projects style fields.
    """
    text = extract_text_from_pdf(file_stream)

    if not text.strip():
        return {
            "extracted_text": "",
            "parsed_skills": [],
            "programming_languages": [],
            "tools": [],
            "parsed_projects": {"titles": [], "keywords": []},
            "certifications": [],
            "error": "Could not extract text from PDF. The file may be a scanned image.",
        }

    return {
        "extracted_text": text,
        "parsed_skills": extract_skills(text),
        "programming_languages": extract_programming_languages(text),
        "tools": extract_tools(text),
        "parsed_projects": extract_projects(text),
        "certifications": extract_certifications(text),
    }
