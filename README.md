# PrereqCheq
### A course prerequisite tool for UMass Amherst engineering students

**Live site:** [kn5225.github.io/prereqcheq](https://kn5225.github.io/prereqcheq/)  
**Demo:** [kn5225.github.io/prereqcheq/demo](https://kn5225.github.io/prereqcheq/demo)

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
| **Demo admin URL** | [kn5225.github.io/prereqcheq/demo/demo-admin](https://kn5225.github.io/prereqcheq/demo/demo-admin) |
| **Email** | `demo@demo.com` |
| **Password** | `demo123` |

Demo data resets hourly. Feel free to add, update, or delete anything.

---

## Technical highlights

- **No backend** — built entirely with vanilla JS and Supabase's client library. All business logic runs in the browser.
- **Row Level Security** — Supabase RLS policies enforce that anonymous users can only read, authenticated admins can write, and demo users are isolated to demo tables. The Supabase publishable key is intentionally public — security is enforced at the database level, not by hiding credentials.
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
├── config.js               
├── admin/
│   ├── index.html          
│   └── admin.js            
└── demo/
    ├── index.html          
    ├── demo-script.js      
    ├── demo-config.js      
    └── demo-admin/
        ├── index.html      
        └── demo-admin.js   
```

---

## Local setup

```bash
git clone https://github.com/kn5225/prereqcheq.git
cd prereqcheq
```

### 1. Create your Supabase tables

Create a free project at [supabase.com](https://supabase.com) and run the following SQL:

```sql
-- Main tables
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

-- Demo tables (same structure, separate data)
CREATE TABLE demo_prereqlookup (LIKE prereqlookup INCLUDING ALL);
CREATE TABLE demo_user_submissions (LIKE user_submissions INCLUDING ALL);
```

Then enable RLS and add policies:

```sql
-- Main tables — public read, authenticated write
ALTER TABLE prereqlookup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON prereqlookup FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON prereqlookup FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update" ON prereqlookup FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete" ON prereqlookup FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON user_submissions FOR SELECT USING (true);
CREATE POLICY "Public insert" ON user_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth delete" ON user_submissions FOR DELETE USING (auth.role() = 'authenticated');

-- Demo tables — fully public
ALTER TABLE demo_prereqlookup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon all" ON demo_prereqlookup FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE demo_user_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon all" ON demo_user_submissions FOR ALL USING (true) WITH CHECK (true);
```

**Optional — Auto-reset demo data hourly**

If you want the demo tables to reset automatically, enable the `pg_cron` extension in Supabase → **Database → Extensions**, then run:

```sql
SELECT cron.schedule(
  'reset-demo-data',
  '0 * * * *',
  $$
  DELETE FROM demo_prereqlookup;
  DELETE FROM demo_user_submissions;

  INSERT INTO demo_prereqlookup (COURSE, PREREQS) VALUES
    ('DEMO 101', '[]'),
    ('DEMO 202', '[["DEMO 101"]]'),
    ('DEMO 303', '[["DEMO 202"], ["DEMO 101"]]'),
    ('DEMO 404', '[["DEMO 202"], ["DEMO 303"]]');

  INSERT INTO demo_user_submissions (COURSE, PREREQS, verified) VALUES
    ('DEMO 501', '[["DEMO 404"]]', false),
    ('DEMO 502', '[["DEMO 101"]]', false);
  $$
);
```

Replace the INSERT values with whatever demo courses you want to seed.

### 2. Update config files

Edit `config.js` to point to your Supabase project:
```js
export const SUPABASE_URL = "https://your-project.supabase.co"
export const SUPABASE_KEY = "your-publishable-key"
export const COURSES_TABLE = "prereqlookup"
export const SUBMISSIONS_TABLE = "user_submissions"
```

Edit `demo/demo-config.js` to point to the same project but use demo tables:
```js
export const SUPABASE_URL = "https://your-project.supabase.co"
export const SUPABASE_KEY = "your-publishable-key"
export const COURSES_TABLE = "demo_prereqlookup"
export const SUBMISSIONS_TABLE = "demo_user_submissions"
```

### 3. Update placeholders

Search the codebase for course code placeholders and replace them with ones relevant to your institution:

- `script.js` — `VerInput` placeholder (`"Enter course: (Eg. ECE 241)"`)
- `demo/demo-script.js` — `VerInput` placeholder (`"Enter course: (Eg. DEMO 404)"`)
- `admin/admin.js` — `AdmAddCourse` and `UpdateCourse` placeholders
- `demo/demo-admin/demo-admin.js` — same as above

### 4. Create an admin user

Go to Supabase → **Authentication → Users → Add User** and create your admin account. This is what you'll use to log into the admin panel.

### 5. Open the site

Open `index.html` in a browser or serve with any local server.

### 6. Set demo credentials (optional)

The demo site has a simple login popup. Update the credentials in `demo/demo-script.js`:

```js
if (email === "demo@demo.com" && password === "demo123") {
  window.location.href = "./demo-admin/"
  return
}
```

Change `demo@demo.com` and `demo123` to whatever you want. No Supabase user needs to be created since this is just a client-side check that redirects to the demo admin site. The demo admin itself has no authentication.

If you don't want a demo at all, remove the `DemoMode` button from `index.html` and delete the `demo/` folder entirely.


## Database schema

Prerequisites are stored as nested arrays:
```json
[["MATH 132", "PHYSICS 151"], ["CS 187"]]
```
Inner arrays are OR groups. The outer array is AND. This represents `(MATH 132 OR PHYSICS 151) AND (CS 187)`.

When entering prerequisites via the admin or contribution form, use natural language:
```
(MATH 132 OR PHYSICS 151) AND (CS 187)
```

---

## Disclaimer

Course data is sourced from Coursicle. Always verify prerequisites with your academic advisor or the official UMass course catalog before registering.
