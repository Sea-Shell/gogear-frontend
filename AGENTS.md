# GoGear Frontend — Conventions

## Commit messages

This repo uses **semantic-release** to automate versioning and deployments. Only commits prefixed with recognized types trigger a release:

| Type | Release | Example |
|------|---------|---------|
| `fix:` | Patch (v0.0.x) | `fix: correct hero text color token` |
| `feat:` | Minor (v0.x.0) | `feat: add gear comparison view` |
| `BREAKING CHANGE` or `!` | Major (vx.0.0) | `feat!: redesign API client` |

Other prefixes like `chore:`, `docs:`, `refactor:`, `polish:`, `style:`, `test:` do **not** trigger releases. If your changes need to ship to production, use `fix:` or `feat:`.

Commits are linted on PR via `semantic-release --dry-run`. A failing commit message blocks the PR.

## Commit format

```
type(scope?): short description

body (optional)
```

Examples:
- `fix(a11y): add aria-label to icon buttons`
- `feat(gear): add gear comparison view`
- `fix: restore WCAG AA contrast on checkbox label`
