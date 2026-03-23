import { createResource, createSignal, Show, For } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { getNoteById, toggleNoteFavorite, deleteNote } from "../services/db.js";
import { isAuthenticated, authService, isAdmin } from "../services/auth.js";
import { addToast } from "../components/Toast.jsx";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

export default function NoteDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [isFav, setIsFav] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

  const [note, { mutate }] = createResource(() => params.id, async (id) => {
    const data = await getNoteById(id);
    if (data && isAuthenticated()) setIsFav(data.favorites?.includes(authService.getCurrentUser().uid) || false);
    return data;
  });

  const handleFavorite = async () => {
    if (!isAuthenticated()) { addToast("Prijavite se za favourite", "info"); return; }
    const uid = authService.getCurrentUser().uid;
    try {
      const updated = await toggleNoteFavorite(params.id, uid, isFav());
      setIsFav(!isFav());
      mutate(prev => ({ ...prev, favorites: updated }));
    } catch { addToast("Greška", "error"); }
  };

  const handleDelete = async () => {
    if (!confirm("Jeste li sigurni da želite obrisati ovu bilješku?")) return;
    setDeleting(true);
    try {
      await deleteNote(params.id);
      addToast("Bilješka obrisana", "success");
      navigate(isAdmin() ? "/notes/all" : "/notes/my");
    } catch { addToast("Greška pri brisanju", "error"); setDeleting(false); }
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true, locale: hr });
  };

  // može uređivati/brisati: vlasnik ILI admin
  const canEdit = () => isAuthenticated() && (note()?.userId === authService.getCurrentUser().uid || isAdmin());

  return (
    <div class="page-md" style="padding-top:2rem;">
      <a href="/" class="btn-ghost" style="padding:0.375rem 0.75rem;display:inline-flex;margin-bottom:1.5rem;">← Natrag</a>
      <Show when={note.loading}>
        <div style="display:flex;justify-content:center;padding:4rem;"><div class="spinner"></div></div>
      </Show>
      <Show when={!note.loading && !note()}>
        <div class="alert-sb alert-error">Bilješka ne postoji ili je privatna.</div>
      </Show>
      <Show when={!note.loading && note()}>
        <article class="card-sb">
          <div style="padding:2rem;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">
              <div style="flex:1;">
                <div style="display:flex;gap:0.5rem;margin-bottom:0.875rem;flex-wrap:wrap;align-items:center;">
                  <span class="badge-sb badge-subject">{note().subject}</span>
                  <Show when={!note().isPublic}><span class="badge-sb badge-private">Privatna</span></Show>
                  <Show when={isAdmin() && note()?.userId !== authService.getCurrentUser()?.uid}>
                    <span class="badge-sb" style="background:rgba(240,160,80,0.15);color:var(--warning);font-size:0.7rem;">Admin pregled</span>
                  </Show>
                </div>
                <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,4vw,2rem);font-weight:700;margin:0 0 0.5rem;line-height:1.25;color:var(--text);">{note().title}</h1>
                <p style="font-size:0.8rem;color:var(--text3);margin:0;">{note().authorName} · {fmtDate(note().createdAt)}</p>
              </div>

              <div style="display:flex;gap:0.5rem;flex-shrink:0;flex-wrap:wrap;">
                <button onClick={handleFavorite} class="btn-outline" style={`padding:0.5rem 1rem;display:flex;align-items:center;gap:0.4rem;${isFav() ? "border-color:var(--teal);color:var(--teal);background:var(--teal-dim);" : ""}`}>
                  <svg width="15" height="15" fill={isFav() ? "currentColor" : "none"} stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {note().favorites?.length || 0}
                </button>

                <Show when={canEdit()}>
                  <button
                    class="btn-danger"
                    style="border:1px solid rgba(224,96,96,0.25);padding:0.5rem 1rem;display:flex;align-items:center;gap:0.375rem;"
                    onClick={handleDelete}
                    disabled={deleting()}
                  >
                    <Show when={deleting()} fallback={
                      <>
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Izbriši
                      </>
                    }>
                      <div class="spinner" style="width:13px;height:13px;border-width:2px;border-top-color:var(--error);border-color:rgba(224,96,96,0.2);"></div>
                    </Show>
                  </button>
                </Show>
              </div>
            </div>

            <div class="divider-sb"></div>
            <div style="line-height:1.85;color:var(--text);margin-bottom:1.5rem;">
              <pre style="white-space:pre-wrap;font-family:var(--font-body);font-size:1rem;line-height:1.85;margin:0;color:var(--text);">{note().content}</pre>
            </div>
            <Show when={note().tags?.length > 0}>
              <div class="divider-sb"></div>
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                <For each={note().tags}>
                  {tag => <span style="font-size:0.8125rem;background:var(--surface2);color:var(--text2);padding:0.25rem 0.75rem;border-radius:100px;border:1px solid var(--border);">{tag}</span>}
                </For>
              </div>
            </Show>
          </div>
        </article>
      </Show>
    </div>
  );
}