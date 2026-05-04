// src/services/db.js
import { db } from "../lib/firebase";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  getDocs, collection, query, where, orderBy, limit, startAfter, serverTimestamp, increment
} from "firebase/firestore";

// ─── KORISNIČKI PROFIL ───────────────────────────────────────────

export const createUserProfile = async (user) => {
  if (!user?.uid) return;
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "Korisnik",
    photoURL: user.photoURL || "",
    role: "user",
    favoriteSubjects: [],
    points: 0,
    createdAt: new Date().toISOString()
  }, { merge: true });
};

export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (uid, updates) => {
  if (!uid) return;
  await updateDoc(doc(db, "users", uid), updates);
};

// ─── BODOVI I RANG-LISTA ─────────────────────────────────────────

export const addPoints = async (userId, amount) => {
  if (!userId || !amount) return;
  await updateDoc(doc(db, "users", userId), { points: increment(amount) });
};

export const getLeaderboard = async (limitCount = 50) => {
  const q = query(collection(db, "users"), orderBy("points", "desc"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ─── BILJEŠKE ────────────────────────────────────────────────────
/*
  Kolekcija: "notes"
  Struktura dokumenta:
  {
    userId:      string,     // UID autora
    authorName:  string,     // prikazno ime autora
    title:       string,     // naslov bilješke
    content:     string,     // sadržaj (Markdown)
    subject:     string,     // predmet
    isPublic:    boolean,    // javna ili privatna
    tags:        string[],   // ključne riječi
    favorites:   string[],   // UID-ovi korisnika koji su favorizirali
    createdAt:   Timestamp,
    updatedAt:   Timestamp
  }
*/

export const createNote = async (userId, authorName, noteData) => {
  const ref = await addDoc(collection(db, "notes"), {
    userId, authorName,
    title: noteData.title,
    content: noteData.content,
    subject: noteData.subject,
    isPublic: noteData.isPublic ?? true,
    tags: noteData.tags || [],
    favorites: [],
    ratingSum: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  if (noteData.isPublic) {
    await addPoints(userId, 10);
  }
  return ref.id;
};

export const getNoteById = async (noteId) => {
  const snap = await getDoc(doc(db, "notes", noteId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getMyNotes = async (userId, sortField = "createdAt", sortDir = "desc", pageSize = 20, lastVisible = null) => {
  const base = [collection(db, "notes"), where("userId", "==", userId), orderBy(sortField, sortDir), limit(pageSize)];
  const q = lastVisible ? query(...base.slice(0, -1), startAfter(lastVisible), limit(pageSize)) : query(...base);
  const snapshot = await getDocs(q);
  return {
    notes: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
  };
};

export const getPublicNotes = async (sortField = "createdAt", sortDir = "desc", pageSize = 12, lastVisible = null) => {
  let q;
  if (lastVisible) {
    q = query(collection(db, "notes"), where("isPublic", "==", true), orderBy(sortField, sortDir), startAfter(lastVisible), limit(pageSize));
  } else {
    q = query(collection(db, "notes"), where("isPublic", "==", true), orderBy(sortField, sortDir), limit(pageSize));
  }
  const snapshot = await getDocs(q);
  return {
    notes: snapshot.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
  };
};

export const searchPublicNotes = async (subject = "", keyword = "") => {
  let q;
  if (subject) {
    q = query(collection(db, "notes"), where("isPublic", "==", true), where("subject", "==", subject), orderBy("createdAt", "desc"), limit(100));
  } else {
    q = query(collection(db, "notes"), where("isPublic", "==", true), orderBy("createdAt", "desc"), limit(100));
  }
  const snapshot = await getDocs(q);
  let notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  if (keyword.trim()) {
    const kw = keyword.toLowerCase();
    notes = notes.filter(n =>
      n.title?.toLowerCase().includes(kw) ||
      n.content?.toLowerCase().includes(kw) ||
      n.tags?.some(t => t.toLowerCase().includes(kw))
    );
  }
  return notes;
};

export const updateNote = async (noteId, updates) => {
  await updateDoc(doc(db, "notes", noteId), { ...updates, updatedAt: serverTimestamp() });
};

export const deleteNote = async (noteId) => {
  await deleteDoc(doc(db, "notes", noteId));
};

export const toggleNoteFavorite = async (noteId, userId, isFavorite) => {
  const snap = await getDoc(doc(db, "notes", noteId));
  if (!snap.exists()) return [];
  const noteData = snap.data();
  const favorites = noteData.favorites || [];
  const updated = isFavorite ? favorites.filter(id => id !== userId) : [...favorites, userId];
  await updateDoc(doc(db, "notes", noteId), { favorites: updated });

  // Only award +3 to the author the FIRST TIME this user favorites the note.
  // Track awarded state in a subcollection to prevent duplicate points on re-favorite.
  if (!isFavorite && noteData.userId !== userId) {
    const awardRef = doc(db, "notes", noteId, "favoritePoints", userId);
    const awardSnap = await getDoc(awardRef);
    if (!awardSnap.exists()) {
      await setDoc(awardRef, { userId, awardedAt: new Date().toISOString() });
      await addPoints(noteData.userId, 3);
    }
  }
  return updated;
};

// ─── KOMENTARI ───────────────────────────────────────────────────

export const addComment = async (noteId, userId, userName, text) => {
  const commentRef = await addDoc(collection(db, "notes", noteId, "comments"), {
    userId, userName, text, createdAt: serverTimestamp()
  });
  const snap = await getDoc(doc(db, "notes", noteId));
  if (snap.exists() && snap.data().userId !== userId) {
    await addPoints(snap.data().userId, 2);
  }
  return commentRef.id;
};

export const getComments = async (noteId) => {
  const q = query(collection(db, "notes", noteId, "comments"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteComment = async (noteId, commentId) => {
  await deleteDoc(doc(db, "notes", noteId, "comments", commentId));
};

// ─── OCJENE ──────────────────────────────────────────────────────

export const rateNote = async (noteId, userId, value) => {
  const userRatingRef = doc(db, "notes", noteId, "ratings", userId);
  const userRatingSnap = await getDoc(userRatingRef);
  const oldRating = userRatingSnap.exists() ? userRatingSnap.data().value : 0;

  if (oldRating === value) return;

  await setDoc(userRatingRef, { userId, value }, { merge: true });

  const diff = value - oldRating;
  const countDiff = oldRating === 0 ? 1 : 0;

  await updateDoc(doc(db, "notes", noteId), {
    ratingSum: increment(diff),
    ratingCount: increment(countDiff)
  });

  if (value === 5 && oldRating !== 5) {
    const snap = await getDoc(doc(db, "notes", noteId));
    if (snap.exists() && snap.data().userId !== userId) {
      await addPoints(snap.data().userId, 5);
    }
  }
};

export const getUserRating = async (noteId, userId) => {
  if (!userId) return 0;
  const snap = await getDoc(doc(db, "notes", noteId, "ratings", userId));
  return snap.exists() ? snap.data().value : 0;
};

// ─── FLASHCARDS ──────────────────────────────────────────────────

export const saveFlashcards = async (noteId, cards, userId) => {
  // Check if flashcards already exist BEFORE deleting — award +5 only on first save.
  const existing = await getDocs(collection(db, "notes", noteId, "flashcards"));
  const isFirstSave = existing.empty;

  await deleteFlashcards(noteId);
  for (let i = 0; i < cards.length; i++) {
    await addDoc(collection(db, "notes", noteId, "flashcards"), {
      question: cards[i].question,
      answer: cards[i].answer,
      order: i
    });
  }

  if (isFirstSave) {
    await addPoints(userId, 5);
  }
};

export const getFlashcards = async (noteId) => {
  const q = query(collection(db, "notes", noteId, "flashcards"), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteFlashcards = async (noteId) => {
  const q = collection(db, "notes", noteId, "flashcards");
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "notes", noteId, "flashcards", d.id)));
  await Promise.all(deletePromises);
};

// ─── ADMIN ───────────────────────────────────────────────────────

export const getAllUsers = async () => {
  const q = query(collection(db, "users"), orderBy("points", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const setUserRole = async (uid, role) => {
  await updateDoc(doc(db, "users", uid), { role });
};

export const adjustUserPoints = async (uid, newPoints) => {
  await updateDoc(doc(db, "users", uid), { points: Math.max(0, Number(newPoints)) });
};

export const toggleNotePublic = async (noteId, makePublic) => {
  await updateDoc(doc(db, "notes", noteId), { isPublic: makePublic, updatedAt: serverTimestamp() });
};

export const getAdminStats = async () => {
  const [usersSnap, notesSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "notes")),
  ]);
  const users = usersSnap.docs.map(d => d.data());
  const notes = notesSnap.docs.map(d => d.data());
  return {
    totalUsers:    users.length,
    totalNotes:    notes.length,
    publicNotes:   notes.filter(n => n.isPublic).length,
    privateNotes:  notes.filter(n => !n.isPublic).length,
    adminCount:    users.filter(u => u.role === "admin").length,
    totalFavorites: notes.reduce((s, n) => s + (n.favorites?.length || 0), 0),
    totalPoints:   users.reduce((s, u) => s + (u.points || 0), 0),
  };
};

