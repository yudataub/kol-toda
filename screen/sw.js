/* Service Worker של מסך בית הספר – פעיל רק בתוך /screen/
   מטרה: שהמסך ייטען ויעבוד גם בלי אינטרנט (למשל אחרי כיבוי והדלקה של הטלוויזיה).
   אסטרטגיה: קודם רשת, ואם אין – מה ששמור. כל תשובה תקינה מהרשת מעדכנת את השמור.
   בקשה עם cache:'no-store' (בדיקת חיבור) לא מקבלת תשובה מהשמור, אבל תשובה תקינה עדיין נשמרת. */
'use strict';

var VERSION = 'kol-screen-v1';
var CONTENT = 'https://school-screen.kol-bot.workers.dev/';   // השרת של config.json והתמונות
var CONFIG_URL = CONTENT + 'config.json';
var SCOPE = self.registration.scope;                          // https://www.kol-toda.co.il/screen/
var PAGE_KEY = SCOPE;                                         // index.html נשמר תחת /screen/
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// ---------- עזר ----------
function keyOf(url) {                       // בלי ?v=... כדי שלכל קובץ יהיה עותק אחד
  var u = new URL(url, SCOPE);
  u.search = ''; u.hash = '';
  var s = u.href;
  if (s === SCOPE + 'index.html') s = PAGE_KEY;
  return s;
}
function timeout(p, ms) {
  return new Promise(function (res, rej) {
    var t = setTimeout(function () { rej(new Error('timeout')); }, ms);
    p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
  });
}
function storable(r) { return r && (r.ok || r.type === 'opaque'); }
function put(key, res) {
  return caches.open(VERSION).then(function (c) { return c.put(key, res); }).catch(function () {});
}
function fromCache(key) {
  return caches.open(VERSION).then(function (c) { return c.match(key); });
}
// אותו חישוב כתובת כמו בדף (fullSrc)
function fullSrc(u) {
  u = String(u);
  if (/^(https?:)?\/\//.test(u) || u.charAt(0) === '/') return new URL(u, SCOPE).href;
  return CONTENT + u;
}
function imagesOf(cfg) {
  var out = {};
  function add(list) {
    (Array.isArray(list) ? list : []).forEach(function (s) {
      if (s && typeof s === 'object' && s.src && (s.type === 'image' || s.type === 'image-text')) out[keyOf(fullSrc(s.src))] = 1;
    });
  }
  add(cfg && cfg['default']);
  (cfg && Array.isArray(cfg.breaks) ? cfg.breaks : []).forEach(function (b) { if (b) add(b.slides); });
  return Object.keys(out);
}

// שומר את כל התמונות של config, ומוחק מהשמור תמונות שכבר לא בשימוש
var syncing = null, syncedText = null;
function syncImages(text) {
  if (text === syncedText) return syncing || Promise.resolve();
  var cfg;
  try { cfg = JSON.parse(text); } catch (e) { return Promise.resolve(); }
  syncedText = text;
  var want = imagesOf(cfg);
  syncing = caches.open(VERSION).then(function (c) {
    return Promise.all(want.map(function (url) {
      return c.match(url).then(function (have) {
        if (have) return;
        return fetch(url, { mode: 'cors', credentials: 'omit' })
          .catch(function () { return fetch(url, { mode: 'no-cors' }); })
          .then(function (r) { if (storable(r)) return c.put(url, r); })
          .catch(function () {});
      });
    })).then(function () {
      return c.keys().then(function (reqs) {
        return Promise.all(reqs.map(function (q) {
          var u = q.url;
          var mine = u.indexOf(CONTENT) === 0 && u !== CONFIG_URL;
          if (mine && want.indexOf(u) < 0) return c['delete'](q);
        }));
      });
    });
  }).catch(function () {}).then(function () { syncing = null; });
  return syncing;
}

// ---------- התקנה ----------
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      var page = fetch(PAGE_KEY, { cache: 'no-cache' }).then(function (r) { if (r.ok) return c.put(PAGE_KEY, r); });
      var conf = fetch(CONFIG_URL + '?v=' + Date.now(), { cache: 'no-store', mode: 'cors', credentials: 'omit' })
        .then(function (r) {
          if (!r.ok) return;
          return r.clone().text().then(function (t) {
            JSON.parse(t);                              // רק JSON תקין נשמר
            return c.put(CONFIG_URL, r).then(function () { return syncImages(t); });
          });
        });
      return Promise.all([page.catch(function () {}), conf.catch(function () {})]);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        if (n.indexOf('kol-screen-') === 0 && n !== VERSION) return caches['delete'](n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// ---------- בקשות ----------
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  var isPage = req.mode === 'navigate' && req.url.indexOf(SCOPE) === 0;
  var isContent = req.url.indexOf(CONTENT) === 0;
  var isFont = FONT_HOSTS.indexOf(url.hostname) >= 0;
  if (!isPage && !isContent && !isFont) return;       // כל השאר (למשל a.js) – כרגיל, בלי התערבות

  var key = isPage ? PAGE_KEY : keyOf(req.url);
  var isConfig = key === CONFIG_URL;
  var noFallback = req.cache === 'no-store';           // בדיקת חיבור אמיתית: לא עונים מהשמור
  var wait = isPage || isConfig ? 10000 : 20000;
  // קובץ קול (בקשות Range) לא נשמר
  var isMedia = req.destination === 'audio' || req.destination === 'video' || req.headers.has('range');
  if (isMedia) return;

  var net = fetch(req).then(function (r) {
    if (storable(r)) {
      if (isConfig) {
        var copy = r.clone();
        e.waitUntil(copy.text().then(function (t) {
          try { JSON.parse(t); } catch (x) { return; }
          return put(CONFIG_URL, new Response(t, { headers: { 'Content-Type': 'application/json; charset=utf-8' } }))
            .then(function () { return syncImages(t); });
        }).catch(function () {}));
      } else {
        e.waitUntil(put(key, r.clone()));
      }
    }
    return r;
  });

  if (noFallback) { e.respondWith(net); return; }

  e.respondWith(
    timeout(net, wait).then(function (r) {
      if (r.ok || r.type === 'opaque') return r;
      return fromCache(key).then(function (c) { return c || r; });   // שגיאת שרת: עדיף העותק השמור
    }, function () {
      return fromCache(key).then(function (c) { return c || net; });  // אין רשת: מהשמור
    })
  );
});
