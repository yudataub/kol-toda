/* kt-game.js – שכבה משותפת למשחקי הפרשה (kol-toda.co.il/parasha-games ומשחקי הפרשה הישנים ב-apps/) – מ-7.11.2026.
   כמו בחידוני ההלכה ומקור חיים: רישום שם/כיתה/בית ספר (אותו "hq-me" – מי שנרשם שם מזוהה גם כאן), 10 נקודות לכל
   תשובה נכונה, מחמאות שמתפתחות לפי מספר התשובות, משפטי אהבת ה', צלילי רצף, דרגות ולוח מצטיינים (למשחק, לכל
   משחקי הפרשה, לכיתות). השרת: Apps Script נפרד, גיליון "משחקי הפרשה – נקודות" (torah-game/parasha-games-server).

   חיבור למשחק (שלוש נקודות בלבד):
     <script src="kt-game.js"></script>                      (בדף ב-apps/: src="../parasha-games/kt-game.js")
     KT.init({ id: "bereshit", title: "בראשית – סידור הבריאה" });
     KT.ok()     – תשובה/צעד נכון (מוסיף 10 נקודות, צליל ומחמאה). KT.ok(2) = 20 נקודות.
     KT.ok(1, key) – עם מזהה שאלה: במשחק שאפשר לחזור בו על שיעור, שאלה שכבר נענתה נכון לא נותנת שוב נקודות.
     KT.bad()    – טעות (צליל עדין ומילת עידוד; לא מוריד נקודות).
     KT.end()    – סוף המשחק: שומר את הנקודות בשרת ופותח את לוח המצטיינים. אחרי end, ה-ok הבא פותח סבב חדש.
   הדף לא נשבר אם הקובץ לא נטען: במשחקים קוראים ל-window.KT && KT.ok(). */
(function () {
  var API_URL = "https://script.google.com/macros/s/AKfycbwxMBxKv7Cl1DvmuBsfnfexPr9FHRNBD6GU-vyRNRHeBsTyxfi99rU9CMPocAT291Na/exec";
  var HOME = (location.pathname.indexOf("/parasha-games/") !== -1 ? "" : "../parasha-games/") + "index.html";
  var PER_RIGHT = 10, DEFAULT_NAME = "תַּלְמִיד יָקָר";
  var GR = { a: "א", b: "ב", c: "ג", d: "ד", e: "ה", f: "ו", g: "ז", h: "ח" };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function me() { try { return JSON.parse(get("hq-me") || "null") || {}; } catch (e) { return {}; } }
  function real(m) { return !!(m && m.name && m.cls && m.school); }
  function esc(x) { var d = document.createElement("div"); d.textContent = x == null ? "" : String(x); return d.innerHTML; }
  function nk(x) { return String(x || "").toLowerCase().replace(/[^א-תa-z0-9]/g, ""); }
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var BAG = {};
  function draw(key, list) { if (!BAG[key] || !BAG[key].length) BAG[key] = shuffle(list); return BAG[key].pop(); }
  function nm(s) { return s.replace("{n}", esc(me().name || DEFAULT_NAME)); }

  /* ---------- צלילים (כמו בחידוני הדינים) ---------- */
  var ac = null;
  function muted() { return get("hq-mute") === "1"; }
  function tone(freqs, step) {
    if (muted()) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        var t = ac.currentTime + i * step;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.95);
        o.start(t); o.stop(t + step);
      });
    } catch (e) {}
  }
  var SCALE = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319, 1397, 1568];
  function soundStreak(n) {
    if (n >= 10 && n % 10 === 0) { tone([523, 659, 784, 1047, 1319, 1047, 1319, 1568], 0.12); return; }
    var m = Math.min(n, 9), k = Math.min(m + 1, 9), base = Math.min(m - 1, 3);
    tone(SCALE.slice(base, base + k), Math.max(0.07, 0.14 - m * 0.008));
  }
  function soundBad() { tone([330, 262], 0.18); }
  function song(seq) {
    if (muted()) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      var t = ac.currentTime + 0.05;
      seq.forEach(function (n) {
        n[0].forEach(function (f, j) {
          var o = ac.createOscillator(), g = ac.createGain();
          o.type = j ? "sine" : "triangle"; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
          var v = j ? 0.09 : 0.2;
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + n[1] * 0.98);
          o.start(t); o.stop(t + n[1]);
        });
        t += n[1];
      });
    } catch (e) {}
  }
  function soundGrand() {
    var C4 = 262, E4 = 330, G4 = 392, C5 = 523, D5 = 587, E5 = 659, F5 = 698, G5 = 784, A5 = 880, B5 = 988, C6 = 1047;
    song([[[G4], .16], [[C5, E4], .16], [[E5, G4], .16], [[G5, C5], .38], [[E5, C5], .16], [[G5, E5], .5],
          [[A5, F5], .16], [[G5, E5], .16], [[F5, D5], .16], [[E5, C5], .16], [[D5, B5 / 2], .16], [[E5, C5], .38],
          [[G4], .14], [[C5], .14], [[E5], .14], [[G5], .14], [[C6, E5], .14], [[E5], .14], [[G5], .14], [[C6, G5], .3],
          [[B5, G5], .16], [[C6, E5, G5, C5], 1.4]]);
  }

  /* ---------- מחמאות ---------- */
  var FB_OK = ["", "נָכוֹן ✓", "הִצְלַחְתָּ! ✓", "מְצֻיָּן, {n}! ⭐", "כָּל הַכָּבוֹד, {n}! 🎯", "אֲנִי רוֹאֶה שֶׁהִשְׁקַעְתָּ מַחֲשָׁבָה, {n}! 💪",
    "עוֹד צַעַד בַּמַּסָּע שֶׁלְּךָ בַּפָּרָשָׁה, {n}! 🌟", "מַדְהִים לִרְאוֹת אֶת הַהַתְמָדָה שֶׁלְּךָ! 🎉", "מַמָּשׁ אַלּוּף, {n}! 🏆",
    "וָאוּ! 💫 אַתָּה כְּבָר מַכִּיר אֶת הַפָּרָשָׁה הַזֹּאת!"];
  var FB_OK_10 = ["אַשְׁרֶיךָ, {n}! 🌍 כָּל דְּבַר תּוֹרָה שֶׁלָּמַדְתָּ מְקָרֵב אוֹתְךָ לְהַשֵּׁם",
    "אֵין עָלֶיךָ, {n}! 👑 אַתָּה מַמָּשׁ בֶּן־בַּיִת בַּפָּרָשָׁה",
    "כֹּחַ גָּדוֹל, {n}! 🔥 הָרֶצֶף שֶׁלְּךָ מַרְשִׁים מְאוֹד",
    "אוֹצָר, {n}! 💎 כָּל תְּשׁוּבָה נְכוֹנָה הִיא עוֹד אֶבֶן יְקָרָה",
    "וָאוּ, {n}! 🚀 אַתָּה מַמְרִיא קָדִימָה",
    "יֵשׁ לְךָ רֹאשׁ שֶׁל תַּלְמִיד חָכָם, {n}! 🧠✨",
    "חֲתִיכַת תַּלְמִיד, {n}! 📚 מַמָּשׁ נֶהֱנֶה לִרְאוֹת"];
  var LOVE_OK = ["הַשֵּׁם שָׂמֵחַ כְּשֶׁאַתָּה לוֹמֵד אֶת הַתּוֹרָה שֶׁלּוֹ בְּאַהֲבָה 💖",
    "הַתּוֹרָה הִיא מַתָּנָה מֵהַשֵּׁם – וְאַתָּה פּוֹתֵחַ אוֹתָהּ! 🎁",
    "כָּל דְּבַר תּוֹרָה שֶׁלָּמַדְתָּ נִשְׁאָר אִתְּךָ לְתָמִיד 💎",
    "הַשֵּׁם אוֹהֵב אֶת הַלֵּב שֶׁלְּךָ שֶׁרוֹצֶה לָדַעַת 💗",
    "״מָה אָהַבְתִּי תוֹרָתֶךָ״ – גַּם אַתָּה אוֹהֵב אוֹתָהּ! 📖",
    "הַפָּרָשָׁה שֶׁל הַשָּׁבוּעַ הִיא מִכְתָּב אַהֲבָה מֵהַשֵּׁם אֵלֶיךָ 💌",
    "הַשֵּׁם שָׂמֵחַ כְּשֶׁיְּלָדִים לוֹמְדִים אֶת הַתּוֹרָה שֶׁלּוֹ 😊",
    "כָּל פָּסוּק שֶׁאַתָּה מַכִּיר הוּא עוֹד שְׁבִיל קָטָן אֶל הַשֵּׁם 🛤️",
    "בְּשַׁבָּת תּוּכַל לְסַפֵּר אֶת זֶה לְכֻלָּם סְבִיב הַשֻּׁלְחָן! 🕯️",
    "מִי שֶׁלּוֹמֵד תּוֹרָה – מַכִּין מַתָּנָה לְהַשֵּׁם 🎀"];
  var OOPS = ["לֹא בְּדִיּוּק, {n}... 🤔", "כִּמְעַט, {n}! 🌱", "נַסֵּה שׁוּב, {n} 💡", "הַשְּׁאֵלָה הַזֹּאת קְצָת מְאַתְגֶּרֶת 🧩"];
  var LOVE_BAD = ["גַּם כְּשֶׁטּוֹעִים – לוֹמְדִים! הַשֵּׁם אוֹהֵב אוֹתְךָ 💛",
    "הַשֵּׁם רוֹאֶה אֶת הַמַּאֲמָץ שֶׁלְּךָ – וְהוּא שָׂמֵחַ בּוֹ 💛",
    "גַּם חֲכָמִים גְּדוֹלִים לָמְדוּ מִטָּעֻיּוֹת 📚",
    "הַשֵּׁם לֹא מְחַכֶּה שֶׁנִּהְיֶה מֻשְׁלָמִים – הוּא שָׂמֵחַ שֶׁאֲנַחְנוּ מִשְׁתַּדְּלִים 🤍",
    "כָּל טָעוּת הִיא צַעַד לְהַצְלָחָה. מַמְשִׁיכִים! 🌱"];
  /* מַחְמָאוֹת הַמִּשְׁתַּמֵּשׁ (8.11.2026) עִם הַקְלָטָה בְּקוֹל גֶּבֶר (Gemini TTS, קוֹל Iapetus, torah-game/parasha-games-server/tts_praise.py).
     רַק בְּמִשְׂחֲקֵי הַפָּרָשָׁה (parasha-games/, apps/), מֵהַתְּשׁוּבָה הַשְּׁלִישִׁית. כְּתוֹבוֹת הַקּוֹל מְפֹרָשׁוֹת – kol/offload.py מַחְלִיף אוֹתָן לְכְתוֹבֶת מְלֵאָה. */
  var PRAISE = [
    "כַּמָּה נַחַת רוּחַ עָשִׂיתָ עַכְשָׁו לְהַשֵּׁם עִם הַתְּשׁוּבָה הַזֹּאת! 😊",
    "הַקָּדוֹשׁ בָּרוּךְ הוּא כָּל כָּךְ שָׂמֵחַ לִשְׁמֹעַ אוֹתְךָ לוֹמֵד וּמֵבִין אֶת הַתּוֹרָה שֶׁלּוֹ! 💖",
    "אֵיזֶה חִיּוּךְ וְשִׂמְחָה הֵבֵאתָ עַכְשָׁו לְאָבִינוּ שֶׁבַּשָּׁמַיִם! 😊",
    "כַּמָּה שֶׁהַשֵּׁם אוֹהֵב אוֹתְךָ וְאֶת הַתּוֹרָה הַטְּהוֹרָה שֶׁיּוֹצֵאת מֵהַפֶּה שֶׁלְּךָ! 💗",
    "אַשְׁרֶיךָ! הַתְּשׁוּבָה שֶׁלְּךָ עוֹלָה יָשָׁר וּמְשַׂמַּחַת אֶת בּוֹרֵא עוֹלָם! ✨",
    "אֵיזֶה יֹפִי – מַמָּשׁ רוֹאִים כַּמָּה הַמִּלִּים שֶׁל הַתּוֹרָה מְתוּקוֹת מִדְּבַשׁ אֶצְלְךָ! 🍯",
    "אֵיזֶה תַּעֲנוּג לִשְׁמֹעַ אוֹתְךָ! כַּמָּה כֵּיף וּמְשַׂמֵּחַ לִלְמֹד אֶת פָּרָשַׁת הַשָּׁבוּעַ! 🎉",
    "הַתְּשׁוּבָה הַנְּכוֹנָה הַזֹּאת מַמָּשׁ מְאִירָה אֶת כָּל הַכִּתָּה בְּאוֹר שֶׁל תּוֹרָה! 💡",
    "זָכִיתָ לְהָבִין בְּדִיּוּק אֶת הַמֶּסֶר הַנִּפְלָא שֶׁהַשֵּׁם רָצָה לְלַמֵּד אוֹתָנוּ בַּפָּרָשָׁה! 🌟",
    "דִּבְרֵי הַתּוֹרָה שֶׁלְּךָ נִשְׁמָעִים כָּל כָּךְ יָפֶה וּמְאִירִים אֶת הַלֵּב! 💛",
    "הַשֵּׁם נָתַן לְךָ שֵׂכֶל וּבִינָה, וְאֵיזֶה יֹפִי אַתָּה מִשְׁתַּמֵּשׁ בָּהֶם לַתּוֹרָה שֶׁלּוֹ! 🧠",
    "בְּדִיּוּק בִּשְׁבִיל מִלִּים קְדוֹשׁוֹת וּמְאִירוֹת כָּאֵלֶּה קִבַּלְנוּ אֶת כֹּחַ הַדִּבּוּר! 🗣️",
    "אֵיזוֹ נְשָׁמָה טְהוֹרָה – מַרְגִּישִׁים שֶׁהַתְּשׁוּבָה שֶׁלְּךָ מַגִּיעָה יָשָׁר מֵהַלֵּב! 💖",
    "רוֹאִים שֶׁהִשְׁקַעְתָּ מַחֲשָׁבָה, וְזֶה בְּדִיּוּק מָה שֶׁהַשֵּׁם כָּל כָּךְ אוֹהֵב לִרְאוֹת! 💪",
    "תְּשׁוּבָה שֶׁל תַּלְמִיד חָכָם אֲמִתִּי שֶׁמְּחֻבָּר לַתּוֹרָה שֶׁל הַשֵּׁם! 📚",
    "מָתוֹק מִדְּבַשׁ – תַּעֲנוּג לְהַשֵּׁם וּלְכֻלָּנוּ! 🍯",
    "אַשְׁרֶיךָ! עָשִׂיתָ עַכְשָׁו קִדּוּשׁ הַשֵּׁם בַּכִּתָּה! ✨",
    "תְּשׁוּבָה קוֹלַעַת – רוֹאִים שֶׁהַתּוֹרָה אֲהוּבָה וִיקָרָה עָלֶיךָ! 🎯",
    "נִפְלָא בְּיוֹתֵר! הַשֵּׁם בֶּטַח גֵּאֶה בַּבֵּן שֶׁלּוֹ עַכְשָׁו! 👑",
    "אַשְׁרֵי הַיֶּלֶד שֶׁמְּשַׂמֵּחַ אֶת הַבּוֹרֵא בְּעוֹד דִּבְרֵי תּוֹרָה חַיִּים! 🌱",
    "אֵיזוֹ נַחַת רוּחַ עָשִׂיתָ עַכְשָׁו לְהַשֵּׁם יִתְבָּרַךְ! 😊",
    "הַתְּשׁוּבָה הַזֹּאת הֵאִירָה אֶת הַנְּשָׁמָה הַטְּהוֹרָה שֶׁלְּךָ! ✨",
    "רוֹאִים בְּחוּשׁ כַּמָּה אַתָּה אוֹהֵב אֶת הַתּוֹרָה הַקְּדוֹשָׁה! 📖",
    "אַשְׁרֶיךָ, הַקָּדוֹשׁ בָּרוּךְ הוּא שָׂמֵחַ בְּךָ וּבַלִּמּוּד שֶׁלְּךָ בָּרֶגַע הַזֶּה! 💖",
    "כַּמָּה מְתִיקוּת יֵשׁ בְּדִבְרֵי הַתּוֹרָה שֶׁיָּצְאוּ מֵהַפֶּה שֶׁלְּךָ! 🍯",
    "אֵיזֶה יֹפִי, חִבַּרְתָּ אֶת כֻּלָּנוּ בְּאַהֲבָה לְפָרָשַׁת הַשָּׁבוּעַ! 🤝",
    "רוֹאִים שֶׁהַתְּשׁוּבָה הַזֹּאת הִגִּיעָה יָשָׁר מֵעֹמֶק הַלֵּב הַיְּהוּדִי שֶׁלְּךָ! 💗",
    "זָכִיתָ לְשַׂמֵּחַ אֶת הַבּוֹרֵא בַּתּוֹרָה שֶׁלָּמַדְתָּ! 🌟",
    "אֵיזֶה עֹנֶג וְשִׂמְחָה לִשְׁמֹעַ אוֹתְךָ עוֹנֶה מִתּוֹךְ קְדֻשָּׁה כָּזֹאת! ✨",
    "הַשֵּׁם יִתְבָּרַךְ מִתְפָּאֵר בְּךָ וּבַחֵשֶׁק שֶׁלְּךָ לַתּוֹרָה! 👑",
    "הַתְּשׁוּבָה הַזֹּאת מַרְאָה כַּמָּה הַקְּדֻשָּׁה קְרוֹבָה וַאֲהוּבָה עָלֶיךָ! 💎",
    "הֵבֵאתָ עַכְשָׁו אוֹר וּבְרָכָה עֲצוּמָה לְכָל הַכִּתָּה! 💡",
    "מַמָּשׁ שׁוֹמְעִים אֶת הַנִּגּוּן וְהָאַהֲבָה שֶׁל הַתּוֹרָה בַּקּוֹל שֶׁלְּךָ! 🎶",
    "אֵיזֶה גִּבּוֹר שֶׁל הַשֵּׁם – עָמַלְתָּ, זָכַרְתָּ וְעָנִיתָ נִפְלָא! 💪",
    "עָשִׂיתָ קִדּוּשׁ הַשֵּׁם אֲמִתִּי בַּתְּשׁוּבָה הַמְּדֻיֶּקֶת הַזֹּאת! 🎯",
    "הַשִּׂמְחָה שֶׁלְּךָ בַּלִּמּוּד עוֹשָׂה שִׂמְחָה גְּדוֹלָה בְּכָל הָעוֹלָמוֹת! 🌍",
    "זָכִיתָ לִטְעֹם אֶת הַמְּתִיקוּת הָאֲמִתִּית שֶׁל דִּבְרֵי הַשֵּׁם! 🍯",
    "הַלֵּב שֶׁלְּךָ מָלֵא בְּיִרְאַת שָׁמַיִם וּבְאַהֲבַת תּוֹרָה – אַשְׁרֶיךָ! 💖",
    "הַקָּדוֹשׁ בָּרוּךְ הוּא אוֹהֵב אוֹתְךָ מְאוֹד עַל הַהַשְׁקָעָה וְהַחֵשֶׁק הַזֶּה! 💗",
    "הוֹסַפְתָּ עַכְשָׁו עוֹד יַהֲלוֹם מֵאִיר בַּכֶּתֶר שֶׁל מֶלֶךְ מַלְכֵי הַמְּלָכִים! 💎"];
  var PRAISE_AUDIO = ["https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise01.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise02.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise03.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise04.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise05.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise06.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise07.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise08.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise09.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise10.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise11.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise12.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise13.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise14.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise15.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise16.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise17.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise18.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise19.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise20.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise21.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise22.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise23.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise24.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise25.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise26.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise27.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise28.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise29.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise30.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise31.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise32.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise33.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise34.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise35.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise36.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise37.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise38.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise39.mp3", "https://yudataub.github.io/kol-toda-files/parasha-games/audio/praise40.mp3"];
  var PARASHA_PAGE = /\/(parasha-games|apps)\//.test(location.pathname);
  var BADGES = [{ min: 0, e: "🌱", n: "מַתְחִיל" }, { min: 50, e: "🥉", n: "לוֹמֵד מַתְמִיד" }, { min: 200, e: "🥈", n: "לוֹמֵד מְצֻיָּן" },
    { min: 500, e: "🥇", n: "חָכָם צָעִיר" }, { min: 1000, e: "💎", n: "תַּלְמִיד חָכָם" }, { min: 2500, e: "👑", n: "אַלּוּף הַפָּרָשָׁה" }];
  function badge(p) { var c = BADGES[0], nx = null; for (var i = 0; i < BADGES.length; i++) { if (p >= BADGES[i].min) c = BADGES[i]; else { nx = BADGES[i]; break; } } return { c: c, nx: nx }; }

  /* ---------- מצב ---------- */
  var G = { id: "", title: "" }, R = { pts: 0, right: 0, streak: 0, answered: 0, ended: false, started: false }, base = null, prevBest = 0;
  function total() { return base == null ? R.pts : base - prevBest + Math.max(prevBest, R.pts); }

  /* ---------- עיצוב ---------- */
  var CSS = "#ktBar{position:fixed;top:8px;left:8px;z-index:9990;display:flex;gap:6px;align-items:center;font-family:Rubik,'Segoe UI',Arial,sans-serif;direction:rtl}" +
    "#ktBar>*{background:rgba(255,255,255,.95);border:0;border-radius:999px;padding:5px 11px;font:inherit;font-size:14px;font-weight:700;color:#4b32c3;box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:pointer;min-height:32px;line-height:22px}" +
    "#ktBar #ktPts{color:#b7791f;cursor:default}#ktBar #ktMe{max-width:34vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#ktToast{position:fixed;left:50%;top:54px;transform:translateX(-50%) scale(.9);z-index:9991;max-width:min(92vw,520px);padding:12px 18px;border-radius:18px;font-family:Rubik,'Segoe UI',Arial,sans-serif;text-align:center;line-height:1.55;font-size:17px;box-shadow:0 8px 26px rgba(0,0,0,.22);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;direction:rtl}" +
    "#ktToast.on{opacity:1;transform:translateX(-50%) scale(1)}#ktToast.ok{background:#e3f8ec;color:#145c38;border:2px solid #7ed3a4}#ktToast.bad{background:#fff6d8;color:#7a5a00;border:2px solid #f3cf63}" +
    "#ktToast b{display:block;font-size:1.12em}#ktToast small{display:block;font-size:.88em;margin-top:2px}#ktToast .st{display:inline-block;margin-top:4px;background:#ff9800;color:#fff;border-radius:20px;padding:1px 10px;font-size:.8em;font-weight:800}" +
    ".ktOv{position:fixed;inset:0;z-index:9995;background:rgba(30,20,60,.55);display:none;align-items:flex-start;justify-content:center;padding:16px;overflow:auto;direction:rtl}" +
    ".ktOv.on{display:flex}.ktOv .rb{background:#fff;border-radius:24px;max-width:500px;width:100%;padding:22px 18px;font-family:Rubik,'Segoe UI',Arial,sans-serif;color:#2b2340;line-height:1.65;margin-top:24px;text-align:center;box-shadow:0 10px 40px rgba(60,40,120,.25)}" +
    ".ktOv h2{margin:0 0 6px;font-size:1.5em}.ktOv h3{margin:14px 0 4px;font-size:1.05em;text-align:right}.ktOv .sub{color:#6b6385;margin:0 0 12px}" +
    ".ktOv label{display:block;text-align:right;font-weight:700;margin:10px 0 4px}.ktOv input,.ktOv select{width:100%;box-sizing:border-box;font:inherit;font-size:1.05em;padding:9px 13px;border:2px solid #cfc3ff;border-radius:14px;outline:none;background:#fff}" +
    ".ktOv .rr{display:flex;gap:10px}.ktOv .rr>div{flex:1}.ktOv .go{margin-top:16px;width:100%;border:0;border-radius:16px;padding:12px;font:inherit;font-size:1.15em;font-weight:800;color:#fff;cursor:pointer;background:linear-gradient(120deg,#ff9a3c,#ff5e7e 55%,#7b5cff)}" +
    ".ktOv .lnk{margin-top:8px;background:none;border:0;color:#6b6385;font:inherit;text-decoration:underline;cursor:pointer}.ktOv .msg{color:#c0392b;font-weight:700;min-height:1.3em}.ktOv .note{font-size:.86em;color:#6b6385;margin-top:10px}" +
    ".ktOv ol{margin:0;padding-inline-start:26px;text-align:right}.ktOv li{padding:3px 0;border-bottom:1px dashed #eee}.ktOv li.me{background:#fff6c2;font-weight:800;border-radius:8px}.ktOv li .p{float:left;font-weight:800;color:#7b5cff}.ktOv li .c{color:#6b6385;font-size:.85em}" +
    ".ktOv .big{font-size:2em;font-weight:900;color:#b7791f;margin:4px 0}.ktOv .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}.ktOv .row a,.ktOv .row button{border:0;border-radius:14px;padding:10px 18px;font:inherit;font-weight:800;color:#fff;background:#7b5cff;cursor:pointer;text-decoration:none}.ktOv .row .alt{background:#efeaff;color:#4b32c3}" +
    "@media (max-width:520px){#ktBar>*{font-size:12px;padding:4px 9px;min-height:28px}#ktToast{font-size:15px;top:46px}}";

  var REG_HTML = '<div class="rb"><h2>👋 שָׁלוֹם וּבְרוּכִים הַבָּאִים!</h2><p class="sub">לִפְנֵי שֶׁמַּתְחִילִים – מִי אַתֶּם?</p>' +
    '<label for="ktName">הַשֵּׁם שֶׁלִּי</label><input id="ktName" maxlength="30" autocomplete="off" placeholder="שֵׁם פְּרָטִי וְשֵׁם מִשְׁפָּחָה">' +
    '<label for="ktSchool">בֵּית הַסֵּפֶר</label><input id="ktSchool" maxlength="40" autocomplete="off" placeholder="שֵׁם בֵּית הַסֵּפֶר וְהָעִיר">' +
    '<div class="rr"><div><label for="ktGrade">כִּתָּה</label><select id="ktGrade"><option value="">— בַּחֲרוּ —</option>' +
    '<option value="a">א׳</option><option value="b">ב׳</option><option value="c">ג׳</option><option value="d">ד׳</option><option value="e">ה׳</option><option value="f">ו׳</option><option value="g">ז׳</option><option value="h">ח׳</option></select></div>' +
    '<div><label for="ktNum">מִסְפַּר כִּתָּה</label><input id="ktNum" maxlength="3" inputmode="numeric" autocomplete="off" placeholder="לְמָשָׁל 2"></div></div>' +
    '<div class="msg" id="ktMsg"></div><button class="go" id="ktGo">✅ נִרְשָׁמִים וּמַתְחִילִים</button>' +
    '<button class="lnk" id="ktClose" style="display:none">סְגִירָה</button>' +
    '<p class="note">✍️ הַשֵּׁם – חוֹבָה. כִּתָּה וּבֵית סֵפֶר – מְאוֹד כְּדַאי: רַק כָּךְ נִכְנָסִים לְלוּחַ הַמְּצֻיָּנִים.</p>' +
    '<p class="note">💡 אוֹתוֹ שֵׁם, כִּתָּה וּבֵית סֵפֶר בְּכָל מַחְשֵׁב – וְכָל הַנְּקֻדּוֹת אִתְּכֶם.</p></div>';

  function $(id) { return document.getElementById(id); }
  function build() {
    document.head.appendChild(el("style", {}, CSS));
    var bar = el("div", { id: "ktBar" });
    bar.innerHTML = '<button id="ktMe" type="button" title="לְהַחְלִיף שֵׁם / כִּתָּה"></button><span id="ktPts" title="הַנְּקֻדּוֹת שֶׁלְּךָ בְּמִשְׂחֲקֵי הַפָּרָשָׁה">⭐ 0</span>' +
      '<button id="ktLb" type="button" title="לוּחַ הַמְּצֻיָּנִים">🏆</button><button id="ktMute" type="button" title="צְלִילִים"></button>';
    document.body.appendChild(bar);
    document.body.appendChild(el("div", { id: "ktToast", role: "status", "aria-live": "polite" }));
    document.body.appendChild(el("div", { id: "ktReg", class: "ktOv", role: "dialog", "aria-modal": "true" }, REG_HTML));
    document.body.appendChild(el("div", { id: "ktEnd", class: "ktOv", role: "dialog", "aria-modal": "true" }, '<div class="rb" id="ktEndBox"></div>'));
    $("ktMe").onclick = openReg; $("ktLb").onclick = function () { openBoard(false); };
    $("ktMute").onclick = function () { put("hq-mute", muted() ? "0" : "1"); drawBar(); };
    $("ktGo").onclick = saveReg; $("ktClose").onclick = function () { $("ktReg").classList.remove("on"); };
    ["ktName", "ktSchool", "ktNum"].forEach(function (id) { $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") saveReg(); }); });
    $("ktEnd").addEventListener("click", function (e) { if (e.target === $("ktEnd")) $("ktEnd").classList.remove("on"); });
    drawBar();
  }
  function drawBar() {
    var m = me();
    $("ktMe").textContent = m.name ? "👤 " + m.name + " ✏️" : "👤 הַרְשָׁמָה";
    $("ktPts").textContent = "⭐ " + total();
    $("ktMute").textContent = muted() ? "🔇" : "🔊";
  }
  function gradeOf(cls) { var h = String(cls || "").replace(/[^א-ת]/g, "").charAt(0); for (var k in GR) if (GR[k] === h) return k; return ""; }
  function openReg() {
    var m = me();
    $("ktName").value = m.name || ""; $("ktSchool").value = m.school || "";
    $("ktGrade").value = m.grade || gradeOf(m.cls); $("ktNum").value = (String(m.cls || "").match(/\d+/) || [""])[0];
    $("ktClose").style.display = m.name ? "" : "none"; $("ktMsg").textContent = "";
    $("ktReg").classList.add("on");
    setTimeout(function () { $("ktName").focus(); }, 50);
  }
  function saveReg() {
    var n = $("ktName").value.trim(), s = $("ktSchool").value.trim(), gr = $("ktGrade").value, num = $("ktNum").value.replace(/\D/g, "");
    if (!n) { $("ktMsg").textContent = "✍️ כִּתְבוּ אֶת הַשֵּׁם"; $("ktName").focus(); return; }
    var cls = gr ? GR[gr] + "׳" + (num ? " " + num : "") : "";
    put("hq-me", JSON.stringify({ name: n, cls: cls, school: s, grade: gr }));
    $("ktReg").classList.remove("on");
    tone([660], 0.08);
    fetchBase(); drawBar();
  }
  function fetchBase() {
    var m = me(); base = null; prevBest = 0;
    if (!API_URL || !real(m) || !G.id) return;
    fetch(API_URL + "?action=me&name=" + encodeURIComponent(m.name) + "&cls=" + encodeURIComponent(m.cls) + "&school=" + encodeURIComponent(m.school))
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok) { base = Number(d.points) || 0; prevBest = Number((d.games || {})[G.id]) || 0; drawBar(); } })
      .catch(function () {});
  }
  var toastT = null;
  function toast(cls, html, ms) {
    var t = $("ktToast"); if (!t) return;
    t.className = cls; t.innerHTML = html;
    void t.offsetWidth; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); },   // מַחְמָאָה אֲרֻכָּה נִשְׁאֶרֶת עַד שֶׁהַקּוֹל גּוֹמֵר
      ms || Math.max(2600, Math.min(6000, t.textContent.replace(/[֑-ׇ]/g, "").length * 70)));
  }
  function newRunIfEnded() { if (R.ended) R = { pts: 0, right: 0, streak: 0, answered: 0, ended: false, started: false }; }
  function ping(stage) {
    var m = me(); if (!API_URL || !real(m) || !G.id) return;
    fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "progress", name: m.name, cls: m.cls, school: m.school, game: G.id, stage: stage }) }).catch(function () {});
  }

  /* ---------- ה-API למשחק ---------- */
  function ok(n, key) {   // key (לֹא חוֹבָה): מַזְהֶה הַשְּׁאֵלָה – שְׁאֵלָה שֶׁכְּבָר נַעַנְתָה נָכוֹן בַּסִּבּוּב לֹא נוֹתֶנֶת שׁוּב נְקֻדּוֹת (חֲזָרָה עַל שִׁעוּר)
    newRunIfEnded();
    if (!R.started) { R.started = true; ping("start"); }
    n = Math.max(1, Math.round(Number(n) || 1));
    if (key != null) { R.seen = R.seen || {}; if (R.seen[key]) n = 0; else R.seen[key] = 1; }
    R.pts += PER_RIGHT * n; if (n) R.right++; R.answered++; R.streak++;
    soundStreak(R.streak);
    var head = R.answered < FB_OK.length ? FB_OK[R.answered] : draw("ok10", FB_OK_10);
    if (G.praise && G.praise.tiers) {   // מַחְמָאוֹת שֶׁל סִדְרָה (מִשְׂחֲקֵי הַשַּׁ"ס, 8.11): עוֹלוֹת לְפִי כָּל הַתְּשׁוּבוֹת הַנְּכוֹנוֹת שֶׁל הַיֶּלֶד בְּכָל הַמִּשְׂחָקִים
      var cnt = (Number(get("kt-right")) || 0) + 1; put("kt-right", String(cnt));
      var eff = Math.max(cnt, Math.floor(total() / PER_RIGHT)), at = G.praise.at || [0], t = 0;
      for (var i = 0; i < at.length; i++) if (eff >= at[i]) t = i;
      t = Math.min(t, G.praise.tiers.length - 1);
      head = draw("pr" + t, G.praise.tiers[t]);
      if (G.praise.audio && !muted()) {   // הַקְלָטָה שֶׁל הַמַּחְמָאָה (Gemini TTS): <audio>p<מַדְרֵגָה>-<מִסְפָּר>.mp3
        try { if (G.voice) G.voice.pause(); G.voice = new Audio(G.praise.audio + "p" + t + "-" + G.praise.tiers[t].indexOf(head) + ".mp3"); G.voice.play().catch(function () {}); } catch (e) {}
      }
    }
    var love = draw("love", LOVE_OK);
    if (!(G.praise && G.praise.tiers) && PARASHA_PAGE && R.answered >= 3) {   // מַחְמָאוֹת הַמִּשְׁתַּמֵּשׁ + הַקְלָטָה
      var pi = PRAISE.indexOf(draw("praise", PRAISE));
      head = PRAISE[pi]; love = "";
      if (!muted()) { try { if (G.voice) G.voice.pause(); G.voice = new Audio(PRAISE_AUDIO[pi]); G.voice.play().catch(function () {}); } catch (e) {} }
    }
    toast("ok", "<b>" + nm(head) + "</b>" + (love ? "<small>" + love + "</small>" : "") +
      (R.streak >= 3 ? '<span class="st">🔥 ' + R.streak + " בָּרֶצֶף!</span>" : "") + (n ? ' <span class="st" style="background:#7b5cff">+' + PER_RIGHT * n + "</span>" : ""));
    drawBar();
  }
  function bad() {
    newRunIfEnded();
    if (!R.started) { R.started = true; ping("start"); }
    R.answered++; R.streak = 0;
    soundBad();
    toast("bad", "<b>" + nm(draw("oops", OOPS)) + "</b><small>" + draw("lovebad", LOVE_BAD) + "</small>", 2400);
  }
  function li(r, v, mine) {
    return '<li class="' + (mine ? "me" : "") + '"><span class="p">' + v + "</span>" + esc(r.name || r.cls) + ' <span class="c">' +
      esc(r.name ? [r.cls, r.school].filter(Boolean).join(", ") : r.school + " · " + r.students + " תַּלְמִידִים") + "</span></li>";
  }
  function fill(id, url, row) {
    var o = $(id); if (!o) return;
    o.innerHTML = "<li>טוֹעֵן…</li>";
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      o.innerHTML = (d.top || []).map(row).join("") || "<li>עוֹד אֵין כָּאן אַף אֶחָד – אוּלַי אַתֶּם הָרִאשׁוֹנִים? 🙂</li>";
    }).catch(function () { o.innerHTML = "<li>לֹא נִטְעַן כָּרֶגַע</li>"; });
  }
  function boards() {
    var m = me(), isMe = function (r) { return real(m) && nk(r.name) === nk(m.name) && nk(r.cls) === nk(m.cls) && nk(r.school) === nk(m.school); };
    if (G.id) fill("ktBGame", API_URL + "?action=board&limit=10&game=" + encodeURIComponent(G.id), function (r) { return li(r, r.score, isMe(r)); });
    fill("ktBAll", API_URL + "?action=points&limit=10", function (r) { return li(r, r.points, isMe(r)); });
    fill("ktBCls", API_URL + "?action=classes&limit=10", function (r) { return li(r, r.avg, real(m) && nk(r.cls) === nk(m.cls) && nk(r.school) === nk(m.school)); });
  }
  function openBoard(isEnd, sendMsg) {
    var m = me(), tp = total(), b = badge(tp), h = "";
    if (isEnd) {
      h += "<h2>🎉 " + (m.name ? "כָּל הַכָּבוֹד, " + esc(m.name) + "!" : "כָּל הַכָּבוֹד!") + "</h2>" +
        '<div class="big">⭐ ' + R.pts + " נְקֻדּוֹת</div>" +
        '<p class="sub">' + R.right + " תְּשׁוּבוֹת נְכוֹנוֹת בַּמִּשְׂחָק" + (G.title ? " \"" + esc(G.title) + "\"" : "") + "</p>" +
        '<p class="sub" id="ktSend">' + (sendMsg || "") + "</p>";
    } else h += "<h2>🏆 לוּחַ הַמְּצֻיָּנִים</h2>";
    if (real(m)) h += '<p class="sub">' + b.c.e + " הַדַּרְגָּה שֶׁלְּךָ: <b>" + b.c.n + "</b> · ⭐ " + tp + " נְקֻדּוֹת בְּכָל הַמִּשְׂחָקִים" +
      (b.nx ? "<br>עוֹד " + (b.nx.min - tp) + " נְקֻדּוֹת לְדַרְגַּת " + b.nx.e + " " + b.nx.n : "") + "</p>";
    if (G.id) h += "<h3>🎯 בַּמִּשְׂחָק הַזֶּה</h3><ol id=\"ktBGame\"></ol>";
    h += "<h3>⭐ הַכִּי הַרְבֵּה נְקֻדּוֹת – כָּל הַמִּשְׂחָקִים</h3><ol id=\"ktBAll\"></ol><h3>🏫 הַכִּתּוֹת הַמּוֹבִילוֹת</h3><ol id=\"ktBCls\"></ol>";
    h += '<div class="row">' + (isEnd ? '<button type="button" id="ktAgain">עוֹד פַּעַם 🔁</button>' : "") +
      '<a class="alt" href="' + esc(G.home || HOME) + '">' + esc(G.homeTxt || "🎲 לְכָל מִשְׂחֲקֵי הַפָּרָשָׁה") + '</a><button type="button" class="alt" id="ktX">סְגִירָה</button></div>';
    $("ktEndBox").innerHTML = h;
    $("ktX").onclick = function () { $("ktEnd").classList.remove("on"); };
    if ($("ktAgain")) $("ktAgain").onclick = function () { $("ktEnd").classList.remove("on"); if (typeof G.again === "function") G.again(); };
    $("ktEnd").classList.add("on");
    boards();
  }
  function end(delay) {   // הַמָּסָךְ שֶׁל הַמִּשְׂחָק עַצְמוֹ נִרְאֶה רֶגַע, וְאָז נִפְתָּח הַלּוּחַ
    if (R.ended) return;
    R.ended = true;
    setTimeout(endNow, delay == null ? 1500 : delay);
  }
  function endNow() {
    var m = me();
    soundGrand();
    ping("end");
    if (!real(m)) { openBoard(true, "✍️ כְּדֵי לְהִכָּנֵס לְלוּחַ הַמְּצֻיָּנִים – הוֹסִיפוּ כִּתָּה וּבֵית סֵפֶר (👤 לְמַעְלָה)."); return; }
    if (!R.pts) { openBoard(true, ""); return; }
    var pts = R.pts;
    openBoard(true, "שׁוֹמֵר אֶת הַנְּקֻדּוֹת…");
    fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ name: m.name, cls: m.cls, school: m.school, game: G.id, score: pts, a: 0, b: 0, c: 0 }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if ($("ktSend")) $("ktSend").textContent = d && d.ok ? "✅ " + pts + " הַנְּקֻדּוֹת נִשְׁמְרוּ!" : "לֹא הִצְלַחְנוּ לִשְׁמֹר כָּרֶגַע.";
        if (d && d.ok) { if (base != null && pts > prevBest) { base += pts - prevBest; prevBest = pts; } drawBar(); }
        boards();
      })
      .catch(function () { if ($("ktSend")) $("ktSend").textContent = "לֹא הִצְלַחְנוּ לִשְׁמֹר כָּרֶגַע – אֶפְשָׁר לְצַלֵּם אֶת הַמָּסָךְ."; });
  }
  function init(o) {
    G.id = String((o && o.id) || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    G.title = (o && o.title) || document.title || "";
    G.again = o && o.again;
    G.home = o && o.home; G.homeTxt = o && o.homeTxt;
    G.praise = o && o.praise;   // {at:[0,10,…], tiers:[[…],[…]]} – מַחְמָאוֹת מִשֶּׁלָּהּ, בִּמְקוֹם FB_OK (מִשְׂחֲקֵי הַשַּׁ"ס: shas-games/praise.js)   // משחק מחוץ לפרשה (כמו ketuvim/): לאן מוביל "לכל המשחקים"
    var go = function () { if (!$("ktBar")) build(); drawBar(); fetchBase(); if (!me().name) openReg(); };
    if (document.body) go(); else document.addEventListener("DOMContentLoaded", go);
  }
  window.KT = { init: init, ok: ok, bad: bad, end: end, points: function () { return R.pts; }, api: API_URL,
    name: function () { return me().name || ""; } };   // name: לְמִלּוּי שְׂדֵה הַשֵּׁם שֶׁל מִשְׂחָק יָשָׁן (תְּעוּדָה)
})();
