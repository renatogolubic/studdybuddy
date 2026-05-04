// src/services/auth.js
import { createSignal } from "solid-js";
import { auth } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup
} from "firebase/auth";
import { getUserProfile, createUserProfile } from "./db";
import { googleProvider, githubProvider } from "../lib/firebase";

// global state
export const [currentUser, setCurrentUser] = createSignal(null);
export const [isAuthenticated, setIsAuthenticated] = createSignal(false);
export const [authLoading, setAuthLoading] = createSignal(true);
export const [userRole, setUserRole] = createSignal("user");  // ← NOVO

onAuthStateChanged(auth, async (user) => {
  setCurrentUser(user);
  setIsAuthenticated(!!user);
  setAuthLoading(false);

  if (user) {
    const profile = await getUserProfile(user.uid);
    setUserRole(profile?.role || "user");
    console.log("User role učitan:", profile?.role || "user");
  } else {
    setUserRole("user");
  }
});

export const authService = {
  async signUp(email, password, name) {
    let displayName = name || "";
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await sendEmailVerification(user);
      await createUserProfile(user);

      return user;
    } catch (error) {
      console.error("Greška pri registraciji:", error);
      throw getErrorMessage(error);
    }
  },

  async signIn(email, password) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      return userCred.user;
    } catch (error) {
      throw getErrorMessage(error);
    }
  },

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        await createUserProfile(user);
      }
      return user;
    } catch (error) {
      console.error("Greška pri Google prijavi:", error);
      throw getErrorMessage(error);
    }
  },

  async signInWithGithub() {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        await createUserProfile(user);
      }
      return user;
    } catch (error) {
      console.error("Greška pri GitHub prijavi:", error);
      throw getErrorMessage(error);
    }
  },

  async signOut() {
    await signOut(auth);
  },

  async passwordReset(email) {
    await sendPasswordResetEmail(auth, email);
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  isUserAuthenticated() {
    return !!auth.currentUser;
  },

  isEmailVerified() {
    return auth.currentUser?.emailVerified || false;
  }
};

export const isAdmin = () => userRole() === "admin";

function getErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "E-mail adresa je već u upotrebi",
    "auth/invalid-email": "E-mail adresa nije ispravna",
    "auth/weak-password": "Zaporka je prekratka ili preslaba",
    "auth/user-not-found": "Korisnik ne postoji",
    "auth/wrong-password": "Pogrešna zaporka",
    "auth/user-disabled": "Račun je onemogućen",
    "auth/too-many-requests": "Previše pokušaja, pričekajte",
    "auth/network-request-failed": "Problem s mrežom"
  };
  return new Error(messages[error.code] || "Neočekivana greška: " + error.message);
}