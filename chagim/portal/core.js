// Holiday portals (chagim/<page>/): sorts each material of the holidays catalog by subject, by kind and by grade, from its
// title alone. Every page brings its own subjects in topics.js (PORTAL.topics(...)); kinds and grades are shared here.
// node can load this file too (module.exports), to check a page's coverage before it goes out.
(function (root) {
  const HE = "א-ת";
  const norm = s => (s || "").replace(/[֑-ׇ]/g, "").replace(/[״“”„]/g, '"').replace(/[׳‘’`]/g, "'").replace(/[_]+/g, " ").toLowerCase();
  // w("סביבון"): the word with the usual prefixes (ו/ב/ל/ה/מ/ש/כ) and any ending; x("אור"): the same, but the word ends there
  const P = `(?<![${HE}])[ובלהמשכ]{0,3}`;
  // a stem that ends in a final letter also matches its longer forms (שירון -> שירונים)
  const FIN = {"ן": "[ןנ]", "ם": "[םמ]", "ך": "[ךכ]", "ף": "[ףפ]", "ץ": "[ץצ]"};
  const stem = s => FIN[s.slice(-1)] ? s.slice(0, -1) + FIN[s.slice(-1)] : s;
  const w = (...a) => new RegExp(a.map(s => P + stem(s)).join("|"));
  const x = (...a) => new RegExp(a.map(s => P + s + `(?![${HE}])`).join("|"));
  const any = (...r) => new RegExp(r.map(e => e.source).join("|"));

  // kinds: the catalog's own nine, some of them split by the title or by the file
  const KINDS = [
    {k: "lesson", l: "מערכי שיעור", e: "🎓"}, {k: "pres", l: "מצגות", e: "🖥️"}, {k: "video", l: "סרטונים", e: "🎬"},
    {k: "audio", l: "הקלטות ושירים", e: "🎧"}, {k: "booklet", l: "חוברות", e: "📒"}, {k: "work", l: "דפי עבודה", e: "✏️"},
    {k: "test", l: "מבחנים ודפי חזרה", e: "📝"}, {k: "quiz", l: "חידונים וחידות", e: "❓"}, {k: "game", l: "משחקים", e: "🧩"},
    {k: "puzzle", l: "תפזורות ותשבצים", e: "🔎"}, {k: "story", l: "סיפורים", e: "📖"}, {k: "color", l: "דפי צביעה", e: "🖍️"},
    {k: "art", l: "יצירה וקישוט", e: "🎨"}, {k: "summary", l: "סיכומים", e: "📋"}, {k: "more", l: "עוד", e: "🗂️"},
  ];
  const R = {
    puzzle: w("תפזורת", "תפזורות", "תשבץ", "תשבצ", "מבוך", "מבוכים", "כתב סתר", "צופן", "מצא את ההבדל", "חפש את"),
    quiz: w("חידון", "חידונ", "חידה", "חידות", "טריווי", "מי אני", "קהוט", "אחד נגד", "שאלות ותשובות", "המרוץ למיליון"),
    color: any(w("צביע", "דף צבע", "דפי צבע"), x("לצבוע", "צבע לפי", "צביעה לפי")),
    booklet: w("חוברת", "חוברות", "מחברת", "ספרון", "קונטרס"),
    game: w("בינגו", "דומינו", "רביעיות", "לוטו", "משחק", "זכרון", "זיכרון", "חדר בריחה", "חדרי בריחה"),
    test: w("מבחן", "מבחנ", "בוחן", "חזרה", "שאלות", "מבדק", "סיכום", "בחינה", "תשובות"),
  };
  const fmt = f => f.f.replace("achiya:", "");
  function kindOf(it, t) {
    const fs = it.files.map(fmt); let c = it.c;
    if (c === "game") return R.puzzle.test(t) ? "puzzle" : R.quiz.test(t) ? "quiz" : "game";
    if (c === "art") return R.color.test(t) ? "color" : R.puzzle.test(t) ? "puzzle" : R.game.test(t) ? "game" : "art";
    if (c === "test" && !R.test.test(t)) c = "work";   // the catalog files many plain booklets under tests
    if (c === "pres" || c === "more" || c === "story") {
      if (fs.every(f => f === "audio")) return "audio";
      if (c !== "story" && fs.every(f => f === "video")) return "video";
      return c;
    }
    if (c === "work") return R.puzzle.test(t) ? "puzzle" : R.quiz.test(t) ? "quiz" : R.booklet.test(t) ? "booklet" : R.color.test(t) ? "color" : R.game.test(t) ? "game" : "work";
    return c;
  }

  const GRADES = ["הגיל הרך", "כיתה א׳", "כיתה ב׳", "כיתה ג׳", "כיתה ד׳", "כיתה ה׳", "כיתה ו׳", "כיתות ז-ח", "מורים", "הורים"];
  const LET = {"א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 7};
  // grades named in the title: "כיתה ג", "כתות א-ב", "לכיתות ד'-ו'", "גן", "גיל הרך"
  function gradesOf(it, t) {
    const out = new Set(it.grs || (it.gr ? [it.gr] : []));
    if (out.has("כיתות א׳-ב׳")) { out.delete("כיתות א׳-ב׳"); out.add(GRADES[1]); out.add(GRADES[2]); }
    if (!out.size) {
      if (/(?<![א-ת])(?:[ובלהמש]{0,2})(?:גיל הרך|גן|גנים|גננ\S*|קדם יסודי|פעוטו\S*|לקטנים)(?![א-ת])/.test(t)) out.add(GRADES[0]);
      const m = t.match(/(?:כיתה|כתה|כיתות|כתות)\s*([א-ח])['"]?(?:\s*(?:-|עד|ו-?)\s*([א-ח])['"]?)?(?![א-ת])/);
      if (m) { const a = LET[m[1]], b = m[2] ? LET[m[2]] : a; for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(GRADES[i]); }
    }
    return [...out].filter(g => GRADES.includes(g));
  }

  // A topic: {k, l, e, c, d, r?, tabs?, own?}. r = a pattern on the title; tabs = only materials of these catalog tabs
  // (with no r: every material of them); own = materials of those tabs get this topic alone. Nothing matched -> page.general.
  function classify(it, page) {
    const t = norm(it.t), T = page.TOPICS;
    const own = T.find(o => o.own && o.tabs.includes(it.tab));
    let tp;
    if (own) tp = [own.k];
    else {
      tp = T.filter(o => !o.own && (!o.tabs || o.tabs.includes(it.tab)) && (o.r ? o.r.test(t) : !!o.tabs)).map(o => o.k);
      if (tp.includes("english") && tp.length > 1 && /[א-ת]{3}/.test(t)) tp = tp.filter(k => k !== "english");
      if (!tp.length) tp = [page.general.k];
    }
    return {tp, kd: kindOf(it, t), gr: gradesOf(it, t)};
  }
  // English materials: the same pattern on every page
  const ENGLISH = /(?:^|[^a-z])(?:english|freebie|worksheet|the|for|and|of|with|my|your|happy)(?:[^a-z]|$)|אנגלית/;
  const api = {KINDS, GRADES, classify, norm, w, x, any, ENGLISH,
    topics(make) { const page = root.PAGE || (root.PAGE = {}); page.TOPICS = make(api); return page.TOPICS; }};
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.PORTAL = api;
})(typeof window !== "undefined" ? window : globalThis);
