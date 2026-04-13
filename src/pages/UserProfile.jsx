import { createSignal, createResource, Show } from "solid-js";
import { authService, isAuthenticated } from "../services/auth";
import { getUserProfile, updateUserProfile } from "../services/db";
import { addToast } from "../components/Toast";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";

const fetchProfile = async () => {
  if (!isAuthenticated()) return null;
  const user = authService.getCurrentUser();
  if (!user) return null;
  return await getUserProfile(user.uid);
};

export default function UserProfile() {
  const [profile, { mutate }] = createResource(fetchProfile);
  const [editing, setEditing] = createSignal(false);
  const [displayName, setDisplayName] = createSignal("");
  const [subjects, setSubjects] = createSignal("");

  const [changingPw, setChangingPw] = createSignal(false);
  const [pwLoading, setPwLoading] = createSignal(false);
  const [currentPw, setCurrentPw] = createSignal("");
  const [newPw, setNewPw] = createSignal("");
  const [confirmPw, setConfirmPw] = createSignal("");
  const [pwError, setPwError] = createSignal("");

  const startEdit = () => {
    setDisplayName(profile()?.displayName || "");
    setSubjects(profile()?.favoriteSubjects?.join(", ") || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    const subjectList = subjects().split(",").map(s => s.trim()).filter(Boolean);
    const name = displayName().trim() || profile().displayName;
    try {
      await updateUserProfile(authService.getCurrentUser().uid, { displayName: name, favoriteSubjects: subjectList });
      mutate(prev => ({ ...prev, displayName: name, favoriteSubjects: subjectList }));
      setEditing(false);
      addToast("Profil ažuriran", "success");
    } catch { addToast("Greška pri spremanju", "error"); }
  };

  const changePassword = async () => {
    setPwError("");
    if (!currentPw()) { setPwError("Unesite trenutnu lozinku"); return; }
    if (newPw().length < 6) { setPwError("Nova lozinka mora imati najmanje 6 znakova"); return; }
    if (newPw() !== confirmPw()) { setPwError("Lozinke se ne podudaraju"); return; }
    if (currentPw() === newPw()) { setPwError("Nova lozinka mora biti drugačija od trenutne"); return; }
    setPwLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPw());
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw());
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setChangingPw(false);
      addToast("Lozinka uspješno promijenjena", "success");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") setPwError("Trenutna lozinka nije ispravna");
      else if (err.code === "auth/too-many-requests") setPwError("Previše pokušaja, pričekajte malo");
      else setPwError("Greška: " + err.message);
    } finally { setPwLoading(false); }
  };

  const cancelPw = () => { setChangingPw(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError(""); };

  const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  // Generate a gradient based on initials
  const avatarGradient = (name) => {
    const colors = [
      ["#7C6FF7","#5548C8"],["#22D3EE","#0EA5E9"],["#34D399","#059669"],
      ["#F87171","#DC2626"],["#FBBF24","#D97706"],["#818CF8","#4F46E5"]
    ];
    const idx = (name?.charCodeAt(0) || 0) % colors.length;
    return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
  };

  return (
    <div class="page-md" style="padding-top:2.5rem;">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:2rem;">
        <span class="glow-dot" />
        <h1 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800;margin:0;color:var(--text);">Moj profil</h1>
      </div>

      <Show when={profile.loading}>
        <div style="display:flex;justify-content:center;padding:5rem;">
          <div class="spinner" style="width:2.5rem;height:2.5rem;" />
        </div>
      </Show>

      <Show when={!profile.loading && profile()}>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:1.25rem;">

          {/* ── Avatar card ── */}
          <div class="card-sb" style="padding:1.75rem;text-align:center;align-self:start;overflow:hidden;">
            {/* Top gradient accent */}
            <div style={`height:3px;background:${avatarGradient(profile().displayName)};margin:-1.75rem -1.75rem 1.5rem;`} />
            <div style={`width:80px;height:80px;border-radius:50%;background:${avatarGradient(profile().displayName)};font-family:var(--font-display);font-size:1.875rem;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#fff;box-shadow:0 4px 20px rgba(124,111,247,0.35);`}>
              {initials(profile().displayName)}
            </div>
            <p style="font-family:var(--font-display);font-size:1.0625rem;font-weight:700;margin:0 0 0.25rem;color:var(--text);">{profile().displayName}</p>
            <p style="font-size:0.8rem;color:var(--text3);margin:0 0 0.875rem;word-break:break-all;">{profile().email}</p>
            <span class="badge-sb badge-subject">{profile().role === "admin" ? "⚡ Administrator" : "👤 Korisnik"}</span>
            <div class="divider-sb" />
            <Show when={!editing() && !changingPw()}>
              <div style="display:flex;flex-direction:column;gap:0.625rem;">
                <button class="btn-outline" style="width:100%;justify-content:center;" onClick={startEdit}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Uredi profil
                </button>
                <button class="btn-ghost" style="width:100%;justify-content:center;font-size:0.8125rem;" onClick={() => setChangingPw(true)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Promijeni lozinku
                </button>
              </div>
            </Show>
          </div>

          {/* ── Info card ── */}
          <div class="card-sb" style="padding:1.75rem;">

            {/* View mode */}
            <Show when={!editing() && !changingPw()}>
              <h2 style="font-size:0.75rem;font-weight:600;color:var(--text3);margin:0 0 1.5rem;letter-spacing:0.08em;text-transform:uppercase;">Podaci o korisniku</h2>
              <div style="display:flex;flex-direction:column;gap:1.25rem;">
                {[
                  ["Prikazno ime", profile().displayName],
                  ["E-mail", profile().email],
                ].map(([label, val]) => (
                  <div>
                    <p style="font-size:0.7375rem;color:var(--text3);margin:0 0 0.3rem;text-transform:uppercase;letter-spacing:0.06em;">{label}</p>
                    <p style="margin:0;color:var(--text);font-weight:500;">{val}</p>
                  </div>
                ))}
                <div>
                  <p style="font-size:0.7375rem;color:var(--text3);margin:0 0 0.3rem;text-transform:uppercase;letter-spacing:0.06em;">E-mail potvrđen</p>
                  <span class="badge-sb" style={authService.isEmailVerified() ? "background:var(--success-dim);color:var(--success);border:1px solid rgba(52,211,153,0.2);" : "background:var(--warning-dim);color:var(--warning);border:1px solid rgba(251,191,36,0.2);"}>
                    {authService.isEmailVerified() ? "✓ Potvrđen" : "✗ Nije potvrđen"}
                  </span>
                </div>
                <div>
                  <p style="font-size:0.7375rem;color:var(--text3);margin:0 0 0.5rem;text-transform:uppercase;letter-spacing:0.06em;">Omiljeni predmeti</p>
                  <Show when={profile().favoriteSubjects?.length > 0} fallback={
                    <p style="color:var(--text3);margin:0;font-size:0.875rem;font-style:italic;">Nije odabrano</p>
                  }>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">
                      {profile().favoriteSubjects.map(s => <span class="badge-sb badge-subject">{s}</span>)}
                    </div>
                  </Show>
                </div>
                <div>
                  <p style="font-size:0.7375rem;color:var(--text3);margin:0 0 0.3rem;text-transform:uppercase;letter-spacing:0.06em;">Račun kreiran</p>
                  <p style="margin:0;color:var(--text2);font-size:0.875rem;">
                    {new Date(profile().createdAt).toLocaleDateString("hr-HR", { year:"numeric", month:"long", day:"numeric" })}
                  </p>
                </div>
              </div>
            </Show>

            {/* Edit mode */}
            <Show when={editing()}>
              <h2 style="font-size:0.75rem;font-weight:600;color:var(--text3);margin:0 0 1.5rem;letter-spacing:0.08em;text-transform:uppercase;">Uredi profil</h2>
              <div class="form-group">
                <label class="form-label">Prikazno ime</label>
                <input type="text" class="form-input" value={displayName()} onInput={e => setDisplayName(e.target.value)} />
              </div>
              <div class="form-group">
                <label class="form-label">Omiljeni predmeti</label>
                <input type="text" class="form-input" placeholder="Matematika, Fizika, Engleski" value={subjects()} onInput={e => setSubjects(e.target.value)} />
                <p style="font-size:0.775rem;color:var(--text3);margin:0.3rem 0 0;">Odvojite zarezom</p>
              </div>
              <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
                <button class="btn-primary" onClick={saveProfile}>Spremi promjene</button>
                <button class="btn-ghost" onClick={() => setEditing(false)}>Odustani</button>
              </div>
            </Show>

            {/* Change password mode */}
            <Show when={changingPw()}>
              <h2 style="font-size:0.75rem;font-weight:600;color:var(--text3);margin:0 0 1.5rem;letter-spacing:0.08em;text-transform:uppercase;">Promjena lozinke</h2>
              <div class="form-group">
                <label class="form-label">Trenutna lozinka</label>
                <input type="password" class="form-input" placeholder="••••••••" value={currentPw()} onInput={e => { setCurrentPw(e.target.value); setPwError(""); }} />
              </div>
              <div class="form-group">
                <label class="form-label">Nova lozinka</label>
                <input type="password" class="form-input" placeholder="Min. 6 znakova" value={newPw()} onInput={e => { setNewPw(e.target.value); setPwError(""); }} />
              </div>
              <div class="form-group">
                <label class="form-label">Potvrda nove lozinke</label>
                <input type="password" class="form-input" placeholder="Ponovite novu lozinku" value={confirmPw()} onInput={e => { setConfirmPw(e.target.value); setPwError(""); }} />
              </div>
              <Show when={pwError()}>
                <div class="alert-sb alert-error" style="margin-bottom:1rem;font-size:0.875rem;">{pwError()}</div>
              </Show>
              <div style="display:flex;gap:0.75rem;margin-top:0.25rem;">
                <button class="btn-primary" onClick={changePassword} disabled={pwLoading()}>
                  <Show when={pwLoading()}>
                    <div class="spinner" style="width:14px;height:14px;border-width:2px;border-color:rgba(255,255,255,0.2);border-top-color:#fff;" />
                  </Show>
                  Spremi lozinku
                </button>
                <button class="btn-ghost" onClick={cancelPw}>Odustani</button>
              </div>
            </Show>
          </div>

        </div>
      </Show>
    </div>
  );
}