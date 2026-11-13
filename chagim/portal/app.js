// Holiday portals: the page itself. window.PAGE (written into each page by catalog-kit/build_chagim_portals.py) says
// which catalog tabs it shows and its words; topics.js adds PAGE.TOPICS. Built from the Hanukkah page (10.11.2026).
"use strict";
const PAGE = window.PAGE, {KINDS, GRADES, classify, norm} = window.PORTAL;
const TOPICS = PAGE.TOPICS.concat([PAGE.general]);
const TP = Object.fromEntries(TOPICS.map(t => [t.k, t])), KD = Object.fromEntries(KINDS.map(k => [k.k, k]));
const KCOL = {lesson:"#4f46e5", pres:"#ea580c", video:"#dc2626", audio:"#0891b2", booklet:"#b45309", work:"#2563eb", test:"#e11d48", quiz:"#9333ea",
  game:"#7c3aed", puzzle:"#0d9488", story:"#059669", color:"#db2777", art:"#c026d3", summary:"#16a34a", more:"#64748b"};
KINDS.forEach(k => k.c = KCOL[k.k]);
const FMT = {pdf:["📕","PDF","#e11d48","#fde8ec"],word:["📘","Word","#2563eb","#e8eefd"],ppt:["🖥️","מצגת","#ea580c","#fdece0"],
  video:["🎬","סרטון","#dc2626","#fde8e8"],game:["🎮","משחק מקוון","#7c3aed","#f1eafe"],web:["🔗","קישור","#4f46e5","#eceafd"],
  folder:["📁","תיקייה","#ca8a04","#fdf6e0"],excel:["📗","Excel","#16a34a","#e7f7ec"],image:["🖼️","תמונה","#0d9488","#e0f5f1"],
  audio:["🎵","שמע","#0891b2","#e0f5fa"],gamma:["🖥️","Gamma","#9333ea","#f3e8ff"]};
const VERB = {gamma:"פתחו מצגת", pdf:"PDF להדפסה", word:"Word לעריכה", ppt:"פתחו מצגת", video:"▶ צפו בסרטון", game:"🎮 שחקו", web:"פתחו קישור",
  folder:"פתחו תיקייה", excel:"פתחו Excel", image:"צפו בתמונה", audio:"▶ האזינו"};
const QUICK = PAGE.quick;
const BASE = new URL("../", location.href).href;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const abs = u => /^https?:/.test(u) ? u : new URL(u, BASE).href;
const fmtOf = f => f.f.replace("achiya:", "");
const keyOf = it => it.files[0].id;
const LSK = "cat2_חגי ישראל_fav";   // the same list as the holidays catalog's "♥ השמורים שלי"
let FAV = new Set(); try { FAV = new Set(JSON.parse(localStorage.getItem(LSK)) || []); } catch (e) {}
const saveFav = () => { try { localStorage.setItem(LSK, JSON.stringify([...FAV])); } catch (e) {} };

let ITEMS = [], OWN = null, shown = 48;
const state = {q: "", tp: "", kd: "", gr: "", gu: "", fav: "", so: ""};
const main = document.getElementById("main"), qEl = document.getElementById("q");

// ---- the address keeps the choice, so a teacher can send a colleague the exact list ----
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  Object.keys(state).forEach(k => state[k] = p.get(k) || "");
  if (state.tp && !TP[state.tp]) state.tp = ""; if (state.kd && !KD[state.kd]) state.kd = "";
  qEl.value = state.q; document.getElementById("search").classList.toggle("has", !!state.q);
}
function writeHash(push) {
  const p = new URLSearchParams(); Object.keys(state).forEach(k => { if (state[k]) p.set(k, state[k]); });
  const h = p.toString(), url = location.pathname + location.search + (h ? "#" + h : "");
  if (push) history.pushState(null, "", url); else history.replaceState(null, "", url);
}
function go(patch, push = true) { Object.assign(state, patch); shown = 48; writeHash(push); render(); if (push) window.scrollTo({top: isHome() ? 0 : document.querySelector("main").offsetTop - 4}); }
const isHome = () => !state.q && !state.tp && !state.kd && !state.gr && !state.fav;

// ---- data: the holidays catalog's own files (the parts of this page's tabs), so every new material shows here by itself ----
function loadData() {
  return fetch(BASE + "data.json").then(r => r.json()).then(d => {
    const tabs = new Set(PAGE.tabs), groups = new Set(d.tabs.filter(t => tabs.has(t.k)).map(t => t.g));
    const parts = (d.parts || []).filter(p => groups.has(p.g));
    return (parts.length ? Promise.all(parts.map(p => fetch(p.u).then(r => r.json()))).then(a => [].concat(...a)) : Promise.resolve(d.items))
      .then(a => a.filter(i => tabs.has(i.tab)));
  });
}
const ownKey = u => { const m = u.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|(?:document|presentation|spreadsheets)\/d\/|open\?id=|drive\/folders\/)([\w-]{20,})/); return m ? m[1] : u; };
function thumbOf(it) {
  if (it.im && it.im.includes("/ach/")) return null;   // Achiya's own banner, the same on every card
  if (it.im) return {src: abs(it.im)};
  for (const f of it.files) {
    if (!/^https?:/.test(f.u) && /^[\w-]{25,}$/.test(f.id)) return {src: `https://drive.google.com/thumbnail?id=${f.id}&sz=w400`};
    const y = f.u.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/);
    if (y) return {src: `https://i.ytimg.com/vi/${y[1]}/mqdefault.jpg`, vid: true};
    const d = f.f !== "folder" && f.u.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|(?:document|presentation|spreadsheets)\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    if (d) return {src: `https://drive.google.com/thumbnail?id=${d[1]}&sz=w400`};
  }
  return null;
}
const inGit = u => !/^https?:/.test(u) || /^https:\/\/yudataub\.github\.io\//.test(u);
function viewHref(f) {
  const u = abs(f.u), k = fmtOf(f);
  if (inGit(f.u) && ["word", "ppt", "excel"].includes(k) && f.b && f.b <= (k === "excel" ? 5e6 : 10e6))
    return "https://view.officeapps.live.com/op/view.aspx?src=" + encodeURIComponent(u);
  return u;
}
function prep(a) {
  ITEMS = a.map(it => { const r = classify(it, PAGE); it._tp = r.tp; it._kd = r.kd; it._gr = r.gr; it._n = norm(it.t); it._th = thumbOf(it); it._own = 0; return it; });
  markOwn();
}
function markOwn() { if (OWN) ITEMS.forEach(i => i._own = OWN.has(ownKey(i.files[0].u)) ? 1 : 0); }

// ---- filtering; "skip" leaves one filter out, to count what each chip would give ----
function match(it, skip) {
  if (state.fav && !FAV.has(keyOf(it))) return false;
  if (skip !== "tp" && state.tp && !it._tp.includes(state.tp)) return false;
  if (skip !== "kd" && state.kd && it._kd !== state.kd) return false;
  if (skip !== "gr" && state.gr && !(it._gr.includes(state.gr) || (state.gu && !it._gr.length))) return false;
  if (state.q) { const ws = norm(state.q).split(/\s+/).filter(Boolean); if (!ws.every(w => it._n.includes(w))) return false; }
  return true;
}
function sorted(arr) {
  const abc = (a, b) => a.t.localeCompare(b.t, "he", {numeric: true});
  if (state.so === "abc") return arr.sort(abc);
  return arr.sort((a, b) => (b._own - a._own) || (state.gr ? (b._gr.length ? 1 : 0) - (a._gr.length ? 1 : 0) : 0) || (!!b._th - !!a._th) || abc(a, b));
}
const count = (arr, f) => { const c = {}; arr.forEach(i => f(i).forEach(k => c[k] = (c[k] || 0) + 1)); return c; };

// ---- home ----
function renderHome() {
  const ct = count(ITEMS, i => i._tp), ck = count(ITEMS, i => [i._kd]), cg = count(ITEMS, i => i._gr);
  const nf = ITEMS.filter(i => FAV.has(keyOf(i))).length;
  main.innerHTML = `
    <h2>⚡ מה צריך עכשיו?</h2><p class="lead">קיצורי דרך לבקשות הנפוצות – לחיצה אחת ואתם שם</p>
    <div class="quick">${QUICK.map((q, i) => `<button data-quick="${i}"><span class="em">${q[0]}</span><span>${q[1]}<small>${q[2]}</small></span></button>`).join("")}
      ${nf ? `<button data-go='{"fav":"1"}'><span class="em">♥</span><span>השמורים שלי<small>${nf} חומרים ששמרתם</small></span></button>` : ""}</div>
    <h2>🕎 לפי נושא <small>על מה השיעור?</small></h2><p class="lead">בוחרים נושא, ובפנים מסננים לפי סוג החומר והכיתה</p>
    <div class="tiles">${TOPICS.filter(t => ct[t.k] >= 5).map(t => `<button class="tile" style="--c:${t.c}" data-go='{"tp":"${t.k}"}'>
      <span class="em">${t.e}</span><b>${t.l}</b><i>${t.d}</i><span class="n"><span>${ct[t.k].toLocaleString()} חומרים</span></span></button>`).join("")}</div>
    <h2>🗂️ לפי סוג החומר <small>מה אתם צריכים ביד?</small></h2><p class="lead">מצגת, דף עבודה, חידון או דף צביעה – מכל הנושאים יחד</p>
    <div class="kinds">${KINDS.filter(k => ck[k.k]).map(k => `<button class="kind" style="--c:${k.c};--b:color-mix(in srgb,${k.c} 11%,#fff)" data-go='{"kd":"${k.k}"}'>
      <span class="em">${k.e}</span><b>${k.l}</b><small>${ck[k.k].toLocaleString()}</small></button>`).join("")}</div>
    <h2>🎒 לפי כיתה <small>חומרים שצוינה בהם כיתה</small></h2><p class="lead">רוב החומרים מתאימים לכמה כיתות; כאן רק מה שסומן במפורש</p>
    <div class="grades">${GRADES.filter(g => cg[g]).map(g => `<button data-go='{"gr":"${g}"}'>${g}<small>${cg[g]}</small></button>`).join("")}</div>`;
}

// ---- results ----
function cardHtml(it) {
  const kd = KD[it._kd], k = keyOf(it), t = it._th, f0 = it.files[0], icon = (FMT[fmtOf(f0)] || FMT.web)[0];
  const href = esc(viewHref(f0));
  const th = `<a class="th${t ? "" : " noimg"}${t && t.vid ? " vid" : ""}" style="--b:color-mix(in srgb,${kd.c} 14%,#fff)" href="${href}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">` +
    (t ? `<img src="${esc(t.src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg')">` : "") + `<span class="fb">${kd.e}</span></a>`;
  const tps = it._tp.filter(x => x !== state.tp && x !== "general").slice(0, 2).map(x => `<button class="badge t" style="--c:${TP[x].c}" data-go='{"tp":"${x}"}' title="לכל החומרים בנושא">${TP[x].e} ${TP[x].l.split(/[,–]/)[0]}</button>`).join("");
  const btns = it.files.slice(0, 4).map(f => { const fk = fmtOf(f), m = FMT[fk] || FMT.web, ach = f.f.startsWith("achiya:");
    return `<a class="btn" style="color:${m[2]};background:${m[3]};border-color:${m[3]}" href="${esc(viewHref(f))}" target="_blank" rel="noopener">${ach ? "באתר אחיה" : VERB[fk] || m[1]}${f.z ? ` <span class="sz">· ${esc(f.z)}</span>` : ""}</a>`; }).join("");
  return `<div class="card${it._own ? " own" : ""}" data-id="${esc(k)}">${th}
    <span class="kbadge" style="--c:${kd.c}">${kd.e} ${kd.l}</span>
    <button class="fav${FAV.has(k) ? " on" : ""}" data-fav="1" title="שמירה ברשימה האישית שלי" aria-label="שמירה">${FAV.has(k) ? "♥" : "♡"}</button>
    <div class="cb"><a class="name" href="${href}" target="_blank" rel="noopener" title="${esc(it.t)}">${esc(it.t)}</a>
      <div class="meta">${it._own ? `<span class="badge o">⭐ של הקול החמישי</span>` : ""}${it._gr.slice(0, 3).map(g => `<span class="badge g">${g}</span>`).join("")}${tps}${it.s ? `<span class="badge">${esc(it.s)}</span>` : ""}</div>
      <div class="btns">${btns}</div></div></div>`;
}
function renderResults() {
  const items = sorted(ITEMS.filter(i => match(i)));
  const ct = count(ITEMS.filter(i => match(i, "tp")), i => i._tp), ck = count(ITEMS.filter(i => match(i, "kd")), i => [i._kd]);
  const gBase = ITEMS.filter(i => match(i, "gr")), cg = count(gBase, i => i._gr), noGr = state.gr ? gBase.filter(i => !i._gr.length).length : 0;
  const tp = TP[state.tp], kd = KD[state.kd];
  const head = state.fav ? "♥ השמורים שלי" : state.q ? `חיפוש: „${esc(state.q)}”` : tp ? `${tp.e} ${tp.l}` : kd ? `${kd.e} ${kd.l}` : `🎒 ${state.gr}`;
  const subs = [tp && (state.q || state.fav) ? tp.l : "", kd && (tp || state.q || state.fav) ? kd.l : "", state.gr && (tp || kd || state.q || state.fav) ? state.gr : ""].filter(Boolean).join(" · ");
  const chips = (list, cnt, key, cur) => `<button class="chip${cur ? "" : " on"}" data-go='{"${key}":""}'>הכול</button>` +
    list.filter(o => cnt[o.k] || o.k === cur).sort((x, y) => (y.k === cur) - (x.k === cur)).map(o => `<button class="chip${o.k === cur ? " on" : ""}" style="--c:${o.c}" data-go='{"${key}":"${o.k === cur ? "" : o.k}"}'>${o.e} ${o.l.split(" – ")[0]}<small>${cnt[o.k] || 0}</small></button>`).join("");
  main.innerHTML = `<div class="bar">
      <div class="barhead"><button class="back" data-home="1">→ כל הנושאים</button>
        <h3>${head}<small>${items.length.toLocaleString()} חומרים${subs ? " · " + esc(subs) : ""}${tp && !state.q && !kd && !state.gr ? " · " + tp.d : ""}</small></h3>
        <div class="selects">
          <select id="gsel" aria-label="כיתה"><option value="">כל הכיתות</option>${GRADES.filter(g => cg[g] || g === state.gr).map(g => `<option${g === state.gr ? " selected" : ""} value="${g}">${g} (${cg[g] || 0})</option>`).join("")}</select>
          <select id="ssel" aria-label="סדר"><option value="">עם תמונה תחילה</option><option value="abc"${state.so === "abc" ? " selected" : ""}>לפי א-ב</option></select></div></div>
      <div class="frow"><span class="lbl">נושא</span>${chips(TOPICS, ct, "tp", state.tp)}</div>
      <div class="frow"><span class="lbl">סוג</span>${chips(KINDS, ck, "kd", state.kd)}</div></div>
    ${items.length ? `<div class="grid">${items.slice(0, shown).map(cardHtml).join("")}</div>` +
        (items.length > shown ? `<button class="more" id="more">עוד ${Math.min(48, items.length - shown)} חומרים (נשארו ${(items.length - shown).toLocaleString()})</button>` : "")
      : `<div class="empty"><span class="em">🔦</span>לא מצאנו חומרים בצירוף הזה.<br>${state.q && (state.tp || state.kd || state.gr) ? `<button data-go='{"tp":"","kd":"","gr":""}'>לחפש „${esc(state.q)}” בכל חומרי ${esc(PAGE.of)}</button>` : `<button data-home="1">חזרה לכל הנושאים</button>`}</div>`}
    ${state.gr && noGr ? `<div class="note">${state.gu ? `מוצגים גם ${noGr.toLocaleString()} חומרים שלא צוינה בהם כיתה. <button data-go='{"gu":""}'>להציג רק ${state.gr}</button>`
      : `יש עוד ${noGr.toLocaleString()} חומרים שלא צוינה בהם כיתה, וחלקם מתאימים גם ל${state.gr}. <button data-go='{"gu":"1"}'>להציג גם אותם</button>`}</div>` : ""}`;
  const more = document.getElementById("more");
  if (more && "IntersectionObserver" in window) new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { o.disconnect(); more.click(); } }, {rootMargin: "500px"}).observe(more);
}
function render() {
  if (!ITEMS.length) return;
  document.title = (isHome() ? "" : (state.q || (TP[state.tp] || KD[state.kd] || {l: state.gr || "השמורים שלי"}).l) + " – ") + PAGE.name + " – הקול החמישי";
  isHome() ? renderHome() : renderResults();
}

// ---- events ----
main.addEventListener("click", e => {
  const b = e.target.closest("[data-go],[data-quick],[data-home],[data-fav],#more"); if (!b) return;
  if (b.id === "more") { const y = window.scrollY; shown += 48; renderResults(); window.scrollTo(0, y); return; }
  if (b.dataset.fav) { const k = b.closest(".card").dataset.id; FAV.has(k) ? FAV.delete(k) : FAV.add(k); saveFav();
    b.classList.toggle("on", FAV.has(k)); b.textContent = FAV.has(k) ? "♥" : "♡"; if (state.fav && !FAV.has(k)) render(); return; }
  if (b.dataset.home) { qEl.value = ""; document.getElementById("search").classList.remove("has"); return go({q: "", tp: "", kd: "", gr: "", gu: "", fav: ""}); }
  if (b.dataset.quick) return go(Object.assign({q: "", tp: "", kd: "", gr: "", gu: "", fav: ""}, QUICK[+b.dataset.quick][3]));
  const patch = JSON.parse(b.dataset.go), home = isHome();
  go(patch, home || b.classList.contains("badge"));
});
main.addEventListener("change", e => {
  if (e.target.id === "gsel") go({gr: e.target.value, gu: ""}, false);
  if (e.target.id === "ssel") go({so: e.target.value}, false);
});
let qt; qEl.addEventListener("input", () => { clearTimeout(qt); document.getElementById("search").classList.toggle("has", !!qEl.value);
  qt = setTimeout(() => { const was = isHome(); go({q: qEl.value.trim()}, false); if (was && !isHome()) document.querySelector("main").scrollIntoView(); }, 220); });
document.getElementById("qx").addEventListener("click", () => { qEl.value = ""; document.getElementById("search").classList.remove("has"); go({q: ""}, false); qEl.focus(); });
document.querySelector(".hint").addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (!b) return; qEl.value = b.dataset.q; document.getElementById("search").classList.add("has"); go({q: b.dataset.q, tp: "", kd: "", gr: "", fav: ""}); });
window.addEventListener("popstate", () => { readHash(); shown = 48; render(); });
window.addEventListener("hashchange", () => { readHash(); shown = 48; render(); });

const topB = document.getElementById("top");
window.addEventListener("scroll", () => topB.classList.toggle("show", !isHome() && window.scrollY > document.querySelector("main").offsetTop + 500), {passive: true});
topB.addEventListener("click", () => window.scrollTo({top: document.querySelector("main").offsetTop - 4}));

// ---- the hero: the menorah on Hanukkah (tonight's candles; a click lights one more), a picture of the holiday elsewhere ----
(function () {
  const g = document.getElementById("candles"); if (!g) return;
  const xs = [25, 65, 105, 145, 185, 225, 265, 305]; let lit = 8;
  try { const p = new Intl.DateTimeFormat("en-u-ca-hebrew", {month: "long", day: "numeric"}).formatToParts(new Date());
    const m = p.find(x => x.type === "month").value, d = +p.find(x => x.type === "day").value;
    if (m === "Kislev" && d >= 24) lit = Math.min(8, d - 23); else if (m === "Tevet" && d <= 2) lit = Math.min(8, d + 6); } catch (e) {}
  const candle = (x, y, i) => `<rect x="${x - 4}" y="${y}" width="8" height="${78 - y}" rx="3" fill="${["#ff6b6b", "#ffd166", "#06d6a0", "#4cc9f0", "#f72585", "#ff9f1c", "#b5e48c", "#c77dff"][i % 8]}"/>` +
    `<path class="flame" data-i="${i}" d="M${x} ${y - 20} C${x + 8} ${y - 9} ${x + 6} ${y - 1} ${x} ${y - 1} C${x - 6} ${y - 1} ${x - 8} ${y - 9} ${x} ${y - 20}Z" fill="#ffc93c"/>`;
  const draw = () => { g.innerHTML = xs.map((x, i) => candle(x, 52, i)).join("") + candle(165, 34, 8);
    g.querySelectorAll(".flame").forEach(f => { const i = +f.dataset.i; if (i < 8 && 7 - i >= lit) f.classList.add("off"); }); };   // the first candle is on the right
  draw();
  document.getElementById("menorah").addEventListener("click", () => { lit = lit % 8 + 1; draw(); });
})();

const emh = document.getElementById("emhero");
if (emh) emh.addEventListener("click", () => { emh.classList.remove("dance"); void emh.offsetWidth; emh.classList.add("dance"); });

readHash();
loadData().then(a => { prep(a);
  document.getElementById("sub").textContent = `${ITEMS.length.toLocaleString()} חומרים ל${PAGE.forWhat} – מסודרים לפי נושא, לפי סוג ולפי כיתה`;
  render();
}).catch(() => { main.innerHTML = `<div class="empty"><span class="em">🕯️</span>לא הצלחנו לטעון את החומרים. <a href="../#${PAGE.hash}" style="text-decoration:underline">לקטלוג המלא</a></div>`; });
fetch("https://www.kol-toda.co.il/search/mine.json").then(r => r.json()).then(a => { OWN = new Set(a); markOwn(); if (ITEMS.some(i => i._own)) render(); }).catch(() => {});
