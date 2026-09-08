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
    strict point-scoring rubric:
    - Matching skill: **+3**
    - Matching domain interest: **+2**
    - Matching project keyword: **+2**
    - Branch/year eligibility match: **+3**
    - Matching certification: **+1**
    - CGPA condition met: **+3**
    - `score > 8` → *highly recommended*, `5–8` → *recommended*, `< 5` → *low priority*
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
returns `{ companyId: { score, rank_label } }` for the logged-in student.

The Student dashboard's "New Opportunities" cards now show a small badge
— e.g. `14 pts · Highly Recommended` — next to each company, computed from
the same skill/domain/eligibility/cgpa criteria the company posted, before
the student decides whether to apply.

- Backend: `server/controllers/recommendationController.js`
  (`getMyPlacementMatchScores`, reuses the existing `buildProfilePayload`/
  `buildPlacementPayload` helpers — no duplicated scoring logic), wired in
  `server/routes/placementRoutes.js`.
- Frontend: `client/src/student_Dashboard/StudentDashboard.jsx` — fetches
  match scores alongside the existing drives fetch; a `MatchBadge`
  component renders the score/label on each card. If the AI service is
  briefly unavailable, cards simply render without the badge rather than
  breaking the page.

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
#   JWT_SECRET=your_secret
#   PORT=8000
#   AI_SERVICE_URL=http://localhost:5000
npm start               # or: node server.js
node seedTpo.js         # optional: creates a default Placement Officer login
node seedAdmin.js       # optional: creates a default Administrator login
```

**3. Frontend**
```bash
cd client
npm install
npm run dev              # Vite dev server, default http://localhost:5173
```

Default seeded logins (after running the seed scripts):
- Placement Officer — USN `TPO001` / password `tpo12345`
- Administrator — USN `ADMIN001` / password `admin12345`

Society Admin (Coordinator) and Student accounts are created via the normal
`/signup` flow, selecting the appropriate role.

---

## Notes / next steps

- `AI_SERVICE_URL` defaults to `http://localhost:5000` if unset.
- The recommendation route currently sends `resume: null` to the AI
  service — wire up a persisted "latest resume" reference per student
  (the `resumes` collection) to also factor resume-derived skills into
  live recommendations, not just skills typed into the profile form.
- CORS is currently wide open (`cors("*")`) for local development; lock
  this down before any real deployment.
