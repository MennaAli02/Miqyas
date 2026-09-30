# Miqyas (مقياس) — Project Documentation

**Non-conformance management system** · React frontend · Odoo 19 backend
Version 1.0 · Languages: Arabic (RTL) and English

---

## 1. What is Miqyas?

Miqyas is a web application for recording, investigating, fixing and closing **quality problems** (called *non-conformances*) inside an organization such as a factory, medical laboratory, clinic or warehouse.

The name *Miqyas* (مقياس) means "measure" or "standard": the system measures day-to-day work against a quality standard (for example ISO 9001) and keeps evidence of every deviation and how it was resolved.

## 2. The problem it solves

Quality standards require an organization to **document every problem, find its root cause, correct it, and prove the fix worked**. In practice this is often done on paper or in scattered spreadsheets, which leads to:

- problems that are never followed up,
- unclear ownership and missed deadlines,
- no proof for auditors,
- the same problem returning because the real cause was never found.

Miqyas replaces this with one system where every problem has an owner, a due date, a fixed workflow and a permanent history.

## 3. A simple example

1. **Ahmed**, a worker, notices that bolts on machine 2 are too loose. He opens Miqyas and creates a **report**.
2. The **quality manager** reviews it (*triage*) and assigns it for investigation.
3. The team finds the **root cause**: the tightening tool was never calibrated.
4. They add **actions**: calibrate all tools (corrective) and add a monthly calibration schedule (preventive). Each has an owner and a due date.
5. When the actions are done, the manager **verifies effectiveness** ("no recurrence in three weeks") and **closes** the report.

Every step is recorded with the person's name and the date.

## 4. Goal of the system

> Make sure every quality problem is recorded, fixed properly, verified, and never forgotten.

Supporting goals:

| Goal | How the system supports it |
|---|---|
| Accountability | Owner, due date and overdue flag on every report |
| Traceability | Timeline of every change with actor and date |
| Compliance | Each report can be linked to a standard clause |
| Learning | Trends show where problems repeat and which actions worked |
| Simplicity | No account or password required in the UI; the signing name is written on the record only |

## 5. System explanation

### 5.1 Pages

| Page | Route | Purpose |
|---|---|---|
| Overview | `/` | Manager summary: open, overdue, critical, closed this month, open actions; workflow funnel; latest reports; most repeated clauses |
| New report | `/new` | Three-part form: General, Case and clause, Cause and action. Cause and action can be completed after saving |
| Register | `/register` | Full list of reports with search, filters (status, severity, department) and CSV export |
| Report detail | `/ncr/:id` | Main working page: description, evidence, clause, root cause (five whys), actions, verification note, timeline, move to next step, print, delete |
| Actions | `/capa` | Board of all corrective and preventive actions; update their status |
| Trends | `/trends` | Charts by department, severity, source and month; most repeated clauses; effectiveness of closed actions |
| Clauses | `/clauses` | Library of standard clauses; start a report against a clause and see how often each is hit |

### 5.2 Main features

- Bilingual interface (Arabic RTL / English), light and dark theme, print support
- Evidence upload (photo, video or file, up to 12 MB)
- Root cause analysis (five whys or fishbone factors)
- Corrective and preventive actions (CAPA) with owners and due dates
- Automatic routing note and due date based on severity
- Suggested action text based on the linked clause

## 6. Important terms

| Term | Meaning |
|---|---|
| **Non-conformance (NCR)** | A situation where something did not meet a requirement |
| **Report** | One record of a non-conformance in Miqyas |
| **Severity** | How serious it is: *minor*, *major*, *critical* |
| **Triage** | First review that decides where the report goes, or rejects it |
| **Root cause** | The real reason the problem happened |
| **Five whys** | Asking "why?" repeatedly to reach the root cause |
| **Containment** | Immediate action to stop the problem spreading |
| **Disposition** | What happens to the affected item: quarantine, rework, scrap, use as-is, return, not applicable |
| **CAPA** | Corrective and Preventive Action: fixes the problem (corrective) and stops it recurring (preventive) |
| **Verification** | Checking that the actions actually worked |
| **Clause** | A numbered requirement in a standard, for example ISO 9001:2015 clause 10.2 |
| **Overdue** | Due date passed and the report is not closed or rejected |

## 7. How it works

### 7.1 Workflow

```
Reported → Triage → Investigation → Action (CAPA) → Verification → Closed
    ↑          ↓
    └── Rejected (from Reported or Triage)          Verification → Action (if the fix failed)
```

Allowed transitions (as used by the interface):

| From | Can move to |
|---|---|
| `reported` | `triage`, `rejected` |
| `triage` | `investigation`, `rejected` |
| `investigation` | `capa` |
| `capa` | `verification` |
| `verification` | `closed`, `capa` |
| `closed` | — |
| `rejected` | `reported` (reopen) |

### 7.2 Recommended gate rules (enforced by the backend)

The interface shows: *"Closure needs a root cause, an action, and a verification note."* Recommended server rules:

| Transition | Requirement |
|---|---|
| `investigation → capa` | Root cause is not empty |
| `capa → verification` | At least one action exists and none is still `open` |
| `verification → closed` | Verification note is not empty and all actions are `done` or `verified` |

### 7.3 Automatic values on creation

| Severity | Due date (from report date) |
|---|---|
| critical | +7 days |
| major | +14 days |
| minor | +30 days |

The routing note (who to notify and how fast) and the owner are derived from the severity and department.

### 7.4 Quality measurement

- **KPIs:** open, overdue, critical open, closed this month, open actions
- **Repeating clauses:** how many reports reference each clause
- **Effectiveness:** share of completed actions that were verified as effective
- **Trends:** counts by department, severity, source and month

## 8. Technologies used

| Layer | Technology | Role |
|---|---|---|
| Frontend | **React** (Vite build) | Screens, routing, forms, charts, Arabic/English UI |
| Data fetching | TanStack Query | Loads and caches API data |
| Backend | **Odoo 19** custom module `miqyas` | Data models, workflow rules, permissions, API routes |
| Database | PostgreSQL (Odoo's database) | Storage |
| Web server | nginx (recommended) | Serves the React build and forwards `/api` to Odoo on one domain |

Odoo 19 note: its built-in External JSON-2 API (`/json/2/<model>/<method>`, API-key bearer authentication) is an alternative, but it must not be called directly from the browser because the key would be exposed. This project uses custom `/api/...` routes inside the Odoo module so the React app keeps a simple, stable contract.

## 9. System structure

### 9.1 Architecture

```
┌────────────────────┐   HTTPS / JSON    ┌───────────────────────────────┐
│  React frontend    │ ────────────────▶ │  Odoo 19                      │
│  (browser)         │ ◀──────────────── │  module "miqyas"              │
│  7 pages           │                   │  ├─ controllers  (/api/...)   │
└────────────────────┘                   │  ├─ models       (business)   │
        ▲                                │  └─ security     (access)     │
        │ static files                   └──────────────┬────────────────┘
   ┌────┴─────┐                                         │
   │  nginx   │ ── /api → Odoo                    ┌─────▼─────┐
   └──────────┘                                   │ PostgreSQL│
                                                  └───────────┘
```

### 9.2 Odoo module layout

```
custom_addons/miqyas/
├── __manifest__.py
├── __init__.py
├── models/
│   ├── ncr.py          # miqyas.ncr
│   ├── capa.py         # miqyas.capa
│   ├── event.py        # miqyas.event
│   └── clause.py       # miqyas.clause
├── controllers/
│   └── api.py          # all /api/... routes
├── security/
│   └── ir.model.access.csv
└── data/
    ├── clauses.xml     # standard clauses
    └── sequences.xml   # NCR-YYYY-0001 numbering
```

### 9.3 Data model (Odoo)

| API object | Odoo model | Key fields |
|---|---|---|
| Report (`ncr`) | `miqyas.ncr` | ref, title, description, requirement, containment, disposition, severity, department, location, source, reporter_name, reported_at, due_date, status, owner_name, routing_note, clause_id, rca_method, whys, root_cause, contributors, verification_note |
| Action (`capa`) | `miqyas.capa` | ncr_id, type, action, owner_name, due_date, status |
| Timeline entry (`event`) | `miqyas.event` | ncr_id, at, actor, note |
| Clause | `miqyas.clause` | standard, code, title (ar/en), text (ar/en) |
| Evidence file | `ir.attachment` | linked to the report; `kind` is derived from the MIME type |

## 10. API documentation

This is the contract the React pages use. Implement these endpoints in the Odoo controllers.

### 10.1 Conventions

- **Base path:** `/api` (same origin as the frontend)
- **Format:** JSON request and response, `Content-Type: application/json`
- **Authentication:** the interface has no login. It sends a free-text name (`actor` or `reporterName`) that is stored on the record and is not a credential. For production, protect routes with an Odoo session (`auth="user"`) or restrict public routes to report submission only.
- **Dates:** `YYYY-MM-DD`
- **Bilingual text:** fields marked `Text` may be a plain string or an object `{ "ar": "...", "en": "..." }`. The UI displays the value for the current language and falls back to the other. Requests include `lang` (`"ar"` or `"en"`), the language of the text being submitted.
- **Errors:** return a non-2xx status with a **plain-text, human-readable message** in the body (for example `Add a root cause first`). The interface shows the raw body to the user.

| Status | Meaning |
|---|---|
| 200 | Success |
| 404 | Record not found |
| 409 | Transition not allowed |
| 422 | A required rule failed |
| 500 | Server error |

### 10.2 Enumerations

| Field | Values |
|---|---|
| `status` | `reported`, `triage`, `investigation`, `capa`, `verification`, `closed`, `rejected` |
| `severity` | `minor`, `major`, `critical` |
| `source` | `process`, `internal_audit`, `customer`, `supplier`, `incident`, `management` |
| `department` | `quality`, `production`, `laboratory`, `clinical`, `procurement`, `maintenance`, `warehouse` |
| `disposition` | `quarantine`, `rework`, `scrap`, `use_as_is`, `return`, `na` |
| `rcaMethod` | `five_why`, `fishbone` |
| CAPA `type` | `corrective`, `preventive` |
| CAPA `status` | `open`, `in_progress`, `done`, `verified` |

### 10.3 Objects

**Report (`ncr`)**

```json
{
  "id": 2,
  "ref": "NCR-2026-0002",
  "title": "Torque below tolerance on line 2",
  "description": "Bolts measured 12% below spec.",
  "requirement": "Torque 45–50 Nm",
  "containment": "Batch isolated",
  "disposition": "quarantine",
  "severity": "major",
  "department": "production",
  "location": "Line 2",
  "source": "process",
  "reporterName": "Ahmed",
  "reportedAt": "2026-09-10",
  "dueDate": "2026-09-24",
  "status": "investigation",
  "ownerName": "Production Supervisor",
  "routingNote": "Route to the Quality Manager within 3 working days.",
  "clauseId": 4,
  "rcaMethod": "five_why",
  "whys": ["Wrench drift", "No calibration schedule"],
  "rootCause": "",
  "contributors": "",
  "verificationNote": ""
}
```

`title`, `description`, `requirement`, `containment`, `routingNote`, `ownerName`, `rootCause`, `verificationNote` are `Text`.

**Action (`capa`)**

```json
{ "id": 1, "ncrId": 2, "type": "corrective", "action": "Recalibrate all wrenches",
  "ownerName": "Mona", "dueDate": "2026-09-30", "status": "open" }
```

**Event**

```json
{ "id": 7, "ncrId": 2, "at": "2026-09-12", "actor": "Mona", "note": "Moved to investigation" }
```

**Clause**

```json
{ "id": 4, "standard": "ISO 9001:2015", "code": "7.1.5",
  "titleAr": "موارد المراقبة والقياس", "titleEn": "Monitoring and measuring resources",
  "textAr": "…", "textEn": "…" }
```

**Evidence**

```json
{ "id": 3, "kind": "image", "name": "bolts.jpg", "caption": "bolts.jpg" }
```

`kind` is `image`, `video` or `file`.

---

### 10.4 Endpoints

#### 1) `GET /api/bootstrap`

Loads everything for the Overview, Register, Actions, Trends and Clauses pages.

**Response 200**

```json
{
  "stats": {
    "open": 3,
    "overdue": 1,
    "critical": 1,
    "closedMonth": 2,
    "byStatus":   { "reported": 1, "investigation": 1, "closed": 2 },
    "byDept":     { "production": 2, "quality": 1 },
    "bySeverity": { "minor": 1, "major": 2, "critical": 1 },
    "bySource":   { "process": 2, "supplier": 1 },
    "byMonth":    { "2026-08": 1, "2026-09": 3 },
    "clauseHits": { "3": 1, "4": 2 },
    "effectiveness": 67
  },
  "ncrs":    [ /* Report objects */ ],
  "capas":   [ /* Action objects */ ],
  "clauses": [ /* Clause objects */ ]
}
```

| Stat | Definition |
|---|---|
| `open` | Reports not `closed` or `rejected` |
| `overdue` | Open reports whose `dueDate` is before today |
| `critical` | Open reports with severity `critical` |
| `closedMonth` | Reports closed in the current month |
| `byMonth` | Keys are `YYYY-MM` of `reportedAt` |
| `clauseHits` | Key is the clause id, value is the number of reports |
| `effectiveness` | Percent: verified actions ÷ completed (`done` or `verified`) actions; `0` if none |

---

#### 2) `POST /api/ncrs`

Creates a report (status `reported`). Returns the new report; the UI opens `/ncr/{id}`.

**Request**

```json
{
  "reporterName": "Ahmed",
  "reportedAt": "2026-09-30",
  "department": "production",
  "location": "Line 2",
  "source": "process",
  "severity": "major",
  "title": "Torque below tolerance",
  "description": "Bolts measured 12% below spec.",
  "clauseId": 4,
  "requirement": "",
  "containment": "",
  "disposition": "quarantine",
  "rcaMethod": "",
  "whys": ["Wrench drift"],
  "rootCause": "",
  "capaType": "corrective",
  "capaAction": "",
  "capaOwner": "",
  "capaDue": "",
  "lang": "en"
}
```

- **Required:** `reporterName`, `title`, `description`
- `clauseId` is a number or `null`
- If `capaAction` is not empty, also create an action with `capaType`, `capaOwner`, `capaDue`
- The extra key `why1` may also be present; it can be ignored because `whys` carries the same value

**Server behavior:** generate `ref` (`NCR-YYYY-NNNN`), compute `dueDate` from severity, set `routingNote` and `ownerName` from severity/department, write the first timeline event ("Reported").

**Response 200:** Report object.

---

#### 3) `GET /api/ncrs/{id}`

Loads one report for the detail page.

**Response 200**

```json
{
  "ncr": { /* Report */ },
  "clause": { /* Clause */ } ,
  "evidence": [ /* Evidence objects, without file content */ ],
  "capas": [ /* Action objects for this report */ ],
  "events": [ /* Event objects, oldest first */ ],
  "suggestion": "Text (string or {ar,en}), suggested action based on the clause/severity"
}
```

`clause` may be `null`. **404** if the report does not exist.

---

#### 4) `PATCH /api/ncrs/{id}`

Saves the root cause analysis and verification note (sent automatically before a step change if those fields were edited).

**Request**

```json
{
  "lang": "en",
  "actor": "Mona",
  "rcaMethod": "five_why",
  "whys": ["Wrench drift", "No calibration schedule"],
  "rootCause": "Torque wrench not calibrated.",
  "contributors": "No owner for calibration.",
  "verificationNote": ""
}
```

**Server behavior:** update the fields, add a timeline event. **Response 200:** Report object.

---

#### 5) `POST /api/ncrs/{id}/advance`

Moves the report to another step.

**Request**

```json
{ "to": "capa", "actor": "Mona", "note": "Root cause confirmed" }
```

- `actor` is required by the UI (it will not send the request without a name)
- `note` is an optional handover note

**Server behavior:** check the transition table (7.1) and the gate rules (7.2); set `status`; write a timeline event with `actor` and `note`.

| Result | Status | Example body |
|---|---|---|
| Success | 200 | updated Report object |
| Not allowed | 409 | `Transition not allowed` |
| Rule failed | 422 | `Add a root cause first` |

---

#### 6) `POST /api/ncrs/{id}/capa`

Adds an action to the report.

**Request**

```json
{
  "type": "corrective",
  "action": "Recalibrate all wrenches",
  "ownerName": "Mona",
  "dueDate": "2026-10-10",
  "lang": "en",
  "actor": "Mona"
}
```

**Server behavior:** create the action with status `open` (default `dueDate` to the report's if empty) and add a timeline event. **Response 200:** Action object.

---

#### 7) `PATCH /api/capa/{id}`

Changes an action's status from the Actions board.

**Request**

```json
{ "status": "in_progress" }
```

Allowed values: `open`, `in_progress`, `done`, `verified`. **Response 200:** Action object.

---

#### 8) `POST /api/ncrs/{id}/evidence`

Uploads a file. The current interface sends the file as a base64 data URL (maximum 12 MB).

**Request**

```json
{ "dataUrl": "data:image/jpeg;base64,/9j/4AAQ...", "name": "bolts.jpg", "actor": "Ahmed" }
```

**Server behavior:** decode the base64 content, store it as an `ir.attachment` linked to the report, set `kind` from the MIME type (`image/*` → `image`, `video/*` → `video`, otherwise `file`), add a timeline event. **Response 200:** Evidence object.

---

#### 9) `GET /api/files/{id}`

Returns the raw file with the correct `Content-Type`. The interface uses this URL directly in `<img>`, `<video>` and `<a>` tags, so it must work as a normal browser request and must check that the user may view the file.

---

#### 10) `DELETE /api/ncrs/{id}`

Deletes the report together with its actions, timeline events and evidence. The UI asks for confirmation first. **Response 200:** `{ "ok": true }`.

---

### 10.5 Endpoint summary

| # | Method | Path | Used by |
|---|---|---|---|
| 1 | GET | `/api/bootstrap` | Overview, Register, Actions, Trends, Clauses |
| 2 | POST | `/api/ncrs` | New report |
| 3 | GET | `/api/ncrs/{id}` | Report detail |
| 4 | PATCH | `/api/ncrs/{id}` | Report detail (root cause, verification) |
| 5 | POST | `/api/ncrs/{id}/advance` | Report detail (move step) |
| 6 | POST | `/api/ncrs/{id}/capa` | Report detail (add action) |
| 7 | PATCH | `/api/capa/{id}` | Actions board |
| 8 | POST | `/api/ncrs/{id}/evidence` | Report detail (upload) |
| 9 | GET | `/api/files/{id}` | Report detail (show evidence) |
| 10 | DELETE | `/api/ncrs/{id}` | Report detail (delete) |

### 10.6 Odoo implementation notes

- Define the models in section 9.3 and add an access rule for each in `security/ir.model.access.csv`.
- Write a `to_api()` method on each model that returns exactly the field names shown above (camelCase).
- Put the workflow in one model method (for example `action_advance(to, actor, note)`) so the gate rules live in one place.
- Use an `ir.sequence` for `ref`.
- Use `translate=True` on text fields to support Arabic and English, or store two values and return `{ "ar": ..., "en": ... }`.
- In development, proxy `/api` from the Vite dev server to Odoo to avoid CORS; in production serve both behind one domain.
- Verify controller decorators (`@http.route`, request JSON helpers) against the Odoo 19.0 developer documentation before implementing.

---

## 11. Suggested build order

1. Module skeleton with the `miqyas.ncr` model and `GET /api/bootstrap`.
2. Connect the Register and Overview pages.
3. `POST /api/ncrs` and `GET /api/ncrs/{id}`.
4. Workflow (`advance`) with gate rules.
5. Actions (`capa`) and the Actions board.
6. Evidence upload and file download.
7. Permissions, HTTPS and deployment.
