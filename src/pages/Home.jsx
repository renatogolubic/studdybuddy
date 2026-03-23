import { createSignal, createMemo, Show, For, createEffect, onMount } from "solid-js";
import { isAuthenticated, authService } from "../services/auth.js";
import { getPublicNotes, toggleNoteFavorite } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

const SUBJECTS = ["Sve","Matematika","Fizika","Kemija","Biologija","Hrvatski","Engleski","Povijest","Geografija","Informatika","Ostalo"];

// Typewriter hook
function useTypewriter(text, speed = 60, delay = 300) {
  const [displayed, setDisplayed] = createSignal("");
  const [done, setDone] = createSignal(false);

  onMount(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
    }, delay);
    return () => clearTimeout(timeout);
  });

  return { displayed, done };
}

export default function Home() {
  const [notes, setNotes] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [favorites, setFavorites] = createSignal([]);
  const [sortBy, setSortBy] = createSignal("createdAt-desc");
  const [activeSubject, setActiveSubject] = createSignal("Sve");
  const [lastDoc, setLastDoc] = createSignal(null);
  const [hasMore, setHasMore] = createSignal(false);

  // Typewriter za hero naslov — dva reda odvojeno
  const line1 = useTypewriter("Dijeli znanje,", 55, 400);
  const line2 = useTypewriter("uči zajedno.", 65, 400 + "Dijeli znanje,".length * 55 + 200);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const [field, dir] = sortBy().split("-");
      const { notes: fetched, lastDoc: last } = await getPublicNotes(field, dir, 12);
      setNotes(fetched); setLastDoc(last); setHasMore(fetched.length === 12);
      if (isAuthenticated()) {
        const uid = authService.getCurrentUser().uid;
        setFavorites(fetched.filter(n => n.favorites?.includes(uid)).map(n => n.id));
      }
    } catch { addToast("Greška učitavanja", "error"); }
    finally { setLoading(false); }
  };

  const loadMore = async () => {
    if (!lastDoc()) return;
    setLoading(true);
    try {
      const [field, dir] = sortBy().split("-");
      const { notes: more, lastDoc: last } = await getPublicNotes(field, dir, 12, lastDoc());
      setNotes(prev => [...prev, ...more]); setLastDoc(last); setHasMore(more.length === 12);
    } catch { addToast("Greška", "error"); }
    finally { setLoading(false); }
  };

  createEffect(() => { sortBy(); loadNotes(); });

  const handleFavorite = async (e, noteId) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated()) { addToast("Prijavite se za favourite", "info"); return; }
    const uid = authService.getCurrentUser().uid;
    const isFav = favorites().includes(noteId);
    try {
      const updated = await toggleNoteFavorite(noteId, uid, isFav);
      setFavorites(isFav ? favorites().filter(id => id !== noteId) : [...favorites(), noteId]);
      setNotes(notes().map(n => n.id === noteId ? { ...n, favorites: updated } : n));
    } catch { addToast("Greška", "error"); }
  };

  const filtered = createMemo(() => {
    const s = activeSubject();
    return s === "Sve" ? notes() : notes().filter(n => n.subject === s);
  });

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true, locale: hr });
  };

  return (
    <>
      <Show when={!isAuthenticated()}>
        <div style="background:var(--bg2); border-bottom:1px solid var(--border); padding:4rem 1.5rem; text-align:center;">
          <div style="max-width:600px; margin:0 auto;">

            {/* Cursive typewriter naslov */}
            <h1 style="margin:0 0 1rem; line-height:1.3;">
              <span style="display:block; font-family:'Dancing Script',cursive; font-size:clamp(2.25rem,6vw,3.75rem); font-weight:700; color:var(--text); letter-spacing:0.01em;">
                {line1.displayed()}
                <Show when={!line1.done()}>
                  <span class="hero-cursor">|</span>
                </Show>
              </span>
              <span style="display:block; font-family:'Dancing Script',cursive; font-size:clamp(2.25rem,6vw,3.75rem); font-weight:700; color:var(--teal); letter-spacing:0.01em; min-height:1.3em; position:relative; display:inline-block;">
                {line2.displayed()}
                <Show when={line2.done()}>
                  <svg class="hero-underline" viewBox="0 0 220 12" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2,8 C40,2 80,11 120,6 C160,1 195,9 218,7" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1">
                      <animate attributeName="stroke-dashoffset" from="1" to="0" dur="0.6s" begin="0s" fill="freeze" />
                    </path>
                  </svg>
                </Show>
              </span>
            </h1>

            <p style="font-size:1.0625rem; color:var(--text2); max-width:440px; margin:0 auto 2rem; line-height:1.7; opacity:0; animation: fadeUp 0.6s ease forwards; animation-delay:3.2s;">
              Besplatna platforma za dijeljenje bilješki, pronalaženje materijala i grupno učenje.
            </p>
            <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap; opacity:0; animation: fadeUp 0.6s ease forwards; animation-delay:3.5s;">
              <a href="/user/signup" class="btn-primary" style="padding:0.75rem 2rem; font-size:0.9375rem;">Počni</a>
              <a href="/notes/search" class="btn-outline" style="padding:0.75rem 2rem; font-size:0.9375rem;">Pregledaj bilješke</a>
            </div>
          </div>
        </div>
      </Show>

      <div class="page-container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem;">
          <h2 style="font-family:var(--font-display); font-size:1.5rem; font-weight:600; margin:0; color:var(--text);">
            {isAuthenticated() ? "Najnovije bilješke" : "Javne bilješke"}
          </h2>
          <div style="display:flex; gap:0.625rem; align-items:center;">
            <select class="form-input form-select" style="width:auto; font-size:0.8125rem; padding:0.4rem 2.25rem 0.4rem 0.75rem; background:var(--surface);" value={sortBy()} onChange={e => setSortBy(e.target.value)}>
              <option value="createdAt-desc">Najnovije</option>
              <option value="createdAt-asc">Najstarije</option>
            </select>
            <Show when={isAuthenticated()}>
              <a href="/notes/create" class="btn-primary">+ Nova</a>
            </Show>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.5rem;">
          <For each={SUBJECTS}>
            {subj => (
              <button class={`pill-filter${activeSubject() === subj ? " active" : ""}`} onClick={() => setActiveSubject(subj)}>
                {subj}
              </button>
            )}
          </For>
        </div>

        <Show when={loading() && notes().length === 0}>
          <div style="display:flex;justify-content:center;padding:5rem 0;"><div class="spinner"></div></div>
        </Show>

        <Show when={!loading() && filtered().length === 0}>
          <div style="text-align:center; padding:5rem 0; color:var(--text3);">
            <p style="font-size:1rem; margin-bottom:1rem;">Nema bilješki za prikaz</p>
            <Show when={isAuthenticated()}>
              <a href="/notes/create" class="btn-primary">Dodaj prvu bilješku</a>
            </Show>
          </div>
        </Show>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(290px,1fr)); gap:1rem;">
          <For each={filtered()}>
            {(note) => (
              <a href={`/notes/${note.id}`} style="text-decoration:none; display:block;">
                <div class="card-sb" style="height:100%; cursor:pointer;">
                  <div style="padding:1.25rem; display:flex; flex-direction:column; height:100%;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                      <span class="badge-sb badge-subject">{note.subject}</span>
                      <button
                        onClick={(e) => handleFavorite(e, note.id)}
                        style="background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:4px; padding:2px 4px; border-radius:6px; transition:background 0.15s ease;"
                        onMouseOver={e => e.currentTarget.style.background="var(--surface2)"}
                        onMouseOut={e => e.currentTarget.style.background="none"}
                      >
                        <svg width="15" height="15" fill={favorites().includes(note.id) ? "var(--teal)" : "none"} stroke={favorites().includes(note.id) ? "var(--teal)" : "var(--text3)"} stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        <span style={`font-size:12px; color:${favorites().includes(note.id) ? "var(--teal)" : "var(--text3)"};`}>{note.favorites?.length || 0}</span>
                      </button>
                    </div>
                    <h3 style="font-family:var(--font-display); font-size:1.0625rem; font-weight:600; color:var(--text); margin:0 0 0.5rem; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                      {note.title}
                    </h3>
                    <p style="font-size:0.8125rem; color:var(--text2); margin:0 0 auto; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; line-height:1.6; padding-bottom:0.75rem;">
                      {note.content}
                    </p>
                    <Show when={note.tags?.length > 0}>
                      <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:0.75rem;">
                        <For each={note.tags.slice(0, 3)}>
                          {tag => <span style="font-size:0.7rem; background:var(--surface2); color:var(--text2); padding:2px 8px; border-radius:100px; border:1px solid var(--border);">{tag}</span>}
                        </For>
                      </div>
                    </Show>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text3); border-top:1px solid var(--border); padding-top:0.625rem; margin-top:0.25rem;">
                      <span>{note.authorName}</span>
                      <span>{fmtDate(note.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </a>
            )}
          </For>
        </div>

        <Show when={hasMore() && !loading()}>
          <div style="display:flex;justify-content:center;margin-top:2rem;">
            <button class="btn-outline" onClick={loadMore}>Učitaj više</button>
          </div>
        </Show>
        <Show when={loading() && notes().length > 0}>
          <div style="display:flex;justify-content:center;margin-top:1.5rem;"><div class="spinner"></div></div>
        </Show>
      </div>
    </>
  );
}