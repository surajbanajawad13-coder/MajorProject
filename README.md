# CampusConnect
### AI-Driven Campus Event & Placement Analytics Portal

Project by: **Vikas** (USN: 4CB23CS186)

A centralized portal integrating technical event management, placement
management, resume analysis, personalized AI recommendations, notifications,
and analytics dashboards for a college campus.

---

## Tech Stack

| Layer          | Technology |
|----------------|------------|
| Frontend       | React 19 (Vite), Tailwind, Framer Motion, Recharts |
| Backend        | Node.js + Express 5, MongoDB (Mongoose) |
| AI Microservice| Python (Flask, pdfplumber, PyMuPDF, scikit-learn) |
| Auth           | JWT, role-based (Student / Society Admin / Placement Officer / Admin) |

---

## Project Structure

```
CampusConnect/
├── ai/                     # Python Flask AI microservice
│   ├── app.py              # Flask entrypoint (resume parse + recommend routes)
│   ├── resume_parser.py    # PDF resume -> structured skills/projects/certs
│   ├── recommender.py      # Strict point-scoring recommendation engine
│   └── requirements.txt
├── server/                 # Node.js / Express backend
│   ├── models/             # Mongoose schemas
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── seedTpo.js          # Creates a default Placement Officer login
│   ├── seedAdmin.js        # Creates a default Administrator login
│   └── server.js
└── client/                 # React frontend (Vite)
    └── src/
        ├── student_Dashboard/   # Learner dashboard
        ├── Society_admin/       # Coordinator dashboard
        ├── TPO_admin/           # Placement Officer dashboard
        ├── Admin_dashboard/     # Administrator dashboard
        ├── context/AuthContext.jsx
        └── main.jsx             # Router
```

---

## What this build adds on top of the original repo

The uploaded project already had a working auth flow, Student/TPO
dashboards, and a basic AI service. This pass added the pieces needed to
satisfy the full spec:

- **AI microservice rewrite**
  - `resume_parser.py`: pdfplumber + PyMuPDF fallback, section-aware
    extraction of skills, programming languages, tools, certifications,
    and project titles/keywords (previously a 10-keyword hardcoded list).
  - `recommender.py`: replaced TF-IDF cosine similarity with the exact
    fixed 14-point scoring rubric. Each of the six categories is binary and
    awarded once per opportunity: skill **+3**, domain/interest **+2**,
    project keyword **+2**, matching branch OR year **+3**, certification
    **+1**, and meeting the CGPA condition **+3**. Ranks are 9–14 *highly
    recommended*, 5–8 *recommended*, and 0–4 *low priority*.
  - New combined `POST /recommend` endpoint returning ranked events +
    placements + a merged list.

- **New Mongoose models**: `notificationSchema.js`, `analyticsLogSchema.js`.
  Extended `studentSchema` (year, certifications, projects, `Society Admin`
  role), `eventSchema` and `companySchema` (domain/required_skills/
  eligibility/min_cgpa fields the recommender needs).

- **New backend routes/controllers**:
  - `GET /api/recommendations/:userId` — pulls a learner's profile + all
    events/placements from MongoDB, calls the Flask `/recommend` endpoint,
    logs an analytics event, returns ranked results.
  - `POST /api/student/resume/analyze` — proxies an uploaded resume to the
    Flask parser, stores a notification.
  - Full CRUD for `/api/events` (previously only placements had CRUD),
    plus registration and participation-analytics endpoints.
  - `/api/notifications` (list, mark-read, mark-all-read).
  - `/api/analytics` (event participation, placement funnel, platform
    overview, recent activity — powers both new dashboards' charts).
  - `/api/admin` (user list/search/filter, role change, delete, summary).

- **New frontend**:
  - **Coordinator Dashboard** (`Society_admin/SocietyDashboard.jsx`) — was
    a 10-line placeholder; now has event create/edit/delete, a registrant
    list, and Recharts bar/pie charts for participation and placement
    funnel data.
  - **Administrator Dashboard** (`Admin_dashboard/AdminDashboard.jsx`) —
    new: platform-wide stats, user management table (search, filter by
    role, change role, delete), department/role breakdown charts, and a
    recent-activity feed.
  - Wired both into the router (`main.jsx`), `ProtectedRoute`, and
    `PublicRoute`, and added the `Admin` option to the login role selector.

Everything above was verified: the Python scoring logic was unit-tested at
the rank-boundary values (5, 8, 9), the Flask service was booted and hit
end-to-end with a real sample resume PDF and a synthetic recommend payload,
and the full React app was built with `vite build` with zero errors.

---

## Update: placement match scores + in-app notifications

Two follow-up features, added without changing any existing behavior:

**1. In-app notification when a new drive matches your profile**

`postNewDrive` already emailed eligible students (CGPA + branch filter)
when a Placement Officer posted a drive — that was in the original repo.
It now *also* creates a `Notification` document for each eligible student,
so it shows up in-app (bell icon, top-right of the Student dashboard) even
if they don't check email. The email send was also made non-fatal, so a
misconfigured SMTP no longer blocks drive creation or the in-app
notifications.

- Backend: `server/controllers/placementController.js` (`postNewDrive`)
- Frontend: `client/src/student_Dashboard/StudentDashboard.jsx` — the bell
  icon in the topbar was previously decorative; it now fetches real
  notifications from `GET /api/notifications`, shows an unread-count dot,
  and opens a dropdown listing them with a "mark all read" action.

**2. AI match score shown on each placement card**

New endpoint: `GET /api/placements/match-scores` (Student-only). It runs
the *same* scoring engine used by `/api/recommendations/:userId`
(`ai/recommender.py`'s point rubric), scoped to placements only, and
returns `{ companyId: { score, rank_label, breakdown } }` for the logged-in
student, using the latest analyzed resume.

The Student dashboard's "New Opportunities" cards now show a small badge
— e.g. `11/14 pts · 79% · Highly Recommended` — next to each company,
computed from the same fixed scoring rubric used for events and training.

- Backend: `server/controllers/recommendationController.js`
  (`getMyPlacementMatchScores`, reuses the existing `buildProfilePayload`/
  `buildPlacementPayload` helpers — no duplicated scoring logic), wired in
  `server/routes/placementRoutes.js`.
- Frontend: `client/src/student_Dashboard/StudentDashboard.jsx` — fetches
  match scores alongside the existing drives fetch; a `MatchBadge`
  component renders the score/label and rubric-category breakdown on each
  card. If the AI service is briefly unavailable, the dashboard remains
  usable and reports that scores could not be calculated.

Both were verified against a live Flask instance: a synthetic profile and
two placements were sent through the same code path the controller uses,
confirming the returned `{companyId: {score, rank_label}}` map matches
what the frontend expects.

---

## Update: match score included in the placement email + notification

Previously, when a Placement Officer posted a drive, every eligible
student got the **same generic email/notification** ("you meet the
eligibility criteria"). This update scores each eligible student
individually against the new drive (same rubric as everywhere else) and
includes it in both channels, so the message is personal:

- Email now includes a line like: **"Your AI Match Score: 14 pts — highly
  recommended"** and is sent as an individual email per student (not one
  bulk `to:` list) so this line is accurate per recipient.
- In-app notification message is similarly personalized, e.g. *"winnman is
  hiring for software engineer ($8LPA). Your match score: 6 pts
  (recommended)."*

Implementation notes:
- `recommendationController.js` now exports its `buildProfilePayload` /
  `buildPlacementPayload` helpers and `AI_SERVICE_URL`, so
  `placementController.js` can reuse the exact same payload shape sent to
  the AI service — no duplicated scoring logic anywhere.
- Scoring is done with `Promise.allSettled`, so if the AI call fails for
  one student (AI service hiccup, timeout), the rest of the broadcast
  still goes out — that student just gets the eligibility-only message
  instead of a score-less error.
- Email sending was already best-effort/non-fatal from the previous
  update; that's preserved per-student here too.

Verified against a live Flask instance: a single-placement `/recommend`
call (the same shape `postNewDrive` sends per student) was confirmed to
return a correctly extractable `score` and `rank_label`.

---

## Running locally

**1. AI microservice**
```bash
cd ai
pip install -r requirements.txt
python app.py          # http://localhost:5000
```

**2. Backend**
```bash
cd server
npm install
# create a .env with:
#   mongo_uri=mongodb://localhost:27017/campusconnect
#   JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
#   PORT=8000
#   AI_SERVICE_URL=http://localhost:5000
#   TPO_INITIAL_PASSWORD=<choose-a-strong-password>
#   ADMIN_INITIAL_PASSWORD=<choose-a-strong-password>
npm start               # or: node server.js
node seedTpo.js         # optional: requires TPO_INITIAL_PASSWORD
node seedAdmin.js       # optional: requires ADMIN_INITIAL_PASSWORD
```

**3. Frontend**
```bash
cd client
npm install
npm run dev              # Vite dev server, default http://localhost:5173
```

In local Vite development, frontend API calls (including login, signup, and
Career Guidance) use `http://localhost:8000`. Set `VITE_API_URL` in the
frontend environment when using a different backend. Production builds require
an explicit `VITE_API_URL`; the frontend will not silently call an old hosted
API.

**4. Optional tests**
```bash
cd server
npm test

cd ../ai
python -m unittest discover -s tests -v
```

Seed scripts require a corresponding `*_INITIAL_PASSWORD` environment variable
and do not contain default account passwords. Run them only against the
intended database. Run `node seedAdmin.js` from the `server` directory so it
loads that directory's `.env` and uses the same MongoDB connection as the
backend. Existing Admin accounts are not reset by the seed script.

Society Admin (Coordinator) and Student accounts are created via the normal
`/signup` flow, selecting the appropriate role.

## Hosting deployment

The repository includes a Render Blueprint in `render.yaml` for the Node API
and private Python AI service, plus `client/vercel.json` for React Router
history fallback on Vercel. MongoDB is hosted separately on MongoDB Atlas.

### 1. Prepare MongoDB Atlas

Create a production database and database user in Atlas. Add the hosting
provider's outbound addresses to the Atlas network access list, and keep the
connection string private. Do not commit credentials or place them in
frontend environment variables.

### 2. Deploy the backend and AI service to Render

Connect the GitHub repository to Render and create a Blueprint deployment from
`render.yaml`. The Blueprint creates:

- `campusconnect-api` — Express API with `/api/test` health check.
- `campusconnect-ai` — private Flask/Gunicorn service, reachable only by the
  API over Render's private network.
- A persistent disk mounted at `/var/data` for uploaded resumes and JDs.

Set the `mongo_uri` value in the API service to the Atlas connection string.
Once the Vercel site exists, set `CORS_ORIGINS` to its exact origin, without a
trailing slash (for example `https://campusconnect.example.edu`). Add each
production custom domain explicitly, comma-separated. Configure email
variables only if email delivery is enabled. Render generates `JWT_SECRET`;
keep it private.

Seed scripts are not run automatically by deployment. If you intentionally run
one against production, first set its matching `*_INITIAL_PASSWORD` variable
to a unique, strong value in Render. Do not seed demo students, faculty, or
events into a live college database.

The API disk keeps uploaded files between deploys, but it is attached to one
API instance. This initial setup is not horizontally scalable. Before adding
multiple API instances, move uploads to shared object storage such as
Cloudinary or S3 and update the application to use it.

### 3. Deploy the frontend to Vercel

Import the same repository into Vercel and set the project root to `client`.
Use `npm run build` as the build command and `dist` as the output directory.
Set this build-time environment variable to the public Render API URL:

```text
VITE_API_URL=https://<your-campusconnect-api>.onrender.com
```

After deployment, copy the Vercel site's exact origin into Render's
`CORS_ORIGINS` and redeploy the API. Set Vercel environment variables before
building; the API URL is embedded in the generated frontend bundle.

### 4. Verify deployment

1. Open `https://<your-campusconnect-api>.onrender.com/api/test` and confirm
   the API health response.
2. Sign in through the Vercel URL and verify each role's permitted dashboard.
3. Upload a PDF/DOCX resume and a job description; confirm uploaded documents
   remain accessible after an API redeploy.
4. Test AI recommendations, event registration, placement eligibility, and
   notification flows against production data.
5. Seed only intended accounts, from the `server` directory, after setting
   the production database URI. Never seed test users/events into a live
   college database.

Use `server/.env.example` and `client/.env.example` as variable-name
references. The Render Blueprint provisions service settings, but secrets and
the Atlas connection string must be added through the hosting dashboards.

## Additional implementation details

- The student profile editor saves year, skills, interests, certifications,
  and project titles. Selecting a resume and saving the profile also uploads
  it for analysis.
- Resume analysis accepts PDF and DOCX and persists extracted education,
  skills, programming languages, tools/frameworks, role-interest keywords,
  projects, certifications, cleaned text, keyword counts, and opportunity-based
  missing-skill flags. The parse response includes both descriptive fields
  (`parsed_skills`, `parsed_projects`) and the requested aliases
  (`skill_list`, `project_list`, `certification_list`).
- Placement-drive PDF/DOCX files are parsed when posted. Extracted job skills,
  role-interest keywords, certification mentions, and cleaned JD text are saved
  separately on the company record and passed to the same recommendation
  scorer used by student recommendations. Matching skills/projects/interests
  can therefore distinguish a candidate from a matching JD versus an unrelated
  one. Scanned or unreadable documents return an explicit analysis error rather
  than silently creating an unscored drive. Older placement records are
  re-analyzed on the first recommendation request when their original JD is
  still present in the local uploads folder.
- Eligibility and CGPA points are awarded only when the opportunity defines
  the corresponding requirement and the student satisfies it; unrestricted
  or unspecified criteria do not award baseline points.
- Every student/opportunity score uses the same fixed 14-point rubric:
  skills +3, domain/interest +2, project keyword +2, matching branch or year
  +3, certification +1, and meeting the CGPA condition +3. Each category is
  binary (awarded once if any relevant match exists), so repeated matching
  skills, interests, projects, or certifications cannot inflate the score.
  Relevance is `score / 14 * 100`; ranks are 9–14 Highly Recommended, 5–8
  Recommended, and 0–4 Low Priority. Eligibility and application rules are
  still enforced separately before students can register or apply.
- Event/training and placement APIs include detail, update, and delete
  routes; eligibility is checked when students list opportunities, register,
  or apply.
- Student endpoints include `GET /api/recommendations/:userId`,
  `GET /api/career-guidance/:userId`, `GET /api/skill-gap/:userId`,
  `GET /api/profile/:id`, and in-app notifications. New event/drive and
  approaching application/registration deadlines can create in-app alerts.
- A student-only Career Guidance page shows resume section coverage, skill
  gaps based on current opportunities, and ranked event/placement
  recommendations. The administrator login option opens the existing
  user-management and analytics dashboard.
- The student dashboard's **AI & Analysis** section uses
  `GET /api/recommendations/analysis` to show parsed resume/profile signals,
  rubric explanations, missing requirements, opportunity relevance
  percentages, and whether the student can register for each event. Relevance
  is the achieved rubric score divided by the fixed 14-point maximum;
  registration eligibility is checked
  separately using the same profile/resume skill rules as the registration API.

---

## Notes / next steps

- `AI_SERVICE_URL` defaults to `http://localhost:5000` if unset.
- Use a MongoDB database containing the student, faculty, event/training,
  placement, resume, notification, and analytics collections. Existing seed
  scripts should be run only against the intended development database.
- CORS origins are configurable with `CORS_ORIGINS`; production startup
  requires explicit allowed origins.
