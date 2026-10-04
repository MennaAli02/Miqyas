# Miqyas (مقياس) — Project Documentation

**Non-conformance management system** · React frontend · Supabase backend (PostgreSQL, Auth, Storage)
Version 2.0 · Languages: Arabic (RTL) and English · Last updated: October 2026

---

## 1. What is Miqyas?

Miqyas is a web application for recording, investigating, fixing and closing **quality problems** (called *non-conformances*) inside an organization such as a factory, medical laboratory, clinic or warehouse.

The name *Miqyas* (مقياس) means "measure" or "standard": the system measures day-to-day work against a quality standard (for example ISO 9001) and keeps evidence of every deviation and how it was resolved.

The interface is **bilingual** (Arabic RTL and English) and **responsive**: it adapts to phones, tablets and desktop screens, so reports can be filed from the shop floor and reviewed from the office.

---

## 2. The problem it solves

Quality standards require an organization to **document every problem, find its root cause, correct it, and prove the fix worked**. In practice this is often done on paper or in scattered spreadsheets, which leads to:

- problems that are never followed up,
- unclear ownership and missed deadlines,
- no proof for auditors,
- the same problem returning because the real cause was never found.

Miqyas replaces this with one system where every problem has an owner, a due date, a fixed workflow and a permanent history.

---

## 3. A simple example

1. **Ahmed**, a worker, notices that bolts on machine 2 are too loose. He opens Miqyas and creates a **report**.
2. The **quality officer** reviews it (*triage*) and assigns it for investigation.
3. The team finds the **root cause**: the tightening tool was never calibrated.
4. They add **actions**: calibrate all tools (corrective) and add a monthly calibration schedule (preventive). Each action has an owner and a due date.
5. When the actions are done, the **quality manager** verifies effectiveness ("no recurrence in three weeks") and **closes** the report.

Every step is recorded with the person's name and the date.

---

## 4. Goal of the system

> Make sure every quality problem is recorded, fixed properly, verified, and never forgotten.

| Goal | How the system supports it |
|---|---|
| Accountability | Owner, due date and overdue flag on every report |
| Traceability | Timeline of every change with actor and date |
| Compliance | Each report can be linked to a standard clause (ISO 9001, ISO 15189, ISO 13485) |
| Learning | Trends show where problems repeat and which actions worked |
| Security | Role-based access: reporters see only their own; officers and managers see all |

---

## 5. System pages

| Page | Route | Purpose |
|---|---|---|
| Overview | `/` | KPI summary: open, overdue, critical, closed this month, open actions; workflow funnel; latest reports; most repeated clauses |
| New report | `/new` | Three-step form: General → Case & clause → Cause & action |
| Register | `/register` | Full list of reports with search, filters (status, severity, department) and CSV export |
| Report detail | `/ncr/:id` | Main working page: description, evidence, clause, five whys, actions, verification note, timeline, move step, print, archive |
| Actions | `/capa` | Kanban board of all CAPA actions; update their status |
| Trends | `/trends` | Charts by department, severity, source and month; clause hotspots; effectiveness % |
| Clauses | `/clauses` | Library of standard clauses; start a report from a clause |

---

## 6. Main features

- Bilingual interface (Arabic RTL / English) with instant language switching
- Light and dark theme with user preference saved
- Responsive layout for phone, tablet and desktop
- Evidence upload: photo, video or PDF file, up to 12 MB per file (max 20 per report)
- Root cause analysis: five whys or fishbone factors
- Corrective and preventive actions (CAPA) with owners and due dates
- Automatic routing note and due date based on severity (critical +7d, major +14d, minor +30d)
- Suggested action text based on the linked clause
- Print-friendly layout for report detail
- CSV export on the Register page
- Workflow gate rules: the database enforces each step requirement

---

## 7. Responsive design

| Screen | Behaviour |
|---|---|
| Phone (< 768 px) | Sidebar hidden; slides in from burger menu button; single-column layout |
| Tablet (≥ 768 px) | Sidebar visible; wider grids for cards and forms |
| Desktop (≥ 1024 px) | Full layout with five KPI cards per row and multi-column charts |
| Wide desktop (≥ 1280 px) | Maximum width capped; more room for charts and tables |

- Breakpoints: 640, 768, 1024 and 1280 px (Tailwind CSS).
- Wide tables (Register) scroll sideways inside their container.
- Layout mirrors automatically between RTL (Arabic) and LTR (English).
- The burger menu icon appears on the **right** side of the topbar on mobile.

---

## 8. Important terms

| Term | Meaning |
|---|---|
| **Non-conformance (NCR)** | A situation where something did not meet a requirement |
| **Report** | One record of a non-conformance in Miqyas |
| **Severity** | How serious it is: *minor*, *major*, *critical* |
| **Triage** | First review that decides where the report goes, or rejects it |
| **Root cause** | The real reason the problem happened |
| **Five whys** | Asking "why?" repeatedly (up to 5 times) to reach the root cause |
| **Fishbone** | Alternative root-cause method grouping factors into categories |
| **Containment** | Immediate action to stop the problem spreading |
| **Disposition** | What happens to the affected item: quarantine, rework, scrap, use-as-is, return, N/A |
| **CAPA** | Corrective and Preventive Action |
| **Verification** | Checking that the actions actually worked |
| **Clause** | A numbered requirement in a standard, e.g. ISO 9001:2015 clause 10.2 |
| **Overdue** | Due date passed and the report is not closed or rejected |
| **Archive** | Soft-delete: the report is hidden from lists but kept for audit |

---

## 9. Workflow

```
Reported → Triage → Investigation → Action (CAPA) → Verification → Closed
    ↑          ↓
    └── Rejected (from Reported or Triage)       Verification → Action (if fix failed)
```

### Allowed transitions

| From | Can move to |
|---|---|
| `reported` | `triage`, `rejected` |
| `triage` | `investigation`, `rejected` |
| `investigation` | `capa` |
| `capa` | `verification` |
| `verification` | `closed`, `capa` |
| `closed` | — |
| `rejected` | `reported` (reopen) |

### Gate rules (enforced in the database)

| Transition | Requirement |
|---|---|
| `investigation → capa` | Root cause field is not empty |
| `capa → verification` | At least one action exists and none is still `open` |
| `verification → closed` | Verification note is not empty and all actions are `done` or `verified` |

### Automatic values on creation

| Severity | Due date (from report date) | Routing note |
|---|---|---|
| critical | +7 days | Escalate to top management within 24 hours |
| major | +14 days | Route to Quality Manager within 3 working days |
| minor | +30 days | Handle at team level within one month |

---

## 10. Roles and permissions

Three roles are defined in the system. Every new user starts as a **reporter**; a manager promotes them.

| Role | Arabic | Description |
|---|---|---|
| `reporter` | مُبلِّغ | Workers and technicians who file reports |
| `officer` | ضابط جودة | Quality officers who investigate and manage actions |
| `manager` | مدير الجودة | Quality manager with full authority |

| Action | Reporter | Officer | Manager |
|---|:---:|:---:|:---:|
| Create report | ✅ | ✅ | ✅ |
| View own reports only | ✅ | ✅ | ✅ |
| View all reports, Register, Trends | ❌ | ✅ | ✅ |
| Move steps (triage → investigation → capa → verification) | ❌ | ✅ | ✅ |
| Edit root cause, add CAPA actions | ❌ | ✅ | ✅ |
| Update CAPA status (open → in_progress → done) | ❌ | ✅ | ✅ |
| Mark CAPA as `verified` | ❌ | ❌ | ✅ |
| Close a case | ❌ | ❌ | ✅ |
| Reject / Reopen a case | ❌ | ❌ | ✅ |
| Archive (soft-delete) a case | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |

> See **Section 22 onward** for the full authentication and role management implementation plan.

---

## 11. Technology stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 19 + Vite | Pages, routing, forms, charts |
| Routing | Wouter | Client-side SPA routing |
| Styling | Tailwind CSS + custom CSS variables | Responsive design, light/dark themes, RTL/LTR |
| Icons | Lucide React | Consistent icon set |
| Backend platform | **Supabase** | Auth, PostgreSQL database, file storage |
| Database | **PostgreSQL** (inside Supabase) | Tables, constraints, triggers, workflow functions |
| Auth | **Supabase Auth** | Sessions, JWT tokens, anonymous sign-in |
| Files | **Supabase Storage** | Private bucket `evidence` (12 MB limit) |
| Data access | `supabase-js` v2 | RPC calls from React to the database |
| Security | **Row Level Security (RLS)** + DB functions | Role-based data access enforcement |
| Source control | Git → GitHub (`MennaAli02/Miqyas`) | Version control |

---

## 12. Project folder structure

```
miqyas/
├── .env.local                          ← Supabase credentials (NOT committed to Git)
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── Miqyas_Documentation.md            ← This file
├── AUTH_DEVELOPMENT.md                 ← Authentication implementation guide
│
├── public/
│   ├── favicon.svg
│   └── logo.svg
│
├── src/
│   ├── main.jsx                        ← React entry point
│   ├── App.jsx                         ← Layout, routing, auth session init
│   ├── index.css                       ← Global CSS tokens and base styles
│   │
│   ├── lib/
│   │   ├── supabase.js                 ← Supabase client singleton
│   │   ├── auth.js                     ← Auth helpers (ensureSession, signIn, signOut)
│   │   ├── api.js                      ← API adapter (Supabase RPC or localStorage mock)
│   │   ├── constants.js                ← Enums, clause list, workflow constants
│   │   └── i18n.jsx                    ← Language context, translations, theme
│   │
│   ├── components/
│   │   ├── Topbar.jsx                  ← Top navigation bar
│   │   ├── Sidebar.jsx                 ← Side navigation with user avatar
│   │   ├── StatusBadge.jsx             ← Severity and status badge components
│   │   ├── Charts.jsx                  ← Bar chart component (Trends page)
│   │   ├── FormField.jsx               ← Reusable form field and page header
│   │   └── Icons.jsx                   ← SVG icon components
│   │
│   └── pages/
│       ├── Dashboard.jsx               ← Overview / KPI page
│       ├── Register.jsx                ← Report list with filters and CSV export
│       ├── NewReport.jsx               ← Three-step new report form
│       ├── NcrDetail.jsx               ← Report detail: RCA, CAPA, timeline
│       ├── CapaBoard.jsx               ← Kanban board for CAPA actions
│       ├── Trends.jsx                  ← Analytics charts
│       ├── Clauses.jsx                 ← Clause library
│       └── NotFound.jsx                ← 404 page
│
└── supabase/
    ├── config.toml                     ← Supabase CLI config
    ├── seed.sql                        ← Standard clauses (8 clauses)
    ├── demo_seed.sql                   ← Demo NCRs for presentation (5 NCRs)
    ├── fix_demo_roles.sql              ← Demo workaround: upgrade all to officer
    └── migrations/
        ├── 001_types_and_tables.sql    ← ENUMs, all tables, append-only trigger
        ├── 002_functions.sql           ← All 9 RPC functions + helper functions
        ├── 003_rls_policies.sql        ← Row Level Security on all tables
        ├── 004_storage.sql            ← Private evidence bucket + policies
        └── fix_001_anon_user_profile.sql ← Fix for anonymous sign-in trigger
```

---

## 13. Database tables

| Table | Purpose | Key fields |
|---|---|---|
| `profiles` | One row per user | `id` (= auth user id), `full_name`, `role`, `department` |
| `clauses` | Standard quality clauses | `standard`, `code`, `title_ar`, `title_en`, `text_ar`, `text_en` |
| `ncrs` | Non-conformance reports | `ref`, `title`, `description`, `severity`, `status`, `department`, `source`, `due_date`, `root_cause`, `verification_note`, `created_by`, `version` |
| `capas` | Corrective/preventive actions | `ncr_id`, `type`, `action`, `owner_name`, `due_date`, `status` |
| `events` | Append-only timeline | `ncr_id`, `at`, `actor`, `note` |
| `evidence` | File records | `ncr_id`, `kind`, `name`, `path` (Storage), `created_by` |

**Bilingual text fields** (`title`, `description`, `root_cause`, etc.) are stored as `jsonb` in the form `{"ar": "...", "en": "..."}`.

**Timeline** (`events`) is append-only — a database trigger blocks any update or delete.

**Archive vs Delete** — reports are never deleted; they are soft-deleted by setting `archived_at`, so the audit trail remains.

---

## 14. API operations (Supabase RPC functions)

All writes go through **database functions** (called with `supabase.rpc(...)`). Direct insert, update and delete on the tables are revoked for all users.

| Function | Used by | Roles |
|---|---|---|
| `get_bootstrap()` | Overview, Register, Actions, Trends, Clauses | All authenticated users (scoped by role) |
| `create_ncr(payload)` | New report page | Reporter, Officer, Manager |
| `get_ncr(p_id)` | Report detail | All (scoped) |
| `update_analysis(p_id, payload)` | Report detail — RCA form | Officer, Manager |
| `advance_ncr(p_id, p_to, p_note)` | Report detail — Move step button | Officer, Manager (close/reject: Manager only) |
| `add_capa(p_ncr_id, payload)` | Report detail — Add action | Officer, Manager |
| `set_capa_status(p_id, p_status)` | Actions board | Officer, Manager (verified: Manager only) |
| `add_evidence(p_ncr_id, p_path, p_name)` | Report detail — Upload | All (on their own editable reports) |
| `archive_ncr(p_id)` | Report detail — Archive | Manager only |
| `set_user_role(p_user_id, p_role)` | Admin panel (to be built) | Manager only |

---

## 15. API adapter (`src/lib/api.js`)

The file exports a single `api` object. It **automatically switches** between two modes:

| Mode | When | How |
|---|---|---|
| **Supabase mode** | `VITE_SUPABASE_URL` env var is set | Calls real Supabase RPC functions |
| **Mock mode** | Env var is not set | Uses browser `localStorage` as a local database |

This means the app works offline during development (without a Supabase connection) and switches automatically to the real backend when deployed.

---

## 16. Environment variables

Create a file named `.env.local` in the project root (it is already in `.gitignore`):

```
VITE_SUPABASE_URL=https://sddflxdpkyelzzilqfeu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get the anon key from: **Supabase Dashboard → Project Settings → API → anon public**.

> Never commit this file to Git. Never use the `service_role` key in the React app.

---

## 17. Standard clauses included

| Standard | Code | Title (English) |
|---|---|---|
| ISO 9001:2015 | 8.7 | Control of nonconforming outputs |
| ISO 9001:2015 | 10.2 | Nonconformity and corrective action |
| ISO 9001:2015 | 8.4 | Control of externally provided products |
| ISO 9001:2015 | 7.1.5 | Monitoring and measuring resources |
| ISO 9001:2015 | 9.2 | Internal audit |
| ISO 9001:2015 | 7.5 | Documented information |
| ISO 15189:2022 | 7.5 | Nonconforming work |
| ISO 13485:2016 | 8.3 | Control of nonconforming product |

---

## 18. Current implementation status

### ✅ Done

- React SPA with 7 pages, responsive layout, RTL/LTR, light/dark theme
- Supabase project configured with URL and anon key
- All 4 SQL migrations applied: tables, functions, RLS, storage
- Anonymous sign-in enabled and wired to app startup
- Dual-mode API adapter (Supabase ↔ localStorage mock)
- Demo data: 5 NCRs across all workflow stages
- Standard clauses: 8 ISO clauses seeded
- User avatar in sidebar with actor name
- Static user name display in topbar (replaced editable input)
- GitHub repository: `MennaAli02/Miqyas`

### 🔲 Pending — Authentication

- Login page (email + password form) → `/login`
- `AuthGuard` component (redirect to login if no session)
- Sign-out button in Topbar
- Replace demo name with real `profile.full_name` from Supabase
- Role-based UI: hide/show buttons based on user role
- Profile page → `/profile`
- Admin user management → `/admin/users`
- Disable open sign-up; switch to invite-only
- Disable anonymous sign-in after login is live

> Full details and code skeletons in **`AUTH_DEVELOPMENT.md`**.

### 🔲 Pending — Future features

- Email notifications (overdue reports, step transitions) via Supabase Edge Functions
- Real-time updates when another user moves a step (Supabase Realtime)
- Dashboard date-range filter for Trends
- Export report as PDF
- Bulk status update in Register

---

## 19. Running locally

```powershell
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build
```

The dev server uses the mock localStorage API unless `.env.local` is present with valid Supabase credentials.

---

## 20. Supabase Free plan limits (mid-2026)

| Item | Limit |
|---|---|
| Database | 500 MB |
| File storage | 1 GB |
| Egress | 5 GB/month |
| Monthly active users | 50,000 |
| Active projects | 2 |

- **Auto-pause:** Free projects pause after ~1 week of inactivity.
- **No automatic backups** on the Free plan.
- Move to the **Pro plan** (~$25/month) before storing real quality records.

---

## 21. Security rules summary

- **RLS on every table.** A table without RLS is open to anyone with the anon key.
- **All writes go through functions.** Direct insert/update/delete are revoked.
- **Role checks at the top of every function.** Database enforces roles — UI hiding alone is not protection.
- **Timeline is append-only.** A trigger blocks update/delete on `events`.
- **Archive instead of delete.** `archived_at` is set; the audit trail and evidence remain.
- **Service role key** is never in the React code or the repository.
- **Evidence bucket is private.** Files are accessed only via short-lived signed URLs.
- **Concurrent edit protection.** The `version` field detects conflicting edits (optimistic locking).

---

## 22. Authentication — Current State (Demo Mode)

> **Status:** Authentication is partially implemented (anonymous sign-in only).
> The infrastructure is fully in place; the login UI has not been built yet.

| Item | Status | Notes |
|---|---|---|
| Supabase Auth enabled | ✅ Done | Project: `sddflxdpkyelzzilqfeu` |
| Anonymous sign-in | ✅ Done | Enabled in Supabase Dashboard |
| Auto-session on app load | ✅ Done | `ensureSession()` in `App.jsx` |
| `profiles` table + trigger | ✅ Done | Created on every new user automatically |
| 3 roles defined in DB | ✅ Done | `reporter`, `officer`, `manager` |
| RLS policies | ✅ Done | All tables secured by role |
| DB functions enforce roles | ✅ Done | Every RPC checks `my_role()` |
| Login page (email/password) | ❌ Pending | See Section 24 |
| Registration / invite flow | ❌ Pending | See Section 25 |
| Profile management page | ❌ Pending | See Section 26 |
| Role management by manager | ❌ Pending | See Section 27 |
| Sign-out button | ❌ Pending | See Section 24 |
| Password reset | ❌ Pending | See Section 25 |

### Demo workaround applied
To show data in the demo without a login page, two things were done:
1. Anonymous sign-in was enabled → the app auto-creates a session on load.
2. All profiles were upgraded to `officer` → every session can see all records.

```sql
-- This was run in Supabase SQL Editor for the demo
update public.profiles set role = 'officer';
```

> When you implement real login, remove this workaround and assign roles individually per user.

---

## 23. Authentication — Roles in Detail

```
reporter  →  officer  →  manager
(lowest)                 (highest)
```

### reporter — مُبلِّغ
The default role assigned automatically to every new user.
- A worker, technician or any person who spots a problem.
- **Can:** Create reports, upload evidence on their own reports, view their own reports only.
- **Cannot:** See other people's reports, move workflow steps, add CAPA actions.

### officer — ضابط جودة
A quality officer or department supervisor promoted by a manager.
- **Can:** Everything a reporter can do PLUS see all reports, move steps (triage → investigation → capa → verification), edit root cause, add and update CAPA actions.
- **Cannot:** Close cases, reject/reopen, verify CAPA effectiveness, archive, change roles.

### manager — مدير الجودة
The quality manager or senior management. Only one or a few people hold this role.
- **Can:** Everything an officer can do PLUS close cases, reject/reopen, mark CAPAs as `verified`, archive cases, change other users' roles.

### Database structure for auth

```sql
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 100),
  role        public.app_role not null default 'reporter',
  department  text,
  created_at  timestamptz not null default now()
);
```

Helper functions already in the database:
```sql
public.my_role()   -- returns the calling user's app_role
public.my_name()   -- returns the calling user's full_name
```

Role management function (manager only):
```sql
select public.set_user_role('<target-user-uuid>', 'officer');
```

A trigger (`handle_new_user`) creates a profile row automatically with `role = 'reporter'` whenever a new user signs up.

---

## 24. Authentication — Login Page to Build

### Files to create
```
src/
├── pages/
│   └── Login.jsx          ← new login page
├── components/
│   └── AuthGuard.jsx      ← route wrapper; redirects to /login if no session
└── lib/
    └── auth.js            ← already exists; signInWithEmail + signOut are ready
```

### Login flow
```
User opens app
    ↓
AuthGuard checks supabase.auth.getSession()
    ↓ no session
Redirect to /login
    ↓
User enters email + password → signInWithPassword()
    ↓ success
Redirect to / (Overview)
    ↓
Profile loaded → role determines what they see
```

### `Login.jsx` skeleton
```jsx
import { useState } from 'react';
import { useLocation } from 'wouter';
import { signInWithEmail } from '../lib/auth';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [, setLocation]         = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      setLocation('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Email input */}
      {/* Password input */}
      {/* Error message */}
      {/* Submit button */}
    </form>
  );
}
```

### `AuthGuard.jsx` skeleton
```jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';

export function AuthGuard({ children }) {
  const [ready, setReady]   = useState(false);
  const [, setLocation]     = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLocation('/login');
      else setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => { if (event === 'SIGNED_OUT') setLocation('/login'); }
    );
    return () => subscription.unsubscribe();
  }, []);

  return ready ? children : null;
}
```

### Sign-out button (add to Topbar)
```jsx
import { signOut } from '../lib/auth';

<button onClick={() => signOut()}>Sign out</button>
```

### Add login route in App.jsx
```jsx
import Login from './pages/Login';
import { AuthGuard } from './components/AuthGuard';

<Route path="/login" component={Login} />
<Route path="/">
  <AuthGuard><AppLayout /></AuthGuard>
</Route>
```

---

## 25. Authentication — Registration & Password Reset

> **Recommended:** Disable open sign-up. Only managers invite new users.

### Invite flow
1. Supabase Dashboard → Authentication → Settings → **disable "Allow new users to sign up"**.
2. Manager → Authentication → Users → **Invite user** (enter email).
3. User receives an email link, clicks it, sets a password.
4. Trigger creates their profile with `role = 'reporter'` automatically.
5. Manager then upgrades their role if needed (Section 27).

### Password reset
Handled entirely by Supabase — no custom code needed.

```jsx
// Forgot password link in Login.jsx:
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://your-domain.com/reset-password',
});
```

---

## 26. Authentication — Profile Page to Build

A simple settings page at `/profile` where users can see their name and role, change their display name, and change their password.

```jsx
// Get current user's profile:
const { data: profile } = await supabase
  .from('profiles').select('*')
  .eq('id', (await supabase.auth.getUser()).data.user.id)
  .single();

// Update display name:
await supabase.from('profiles')
  .update({ full_name: newName }).eq('id', user.id);

// Change password:
await supabase.auth.updateUser({ password: newPassword });
```

---

## 27. Authentication — Role Management Page to Build

A page at `/admin/users` visible to managers only, listing all users and allowing role changes.

```js
// List all profiles:
const { data: users } = await supabase
  .from('profiles')
  .select('id, full_name, role, department, created_at')
  .order('created_at');

// Change a user's role (calls the DB function — manager only):
const { error } = await supabase.rpc('set_user_role', {
  p_user_id: targetUserId,
  p_role: 'officer'    // 'reporter' | 'officer' | 'manager'
});
```

---

## 28. Authentication — Role-Based UI Pattern

Once login is implemented, read the role from the profile and show/hide elements accordingly.

### `useProfile` hook (create at `src/lib/useProfile.js`)
```js
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('*')
        .eq('id', user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  return profile;
}
```

### Usage in any page
```jsx
const profile = useProfile();
const isManager = profile?.role === 'manager';
const isOfficer = profile?.role === 'officer' || isManager;

// Close button: managers only
{isManager && <button onClick={handleClose}>Close case</button>}

// CAPA section: officers and managers
{isOfficer && <CapaSection />}
```

---

## 29. Authentication — Supabase Dashboard Settings

| Setting | Recommended value |
|---|---|
| Allow new users to sign up | **OFF** — invite only |
| Allow anonymous sign-ins | OFF after login is built (ON now for demo) |
| Confirm email | ON |
| Minimum password length | 8 |
| Restrict redirect URLs | Your production domain only |

---

## 30. Authentication — Implementation Order

1. Build `Login.jsx` — email + password form using `signInWithEmail` from `auth.js`.
2. Add `AuthGuard.jsx` — wrap `AppLayout` so unauthenticated users redirect to `/login`.
3. Add **sign-out** button to the Topbar.
4. Replace the demo actor name in Topbar and Sidebar with real `profile.full_name`.
5. Add **role-based UI** — hide Move Step, Close, Reject buttons from reporters.
6. Build `/profile` page — name and password change.
7. Build `/admin/users` page — role management (manager only).
8. Disable **anonymous sign-in** in Supabase Dashboard.
9. Disable **open sign-up** and switch to invite-only.
10. Test with three separate browser profiles — one per role — and verify the full permission matrix.

---

## 31. Authentication — Files Already in Place

| File | What it does |
|---|---|
| `src/lib/supabase.js` | Supabase client singleton from env vars |
| `src/lib/auth.js` | `ensureSession()`, `signInWithEmail()`, `signOut()`, `getUser()` |
| `src/App.jsx` | Calls `ensureSession()` on startup; shows spinner while auth initialises |
| `supabase/migrations/001_types_and_tables.sql` | `profiles` table + `handle_new_user` trigger |
| `supabase/migrations/002_functions.sql` | `my_role()`, `my_name()`, `set_user_role()`, all RPC functions with role checks |
| `supabase/migrations/003_rls_policies.sql` | RLS: reporters see own records, officers/managers see all |
| `supabase/migrations/fix_001_anon_user_profile.sql` | Fixes trigger for anonymous users who have no email |
| `supabase/fix_demo_roles.sql` | Demo workaround — upgrades all profiles to officer |
| `.env.local` | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (not in Git) |
