// One person's page: every material about him, grouped by kind. The data (P) is written into the page itself.
const FMT = {pdf:["📕","PDF","#e11d48","#fde8ec"],word:["📘","Word","#2563eb","#e8eefd"],ppt:["🖥️","מצגת","#ea580c","#fdece0"],
  video:["🎬","סרטון","#dc2626","#fde8e8"],game:["🎮","משחק מקוון","#7c3aed","#f1eafe"],web:["🔗","קישור","#4f46e5","#eceafd"],
  folder:["📁","תיקייה","#ca8a04","#fdf6e0"],excel:["📗","Excel","#16a34a","#e7f7ec"],image:["🖼️","תמונה","#0d9488","#e0f5f1"],
  audio:["🎵","שמע","#0891b2","#e0f5fa"],gamma:["🖥️","Gamma","#9333ea","#f3e8ff"]};
const VERB = {gamma:"פתחו מצגת", pdf:"PDF להדפסה", word:"Word לעריכה", ppt:"פתחו מצגת", video:"▶ צפו בסרטון", game:"🎮 שחקו",
  web:"פתחו קישור", folder:"פתחו תיקייה", excel:"פתחו Excel", image:"צפו בתמונה", audio:"▶ האזינו"};
FMT.article = ["📖", "מאמר", "#7c2d12", "#fdf0e6"]; VERB.article = "📖 קראו את המאמר"; FMT.all = ["📚", "כל החומרים", "#4c1d95", "#efe7fd"]; VERB.all = "📚 כל החומרים במקום אחד";   // an article (21.10)
const CATCOL = {lesson:["#4f46e5","#e9e8fd"], pres:["#ea580c","#fdeadb"], work:["#2563eb","#e3ecfd"], test:["#e11d48","#fde4ea"],
  game:["#7c3aed","#efe6fe"], story:["#0d9488","#dcf3ef"], art:["#db2777","#fce4f1"], summary:["#16a34a","#e2f5e8"], more:["#64748b","#eceff4"]};
const FILTERS = [["","הכל"],["pdf","להדפסה"],["word","לעריכה"],["ppt","מצגות"],["video","סרטונים"],["game","משחקים"]];
const PAGE = 24, TOP = 6;   // TOP: materials with o 1..6 also open the page, under "מומלצים לשיעור"
let state = {q: "", fmt: "", g: ""}, opened = {};   // g: a guide button – only that story / kind / age (22.10)
P.items.forEach((it, i) => it._i = i);
const GUIDE = P.guide || {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm = s => String(s).replace(/[֑-ׇ]/g, "").toLowerCase();
const kindOf = f => f.f.replace("achiya:", "");

// a file kept in git (a *-files repo on GitHub Pages): Word / PowerPoint open in the Office viewer
const inGit = u => /^https:\/\/yudataub\.github\.io\//.test(u);
function viewHref(f) {
  if (!inGit(f.u)) return f.u;
  const lim = f.f === "excel" ? 5e6 : 10e6;
  return ["word", "ppt", "excel"].includes(f.f) && f.b && f.b <= lim ? "https://view.officeapps.live.com/op/view.aspx?src=" + encodeURIComponent(f.u) : f.u;
}
function thumbOf(it) {
  if (it.im) return {src: /^https?:/.test(it.im) ? it.im : "../" + it.im, wide: /\/gamma\//.test(it.im), u: viewHref(it.files[0])};
  for (const f of it.files) {
    const y = f.u.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/);
    if (y) return {src: `https://i.ytimg.com/vi/${y[1]}/hqdefault.jpg`, wide: true, u: f.u};
    const d = f.f !== "folder" && f.u.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|(?:document|presentation|spreadsheets)\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    if (d) return {src: `https://drive.google.com/thumbnail?id=${d[1]}&sz=w480`, wide: kindOf(f) === "ppt", u: viewHref(f)};
  }
  return null;
}
function btnHtml(f) {
  const ach = f.f.startsWith("achiya:"), k = kindOf(f), m = FMT[k] || FMT.web;
  let text = ach ? (k !== "web" ? m[1] + " · באתר אחיה" : "באתר אחיה") : (VERB[k] || m[1]);
  if (f.l) text = esc(f.l);   // a label of its own: "פתחו את המצגת" / "קראו את הסיפור" (story decks, 22.10)
  const href = viewHref(f);
  return `<a class="btn" style="color:${m[2]};background:${m[3]};border-color:${m[3]}" href="${esc(href)}" target="_blank" rel="noopener">${text}${f.z ? `<span class="sz">· ${esc(f.z)}</span>` : ""}</a>` +
    (href !== f.u ? `<a class="btn dl" href="${esc(f.u)}" download title="הורדת הקובץ">⬇️</a>` : "");
}
// the teachers' shared rating (ratings.js, the same Firestore store and ids as the catalog engine); "my" ratings
// are kept under the catalog's own localStorage key, so a material rated in the catalog shows as rated here too
const LS_MINE = "cat2_גדולי ישראל_mine";
let MINE = {}; try { MINE = JSON.parse(localStorage.getItem(LS_MINE)) || {}; } catch (e) {}
const keyOf = it => it.files[0].id;
const idsOf = it => it.files.map(f => f.id).concat(it.dup || []);
const BYKEY = {}; P.items.forEach(i => BYKEY[keyOf(i)] = i);
function rating(it) {
  const R = window.__ratingsApi && window.__ratingsApi.ratingsCache;
  let sum = 0, count = 0;
  if (R) idsOf(it).forEach(id => { const r = R.get(id); if (r) { sum += r.sum || 0; count += r.count || 0; } });
  return {avg: count ? sum / count : 0, count};
}
const rateText = r => r.count ? `★ ${r.avg.toFixed(1)} (${r.count})` : "☆ דרגו";
let rankedByRatings = false;   // once: the ratings of all the page's materials, so a rated material moves up (22.10)
async function loadRatings() {
  const api = window.__ratingsApi; if (!api) return;
  if (!rankedByRatings) {
    rankedByRatings = true;
    await api.fetchRatings(P.items.slice(0, 1500).flatMap(idsOf));
    if (P.items.some(i => rating(i).count)) return render();
  }
  const ids = [...document.querySelectorAll(".card[data-id]")].slice(0, 400).flatMap(c => BYKEY[c.dataset.id] ? idsOf(BYKEY[c.dataset.id]) : []);
  await api.fetchRatings(ids);
  document.querySelectorAll(".card[data-id]").forEach(c => {
    const it = BYKEY[c.dataset.id], b = c.querySelector(".rate"); if (!it || !b) return;
    const r = rating(it); b.textContent = rateText(r); b.classList.toggle("has", !!r.count);
  });
}
window.addEventListener("ratings-ready", loadRatings);

function cardHtml(it) {
  const m = FMT[kindOf(it.files[0])] || FMT.web, t = thumbOf(it);
  const fb = `<span class="fb" style="background:${m[3]}">${m[0]}</span>`;
  const th = t ? `<a class="th${t.wide ? " wide" : ""}" href="${esc(t.u)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">` +
      `<img src="${esc(t.src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg')">${fb}</a>`
    : `<a class="th noimg" href="${esc(viewHref(it.files[0]))}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${fb}</a>`;
  const k = keyOf(it), mine = MINE[k] || 0, r = rating(it);
  const stars = [1, 2, 3, 4, 5].map(v => `<button class="${v <= mine ? "on" : ""}" data-rate="${v}" aria-label="דירוג ${v}">★</button>`).join("");
  return `<div class="card" data-id="${esc(k)}">${th}<div class="body"><div class="name" title="${esc(it.t)}">${esc(it.t)}</div>${it.d ? `<div class="desc" tabindex="0" title="${esc(it.d)}">${esc(it.d)}</div>` : ""}
    <div class="rates"><button class="rate${r.count ? " has" : ""}" data-ratebtn="1" title="דירוג משותף של המורים">${rateText(r)}</button><span class="picker">${stars}</span></div>
    <div class="meta">${it.gr ? `<span class="badge grade">${esc(it.gr)}</span>` : ""}${it.s ? `<span class="badge">${esc(it.s)}</span>` : ""}</div>
    <div class="btns">${it.files.map(btnHtml).join("")}</div></div></div>`;
}
function visible() {
  const q = norm(state.q.trim());
  const only = state.g && GUIDE[state.g] ? new Set(GUIDE[state.g]) : null;
  return P.items.filter(it => (!state.fmt || it.files.some(f => kindOf(f) === state.fmt || (state.fmt === "ppt" && f.f === "gamma")))
    && (!q || norm(it.t).includes(q)) && (!only || only.has(it._i)));
}
function render() {
  const items = visible(), main = document.getElementById("main");
  document.querySelectorAll("[data-g]").forEach(b => b.classList.toggle("on", b.dataset.g === state.g));
  if (!items.length) { main.innerHTML = `<div class="empty">לא נמצאו חומרים. נסו מילה אחרת או סוג חומר אחר.</div>`; return; }
  const by = {}; items.forEach(i => (by[i.c] = by[i.c] || []).push(i));
  // presentations before videos, always (21.10, the user); then the order chosen for the teacher (o, item_rank.json –
  // the most useful, engaging, full of love of Hashem first), then what teachers rated higher, then by name (22.10)
  const kind = i => (i.files || []).some(f => /^(achiya:)?(ppt|gamma)$/.test(f.f)) ? 0 : (i.files || []).length && i.files.every(f => /^(achiya:)?video$/.test(f.f)) ? 2 : 1;
  const score = i => { const r = rating(i); return r.avg * Math.min(r.count, 3); };
  const order = (a, b) => ((a.o || 999) - (b.o || 999)) || (score(b) - score(a)) || a.t.localeCompare(b.t, "he", {numeric: true});
  const top = items.filter(i => i.o && i.o <= TOP).sort(order);
  const topHtml = top.length ? `<section class="sec" id="top" style="--cc:#b45309;--cs:#fef3c7"><h2><span class="e">⭐</span>מומלצים לשיעור<span class="n">${top.length}</span></h2>
      <div class="grid">${top.map(cardHtml).join("")}</div></section>` : "";
  const gb = state.g && document.querySelector(`[data-g="${state.g}"]`);
  const gHtml = gb ? `<div class="gonly">מוצגים רק החומרים של: <b>${esc(gb.dataset.l || "")}</b> (${items.length}) <button data-gclear="1">הצגת הכול ×</button></div>` : "";
  main.innerHTML = gHtml + (state.g ? "" : topHtml) + P.cats.filter(c => by[c.k]).map(c => {
    const list = by[c.k].sort((a, b) => (kind(a) - kind(b)) || order(a, b)), cc = CATCOL[c.k] || CATCOL.more;
    const all = opened[c.k] || list.length <= PAGE + 4;
    return `<section class="sec" id="${c.k}" style="--cc:${cc[0]};--cs:${cc[1]}"><h2><span class="e">${c.e}</span>${esc(c.l)}<span class="n">${list.length}</span></h2>
      <div class="grid">${(all ? list : list.slice(0, PAGE)).map(cardHtml).join("")}</div>
      ${all ? "" : `<button class="more" data-more="${c.k}">הצגת כל ${list.length}</button>`}</section>`;
  }).join("");
  loadRatings();
}
document.getElementById("chips").innerHTML = FILTERS.map(([k, l]) => `<button class="chip${k ? "" : " on"}" data-fmt="${k}">${l}</button>`).join("");
document.addEventListener("click", async e => {
  const open = e.target.closest(".rates");
  document.querySelectorAll(".picker.open").forEach(p => { if (!open || p !== open.querySelector(".picker")) p.classList.remove("open"); });
  if (e.target.closest("[data-ratebtn]")) { open.querySelector(".picker").classList.toggle("open"); return; }
  const st = e.target.closest("[data-rate]");
  if (st) {
    const card = st.closest(".card"), k = card.dataset.id, v = +st.dataset.rate, old = MINE[k] || 0;
    if (v === old) return;
    MINE[k] = v; try { localStorage.setItem(LS_MINE, JSON.stringify(MINE)); } catch (err) {}
    card.querySelectorAll(".picker button").forEach(b => b.classList.toggle("on", +b.dataset.rate <= v));
    card.querySelector(".picker").classList.remove("open");
    try { await window.__ratingsApi.submitRating(k, v, old); window.__ratingsApi.ratingsCache.delete(k); loadRatings(); } catch (err) { console.error(err); }
    return;
  }
  const gb = e.target.closest("[data-g]");
  if (gb) { state.g = state.g === gb.dataset.g ? "" : gb.dataset.g; render(); document.getElementById("main").scrollIntoView({behavior: "smooth"}); return; }
  if (e.target.closest("[data-gclear]")) { state.g = ""; render(); document.getElementById("guide").scrollIntoView({behavior: "smooth"}); return; }
  const c = e.target.closest("[data-fmt]");
  if (c) { state.fmt = c.dataset.fmt; document.querySelectorAll("[data-fmt]").forEach(b => b.classList.toggle("on", b === c)); return render(); }
  const m = e.target.closest("[data-more]");
  if (m) { opened[m.dataset.more] = true; render(); }
  const a = e.target.closest(".summary a[data-cat]");
  if (a && (state.q || state.fmt)) { state.q = ""; state.fmt = ""; document.getElementById("q").value = "";
    document.querySelectorAll("[data-fmt]").forEach(b => b.classList.toggle("on", !b.dataset.fmt)); render(); }
});
let qt; document.getElementById("q").addEventListener("input", e => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value; render(); }, 180); });
render();
