import { createSignal, createResource, Show, For } from "solid-js";
import { authService } from "../services/auth.js";
import { getMyNotes, deleteNote } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

const fetchMyNotes = async () => {
  const user = authService.getCurrentUser();
  if (!user) return { notes: [] };
  return await getMyNotes(user.uid, "createdAt", "desc", 50);
};

export default function MyNotes() {
  const [data, { refetch }] = createResource(fetchMyNotes);
  const [deleting, setDeleting] = createSignal(null);

  const handleDelete = async (noteId) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovu bilješku?")) return;
    setDeleting(noteId);
    try { await deleteNote(noteId); addToast("Bilješka obrisana", "success"); refetch(); }
    catch { addToast("Greška pri brisanju", "error"); }
    finally { setDeleting(null); }
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true, locale: hr });
  };

  return (
    <div class="page-container" style="max-width:820px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;">
        <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:700;margin:0;color:var(--text);">Moje bilješke</h1>
        <a href="/notes/create" class="btn-primary">+ Nova bilješka</a>
      </div>

      <Show when={data.loading}>
        <div style="display:flex;justify-content:center;padding:4rem;"><div class="spinner"></div></div>
      </Show>

      <Show when={!data.loading && data()?.notes?.length === 0}>
        <div class="card-sb" style="padding:3.5rem;text-align:center;">
          <p style="font-size:1rem;color:var(--text3);margin:0 0 1.5rem;">Još nemate bilješki</p>
          <a href="/notes/create" class="btn-primary">Stvori prvu bilješku</a>
        </div>
      </Show>

      <Show when={!data.loading && data()?.notes?.length > 0}>
        <div style="display:flex;flex-direction:column;gap:0.625rem;">
          <For each={data().notes}>
            {(note) => (
              <div class="card-sb" style="transition:all 0.15s ease;">
                <div style="padding:1.125rem 1.25rem; display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap;align-items:center;">
                      <span class="badge-sb badge-subject">{note.subject}</span>
                      <span class={`badge-sb ${note.isPublic ? "badge-public" : "badge-private"}`}>{note.isPublic ? "Javna" : "Privatna"}</span>
                    </div>
                    <a href={`/notes/${note.id}`} style="text-decoration:none;">
                      <h3 style="font-family:var(--font-display);font-size:1.0625rem;font-weight:600;color:var(--text);margin:0 0 0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{note.title}</h3>
                    </a>
                    <p style="font-size:0.8rem;color:var(--text3);margin:0;">
                      {fmtDate(note.createdAt)}
                      <Show when={note.favorites?.length > 0}><span style="margin-left:0.75rem;color:var(--teal);">♥ {note.favorites.length}</span></Show>
                    </p>
                    <Show when={note.tags?.length > 0}>
                      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:0.5rem;">
                        <For each={note.tags.slice(0, 4)}>
                          {tag => <span style="font-size:0.7rem;background:var(--surface2);color:var(--text2);padding:2px 7px;border-radius:100px;border:1px solid var(--border);">{tag}</span>}
                        </For>
                      </div>
                    </Show>
                  </div>
                  <div style="display:flex;gap:0.5rem;flex-shrink:0;">
                    <a href={`/notes/${note.id}`} class="btn-outline" style="padding:0.4rem 0.875rem;font-size:0.8rem;">Otvori</a>
                    <button class="btn-danger" style="font-size:0.8rem;padding:0.4rem 0.875rem;" onClick={() => handleDelete(note.id)} disabled={deleting() === note.id}>
                      <Show when={deleting() === note.id} fallback="Izbriši">
                        <div class="spinner" style="width:13px;height:13px;border-width:2px;"></div>
                      </Show>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
