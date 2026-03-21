# Static documentation site

Plain **HTML**, **CSS**, and **JS** with no build step. Use any static host (see `docs/plans/SITE_PUBLISHING_PLAN.mdc`).

## Files

| File | Role |
|------|------|
| `index.html` | Landing page |
| `dev.html` | Developer documentation |
| `api.html` | Admin-Ajax API reference |
| `assets/css/main.css` | Layout, theme tokens in `:root` |
| `assets/js/main.js` | Mobile navigation |

## Retheming

1. Edit CSS variables at the top of `assets/css/main.css` (`--bg`, `--accent`, fonts).
2. Swap Google Fonts links in each HTML `<head>` or remove them for system fonts only.
3. Shared header/footer are duplicated per page so you can later move to a static generator or PHP includes without lock-in.

## Local preview

From this directory:

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/`. Relative paths assume the site root is `docs/site/`.
