import { createSignal, createMemo, Show, For, createEffect, onMount, onCleanup } from "solid-js";
import { isAuthenticated, authService } from "../services/auth.js";
import { getPublicNotes, toggleNoteFavorite } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";

const SUBJECTS = ["Sve", "Matematika", "Fizika", "Kemija", "Biologija", "Hrvatski", "Engleski", "Povijest", "Geografija", "Informatika", "Ostalo"];

const SUBJECT_CLASS = {
  "Matematika": "subject-mat", "Fizika": "subject-fiz", "Kemija": "subject-kem",
  "Biologija": "subject-bio", "Hrvatski": "subject-hrv", "Engleski": "subject-eng",
  "Povijest": "subject-pov", "Geografija": "subject-geo", "Informatika": "subject-inf",
  "Ostalo": "subject-ost",
};

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

// HLS video background component
function HeroVideo({ src }) {
  let videoRef;
  let hlsInstance;
  const [videoReady, setVideoReady] = createSignal(false);

  onMount(() => {
    const HLS_CDN = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";

    function attachHls() {
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          autoStartLoad: true,
          startLevel: -1,           // let HLS pick the first level based on bandwidth
          capLevelToPlayerSize: true, // never stream higher res than the element can show
          maxLoadingDelay: 4,
          abrBandWidthFactor: 0.9,
          abrBandWidthUpFactor: 0.5, // conservative upswitch – reduces level thrashing
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(videoRef);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, (_, data) => {
          // Lock to a stable mid-quality level after manifest loads.
          // This completely disables ABR switching once playback starts.
          // Level 2 is typically 720p on Mux streams; clamp to max available.
          const targetLevel = Math.min(2, data.levels.length - 1);
          hlsInstance.currentLevel = targetLevel;
          hlsInstance.autoLevelEnabled = false;
          videoRef.play().catch(() => { });
        });
      } else if (videoRef.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        videoRef.src = src;
        videoRef.play().catch(() => { });
      }
    }

    // Mark ready once actual playback begins
    videoRef.addEventListener("playing", () => setVideoReady(true));

    if (window.Hls) {
      attachHls();
    } else {
      const script = document.createElement("script");
      script.src = HLS_CDN;
      script.onload = attachHls;
      document.head.appendChild(script);
    }
  });

  onCleanup(() => {
    if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
  });

  return (
    <>
      {/* ── Premium animated placeholder – visible while HLS loads, fades out when video plays ── */}
      <div style={`position:absolute;inset:0;z-index:0;pointer-events:none;transition:opacity 1.6s ease;opacity:${videoReady() ? 0 : 1};`}>
        {/* Large pulsing orbs */}
        <div style="position:absolute;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle,rgba(124,111,247,0.24),transparent 68%);top:-220px;left:-200px;filter:blur(70px);animation:blobFloat 7s ease-in-out infinite;" />
        <div style="position:absolute;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,0.16),transparent 68%);bottom:-160px;right:-120px;filter:blur(70px);animation:blobFloat 9s ease-in-out infinite reverse;" />
        <div style="position:absolute;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.14),transparent 68%);top:42%;right:18%;filter:blur(60px);animation:blobFloat 11s ease-in-out infinite;" />
        {/* Shimmer sweep across the hero */}
        <div class="hero-shimmer-sweep" />
      </div>

      {/* The actual video — starts invisible, fades in on play */}
      <video
        ref={videoRef}
        autoplay
        muted
        loop
        playsinline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          "object-fit": "cover",
          "z-index": 0,
          opacity: videoReady() ? 0.45 : 0,
          transition: "opacity 1.6s ease",
          "pointer-events": "none",
        }}
      />
    </>
  );
}

export default function Home() {
  const [notes, setNotes] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [favorites, setFavorites] = createSignal([]);
  const [sortBy, setSortBy] = createSignal("createdAt-desc");
  const [activeSubject, setActiveSubject] = createSignal("Sve");
  const [lastDoc, setLastDoc] = createSignal(null);
  const [hasMore, setHasMore] = createSignal(false);

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
      {/* ── HERO (unauthenticated) ── */}
      <Show when={!isAuthenticated()}>
        <div style="position:relative; overflow:hidden; padding: 6rem 1.5rem 5rem; text-align:center; border-bottom: 1px solid var(--border);">
          {/* ── HLS Video Background ── */}
          <HeroVideo src="https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8" />

          {/* Ambient blobs */}
          <div class="hero-blob" style="width:500px;height:500px;background:radial-gradient(circle,rgba(124,111,247,0.18),transparent 70%);top:-120px;left:-100px;animation-delay:0s;" />
          <div class="hero-blob" style="width:400px;height:400px;background:radial-gradient(circle,rgba(34,211,238,0.12),transparent 70%);bottom:-80px;right:-80px;animation-delay:-3s;" />
          <div class="hero-blob" style="width:300px;height:300px;background:radial-gradient(circle,rgba(124,111,247,0.1),transparent 70%);top:50%;left:60%;transform:translate(-50%,-50%);animation-delay:-6s;" />

          <div style="position:relative;z-index:1;max-width:620px;margin:0 auto;">
            {/* Badge */}
            <div style="display:inline-flex;align-items:center;gap:0.5rem;background:rgba(124,111,247,0.12);border:1px solid rgba(124,111,247,0.25);border-radius:100px;padding:0.3rem 1rem 0.3rem 0.5rem;margin-bottom:2rem;opacity:0;animation:fadeUp 0.5s ease 0.2s forwards;">
              <span style="width:6px;height:6px;border-radius:50%;background:var(--violet);box-shadow:0 0 8px var(--violet);display:inline-block;" />
              <span style="font-size:0.8125rem;font-weight:500;color:var(--violet-bright);">Platforma za dijeljenje znanja</span>
            </div>

            {/* Typewriter title */}
            <h1 style="margin:0 0 1.25rem;line-height:1.15;">
              <span style="display:block;font-family:var(--font-display);font-size:clamp(2.5rem,7vw,4.25rem);font-weight:800;color:var(--text);letter-spacing:-0.03em;">
                {line1.displayed()}
                <Show when={!line1.done()}>
                  <span class="hero-cursor">|</span>
                </Show>
              </span>
              <span style="display:inline-block;position:relative;font-family:var(--font-display);font-size:clamp(2.5rem,7vw,4.25rem);font-weight:800;background:linear-gradient(135deg,var(--violet-bright),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.03em;min-height:1.2em;">
                {line2.displayed()}
                <Show when={!line2.done() && line1.done()}>
                  <span class="hero-cursor" style="-webkit-text-fill-color:var(--cyan);">|</span>
                </Show>
                <Show when={line2.done()}>
                  <svg class="hero-underline" viewBox="0 0 260 14" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2,10 C50,3 100,13 150,7 C200,1 235,11 258,8" fill="none" stroke="url(#ugr)" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1">
                      <animate attributeName="stroke-dashoffset" from="1" to="0" dur="0.7s" begin="0s" fill="freeze" />
                    </path>
                    <defs>
                      <linearGradient id="ugr" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="var(--violet-bright)" />
                        <stop offset="100%" stop-color="var(--cyan)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </Show>
              </span>
            </h1>

            <p style="font-size:1.0625rem;color:var(--text2);max-width:460px;margin:0 auto 2.5rem;line-height:1.75;opacity:0;animation:fadeUp 0.6s ease 3.2s forwards;">
              Besplatna platforma za dijeljenje bilješki, pronalaženje materijala i grupno učenje.
            </p>

            {/* CTA buttons */}
            <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;opacity:0;animation:fadeUp 0.6s ease 3.5s forwards;">
              <a href="/user/signup" class="btn-primary" style="padding:0.875rem 2.25rem;font-size:1rem;">
                Počni
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </a>
              <a href="/notes/search" class="btn-outline" style="padding:0.875rem 2.25rem;font-size:1rem;">Pregledaj bilješke</a>
            </div>


          </div>
        </div>
      </Show>

      {/* ── MAIN CONTENT ── */}
      <div class="page-container">
        {/* Section header */}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="glow-dot" />
            <h2 style="font-family:var(--font-display);font-size:1.375rem;font-weight:700;margin:0;color:var(--text);">
              {isAuthenticated() ? "Najnovije bilješke" : "Javne bilješke"}
            </h2>
          </div>
          <div style="display:flex;gap:0.75rem;align-items:center;">
            <select
              class="form-input form-select"
              style="width:auto;font-size:0.8125rem;padding:0.45rem 2.25rem 0.45rem 0.875rem;"
              value={sortBy()}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="createdAt-desc">Najnovije</option>
              <option value="createdAt-asc">Najstarije</option>
            </select>
            <Show when={isAuthenticated()}>
              <a href="/notes/create" class="btn-primary">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Nova
              </a>
            </Show>
          </div>
        </div>

        {/* Subject filter pills */}
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:2rem;padding-bottom:0.25rem;">
          <For each={SUBJECTS}>
            {subj => (
              <button
                class={`pill-filter${activeSubject() === subj ? " active" : ""}`}
                onClick={() => setActiveSubject(subj)}
              >
                {subj}
              </button>
            )}
          </For>
        </div>

        {/* Loading initial */}
        <Show when={loading() && notes().length === 0}>
          <div style="display:flex;justify-content:center;padding:6rem 0;">
            <div class="spinner" style="width:2.5rem;height:2.5rem;" />
          </div>
        </Show>

        {/* Empty state */}
        <Show when={!loading() && filtered().length === 0}>
          <div style="text-align:center;padding:5rem 0;">
            <div style="width:64px;height:64px;border-radius:50%;background:var(--violet-dim);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
              <svg width="28" height="28" fill="none" stroke="var(--violet-bright)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <p style="font-size:1.0625rem;color:var(--text2);margin:0 0 1.5rem;font-weight:500;">Nema bilješki za prikaz</p>
            <Show when={isAuthenticated()}>
              <a href="/notes/create" class="btn-primary">Dodaj prvu bilješku</a>
            </Show>
          </div>
        </Show>

        {/* Note grid */}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:1.25rem;">
          <For each={filtered()}>
            {(note) => {
              const subjectClass = SUBJECT_CLASS[note.subject] || "subject-ost";
              return (
                <a href={`/notes/${note.id}`} style="text-decoration:none;display:block;">
                  <div class="card-note" style="height:100%;cursor:pointer;display:flex;flex-direction:column;">
                    {/* Colored accent top bar */}
                    <div class={subjectClass} style="height:3px;width:100%;" />
                    <div style="padding:1.25rem;display:flex;flex-direction:column;flex:1;">
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem;">
                        <span class="badge-sb badge-subject">{note.subject}</span>
                        <div style="display:flex;gap:0.5rem;align-items:center;">
                          <Show when={note.ratingCount > 0}>
                            <div style="display:flex;align-items:center;gap:3px;color:var(--warning);">
                              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                              <span style="font-size:12px;font-weight:600;color:var(--text);">{Number(note.ratingSum / note.ratingCount).toFixed(1)}</span>
                            </div>
                          </Show>
                          <button
                            onClick={(e) => handleFavorite(e, note.id)}
                            style="background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:8px;transition:background 0.15s ease;"
                            onMouseOver={e => e.currentTarget.style.background = "var(--surface2)"}
                            onMouseOut={e => e.currentTarget.style.background = "none"}
                          >
                            <svg
                              width="15" height="15"
                              fill={favorites().includes(note.id) ? "var(--violet-bright)" : "none"}
                              stroke={favorites().includes(note.id) ? "var(--violet-bright)" : "var(--text3)"}
                              stroke-width="1.75" viewBox="0 0 24 24"
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span style={`font-size:12px;color:${favorites().includes(note.id) ? "var(--violet-bright)" : "var(--text3)"};font-weight:500;`}>
                              {note.favorites?.length || 0}
                            </span>
                          </button>
                        </div>
                      </div>
                      <h3 style="font-family:var(--font-display);font-size:1.0625rem;font-weight:700;color:var(--text);margin:0 0 0.5rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                        {note.title}
                      </h3>
                      <p style="font-size:0.8125rem;color:var(--text2);margin:0 0 auto;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.65;padding-bottom:0.875rem;">
                        {note.content}
                      </p>
                      <Show when={note.tags?.length > 0}>
                        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:0.75rem;">
                          <For each={note.tags.slice(0, 3)}>
                            {tag => (
                              <span style="font-size:0.7rem;background:var(--surface2);color:var(--text2);padding:2px 8px;border-radius:100px;border:1px solid var(--border2);">
                                {tag}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>
                      <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text3);border-top:1px solid var(--border);padding-top:0.75rem;margin-top:0.25rem;">
                        <span style="font-weight:500;">{note.authorName}</span>
                        <span>{fmtDate(note.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            }}
          </For>
        </div>

        {/* Load more */}
        <Show when={hasMore() && !loading()}>
          <div style="display:flex;justify-content:center;margin-top:2.5rem;">
            <button class="btn-outline" onClick={loadMore} style="padding:0.75rem 2rem;">
              Učitaj više bilješki
            </button>
          </div>
        </Show>
        <Show when={loading() && notes().length > 0}>
          <div style="display:flex;justify-content:center;margin-top:2rem;">
            <div class="spinner" />
          </div>
        </Show>
      </div>
    </>
  );
}