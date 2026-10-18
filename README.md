# ReviewLens — Customer Review Analysis System

Static beginner-friendly BCA project. No Streamlit, Python backend, database, or server-side processing is needed.

## Features
- Built-in English sample reviews and CSV upload
- Basic cleaning: blank reviews skipped, headers normalised, invalid ratings treated as missing
- Word-dictionary sentiment: Positive / Neutral / Negative
- KPI cards, average valid rating, sentiment and rating charts, frequent words
- Product, sentiment, rating and text-search filters
- Export currently filtered rows as analyzed CSV
- Responsive design

## Run
Open `index.html` in a modern browser with internet access. For best local testing, use VS Code Live Server or run `python -m http.server 8000` in this folder and open `http://localhost:8000`. Python is only an optional static file server, not an app backend.

## GitHub Pages
Upload the contents of this folder to the repository root. Go to Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save. The entry file is `index.html`; do not use Streamlit deployment.

## CSV columns
Required: `review` (aliases `review_text` or `text` accepted). Optional: `rating` (1–5), `date`, `product`. The file is processed in the browser. Do not commit confidential reviews to a public repository.

## Sentiment limitation
This is a transparent word-dictionary rule, not machine learning. Sarcasm, context, slang, unfamiliar words and complex negation may be misclassified. Review labels are estimates.
