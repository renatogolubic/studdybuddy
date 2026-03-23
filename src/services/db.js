// src/services/db.js
import { db } from "../lib/firebase";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  getDocs, collection, query, where, orderBy, limit, startAfter, serverTimestamp
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
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
  const favorites = snap.data().favorites || [];
  const updated = isFavorite ? favorites.filter(id => id !== userId) : [...favorites, userId];
  await updateDoc(doc(db, "notes", noteId), { favorites: updated });
  return updated;
};
