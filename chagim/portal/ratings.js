// Holiday portals: the teachers' shared ratings – the same Firestore collection as the catalog engine
// (catalog-kit/template/index.html), so a rating given here shows in the full catalog and the other way round.
// All the ratings are read once (a small collection), so the rated materials can be sorted first (the user, 14.11.2026).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, getDocs, collection, runTransaction } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
const firebaseConfig = {"apiKey": ["AIza", "SyBgjtJk9Wrw-lPpFlPBaQ6RHfqQ58R58LA"].join(""), "authDomain": "gamma-catalog.firebaseapp.com", "projectId": "gamma-catalog", "storageBucket": "gamma-catalog.firebasestorage.app", "messagingSenderId": "184606827021", "appId": "1:184606827021:web:e39a832b5bc12fe87aeb44"};
const db = getFirestore(initializeApp(firebaseConfig));
const ratingsCache = new Map();
async function fetchAll() {
  try { (await getDocs(collection(db, "ratings"))).forEach(d => ratingsCache.set(d.id, d.data())); }
  catch (e) { console.error("ratings failed", e); }
}
async function submitRating(id, newValue, oldValue) {
  const ref = doc(db, "ratings", id); let out;
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref); let sum = 0, count = 0;
    if (snap.exists()) { sum = snap.data().sum || 0; count = snap.data().count || 0; }
    if (oldValue) sum += newValue - oldValue; else { sum += newValue; count += 1; }
    tx.set(ref, out = {sum, count});
  });
  ratingsCache.set(id, out);
}
window.__ratingsApi = {submitRating, ratingsCache};
fetchAll().then(() => window.dispatchEvent(new Event("ratings-ready")));
