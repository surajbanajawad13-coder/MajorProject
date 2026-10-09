import unittest

from recommender import _rank_label, recommend, score_opportunity


class RecommendationTests(unittest.TestCase):
    def test_matching_python_ml_profile_ranks_ai_event_highly(self):
        profile = {
            "skills": ["Python", "Machine Learning"],
            "interests": ["Artificial Intelligence"],
            "department": "CSE",
            "year": "3",
            "cgpa": 8.4,
        }
        event = {
            "_id": "event-1",
            "title": "AI Hackathon",
            "domain": "Artificial Intelligence",
            "required_skills": ["Python", "Machine Learning"],
            "eligibility_branch": ["CSE"],
            "eligibility_year": ["3", "4"],
            "min_cgpa": 7.5,
        }

        result = recommend(profile, [event])[0]
        self.assertEqual(result["score"], 11)
        self.assertEqual(result["match_percentage"], 79)
        self.assertEqual(result["max_possible_points"], 14)
        self.assertEqual(result["rank_label"], "highly recommended")

    def test_no_skill_matches_falls_back_to_general_training(self):
        profile = {
            "skills": ["communication"],
            "department": "CSE",
            "year": "3",
            "cgpa": 8.0,
        }
        events = [
            {
                "_id": "specialist-workshop",
                "title": "Advanced Python Workshop",
                "type": "Event",
                "required_skills": ["Python"],
                "eligibility_branch": ["CSE"],
            },
            {
                "_id": "general-training",
                "title": "Career Readiness",
                "type": "Training",
                "required_skills": [],
            },
        ]

        results = recommend(profile, events)

        self.assertEqual(
            [result["opportunity_id"] for result in results],
            ["general-training"],
        )

    def test_skill_match_keeps_relevant_event_recommendations(self):
        profile = {"skills": ["Python"]}
        events = [
            {"_id": "python-training", "type": "Training", "required_skills": ["Python"]},
            {"_id": "general-training", "type": "Training", "required_skills": []},
        ]

        results = recommend(profile, events)

        self.assertEqual(
            {result["opportunity_id"] for result in results},
            {"python-training", "general-training"},
        )
        self.assertEqual(results[0]["opportunity_id"], "python-training")

    def test_cgpa_below_threshold_does_not_receive_cgpa_points(self):
        result = score_opportunity(
            {"skills": [], "interests": [], "department": "CSE", "cgpa": 6.9},
            {"title": "Drive", "min_cgpa": 7.0, "eligibility_branch": ["CSE"]},
        )
        self.assertEqual(result["breakdown"]["cgpa_points"], 0)

    def test_matching_branch_and_skills_rank_placement_first(self):
        profile = {
            "skills": ["Python", "SQL"],
            "department": "CSE",
            "year": "3",
            "cgpa": 8.0,
        }
        placements = [
            {
                "_id": "matching-drive",
                "title": "Python placement",
                "required_skills": ["Python", "SQL"],
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["3"],
                "min_cgpa": 7.0,
            },
            {
                "_id": "nonmatching-drive",
                "title": "Java placement",
                "required_skills": ["Java"],
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["3"],
                "min_cgpa": 7.0,
            },
        ]

        results = recommend(profile, placements, opportunity_type="placement")

        self.assertEqual(results[0]["opportunity_id"], "matching-drive")
        self.assertGreater(results[0]["score"], results[1]["score"])

    def test_branch_and_year_mismatch_does_not_receive_eligibility_points(self):
        result = score_opportunity(
            {"department": "ISE", "year": "2"},
            {
                "title": "CSE third-year event",
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["3"],
            },
        )
        self.assertEqual(result["breakdown"]["eligibility_points"], 0)

    def test_branch_and_year_restrictions_must_both_match(self):
        result = score_opportunity(
            {"department": "CSE", "year": "2"},
            {
                "title": "CSE third-year event",
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["3"],
            },
        )
        self.assertEqual(result["breakdown"]["eligibility_points"], 0)

    def test_branch_alias_and_fourth_year_format_match(self):
        result = score_opportunity(
            {"department": "CSE", "year": "Fourth year"},
            {
                "title": "CSE fourth-year drive",
                "eligibility_branch": ["Computer Science and Engineering"],
                "eligibility_year": ["4"],
            },
        )
        self.assertEqual(result["breakdown"]["eligibility_points"], 3)

    def test_matching_and_nonmatching_job_descriptions_get_different_scores(self):
        profile = {
            "department": "CSE",
            "year": "3",
            "cgpa": 8.2,
        }
        resume = {
            "parsed_skills": ["python", "react"],
            "role_interest_keywords": ["web development"],
            "parsed_projects": {"titles": [], "keywords": ["python"]},
        }
        shared_eligibility = {
            "eligibility_branch": ["CSE"],
            "eligibility_year": ["3"],
            "min_cgpa": 7.5,
        }
        matching = score_opportunity(profile, {
            **shared_eligibility,
            "_id": "matching",
            "required_skills": ["Python", "React"],
            "domain_keywords": ["web development"],
            "description": "Build web development applications using Python and React.",
        }, resume)
        nonmatching = score_opportunity(profile, {
            **shared_eligibility,
            "_id": "nonmatching",
            "required_skills": ["Java", "C++"],
            "domain_keywords": ["embedded systems"],
            "description": "Develop embedded firmware in Java and C++.",
        }, resume)

        self.assertEqual(matching["score"], 13)
        self.assertEqual(matching["max_possible_points"], 14)
        self.assertEqual(matching["match_percentage"], 93)
        self.assertEqual(matching["breakdown"]["matched_skills"], ["python", "react"])
        self.assertEqual(matching["breakdown"]["missing_skills"], [])
        self.assertEqual(nonmatching["score"], 6)
        self.assertEqual(nonmatching["match_percentage"], 43)
        self.assertEqual(nonmatching["breakdown"]["missing_skills"], ["c++", "java"])
        self.assertGreater(matching["score"], nonmatching["score"])

    def test_each_category_is_binary_and_total_is_capped_at_14(self):
        result = score_opportunity(
            {
                "skills": ["Python", "React", "SQL"],
                "interests": ["AI", "Cloud", "Web Development"],
                "department": "CSE",
                "year": "3",
                "cgpa": 9.0,
                "certifications": ["AWS", "NPTEL Python"],
                "projects": [{"title": "AI Cloud Portal", "keywords": ["Python", "React"]}],
            },
            {
                "title": "AI Cloud Web role",
                "required_skills": ["Python", "React", "SQL"],
                "domain": "AI",
                "domain_keywords": ["Cloud", "Web Development"],
                "description": "AI Cloud Web role with Python, React and SQL",
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["3"],
                "required_certifications": ["AWS", "NPTEL Python"],
                "min_cgpa": 7.0,
            },
        )

        self.assertEqual(result["score"], 14)
        self.assertEqual(result["max_possible_points"], 14)
        self.assertEqual(result["match_percentage"], 100)
        self.assertEqual(result["breakdown"]["skill_points"], 3)
        self.assertEqual(result["breakdown"]["domain_points"], 2)
        self.assertEqual(result["breakdown"]["project_points"], 2)
        self.assertEqual(result["breakdown"]["eligibility_points"], 3)
        self.assertEqual(result["breakdown"]["certification_points"], 1)
        self.assertEqual(result["breakdown"]["cgpa_points"], 3)

    def test_example_scores_eleven_out_of_fourteen(self):
        result = score_opportunity(
            {
                "skills": ["Python"],
                "interests": ["Artificial Intelligence"],
                "department": "CSE",
                "year": "3",
                "cgpa": 8.4,
                "certifications": ["NPTEL Python"],
                "projects": [{"title": "Campus Portal", "keywords": ["HTML"]}],
            },
            {
                "title": "AI Hackathon",
                "required_skills": ["Python", "Machine Learning"],
                "domain": "Artificial Intelligence",
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["3", "4"],
                "required_certifications": ["AWS"],
                "min_cgpa": 7.5,
            },
        )

        self.assertEqual(result["score"], 11)
        self.assertEqual(result["max_possible_points"], 14)
        self.assertEqual(result["match_percentage"], 79)
        self.assertEqual(result["rank_label"], "highly recommended")
        self.assertEqual(
            [
                result["breakdown"]["skill_points"],
                result["breakdown"]["domain_points"],
                result["breakdown"]["project_points"],
                result["breakdown"]["eligibility_points"],
                result["breakdown"]["certification_points"],
                result["breakdown"]["cgpa_points"],
            ],
            [3, 2, 0, 3, 0, 3],
        )

    def test_company_event_and_training_use_the_same_fixed_rubric(self):
        profile = {
            "skills": ["Python", "SQL"],
            "interests": ["Data Science", "AI"],
            "projects": [{"title": "ML Dashboard", "keywords": ["Python", "ML"]}],
            "certifications": ["NPTEL Python", "AWS"],
            "department": "CSE",
            "year": "3",
            "cgpa": 8.5,
        }
        opportunity = {
            "_id": "shared-opportunity",
            "required_skills": ["Python", "SQL"],
            "domain": "Data Science",
            "domain_keywords": ["AI"],
            "description": "ML Dashboard using Python and SQL",
            "eligibility_branch": ["CSE"],
            "eligibility_year": ["3"],
            "required_certifications": ["AWS", "NPTEL Python"],
            "min_cgpa": 7.5,
        }
        scores = [
            recommend(profile, [{**opportunity, "type": "Event"}], opportunity_type="event")[0],
            recommend(profile, [{**opportunity, "type": "Training"}], opportunity_type="event")[0],
            recommend(profile, [opportunity], opportunity_type="placement")[0],
        ]

        self.assertEqual({result["score"] for result in scores}, {14})
        self.assertEqual({result["match_percentage"] for result in scores}, {100})
        self.assertEqual({result["max_possible_points"] for result in scores}, {14})

    def test_unrestricted_eligibility_and_absent_cgpa_requirement_are_not_awarded(self):
        result = score_opportunity(
            {"department": "CSE", "year": "3", "cgpa": 9},
            {"title": "Unrestricted opportunity"},
        )
        self.assertEqual(result["breakdown"]["eligibility_points"], 0)
        self.assertEqual(result["breakdown"]["cgpa_points"], 0)
        self.assertEqual(result["max_possible_points"], 14)
        self.assertEqual(result["match_percentage"], 0)

    def test_recommendation_rank_boundaries_match_specification(self):
        self.assertEqual(_rank_label(4), "low priority")
        self.assertEqual(_rank_label(5), "recommended")
        self.assertEqual(_rank_label(8), "recommended")
        self.assertEqual(_rank_label(9), "highly recommended")
        self.assertEqual(_rank_label(14), "highly recommended")

    def test_three_company_profile_only_scores_and_breakdowns(self):
        profile = {
            "skills": ["React", "Node.js", "Java", "SQL", "Python", "AI/ML", "MongoDB"],
            "interests": ["Web Development", "Hackathons", "Cloud Computing"],
            "department": "CSE",
            "year": "Fourth year",
            "cgpa": 8.5,
            "certifications": [],
            "projects": [],
        }
        resume = {
            "parsed_skills": ["C++"],
            "role_interest_keywords": ["unrelated resume interest"],
            "parsed_projects": {"titles": ["Cloud platform"], "keywords": ["cloud platform"]},
            "certifications": ["AWS Certified"],
        }
        companies = [
            {
                "_id": "infosys",
                "title": "INFOSYS",
                "required_skills": ["React.js"],
                "preferred_skills": ["Node.js"],
                "domain": "web dev",
                "eligibility_branch": ["Computer Science and Engineering"],
                "eligibility_year": ["4"],
                "min_cgpa": 7.5,
            },
            {
                "_id": "tcs",
                "title": "TCS",
                "required_skills": ["Python", "SQL"],
                "domain": "Embedded Systems",
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["Fourth year"],
                "min_cgpa": 8.0,
            },
            {
                "_id": "tech-mahindra",
                "title": "TECH MAHINDRA",
                "required_skills": ["C++"],
                "domain": "Cloud Computing",
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["4"],
                "required_certifications": ["AWS Certified"],
                "description": "Build a cloud platform.",
                "min_cgpa": 8.0,
            },
        ]

        results = {
            result["opportunity_id"]: result
            for result in recommend(
                profile,
                companies,
                resume=resume,
                opportunity_type="placement",
            )
        }
        expected = {
            "infosys": (11, [3, 2, 0, 3, 0, 3], "highly recommended"),
            "tcs": (9, [3, 0, 0, 3, 0, 3], "highly recommended"),
            "tech-mahindra": (8, [0, 2, 0, 3, 0, 3], "recommended"),
        }

        for company_id, (score, points, rank) in expected.items():
            with self.subTest(company=company_id):
                result = results[company_id]
                breakdown = result["breakdown"]
                self.assertEqual(result["score"], score)
                self.assertEqual(result["rank_label"], rank)
                self.assertEqual(
                    [
                        breakdown["skill_points"],
                        breakdown["domain_points"],
                        breakdown["project_points"],
                        breakdown["eligibility_points"],
                        breakdown["certification_points"],
                        breakdown["cgpa_points"],
                    ],
                    points,
                )
                self.assertEqual(sum(points), result["score"])
                self.assertEqual(result["max_possible_points"], 14)

    def test_tech_mahindra_cloud_devops_drive_is_two_of_fourteen_for_cse_student(self):
        result = score_opportunity(
            {
                "department": "CSE",
                "year": "Fourth year",
                "cgpa": 8.5,
                "skills": ["React", "Node.js", "Java", "SQL", "Python", "AI/ML", "MongoDB"],
                "interests": ["Web Development", "Hackathons", "Cloud Computing"],
                "certifications": [],
                "projects": [],
            },
            {
                "_id": "tech-mahindra",
                "title": "TECH MAHINDRA",
                "required_skills": ["AWS", "Docker", "Kubernetes", "Linux"],
                "domain": "Cloud Infrastructure, DevOps",
                "eligibility_branch": ["ECE", "EEE", "Mechanical"],
                "eligibility_year": ["3rd year", "4th year"],
                "required_certifications": ["AWS", "Azure"],
                "description": "Docker, Kubernetes, CI/CD, Cloud Deployment",
                "min_cgpa": 9.0,
            },
        )

        self.assertEqual(result["score"], 2)
        self.assertEqual(result["rank_label"], "low priority")
        self.assertEqual(result["max_possible_points"], 14)
        self.assertEqual(
            [
                result["breakdown"]["skill_points"],
                result["breakdown"]["domain_points"],
                result["breakdown"]["project_points"],
                result["breakdown"]["eligibility_points"],
                result["breakdown"]["certification_points"],
                result["breakdown"]["cgpa_points"],
            ],
            [0, 2, 0, 0, 0, 0],
        )

    def test_explicit_jd_eligibility_overrides_stale_company_fields(self):
        result = score_opportunity(
            {
                "department": "CSE",
                "year": "Fourth year",
                "cgpa": 8.5,
                "interests": ["Cloud Computing"],
            },
            {
                "eligibility_branch": ["CSE"],
                "eligibility_year": ["4"],
                "min_cgpa": 8.5,
                "domain": "Cloud Infrastructure, DevOps",
                "job_description_text": (
                    "Role: Cloud/DevOps Engineer\n"
                    "Minimum CGPA: 9.0\n"
                    "Eligible Branches: ECE, EEE, Mechanical\n"
                    "Eligible Years: 3rd and 4th year\n"
                ),
            },
        )

        self.assertEqual(result["score"], 2)
        self.assertEqual(result["breakdown"]["domain_points"], 2)
        self.assertEqual(result["breakdown"]["eligibility_points"], 0)
        self.assertEqual(result["breakdown"]["cgpa_points"], 0)


if __name__ == "__main__":
    unittest.main()
