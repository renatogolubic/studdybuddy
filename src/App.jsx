import { Router, Route, Navigate, useLocation } from "@solidjs/router";
import { isAuthenticated, authLoading, isAdmin } from "./services/auth.js";
import { Show, createSignal, createEffect } from "solid-js";
import Toast from "./components/Toast.jsx";
import ThemeSelector from "./components/ThemeSelector.jsx";
import Home          from "./pages/Home.jsx";
import SignIn        from "./pages/SignIn.jsx";
import SignUp        from "./pages/SignUp.jsx";
import Error         from "./pages/Error.jsx";
import SignOut       from "./pages/SignOut.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import UserProfile   from "./pages/UserProfile.jsx";
import NoteCreate    from "./pages/NoteCreate.jsx";
import NoteDetail    from "./pages/NoteDetail.jsx";
import MyNotes       from "./pages/MyNotes.jsx";
import SearchNotes   from "./pages/SearchNotes.jsx";
import AllNotes      from "./pages/AllNotes.jsx";
import Flashcards    from "./pages/Flashcards.jsx";
import Leaderboard   from "./pages/Leaderboard.jsx";

export default function App() {
  return (
    <div data-theme="studybuddy" style="min-height:100vh; display:flex; flex-direction:column; background:var(--bg);">
      <Router root={Layout}>
        <Route path="/"        component={Home} />
        <Route path="/error"   component={Error} />
        <Route path="/user">
          <Route path="/signin"        component={SignIn} />
          <Route path="/signup"        component={SignUp} />
          <Route path="/signout"       component={SignOut} />
          <Route path="/resetpassword" component={ResetPassword} />
        </Route>
        <Route path="/notes/:id" component={NoteDetail} />
        <Route path="/notes/:id/flashcards" component={Flashcards} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile" component={AuthBoundary}>
          <Route path="/" component={UserProfile} />
        </Route>
        <Route path="/notes" component={AuthBoundary}>
          <Route path="/create" component={NoteCreate} />
          <Route path="/my"     component={MyNotes} />
          <Route path="/search" component={SearchNotes} />
          <Route path="/all"    component={AllNotes} />
        </Route>
        <Route path="/*" component={NotFound} />
      </Router>
      <Toast />
    </div>
  );
}

function Layout(props) {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const location = useLocation();

  createEffect(() => { location.pathname; setMenuOpen(false); });

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav class="sb-navbar">
        {/* Logo */}
        <a href="/" class="sb-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
            <path d="M12 2L3 7l9 5 9-5-9-5z" fill="url(#lg1)" opacity="0.9"/>
            <path d="M3 12l9 5 9-5" stroke="url(#lg2)" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M3 17l9 5 9-5" stroke="url(#lg2)" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
            <defs>
              <linearGradient id="lg1" x1="3" y1="2" x2="21" y2="12" gradientUnits="userSpaceOnUse">
                <stop stop-color="#9D94FF"/>
                <stop offset="1" stop-color="#22D3EE"/>
              </linearGradient>
              <linearGradient id="lg2" x1="3" y1="12" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                <stop stop-color="#9D94FF"/>
                <stop offset="1" stop-color="#22D3EE"/>
              </linearGradient>
            </defs>
          </svg>
          Study<span>Buddy</span>
        </a>

        {/* Desktop links */}
        <div class="sb-nav-links sb-nav-desktop">
          <a href="/leaderboard" class={`btn-sb${isActive("/leaderboard") ? " nav-active" : ""}`}>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Rang-lista
          </a>
          <a href="/notes/search" class={`btn-sb${isActive("/notes/search") ? " nav-active" : ""}`}>
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Pretraga
          </a>
          <Show when={isAuthenticated()}>
            <a href="/notes/my" class={`btn-sb${isActive("/notes/my") ? " nav-active" : ""}`}>
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Moje bilješke
            </a>
            <Show when={isAdmin()}>
              <a href="/notes/all" class={`btn-sb${isActive("/notes/all") ? " nav-active" : ""}`} style="color:var(--warning);">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Admin Panel
              </a>
            </Show>
            <a href="/profile" class={`btn-sb${isActive("/profile") ? " nav-active" : ""}`}>
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Profil
            </a>
            <a href="/user/signout" class="btn-sb" title="Odjava" style="color:var(--error);">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </a>
          </Show>
          <Show when={!isAuthenticated()}>
            <a href="/user/signin" class="btn-ghost">Prijava</a>
          </Show>
          {/* Theme selector — always visible in navbar */}
          <div style="width:1px;height:20px;background:var(--border2);margin:0 0.25rem;" />
          <ThemeSelector />
          <Show when={isAuthenticated()}>
            <a href="/notes/create" class="btn-primary" style="margin-left:0.25rem;">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nova bilješka
            </a>
          </Show>
          <Show when={!isAuthenticated()}>
            <a href="/user/signup" class="btn-primary">Registracija</a>
          </Show>
        </div>

        {/* Mobile controls */}
        <div class="sb-nav-mobile">
          <Show when={isAuthenticated()}>
            <a href="/notes/create" class="btn-primary" style="padding:0.4rem 0.875rem;font-size:0.8125rem;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nova
            </a>
          </Show>
          <button
            class="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen())}
            aria-label="Izbornik"
          >
            <Show when={!menuOpen()} fallback={
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }>
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </Show>
          </button>
        </div>
      </nav>

      {/* ── MOBILE DROPDOWN ── */}
      <Show when={menuOpen()}>
        <div class="mobile-menu">
          <a href="/notes/search" class="mobile-menu-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Pretraga bilješki
          </a>
          <a href="/leaderboard" class="mobile-menu-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Rang-lista
          </a>
          <Show when={isAuthenticated()}>
            <a href="/notes/my" class="mobile-menu-item">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Moje bilješke
            </a>
            <a href="/profile" class="mobile-menu-item">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Moj profil
            </a>
            <Show when={isAdmin()}>
              <a href="/notes/all" class="mobile-menu-item" style="color:var(--warning);">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Admin panel
              </a>
            </Show>
            <div class="mobile-menu-divider" />
            <a href="/user/signout" class="mobile-menu-item" style="color:var(--error);">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Odjava
            </a>
          </Show>
          <Show when={!isAuthenticated()}>
            <a href="/user/signin" class="mobile-menu-item">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Prijava
            </a>
            <a href="/user/signup" class="mobile-menu-item" style="color:var(--violet-bright);">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Registracija
            </a>
          </Show>
        </div>
      </Show>

      <Show when={menuOpen()}>
        <div class="mobile-overlay" onClick={() => setMenuOpen(false)} />
      </Show>

      <main style="flex:1; padding-bottom: var(--bottom-nav-height, 0px);">
        {props.children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <Show when={isAuthenticated()}>
        <nav class="bottom-nav">
          <a href="/" class={`bottom-nav-item${location.pathname === "/" ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Početna</span>
          </a>
          <a href="/notes/search" class={`bottom-nav-item${isActive("/notes/search") ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span>Pretraga</span>
          </a>
          <a href="/leaderboard" class={`bottom-nav-item${isActive("/leaderboard") ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>Rang</span>
          </a>
          <a href="/notes/create" class="bottom-nav-item bottom-nav-create">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </a>
          <a href="/notes/my" class={`bottom-nav-item${isActive("/notes/my") ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Bilješke</span>
          </a>
          <a href="/profile" class={`bottom-nav-item${isActive("/profile") ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <span>Profil</span>
          </a>
        </nav>
      </Show>

      <footer class="sb-footer">
        <span style="background:linear-gradient(135deg,var(--violet-bright),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:600;">StudyBuddy</span>
        {" "}© {new Date().getFullYear()}
      </footer>

      <style>{`
        .nav-active {
          color: var(--violet-bright) !important;
          background: var(--violet-dim) !important;
        }
      `}</style>
    </>
  );
}

function AuthBoundary(props) {
  return (
    <Show when={!authLoading()} fallback={
      <div style="display:flex;justify-content:center;align-items:center;min-height:60vh;">
        <div class="spinner" />
      </div>
    }>
      {isAuthenticated() ? props.children : <Navigate href="/user/signin" />}
    </Show>
  );
}

function NotFound() {
  return (
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:1.5rem;text-align:center;padding:1rem;">
      <div style="position:relative;">
        <p style="font-family:var(--font-display);font-size:clamp(5rem,15vw,9rem);font-weight:800;margin:0;line-height:1;background:linear-gradient(135deg,var(--violet),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;opacity:0.3;">
          404
        </p>
      </div>
      <div>
        <p style="font-family:var(--font-display);font-size:1.5rem;font-weight:700;margin:0 0 0.5rem;color:var(--text);">Stranica ne postoji</p>
        <p style="color:var(--text2);margin:0;font-size:0.9375rem;">Izgledali ste stranicu koja ne postoji ili je premještena.</p>
      </div>
      <a href="/" class="btn-primary" style="padding:0.75rem 2rem;">← Naslovnica</a>
    </div>
  );
}