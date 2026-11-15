/* tn-engine.js – מנוע משחקי "סיפורי התנאים" (הקול החמישי).
   מתחבר ל-kt-game.js הקיים (רישום, 10 נקודות, מחמאות, לוח מצטיינים): KT.init / KT.ok / KT.bad / KT.end.
   כל משחק = סיפור אחד. משחק בנוי משלבים (stages), לכל שלב מנגנון (m).
   כללים: תשובות מתערבבות · אחרי טעות רמז וניסיון שני, ורק אז התשובה · פריט שנכשל חוזר ·
   משפט אהבת ה׳ גם אחרי טעות · כל משוב מציין מקור · בסוף: "ומה זה אומר עליי?". */
(function () {
  "use strict";
  var TN = window.TN || [];
  var P = new URLSearchParams(location.search), DBG = P.get("debug") === "1";
  var BOOK = "https://sfarim.kol-toda.co.il/%D7%A1%D7%A4%D7%A8%D7%99%20%D7%99%D7%94%D7%95%D7%93%D7%94%20%D7%98%D7%90%D7%95%D7%91/%D7%92%D7%93%D7%95%D7%9C%D7%99%20%D7%99%D7%A9%D7%A8%D7%90%D7%9C%20%D7%9C%D7%93%D7%95%D7%A8%D7%95%D7%AA%D7%99%D7%94%D7%9D.html";
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function sh(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var LOVE_BAD = ["גַּם כְּשֶׁטּוֹעִים – לוֹמְדִים. ה׳ אוֹהֵב אוֹתְךָ וְשָׂמֵחַ בַּמַּאֲמָץ שֶׁלְּךָ 💛",
    "ה׳ רוֹאֶה כַּמָּה אַתָּה מִתְאַמֵּץ לְהָבִין – וְזֶה יָקָר בְּעֵינָיו 💛",
    "גַּם הַתַּנָּאִים שָׁאֲלוּ, טָעוּ וְחָזְרוּ. כָּךְ קוֹנִים תּוֹרָה 📚",
    "ה׳ אוֹהֵב אֶת מִי שֶׁלֹּא מִתְיָאֵשׁ. נַסֵּה שׁוּב בְּנַחַת 🌱",
    "כָּל שְׁאֵלָה קָשָׁה שֶׁאַתָּה נֶאֱבָק בָּהּ – הִיא מַתָּנָה שֶׁאַתָּה נוֹתֵן לַה׳ 🎁"];
  var LOVE_OK = ["ה׳ שָׂמֵחַ בַּתּוֹרָה שֶׁלְּךָ 💖", "דִּבְרֵי הַתַּנָּאִים נַעֲשׂוּ עַכְשָׁו גַּם שֶׁלְּךָ 💎",
    "תּוֹדָה לַה׳ שֶׁנָּתַן לְךָ שֵׂכֶל לְהָבִין 🌟", "כָּל דְּבַר תּוֹרָה שֶׁהֵבַנְתָּ מְקָרֵב אוֹתְךָ אֶל ה׳ 🛤️"];

  var HOW = {
    vanish: "הַמִּשְׁנָה מוֹפִיעָה לְפָנֶיךָ. בְּכָל סִבּוּב נֶעֱלָמוֹת עוֹד מִלִּים, וְאַתָּה מַחְזִיר אוֹתָן לִמְקוֹמָן מִתּוֹךְ הַמַּחְסָן. בַּסִּבּוּב הָאַחֲרוֹן – הַכֹּל נֶעֱלָם.",
    mc: "קְרָא אֶת הַשְּׁאֵלָה וּבְחַר תְּשׁוּבָה. הַתְּשׁוּבוֹת דּוֹמוֹת זוֹ לָזוֹ – צָרִיךְ לַחְשֹׁב, לֹא לְנַחֵשׁ.",
    teach: "תַּלְמִיד חָדָשׁ הִגִּיעַ לַכִּתָּה וְלֹא שָׁמַע אֶת הַסִּפּוּר. הוּא שׁוֹאֵל – וְאַתָּה בּוֹחֵר אֶת הַהֶסְבֵּר הַמְּדֻיָּק בְּיוֹתֵר.",
    bet: "קֹדֶם בּוֹחֲרִים תְּשׁוּבָה, וְאָז מַחְלִיטִים כַּמָּה בְּטוּחִים בָּהּ. בָּטוּחַ וְצוֹדֵק – מַרְוִיחַ יוֹתֵר. בַּסּוֹף תִּרְאֶה כַּמָּה אַתָּה מַכִּיר אֶת עַצְמְךָ.",
    ladder: "סֻלָּם שֶׁל שְׁאֵלוֹת שֶׁהוֹלְכוֹת וְנַעֲשׂוֹת קָשׁוֹת. יֵשׁ לְךָ שְׁלֹשָׁה גַּלְגַּלֵּי עֵזֶר – כָּל אֶחָד פַּעַם אַחַת בִּלְבַד.",
    whatnext: "הַסִּפּוּר נֶעֱצָר בָּרֶגַע הַמּוֹתֵחַ. מָה יִקְרֶה עַכְשָׁו? בְּחַר לְפִי מַה שֶּׁאַתָּה מֵבִין עַל הַצַּדִּיק.",
    whatq: "כָּאן הַכֹּל הָפוּךְ: הַתְּשׁוּבָה כְּבָר נְתוּנָה. אַתָּה צָרִיךְ לִמְצֹא אֵיזוֹ שְׁאֵלָה מַתְאִימָה לָהּ בְּדִיּוּק.",
    fill: "בַּמִּשְׁפָּט חֲסֵרָה מִלָּה. בְּחַר מִן הַמַּחְסָן אֶת הַמִּלָּה שֶׁמַּתְאִימָה לַמָּקוֹר.",
    twostep: "כָּל שְׁאֵלָה בִּשְׁנֵי צְעָדִים: קֹדֶם מַחְלִיטִים, וְאָז מְנַמְּקִים. רַק מִי שֶׁמֵּבִין אֶת הַטַּעַם – מַצְלִיחַ.",
    letters: "אֵין אֶפְשָׁרֻיּוֹת לִבְחִירָה! קְרָא אֶת הָרֶמֶז וְהַרְכֵּב אֶת הַתְּשׁוּבָה אוֹת אַחַר אוֹת.",
    sortg: "לְכָל כַּרְטִיס יֵשׁ קֻפְסָה אַחַת נְכוֹנָה. חֲשֹׁב לְאֵיזֶה חֵלֶק הוּא שַׁיָּךְ.",
    order: "סַדֵּר אֶת הַכַּרְטִיסִים לְפִי הַסֵּדֶר הַנָּכוֹן בְּעֶזְרַת הַחִצִּים, וּלְחַץ «בְּדֹק».",
    pairs: "חַבֵּר כָּל פְּרִיט מִיָּמִין לַפְּרִיט הַמַּתְאִים לוֹ מִשְּׂמֹאל. שִׂים לֵב – יֵשׁ גַּם פְּרִיטִים מַטְעִים.",
    whoami: "רֶמֶז אַחַר רֶמֶז. מִי שֶׁמְּזַהֶה כְּבָר בָּרֶמֶז הָרִאשׁוֹן – מְקַבֵּל יוֹתֵר.",
    dilemma: "אַתָּה בְּתוֹךְ הַסִּפּוּר. בְּכָל צֹמֶת בְּחַר מָה לַעֲשׂוֹת – וּרְאֵה לְאָן זֶה מוֹבִיל.",
    slots: "בְּחַר כַּרְטִיס מִן הַמַּחְסָן, וְאָז גַּע בַּמִּשְׁבֶּצֶת שֶׁהוּא שַׁיָּךְ אֵלֶיהָ.",
    journey: "רַבִּי עֲקִיבָא בַּדֶּרֶךְ – וְאַתָּה אִתּוֹ. בְּכָל תַּחֲנָה שְׁאֵלָה. תְּשׁוּבָה נְכוֹנָה מְקַדֶּמֶת אוֹתְךָ אֶל בֵּית הַמִּדְרָשׁ; שְׁאֵלָה שֶׁנִּכְשַׁלְתָּ בָּהּ – תַּחֲכֶּה לְךָ שׁוּב בְּסוֹף הַדֶּרֶךְ.",
    multi: "סַמֵּן אֶת כָּל הַמִּשְׁפָּטִים הַנְּכוֹנִים – וְרַק אוֹתָם. אֵין רֶמֶז כַּמָּה יֵשׁ.",
    safe: "אֵין אֶפְשָׁרֻיּוֹת! הַקְלֵד אֶת הַמִּסְפָּר הַנָּכוֹן כְּדֵי לִפְתֹּחַ אֶת הַמַּנְעוּל."
  };

  var G, pts, stage, sIdx, betLog, life, okIn = 0;
  function ok(n) { n = n || 1; pts += n * 10; okIn++; window.KT && KT.ok(n); bar(); climb(); }

  /* ---------- סֻלַּם הַחָכְמָה (15.11.2026, כְּמוֹ סֻלַּם הַר סִינַי שֶׁבְּחִידוֹנֵי הַהֲלָכָה): בַּצַּד, עוֹלֶה עִם כָּל תְּשׁוּבָה נְכוֹנָה עַד הַכֶּתֶר ---------- */
  function sizeOf(S) { if (S.m === "order" || S.m === "vanish" || S.m === "dilemma") return 1; var a = S.m === "whoami" ? S.items : (S.items || S.pairs || S.slots); return Math.max(1, (a && a.length) || 1); }
  function climb(top) {
    var c = $("#climb");
    if (!c) {
      c = document.createElement("div"); c.id = "climb";
      c.innerHTML = '<div class="crown">👑</div><div class="ladder"><div class="fill"></div><div class="cl-me">🧗</div></div><div class="pct">0%</div>';
      document.body.appendChild(c); document.body.classList.add("climbing");
    }
    var n = (G && G.stages.length) || 1, f;
    if (top) f = 1; else if (sIdx < 0) f = 0;
    else f = Math.min(1, (Math.min(sIdx, n) + (sIdx < n ? Math.min(1, okIn / sizeOf(G.stages[sIdx])) : 0)) / n);
    var L = $(".ladder", c);
    $$(".mark", L).forEach(function (m) { L.removeChild(m); });
    for (var i = 1; i < n; i++) L.insertAdjacentHTML("beforeend", '<div class="mark" style="bottom:' + (100 * i / n) + '%"></div>');
    $(".fill", c).style.height = (f * 100) + "%";
    $(".cl-me", c).style.bottom = "calc(" + (f * 100) + "% - " + Math.round(f * 22) + "px)";
    $(".pct", c).textContent = Math.round(f * 100) + "%";
    c.classList.toggle("top", f >= 1);
  }
  function bad() { window.KT && KT.bad(); }
  function bar() { var e = $("#pts"); if (e) e.textContent = pts; var s = $("#stg"); if (s) s.textContent = "שָׁלָב " + (sIdx + 1) + " מִתּוֹךְ " + G.stages.length; }
  function say(f, kind, html) {
    f.hidden = false; f.className = "fb " + kind;
    f.innerHTML = "<div>" + html + "</div>" +
      (kind === "no" ? '<div class="love">' + pick(LOVE_BAD) + "</div>" : '<div class="src">📜 ' + G.src + (kind === "ok" ? " · " + pick(LOVE_OK) : "") + "</div>");
  }
  function nextBtn(f, fn, txt) { var b = document.createElement("button"); b.className = "btn nx"; b.textContent = txt || "הֶמְשֵׁךְ ◀"; b.onclick = fn; f.appendChild(b); b.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function auto(fn) { if (DBG) window.__auto = fn; }

  /* שאלת בחירה: o = {q, a:[נכונה, מסיחים…], h, e, pre, gate, pts}. cb(first, failed) */
  function askMC(box, o, cb) {
    var n = 0, done = false, order = sh(o.a.map(function (_, i) { return i; }));
    box.innerHTML = (o.pre || "") + '<div class="q">' + o.q + '</div><div class="opts"></div><div class="fb" hidden></div>';
    var ob = $(".opts", box), f = $(".fb", box);
    function lock() { $$(".opt", ob).forEach(function (x) { x.disabled = true; }); }
    order.forEach(function (i) {
      var b = document.createElement("button"); b.className = "opt"; b.innerHTML = o.a[i]; b._i = i;
      b.onclick = function () {
        if (done) return;
        if (o.gate && n === 0 && !b._go) { o.gate(b, f); return; }
        if (i === 0) {
          done = true; b.classList.add("ok"); lock(); if (n === 0) ok(o.pts ? o.pts() : 1);
          say(f, "ok", (n === 0 ? "נָכוֹן! " : "עַכְשָׁו נָכוֹן. ") + (o.e || "")); nextBtn(f, function () { cb(n === 0, false); });
        } else {
          n++; bad(); b.classList.add("no"); b.disabled = true; b.classList.remove("sel");
          if (o.miss) o.miss();
          if (n === 1 && o.a.length > 2) say(f, "no", "לֹא בְּדִיּוּק. <b>רֶמֶז:</b> " + o.h);
          else if (n === 1) say(f, "no", "לֹא בְּדִיּוּק. <b>רֶמֶז:</b> " + o.h);
          else {
            done = true; lock(); $$(".opt", ob).forEach(function (x) { if (x._i === 0) x.classList.add("ok"); });
            say(f, "show", "הַתְּשׁוּבָה: <b>" + o.a[0] + "</b>. " + (o.e || "") + " <i>הַשְּׁאֵלָה תַּחְזֹר בַּהֶמְשֵׁךְ.</i>");
            nextBtn(f, function () { cb(false, true); });
          }
        }
      };
      ob.appendChild(b);
    });
    auto(function (wrong) {
      var nx = $(".nx", box); if (nx) return nx.click();
      var st = $(".stake", box); if (st) return st.click();
      var bs = $$(".opt", ob).filter(function (x) { return !x.disabled; });
      var t = bs.filter(function (x) { return wrong ? x._i !== 0 : x._i === 0; })[0] || bs[0]; t.click();
    });
    return { ob: ob, f: f };
  }
  /* תור פריטים: פריט שנכשל חוזר פעם אחת בסוף */
  function queue(items, render, done) {
    var q = items.slice(), tot = q.length, k = 0;
    (function nx() {
      if (!q.length) return done();
      var it = q.shift(); k++;
      render(it, function (first, failed) { if (failed && !it._r) { it._r = 1; q.push(it); } nx(); }, Math.min(k, tot), tot);
    })();
  }
  function head(S, i, n) { return '<div class="sh">' + (S.title ? "<b>" + S.title + "</b> · " : "") + (n ? i + " / " + n : "") + "</div>"; }

  var M = {};
  M.mc = function (S, done) {
    var fr = S.f || "mc", log = "";
    queue(S.items, function (it, cb, i, n) {
      var pre = head(S, i, n);
      if (fr === "whatnext" && it.t) { log += '<p class="chunk">' + it.t + "</p>"; pre += '<div class="story">' + log + "</div>"; }
      if (fr === "teach") pre += '<div class="bubble"><span class="who">🙋 יוֹאָב, הַתַּלְמִיד הֶחָדָשׁ:</span> ' + it.q + "</div>";
      if (fr === "journey") pre += '<div class="road">' + S.items.map(function (_, k) { return '<span class="' + (k < i - 1 ? "dn" : k === i - 1 ? "cu" : "") + '">' + (k < i - 1 ? "✓" : k === i - 1 ? "🚶" : "•") + "</span>"; }).join("") + '<span class="goal">🏛️</span></div>';
      if (fr === "ladder") pre += '<div class="ladder">' + S.items.map(function (_, k) { return '<i class="' + (k < i - 1 ? "dn" : k === i - 1 ? "cu" : "") + '"></i>'; }).join("") + '</div><div class="life">' +
        [["h", "🌀 חֲצִי־חֲצִי"], ["r", "💡 רֶמֶז"], ["s", "📜 הֲצָצָה בַּמָּקוֹר"]].map(function (l) { return '<button class="lf" data-l="' + l[0] + '"' + (life[l[0]] ? " disabled" : "") + ">" + l[1] + "</button>"; }).join("") + "</div>";
      var o = { q: fr === "teach" ? "אֵיזֶה הֶסְבֵּר תִּתֵּן לוֹ?" : it.q, a: it.a, h: it.h, e: it.e, pre: pre };
      if (fr === "bet") {
        var stake = 1;
        o.pts = function () { betLog.push([stake, 1]); return stake; };
        o.miss = function () { if (!it._b) { it._b = 1; betLog.push([stake, 0]); } };
        o.gate = function (b, f) {
          $$(".opt", b.parentNode).forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel");
          f.hidden = false; f.className = "fb ask"; f.innerHTML = "<div>כַּמָּה אַתָּה בָּטוּחַ בַּתְּשׁוּבָה הַזֹּאת?</div>";
          [[1, "מְנַחֵשׁ"], [2, "דֵּי בָּטוּחַ"], [3, "בָּטוּחַ לְגַמְרֵי"]].forEach(function (s) {
            var x = document.createElement("button"); x.className = "btn stake"; x.textContent = s[1] + " (×" + s[0] + ")";
            x.onclick = function () { stake = s[0]; b._go = 1; b.click(); }; f.appendChild(x);
          });
        };
      }
      var r = askMC(stage, o, cb);
      if (fr === "ladder") $$(".lf", stage).forEach(function (b) {
        b.onclick = function () {
          var l = b.dataset.l; life[l] = 1; b.disabled = true;
          if (l === "h") { var w = sh($$(".opt", r.ob).filter(function (x) { return x._i !== 0 && !x.disabled; })); w.slice(0, 2).forEach(function (x) { x.disabled = true; x.classList.add("no"); }); }
          else { r.f.hidden = false; r.f.className = "fb ask"; r.f.innerHTML = "<div>" + (l === "r" ? "<b>רֶמֶז:</b> " + it.h : "<b>מִן הַמָּקוֹר:</b> " + G.quote) + "</div>"; }
        };
      });
    }, done);
  };
  M.twostep = function (S, done) {
    queue(S.items, function (it, cb, i, n) {
      var pre = head(S, i, n) + (it.t ? '<div class="case">' + it.t + "</div>" : "");
      askMC(stage, { q: it.q1 || S.q1, a: it.a1, h: it.h1 || "קְרָא שׁוּב לְאַט, מִלָּה אַחַר מִלָּה.", e: it.e1 || "", pre: pre }, function (f1, x1) {
        askMC(stage, { q: it.q2 || S.q2, a: it.a2, h: it.h, e: it.e, pre: pre + '<div class="got">✔ ' + it.a1[0] + "</div>" }, function (f2, x2) { cb(f1 && f2, x1 || x2); });
      });
    }, done);
  };
  M.vanish = function (S, done) {
    var W = S.text.split(" "), rounds = S.rounds || [0.3, 0.6, 1], r = 0;
    function round() {
      if (r >= rounds.length) return done();
      var idx = sh(W.map(function (_, i) { return i; })).slice(0, Math.max(1, Math.round(W.length * rounds[r]))).sort(function (a, b) { return a - b; });
      var cur = 0, err = 0, tot = 0;
      var bank = sh(idx.map(function (i) { return W[i]; }).concat(S.decoys || []));
      function d(msg) {
        var hid = {}; idx.forEach(function (i, k) { hid[i] = k; });
        stage.innerHTML = head({ title: "סִבּוּב " + (r + 1) + " מִתּוֹךְ " + rounds.length }) + '<div class="mish">' + W.map(function (w, i) {
          if (!(i in hid)) return "<span>" + w + "</span>";
          return hid[i] < cur ? '<span class="got2">' + w + "</span>" : '<span class="gap' + (hid[i] === cur ? " cu" : "") + '">' + (hid[i] === cur && err >= 2 ? w.charAt(0) + "…" : "____") + "</span>";
        }).join(" ") + '</div><div class="bank"></div><div class="fb" hidden></div>';
        var bk = $(".bank", stage), f = $(".fb", stage);
        if (cur >= idx.length) {
          if (tot <= 1) ok(r + 1);
          say(f, "ok", r + 1 < rounds.length ? "הִשְׁלַמְתָּ אֶת הַסִּבּוּב! עַכְשָׁו יֵעָלְמוּ עוֹד מִלִּים." : "אַתָּה יוֹדֵעַ אֶת הַמִּשְׁנָה בְּעַל־פֶּה!");
          nextBtn(f, function () { r++; round(); }); auto(function () { $(".nx", stage).click(); }); return;
        }
        if (msg) say(f, "no", msg);
        bank.forEach(function (w, k) {
          var b = document.createElement("button"); b.className = "chip"; b.textContent = w;
          b.onclick = function () {
            if (w === W[idx[cur]]) { bank.splice(k, 1); cur++; err = 0; d(); }
            else { err++; tot++; bad(); d(err >= 2 ? "לֹא הַמִּלָּה הַזֹּאת. קִבַּלְתָּ אֶת הָאוֹת הָרִאשׁוֹנָה כְּרֶמֶז." : "לֹא הַמִּלָּה הַזֹּאת. אֱמֹר אֶת הַמִּשְׁפָּט בְּקוֹל וְנַסֵּה שׁוּב."); }
          };
          bk.appendChild(b);
        });
        auto(function (wrong) { var bs = $$(".chip", bk); (bs.filter(function (b) { return wrong ? b.textContent !== W[idx[cur]] : b.textContent === W[idx[cur]]; })[0] || bs[0]).click(); });
      }
      d();
    }
    round();
  };
  M.letters = function (S, done) {
    var ABC = "אבגדהוזחטיכלמנסעפצקרשת".split("");
    queue(S.items, function (it, cb, i, n) {
      var L = it.w.match(/[א-ת][֑-ׇ]*|[ ־]/g), need = L.filter(function (x) { return !/^[ ־]$/.test(x); });
      var extra = sh(ABC).slice(0, 3), tiles = sh(need.concat(extra)), cur = 0, err = 0;
      function d(msg) {
        var k = 0;
        stage.innerHTML = head(S, i, n) + '<div class="q">' + it.c + '</div><div class="word">' + L.map(function (x) {
          if (/^[ ־]$/.test(x)) return '<span class="sp">' + (x === " " ? "&nbsp;" : x) + "</span>";
          var s = k < cur ? x : (k === cur && err >= 2 ? x : ""); k++; return '<span class="cell' + (s && k - 1 >= cur ? " hint" : "") + '">' + s + "</span>";
        }).join("") + '</div><div class="bank"></div><div class="fb" hidden></div>';
        var bk = $(".bank", stage), f = $(".fb", stage);
        if (cur >= need.length) {
          var good = err < 3; if (good) ok(1);
          say(f, good ? "ok" : "show", "<b>" + it.w + "</b>. " + it.e + (good ? "" : " <i>הַפְּרִיט יַחְזֹר בַּהֶמְשֵׁךְ.</i>")); nextBtn(f, function () { cb(good, !good); });
          auto(function () { $(".nx", stage).click(); }); return;
        }
        if (msg) say(f, "no", msg);
        tiles.forEach(function (t, j) {
          var b = document.createElement("button"); b.className = "tile"; b.textContent = t.charAt(0);
          b.onclick = function () {
            if (t.charAt(0) === need[cur].charAt(0)) { tiles.splice(j, 1); cur++; d(); }
            else { err++; bad(); d(err >= 2 ? "לֹא הָאוֹת הַזֹּאת. הָאוֹת הַבָּאָה מְסֻמֶּנֶת לְךָ כְּרֶמֶז." + (it.h ? " <b>רֶמֶז:</b> " + it.h : "") : "לֹא הָאוֹת הַזֹּאת. " + (it.h ? "<b>רֶמֶז:</b> " + it.h : "נַסֵּה שׁוּב.")); }
          };
          bk.appendChild(b);
        });
        auto(function (wrong) { var bs = $$(".tile", bk); (bs.filter(function (b) { return wrong ? b.textContent !== need[cur].charAt(0) : b.textContent === need[cur].charAt(0); })[0] || bs[0]).click(); });
      }
      d();
    }, done);
  };
  M.sortg = function (S, done) {
    queue(sh(S.items), function (it, cb, i, n) {
      askMC(stage, { q: S.q || "לְאֵיזוֹ קֻפְסָה שַׁיָּךְ הַכַּרְטִיס?", a: [S.cats[it[1]]].concat(S.cats.filter(function (_, k) { return k !== it[1]; })), h: it[3] || S.h || "חֲשֹׁב עַל הַמִּלִּים הַמְּדֻיָּקוֹת שֶׁל כָּל חֵלֶק.", e: it[2], pre: head(S, i, n) + '<div class="card1">' + it[0] + "</div>" }, cb);
      $(".opts", stage).classList.add("boxes");
    }, done);
  };
  M.order = function (S, done) {
    var want = S.items, cur = sh(want), tries = 0;
    while (cur.join("|") === want.join("|")) cur = sh(want);
    function d(msg, mark) {
      stage.innerHTML = head(S) + '<div class="q">' + (S.q || "סַדֵּר לְפִי הַסֵּדֶר הַנָּכוֹן:") + '</div><div class="ord"></div><div class="center"><button class="btn" id="chk">בְּדֹק ✔</button></div><div class="fb" hidden></div>';
      var o = $(".ord", stage), f = $(".fb", stage);
      cur.forEach(function (t, k) {
        var r = document.createElement("div"); r.className = "row" + (mark ? (t === want[k] ? " ok" : " no") : "");
        r.innerHTML = '<span class="num">' + (k + 1) + '</span><span class="tx">' + t + '</span><span class="arr"><button aria-label="למעלה">▲</button><button aria-label="למטה">▼</button></span>';
        var bs = $$("button", r);
        bs[0].disabled = k === 0; bs[1].disabled = k === cur.length - 1;
        bs[0].onclick = function () { var x = cur[k - 1]; cur[k - 1] = cur[k]; cur[k] = x; d(); };
        bs[1].onclick = function () { var x = cur[k + 1]; cur[k + 1] = cur[k]; cur[k] = x; d(); };
        o.appendChild(r);
      });
      if (msg) say(f, "no", msg);
      $("#chk").onclick = function () {
        var good = cur.filter(function (x, k) { return x === want[k]; }).length;
        if (good === cur.length) {
          ok(Math.max(1, 3 - tries)); $$(".row", o).forEach(function (r) { r.classList.add("ok"); }); $$("button", stage).forEach(function (b) { b.disabled = true; });
          say(f, "ok", "הַסֵּדֶר מְדֻיָּק! " + (S.e || "")); nextBtn(f, done);
        } else { tries++; bad(); d(tries === 1 ? good + " מִתּוֹךְ " + cur.length + " בִּמְקוֹמָם. עֲדַיִן לֹא אוֹמֵר אֵילוּ – חֲשֹׁב מָה גָּרַם לְמָה." : good + " מִתּוֹךְ " + cur.length + " בִּמְקוֹמָם. הַיְּרֻקִּים בִּמְקוֹמָם – הָזֵז אֶת הָאֲדֻמִּים.", tries >= 2); }
      };
      auto(function (wrong) { var nx = $(".nx", stage); if (nx) return nx.click(); if (!wrong) cur = want.slice(); d(); $("#chk").click(); });
    }
    d();
  };
  M.pairs = function (S, done) {
    var L = sh(S.pairs.map(function (p, i) { return i; })), R = sh(S.pairs.map(function (p, i) { return { t: p[1], i: i }; }).concat((S.decoys || []).map(function (t) { return { t: t, i: -1 }; })));
    var sel = -1, hit = {}, miss = {};
    function d(kind, msg) {
      stage.innerHTML = head(S) + '<div class="q">' + (S.q || "חַבֵּר:") + '</div><div class="pr"><div class="col" id="cl"></div><div class="col" id="cr"></div></div><div class="fb" hidden></div>';
      var f = $(".fb", stage);
      L.forEach(function (i) { var b = document.createElement("button"); b.className = "pc" + (hit[i] ? " ok" : sel === i ? " sel" : ""); b.innerHTML = S.pairs[i][0]; b.disabled = !!hit[i]; b.onclick = function () { sel = i; d(); }; $("#cl").appendChild(b); });
      R.forEach(function (o) {
        var b = document.createElement("button"); b.className = "pc" + (hit[o.i] ? " ok" : ""); b.innerHTML = o.t; b.disabled = !!hit[o.i];
        b.onclick = function () {
          if (sel < 0) return d("ask", "קֹדֶם בְּחַר פְּרִיט מִיָּמִין.");
          if (o.i === sel) { hit[sel] = 1; if (!miss[sel]) ok(1); var e = S.pairs[sel][2] || ""; sel = -1; d("ok", "מַתְאִים! " + e); }
          else { miss[sel] = 1; bad(); d("no", "לֹא מַתְאִים. <b>רֶמֶז:</b> " + (S.h || "חֲשֹׁב מָה הַטַּעַם שֶׁל כָּל מַעֲשֶׂה.")); }
        };
        $("#cr").appendChild(b);
      });
      if (kind) say(f, kind === "ask" ? "show" : kind, msg);
      if (Object.keys(hit).length === S.pairs.length) nextBtn(f, done);
      auto(function (wrong) {
        var nx = $(".nx", stage); if (nx) return nx.click();
        var i = L.filter(function (x) { return !hit[x]; })[0]; sel = i; d();
        var bs = $$("#cr .pc", stage), k = R.map(function (o) { return o.i; }).indexOf(i);
        if (wrong) k = R.map(function (o) { return o.i !== i && !hit[o.i]; }).indexOf(true); if (k < 0) k = R.map(function (o) { return o.i; }).indexOf(i);
        bs[k].click();
      });
    }
    d();
  };
  M.whoami = function (S, done) {
    var pool = S.items.map(function (x) { return x.a; }).concat(S.opts || []);
    queue(S.items, function (it, cb, i, n) {
      var c = 1, opts = sh(pool), off = {}, fin = false;
      function d(kind, msg) {
        stage.innerHTML = head(S, i, n) + '<div class="q">מִי אֲנִי?</div><ol class="clues">' + it.c.slice(0, c).map(function (x) { return "<li>" + x + "</li>"; }).join("") + '</ol><div class="bank"></div><div class="center"><button class="btn ghost" id="more">עוֹד רֶמֶז (פָּחוֹת נְקֻדּוֹת)</button></div><div class="fb" hidden></div>';
        var bk = $(".bank", stage), f = $(".fb", stage);
        $("#more").disabled = fin || c >= it.c.length; $("#more").onclick = function () { c++; d(); };
        opts.forEach(function (o) {
          var b = document.createElement("button"); b.className = "chip" + (off[o] ? " no" : ""); b.innerHTML = o; b.disabled = fin || !!off[o];
          b.onclick = function () {
            if (o === it.a) { fin = true; var p = c === 1 ? 2 : c <= 2 ? 1 : 0; if (p) ok(p); d(p ? "ok" : "show", "<b>" + it.a + "</b>. " + it.e + (p ? "" : " <i>הַחִידָה תַּחְזֹר בַּהֶמְשֵׁךְ.</i>")); nextBtn($(".fb", stage), function () { cb(p > 0, p === 0); }); }
            else { off[o] = 1; bad(); if (c < it.c.length) c++; d("no", "לֹא אֲנִי. קִבַּלְתָּ רֶמֶז נוֹסָף."); }
          };
          bk.appendChild(b);
        });
        if (kind) say(f, kind, msg);
        auto(function (wrong) { var nx = $(".nx", stage); if (nx) return nx.click(); var bs = $$(".chip", bk).filter(function (b) { return !b.disabled; }); (bs.filter(function (b) { return wrong ? b.innerHTML !== it.a : b.innerHTML === it.a; })[0] || bs[0]).click(); });
      }
      d();
    }, done);
  };
  M.dilemma = function (S, done) {
    var id = S.start || "a", off = {}, path = "";
    function d(kind, msg, after) {
      var N = S.nodes[id];
      stage.innerHTML = head(S) + (path ? '<div class="story">' + path + "</div>" : "") + '<div class="case">' + N.t + '</div><div class="q">' + (N.q || "מָה תַּעֲשֶׂה?") + '</div><div class="opts"></div><div class="fb" hidden></div>';
      var ob = $(".opts", stage), f = $(".fb", stage);
      (N._o || (N._o = sh(N.o))).forEach(function (o, k) {
        var b = document.createElement("button"); b.className = "opt" + (off[id + k] ? " no" : "") + (after && N._p === k ? " ok" : ""); b.innerHTML = o[0]; b.disabled = !!after || !!off[id + k]; b._k = o[3];
        b.onclick = function () {
          N._p = k;
          if (o[3] === 1) { if (!N._m) ok(1); b.classList.add("ok"); var cur = N; d("ok", o[2], function () { path += '<p class="chunk">' + cur.t + " <b>← " + o[0] + "</b></p>"; if (o[1] === "END") return done(); id = o[1]; d(); }); }
          else if (o[3] === 2) { d("show", o[2], function () { id = o[1]; d(); }); }
          else { N._m = 1; off[id + k] = 1; bad(); d("no", o[2]); }
        };
        ob.appendChild(b);
      });
      if (kind) { say(f, kind, msg); if (after) nextBtn(f, after); }
      auto(function (wrong) { var nx = $(".nx", stage); if (nx) return nx.click(); var bs = $$(".opt", ob).filter(function (b) { return !b.disabled; }); (bs.filter(function (b) { return wrong ? b._k !== 1 : b._k === 1; })[0] || bs[0]).click(); });
    }
    d();
  };
  M.slots = function (S, done) {
    var bank = sh(S.slots.map(function (s) { return s[1]; }).concat(S.decoys || [])), fill = {}, sel = null, miss = {};
    function d(kind, msg) {
      stage.innerHTML = head(S) + '<div class="q">' + (S.q || "שַׁבֵּץ כָּל כַּרְטִיס בִּמְקוֹמוֹ:") + '</div><div class="slots"></div><div class="bank"></div><div class="fb" hidden></div>';
      var sl = $(".slots", stage), bk = $(".bank", stage), f = $(".fb", stage);
      S.slots.forEach(function (s, k) {
        var b = document.createElement("button"); b.className = "slot" + (fill[k] ? " ok" : ""); b.disabled = !!fill[k];
        b.innerHTML = '<span class="lab">' + s[0] + '</span><span class="val">' + (fill[k] ? s[1] : "⬚") + "</span>";
        b.onclick = function () {
          if (sel == null) return d("ask", "קֹדֶם בְּחַר כַּרְטִיס מִן הַמַּחְסָן שֶׁלְּמַטָּה.");
          if (bank[sel] === s[1]) { fill[k] = 1; bank.splice(sel, 1); sel = null; if (!miss[k]) ok(1); d("ok", "בִּמְקוֹמוֹ! " + (s[2] || "")); }
          else { miss[k] = 1; bad(); d("no", "לֹא כָּאן. <b>רֶמֶז:</b> " + (S.h || "קְרָא שׁוּב אֶת כּוֹתֶרֶת הַמִּשְׁבֶּצֶת.")); }
        };
        sl.appendChild(b);
      });
      bank.forEach(function (t, k) { var b = document.createElement("button"); b.className = "chip" + (sel === k ? " sel" : ""); b.innerHTML = t; b.onclick = function () { sel = k; d(); }; bk.appendChild(b); });
      if (kind) say(f, kind === "ask" ? "show" : kind, msg);
      if (Object.keys(fill).length === S.slots.length) { bk.innerHTML = ""; nextBtn(f, done); }
      auto(function (wrong) {
        var nx = $(".nx", stage); if (nx) return nx.click();
        var k = S.slots.map(function (_, i) { return i; }).filter(function (i) { return !fill[i]; })[0];
        sel = bank.indexOf(S.slots[k][1]); if (wrong) sel = (sel + 1) % bank.length; d(); $$(".slot", stage)[k].click();
      });
    }
    d();
  };
  M.multi = function (S, done) {
    var its = sh(S.items), on = {}, tries = 0, fin = false;
    function d(kind, msg, mark) {
      stage.innerHTML = head(S) + '<div class="q">' + S.q + '</div><div class="mul"></div><div class="center"><button class="btn" id="chk">בְּדֹק ✔</button></div><div class="fb" hidden></div>';
      var m = $(".mul", stage), f = $(".fb", stage);
      its.forEach(function (it, k) {
        var b = document.createElement("button"); b.className = "mi" + (on[k] ? " sel" : "") + (mark ? (!!on[k] === it[1] ? " ok" : " no") : ""); b.disabled = fin;
        b.innerHTML = '<span class="bx">' + (on[k] ? "☑" : "☐") + "</span><span>" + it[0] + (fin && it[2] ? '<small>' + it[2] + "</small>" : "") + "</span>";
        b.onclick = function () { on[k] = !on[k]; d(null, null, false); }; m.appendChild(b);
      });
      if (kind) say(f, kind, msg);
      $("#chk").disabled = fin;
      $("#chk").onclick = function () {
        var wrong = its.filter(function (it, k) { return !!on[k] !== it[1]; }).length;
        if (!wrong) { fin = true; var p = Math.max(1, 3 - tries); ok(p); d("ok", "בְּדִיּוּק! " + (S.e || ""), true); nextBtn($(".fb", stage), done); }
        else {
          tries++; bad();
          if (tries >= 3) { fin = true; its.forEach(function (it, k) { on[k] = it[1]; }); d("show", "הִנֵּה הַסִּמּוּן הַנָּכוֹן. קְרָא אֶת הַהֶסְבֵּר שֶׁלְּיַד כָּל מִשְׁפָּט. " + (S.e || ""), true); nextBtn($(".fb", stage), done); }
          else d("no", tries === 1 ? "יֵשׁ " + wrong + " טָעֻיּוֹת (סִמּוּן מְיֻתָּר אוֹ חָסֵר). <b>רֶמֶז:</b> " + (S.h || "בְּדֹק כָּל מִשְׁפָּט מוּל לְשׁוֹן הַמָּקוֹר.") : "עֲדַיִן " + wrong + " טָעֻיּוֹת. הָאֲדֻמִּים – שְׁגוּיִים.", tries >= 2);
        }
      };
      auto(function (wrong) { var nx = $(".nx", stage); if (nx) return nx.click(); if (!wrong) its.forEach(function (it, k) { on[k] = it[1]; }); d(); $("#chk").click(); });
    }
    d();
  };
  M.safe = function (S, done) {
    queue(S.items, function (it, cb, i, n) {
      var typed = "", err = 0, fin = false;
      function d(kind, msg) {
        stage.innerHTML = head(S, i, n) + '<div class="q">' + it.q + '</div><div class="lock">' + (fin ? "🔓" : "🔒") + ' <span class="disp">' + (typed || "_") + '</span></div><div class="pad"></div><div class="fb" hidden></div>';
        var pad = $(".pad", stage), f = $(".fb", stage);
        "1234567890".split("").concat(["⌫", "פְּתַח"]).forEach(function (k) {
          var b = document.createElement("button"); b.className = "key" + (k === "פְּתַח" ? " go" : ""); b.textContent = k; b.disabled = fin;
          b.onclick = function () {
            if (k === "⌫") { typed = typed.slice(0, -1); return d(); }
            if (k !== "פְּתַח") { if (typed.length < 4) typed += k; return d(); }
            if (typed === String(it.n)) { fin = true; if (err < 2) ok(err ? 1 : 2); d("ok", "הַמַּנְעוּל נִפְתַּח! " + it.e); nextBtn($(".fb", stage), function () { cb(err === 0, false); }); }
            else {
              err++; bad(); typed = "";
              if (err >= 3) { fin = true; typed = String(it.n); d("show", "הַמִּסְפָּר: <b>" + it.n + "</b>. " + it.e + " <i>הַמַּנְעוּל יַחְזֹר בַּהֶמְשֵׁךְ.</i>"); nextBtn($(".fb", stage), function () { cb(false, true); }); }
              else d("no", "הַמַּנְעוּל לֹא נִפְתַּח. " + (err === 2 ? "<b>רֶמֶז:</b> " + it.h : "סְפֹר שׁוּב בִּזְהִירוּת."));
            }
          };
          pad.appendChild(b);
        });
        if (kind) say(f, kind, msg);
        auto(function (wrong) { var nx = $(".nx", stage); if (nx) return nx.click(); typed = wrong ? "999" : String(it.n); d(); $(".key.go", stage).click(); });
      }
      d();
    }, done);
  };

  /* ---------- מסכים ---------- */
  function typeKey(S) { return S.m === "mc" ? (S.f || "mc") : S.m; }
  function intro() {
    var S0 = G.stages[0];
    stage.innerHTML = '<div class="intro"><div class="badge">' + G.type + "</div><h2>" + G.title + '</h2><p class="lead">' + G.intro + '</p><div class="how"><b>אֵיךְ מְשַׂחֲקִים?</b> ' + HOW[typeKey(S0)] + '</div><p class="srcline">📜 ' + G.src + '</p><p class="note">הַמִּשְׂחָק הַזֶּה קָשֶׁה בְּכַוָּנָה. כְּדַאי לִקְרֹא קֹדֶם אֶת הַסִּפּוּר: <a href="' + BOOK + "#story-" + G.id + '" target="_blank" rel="noopener">לַסִּפּוּר הַמָּלֵא ↗</a></p><div class="center"><button class="btn big" id="go">מַתְחִילִים ◀</button></div></div>';
    $("#go").onclick = function () { sIdx = 0; run(); };
    auto(function () { $("#go").click(); });
  }
  function run() {
    if (sIdx >= G.stages.length) return end();
    okIn = 0; bar(); climb(); var S = G.stages[sIdx];
    M[S.m](S, function () { sIdx++; run(); });
    window.scrollTo(0, 0);
  }
  function end() {
    climb(true);
    var d = get("tn-done", {}); d[G.id] = Math.max(d[G.id] || 0, pts); put("tn-done", d);
    var cal = "";
    if (betLog.length) {
      var s3 = betLog.filter(function (x) { return x[0] === 3; }), r3 = s3.filter(function (x) { return x[1]; }).length;
      cal = '<div class="how"><b>כַּמָּה אַתָּה מַכִּיר אֶת עַצְמְךָ?</b> ' + (s3.length ? "אָמַרְתָּ «בָּטוּחַ לְגַמְרֵי» " + s3.length + " פְּעָמִים, וְצָדַקְתָּ בְּ־" + r3 + " מֵהֶן. " + (r3 === s3.length ? "אַתָּה יוֹדֵעַ מָתַי אַתָּה יוֹדֵעַ – זוֹ חָכְמָה גְּדוֹלָה." : "לִפְעָמִים אֲנַחְנוּ בְּטוּחִים וְטוֹעִים. עָנָו הוּא מִי שֶׁבּוֹדֵק אֶת עַצְמוֹ.") : "לֹא אָמַרְתָּ אַף פַּעַם «בָּטוּחַ לְגַמְרֵי». אוּלַי אַתָּה יוֹדֵעַ יוֹתֵר מִמַּה שֶּׁנִּדְמֶה לְךָ.") + "</div>";
    }
    stage.innerHTML = '<div class="intro"><div class="badge">סִיַּמְתָּ! ' + pts + ' נְקֻדּוֹת</div><h2>' + G.title + "</h2>" + cal +
      '<div class="me"><h3>💭 וּמָה זֶה אוֹמֵר עָלַי?</h3><p>' + G.me + '</p><textarea id="me" rows="3" placeholder="כְּתֹב כָּאן לְעַצְמְךָ…"></textarea><small>מַה שֶּׁתִּכְתֹּב נִשְׁאָר רַק בַּמַּכְשִׁיר הַזֶּה, וְאֵינוֹ נִשְׁלָח לְאַף אֶחָד.</small></div>' +
      '<div class="center"><a class="btn" href="index.html">לְכָל הַרְפַּתְקָאוֹת הַתַּנָּאִים</a> <button class="btn ghost" id="again">לְשַׂחֵק שׁוּב</button></div></div>';
    var ta = $("#me"); ta.value = get("tn-me-" + G.id, ""); ta.oninput = function () { put("tn-me-" + G.id, ta.value); };
    $("#again").onclick = start; window.__auto = null; window.__done = true;
    window.KT && KT.end(); window.scrollTo(0, 0);
  }
  function start() {
    pts = 0; sIdx = 0; betLog = []; life = {}; window.__done = false;
    G = JSON.parse(JSON.stringify(G0)); sIdx = -1; okIn = 0; intro(); climb(); sIdx = 0; bar();
  }
  var G0;
  window.TNboot = function () {
    stage = $("#stage");
    var id = +P.get("s"); G0 = TN.filter(function (g) { return g.id === id; })[0];
    if (!G0) { stage.innerHTML = '<p class="center">הַמִּשְׂחָק לֹא נִמְצָא. <a href="index.html">לָרְשִׁימָה</a></p>'; return; }
    document.title = G0.title + " – " + G0.tanna + " | הַרְפַּתְקָאוֹת הַתַּנָּאִים";
    $("#ttl").textContent = G0.tanna; $("#sub").textContent = G0.type;
    window.KT && KT.init({ id: "tn-" + G0.id, title: "הרפתקת התנאים – " + G0.title.replace(/[֑-ׇ]/g, ""), home: "index.html", homeTxt: "🗺️ לכל הרפתקאות התנאים", praise: window.KT_PRAISE, again: start });
    start();
  };
  window.TNhub = function () {
    var done = get("tn-done", {}), h = "", last = "";
    TN.forEach(function (g) {
      if (g.tanna !== last) { if (last) h += "</div>"; h += '<h2 class="th">' + g.tanna + '</h2><div class="grid">'; last = g.tanna; }
      h += '<a class="gc' + (done[g.id] ? " dn" : "") + '" href="game.html?s=' + g.id + '"><span class="gt">' + g.type + "</span><b>" + g.title + "</b><small>📜 " + g.src + "</small>" + (done[g.id] ? '<span class="sc">✔ ' + done[g.id] + "</span>" : "") + "</a>";
    });
    $("#hub").innerHTML = h + "</div>";
    $("#cnt").textContent = TN.length + " הַרְפַּתְקָאוֹת · " + Object.keys(done).length + " הֻשְׁלְמוּ";
  };
})();
