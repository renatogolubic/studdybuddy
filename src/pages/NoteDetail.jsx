import { createResource, createSignal, Show, For } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { getNoteById, toggleNoteFavorite, deleteNote, addComment, getComments, deleteComment, rateNote, getUserRating } from "../services/db.js";
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
  
  const [comments, setComments] = createSignal([]);
  const [userRating, setUserRating] = createSignal(0);
  const [commentText, setCommentText] = createSignal("");
  const [commentLoading, setCommentLoading] = createSignal(false);

  const [note, { mutate, refetch }] = createResource(() => params.id, async (id) => {
    const data = await getNoteById(id);
    if (data && isAuthenticated()) {
      const u = authService.getCurrentUser();
      setIsFav(data.favorites?.includes(u.uid) || false);
      const r = await getUserRating(id, u.uid);
      setUserRating(r);
      const c = await getComments(id);
      setComments(c);
    } else if (data) {
      const c = await getComments(id);
      setComments(c);
    }
    return data;
  });

  const handleRate = async (val) => {
    if (!isAuthenticated()) { addToast("Prijavite se za ocjenjivanje", "info"); return; }
    try {
      await rateNote(params.id, authService.getCurrentUser().uid, val);
      setUserRating(val);
      refetch();
      addToast("Ocjena spremljena", "success");
    } catch { addToast("Greška pri ocjenjivanju", "error"); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText().trim()) return;
    setCommentLoading(true);
    const u = authService.getCurrentUser();
    try {
      const newId = await addComment(params.id, u.uid, u.displayName, commentText().trim());
      setComments([{ id: newId, userId: u.uid, userName: u.displayName, text: commentText().trim(), createdAt: new Date() }, ...comments()]);
      setCommentText("");
      addToast("Komentar dodan", "success");
    } catch { addToast("Greška", "error"); }
    finally { setCommentLoading(false); }
  };

  const delComment = async (cid) => {
    if (!confirm("Obrisati komentar?")) return;
    try {
        await deleteComment(params.id, cid);
        setComments(comments().filter(c => c.id !== cid));
        addToast("Obrisano", "success");
    } catch { addToast("Greška", "error"); }
  };

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
              <p style="font-size:0.8125rem;color:var(--text3);margin:0;display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                <span style="display:flex;align-items:center;gap:0.375rem;">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  <strong style="color:var(--text2);">{note().authorName}</strong>
                </span>
                <span>·</span>
                <span>{fmtDate(note().createdAt)}</span>
                <Show when={note().ratingCount > 0}>
                  <span>·</span>
                  <span style="display:flex;align-items:center;gap:0.25rem;color:var(--warning);">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <strong style="color:var(--text);">{Number(note().ratingSum / note().ratingCount).toFixed(1)}</strong>
                    <span style="color:var(--text3);">({note().ratingCount})</span>
                  </span>
                </Show>
              </p>
            </div>

            {/* Action buttons */}
            <div style="padding:0.875rem 1.5rem;display:flex;gap:0.625rem;flex-wrap:wrap;align-items:center;border-top:1px solid var(--border);justify-content:space-between;">
              <div style="display:flex;gap:0.625rem;flex-wrap:wrap;align-items:center;">
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
                
                <a href={`/notes/${note().id}/flashcards`} class="btn-primary" style="padding:0.5rem 1.125rem;gap:0.5rem;">
                  <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  Flashcards
                </a>
              </div>
              
              <div style="display:flex;gap:0.625rem;flex-wrap:wrap;align-items:center;">
                {/* Stars container */}
                <div style="display:flex;gap:2px;align-items:center;background:rgba(255,255,255,0.03);padding:0.35rem 0.75rem;border-radius:100px;border:1px solid var(--border2);margin-right:0.5rem;">
                   <span style="font-size:0.75rem;color:var(--text3);margin-right:0.3rem;">Ocjena:</span>
                   <For each={[1,2,3,4,5]}>
                     {star => (
                       <button onClick={() => handleRate(star)} style="background:none;border:none;padding:0;cursor:pointer;transition:transform 0.1s;" onMouseOver={(e) => e.currentTarget.style.transform="scale(1.2)"} onMouseOut={(e) => e.currentTarget.style.transform="none"}>
                         <svg width="18" height="18" fill={star <= userRating() ? "var(--warning)" : "none"} stroke={star <= userRating() ? "var(--warning)" : "var(--text3)"} stroke-width="1.5" viewBox="0 0 24 24">
                           <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                         </svg>
                       </button>
                     )}
                   </For>
                </div>

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
          
          {/* Comments section */}
          <div class="card-sb" style="padding:2rem;margin-top:1.25rem;">
            <h3 style="font-size:1.125rem;font-weight:700;margin:0 0 1.25rem;color:var(--text);display:flex;align-items:center;gap:0.5rem;">
               <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
               Komentari ({comments().length})
            </h3>
            
            <Show when={isAuthenticated()} fallback={
              <div class="alert-sb alert-info" style="margin-bottom:1.5rem;">Prijavite se kako biste ostavili komentar.</div>
            }>
              <form onSubmit={handleComment} style="margin-bottom:2rem;display:flex;flex-direction:column;gap:0.75rem;">
                <textarea class="form-input form-textarea" style="min-height:80px;" placeholder="Dodajte komentar..." value={commentText()} onInput={e => setCommentText(e.target.value)} required />
                <button type="submit" class="btn-primary" style="align-self:flex-end;" disabled={commentLoading()}>
                   <Show when={commentLoading()}>
                      <div class="spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#fff;border-color:rgba(255,255,255,0.2);margin-right:8px;" />
                   </Show>
                   Komentiraj
                </button>
              </form>
            </Show>
            
            <div style="display:flex;flex-direction:column;gap:1.25rem;">
              <For each={comments()}>
                {(c) => (
                   <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:var(--radius-md);padding:1rem;">
                      <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                         <div style="display:flex;align-items:center;gap:0.5rem;">
                            <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--violet),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;">
                               {c.userName?.slice(0,2).toUpperCase() || "?"}
                            </div>
                            <span style="font-weight:600;font-size:0.875rem;color:var(--text);">{c.userName}</span>
                            <span style="color:var(--text3);font-size:0.75rem;">· {fmtDate(c.createdAt)}</span>
                         </div>
                         <Show when={isAuthenticated() && (c.userId === authService.getCurrentUser()?.uid || isAdmin())}>
                            <button onClick={() => delComment(c.id)} style="background:none;border:none;color:var(--error);cursor:pointer;opacity:0.6;transition:opacity 0.15s;" onMouseOver={(e)=>e.currentTarget.style.opacity=1} onMouseOut={(e)=>e.currentTarget.style.opacity=0.6}>
                               <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            </button>
                         </Show>
                      </div>
                      <p style="margin:0;font-size:0.875rem;color:var(--text2);line-height:1.6;">{c.text}</p>
                   </div>
                )}
              </For>
            </div>
          </div>
        </article>
      </Show>
    </div>
  );
}