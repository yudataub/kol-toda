// Holiday portals: "משחקים ומצגות של הרב טאוב" – the user's own works for the holiday, first on its page (the user,
// 14.11.2026: "all my pages go into each holiday's page, as the first card; one page per holiday that gathers everything").
// The works live on the topic pages t/chagim.html and t/chanuka.html (kol/build.py, sections <h2 class="list-h" id=...>).
// The page reads them from there every time, so a work added to those pages shows here by itself.
// renderMine(box, {sections: [[page, sectionId], ...], extra: [[emoji, title, line, href], ...]})
(function () {
  const SITE = "https://www.kol-toda.co.il/";
  const cache = {};
  const get = page => cache[page] || (cache[page] = fetch(SITE + "t/" + page + ".html").then(r => r.text())
    .then(t => new DOMParser().parseFromString(t, "text/html")).catch(() => null));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const abs = (u, page) => { try { return new URL(u, SITE + "t/" + page + ".html").href; } catch (e) { return u; } };

  function cardsOf(doc, page, id) {
    const h = doc && doc.getElementById(id); if (!h) return [];
    let box = h.nextElementSibling; while (box && !box.classList.contains("cards")) { if (box.tagName === "H2") return []; box = box.nextElementSibling; }
    if (!box) return [];
    return [...box.querySelectorAll("a.card")].map(a => {
      const img = a.querySelector("img"), h3 = a.querySelector("h3");
      return {href: abs(a.getAttribute("href"), page), img: img ? abs(img.getAttribute("src"), page) : "", t: h3 ? h3.textContent.trim() : "",
        game: a.classList.contains("is-game"), ph: (a.querySelector(".ph") || {}).textContent || ""};
    }).filter(c => c.t && !/kol-toda\.co\.il\/chagim\/?$/.test(c.href));   // not the holidays catalog itself (it leads here)
  }
  function card(c) {
    return `<a class="mc${c.game ? " g" : ""}" href="${esc(c.href)}" target="_blank" rel="noopener">` +
      (c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="ph">${esc(c.ph || "📄")}</span>`) +
      (c.game ? `<span class="gb">🎮 משחק</span>` : "") + `<b>${esc(c.t)}</b></a>`;
  }
  window.renderMine = function (box, cfg) {
    if (!box || !cfg) return;
    const extra = (cfg.extra || []).map(x => `<a class="mx" href="${esc(x[3])}"><span>${x[0]}</span><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div><i>←</i></a>`).join("");
    const pages = [...new Set((cfg.sections || []).map(s => s[0]))];
    Promise.all(pages.map(get)).then(docs => {
      const D = Object.fromEntries(pages.map((p, i) => [p, docs[i]]));
      const seen = new Set(), cards = [];
      (cfg.sections || []).forEach(([p, id]) => cardsOf(D[p], p, id).forEach(c => { if (!seen.has(c.href)) { seen.add(c.href); cards.push(c); } }));
      cards.sort((a, b) => b.game - a.game);   // games first
      if (!cards.length && !extra) { box.innerHTML = ""; return; }
      const many = cards.length > 8;
      box.innerHTML = `<div class="mine"><h2>🌟 משחקים ומצגות של הרב טאוב <small>${cards.length ? cards.length + " יצירות" : ""}</small></h2>` +
        (extra ? `<div class="mxs">${extra}</div>` : "") +
        (cards.length ? `<div class="mcs${many ? " folded" : ""}">${cards.map(card).join("")}</div>` +
          (many ? `<button class="mmore" type="button">להציג את כל ${cards.length} היצירות ↓</button>` : "") : "") + "</div>";
      const b = box.querySelector(".mmore");
      if (b) b.addEventListener("click", () => { box.querySelector(".mcs").classList.remove("folded"); b.remove(); });
    });
  };
})();
