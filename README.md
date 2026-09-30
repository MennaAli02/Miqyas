# Miqyas (مقياس) — Non-Conformance & CAPA Management Platform

> **إدارة عدم المطابقة والإجراءات التصحيحية والوقائية**  
> Technical System Documentation & Architecture Overview — Version 1.0 (2026)

---

## 📌 Executive Summary

**Miqyas** (`مقياس · إدارة عدم المطابقة`) is a bilingual (Arabic / English) quality non-conformance management system designed to log, triage, investigate, resolve, and verify deviations and non-conformities without requiring user login credentials.

Every action, handover note, and workflow state change is signed using a lightweight, transparent audit identity (`Sign as` / `أوقّع باسم`) stored in the audit trail.

---

## 🏗️ Architecture & Technology Stack

### Front-End Application Architecture
* **Core Framework**: React 19 + Vite (Modern ES Modules & Fast Refresh)
* **Routing**: `wouter` lightweight client-side router
* **Icons Library**: `lucide-react` icon system
* **Styling & Design Tokens**: HSL Tailwind CSS v3 tokens matching exact color palettes
* **Typography**:
  * **Arabic**: `IBM Plex Sans Arabic`
  * **English**: `IBM Plex Sans`
* **Color Palette**:
  * **Light Theme**: Warm Sand (`#F6F3ED`), Deep Slate (`#1B232D`), Terracotta Primary (`#893B1F`)
  * **Dark Theme**: Deep Obsidian (`#111417`), Warm Beige Text (`#ECE7DF`), Rust Orange Primary (`#DC7B52`)
  * **Status Colors**: Critical (`#9A1D1D` / `#D84646`), Major Amber (`hsl(36 62% 40%)`), Minor Muted (`hsl(36 16% 91%)`), Verified (`hsl(152 32% 32%)`)
* **Logo**: Embedded SVG & Vector Gauge Icon matching the circular dial indicator with terracotta hand.

### State & Persistence Architecture
* **Internationalization (i18n)**: Arabic (RTL default) and English (LTR) with instant document orientation update and persistent storage in `localStorage`.
* **Theme Mode**: Dark Mode and Light Mode with system preference detection and persistent preference in `localStorage`.
* **Signatory Audit Identity**: Name configured in topbar or mobile view is remembered and automatically attached to non-conformance creation, CAPA items, evidence attachments, and stage advancement.
* **Persistent Data Store**: Standalone offline database stored in `localStorage` (`miqyas.standalone.v1`), pre-populated with realistic industrial seed non-conformances, CAPA actions, clauses, and audit events.
* **Database Reset**: Dedicated reset button in Topbar and `window.miqyasReset()` console helper.

---

## 📑 Application Pages & Modules

### 1. Dashboard (`/`) — المتابعة
* **KPI Metrics**:
  * Open non-conformances count
  * Overdue non-conformances with dynamic alert highlighting
  * Critical open non-conformances
  * Reports closed in current month
* **Funnel Pipeline Progress**:
  * Visual capacity bars for each workflow stage: Reported, Triage, Investigation, Action, Verification, Closed
* **Overdue Follow-up List**: Quick link table showing delayed deviations with deadline highlight.
* **Recent Reports**: Latest 5 non-conformances with severity badges and status indicators.
* **Repeating Clauses**: Top standard clauses breached with frequency count.

### 2. NCR Register (`/register`) — السجل
* **Search & Filters**:
  * Free text search across reference code, title, description, and reporter
  * Status filter (All, Reported, Triage, Investigation, Action, Verification, Closed, Rejected)
  * Severity filter (All, Critical, Major, Minor)
  * Department filter (All, Quality, Production, Laboratory, Clinical, Procurement, Maintenance, Warehouse)
* **CSV Export**: One-click download of filtered register data in UTF-8 CSV format with proper BOM.
* **Full Data Table**: Clickable reference links (`NCR-YYYY-XXXX`), title, department, source, severity badge, status badge, and due date.

### 3. New Report Wizard (`/new`) — تقرير جديد
* **General Information**:
  * Reporter name (required, defaults to current signatory identity)
  * Date reported
  * Department (Quality, Production, Laboratory, Clinical, Procurement, Maintenance, Warehouse)
  * Location
  * Source (Process, Internal audit, Customer, Supplier, Incident, Management)
  * Severity (Minor, Major, Critical)
* **Case & Standard Clause**:
  * Title & Detailed description (required)
  * Associated ISO Clause selector (ISO 9001:2015, ISO 15189:2022, ISO 13485:2016)
  * Breached requirement text
  * Immediate containment note
  * Disposition (Quarantine, Rework, Scrap, Use as-is, Return, Not applicable)
* **Optional Early Root Cause & CAPA**:
  * 5-Whys first inquiry
  * Root cause statement
  * Action type (Corrective / Preventive)
  * Initial action description, owner, and due date

### 4. NCR Detail View (`/ncr/:id`) — تفاصيل التقرير
* **Interactive Workflow Ribbon**: Progress bar showing current stage in pipeline.
* **Header Controls**: Direct print stylesheet trigger (`window.print()`) and safe delete with confirmation dialog.
* **Metadata & Routing Recommendation Card**: Automated SLA deadline calculation and escalation guidance based on severity.
* **Evidence Management**:
  * Display image previews, HTML5 video player, and file downloads
  * File attachment up to 12 MB stored as DataURL
* **Root Cause Analysis (RCA) Tool**:
  * Method selector: 5-Whys or Fishbone
  * Why chain editor
  * Root cause and contributing factors editor with save button
* **CAPA Actions Management**:
  * Clause-based action suggestion with single-click "Use suggestion" button
  * List of existing CAPA actions
  * Inline action submission form
* **Effectiveness Verification**: Verification note editor required before closure.
* **Step Transition Controls**:
  * Handover note input
  * Next step buttons based on transition rules:
    * `investigation` → `capa` requires root cause
    * `capa` → `verification` requires ≥ 1 action and all actions started
    * `verification` → `closed` requires verification note and all actions done/verified
* **Chronological Audit Trail**: Full timeline of reports, updates, evidence uploads, and stage handovers with actor name and timestamp.

### 5. CAPA Action Board (`/capa`) — لوحة الإجراءات
* 4 status columns: **Open** (مفتوح), **In Progress** (جارٍ), **Done** (منفَّذ), **Verified** (متحقق).
* Card displays: Action description, Corrective/Preventive tag, linked NCR reference link, assignee, due date.
* Inline dropdown to transition action status in real time.

### 6. Trends & Analytics (`/trends`) — الاتجاهات
* **CAPA Effectiveness KPI**: Percentage of closed corrective actions verified effective without recurrence.
* **Interactive SVG Charts**:
  * By Department
  * By Severity
  * By Source
  * By Reporting Month
* **Hotspot Repeating Clauses Table**: Frequency breakdown of standard clauses breached.

### 7. ISO Clauses Library (`/clauses`) — البنود
* Searchable directory of quality clauses from ISO 9001:2015, ISO 15189:2022, and ISO 13485:2016.
* Occurrence count badge for each clause.
* "Report against this clause" button immediately pre-filling the New Report wizard with the selected clause.

---

## 🚀 Running the Project

```bash
cd C:\Users\Victus\Documents\miqyas

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production bundle
npm run preview
```
