import { createSignal, createResource, Show, For } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { getNoteById, getFlashcards, saveFlashcards } from "../services/db.js";
import { authService, isAuthenticated } from "../services/auth.js";
import { addToast } from "../components/Toast.jsx";
import { generateFlashcardsAI } from "../services/ai.js";

export default function Flashcards() {
  const params = useParams();
  const navigate = useNavigate();

  const [cards, setCards] = createSignal([]);
  const [loading, setLoading] = createSignal(true);

  const [currentIdx, setCurrentIdx] = createSignal(0);
  const [isFlipped, setIsFlipped] = createSignal(false);

  const [isCreating, setIsCreating] = createSignal(false);
  const [newCards, setNewCards] = createSignal([{ question: "", answer: "" }]);

  // AI generation state
  const [aiLoading, setAiLoading] = createSignal(false);
  const [aiCount, setAiCount] = createSignal(6);
  const [aiError, setAiError] = createSignal("");

  const [note] = createResource(() => params.id, getNoteById);

  // Load existing cards
  createResource(() => params.id, async (id) => {
    setLoading(true);
    const fetched = await getFlashcards(id);
    setCards(fetched);
    if (fetched.length === 0) {
      setIsCreating(true);
    }
    setLoading(false);
    return fetched;
  });

  const handleFlip = () => setIsFlipped(!isFlipped());

  const handleNext = () => {
    if (currentIdx() < cards().length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIdx(currentIdx() + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIdx() > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIdx(currentIdx() - 1), 150);
    }
  };

  const handleAddPair = () => setNewCards([...newCards(), { question: "", answer: "" }]);
  const handleUpdateNewCard = (idx, field, val) => {
    const updated = [...newCards()];
    updated[idx][field] = val;
    setNewCards(updated);
  };
  const handleRemovePair = (idx) => {
    setNewCards(newCards().filter((_, i) => i !== idx));
  };

  const handleSaveFlashcards = async () => {
    const valid = newCards().filter(c => c.question.trim() && c.answer.trim());
    if (valid.length === 0) {
      addToast("Dodajte barem jednu karticu s pitanjem i odgovorom", "error");
      return;
    }

    setLoading(true);
    const u = authService.getCurrentUser();
    try {
      await saveFlashcards(params.id, valid, u.uid);
      setCards(valid);
      setIsCreating(false);
      setCurrentIdx(0);
      setIsFlipped(false);
      addToast("Flashcards spremljeni", "success");
    } catch {
      addToast("Greška pri spremanju", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...cards()].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIdx(0);
    }, 150);
  };

  // ── AI GENERATION ──────────────────────────────────────────────
  const handleGenerateAI = async () => {
    const n = note();
    if (!n) return;
    setAiError("");
    setAiLoading(true);
    try {
      const generated = await generateFlashcardsAI(n.title, n.content, aiCount());
      setNewCards(generated);
      addToast(`AI generirao ${generated.length} kartic(e)! Pregledajte ih i spremite.`, "success");
    } catch (err) {
      const msg = err.message || "Greška pri AI generiranju.";
      setAiError(msg);
      addToast(msg, "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRegenerate = () => {
    setIsCreating(true);
    setIsFlipped(false);
    setCurrentIdx(0);
    setNewCards(cards().length > 0 ? cards() : [{ question: "", answer: "" }]);
  };

  const isOwner = () =>
    isAuthenticated() && note()?.userId === authService.getCurrentUser()?.uid;

  return (
    <div class="page-md" style="padding-top:2rem;padding-bottom:4rem;">
      {/* Header */}
      <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:2rem;">
        <a href={`/notes/${params.id}`} class="btn-ghost" style="padding:0.4rem 0.875rem;">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Povratak na bilješku
        </a>
        <div>
          <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:800;margin:0;color:var(--text);">
            Flashcards <span style="font-weight:400;color:var(--text3);">- {note()?.title || "Učitavanje..."}</span>
          </h1>
        </div>
      </div>

      {/* Loading skeleton */}
      <Show when={loading() && cards().length === 0}>
        <div style="display:flex;justify-content:center;padding:5rem;">
          <div class="spinner" style="width:2.5rem;height:2.5rem;" />
        </div>
      </Show>

      {/* ── LEARNING MODE ── */}
      <Show when={!loading() && !isCreating() && cards().length > 0}>
        <div style="max-width:600px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:1.5rem;color:var(--text2);font-weight:500;">
            Kartica {currentIdx() + 1} od {cards().length}
          </div>

          {/* Flashcard */}
          <div
            style="perspective:1000px;width:100%;height:320px;cursor:pointer;margin-bottom:2rem;"
            onClick={handleFlip}
          >
            <div
              style={`position:relative;width:100%;height:100%;transition:transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);transform-style:preserve-3d;transform:${isFlipped() ? "rotateY(180deg)" : "rotateY(0deg)"};`}
            >
              {/* Front – Question */}
              <div style="position:absolute;width:100%;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2.5rem;text-align:center;background:var(--surface-solid2);border:1px solid var(--border2);border-radius:var(--radius-lg);box-shadow:var(--shadow-md);">
                <span style="position:absolute;top:1rem;left:1.5rem;font-size:0.75rem;font-weight:600;color:var(--violet-bright);text-transform:uppercase;letter-spacing:1px;">Pitanje</span>
                <p style="font-size:1.25rem;font-weight:500;color:var(--text);margin:0;line-height:1.6;">
                  {cards()[currentIdx()]?.question}
                </p>
                <div style="position:absolute;bottom:1.5rem;font-size:0.8rem;color:var(--text3);display:flex;align-items:center;gap:6px;">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                  Klikni za okret
                </div>
              </div>

              {/* Back – Answer */}
              <div style="position:absolute;width:100%;height:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2.5rem;text-align:center;background:var(--surface-solid2);border:1px solid var(--border2);border-radius:var(--radius-lg);box-shadow:0 0 20px rgba(34,211,238,0.05);transform:rotateY(180deg);">
                <span style="position:absolute;top:1rem;left:1.5rem;font-size:0.75rem;font-weight:600;color:var(--cyan);text-transform:uppercase;letter-spacing:1px;">Odgovor</span>
                <p style="font-size:1.15rem;color:var(--text);margin:0;line-height:1.6;">
                  {cards()[currentIdx()]?.answer}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
            <button class="btn-outline" onClick={handlePrev} disabled={currentIdx() === 0}>
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
              Prethodna
            </button>
            <button class="btn-ghost" onClick={handleShuffle} title="Promiješaj kartice">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
            </button>
            <button class="btn-primary" onClick={handleNext} disabled={currentIdx() === cards().length - 1}>
              Sljedeća
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {/* Re-create button for owner */}
          <Show when={isOwner()}>
            <div style="text-align:center;">
              <button class="btn-ghost" onClick={handleRegenerate} style="font-size:0.85rem;color:var(--text3);">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.17" /></svg>
                Uredi / regeneriraj kartice
              </button>
            </div>
          </Show>
        </div>
      </Show>

      {/* ── CREATE / NO CARDS MODE ── */}
      <Show when={!loading() && isCreating()}>
        <div class="card-sb" style="padding:2rem;">

          {/* ── AI GENERATION PANEL ── */}
          <Show when={isOwner()}>
            <div style={`background:linear-gradient(135deg,rgba(124,111,247,0.1),rgba(34,211,238,0.06));border:1px solid rgba(124,111,247,0.25);border-radius:var(--radius-lg);padding:1.5rem 1.75rem;margin-bottom:2rem;`}>
              {/* Title row */}
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,var(--violet),var(--cyan));border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" opacity=".3" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                  </svg>
                </div>
                <div>
                  <div style="font-weight:700;font-size:1rem;color:var(--text);">AI Generator Kartica</div>
                  <div style="font-size:0.8rem;color:var(--text3);">Automatski generiraj pitanja iz sadržaja bilješke</div>
                </div>
              </div>

              {/* Count selector + button */}
              <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                <label style="font-size:0.85rem;color:var(--text2);font-weight:500;">Broj kartica:</label>
                <select
                  id="ai-card-count"
                  value={aiCount()}
                  onChange={e => setAiCount(Number(e.target.value))}
                  style="background:var(--surface2);border:1px solid var(--border2);border-radius:var(--radius-sm);padding:0.35rem 0.65rem;color:var(--text);font-size:0.875rem;cursor:pointer;"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                </select>

                <button
                  id="ai-generate-btn"
                  class="btn-primary"
                  onClick={handleGenerateAI}
                  disabled={aiLoading()}
                  style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1.25rem;background:linear-gradient(135deg,var(--violet),#6366f1);border:none;"
                >
                  <Show when={aiLoading()} fallback={
                    <>
                      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" opacity=".4" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
                      </svg>
                      Generiraj s AI
                    </>
                  }>
                    <div class="spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#fff;border-color:rgba(255,255,255,0.25);" />
                    AI misli...
                  </Show>
                </button>
              </div>

              {/* AI loading message */}
              <Show when={aiLoading()}>
                <div style="margin-top:0.875rem;display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;color:var(--text3);">
                  <div class="spinner" style="width:11px;height:11px;border-width:1.5px;border-top-color:var(--violet-bright);border-color:rgba(124,111,247,0.2);" />
                  Analiziranje sadržaja bilješke i generiranje kartica... (~15s)
                </div>
              </Show>

              {/* AI error */}
              <Show when={aiError()}>
                <div class="alert-sb alert-error" style="margin-top:0.875rem;font-size:0.85rem;">
                  {aiError()}
                </div>
              </Show>

              <p style="font-size:0.75rem;color:var(--text3);margin:0.75rem 0 0;line-height:1.5;">
                Koristi Groq besplatni AI model • Generirana pitanja možete urediti prije spremanja
              </p>
            </div>
          </Show>

          {/* Empty state header */}
          <Show when={cards().length === 0 && newCards().length <= 1 && !newCards()[0]?.question}>
            <div style="text-align:center;margin-bottom:2rem;">
              <div style="width:56px;height:56px;background:var(--violet-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                <svg width="24" height="24" fill="none" stroke="var(--violet-bright)" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
              </div>
              <h2 style="font-size:1.25rem;font-weight:700;margin:0 0 0.5rem;color:var(--text);">Nema flashcardsa</h2>
              <p style="color:var(--text2);margin:0;">
                Koristite AI za automatsko generiranje ili ručno dodajte pitanja i odgovore.
              </p>
            </div>
          </Show>

          {/* Only owner can create cards */}
          <Show when={isOwner()} fallback={
            <div class="alert-sb alert-warning">Samo autor bilješke može dodavati flashcards.</div>
          }>
            {/* Divider between AI panel and manual cards */}
            <Show when={newCards().length > 0 && (newCards()[0].question || newCards().length > 1)}>
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">
                <div style="flex:1;height:1px;background:var(--border2);" />
                <span style="font-size:0.75rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Pregledaj i uredi</span>
                <div style="flex:1;height:1px;background:var(--border2);" />
              </div>
            </Show>

            <div style="display:flex;flex-direction:column;gap:1.5rem;">
              <For each={newCards()}>
                {(card, i) => (
                  <div style="background:var(--surface2);border:1px solid var(--border2);border-radius:var(--radius-md);padding:1.25rem;position:relative;">
                    <div style="position:absolute;top:-10px;left:15px;background:var(--bg);padding:0 8px;font-size:0.75rem;color:var(--text3);font-weight:600;">Kartica {i() + 1}</div>
                    <Show when={newCards().length > 1}>
                      <button
                        onClick={() => handleRemovePair(i())}
                        style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--error);cursor:pointer;opacity:0.6;"
                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </Show>

                    <div class="form-group" style="margin-bottom:1rem;">
                      <label class="form-label">Pitanje</label>
                      <input
                        type="text"
                        class="form-input"
                        value={card.question}
                        onInput={e => handleUpdateNewCard(i(), "question", e.target.value)}
                        placeholder="Npr. Što je derivacija?"
                      />
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                      <label class="form-label">Odgovor</label>
                      <textarea
                        class="form-input form-textarea"
                        style="min-height:80px;"
                        value={card.answer}
                        onInput={e => handleUpdateNewCard(i(), "answer", e.target.value)}
                        placeholder="Npr. Mjera brzine promjene funkcije..."
                      />
                    </div>
                  </div>
                )}
              </For>

              <button class="btn-outline" onClick={handleAddPair} style="align-self:flex-start;border-style:dashed;">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Dodaj novu karticu
              </button>

              <div class="divider-sb" />

              <button
                id="save-flashcards-btn"
                class="btn-primary"
                onClick={handleSaveFlashcards}
                disabled={loading()}
                style="justify-content:center;padding:0.75rem;"
              >
                <Show when={loading()}>
                  <div class="spinner" style="width:14px;height:14px;border-width:2px;border-top-color:#fff;border-color:rgba(255,255,255,0.2);margin-right:8px;" />
                </Show>
                Spremi Flashcards materijal
              </button>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
