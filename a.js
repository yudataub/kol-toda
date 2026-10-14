/* Visitor counting for every site of the archive (14.10.2026, the user's request: how many people open each page
   and what they click). Every page of kol-toda.co.il, the book sites and the folder pages of github_autosync.py loads
   this one file from https://www.kol-toda.co.il/a.js, so the two IDs below live in one place only.
   Google Analytics 4 counts page views, and by itself (enhanced measurement) file downloads and outbound clicks.
   On top of that this file sends every link/button click as "kt_click" and every search as "search", with the GA4
   parameter names link_text / link_url / search_term, so they show in the reports without custom dimensions.
   Microsoft Clarity draws the heatmaps (where on the page people click and how far they scroll). */
(function () {
  var GA = "G-BLKB4BGGGD";      // Google Analytics measurement ID, G-XXXXXXXXXX
  var CLARITY = "yxmxunxftc";   // Microsoft Clarity project ID
  if (window.__ktA) return;            // loaded twice on one page
  window.__ktA = 1;
  var h = location.hostname || "";
  if (!h || h === "localhost" || /^127\./.test(h)) return;   // a page opened from the disk or a local check

  if (GA) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", GA);
  }
  if (CLARITY) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY);
  }
  if (!GA) return;

  function ev(name, params) { try { gtag("event", name, params); } catch (e) {} }
  function txt(el) {
    var t = (el.getAttribute("aria-label") || el.innerText || el.title || el.getAttribute("alt") || "").replace(/\s+/g, " ").trim();
    if (!t) { var img = el.querySelector && el.querySelector("img[alt]"); if (img) t = img.getAttribute("alt"); }
    return t.slice(0, 100);
  }

  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest && e.target.closest("a[href],button,[role=button],summary");
    if (!el) return;
    var href = el.getAttribute("href") || "";
    if (href && href.charAt(0) !== "#" && !/^javascript:/i.test(href)) {
      try { href = new URL(href, location.href).href; } catch (x) {}
    }
    ev("kt_click", { link_text: txt(el), link_url: href.slice(0, 300), element: el.tagName.toLowerCase() });
  }, true);

  // searches: once the visitor stops typing for 1.5 s, or leaves the box
  var timer, last = "";
  function sendSearch(box) {
    var q = (box.value || "").trim();
    if (q.length < 2 || q === last) return;
    last = q;
    ev("search", { search_term: q.slice(0, 100) });
  }
  function isSearch(el) {
    return el && el.tagName === "INPUT" &&
      (el.type === "search" || /search|חיפוש|q$/i.test((el.id || "") + " " + (el.name || "") + " " + (el.placeholder || "")));
  }
  document.addEventListener("input", function (e) {
    if (!isSearch(e.target)) return;
    clearTimeout(timer);
    var box = e.target;
    timer = setTimeout(function () { sendSearch(box); }, 1500);
  }, true);
  document.addEventListener("change", function (e) { if (isSearch(e.target)) sendSearch(e.target); }, true);
})();
