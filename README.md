# Oakwood LMS Motor (v2.9.9)

Local-first, vanilla JS SPA for Oakwood Learning Management System. Hash-based routing, single AppState, and high-fidelity mock data for full Parent -> AI -> Pupil -> Report -> Homework -> Re-take flow.

**Live Demo**
https://erkanaltuntastr-cmyk.github.io/parentapp2/  
Enable GitHub Pages with source `/(root)` on `main` to activate the link.

## Features
- Parent and pupil dashboards with subject Active/Passive control.
- Week-based curriculum greyscaling using current school week.
- 3-mode Quiz Wizard (Automatic, Quick Settings, Expert) with presets.
- Mock Pedagogical Review with Apply/Proceed/Back actions.
- Full quiz session: timer, progress, hints, explain-after-answer.
- Positive-first report with strengths, growth, critical needs.
- Homework generation and gated retake logic.
- Manual Quiz creation (paste or upload).
- Local-first state, no backend required.

## Demo Credentials
- Parent: `demo_parent` / `Oakwood*2026`
- Pupil: `amelia5` / `Oakwood*2026`
- Pupil: `oliver7` / `Oakwood*2026`
- Admin: `oakwood_admin` / `Acorn*2026`

## Run Locally
```bash
npm run dev:python
```
Open `http://localhost:5173`

Alternative:
```bash
npm run dev:node
```

## Quality Gates
```bash
npm run preflight
npm run approve -- --screen final-lms-engine
npm run gate
```

## Routes
- `#/family-hub` (parent landing)
- `#/child-dashboard` (pupil landing)
- `#/child-overview`
- `#/subjects`
- `#/quiz-wizard` and `#/quiz-generator`
- `#/quiz-session?id=...`
- `#/quiz-report?id=...`
- `#/manual-quiz`
- `#/messages`
- `#/settings`

## Mock Data
- `data/mock-ai.json`
- `data/mock-curriculum.json`
- `data/mock-homework.json`

## GitHub Pages Deploy
1. GitHub repo -> Settings -> Pages
2. Source: `main` branch
3. Folder: `/(root)`
4. Save, then open the Live Demo URL above

## Suggested Topics
- vanilla-js
- lms
- education
- local-first
- pwa
