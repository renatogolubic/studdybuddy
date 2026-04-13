import { createResource, createSignal, Show, For } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { getNoteById, toggleNoteFavorite, deleteNote } from "../services/db.js";
import { isAuthenticated, authService, isAdmin } from "../services/auth.js";
import { addToast } from "../components/Toast.jsx";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

const SUBJECT_COLOR = {
  "Matematika":"#7C6FF7","Fizika":"#22D3EE","Kemija":"#34D399","Biologija":"#4ADE80",
  "Hrvatski":"#F87171","Engleski":"#60A5FA","Povijest":"#FBBF24","Geografija":"#2DD4BF",
  "Informatika":"#818CF8","Ostalo":"#9CA3AF",
};

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

  const canEdit = () => isAuthenticated() && (note()?.userId === authService.getCurrentUser().uid || isAdmin());
  const subjectColor = () => SUBJECT_COLOR[note()?.subject] || "#9CA3AF";

  return (
    <div class="page-md" style="padding-top:2rem;padding-bottom:3rem;">
      <a href="/" class="btn-ghost" style="padding:0.4rem 0.875rem;display:inline-flex;margin-bottom:1.75rem;">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Natrag
      </a>

      <Show when={note.loading}>
        <div style="display:flex;justify-content:center;padding:5rem;">
          <div class="spinner" style="width:2.5rem;height:2.5rem;" />
        </div>
      </Show>

      <Show when={!note.loading && !note()}>
        <div class="alert-sb alert-error">Bilješka ne postoji ili je privatna.</div>
      </Show>

      <Show when={!note.loading && note()}>
        <article>
          {/* Header card with subject gradient accent */}
          <div class="card-sb" style="margin-bottom:1.25rem;overflow:hidden;">
            {/* Colored gradient header band */}
            <div style={`background:linear-gradient(135deg,${subjectColor()}22,${subjectColor()}08);border-bottom:1px solid ${subjectColor()}22;padding:2rem;`}>
              <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap;align-items:center;">
                <span class="badge-sb badge-subject">{note().subject}</span>
                <Show when={!note().isPublic}>
                  <span class="badge-sb badge-private">Privatna</span>
                </Show>
                <Show when={isAdmin() && note()?.userId !== authService.getCurrentUser()?.uid}>
                  <span class="badge-sb" style="background:rgba(251,191,36,0.12);color:var(--warning);border:1px solid rgba(251,191,36,0.2);">Admin pregled</span>
                </Show>
              </div>
              <h1 style={`font-family:var(--font-display);font-size:clamp(1.5rem,4vw,2.125rem);font-weight:800;margin:0 0 0.625rem;line-height:1.2;color:var(--text);`}>
                {note().title}
              </h1>
              <p style="font-size:0.8125rem;color:var(--text3);margin:0;display:flex;align-items:center;gap:0.375rem;">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <strong style="color:var(--text2);">{note().authorName}</strong>
                <span style="color:var(--text3);">·</span>
                {fmtDate(note().createdAt)}
              </p>
            </div>

            {/* Action buttons */}
            <div style="padding:0.875rem 1.5rem;display:flex;gap:0.625rem;flex-wrap:wrap;border-top:1px solid var(--border);">
              <button
                onClick={handleFavorite}
                class="btn-outline"
                style={`padding:0.5rem 1.125rem;display:flex;align-items:center;gap:0.5rem;${isFav() ? "border-color:var(--violet);color:var(--violet-bright);background:var(--violet-dim);" : ""}`}
              >
                <svg width="15" height="15" fill={isFav() ? "currentColor" : "none"} stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {note().favorites?.length || 0}
              </button>

              <Show when={canEdit()}>
                <button
                  class="btn-danger"
                  style="border:1px solid rgba(248,113,113,0.25);padding:0.5rem 1.125rem;"
                  onClick={handleDelete}
                  disabled={deleting()}
                >
                  <Show when={deleting()} fallback={
                    <>
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      Izbriši
                    </>
                  }>
                    <div class="spinner" style="width:13px;height:13px;border-width:2px;border-top-color:var(--error);border-color:rgba(248,113,113,0.2);" />
                  </Show>
                </button>
              </Show>
            </div>
          </div>

          {/* Content card */}
          <div class="card-sb" style="padding:2rem;">
            <div style="line-height:1.9;color:var(--text);margin-bottom:1.5rem;font-size:1rem;">
              <pre style="white-space:pre-wrap;font-family:var(--font-body);font-size:1rem;line-height:1.9;margin:0;color:var(--text);">{note().content}</pre>
            </div>
            <Show when={note().tags?.length > 0}>
              <div class="divider-sb" />
              <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                <For each={note().tags}>
                  {tag => (
                    <span style="font-size:0.8125rem;background:var(--violet-dim);color:var(--violet-bright);padding:0.25rem 0.875rem;border-radius:100px;border:1px solid rgba(124,111,247,0.2);">
                      # {tag}
                    </span>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </article>
      </Show>
    </div>
  );
}