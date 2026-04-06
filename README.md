# PrereqCheq
### A course prerequisite tool for UMass Amherst engineering students

**Live site:** [kn5225.github.io/prereqcheq](https://kn5225.github.io/prereqcheq/)&nbsp;&nbsp;·&nbsp;&nbsp;**Demo:** [kn5225.github.io/prereqcheq/demo](https://kn5225.github.io/prereqpheq/demo)

---

## What it does

PrereqCheq lets UMass Amherst engineering students look up course prerequisites and plan their academic path without having to dig through the course catalog.

**Verification Mode** — Enter a course code and get an interactive checklist of its prerequisites. Check off what you've completed to see if you're eligible to enroll. Click any prerequisite to drill down into its own prerequisites, and navigate back through the chain with the Back button.

**Recommendation Mode** — Enter your completed courses and instantly see every course you're now eligible to take, including courses unlocked through prerequisite substitutions.

**Community Contributions** — Missing a course or spotted an error? Submit a correction directly from the site. All submissions go through an admin review queue before going live.

---

## Try the demo

A fully sandboxed demo admin environment is available for anyone who wants to explore the full admin workflow — adding courses, updating prerequisites, and reviewing community submissions — without touching real data.

| | |
|---|---|
| **Demo admin URL** | [kn5225.github.io/demo/demo-admin](https://kn5225.github.io/demo/demo-admin) |
| **Email** | `demo@demo.com` |
| **Password** | `demo123` |

Demo data resets hourly. Feel free to add, update, or delete anything.

---

## Technical highlights

- **No backend** — built entirely with vanilla JS and Supabase's client library. All business logic runs in the browser.
- **Row Level Security** — Supabase RLS policies enforce that anonymous users can only read, authenticated admins can write, and demo users are isolated to demo tables.
- **JSONB prerequisite storage** — prerequisites are stored as nested arrays representing AND/OR logic, parsed and evaluated entirely client-side.
- **Prerequisite substitution system** — handles edge cases like ECE 201 being fully replaceable by a combination of three other courses, evaluated transparently in both verification and recommendation modes.
- **Community review queue** — user submissions are staged separately and require admin approval before going live. Corrections to existing courses are flagged differently from new submissions.
- **Separate demo environment** — demo tables live in the same Supabase project as real data but are completely isolated via separate table names and RLS policies. A pg_cron job resets demo data hourly.

---

## Tech stack

| | |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (ES Modules) |
| Database | Supabase (PostgreSQL + JSONB) |
| Auth | Supabase Auth |
| Hosting | GitHub Pages |

---

## Project structure

```
prereqcheq/
├── index.html              
├── script.js               
├── styles.css              
├── config.js               — gitignored
├── config.example.js       
├── admin/
│   ├── index.html          
│   └── admin.js            
└── demo/
    ├── index.html          
    ├── demo-script.js      
    ├── demo-config.js      — gitignored
    └── demo-admin/
        ├── index.html      
        └── demo-admin.js   
```

---

## Local setup

```bash
git clone https://github.com/[your-username]/prereqcheq.git
cd prereqcheq
```

Create `config.js` from the template:
```js
export const SUPABASE_URL = "your-project-url"
export const SUPABASE_KEY = "your-publishable-key"
export const COURSES_TABLE = "prereqlookup"
export const SUBMISSIONS_TABLE = "user_submissions"
```

Open `index.html` in a browser or serve with any local server.

---

## Database schema

```sql
CREATE TABLE prereqlookup (
  id SERIAL PRIMARY KEY,
  COURSE TEXT UNIQUE,
  PREREQS JSONB
);

CREATE TABLE user_submissions (
  id SERIAL PRIMARY KEY,
  COURSE TEXT,
  PREREQS JSONB,
  is_correction BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE substitutions (
  original TEXT,
  replacements JSONB
);
```

Prerequisites are stored as nested arrays:
```json
[["MATH 132", "PHYSICS 151"], ["CS 187"]]
```
Inner arrays are OR groups. The outer array is AND. This represents `(MATH 132 OR PHYSICS 151) AND (CS 187)`.

---

## Disclaimer

Course data is sourced from Coursicle and the UMass Amherst course catalog. Always verify prerequisites with your academic advisor or the [official UMass course catalog](https://catalog.umass.edu) before registering.
