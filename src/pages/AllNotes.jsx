import { createSignal, createResource, Show, For } from "solid-js";
import { authService, isAdmin } from "../services/auth.js";
import { deleteNote, getAllUsers, setUserRole, adjustUserPoints, toggleNotePublic, getAdminStats } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";
import { useNavigate } from "@solidjs/router";
import { db } from "../lib/firebase.js";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

const fetchAllNotes = async () => {
  const q = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return formatDistanceToNow(d, { addSuffix: true, locale: hr });
}

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={`background:rgba(255,255,255,0.035);border:1px solid var(--border2);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.5rem;position:relative;overflow:hidden;`}>
      <div style={`position:absolute;inset:0;background:${color};opacity:0.04;pointer-events:none;`} />
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <span style="font-size:0.8125rem;font-weight:500;color:var(--text3);">{label}</span>
        <span style="font-size:1.25rem;">{icon}</span>
      </div>
      <div style={`font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--text);line-height:1;`}>{value}</div>
      <Show when={sub}><div style="font-size:0.75rem;color:var(--text3);">{sub}</div></Show>
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  if (!isAdmin()) { navigate("/"); return null; }

  const [tab, setTab] = createSignal("overview");  // overview | notes | users

  // ── DATA ──────────────────────────────────────────────────────
  const [stats, { refetch: refetchStats }] = createResource(getAdminStats);
  const [notes, { refetch: refetchNotes }] = createResource(fetchAllNotes);
  const [users, { refetch: refetchUsers }] = createResource(getAllUsers);

  // Notes tab state
  const [noteFilter, setNoteFilter] = createSignal("");
  const [deleting, setDeleting] = createSignal(null);
  const [toggling, setToggling] = createSignal(null);

  // Users tab state
  const [userFilter, setUserFilter] = createSignal("");
  const [roleLoading, setRoleLoading] = createSignal(null);
  const [pointsEdit, setPointsEdit] = createSignal({}); // uid -> string value
  const [pointsSaving, setPointsSaving] = createSignal(null);

  // ── NOTES ACTIONS ─────────────────────────────────────────────
  const handleDelete = async (noteId, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Izbrisati ovu bilješku?")) return;
    setDeleting(noteId);
    try {
      await deleteNote(noteId);
      addToast("Bilješka obrisana", "success");
      refetchNotes(); refetchStats();
    } catch { addToast("Greška pri brisanju", "error"); }
    finally { setDeleting(null); }
  };

  const handleTogglePublic = async (note, e) => {
    e.preventDefault(); e.stopPropagation();
    setToggling(note.id);
    try {
      await toggleNotePublic(note.id, !note.isPublic);
      addToast(note.isPublic ? "Bilješka skrivena" : "Bilješka objavljena", "success");
      refetchNotes(); refetchStats();
    } catch { addToast("Greška", "error"); }
    finally { setToggling(null); }
  };

  // ── USER ACTIONS ──────────────────────────────────────────────
  const handleToggleAdmin = async (user) => {
    if (user.uid === authService.getCurrentUser()?.uid) {
      addToast("Ne možete promijeniti vlastitu ulogu", "warning"); return;
    }
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`Postaviti korisnika "${user.displayName}" kao ${newRole}?`)) return;
    setRoleLoading(user.uid);
    try {
      await setUserRole(user.uid, newRole);
      addToast(`Uloga promijenjena u: ${newRole}`, "success");
      refetchUsers();
    } catch { addToast("Greška pri promjeni uloge", "error"); }
    finally { setRoleLoading(null); }
  };

  const handleSavePoints = async (user) => {
    const raw = pointsEdit()[user.uid];
    if (raw === undefined || raw === "") return;
    const val = parseInt(raw, 10);
    if (isNaN(val)) { addToast("Unesite broj", "error"); return; }
    setPointsSaving(user.uid);
    try {
      await adjustUserPoints(user.uid, val);
      addToast(`Bodovi postavljeni: ${val}`, "success");
      setPointsEdit(p => { const n = { ...p }; delete n[user.uid]; return n; });
      refetchUsers(); refetchStats();
    } catch { addToast("Greška", "error"); }
    finally { setPointsSaving(null); }
  };

  // ── FILTERED DATA ─────────────────────────────────────────────
  const filteredNotes = () => {
    const q = noteFilter().toLowerCase();
    if (!q) return notes() || [];
    return (notes() || []).filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.authorName?.toLowerCase().includes(q) ||
      n.subject?.toLowerCase().includes(q)
    );
  };

  const filteredUsers = () => {
    const q = userFilter().toLowerCase();
    if (!q) return users() || [];
    return (users() || []).filter(u =>
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  };

  const TAB_STYLE = (id) =>
    `display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1.25rem;border-radius:var(--radius-md);font-size:0.875rem;font-weight:600;cursor:pointer;border:none;transition:all 0.18s;` +
    (tab() === id
      ? "background:var(--violet-dim);color:var(--violet-bright);border-bottom:2px solid var(--violet);"
      : "background:transparent;color:var(--text2);");

  return (
    <div class="page-container" style="max-width:1024px;padding-top:2rem;padding-bottom:4rem;">

      {/* ── HEADER ── */}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.375rem;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#FBBF24,#F59E0B);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
              🛡️
            </div>
            <h1 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800;margin:0;color:var(--text);">Admin Panel</h1>
          </div>
          <p style="font-size:0.85rem;color:var(--text3);margin:0;">Upravljaj sadržajem i korisnicima platforme</p>
        </div>
        <span style="background:rgba(251,191,36,0.12);color:var(--warning);border:1px solid rgba(251,191,36,0.25);border-radius:100px;padding:0.3rem 1rem;font-size:0.8rem;font-weight:700;">
          ⚡ Administrator
        </span>
      </div>

      {/* ── TABS ── */}
      <div style="display:flex;gap:0.375rem;margin-bottom:2rem;border-bottom:1px solid var(--border2);padding-bottom:0.5rem;">
        <button style={TAB_STYLE("overview")} onClick={() => setTab("overview")}>
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          Pregled
        </button>
        <button style={TAB_STYLE("notes")} onClick={() => setTab("notes")}>
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          Bilješke
          <Show when={notes()}><span style="background:var(--surface2);border-radius:100px;padding:1px 7px;font-size:0.72rem;">{(notes() || []).length}</span></Show>
        </button>
        <button style={TAB_STYLE("users")} onClick={() => setTab("users")}>
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          Korisnici
          <Show when={users()}><span style="background:var(--surface2);border-radius:100px;padding:1px 7px;font-size:0.72rem;">{(users() || []).length}</span></Show>
        </button>
      </div>

      {/* ══════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════ */}
      <Show when={tab() === "overview"}>
        <Show when={stats.loading}>
          <div style="display:flex;justify-content:center;padding:4rem;"><div class="spinner" style="width:2.5rem;height:2.5rem;" /></div>
        </Show>
        <Show when={!stats.loading && stats()}>
          {/* Stat cards grid */}
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:2.5rem;">
            <StatCard icon="👥" label="Korisnici" value={stats().totalUsers} color="linear-gradient(135deg,#7C6FF7,#22D3EE)" sub={`${stats().adminCount} admin(a)`} />
            <StatCard icon="📝" label="Bilješke" value={stats().totalNotes} color="linear-gradient(135deg,#34D399,#059669)" sub={`${stats().publicNotes} javnih · ${stats().privateNotes} privatnih`} />
            <StatCard icon="❤️" label="Favoriti" value={stats().totalFavorites} color="linear-gradient(135deg,#F87171,#DC2626)" sub="ukupno označenih" />
            <StatCard icon="⭐" label="Ukupno bodova" value={stats().totalPoints.toLocaleString()} color="linear-gradient(135deg,#FBBF24,#D97706)" sub="distribuirano" />
          </div>

          {/* Visibility split bar */}
          <div class="card-sb" style="padding:1.5rem;margin-bottom:1.5rem;">
            <div style="font-weight:600;font-size:0.9rem;margin-bottom:1rem;color:var(--text);">Distribucija bilješki</div>
            <div style="display:flex;height:10px;border-radius:100px;overflow:hidden;gap:2px;margin-bottom:0.625rem;">
              <div style={`flex:${stats().publicNotes};background:linear-gradient(90deg,var(--violet),var(--cyan));border-radius:100px;`} />
              <div style={`flex:${stats().privateNotes};background:var(--surface2);border-radius:100px;`} />
            </div>
            <div style="display:flex;gap:1.5rem;font-size:0.8rem;color:var(--text3);">
              <span style="display:flex;align-items:center;gap:0.4rem;"><span style="width:8px;height:8px;border-radius:50%;background:linear-gradient(var(--violet),var(--cyan));display:inline-block;"></span>Javne: {stats().publicNotes} ({Math.round(stats().publicNotes / Math.max(1, stats().totalNotes) * 100)}%)</span>
              <span style="display:flex;align-items:center;gap:0.4rem;"><span style="width:8px;height:8px;border-radius:50%;background:var(--surface2);border:1px solid var(--border2);display:inline-block;"></span>Privatne: {stats().privateNotes}</span>
            </div>
          </div>

          {/* Latest notes */}
          <div class="card-sb" style="overflow:hidden;">
            <div style="padding:1rem 1.5rem;border-bottom:1px solid var(--border2);font-weight:600;font-size:0.9rem;color:var(--text);">Posljednjih 5 bilješki</div>
            <Show when={notes.loading}><div style="padding:2rem;text-align:center;"><div class="spinner" /></div></Show>
            <For each={(notes() || []).slice(0, 5)}>
              {(note) => (
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.5rem;border-bottom:1px solid var(--border);gap:1rem;">
                  <div style="min-width:0;flex:1;">
                    <div style="font-weight:500;font-size:0.875rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{note.title}</div>
                    <div style="font-size:0.75rem;color:var(--text3);">{note.authorName} · {fmtDate(note.createdAt)}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span class={`badge-sb ${note.isPublic ? "badge-public" : "badge-private"}`} style="font-size:0.7rem;">{note.isPublic ? "Javna" : "Privatna"}</span>
                    <a href={`/notes/${note.id}`} class="btn-ghost" style="padding:0.25rem 0.625rem;font-size:0.78rem;">Otvori →</a>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* ══════════════════════════════════════════
          TAB: NOTES
      ══════════════════════════════════════════ */}
      <Show when={tab() === "notes"}>
        <div style="margin-bottom:1.25rem;">
          <input
            type="text"
            class="form-input"
            placeholder="Filtriraj po naslovu, autoru ili predmetu..."
            value={noteFilter()}
            onInput={e => setNoteFilter(e.target.value)}
          />
        </div>

        <Show when={notes.loading}>
          <div style="display:flex;justify-content:center;padding:4rem;"><div class="spinner" style="width:2.5rem;height:2.5rem;" /></div>
        </Show>

        <Show when={!notes.loading}>
          <p style="font-size:0.8rem;color:var(--text3);margin:0 0 0.875rem;">
            {filteredNotes().length} bilješki
            <Show when={filteredNotes().length !== (notes()?.length || 0)}>
              {" "}(filtrirano od {notes()?.length})
            </Show>
          </p>

          <div class="card-sb" style="overflow:hidden;">
            {/* Table header */}
            <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:0.75rem;padding:0.75rem 1.25rem;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border2);font-size:0.75rem;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.75px;">
              <span>Bilješka</span>
              <span style="text-align:center;">Vidljivost</span>
              <span></span>
              <span></span>
            </div>

            <Show when={filteredNotes().length === 0}>
              <div style="padding:3rem;text-align:center;color:var(--text3);">Nema bilješki</div>
            </Show>

            <For each={filteredNotes()}>
              {(note) => (
                <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:0.75rem;align-items:center;padding:0.875rem 1.25rem;border-bottom:1px solid var(--border);transition:background 0.15s;"
                  onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseOut={e => e.currentTarget.style.background = "transparent"}>

                  {/* Info */}
                  <div style="min-width:0;">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;flex-wrap:wrap;">
                      <span class="badge-sb badge-subject" style="font-size:0.68rem;">{note.subject}</span>
                      <span style="font-weight:600;font-size:0.875rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{note.title}</span>
                    </div>
                    <div style="font-size:0.75rem;color:var(--text3);">
                      {note.authorName} · {fmtDate(note.createdAt)}
                      <Show when={note.favorites?.length > 0}>
                        <span style="margin-left:0.5rem;color:var(--error);">♥ {note.favorites.length}</span>
                      </Show>
                      <Show when={note.ratingCount > 0}>
                        <span style="margin-left:0.5rem;color:var(--warning);">★ {(note.ratingSum / note.ratingCount).toFixed(1)}</span>
                      </Show>
                    </div>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    style={`padding:0.3rem 0.75rem;border-radius:100px;font-size:0.75rem;font-weight:600;cursor:pointer;transition:all 0.18s;border:1px solid;white-space:nowrap;` +
                      (note.isPublic
                        ? "background:rgba(52,211,153,0.1);color:var(--success);border-color:rgba(52,211,153,0.25);"
                        : "background:rgba(255,255,255,0.04);color:var(--text3);border-color:var(--border2);")}
                    onClick={e => handleTogglePublic(note, e)}
                    disabled={toggling() === note.id}
                  >
                    <Show when={toggling() === note.id} fallback={note.isPublic ? "✓ Javna" : "⊘ Privatna"}>
                      <div class="spinner" style="width:10px;height:10px;border-width:1.5px;" />
                    </Show>
                  </button>

                  {/* View */}
                  <a href={`/notes/${note.id}`} class="btn-outline" style="padding:0.3rem 0.75rem;font-size:0.78rem;white-space:nowrap;">
                    Pregled
                  </a>

                  {/* Delete */}
                  <button
                    class="btn-danger"
                    style="font-size:0.78rem;padding:0.3rem 0.75rem;border:1px solid rgba(248,113,113,0.2);"
                    onClick={e => handleDelete(note.id, e)}
                    disabled={deleting() === note.id}
                  >
                    <Show when={deleting() === note.id} fallback={
                      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                    }>
                      <div class="spinner" style="width:10px;height:10px;border-width:1.5px;border-top-color:var(--error);border-color:rgba(248,113,113,0.2);" />
                    </Show>
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* ══════════════════════════════════════════
          TAB: USERS
      ══════════════════════════════════════════ */}
      <Show when={tab() === "users"}>
        <div style="margin-bottom:1.25rem;">
          <input
            type="text"
            class="form-input"
            placeholder="Filtriraj po imenu, e-mailu ili ulozi..."
            value={userFilter()}
            onInput={e => setUserFilter(e.target.value)}
          />
        </div>

        <Show when={users.loading}>
          <div style="display:flex;justify-content:center;padding:4rem;"><div class="spinner" style="width:2.5rem;height:2.5rem;" /></div>
        </Show>

        <Show when={!users.loading}>
          <p style="font-size:0.8rem;color:var(--text3);margin:0 0 0.875rem;">{filteredUsers().length} korisnika</p>

          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <For each={filteredUsers()}>
              {(user) => {
                const isMe = user.uid === authService.getCurrentUser()?.uid;
                const isAdminUser = user.role === "admin";
                const editVal = () => pointsEdit()[user.uid] ?? String(user.points || 0);

                return (
                  <div class="card-sb" style={`padding:1.25rem 1.5rem;${isMe ? "border-color:rgba(124,111,247,0.35);" : ""}`}>
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">

                      {/* Avatar + info */}
                      <div style="display:flex;align-items:center;gap:0.875rem;min-width:0;">
                        <div style={`width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--violet),var(--cyan));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.95rem;color:#fff;flex-shrink:0;${isAdminUser ? "box-shadow:0 0 12px rgba(251,191,36,0.4);border:2px solid rgba(251,191,36,0.5);" : ""}`}>
                          {user.displayName?.slice(0, 2).toUpperCase() || "?"}
                        </div>
                        <div style="min-width:0;">
                          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                            <span style="font-weight:700;font-size:0.9375rem;color:var(--text);">{user.displayName}</span>
                            <Show when={isMe}>
                              <span style="background:var(--violet-dim);color:var(--violet-bright);font-size:0.65rem;font-weight:700;padding:1px 6px;border-radius:100px;text-transform:uppercase;">Ti</span>
                            </Show>
                            <Show when={isAdminUser}>
                              <span style="background:rgba(251,191,36,0.12);color:var(--warning);font-size:0.65rem;font-weight:700;padding:1px 6px;border-radius:100px;border:1px solid rgba(251,191,36,0.25);">Admin</span>
                            </Show>
                          </div>
                          <div style="font-size:0.78rem;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{user.email}</div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">

                        {/* Points editor */}
                        <div style="display:flex;align-items:center;gap:0.375rem;">
                          <svg width="13" height="13" fill="none" stroke="var(--warning)" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                          <input
                            type="number"
                            min="0"
                            value={editVal()}
                            onInput={e => setPointsEdit(p => ({ ...p, [user.uid]: e.target.value }))}
                            style="width:72px;padding:0.3rem 0.5rem;background:var(--surface2);border:1px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:0.8125rem;text-align:center;"
                          />
                          <Show when={pointsEdit()[user.uid] !== undefined}>
                            <button
                              style="padding:0.3rem 0.625rem;background:var(--success-dim);color:var(--success);border:1px solid rgba(52,211,153,0.25);border-radius:var(--radius-sm);font-size:0.78rem;font-weight:600;cursor:pointer;"
                              onClick={() => handleSavePoints(user)}
                              disabled={pointsSaving() === user.uid}
                            >
                              <Show when={pointsSaving() === user.uid} fallback="Spremi">
                                <div class="spinner" style="width:10px;height:10px;border-width:1.5px;border-top-color:var(--success);border-color:rgba(52,211,153,0.2);" />
                              </Show>
                            </button>
                          </Show>
                        </div>

                        {/* Role toggle */}
                        <button
                          disabled={isMe || roleLoading() === user.uid}
                          onClick={() => handleToggleAdmin(user)}
                          style={`padding:0.35rem 0.875rem;border-radius:var(--radius-sm);font-size:0.78rem;font-weight:600;cursor:${isMe ? "not-allowed" : "pointer"};transition:all 0.18s;border:1px solid;opacity:${isMe ? 0.4 : 1};` +
                            (isAdminUser
                              ? "background:rgba(251,191,36,0.1);color:var(--warning);border-color:rgba(251,191,36,0.25);"
                              : "background:var(--violet-dim);color:var(--violet-bright);border-color:rgba(124,111,247,0.25);")}
                        >
                          <Show when={roleLoading() === user.uid} fallback={isAdminUser ? "⬇ Skini admina" : "⬆ Postavi admina"}>
                            <div class="spinner" style="width:10px;height:10px;border-width:1.5px;" />
                          </Show>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Show>

    </div>
  );
}
