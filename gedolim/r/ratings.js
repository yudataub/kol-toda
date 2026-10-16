// The teachers' shared rating, the same store as the catalog engine (template/index.html): Firestore "ratings/<file id>"
// = {sum, count}. A person page and the catalog rate the same materials under the same ids, so they show one rating.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDocs, collection, query, where, documentId, runTransaction } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
const firebaseConfig = {"apiKey": ["AIza", "SyBgjtJk9Wrw-lPpFlPBaQ6RHfqQ58R58LA"].join(""), "authDomain": "gamma-catalog.firebaseapp.com", "projectId": "gamma-catalog", "storageBucket": "gamma-catalog.firebasestorage.app", "messagingSenderId": "184606827021", "appId": "1:184606827021:web:e39a832b5bc12fe87aeb44"};
const db = getFirestore(initializeApp(firebaseConfig));
const ratingsCache = new Map();
async function fetchRatings(ids) {
  const need = [...new Set(ids)].filter(id => !ratingsCache.has(id));
  for (let i = 0; i < need.length; i += 10) {
    const b = need.slice(i, i + 10); b.forEach(id => ratingsCache.set(id, {sum: 0, count: 0}));
    try { (await getDocs(query(collection(db, "ratings"), where(documentId(), "in", b)))).forEach(d => ratingsCache.set(d.id, d.data())); }
    catch (e) { console.error("fetchRatings failed", e); }
  }
}
async function submitRating(id, newValue, oldValue) {
  const ref = doc(db, "ratings", id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref); let sum = 0, count = 0;
    if (snap.exists()) { sum = snap.data().sum || 0; count = snap.data().count || 0; }
    if (oldValue) sum += newValue - oldValue; else { sum += newValue; count += 1; }
    tx.set(ref, {sum, count});
  });
}
window.__ratingsApi = {fetchRatings, submitRating, ratingsCache};
window.dispatchEvent(new Event("ratings-ready"));
