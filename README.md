# ReviewLens — Customer Review Analysis System

ReviewLens is a static, multi-page-style customer review analytics workspace built with HTML, CSS and JavaScript. It runs in the browser and is suitable for GitHub Pages. There is no Streamlit, Python application backend, or database.

## Pages
- **Overview:** KPI cards, sentiment overview, rating distribution, recent reviews and a quick summary.
- **Reviews:** searchable review table, product/sentiment/rating filters and analyzed CSV export.
- **Sentiment:** sentiment charts, rating breakdown, frequent words and method limitations.
- **Products:** product counts, average rating comparison and product-level sentiment mix.
- **Data import:** load sample data, upload CSV, download sample CSV and see the expected format.
- **About:** project scope, technologies and limitations.

## Features
- Built-in English sample reviews and CSV upload
- Basic cleaning: blank reviews skipped, headers normalised, invalid ratings treated as missing
- Dictionary-based sentiment classification: Positive / Neutral / Negative
- KPI cards, average rating, charts and frequent words
- Search and product, sentiment, rating filters
- Export filtered rows with sentiment and word count
- Responsive layout, mobile navigation and page transitions
- Uploaded CSV is processed in-browser, not sent to an app backend

## Run locally
Open `index.html` in a modern browser with internet access. For best testing, use VS Code Live Server or run `python -m http.server 8000` in this folder and open `http://localhost:8000`. Python is only an optional static file server, not an application backend.

## GitHub Pages
Keep `index.html`, `styles.css`, `app.js`, `README.md`, `data/`, `docs/` and `tests/` at the repository root. In repository Settings → Pages select Deploy from a branch → `main` → `/(root)` → Save. The site is static; do not deploy it through Streamlit.

## CSV columns
Required: `review` (aliases `review_text` or `text` accepted). Optional: `rating` (1–5), `date`, `product`. Header matching is case-insensitive and spaces/hyphens are normalised. Blank review rows are skipped.

## Sentiment limitation
This is a transparent word-dictionary rule, not machine learning. Sarcasm, context, slang, unfamiliar words and complex negation may be misclassified. Sentiment labels are estimates and should not be used as the sole basis for business decisions.
