// One person's page: every material about him, grouped by kind. The data (P) is written into the page itself.
const FMT = {pdf:["📕","PDF","#e11d48","#fde8ec"],word:["📘","Word","#2563eb","#e8eefd"],ppt:["🖥️","מצגת","#ea580c","#fdece0"],
  video:["🎬","סרטון","#dc2626","#fde8e8"],game:["🎮","משחק מקוון","#7c3aed","#f1eafe"],web:["🔗","קישור","#4f46e5","#eceafd"],
  folder:["📁","תיקייה","#ca8a04","#fdf6e0"],excel:["📗","Excel","#16a34a","#e7f7ec"],image:["🖼️","תמונה","#0d9488","#e0f5f1"],
  audio:["🎵","שמע","#0891b2","#e0f5fa"],gamma:["🖥️","Gamma","#9333ea","#f3e8ff"]};
const VERB = {gamma:"פתחו מצגת", pdf:"PDF להדפסה", word:"Word לעריכה", ppt:"פתחו מצגת", video:"▶ צפו בסרטון", game:"🎮 שחקו",
  web:"פתחו קישור", folder:"פתחו תיקייה", excel:"פתחו Excel", image:"צפו בתמונה", audio:"▶ האזינו"};
const CATCOL = {lesson:["#4f46e5","#e9e8fd"], pres:["#ea580c","#fdeadb"], work:["#2563eb","#e3ecfd"], test:["#e11d48","#fde4ea"],
  game:["#7c3aed","#efe6fe"], story:["#0d9488","#dcf3ef"], art:["#db2777","#fce4f1"], summary:["#16a34a","#e2f5e8"], more:["#64748b","#eceff4"]};
const FILTERS = [["","הכל"],["pdf","להדפסה"],["word","לעריכה"],["ppt","מצגות"],["video","סרטונים"],["game","משחקים"]];
const PAGE = 24;
let state = {q: "", fmt: ""}, opened = {};
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
  const text = ach ? (k !== "web" ? m[1] + " · באתר אחיה" : "באתר אחיה") : (VERB[k] || m[1]);
  const href = viewHref(f);
  return `<a class="btn" style="color:${m[2]};background:${m[3]};border-color:${m[3]}" href="${esc(href)}" target="_blank" rel="noopener">${text}${f.z ? `<span class="sz">· ${esc(f.z)}</span>` : ""}</a>` +
    (href !== f.u ? `<a class="btn dl" href="${esc(f.u)}" download title="הורדת הקובץ">⬇️</a>` : "");
}
function cardHtml(it) {
  const m = FMT[kindOf(it.files[0])] || FMT.web, t = thumbOf(it);
  const fb = `<span class="fb" style="background:${m[3]}">${m[0]}</span>`;
  const th = t ? `<a class="th${t.wide ? " wide" : ""}" href="${esc(t.u)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">` +
      `<img src="${esc(t.src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg')">${fb}</a>`
    : `<a class="th noimg" href="${esc(viewHref(it.files[0]))}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${fb}</a>`;
  return `<div class="card">${th}<div class="body"><div class="name" title="${esc(it.t)}">${esc(it.t)}</div>
    <div class="meta">${it.gr ? `<span class="badge grade">${esc(it.gr)}</span>` : ""}${it.s ? `<span class="badge">${esc(it.s)}</span>` : ""}</div>
    <div class="btns">${it.files.map(btnHtml).join("")}</div></div></div>`;
}
function visible() {
  const q = norm(state.q.trim());
  return P.items.filter(it => (!state.fmt || it.files.some(f => kindOf(f) === state.fmt || (state.fmt === "ppt" && f.f === "gamma")))
    && (!q || norm(it.t).includes(q)));
}
function render() {
  const items = visible(), main = document.getElementById("main");
  if (!items.length) { main.innerHTML = `<div class="empty">לא נמצאו חומרים. נסו מילה אחרת או סוג חומר אחר.</div>`; return; }
  const by = {}; items.forEach(i => (by[i.c] = by[i.c] || []).push(i));
  main.innerHTML = P.cats.filter(c => by[c.k]).map(c => {
    const list = by[c.k].sort((a, b) => a.t.localeCompare(b.t, "he", {numeric: true})), cc = CATCOL[c.k] || CATCOL.more;
    const all = opened[c.k] || list.length <= PAGE + 4;
    return `<section class="sec" id="${c.k}" style="--cc:${cc[0]};--cs:${cc[1]}"><h2><span class="e">${c.e}</span>${esc(c.l)}<span class="n">${list.length}</span></h2>
      <div class="grid">${(all ? list : list.slice(0, PAGE)).map(cardHtml).join("")}</div>
      ${all ? "" : `<button class="more" data-more="${c.k}">הצגת כל ${list.length}</button>`}</section>`;
  }).join("");
}
document.getElementById("chips").innerHTML = FILTERS.map(([k, l]) => `<button class="chip${k ? "" : " on"}" data-fmt="${k}">${l}</button>`).join("");
document.addEventListener("click", e => {
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
