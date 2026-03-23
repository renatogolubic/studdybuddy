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
    <div class="page-container" style="max-width:820px;">
      <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:700;margin:0 0 1.75rem;color:var(--text);">Pretraga bilješki</h1>
      <form onSubmit={handleSearch} class="card-sb" style="padding:1.25rem;margin-bottom:1.5rem;">
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          <select class="form-input form-select" style="flex:1;min-width:150px;background:var(--bg2);" value={subject()} onChange={e => setSubject(e.target.value)}>
            <option value="">Svi predmeti</option>
            <For each={SUBJECTS}>{s => <option value={s}>{s}</option>}</For>
          </select>
          <input type="text" class="form-input" style="flex:2;min-width:180px;" placeholder="Naslov, sadržaj ili tag..." value={keyword()} onInput={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
          <button type="submit" class="btn-primary" disabled={loading()} style="flex-shrink:0;">
            <Show when={loading()}><div class="spinner" style="width:14px;height:14px;border-width:2px;border-color:rgba(0,0,0,0.2);border-top-color:#0D1F1A;"></div></Show>
            Pretraži
          </button>
        </div>
      </form>

      <Show when={loading()}><div style="display:flex;justify-content:center;padding:3rem;"><div class="spinner"></div></div></Show>

      <Show when={searched() && !loading() && results().length === 0}>
        <div style="text-align:center;padding:3rem;color:var(--text3);">Nema rezultata za zadanu pretragu</div>
      </Show>

      <Show when={results().length > 0 && !loading()}>
        <p style="font-size:0.8125rem;color:var(--text3);margin:0 0 0.875rem;">Pronađeno: {results().length} {results().length === 1 ? "bilješka" : "bilješki"}</p>
        <div style="display:flex;flex-direction:column;gap:0.625rem;">
          <For each={results()}>
            {(note) => (
              <a href={`/notes/${note.id}`} style="text-decoration:none;display:block;">
                <div class="card-sb" style="padding:1.125rem 1.25rem;cursor:pointer;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
                    <div style="flex:1;min-width:0;">
                      <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;"><span class="badge-sb badge-subject">{note.subject}</span></div>
                      <h3 style="font-family:var(--font-display);font-size:1.0625rem;font-weight:600;margin:0 0 0.375rem;color:var(--text);">{note.title}</h3>
                      <p style="font-size:0.8125rem;color:var(--text2);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">{note.content}</p>
                      <Show when={note.tags?.length > 0}>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:0.5rem;">
                          <For each={note.tags.slice(0, 4)}>
                            {tag => <span style="font-size:0.7rem;background:var(--surface2);color:var(--text2);padding:2px 7px;border-radius:100px;border:1px solid var(--border);">{tag}</span>}
                          </For>
                        </div>
                      </Show>
                    </div>
                    <p style="font-size:0.8rem;color:var(--text3);flex-shrink:0;">{note.authorName}</p>
                  </div>
                </div>
              </a>
            )}
          </For>
        </div>
      </Show>

      <Show when={!searched() && !loading()}>
        <div style="text-align:center;padding:5rem 0;color:var(--text3);">
          <p style="font-size:1rem;margin-bottom:0.5rem;">Pretražite bilješke</p>
          <p style="font-size:0.875rem;">Odaberite predmet ili unesite ključnu riječ</p>
        </div>
      </Show>
    </div>
  );
}
