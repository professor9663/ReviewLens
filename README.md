# ReviewLens — Static Review Analytics

A browser-only project using HTML, CSS and vanilla JavaScript. No backend, database, sign-in, or paid service is required. Suitable for static hosting such as GitHub Pages.

## Features
- Dashboard KPIs, review activity chart, sentiment donut, recent reviews
- Separate Dashboard, Reviews, Sentiment Analysis, Products and Datasets views
- Search, sentiment/rating filters, sorting, pagination
- CSV/TSV/TXT and Excel file import with column mapping
- Five themes: Light, Dark, Midnight, Forest, Rose
- Export CSV, Excel workbook (.xlsx), JSON, TXT, HTML report, PDF, graph PNG and SVG
- CSV template, on-screen data preparation guide, touch ripple feedback, responsive layout
- Local-only processing; no account required

## Run
Extract the ZIP and open `index.html` in a modern browser, or use VS Code Live Server.

## Input format
Required column: review text. Optional columns: product, rating (1–5), date. Common headings such as `review_text`, `review`, `comment`, `feedback`, `product`, `rating`, and `date` are detected. Each row should contain one review. Use **Download CSV template** to get an example.

## Export notes
CSV, JSON, TXT, HTML, PNG and SVG exports are generated in-browser. Excel import/export uses the free SheetJS browser library from a CDN. PDF uses a free client-side PDF library; if unavailable, the browser print dialog opens and you can choose **Save as PDF**. CSV remains the fallback if the CDN is unavailable.

## Limitations
- Imported data is held in page memory and may be lost on refresh or closing the tab. Export important data before leaving.
- Sentiment analysis is a simple English keyword/rating heuristic, not a trained AI/ML model. It can misclassify sarcasm, nuanced language, or complex negation.
- Excel and PDF helper libraries load from public CDNs; the app has no server dependency.

## Motion and interaction
The interface includes staggered page entrances, hover lift on cards, button sheen/press feedback, chart entrance motion, animated word chips, upload drop-zone feedback, modal/toast transitions, and touch feedback. Motion is reduced automatically when the operating system requests reduced motion.
