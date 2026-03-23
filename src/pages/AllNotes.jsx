import { createSignal, createResource, Show, For } from "solid-js";
import { authService, isAdmin } from "../services/auth.js";
import { deleteNote } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";
import { useNavigate } from "@solidjs/router";
import { db } from "../lib/firebase.js";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

const fetchAllNotes = async () => {
  const q = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export default function AllNotes() {
  const navigate = useNavigate();
  const [notes, { refetch }] = createResource(fetchAllNotes);
  const [deleting, setDeleting] = createSignal(null);
  const [filter, setFilter] = createSignal("");

  // Redirect ako nije admin
  if (!isAdmin()) { navigate("/"); return null; }

  const handleDelete = async (noteId, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Izbrisati ovu bilješku?")) return;
    setDeleting(noteId);
    try {
      await deleteNote(noteId);
      addToast("Bilješka obrisana", "success");
      refetch();
    } catch { addToast("Greška pri brisanju", "error"); }
    finally { setDeleting(null); }
  };

  const filtered = () => {
    const q = filter().toLowerCase();
    if (!q) return notes() || [];
    return (notes() || []).filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.authorName?.toLowerCase().includes(q) ||
      n.subject?.toLowerCase().includes(q)
    );
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true, locale: hr });
  };

  return (
    <div class="page-container" style="max-width:900px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:700;margin:0;color:var(--text);">Sve bilješke</h1>
          <p style="font-size:0.8rem;color:var(--text3);margin:0.25rem 0 0;">Admin pregled</p>
        </div>
        <span class="badge-sb" style="background:rgba(240,160,80,0.15);color:var(--warning);font-size:0.8rem;padding:0.3rem 0.875rem;">
          Administrator
        </span>
      </div>

      <div style="margin-bottom:1.5rem;">
        <input
          type="text"
          class="form-input"
          placeholder="Filtriraj po naslovu, autoru ili predmetu..."
          value={filter()}
          onInput={e => setFilter(e.target.value)}
        />
      </div>

      <Show when={notes.loading}>
        <div style="display:flex;justify-content:center;padding:4rem;"><div class="spinner"></div></div>
      </Show>

      <Show when={notes.error}>
        <div class="alert-sb alert-error">Greška učitavanja bilješki. Provjeri Firebase pravila za admina.</div>
      </Show>

      <Show when={!notes.loading && filtered().length === 0}>
        <div style="text-align:center;padding:3rem;color:var(--text3);">Nema bilješki</div>
      </Show>

      <Show when={!notes.loading && filtered().length > 0}>
        <p style="font-size:0.8rem;color:var(--text3);margin:0 0 0.875rem;">
          Ukupno: {filtered().length} {notes()?.length !== filtered().length ? `(filtrirano od ${notes().length})` : ""}
        </p>

        <div style="display:flex;flex-direction:column;gap:0.625rem;">
          <For each={filtered()}>
            {(note) => (
              <div class="card-sb" style="padding:1.125rem 1.25rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;align-items:center;flex-wrap:wrap;">
                      <span class="badge-sb badge-subject">{note.subject}</span>
                      <span class={`badge-sb ${note.isPublic ? "badge-public" : "badge-private"}`}>
                        {note.isPublic ? "Javna" : "Privatna"}
                      </span>
                    </div>
                    <a href={`/notes/${note.id}`} style="text-decoration:none;">
                      <h3 style="font-family:var(--font-display);font-size:1.0625rem;font-weight:600;color:var(--text);margin:0 0 0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        {note.title}
                      </h3>
                    </a>
                    <p style="font-size:0.8rem;color:var(--text3);margin:0;">
                      <span style="color:var(--text2);">{note.authorName}</span>
                      {" · "}{fmtDate(note.createdAt)}
                      <Show when={note.favorites?.length > 0}>
                        <span style="margin-left:0.75rem;color:var(--teal);">♥ {note.favorites.length}</span>
                      </Show>
                    </p>
                  </div>

                  <div style="display:flex;gap:0.5rem;flex-shrink:0;">
                    <a href={`/notes/${note.id}`} class="btn-outline" style="padding:0.375rem 0.75rem;font-size:0.8rem;">
                      Pregled
                    </a>
                    <button
                      class="btn-danger"
                      style="font-size:0.8rem;padding:0.375rem 0.75rem;border:1px solid rgba(224,96,96,0.25);"
                      onClick={(e) => handleDelete(note.id, e)}
                      disabled={deleting() === note.id}
                    >
                      <Show when={deleting() === note.id} fallback="Izbriši">
                        <div class="spinner" style="width:12px;height:12px;border-width:2px;border-top-color:var(--error);border-color:rgba(224,96,96,0.2);"></div>
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
