# Oakwood Quality Gates (Welcome Screen)

## Sequence
1) Pre-flight (automated checks)
2) Approval (human sign-off)
3) Stop point (blocks progression if 1 or 2 fail)

## Roles
- Product, Design, Security, Accessibility, Legal

## Run
- `npm run preflight`
- `npm run approve` (fills APPROVALS.json)
- `npm run gate` (fails if approvals missing)

## Router guard hooks
Auth → Child selected → PIN → Inactivity (5m) — stubs in `src/router.js`. Fill logic per route as we implement screens.
