import { createSignal, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authService } from "../services/auth.js";
import { createNote, getUserProfile } from "../services/db.js";
import { addToast } from "../components/Toast.jsx";

const SUBJECTS = ["Matematika","Fizika","Kemija","Biologija","Hrvatski","Engleski","Povijest","Geografija","Informatika","Ostalo"];

export default function NoteCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(false);
  const [tagsInput, setTagsInput] = createSignal("");
  const [isPublic, setIsPublic] = createSignal(true);
  const [content, setContent] = createSignal("");
  const [preview, setPreview] = createSignal(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const data = new FormData(e.target);
    const title = data.get("title")?.trim();
    const subject = data.get("subject");
    if (!title || title.length < 3) { addToast("Naslov mora imati najmanje 3 znaka", "error"); setLoading(false); return; }
    if (!content().trim()) { addToast("Sadržaj ne smije biti prazan", "error"); setLoading(false); return; }
    const tags = tagsInput().split(",").map(t => t.trim()).filter(Boolean);
    try {
      const user = authService.getCurrentUser();
      const profile = await getUserProfile(user.uid);
      const noteId = await createNote(user.uid, profile?.displayName || "Korisnik", { title, content: content(), subject, isPublic: isPublic(), tags });
      addToast("Bilješka je stvorena", "success");
      navigate(`/notes/${noteId}`);
    } catch { addToast("Greška pri stvaranju bilješke", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div class="page-md" style="padding-top:2rem;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;">
        <a href="/notes/my" class="btn-ghost" style="padding:0.4rem 0.875rem;">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Natrag
        </a>
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:800;margin:0;color:var(--text);">Nova bilješka</h1>
          <p style="color:var(--text2);font-size:0.875rem;margin:0.125rem 0 0;">Podijeli znanje sa zajednicom</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main editor card */}
        <div class="card-sb" style="margin-bottom:1rem;overflow:hidden;">
          {/* Gradient top accent */}
          <div style="height:3px;background:linear-gradient(90deg,var(--violet),var(--cyan));" />
          <div style="padding:1.75rem;">
            <div class="form-group">
              <label class="form-label">Naslov bilješke *</label>
              <input type="text" name="title" class="form-input" placeholder="Npr. Derivacije — osnove i primjeri" required />
            </div>
            <div class="form-group">
              <label class="form-label">Predmet *</label>
              <select name="subject" class="form-input form-select" required>
                <For each={SUBJECTS}>{s => <option value={s}>{s}</option>}</For>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                <label class="form-label" style="margin:0;">Sadržaj * <span style="color:var(--text3);font-weight:400;">(Markdown)</span></label>
                <button
                  type="button"
                  class={preview() ? "btn-outline" : "btn-ghost"}
                  style="font-size:0.8125rem;padding:0.35rem 0.875rem;"
                  onClick={() => setPreview(!preview())}
                >
                  <Show when={preview()} fallback={
                    <>
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Pregled
                    </>
                  }>
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Uredi
                  </Show>
                </button>
              </div>
              <Show when={!preview()}>
                <textarea
                  class="form-input form-textarea"
                  style="font-family:'JetBrains Mono','Fira Code',monospace;font-size:0.875rem;min-height:240px;line-height:1.7;"
                  placeholder={"Piši u Markdown formatu...\n\n## Naslov\n**bold** *italic* `kod`\n- stavka liste"}
                  value={content()}
                  onInput={e => setContent(e.target.value)}
                />
              </Show>
              <Show when={preview()}>
                <div style="background:rgba(255,255,255,0.025);border:1px solid var(--border2);border-radius:var(--radius-md);padding:1.25rem;min-height:240px;">
                  <Show when={content()} fallback={
                    <p style="color:var(--text3);margin:0;font-size:0.875rem;font-style:italic;">Nema sadržaja za pregled</p>
                  }>
                    <pre style="white-space:pre-wrap;font-family:var(--font-body);font-size:0.9375rem;margin:0;line-height:1.85;color:var(--text);">{content()}</pre>
                  </Show>
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* Tags card */}
        <div class="card-sb" style="margin-bottom:1rem;padding:1.25rem 1.75rem;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:inline;margin-right:0.35rem;vertical-align:-1px;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Ključne riječi (tagovi)
            </label>
            <input
              type="text"
              class="form-input"
              placeholder="derivacije, matematika, limit"
              value={tagsInput()}
              onInput={e => setTagsInput(e.target.value)}
            />
            <p style="font-size:0.775rem;color:var(--text3);margin:0.3rem 0 0;">Odvojite zarezom</p>
          </div>
        </div>

        {/* Publish bar */}
        <div class="card-sb" style="padding:1.125rem 1.75rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
            <div style="display:flex;align-items:center;gap:0.875rem;">
              <label class="toggle-sb">
                <input type="checkbox" checked={isPublic()} onChange={e => setIsPublic(e.target.checked)} />
                <div class="toggle-track" />
              </label>
              <div>
                <p style="margin:0;font-weight:600;font-size:0.9rem;color:var(--text);">
                  {isPublic() ? "Javna bilješka" : "Privatna bilješka"}
                </p>
                <p style="margin:0;font-size:0.775rem;color:var(--text3);">
                  {isPublic() ? "Vidljiva svim korisnicima" : "Vidljiva samo vama"}
                </p>
              </div>
            </div>
            <div style="display:flex;gap:0.75rem;">
              <a href="/notes/my" class="btn-ghost">Odustani</a>
              <button type="submit" class="btn-primary" disabled={loading()}>
                <Show when={loading()}>
                  <div class="spinner" style="width:14px;height:14px;border-width:2px;border-color:rgba(255,255,255,0.2);border-top-color:#fff;" />
                </Show>
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Objavi bilješku
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
