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
    +3   each matching skill              (profile.skills / resume skills)
    +2   each matching domain interest    (profile.interests vs event domain/category)
    +2   each matching project keyword    (resume parsed_projects.keywords)
    +3   branch/year eligibility match    (binary: eligible or not)
    +1   each matching certification
    +3   CGPA condition met               (binary: cgpa >= min_cgpa)

Ranking bands (applied to the TOTAL score):
    score > 8        -> "highly recommended"
    5 <= score <= 8   -> "recommended"
    score < 5         -> "low priority"

Project by: Vikas (USN: 4CB23CS186)
---------------------------------------------------------------------
"""


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

HIGHLY_RECOMMENDED_THRESHOLD = 8   # score > 8
RECOMMENDED_MIN_THRESHOLD = 5      # 5 <= score <= 8


def _normalize_list(values):
    """Lowercase + strip a list of strings, dropping empties/duplicates."""
    if not values:
        return set()
    return {str(v).strip().lower() for v in values if str(v).strip()}


def _rank_label(score):
    if score > HIGHLY_RECOMMENDED_THRESHOLD:
        return "highly recommended"
    if score >= RECOMMENDED_MIN_THRESHOLD:
        return "recommended"
    return "low priority"


def _score_eligibility(profile, opportunity):
    """
    +3 if the learner's branch AND year (when specified by the
    opportunity) are within the eligible sets. If the opportunity does
    not restrict branch/year, it's treated as eligible for everyone.
    """
    eligible_branches = _normalize_list(opportunity.get("eligibility_branch") or opportunity.get("eligible_branches"))
    eligible_years = _normalize_list(opportunity.get("eligibility_year"))

    student_branch = (profile.get("department") or "").strip().lower()
    student_year = str(profile.get("year") or "").strip().lower()

    branch_ok = (not eligible_branches) or (student_branch in eligible_branches)
    year_ok = (not eligible_years) or (student_year in eligible_years)

    return POINTS_ELIGIBILITY_MATCH if (branch_ok and year_ok) else 0


def _score_cgpa(profile, opportunity):
    """+3 if learner's CGPA meets the opportunity's min_cgpa (if any)."""
    min_cgpa = opportunity.get("min_cgpa")
    if min_cgpa in (None, "", 0):
        return POINTS_CGPA_MATCH  # no CGPA requirement -> condition trivially satisfied
    try:
        return POINTS_CGPA_MATCH if float(profile.get("cgpa", 0)) >= float(min_cgpa) else 0
    except (TypeError, ValueError):
        return 0


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
        resume.get("parsed_skills", [])
    )
    profile_interests = _normalize_list(profile.get("interests", []))
    profile_certifications = _normalize_list(profile.get("certifications", [])) | _normalize_list(
        resume.get("certifications", [])
    )

    # project keywords: combine profile.projects (list of strings/objs) and
    # resume.parsed_projects.keywords
    profile_projects_raw = profile.get("projects", [])
    profile_project_keywords = set()
    for p in profile_projects_raw:
        if isinstance(p, dict):
            profile_project_keywords |= _normalize_list(p.get("keywords", []))
            profile_project_keywords |= _normalize_list([p.get("title", "")])
        else:
            profile_project_keywords |= _normalize_list([p])
    resume_projects = resume.get("parsed_projects", {})
    if isinstance(resume_projects, dict):
        profile_project_keywords |= _normalize_list(resume_projects.get("keywords", []))

    required_skills = _normalize_list(opportunity.get("required_skills", []))
    opportunity_domain = _normalize_list(
        [opportunity.get("domain", ""), opportunity.get("category", "")]
    )
    # Free-text fields (description/title) are scanned for project-keyword
    # overlap too, since a project keyword may relate to an opportunity's
    # description rather than its formal skill list.
    opportunity_text = " ".join([
        str(opportunity.get("title", "")),
        str(opportunity.get("description", "")),
    ]).lower()

    # ---- Skill match: 3 points per matching skill ----
    matched_skills = profile_skills & required_skills
    skill_points = len(matched_skills) * POINTS_SKILL_MATCH

    # ---- Domain interest match: 2 points per matching interest ----
    matched_interests = profile_interests & opportunity_domain
    domain_points = len(matched_interests) * POINTS_DOMAIN_INTEREST_MATCH

    # ---- Project keyword match: 2 points per matching keyword ----
    matched_project_keywords = {
        kw for kw in profile_project_keywords
        if kw and (kw in opportunity_domain or kw in required_skills or kw in opportunity_text)
    }
    project_points = len(matched_project_keywords) * POINTS_PROJECT_KEYWORD_MATCH

    # ---- Eligibility (branch/year): binary 3 points ----
    eligibility_points = _score_eligibility(profile, opportunity)

    # ---- Certification match: 1 point per matching certification ----
    opportunity_cert_mentions = opportunity_text
    matched_certs = {
        c for c in profile_certifications
        if c and c in opportunity_cert_mentions
    }
    certification_points = len(matched_certs) * POINTS_CERTIFICATION_MATCH

    # ---- CGPA condition: binary 3 points ----
    cgpa_points = _score_cgpa(profile, opportunity)

    total = (
        skill_points
        + domain_points
        + project_points
        + eligibility_points
        + certification_points
        + cgpa_points
    )

    return {
        "opportunity_id": opportunity.get("_id") or opportunity.get("id"),
        "title": opportunity.get("title") or opportunity.get("company_name") or opportunity.get("name"),
        "score": total,
        "rank_label": _rank_label(total),
        "breakdown": {
            "skill_points": skill_points,
            "matched_skills": sorted(matched_skills),
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


def recommend(profile, opportunities, resume=None, opportunity_type="event"):
    """
    Scores a list of opportunities (events or placements) against a
    single learner profile and returns them sorted by score descending.

    `opportunity_type` is attached to each result so the frontend can
    tell events and placements apart when both are combined.
    """
    results = []
    for opp in opportunities or []:
        result = score_opportunity(profile, opp, resume=resume)
        result["opportunity_type"] = opportunity_type
        results.append(result)

    results.sort(key=lambda r: r["score"], reverse=True)
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
        })

    return recommend(profile, normalized_events, opportunity_type="event")
