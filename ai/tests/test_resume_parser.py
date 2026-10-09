import io
import unittest
import zipfile

from resume_parser import parse_job_description, parse_resume
from app import app, parse_job_description_api


def make_docx(text):
    paragraphs = "".join(
        f"<w:p><w:r><w:t>{line}</w:t></w:r></w:p>"
        for line in text.split("\n")
    )
    document = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{paragraphs}</w:body></w:document>"
    )
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr("word/document.xml", document)
    stream.seek(0)
    return stream


class ResumeParserTests(unittest.TestCase):
    def test_docx_extracts_skills_projects_education_and_output_shape(self):
        resume = make_docx(
            "Education\nCSE\nSkills\nPython, React\nProjects\nCampus app with Python for web development\nCertifications\nNPTEL Python"
        )
        result = parse_resume(resume, filename="resume.docx")

        self.assertIn("python", result["parsed_skills"])
        self.assertIn("react", result["parsed_skills"])
        self.assertIn("CSE", result["education"])
        self.assertTrue(result["parsed_projects"]["titles"])
        self.assertGreater(result["keyword_score"], 0)
        self.assertIn("missing_skill_flags", result)
        self.assertEqual(result["skill_list"], result["parsed_skills"])
        self.assertEqual(result["project_list"], result["parsed_projects"]["titles"])
        self.assertEqual(result["certification_list"], result["certifications"])
        self.assertIn("web development", result["role_interest_keywords"])

    def test_job_description_extraction_returns_matchable_requirements(self):
        job = make_docx(
            "Software Engineer\nSkills\nPython, React, MongoDB\n"
            "Role: Web Development\nCertification\nAWS Certified"
        )
        result = parse_job_description(job, filename="job.docx")
        self.assertIn("python", result["required_skills"])
        self.assertIn("react", result["required_skills"])
        self.assertIn("web development", result["role_interest_keywords"])
        self.assertIn("aws certified", result["certifications"])
        self.assertGreater(result["keyword_score"], 0)

    def test_job_description_endpoint_parses_uploaded_docx(self):
        job = make_docx("Web Developer\nSkills\nPython, React\nWeb Development")
        with app.test_request_context(
            "/job-description/parse",
            method="POST",
            data={"file": (job, "job.docx")},
        ):
            response = parse_job_description_api()

        self.assertEqual(response.status_code, 200)
        self.assertIn("python", response.get_json()["required_skills"])

    def test_rejects_unsupported_document_type(self):
        result = parse_resume(io.BytesIO(b"legacy word document"), filename="resume.doc")
        self.assertIn("Unsupported", result["error"])
        self.assertEqual(result["parsed_skills"], [])


if __name__ == "__main__":
    unittest.main()
