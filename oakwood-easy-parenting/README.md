# Oakwood · easy parenting — Welcome Screen (Local‑First SPA Skeleton)

Minimal framework‑free SPA scaffold with the **Welcome** screen and hash‑based routing, aligned with Oakwood v2.3 principles: Local‑First, hash routing, single AppState (to be added), no UI‑level state mutations.

## Run locally

### Python
cd oakwood-easy-parenting
python3 -m http.server 5173
Open http://localhost:5173

### VS Code Live Server
Open the folder in VS Code
Use Live Server on index.html

## Routes
- #/welcome (default)
- #/add-child (placeholder)
- #/signin (placeholder)
- #/privacy, #/terms, #/cookies (placeholders)

## Next steps
- Add AppState with persisted facts (users, activeUserId, children, pin, __meta).
- Implement guard pipeline stubs (auth → child → PIN → inactivity 5m) in router().
- Build Add Child and Sign in screens as real views.

UK English copy. WCAG 2.1 AA intent. Dot‑based SVG logo as placeholder.
