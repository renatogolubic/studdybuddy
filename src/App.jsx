import { Router, Route, Navigate, useLocation } from "@solidjs/router";
import { isAuthenticated, authLoading, isAdmin } from "./services/auth.js";
import { Show, createSignal, createEffect } from "solid-js";
import Toast from "./components/Toast.jsx";
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

  // Zatvori menu pri promjeni rute
  createEffect(() => { location.pathname; setMenuOpen(false); });

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {/* ── DESKTOP NAVBAR ── */}
      <nav class="sb-navbar">
        <a href="/" class="sb-logo">Study<span>Buddy</span></a>

        {/* Desktop linkovi */}
        <div class="sb-nav-links sb-nav-desktop">
          <a href="/notes/search" class="btn-sb">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Pretraga
          </a>
          <Show when={isAuthenticated()}>
            <a href="/notes/my" class="btn-sb">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Moje bilješke
            </a>
            <Show when={isAdmin()}>
              <a href="/notes/all" class="btn-sb" style="color:var(--warning);">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Admin
              </a>
            </Show>
            <a href="/notes/create" class="btn-primary" style="margin-left:0.25rem;">+ Nova bilješka</a>
            <a href="/profile" class="btn-sb">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Profil
            </a>
            <a href="/user/signout" class="btn-sb" title="Odjava">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </a>
          </Show>
          <Show when={!isAuthenticated()}>
            <a href="/user/signin" class="btn-ghost">Prijava</a>
            <a href="/user/signup" class="btn-primary">Registracija</a>
          </Show>
        </div>

        {/* Mobile: hamburger + nova bilješka */}
        <div class="sb-nav-mobile">
          <Show when={isAuthenticated()}>
            <a href="/notes/create" class="btn-primary" style="padding:0.4rem 0.875rem;font-size:0.8125rem;">+ Nova</a>
          </Show>
          <button
            class="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen())}
            aria-label="Izbornik"
          >
            <Show when={!menuOpen()} fallback={
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }>
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </Show>
          </button>
        </div>
      </nav>

      {/* ── MOBILE DROPDOWN MENU ── */}
      <Show when={menuOpen()}>
        <div class="mobile-menu">
          <a href="/notes/search" class="mobile-menu-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Pretraga bilješki
          </a>
          <Show when={isAuthenticated()}>
            <a href="/notes/my" class="mobile-menu-item">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Moje bilješke
            </a>
            <a href="/profile" class="mobile-menu-item">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Moj profil
            </a>
            <Show when={isAdmin()}>
              <a href="/notes/all" class="mobile-menu-item" style="color:var(--warning);">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Admin panel
              </a>
            </Show>
            <div class="mobile-menu-divider"></div>
            <a href="/user/signout" class="mobile-menu-item" style="color:var(--error);">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Odjava
            </a>
          </Show>
          <Show when={!isAuthenticated()}>
            <a href="/user/signin" class="mobile-menu-item">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Prijava
            </a>
            <a href="/user/signup" class="mobile-menu-item" style="color:var(--teal);">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Registracija
            </a>
          </Show>
        </div>
      </Show>

      {/* Overlay za zatvaranje menija */}
      <Show when={menuOpen()}>
        <div class="mobile-overlay" onClick={() => setMenuOpen(false)}></div>
      </Show>

      <main style="flex:1; padding-bottom: var(--bottom-nav-height, 0px);">
        {props.children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <Show when={isAuthenticated()}>
        <nav class="bottom-nav">
          <a href="/" class={`bottom-nav-item${isActive("/") && location.pathname === "/" ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Početna</span>
          </a>
          <a href="/notes/search" class={`bottom-nav-item${isActive("/notes/search") ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span>Pretraga</span>
          </a>
          <a href="/notes/create" class="bottom-nav-item bottom-nav-create">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </a>
          <a href="/notes/my" class={`bottom-nav-item${isActive("/notes/my") ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Bilješke</span>
          </a>
          <a href="/profile" class={`bottom-nav-item${isActive("/profile") ? " active" : ""}`}>
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <span>Profil</span>
          </a>
        </nav>
      </Show>

      <footer class="sb-footer">
        © {new Date().getFullYear()} StudyBuddy
      </footer>
    </>
  );
}

function AuthBoundary(props) {
  return (
    <Show when={!authLoading()} fallback={
      <div style="display:flex;justify-content:center;align-items:center;min-height:60vh;">
        <div class="spinner"></div>
      </div>
    }>
      {isAuthenticated() ? props.children : <Navigate href="/user/signin" />}
    </Show>
  );
}

function NotFound() {
  return (
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1rem;text-align:center; padding:1rem;">
      <p style="font-family:var(--font-display);font-size:5rem;font-weight:700;color:var(--surface3);margin:0;line-height:1;">404</p>
      <p style="color:var(--text2);">Stranica ne postoji.</p>
      <a href="/" class="btn-primary">Naslovnica</a>
    </div>
  );
}