import { createSignal, createResource, Show, For } from "solid-js";
import { authService } from "../services/auth.js";
import { getMyNotes, deleteNote } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

const SUBJECT_COLOR = {
  "Matematika":"#7C6FF7","Fizika":"#22D3EE","Kemija":"#34D399","Biologija":"#4ADE80",
  "Hrvatski":"#F87171","Engleski":"#60A5FA","Povijest":"#FBBF24","Geografija":"#2DD4BF",
  "Informatika":"#818CF8","Ostalo":"#9CA3AF",
};

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

  const totalFaves = () => data()?.notes?.reduce((acc, n) => acc + (n.favorites?.length || 0), 0) || 0;
  const publicCount = () => data()?.notes?.filter(n => n.isPublic).length || 0;

  return (
    <div class="page-container" style="max-width:860px;">
      {/* Header */}
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.75rem;font-weight:800;margin:0 0 0.25rem;color:var(--text);">Moje bilješke</h1>
          <p style="color:var(--text2);font-size:0.9rem;margin:0;">Upravljajte i pregledajte vaše bilješke</p>
        </div>
        <a href="/notes/create" class="btn-primary">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova bilješka
        </a>
      </div>

      {/* Stats row */}
      <Show when={!data.loading && data()?.notes?.length > 0}>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.875rem;margin-bottom:2rem;">
          {[
            [data()?.notes?.length || 0, "Ukupno bilješki", "#7C6FF7"],
            [publicCount(), "Javnih", "#34D399"],
            [totalFaves(), "Ukupno ♥", "#F87171"],
          ].map(([val, label, color]) => (
            <div class="card-sb" style="padding:1.125rem 1.375rem;text-align:center;">
              <div style={`font-family:var(--font-display);font-size:1.875rem;font-weight:800;color:${color};margin-bottom:0.125rem;`}>{val}</div>
              <div style="font-size:0.75rem;color:var(--text3);font-weight:500;">{label}</div>
            </div>
          ))}
        </div>
      </Show>

      <Show when={data.loading}>
        <div style="display:flex;justify-content:center;padding:4rem;">
          <div class="spinner" style="width:2.5rem;height:2.5rem;" />
        </div>
      </Show>

      <Show when={!data.loading && data()?.notes?.length === 0}>
        <div class="card-sb" style="padding:4rem;text-align:center;">
          <div style="width:64px;height:64px;background:var(--violet-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
            <svg width="28" height="28" fill="none" stroke="var(--violet-bright)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <p style="font-size:1.0625rem;font-weight:600;color:var(--text);margin:0 0 0.375rem;">Još nemate bilješki</p>
          <p style="font-size:0.875rem;color:var(--text2);margin:0 0 1.75rem;">Stvorite svoju prvu bilješku i podijelite znanje!</p>
          <a href="/notes/create" class="btn-primary">Stvori prvu bilješku</a>
        </div>
      </Show>

      <Show when={!data.loading && data()?.notes?.length > 0}>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <For each={data().notes}>
            {(note) => {
              const accent = SUBJECT_COLOR[note.subject] || "#9CA3AF";
              return (
                <div class="card-sb" style={`overflow:visible;border-left:3px solid ${accent}30;transition:all 0.18s ease;`}
                  onMouseOver={e => e.currentTarget.style.borderLeftColor = accent}
                  onMouseOut={e => e.currentTarget.style.borderLeftColor = accent + "30"}
                >
                  <div style="padding:1.125rem 1.375rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="flex:1;min-width:0;">
                      <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap;align-items:center;">
                        <span class="badge-sb badge-subject">{note.subject}</span>
                        <span class={`badge-sb ${note.isPublic ? "badge-public" : "badge-private"}`}>
                          {note.isPublic ? "Javna" : "Privatna"}
                        </span>
                      </div>
                      <a href={`/notes/${note.id}`} style="text-decoration:none;">
                        <h3 style="font-family:var(--font-display);font-size:1.0625rem;font-weight:700;color:var(--text);margin:0 0 0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 0.15s;"
                          onMouseOver={e => e.currentTarget.style.color = "var(--violet-bright)"}
                          onMouseOut={e => e.currentTarget.style.color = "var(--text)"}
                        >
                          {note.title}
                        </h3>
                      </a>
                      <p style="font-size:0.8rem;color:var(--text3);margin:0;display:flex;gap:0.75rem;align-items:center;">
                        <span>{fmtDate(note.createdAt)}</span>
                        <Show when={note.favorites?.length > 0}>
                          <span style="color:var(--error);display:flex;align-items:center;gap:3px;">
                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            {note.favorites.length}
                          </span>
                        </Show>
                      </p>
                      <Show when={note.tags?.length > 0}>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:0.5rem;">
                          <For each={note.tags.slice(0, 4)}>
                            {tag => <span style="font-size:0.7rem;background:var(--violet-dim);color:var(--violet-bright);padding:2px 8px;border-radius:100px;border:1px solid rgba(124,111,247,0.2);">#{tag}</span>}
                          </For>
                        </div>
                      </Show>
                    </div>
                    <div style="display:flex;gap:0.5rem;flex-shrink:0;">
                      <a href={`/notes/${note.id}`} class="btn-outline" style="padding:0.4rem 0.875rem;font-size:0.8rem;">Otvori</a>
                      <button
                        class="btn-danger"
                        style="font-size:0.8125rem;padding:0.4rem 0.875rem;"
                        onClick={() => handleDelete(note.id)}
                        disabled={deleting() === note.id}
                      >
                        <Show when={deleting() === note.id} fallback="Izbriši">
                          <div class="spinner" style="width:13px;height:13px;border-width:2px;" />
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
    </div>
  );
}
