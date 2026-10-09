"""
CampusConnect - AI-Driven Campus Event & Placement Analytics Portal
---------------------------------------------------------------------
Module: recommender.py
Purpose: Content-based recommendation engine that scores a learner's
         profile against technical events and placement drives using
         a fixed, explainable point-based rubric (NOT a black-box
         similarity score), so results can be justified to students
         and coordinators.

Scoring rubric (per opportunity):
    +3   at least one matching skill
    +2   at least one matching domain interest
    +2   at least one matching project keyword
    +3   matching branch/year eligibility (binary: eligible or not)
    +1   at least one matching certification
    +3   CGPA condition met               (binary: cgpa >= min_cgpa)
    Maximum score: 14 points.
    Placement recommendations use profile data only; event recommendations
    may explicitly supplement the profile with parsed resume data.

Ranking bands (applied to the TOTAL score):
    9 <= score <= 14 -> "highly recommended"
    5 <= score <= 8   -> "recommended"
    0 <= score <= 4   -> "low priority"

Project by: Vikas (USN: 4CB23CS186)
---------------------------------------------------------------------
"""

import re


# ─────────────────────────────────────────────────────────────
# Scoring weights (kept as named constants so the rubric is easy
# to audit / tune without hunting through the logic below).
# ─────────────────────────────────────────────────────────────

POINTS_SKILL_MATCH = 3
POINTS_DOMAIN_INTEREST_MATCH = 2
POINTS_PROJECT_KEYWORD_MATCH = 2
POINTS_ELIGIBILITY_MATCH = 3
POINTS_CERTIFICATION_MATCH = 1
POINTS_CGPA_MATCH = 3

MAX_POSSIBLE_POINTS = 14
HIGHLY_RECOMMENDED_THRESHOLD = 9
RECOMMENDED_MIN_THRESHOLD = 5      # 5 <= score <= 8


def _normalize_list(values):
    """Canonicalize exact aliases, casing, punctuation, and whitespace."""
    if not values:
        return set()
    if isinstance(values, (str, int, float)):
        values = [values]
    return {_normalize_term(v) for v in values if _normalize_term(v)}


def _normalize_term(value):
    value = re.sub(r"[^a-z0-9+#]+", " ", str(value).strip().lower())
    value = re.sub(r"\s+", " ", value).strip()
    aliases = {
        "react js": "react",
        "node js": "node",
        "web development": "web dev",
        "web dev": "web dev",
        "computer science and engineering": "cse",
        "computer science engineering": "cse",
        "cse": "cse",
        "cloud computing": "cloud devops",
        "cloud infrastructure": "cloud devops",
        "devops": "cloud devops",
        "cloud devops": "cloud devops",
        "devops engineer": "cloud devops",
        "cloud devops engineer": "cloud devops",
    }
    return aliases.get(value, value)


def _normalize_domain_list(values):
    if isinstance(values, (str, int, float)):
        values = [values]
    domains = set()
    for value in values or []:
        domains.update(
            _normalize_term(part)
            for part in re.split(r"[,;/|]+", str(value))
            if _normalize_term(part)
        )
    return domains


def _normalize_year(value):
    year = _normalize_term(value)
    year_aliases = {
        "first year": "1",
        "1st year": "1",
        "second year": "2",
        "2nd year": "2",
        "third year": "3",
        "3rd year": "3",
        "3rd": "3",
        "fourth year": "4",
        "4th year": "4",
        "4th": "4",
        "first": "1",
        "second": "2",
        "third": "3",
        "fourth": "4",
    }
    return year_aliases.get(year, year)


def _rank_label(score):
    if score >= HIGHLY_RECOMMENDED_THRESHOLD:
        return "highly recommended"
    if score >= RECOMMENDED_MIN_THRESHOLD:
        return "recommended"
    return "low priority"


def _score_eligibility(profile, opportunity):
    """
    +3 if the learner satisfies every explicitly listed branch/year restriction.
    If only one dimension is specified, that dimension decides the match.
    No points are awarded when neither dimension is restricted.
    """
    eligible_branches = _normalize_list(opportunity.get("eligibility_branch") or opportunity.get("eligible_branches"))
    eligible_years = {
        _normalize_year(year) for year in _normalize_list(opportunity.get("eligibility_year"))
    }
    eligible_branches.discard("all")
    eligible_years.discard("all")
    eligible_years.discard("")

    if not eligible_branches and not eligible_years:
        return 0

    student_branch = _normalize_term(profile.get("department") or "")
    student_year = _normalize_year(profile.get("year") or "")

    branch_match = not eligible_branches or student_branch in eligible_branches
    year_match = not eligible_years or student_year in eligible_years

    return POINTS_ELIGIBILITY_MATCH if branch_match and year_match else 0


def _score_cgpa(profile, opportunity):
    """+3 if learner's CGPA meets the opportunity's min_cgpa (if any)."""
    min_cgpa = opportunity.get("min_cgpa")
    if min_cgpa in (None, "", 0):
        return 0
    try:
        return POINTS_CGPA_MATCH if float(profile.get("cgpa", 0)) >= float(min_cgpa) else 0
    except (TypeError, ValueError):
        return 0


def _jd_eligibility_overrides(opportunity):
    """Read explicit eligibility requirements from the extracted company JD."""
    text = str(opportunity.get("job_description_text") or "")
    overrides = {}

    cgpa_match = re.search(
        r"(?:minimum|min\.?|cut[\s-]?off|threshold)\s*(?:required\s*)?(?:cgpa|gpa)\s*[:\-]?\s*(\d+(?:\.\d+)?)"
        r"|(?:cgpa|gpa)\s*(?:>=|above|of|:)?\s*(\d+(?:\.\d+)?)",
        text,
        re.IGNORECASE,
    )
    if cgpa_match:
        value = next(group for group in cgpa_match.groups() if group is not None)
        overrides["min_cgpa"] = float(value)

    branch_match = re.search(
        r"(?:eligible\s+branches|eligible\s+departments|branches\s+eligible|eligible\s+streams)"
        r"\s*[:\-]\s*([^\r\n]+)",
        text,
        re.IGNORECASE,
    )
    if branch_match:
        branch_values = re.split(r"\s*(?:,|/|;|\band\b)\s*", branch_match.group(1), flags=re.IGNORECASE)
        branches = _normalize_list(branch_values)
        if branches:
            overrides["eligibility_branch"] = sorted(branches)

    year_match = re.search(
        r"(?:eligible\s+years?|year\s+eligibility)\s*[:\-]\s*([^\r\n]+)",
        text,
        re.IGNORECASE,
    )
    if year_match:
        year_values = re.findall(
            r"\b(?:1st|2nd|3rd|4th|first|second|third|fourth|[1-4])(?:\s*[- ]?year)?\b",
            year_match.group(1),
            re.IGNORECASE,
        )
        years = {_normalize_year(year) for year in year_values}
        if years:
            overrides["eligibility_year"] = sorted(years)

    return overrides


def score_opportunity(profile, opportunity, resume=None):
    """
    Computes the explainable point score for one learner-opportunity
    pair and returns a breakdown dict (useful for showing "why this was
    recommended" in the UI).

    `profile`     : dict from the `profiles` collection (skills, interests,
                    department, year, cgpa, certifications, projects)
    `opportunity` : dict representing an event or placement, expected to
                    optionally contain: required_skills, domain/category,
                    eligibility_branch, eligibility_year, min_cgpa
    `resume`      : optional dict from the `resumes` collection
                    (parsed_skills, parsed_projects, certifications) -
                    used to supplement the profile with resume-derived data.
    """
    resume = resume or {}

    profile_skills = _normalize_list(profile.get("skills", [])) | _normalize_list(
        resume.get("parsed_skills", resume.get("skill_list", []))
    )
    profile_interests = _normalize_list(profile.get("interests", [])) | _normalize_list(
        resume.get("role_interest_keywords", [])
    )
    profile_certifications = _normalize_list(profile.get("certifications", [])) | _normalize_list(
        resume.get("certifications", [])
    )

    # project keywords: combine profile.projects (list of strings/objs) and
    # resume.parsed_projects.keywords
    profile_projects_raw = profile.get("projects", []) or []
    if isinstance(profile_projects_raw, (str, dict)):
        profile_projects_raw = [profile_projects_raw]
    profile_project_keywords = set()
    for p in profile_projects_raw:
        if isinstance(p, dict):
            profile_project_keywords |= _normalize_list(p.get("keywords", []))
            profile_project_keywords |= _normalize_list([
                p.get("title", ""),
                p.get("description", ""),
            ])
        else:
            profile_project_keywords |= _normalize_list([p])
    resume_projects = resume.get("parsed_projects", {})
    if isinstance(resume_projects, dict):
        profile_project_keywords |= _normalize_list(resume_projects.get("keywords", []))

    required_skills = (
        _normalize_list(opportunity.get("required_skills", []))
        | _normalize_list(opportunity.get("preferred_skills", []))
    )
    required_certifications = _normalize_list(opportunity.get("required_certifications", []))
    opportunity_domain = _normalize_domain_list(
        [opportunity.get("domain", ""), opportunity.get("category", "")]
    ) | _normalize_domain_list(opportunity.get("domain_keywords", []))
    # JD and role-description text can match project keywords beyond the
    # formal required-skills list.
    opportunity_text = str(opportunity.get("description", "")).lower()
    opportunity_cert_mentions = _normalize_list(required_certifications)

    # Each rubric category is a single yes/no condition, regardless of
    # how many individual keywords match within that category.
    matched_skills = profile_skills & required_skills
    skill_points = POINTS_SKILL_MATCH if matched_skills else 0

    # ---- Domain interest match: 2 points when any interest matches ----
    matched_interests = profile_interests & opportunity_domain
    domain_points = POINTS_DOMAIN_INTEREST_MATCH if matched_interests else 0

    # ---- Project keyword match: 2 points when any keyword matches ----
    matched_project_keywords = {
        kw for kw in profile_project_keywords
        if kw and (
            kw in opportunity_domain
            or kw in required_skills
            or re.search(r"(?<![a-z0-9])" + re.escape(kw) + r"(?![a-z0-9])", opportunity_text)
        )
    }
    project_points = POINTS_PROJECT_KEYWORD_MATCH if matched_project_keywords else 0

    # Explicit values in the extracted JD take precedence over stale
    # structured fields; the structured values remain the fallback.
    scoring_opportunity = {**opportunity, **_jd_eligibility_overrides(opportunity)}

    # ---- Eligibility (branch/year): binary 3 points ----
    eligibility_points = _score_eligibility(profile, scoring_opportunity)

    # Certification points require an explicit JD certification requirement.
    matched_certs = profile_certifications & opportunity_cert_mentions
    certification_points = POINTS_CERTIFICATION_MATCH if matched_certs else 0
    missing_skills = sorted(required_skills - profile_skills)

    # ---- CGPA condition: binary 3 points ----
    cgpa_points = _score_cgpa(profile, scoring_opportunity)

    total = (
        skill_points
        + domain_points
        + project_points
        + eligibility_points
        + certification_points
        + cgpa_points
    )

    match_percentage = round(total * 100 / MAX_POSSIBLE_POINTS)

    return {
        "opportunity_id": opportunity.get("_id") or opportunity.get("id"),
        "title": opportunity.get("title") or opportunity.get("company_name") or opportunity.get("name"),
        "score": total,
        "rank_label": _rank_label(total),
        "match_percentage": match_percentage,
        "max_possible_points": MAX_POSSIBLE_POINTS,
        "breakdown": {
            "skill_points": skill_points,
            "matched_skills": sorted(matched_skills),
            "missing_skills": missing_skills,
            "domain_points": domain_points,
            "matched_interests": sorted(matched_interests),
            "project_points": project_points,
            "matched_project_keywords": sorted(matched_project_keywords),
            "eligibility_points": eligibility_points,
            "certification_points": certification_points,
            "matched_certifications": sorted(matched_certs),
            "cgpa_points": cgpa_points,
        },
    }


def _is_general_training(opportunity):
    return (
        str(opportunity.get("type", "")).strip().lower() == "training"
        and not _normalize_list(opportunity.get("required_skills", []))
    )


def recommend(profile, opportunities, resume=None, opportunity_type="event"):
    """
    Scores a list of opportunities (events or placements) against a
    single learner profile and returns them sorted by score descending.

    `opportunity_type` is attached to each result so the frontend can
    tell events and placements apart when both are combined. Resume data
    supplements event scoring only; placement scoring is profile-only.
    """
    opportunities = opportunities or []
    scored_opportunities = []
    for opp in opportunities:
        result = score_opportunity(
            profile,
            opp,
            resume=resume if opportunity_type != "placement" else None,
        )
        result["opportunity_type"] = opportunity_type
        scored_opportunities.append((result, opp))

    scored_opportunities.sort(key=lambda item: item[0]["score"], reverse=True)
    results = [result for result, _ in scored_opportunities]
    if opportunity_type == "event" and results:
        has_any_skill_match = any(
            result["breakdown"]["matched_skills"] for result in results
        )
        general_training = [
            result for result, opportunity in scored_opportunities
            if _is_general_training(opportunity)
        ]
        if not has_any_skill_match and general_training:
            return general_training
    return results


# ─────────────────────────────────────────────────────────────
# Backwards-compatible wrappers matching the original function names
# used elsewhere in this codebase (app.py), so existing routes keep
# working while using the new strict scoring rubric under the hood.
# ─────────────────────────────────────────────────────────────

def recommend_jobs(student, companies):
    """
    `student` here follows the existing Student schema shape
    (skills, interests, cgpa, department). `companies` is a list of
    placement/company dicts. Returns the strict-scoring result list.
    """
    profile = {
        "skills": student.get("skills", []),
        "interests": student.get("interests", []),
        "department": student.get("department", ""),
        "year": student.get("year", ""),
        "cgpa": student.get("cgpa", 0),
        "certifications": student.get("certifications", []),
        "projects": student.get("projects", []),
    }

    normalized_companies = []
    for c in companies:
        normalized_companies.append({
            "_id": c.get("_id") or c.get("id"),
            "title": c.get("name") or c.get("company_name"),
            "company_name": c.get("name") or c.get("company_name"),
            "description": c.get("description", ""),
            "required_skills": c.get("required_skills") or c.get("skills", []),
            "domain": c.get("domain", ""),
            "category": c.get("category", ""),
            "eligibility_branch": c.get("eligibility_branch") or c.get("branches") or c.get(
                "eligibilityCriteria", {}
            ).get("branches", []) if isinstance(c.get("eligibilityCriteria"), dict) else c.get("eligibility_branch"),
            "eligibility_year": c.get("eligibility_year", []),
            "min_cgpa": c.get("min_cgpa") or c.get("cutoff") or (
                c.get("eligibilityCriteria", {}).get("cgpa") if isinstance(c.get("eligibilityCriteria"), dict) else None
            ),
        })

    return recommend(profile, normalized_companies, opportunity_type="placement")


def recommend_events(student, events):
    profile = {
        "skills": student.get("skills", []),
        "interests": student.get("interests", []),
        "department": student.get("department", ""),
        "year": student.get("year", ""),
        "cgpa": student.get("cgpa", 0),
        "certifications": student.get("certifications", []),
        "projects": student.get("projects", []),
    }

    normalized_events = []
    for e in events:
        normalized_events.append({
            "_id": e.get("_id") or e.get("id"),
            "title": e.get("name") or e.get("title"),
            "description": e.get("description", ""),
            "required_skills": e.get("required_skills") or e.get("tags", []),
            "domain": e.get("domain", ""),
            "category": e.get("category", ""),
            "eligibility_branch": e.get("eligibility_branch", []),
            "eligibility_year": e.get("eligibility_year", []),
            "min_cgpa": e.get("min_cgpa"),
            "type": e.get("type", ""),
        })

    return recommend(profile, normalized_events, opportunity_type="event")
