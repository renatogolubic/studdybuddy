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
        <a href="/notes/my" class="btn-ghost" style="padding:0.375rem 0.75rem;">← Natrag</a>
        <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:700;margin:0;color:var(--text);">Nova bilješka</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div class="card-sb" style="padding:1.75rem; margin-bottom:1rem;">
          <div class="form-group">
            <label class="form-label">Naslov *</label>
            <input type="text" name="title" class="form-input" placeholder="Npr. Derivacije — osnove i primjeri" required />
          </div>
          <div class="form-group">
            <label class="form-label">Predmet *</label>
            <select name="subject" class="form-input form-select" style="background:var(--bg2);" required>
              <For each={SUBJECTS}>{s => <option value={s}>{s}</option>}</For>
            </select>
          </div>
          <div class="form-group">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.375rem;">
              <label class="form-label" style="margin:0;">Sadržaj * (Markdown)</label>
              <button type="button" class="btn-ghost" style="font-size:0.8rem;padding:0.25rem 0.625rem;" onClick={() => setPreview(!preview())}>
                {preview() ? "✏️ Uredi" : "👁 Pregled"}
              </button>
            </div>
            <Show when={!preview()}>
              <textarea class="form-input form-textarea" style="font-family:monospace;font-size:0.875rem;min-height:220px;background:var(--bg2);" placeholder={"Piši u Markdown formatu...\n\n## Naslov\n**bold** *italic*\n- stavka liste"} value={content()} onInput={e => setContent(e.target.value)} />
            </Show>
            <Show when={preview()}>
              <div style="background:var(--bg2);border:1px solid var(--border2);border-radius:var(--radius-md);padding:1.125rem;min-height:220px;">
                <Show when={content()} fallback={<p style="color:var(--text3);margin:0;font-size:0.875rem;">Nema sadržaja za pregled</p>}>
                  <pre style="white-space:pre-wrap;font-family:var(--font-body);font-size:0.9rem;margin:0;line-height:1.8;color:var(--text);">{content()}</pre>
                </Show>
              </div>
            </Show>
          </div>
          <div class="form-group">
            <label class="form-label">Ključne riječi (tagovi)</label>
            <input type="text" class="form-input" placeholder="derivacije, matematika, limit" value={tagsInput()} onInput={e => setTagsInput(e.target.value)} />
            <p style="font-size:0.775rem;color:var(--text3);margin:0.25rem 0 0;">Odvojite zarezom</p>
          </div>
        </div>
        <div class="card-sb" style="padding:1.125rem 1.75rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
            <div style="display:flex;align-items:center;gap:0.875rem;">
              <label class="toggle-sb">
                <input type="checkbox" checked={isPublic()} onChange={e => setIsPublic(e.target.checked)} />
                <div class="toggle-track"></div>
              </label>
              <div>
                <p style="margin:0;font-weight:500;font-size:0.9rem;color:var(--text);">{isPublic() ? "Javna bilješka" : "Privatna bilješka"}</p>
                <p style="margin:0;font-size:0.775rem;color:var(--text3);">{isPublic() ? "Vidljiva svim korisnicima" : "Vidljiva samo vama"}</p>
              </div>
            </div>
            <div style="display:flex;gap:0.75rem;">
              <a href="/notes/my" class="btn-ghost">Odustani</a>
              <button type="submit" class="btn-primary" disabled={loading()}>
                <Show when={loading()}><div class="spinner" style="width:14px;height:14px;border-width:2px;border-color:rgba(0,0,0,0.2);border-top-color:#0D1F1A;"></div></Show>
                Objavi bilješku
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
