import { createSignal, Show, For } from "solid-js";
import { searchPublicNotes } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";

const SUBJECTS = ["Matematika","Fizika","Kemija","Biologija","Hrvatski","Engleski","Povijest","Geografija","Informatika","Ostalo"];

export default function SearchNotes() {
  const [results, setResults] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [searched, setSearched] = createSignal(false);
  const [keyword, setKeyword] = createSignal("");
  const [subject, setSubject] = createSignal("");

  const handleSearch = async (e) => {
    e?.preventDefault(); setLoading(true); setSearched(false);
    try { const found = await searchPublicNotes(subject(), keyword()); setResults(found); setSearched(true); }
    catch { addToast("Greška pretrage", "error"); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Search hero */}
      <div style="background:linear-gradient(180deg,rgba(124,111,247,0.06) 0%,transparent 100%);border-bottom:1px solid var(--border);padding:3rem 1.5rem 2.5rem;position:relative;overflow:hidden;">
        <div style="position:absolute;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(124,111,247,0.12),transparent 70%);top:-100px;right:10%;pointer-events:none;filter:blur(60px);" />
        <div style="max-width:680px;margin:0 auto;position:relative;z-index:1;">
          <div style="display:flex;align-items:center;gap:0.625rem;margin-bottom:1.25rem;">
            <span class="glow-dot" />
            <span style="font-size:0.8125rem;font-weight:500;color:var(--violet-bright);">Pretraga bilješki</span>
          </div>
          <h1 style="font-family:var(--font-display);font-size:clamp(1.75rem,4vw,2.5rem);font-weight:800;margin:0 0 0.5rem;color:var(--text);">
            Pronađi što trebaš
          </h1>
          <p style="color:var(--text2);font-size:0.9375rem;margin:0 0 2rem;">Pretražujte tisuće javnih bilješki po predmetu i ključnoj riječi.</p>

          <form onSubmit={handleSearch}>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
              <select
                class="form-input form-select"
                style="flex:0 0 auto;width:auto;min-width:160px;"
                value={subject()}
                onChange={e => setSubject(e.target.value)}
              >
                <option value="">Svi predmeti</option>
                <For each={SUBJECTS}>{s => <option value={s}>{s}</option>}</For>
              </select>
              <div style="flex:1;min-width:200px;position:relative;">
                <div style="position:absolute;left:0.875rem;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none;">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
                <input
                  type="text"
                  class="form-input"
                  style="padding-left:2.75rem;"
                  placeholder="Naslov, sadržaj ili tag..."
                  value={keyword()}
                  onInput={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button type="submit" class="btn-primary" disabled={loading()} style="flex-shrink:0;padding:0.75rem 1.5rem;">
                <Show when={loading()}>
                  <div class="spinner" style="width:14px;height:14px;border-width:2px;border-color:rgba(255,255,255,0.2);border-top-color:#fff;" />
                </Show>
                Pretraži
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div class="page-container" style="max-width:820px;">
        <Show when={loading()}>
          <div style="display:flex;justify-content:center;padding:4rem;">
            <div class="spinner" style="width:2.5rem;height:2.5rem;" />
          </div>
        </Show>

        <Show when={searched() && !loading() && results().length === 0}>
          <div style="text-align:center;padding:4rem 0;">
            <div style="width:56px;height:56px;background:var(--surface2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
              <svg width="24" height="24" fill="none" stroke="var(--text3)" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <p style="font-size:1rem;font-weight:600;color:var(--text2);margin:0 0 0.375rem;">Nema rezultata</p>
            <p style="font-size:0.875rem;color:var(--text3);margin:0;">Pokušajte s drugačijim pojmovima</p>
          </div>
        </Show>

        <Show when={results().length > 0 && !loading()}>
          <p style="font-size:0.8125rem;color:var(--text3);margin:0 0 1rem;padding-top:0.5rem;">
            Pronađeno: <strong style="color:var(--text2);">{results().length}</strong> {results().length === 1 ? "bilješka" : "bilješki"}
          </p>
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <For each={results()}>
              {(note) => (
                <a href={`/notes/${note.id}`} style="text-decoration:none;display:block;">
                  <div class="card-sb" style="padding:1.25rem 1.5rem;cursor:pointer;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
                      <div style="flex:1;min-width:0;">
                        <div style="display:flex;gap:0.5rem;margin-bottom:0.625rem;">
                          <span class="badge-sb badge-subject">{note.subject}</span>
                        </div>
                        <h3 style="font-family:var(--font-display);font-size:1.0625rem;font-weight:700;margin:0 0 0.375rem;color:var(--text);">{note.title}</h3>
                        <p style="font-size:0.8125rem;color:var(--text2);margin:0 0 0.625rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6;">{note.content}</p>
                        <Show when={note.tags?.length > 0}>
                          <div style="display:flex;gap:4px;flex-wrap:wrap;">
                            <For each={note.tags.slice(0, 4)}>
                              {tag => <span style="font-size:0.7rem;background:var(--violet-dim);color:var(--violet-bright);padding:2px 8px;border-radius:100px;">#{tag}</span>}
                            </For>
                          </div>
                        </Show>
                      </div>
                      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.25rem;flex-shrink:0;">
                        <p style="font-size:0.8rem;color:var(--text3);margin:0;white-space:nowrap;">{note.authorName}</p>
                        <svg width="16" height="16" fill="none" stroke="var(--text3)" stroke-width="1.75" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                </a>
              )}
            </For>
          </div>
        </Show>

        <Show when={!searched() && !loading()}>
          <div style="text-align:center;padding:5rem 0;color:var(--text3);">
            <svg width="48" height="48" fill="none" stroke="var(--text3)" stroke-width="1" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:1rem;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p style="font-size:1rem;font-weight:500;color:var(--text2);margin:0 0 0.375rem;">Pretražite bilješke</p>
            <p style="font-size:0.875rem;margin:0;">Odaberite predmet ili unesite ključnu riječ</p>
          </div>
        </Show>
      </div>
    </>
  );
}
