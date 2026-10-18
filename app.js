// ReviewLens dashboard behavior, charts, and import/export utilities.
(() => {
  "use strict";

  const query = s => document.querySelector(s),
    queryAll = s => [...document.querySelectorAll(s)];
  const themeNames = {
    light: "Light",
    dark: "Dark",
    midnight: "Midnight",
    forest: "Forest",
    rose: "Rose"
  };
  const sampleReviews = [
    {
      text: "The sound is crisp and the battery lasts all day. Great value.",
      product: "Nova Buds",
      rating: 5,
      date: "2026-10-17"
    },
    {
      text: "Setup was easy and it connected instantly.",
      product: "Nova Buds",
      rating: 5,
      date: "2026-10-16"
    },
    {
      text: "Comfortable for long calls, but the case feels cheap.",
      product: "Nova Buds",
      rating: 3,
      date: "2026-10-16"
    },
    {
      text: "Audio quality is excellent. I love these earbuds.",
      product: "Nova Buds",
      rating: 5,
      date: "2026-10-15"
    },
    {
      text: "Battery life is terrible and one earbud stopped working.",
      product: "Nova Buds",
      rating: 1,
      date: "2026-10-14"
    },
    {
      text: "The design looks great and the fit is comfortable.",
      product: "Nova Buds",
      rating: 4,
      date: "2026-10-13"
    },
    {
      text: "Not worth the price. Sound is disappointing.",
      product: "Nova Buds",
      rating: 2,
      date: "2026-10-12"
    },
    {
      text: "Works as expected. Nothing special, nothing bad.",
      product: "Nova Buds",
      rating: 3,
      date: "2026-10-11"
    },
    {
      text: "Fast delivery, good packaging, and very helpful support.",
      product: "Pulse Bottle",
      rating: 5,
      date: "2026-10-17"
    },
    {
      text: "Keeps water cold for hours. Absolutely love it.",
      product: "Pulse Bottle",
      rating: 5,
      date: "2026-10-16"
    },
    {
      text: "The lid leaks in my bag. Not happy with this purchase.",
      product: "Pulse Bottle",
      rating: 1,
      date: "2026-10-15"
    },
    {
      text: "Looks nice and is easy to clean.",
      product: "Pulse Bottle",
      rating: 4,
      date: "2026-10-14"
    },
    {
      text: "Good size, but the cap is difficult to open.",
      product: "Pulse Bottle",
      rating: 3,
      date: "2026-10-13"
    },
    {
      text: "Excellent quality and great customer service.",
      product: "Pulse Bottle",
      rating: 5,
      date: "2026-10-12"
    },
    {
      text: "The bottle arrived damaged. Very frustrating.",
      product: "Pulse Bottle",
      rating: 1,
      date: "2026-10-10"
    },
    {
      text: "It is okay for the price. Does what it should.",
      product: "Pulse Bottle",
      rating: 3,
      date: "2026-10-09"
    },
    {
      text: "Super soft fabric and the color is beautiful.",
      product: "Cloud Tee",
      rating: 5,
      date: "2026-10-17"
    },
    {
      text: "The material feels cheap and shrank after washing.",
      product: "Cloud Tee",
      rating: 1,
      date: "2026-10-16"
    },
    {
      text: "Nice fit, although the sleeves are a little long.",
      product: "Cloud Tee",
      rating: 4,
      date: "2026-10-15"
    },
    {
      text: "Good quality, comfortable, and true to size.",
      product: "Cloud Tee",
      rating: 5,
      date: "2026-10-14"
    },
    {
      text: "The color is different from the pictures.",
      product: "Cloud Tee",
      rating: 2,
      date: "2026-10-13"
    },
    {
      text: "Average t-shirt. It is fine for everyday wear.",
      product: "Cloud Tee",
      rating: 3,
      date: "2026-10-12"
    },
    {
      text: "Very comfortable and great quality for the price.",
      product: "Cloud Tee",
      rating: 5,
      date: "2026-10-11"
    },
    {
      text: "Delivery was late, but the product is good.",
      product: "Cloud Tee",
      rating: 3,
      date: "2026-10-10"
    }
  ];
  const positiveWords = new Set(`
      good great excellent amazing love loved perfect best awesome fantastic
      wonderful happy helpful comfortable crisp easy fast beautiful value
      recommend reliable smooth quality nice useful durable impressed satisfied
      works
    `.trim().split(/\s+/));
  const negativeWords = new Set(`
      bad terrible awful hate hated poor disappointing broken damaged cheap worst
      slow late difficult frustrating useless uncomfortable leak leaking failed
      failure problem issue annoying return defective wrong expensive
    `.trim().split(/\s+/));
  const negators = new Set([
    "not", "no", "never", "hardly", "isn't", "wasn't",
    "don't", "doesn't", "didn't", "can't", "cannot"
  ]);
  const stopWords = new Set(`
      the a an and or but is was are were be been to of in on for with it this
      that i we they you my our their as at from have has had very really so just
      its
    `.trim().split(/\s+/));
  let reviews = [];
  let datasetName = "ReviewLens sample reviews";
  let isSample = true;
  let pendingRows = null;
  let pendingHeaders = [];
  let pageNum = 1;
  const pageSize = 8;
  let trendPoints = [];
  function getSentiment(text, rating) {
    const words = String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    let score = 0;
    words.forEach((word, index) => {
      const isNegated = negators.has(words[index - 1] || "");
      if (positiveWords.has(word)) score += isNegated ? -1 : 1;
      if (negativeWords.has(word)) score += isNegated ? 1 : -1;
    });
    if (!score && rating) score = rating >= 4 ? 1 : rating <= 2 ? -1 : 0;
    return score > 0 ? "Positive" : score < 0 ? "Negative" : "Neutral";
  }
  function normalizeReview(reviewData, index) {
    let rating = Number(reviewData.rating || 0);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) rating = 0;
    const rawDate = String(reviewData.date || "");
    return {
      id: index + 1,
      text: String(reviewData.text || "").trim() || "(No review text supplied)",
      product: String(reviewData.product || "Unspecified product").trim() || "Unspecified product",
      rating,
      date: rawDate && !isNaN(Date.parse(rawDate))
        ? new Date(rawDate).toISOString().slice(0, 10)
        : "",
      sentiment: getSentiment(reviewData.text, rating)
    };
  }
  function loadSampleDataset(shouldNotify = true) {
    reviews = sampleReviews.map(normalizeReview);
    datasetName = "ReviewLens sample reviews";
    isSample = true;
    pageNum = 1;
    renderDashboardPages();
    if (shouldNotify) notifyUser("Sample dataset loaded — explore the dashboard.");
  }
  function escapeHtml(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }
  function percentageOf(n, t) {
    return t ? Math.round(n / t * 100) : 0;
  }
  function averageRating(a) {
    const x = a.map(r => +r.rating).filter(n => n > 0);
    return x.length ? x.reduce((s, n) => s + n, 0) / x.length : 0;
  }
  function formatDate(s) {
    if (!s) return "—";
    let d = new Date(s + "T00:00:00");
    return isNaN(d) ? "—" : d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  function countSentiments(inputReviews = reviews) {
    const totals = {
      Positive: 0,
      Neutral: 0,
      Negative: 0
    };
    inputReviews.forEach(review => totals[review.sentiment]++);
    return totals;
  }
  function renderStars(rating) {
    const filledStars = Math.max(0, Math.min(5, Math.round(rating || 0)));
    const emptyStars = 5 - filledStars;
    const ratingLabel = rating ? Number(rating).toFixed(1) : "N/A";

    return [
      `<span class="rating-stars">${"★".repeat(filledStars)}${"☆".repeat(emptyStars)}</span>`,
      `<span class="rating-number">${ratingLabel}</span>`
    ].join("");
  }
  function renderReviewRow(review) {
    const avatar = escapeHtml(review.product.trim().charAt(0).toUpperCase());
    const text = escapeHtml(review.text);

    return [
      "<tr>",
      '<td><div class="review-cell">',
      `<span class="review-avatar">${avatar}</span>`,
      '<div class="review-text-wrap">',
      `<strong title="${text}">${text}</strong>`,
      `<small>Review #${review.id}</small>`,
      "</div></div></td>",
      `<td><span class="product-name">${escapeHtml(review.product)}</span></td>`,
      `<td>${renderStars(review.rating)}</td>`,
      `<td><span class="sentiment-badge ${review.sentiment.toLowerCase()}">${review.sentiment}</span></td>`,
      `<td class="date-cell">${formatDate(review.date)}</td>`,
      "</tr>"
    ].join("");
  }
  function renderEmptyRow(columnCount, title, note) {
    return [
      `<tr><td colspan="${columnCount}" class="empty-state">`,
      `<b>${escapeHtml(title)}</b>`,
      `<small>${escapeHtml(note)}</small>`,
      "</td></tr>"
    ].join("");
  }
  function getFilteredReviews() {
    const searchTerm = (query("#reviewSearch").value || "").trim().toLowerCase();
    const sentimentFilter = query("#sentimentFilter").value;
    const ratingFilter = query("#ratingFilter").value;
    const sortOrder = query("#sortReviews").value;

    const matchingReviews = reviews.filter(review => {
      const matchesSearch = !searchTerm ||
        `${review.text} ${review.product}`.toLowerCase().includes(searchTerm);
      const matchesSentiment = sentimentFilter === "all" || review.sentiment === sentimentFilter;
      const matchesRating = ratingFilter === "all" ||
        String(Math.round(review.rating)) === ratingFilter;

      return matchesSearch && matchesSentiment && matchesRating;
    });

    matchingReviews.sort((first, second) => {
      if (sortOrder === "oldest") {
        return (first.date || "").localeCompare(second.date || "");
      }
      if (sortOrder === "rating-high") return second.rating - first.rating;
      if (sortOrder === "rating-low") return first.rating - second.rating;
      return (second.date || "").localeCompare(first.date || "");
    });

    return matchingReviews;
  }
  function getChartColors() {
    let c = getComputedStyle(document.documentElement);
    return {
      text: c.getPropertyValue("--muted").trim(),
      grid: c.getPropertyValue("--border").trim(),
      accent: c.getPropertyValue("--accent").trim(),
      green: c.getPropertyValue("--green").trim(),
      red: c.getPropertyValue("--red").trim(),
      gray: "#a8b1c1",
      surface: c.getPropertyValue("--surface").trim()
    };
  }
  function drawCanvas(canvas, fn) {
    if (!canvas) return;
    let r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    let ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    fn(ctx, r.width, r.height, getChartColors());
  }
  function getTrendData() {
    let g = {};
    reviews.filter(r => r.date).forEach(r => g[r.date] = (g[r.date] || 0) + 1);
    return Object.keys(g).sort().slice(-8).map(date => ({
      label: new Date(date + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      }),
      value: g[date],
      date
    }));
  }
  function drawTrendChart(canvas, pts) {
    drawCanvas(canvas, (ctx, w, h, c) => {
      let l = 29,
        rr = 9,
        t = 13,
        b = 27,
        cw = w - l - rr,
        ch = h - t - b,
        max = Math.max(4, ...pts.map(p => p.value));
      ctx.font = "10px DM Sans";
      ctx.lineWidth = 1;
      ctx.strokeStyle = c.grid;
      ctx.fillStyle = c.text;
      for (let i = 0; i < 5; i++) {
        let y = t + ch * i / 4;
        ctx.beginPath();
        ctx.moveTo(l, y);
        ctx.lineTo(w - rr, y);
        ctx.stroke();
        ctx.fillText(String(Math.round(max * (1 - i / 4))), 2, y + 3);
      }
      if (!pts.length) return;
      let xy = pts.map((p, i) => ({
        x: l + (pts.length === 1 ? cw / 2 : i * cw / (pts.length - 1)),
        y: t + ch - p.value / max * ch
      }));
      let gr = ctx.createLinearGradient(0, t, 0, h - b);
      gr.addColorStop(0, c.accent + "40");
      gr.addColorStop(1, c.accent + "00");
      ctx.beginPath();
      xy.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.lineTo(xy.at(-1).x, h - b);
      ctx.lineTo(xy[0].x, h - b);
      ctx.closePath();
      ctx.fillStyle = gr;
      ctx.fill();
      ctx.beginPath();
      xy.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      xy.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = c.surface;
        ctx.fill();
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.fillStyle = c.text;
      ctx.textAlign = "center";
      let step = Math.max(1, Math.ceil(pts.length / 7));
      pts.forEach((p, i) => {
        if (i % step === 0 || i === pts.length - 1) ctx.fillText(p.label, xy[i].x, h - 8);
      });
      ctx.textAlign = "left";
    });
  }
  function drawSentimentDonut(canvas, cnt) {
    drawCanvas(canvas, (ctx, w, h, c) => {
      let vals = [cnt.Positive, cnt.Neutral, cnt.Negative],
        cols = [c.green, c.gray, c.red],
        total = vals.reduce((a, b) => a + b, 0),
        cx = w / 2,
        cy = h / 2,
        r = Math.min(w, h) * .39,
        inner = r * .68;
      if (!total) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = c.grid;
        ctx.lineWidth = r - inner;
        ctx.stroke();
        return;
      }
      let a = -Math.PI / 2;
      vals.forEach((v, i) => {
        let sw = v / total * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, a, a + sw);
        ctx.strokeStyle = cols[i];
        ctx.lineWidth = r - inner;
        ctx.stroke();
        a += sw;
      });
    });
  }
  function drawSentimentBars(canvas, cnt) {
    drawCanvas(canvas, (ctx, w, h, c) => {
      let es = [["Positive", cnt.Positive, c.green], ["Neutral", cnt.Neutral, c.gray], ["Negative", cnt.Negative, c.red]],
        l = 40,
        rr = 12,
        t = 15,
        b = 30,
        cw = w - l - rr,
        ch = h - t - b,
        max = Math.max(1, ...es.map(e => e[1]));
      ctx.font = "10px DM Sans";
      ctx.strokeStyle = c.grid;
      ctx.fillStyle = c.text;
      for (let i = 0; i < 5; i++) {
        let y = t + ch * i / 4;
        ctx.beginPath();
        ctx.moveTo(l, y);
        ctx.lineTo(w - rr, y);
        ctx.stroke();
        ctx.fillText(String(Math.round(max * (1 - i / 4))), 7, y + 3);
      }
      let bw = Math.min(60, cw / 5),
        gap = cw / 3;
      es.forEach((e, i) => {
        let x = l + gap * i + (gap - bw) / 2,
          bh = e[1] / max * ch,
          y = t + ch - bh;
        ctx.fillStyle = e[2];
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 6);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.fillStyle = c.text;
        ctx.fillText(e[0], x + bw / 2, h - 8);
        ctx.fillText(String(e[1]), x + bw / 2, Math.max(10, y - 6));
      });
      ctx.textAlign = "left";
    });
  }
  function getProductStats() {
    const productsByName = {};
    reviews.forEach(review => {
      const product = productsByName[review.product] || (productsByName[review.product] = {
        name: review.product,
        reviews: [],
        Positive: 0,
        Negative: 0
      });
      product.reviews.push(review);
      product[review.sentiment]++;
    });
    return Object.values(productsByName)
      .map(product => ({
        name: product.name,
        count: product.reviews.length,
        rating: averageRating(product.reviews),
        positive: product.Positive,
        negative: product.Negative
      }))
      .sort((first, second) => second.rating - first.rating || second.count - first.count);
  }
  function renderDashboard() {
    const sentiments = countSentiments();
    const reviewCount = reviews.length;
    const rating = averageRating(reviews);

    query("#kpiTotal").textContent = reviewCount.toLocaleString();
    query("#kpiPositive").textContent = `${percentageOf(sentiments.Positive, reviewCount)}%`;
    query("#kpiRating").innerHTML = rating
      ? `${rating.toFixed(1)} <small>/ 5</small>`
      : "— <small>/ 5</small>";
    query("#kpiNegative").textContent = sentiments.Negative;
    query("#positiveFoot").textContent = `${sentiments.Positive} positive reviews`;
    query("#donutTotal").textContent = reviewCount;
    query("#legendPositive").textContent = `${sentiments.Positive} · ${percentageOf(sentiments.Positive, reviewCount)}%`;
    query("#legendNeutral").textContent = `${sentiments.Neutral} · ${percentageOf(sentiments.Neutral, reviewCount)}%`;
    query("#legendNegative").textContent = `${sentiments.Negative} · ${percentageOf(sentiments.Negative, reviewCount)}%`;
    query("#datasetNotice").textContent = isSample
      ? "Showing the built-in sample dataset."
      : `Showing “${datasetName}” · ${reviewCount} reviews loaded in this session.`;

    const recentReviews = [...reviews]
      .sort((first, second) => (second.date || "").localeCompare(first.date || ""))
      .slice(0, 5);
    query("#recentReviews").innerHTML = recentReviews.length
      ? recentReviews.map(renderReviewRow).join("")
      : renderEmptyRow(5, "No reviews to show", "Import a dataset to get started.");
    trendPoints = getTrendData();
    drawTrendChart(query("#trendChart"), trendPoints);
    drawSentimentDonut(query("#sentimentChart"), sentiments);
  }
  function renderReviews() {
    const filteredReviews = getFilteredReviews();
    const sentiments = countSentiments(filteredReviews);
    const reviewCount = filteredReviews.length;
    const pageCount = Math.max(1, Math.ceil(reviewCount / pageSize));

    pageNum = Math.min(pageNum, pageCount);
    const firstResult = reviewCount ? (pageNum - 1) * pageSize + 1 : 0;
    query("#reviewCount").textContent = `${reviewCount} review${reviewCount === 1 ? "" : "s"}`;
    query("#reviewPositive").textContent = sentiments.Positive;
    query("#reviewNeutral").textContent = sentiments.Neutral;
    query("#reviewNegative").textContent = sentiments.Negative;

    const pageReviews = filteredReviews.slice((pageNum - 1) * pageSize, pageNum * pageSize);
    query("#allReviews").innerHTML = pageReviews.length
      ? pageReviews.map(renderReviewRow).join("")
      : renderEmptyRow(5, "No matching reviews", "Try another search or clear the filters.");
    query("#tableSummary").textContent = `Showing ${firstResult}–${Math.min(pageNum * pageSize, reviewCount)} of ${reviewCount} results`;
    query("#pageNumber").textContent = `${pageNum} / ${pageCount}`;
    query("#prevPage").disabled = pageNum <= 1;
    query("#nextPage").disabled = pageNum >= pageCount;
  }
  function renderSentiment() {
    const sentiments = countSentiments();
    const reviewCount = reviews.length;

    ["Positive", "Neutral", "Negative"].forEach(sentiment => {
      query(`#sentPage${sentiment}`).textContent = sentiments[sentiment];
      query(`#sentPage${sentiment}Pct`).textContent =
        `${percentageOf(sentiments[sentiment], reviewCount)}% of all reviews`;
    });
    drawSentimentBars(query("#sentimentBarChart"), sentiments);

    const topProduct = getProductStats()[0];
    const insights = [{
      icon: "↗",
      title: `${percentageOf(sentiments.Positive, reviewCount)}% positive sentiment`,
      description: sentiments.Positive >= sentiments.Negative
        ? "Positive feedback currently outweighs negative feedback."
        : "There is room to improve the customer experience."
    }, {
      icon: "!",
      title: `${sentiments.Negative} review${sentiments.Negative === 1 ? "" : "s"} need attention`,
      description: sentiments.Negative
        ? "Read negative reviews to identify recurring issues."
        : "No reviews were classified as negative."
    }, {
      icon: "★",
      title: topProduct ? `${topProduct.name} leads by average rating` : "No product ratings yet",
      description: topProduct
        ? `${topProduct.rating.toFixed(1)} average rating across ${topProduct.count} reviews.`
        : "Import product names and ratings to compare products."
    }];

    query("#insightList").innerHTML = insights.map(insight => `
      <div class="insight">
        <span>${insight.icon}</span>
        <div>
          <b>${escapeHtml(insight.title)}</b>
          <p>${escapeHtml(insight.description)}</p>
        </div>
      </div>
    `).join("");

    const wordFrequencies = {};
    reviews.forEach(review => {
      const words = review.text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/);

      words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
          wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
        }
      });
    });
    const popularWords = Object.entries(wordFrequencies)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 20);
    query("#wordCloud").innerHTML = popularWords.length
      ? popularWords.map(([word, count]) =>
        `<span class="word-chip">${escapeHtml(word)} <b>${count}</b></span>`
      ).join("")
      : "<span>No review text available.</span>";
  }
  function renderProducts() {
    const products = getProductStats();
    const ratedProducts = products.filter(product => product.rating > 0);
    const topProduct = ratedProducts[0];
    const lowestRatedProduct = [...ratedProducts]
      .sort((first, second) => first.rating - second.rating)[0];

    query("#productCount").textContent = products.length;
    query("#topProduct").textContent = topProduct?.name || "—";
    query("#topProductRating").textContent = topProduct
      ? `${topProduct.rating.toFixed(1)} / 5 average rating`
      : "No ratings yet";
    query("#lowProduct").textContent = lowestRatedProduct?.name || "—";
    query("#lowProductRating").textContent = lowestRatedProduct
      ? `${lowestRatedProduct.rating.toFixed(1)} / 5 average rating`
      : "No ratings yet";

    query("#productsTable").innerHTML = products.length
      ? products.map(renderProductRow).join("")
      : renderEmptyRow(6, "No products yet", "Import reviews with product names to compare performance.");
  }
  function renderProductRow(product) {
    const ratingWidth = product.rating / 5 * 100;
    const ratingLabel = product.rating ? product.rating.toFixed(1) : "—";

    return [
      "<tr>",
      `<td><b>${escapeHtml(product.name)}</b></td>`,
      `<td>${product.count}</td>`,
      `<td>${renderStars(product.rating)}</td>`,
      `<td class="green-text">${product.positive} (${percentageOf(product.positive, product.count)}%)</td>`,
      `<td class="red-text">${product.negative} (${percentageOf(product.negative, product.count)}%)</td>`,
      '<td><div class="product-score"><span class="score-track">',
      `<span style="width:${ratingWidth}%"></span>`,
      `</span><b>${ratingLabel}</b></div></td>`,
      "</tr>"
    ].join("");
  }
  function renderDataset() {
    query("#currentDatasetName").textContent = datasetName;
    query("#currentDatasetMeta").textContent = `${reviews.length} rows · ${isSample ? "Sample dataset" : "Imported for this session"}`;
  }
  function renderDashboardPages() {
    renderDashboard();
    renderReviews();
    renderSentiment();
    renderProducts();
    renderDataset();
  }
  function notifyUser(msg, type = "") {
    let e = document.createElement("div");
    e.className = "toast" + (type ? " " + type : "");
    e.textContent = msg;
    query("#toastRegion").appendChild(e);
    setTimeout(() => e.remove(), 3200);
  }
  function navigateToPage(p) {
    if (!["dashboard", "reviews", "sentiment", "products", "datasets"].includes(p)) p = "dashboard";
    queryAll(".page").forEach(e => e.classList.toggle("active", e.id === "page-" + p));
    queryAll(".nav-item").forEach(e => e.classList.toggle("active", e.dataset.page === p));
    query("#pageCrumb").textContent = {
      dashboard: "Dashboard",
      reviews: "Reviews",
      sentiment: "Sentiment analysis",
      products: "Products",
      datasets: "Datasets"
    }[p];
    query("#sidebar").classList.remove("open");
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    requestAnimationFrame(() => {
      if (p === "dashboard") {
        drawTrendChart(query("#trendChart"), trendPoints);
        drawSentimentDonut(query("#sentimentChart"), countSentiments());
      }
      if (p === "sentiment") drawSentimentBars(query("#sentimentBarChart"), countSentiments());
    });
  }
  function downloadFile(blob, name) {
    let u = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = u;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1500);
  }
  function toSafeFilename(s) {
    return String(s || "reviewlens").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "reviewlens";
  }
  function formatCsvCell(v) {
    let s = String(v ?? "");
    if (/^\s*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function getExportRows(k) {
    return k === "filtered" ? getFilteredReviews() : reviews;
  }
  function exportCSV(k = "all") {
    let d = getExportRows(k),
      lines = [["review_text", "product", "rating", "date", "sentiment"].map(formatCsvCell).join(","), ...d.map(r => [r.text, r.product, r.rating || "", r.date, r.sentiment].map(formatCsvCell).join(","))];
    downloadFile(new Blob(["\ufeff" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8"
    }), `${toSafeFilename(datasetName)}-${k}.csv`);
    notifyUser("CSV downloaded.");
  }
  function buildSummaryText() {
    const sentiments = countSentiments();
    const products = getProductStats();
    const average = averageRating(reviews);

    return [
      "ReviewLens — Review Analysis Report",
      `Dataset: ${datasetName}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "OVERVIEW",
      `Total reviews: ${reviews.length}`,
      `Average rating: ${average ? `${average.toFixed(2)}/5` : "Not available"}`,
      `Positive: ${sentiments.Positive} (${percentageOf(sentiments.Positive, reviews.length)}%)`,
      `Neutral: ${sentiments.Neutral} (${percentageOf(sentiments.Neutral, reviews.length)}%)`,
      `Negative: ${sentiments.Negative} (${percentageOf(sentiments.Negative, reviews.length)}%)`,
      "",
      "PRODUCT SCORECARD",
      ...products.map(product =>
        `${product.name}: ${product.count} reviews, average ${product.rating ? product.rating.toFixed(2) : "N/A"}, ${product.positive} positive, ${product.negative} negative`
      ),
      "",
      "METHODOLOGY",
      "Sentiment is estimated using simple English keyword and rating rules. It is not a trained AI model.",
      ""
    ].join("\n");
  }
  function exportJSON(k = "all") {
    downloadFile(new Blob([JSON.stringify({
      app: "ReviewLens",
      exportedAt: new Date().toISOString(),
      dataset: datasetName,
      summary: {
        total: reviews.length,
        averageRating: Number(averageRating(reviews).toFixed(2)),
        sentiment: countSentiments()
      },
      reviews: getExportRows(k)
    }, null, 2)], {
      type: "application/json"
    }), `${toSafeFilename(datasetName)}-${k}.json`);
    notifyUser("JSON downloaded.");
  }
  function exportTXT() {
    downloadFile(new Blob([buildSummaryText() + "\nREVIEWS\n" + reviews.map(r => `[${r.sentiment}] ${r.product} | ${r.rating || "N/A"}/5 | ${r.date || "No date"}\n${r.text}\n`).join("\n")], {
      type: "text/plain;charset=utf-8"
    }), `${toSafeFilename(datasetName)}-report.txt`);
    notifyUser("Text report downloaded.");
  }
  function exportHTML() {
    const sentiments = countSentiments();
    const reviewRows = reviews.map(review => [
      "<tr>",
      `<td>${escapeHtml(review.text)}</td>`,
      `<td>${escapeHtml(review.product)}</td>`,
      `<td>${review.rating || "N/A"}</td>`,
      `<td>${review.sentiment}</td>`,
      `<td>${escapeHtml(review.date)}</td>`,
      "</tr>"
    ].join("")).join("");

    const html = [
      "<!doctype html>",
      '<html lang="en">',
      "<head>",
      '  <meta charset="utf-8">',
      "  <title>ReviewLens report</title>",
      "  <style>",
      "    body { font: 14px Arial; max-width: 1000px; margin: 40px auto; color: #182230; }",
      "    h1 { color: #4669e8; }",
      "    table { width: 100%; border-collapse: collapse; }",
      "    td, th { text-align: left; padding: 9px; border-bottom: 1px solid #ddd; font-size: 12px; }",
      "    th { background: #f3f5f9; }",
      "  </style>",
      "</head>",
      "<body>",
      "  <h1>ReviewLens report</h1>",
      `  <p>Dataset: ${escapeHtml(datasetName)} · ${new Date().toLocaleString()}</p>`,
      "  <h2>Overview</h2>",
      `  <p>Total reviews: ${reviews.length} · Average rating: ${averageRating(reviews).toFixed(2)}/5</p>`,
      `  <p>Positive: ${sentiments.Positive} · Neutral: ${sentiments.Neutral} · Negative: ${sentiments.Negative}</p>`,
      "  <h2>Reviews</h2>",
      "  <table>",
      "    <thead><tr><th>Review</th><th>Product</th><th>Rating</th><th>Sentiment</th><th>Date</th></tr></thead>",
      `    <tbody>${reviewRows}</tbody>`,
      "  </table>",
      "  <p><small>Sentiment uses simple English keyword and rating rules.</small></p>",
      "</body>",
      "</html>"
    ].join("\n");

    downloadFile(new Blob([html], {
      type: "text/html;charset=utf-8"
    }), `${toSafeFilename(datasetName)}-report.html`);
    notifyUser("HTML report downloaded.");
  }
  function exportXLSX(k = "all") {
    if (!window.XLSX) {
      notifyUser("Excel export needs internet to load the free XLSX helper. CSV still works offline.", "error");
      return;
    }
    const workbook = XLSX.utils.book_new();
    const sentiments = countSentiments();
    const exportRows = getExportRows(k);
    const reviewSheet = [
      ["ReviewLens export"],
      ["Dataset", datasetName],
      ["Exported", new Date().toLocaleString()],
      [],
      ["Review text", "Product", "Rating", "Date", "Sentiment"],
      ...exportRows.map(review => [
        review.text,
        review.product,
        review.rating || "",
        review.date,
        review.sentiment
      ])
    ];
    const summarySheet = [
      ["Metric", "Value"],
      ["Total reviews", reviews.length],
      ["Average rating", Number(averageRating(reviews).toFixed(2))],
      ["Positive", sentiments.Positive],
      ["Neutral", sentiments.Neutral],
      ["Negative", sentiments.Negative]
    ];
    const productSheet = [
      ["Product", "Reviews", "Average rating", "Positive", "Negative"],
      ...getProductStats().map(product => [
        product.name,
        product.count,
        Number(product.rating.toFixed(2)),
        product.positive,
        product.negative
      ])
    ];

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(reviewSheet), "Reviews");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summarySheet), "Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(productSheet), "Products");
    XLSX.writeFile(workbook, `${toSafeFilename(datasetName)}-${k}.xlsx`);
    notifyUser("Excel workbook downloaded.");
  }
  function exportPDF() {
    if (!window.jspdf?.jsPDF) {
      window.print();
      notifyUser("In the print dialog choose Save as PDF.");
      return;
    }
    let {
        jsPDF
      } = window.jspdf,
      doc = new jsPDF({
        orientation: "landscape"
      }),
      c = countSentiments();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ReviewLens — Review Analysis", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Dataset: ${datasetName}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Reviews: ${reviews.length}    Average rating: ${averageRating(reviews).toFixed(2)}/5    Positive: ${c.Positive}    Neutral: ${c.Neutral}    Negative: ${c.Negative}`, 14, 43);
    if (doc.autoTable) doc.autoTable({
      startY: 50,
      head: [["Review", "Product", "Rating", "Sentiment", "Date"]],
      body: reviews.map(r => [r.text, r.product, r.rating || "N/A", r.sentiment, r.date || "—"]),
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [70, 105, 232]
      },
      columnStyles: {
        0: {
          cellWidth: 115
        },
        1: {
          cellWidth: 35
        }
      }
    });
    doc.save(`${toSafeFilename(datasetName)}-report.pdf`);
    notifyUser("PDF report downloaded.");
  }
  function exportProductsCSV() {
    let ps = getProductStats(),
      rows = [["Product", "Reviews", "Average rating", "Positive", "Negative"], ...ps.map(p => [p.name, p.count, p.rating.toFixed(2), p.positive, p.negative])];
    downloadFile(new Blob(["\ufeff" + rows.map(r => r.map(formatCsvCell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8"
    }), "reviewlens-products.csv");
    notifyUser("Product scorecard downloaded.");
  }
  function exportByFormat(f, k) {
    if (k === "products" && f === "csv") return exportProductsCSV();
    if (k === "products" && f === "xlsx") return exportXLSX("all");
    if (k === "summary") {
      if (f === "txt") return exportTXT();
      if (f === "pdf") return exportPDF();
      if (f === "html") return exportHTML();
      if (f === "json") return exportJSON("all");
    }
    if (f === "csv") exportCSV(k);else if (f === "xlsx") exportXLSX(k);else if (f === "json") exportJSON(k);else if (f === "txt") exportTXT();else if (f === "html") exportHTML();else if (f === "pdf") exportPDF();
  }
  function openExportDialog(k = "all") {
    query("#exportContent").value = k;
    query("#exportModal").classList.remove("hidden");
    query("#confirmExport").focus();
  }
  function closeExportDialog() {
    query("#exportModal").classList.add("hidden");
  }
  function exportChart(id, fmt = "png") {
    let canvas = query("#" + id);
    if (!canvas) return notifyUser("Chart is not available yet.", "error");
    if (fmt === "svg") {
      let c = getChartColors(),
        w = 760,
        h = 300,
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${c.surface}"/><text x="25" y="25" font-family="Arial" font-size="16" fill="${c.text}">ReviewLens chart export</text>`;
      if (id === "trendChart") {
        let pts = trendPoints,
          max = Math.max(1, ...pts.map(p => p.value)),
          xy = pts.map((p, i) => ({
            x: 45 + i * 670 / Math.max(1, pts.length - 1),
            y: 245 - p.value / max * 170,
            label: p.label
          }));
        for (let i = 0; i < 5; i++) svg += `<line x1="45" y1="${75 + i * 42}" x2="725" y2="${75 + i * 42}" stroke="${c.grid}"/>`;
        svg += `<polyline points="${xy.map(p => p.x + "," + p.y).join(" ")}" fill="none" stroke="${c.accent}" stroke-width="3"/>`;
        xy.forEach(p => svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${c.accent}"/><text x="${p.x}" y="270" text-anchor="middle" font-size="10" fill="${c.text}">${escapeHtml(p.label)}</text>`);
      } else {
        let v = countSentiments(),
          e = [["Positive", v.Positive, c.green], ["Neutral", v.Neutral, c.gray], ["Negative", v.Negative, c.red]],
          max = Math.max(1, ...e.map(x => x[1]));
        e.forEach((x, i) => {
          let xx = 140 + i * 170,
            bh = x[1] / max * 175,
            yy = 245 - bh;
          svg += `<rect x="${xx}" y="${yy}" width="70" height="${bh}" rx="6" fill="${x[2]}"/><text x="${xx + 35}" y="270" text-anchor="middle" font-size="12" fill="${c.text}">${x[0]}</text><text x="${xx + 35}" y="${yy - 8}" text-anchor="middle" font-size="12" fill="${c.text}">${x[1]}</text>`;
        });
      }
      svg += "</svg>";
      downloadFile(new Blob([svg], {
        type: "image/svg+xml"
      }), `reviewlens-${id}.svg`);
      notifyUser("SVG chart downloaded.");
      return;
    }
    let a = document.createElement("a");
    a.download = `reviewlens-${id}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
    notifyUser("PNG chart downloaded.");
  }
  function parseDelimitedText(text, delim) {
    let out = [],
      row = [],
      f = "",
      q = false;
    for (let i = 0; i < text.length; i++) {
      let ch = text[i];
      if (ch === '"') {
        if (q && text[i + 1] === '"') {
          f += '"';
          i++;
        } else q = !q;
      } else if (ch === delim && !q) {
        row.push(f);
        f = "";
      } else if ((ch === "\n" || ch === "\r") && !q) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(f);
        if (row.some(v => String(v).trim())) out.push(row);
        row = [];
        f = "";
      } else f += ch;
    }
    row.push(f);
    if (row.some(v => String(v).trim())) out.push(row);
    return out;
  }
  function guessColumnIndex(headers, keys) {
    let h = headers.map(x => String(x).toLowerCase().trim()),
      i = h.findIndex(x => keys.some(k => x === k));
    return i < 0 ? h.findIndex(x => keys.some(k => x.includes(k))) : i;
  }
  function showColumnMapping(headers, rows, fileName) {
    pendingHeaders = headers;
    pendingRows = {
      rows,
      fileName
    };
    const definitions = [
      ["mapText", ["review text", "review_text", "review", "comment", "feedback", "text"], true],
      ["mapProduct", ["product", "product name", "product_name", "item", "name"], false],
      ["mapRating", ["rating", "stars", "score"], false],
      ["mapDate", ["date", "review date", "review_date", "created_at"], false]
    ];
    definitions.forEach(([id, keys, required]) => {
      let el = query("#" + id);
      el.innerHTML = (required ? "" : '<option value="-1">Not provided</option>') +
        headers.map((header, index) =>
          `<option value="${index}">${escapeHtml(header || `Column ${index + 1}`)}</option>`
        ).join("");
      const guessedIndex = guessColumnIndex(headers, keys);
      el.value = guessedIndex >= 0 ? String(guessedIndex) : required ? "0" : "-1";
    });
    query("#mappingPreview").textContent = `Preview: ${rows.length} data rows detected. First row: ${headers.map((h, i) => `${h}: ${rows[0]?.[i] || "—"}`).join(" · ")}`;
    query("#mappingPanel").classList.remove("hidden");
    query("#mappingPanel").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
  function updateUploadStatus(msg, type = "") {
    let e = query("#uploadStatus");
    e.textContent = msg;
    e.className = "upload-status" + (type ? " " + type : "");
  }
  async function handleUploadedFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return updateUploadStatus("File is larger than 10 MB. Choose a smaller file.", "error");
    let ext = file.name.split(".").pop().toLowerCase();
    try {
      let matrix;
      if (["xlsx", "xls"].includes(ext)) {
        if (!window.XLSX) return updateUploadStatus("Excel reading needs internet to load the free XLSX helper. Save the sheet as CSV and upload it instead.", "error");
        let wb = XLSX.read(await file.arrayBuffer(), {
          type: "array"
        });
        matrix = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
          header: 1,
          defval: ""
        });
      } else {
        let text = await file.text(),
          first = text.split(/\r?\n/).find(x => x.trim()) || "",
          d = first.includes("\t") ? "\t" : first.includes(";") && !first.includes(",") ? ";" : ",";
        matrix = parseDelimitedText(text, d);
      }
      if (!matrix || matrix.length < 2) return updateUploadStatus("File looks empty. Add a header row and at least one review.", "error");
      let headers = matrix[0].map((x, i) => String(x || `Column ${i + 1}`).trim()),
        rows = matrix.slice(1).filter(r => r.some(x => String(x).trim()));
      if (!rows.length) return updateUploadStatus("No review rows found beneath column headings.", "error");
      showColumnMapping(headers, rows, file.name);
      updateUploadStatus(`${file.name} loaded. Confirm the column mapping below to finish importing.`, "success");
    } catch (e) {
      console.error(e);
      updateUploadStatus("Could not read this file. Try exporting it as UTF-8 CSV and upload again.", "error");
    }
  }
  function confirmReviewImport() {
    if (!pendingRows || !pendingHeaders.length) return;
    let f = {
      text: +query("#mapText").value,
      product: +query("#mapProduct").value,
      rating: +query("#mapRating").value,
      date: +query("#mapDate").value
    };
    if (f.text < 0) return notifyUser("Choose the review text column first.", "error");
    reviews = pendingRows.rows.map((r, i) => normalizeReview({
      text: r[f.text],
      product: f.product >= 0 ? r[f.product] : "Unspecified product",
      rating: f.rating >= 0 ? r[f.rating] : "",
      date: f.date >= 0 ? r[f.date] : ""
    }, i));
    datasetName = pendingRows.fileName || "Imported reviews";
    isSample = false;
    pageNum = 1;
    pendingRows = null;
    pendingHeaders = [];
    query("#mappingPanel").classList.add("hidden");
    query("#fileInput").value = "";
    renderDashboardPages();
    updateUploadStatus(`Successfully imported ${reviews.length} reviews from ${datasetName}.`, "success");
    notifyUser(`${reviews.length} reviews imported and analysed.`);
    navigateToPage("dashboard");
  }
  function downloadCsvTemplate() {
    let t = 'review_text,product,rating,date\n"Battery lasts all day",Nova Buds,5,2026-10-12\n"Sound is disappointing",Nova Buds,2,2026-10-13\n"Comfortable and great quality",Cloud Tee,4,2026-10-14\n';
    downloadFile(new Blob(["\ufeff" + t], {
      type: "text/csv;charset=utf-8"
    }), "reviewlens-csv-template.csv");
    notifyUser("CSV template downloaded.");
  }
  function setTheme(t) {
    if (!themeNames[t]) t = "light";
    document.documentElement.dataset.theme = t;
    query("#themeLabel").textContent = themeNames[t];
    try {
      localStorage.setItem("reviewlens-theme", t);
    } catch {}
    query("#themeMenu").classList.add("hidden");
    requestAnimationFrame(() => {
      drawTrendChart(query("#trendChart"), trendPoints);
      drawSentimentDonut(query("#sentimentChart"), countSentiments());
      drawSentimentBars(query("#sentimentBarChart"), countSentiments());
    });
  }
  function bindEventHandlers() {
    queryAll("[data-page]").forEach(e => e.addEventListener("click", () => navigateToPage(e.dataset.page)));
    query("#themeTrigger").addEventListener("click", () => query("#themeMenu").classList.toggle("hidden"));
    queryAll("[data-theme-choice]").forEach(e => e.addEventListener("click", () => setTheme(e.dataset.themeChoice)));
    document.addEventListener("click", e => {
      if (!e.target.closest(".theme-wrap")) query("#themeMenu").classList.add("hidden");
    });
    query("#menuToggle").addEventListener("click", () => query("#sidebar").classList.toggle("open"));
    query("#quickExport").onclick = () => openExportDialog("all");
    query("#dashboardExport").onclick = () => openExportDialog("summary");
    query("#reviewsExport").onclick = () => exportCSV("filtered");
    query("#sentimentPageExport").onclick = () => openExportDialog("summary");
    query("#productsExport").onclick = exportProductsCSV;
    query("#datasetExport").onclick = () => openExportDialog("all");
    query("#trendExport").onclick = () => exportChart("trendChart", "png");
    query("#trendSvgExport").onclick = () => exportChart("trendChart", "svg");
    query("#sentimentExport").onclick = () => exportChart("sentimentChart", "png");
    query("#sentimentSvgExport").onclick = () => exportChart("sentimentChart", "svg");
    query("#sentimentPageGraphExport").onclick = () => exportChart("sentimentBarChart", "png");
    query("#sentimentPageSvgExport").onclick = () => exportChart("sentimentBarChart", "svg");
    query("#wordsExport").onclick = () => {
      let t = [...query("#wordCloud").querySelectorAll(".word-chip")].map(e => e.textContent.trim()).join("\n");
      downloadFile(new Blob([t || "No word summary available"], {
        type: "text/plain"
      }), "reviewlens-word-summary.txt");
      notifyUser("Word summary downloaded.");
    };
    query("#exportModal").addEventListener("click", e => {
      if (e.target === query("#exportModal")) closeExportDialog();
    });
    query("#closeExport").onclick = closeExportDialog;
    query("#cancelExport").onclick = closeExportDialog;
    query("#confirmExport").onclick = () => {
      let f = query("#exportFormat").value,
        k = query("#exportContent").value;
      closeExportDialog();
      exportByFormat(f, k);
    };
    ["reviewSearch", "sentimentFilter", "ratingFilter", "sortReviews"].forEach(id => query("#" + id).addEventListener(id === "reviewSearch" ? "input" : "change", () => {
      pageNum = 1;
      renderReviews();
    }));
    query("#clearFilters").onclick = () => {
      query("#reviewSearch").value = "";
      query("#sentimentFilter").value = query("#ratingFilter").value = "all";
      query("#sortReviews").value = "newest";
      pageNum = 1;
      renderReviews();
    };
    query("#prevPage").onclick = () => {
      pageNum = Math.max(1, pageNum - 1);
      renderReviews();
    };
    query("#nextPage").onclick = () => {
      pageNum++;
      renderReviews();
    };
    query("#fileInput").onchange = e => handleUploadedFile(e.target.files[0]);
    let dz = query("#dropZone");
    ["dragenter", "dragover"].forEach(n => dz.addEventListener(n, e => {
      e.preventDefault();
      dz.classList.add("dragover");
    }));
    ["dragleave", "drop"].forEach(n => dz.addEventListener(n, e => {
      e.preventDefault();
      dz.classList.remove("dragover");
    }));
    dz.addEventListener("drop", e => handleUploadedFile(e.dataTransfer.files[0]));
    query("#confirmImport").onclick = confirmReviewImport;
    query("#cancelMapping").onclick = () => {
      query("#mappingPanel").classList.add("hidden");
      pendingRows = null;
      pendingHeaders = [];
    };
    query("#downloadTemplate").onclick = downloadCsvTemplate;
    query("#sampleDataButton").onclick = () => loadSampleDataset();
    query("#resetSample").onclick = () => loadSampleDataset();
    query("#clearDataButton").onclick = () => {
      reviews = [];
      datasetName = "Empty dataset";
      isSample = false;
      renderDashboardPages();
      updateUploadStatus("Current dataset cleared. Import a file or load sample data to continue.");
      notifyUser("Dataset cleared.");
    };
    query("#copyExample").onclick = async () => {
      let x = 'review_text,product,rating,date\n"Battery lasts all day",Nova Buds,5,2026-10-12\n"Sound is disappointing",Nova Buds,2,2026-10-13';
      try {
        await navigator.clipboard.writeText(x);
        notifyUser("CSV example copied.");
      } catch {
        notifyUser("Copy is blocked by this browser. You can copy the example shown on screen.", "error");
      }
    };
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        closeExportDialog();
        query("#themeMenu").classList.add("hidden");
        query("#sidebar").classList.remove("open");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navigateToPage("reviews");
        query("#reviewSearch").focus();
      }
    });
    document.addEventListener("pointerdown", e => {
      let t = e.target.closest("button,.drop-zone,.nav-item");
      if (!t || t.disabled) return;
      t.classList.add("ripple");
      let r = t.getBoundingClientRect(),
        s = Math.max(r.width, r.height) * .8,
        ink = document.createElement("span");
      ink.className = "ripple-ink";
      ink.style.width = ink.style.height = s + "px";
      ink.style.left = e.clientX - r.left - s / 2 + "px";
      ink.style.top = e.clientY - r.top - s / 2 + "px";
      t.append(ink);
      setTimeout(() => ink.remove(), 600);
      t.classList.add("pulse-flash");
      setTimeout(() => t.classList.remove("pulse-flash"), 300);
    });
    window.addEventListener("resize", () => {
      if (query("#page-dashboard").classList.contains("active")) {
        drawTrendChart(query("#trendChart"), trendPoints);
        drawSentimentDonut(query("#sentimentChart"), countSentiments());
      }
      if (query("#page-sentiment").classList.contains("active")) drawSentimentBars(query("#sentimentBarChart"), countSentiments());
    });
  }
  function initializeDashboard() {
    bindEventHandlers();
    let t = "light";
    try {
      t = localStorage.getItem("reviewlens-theme") || "light";
    } catch {}
    setTheme(t);
    loadSampleDataset(false);
  }
  document.addEventListener("DOMContentLoaded", initializeDashboard);
})();
