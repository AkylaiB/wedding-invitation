# Wedding Invitation

An interactive wedding invitation website, built as a static site for GitHub Pages.

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- No frameworks, build tools, or npm dependencies

## Project structure

```
wedding-invitation/
├── index.html
├── css/
│   ├── reset.css       # Base reset
│   ├── variables.css   # Design tokens (color, type, space)
│   └── global.css      # Layout & atmosphere
├── js/
│   └── main.js         # App entry (extend later)
├── assets/
│   ├── images/
│   └── icons/
└── README.md
```

## Local preview

Open `index.html` in a browser, or serve the folder with any static server:

```bash
# Example (Python)
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## GitHub Pages

Publish the repository root (or the `main` branch) as a GitHub Pages site. No build step is required.

## Roadmap

- [ ] Shell open animation
- [ ] Invitation details content
- [ ] RSVP form
- [ ] Couple photos & gallery assets
