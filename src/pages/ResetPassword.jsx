import { createSignal, Show } from "solid-js";
import { authService } from "../services/auth.js";
import { addToast } from "../components/Toast.jsx";

export default function ResetPassword() {
  const [success, setSuccess] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await authService.passwordReset(new FormData(e.target).get("email")); setSuccess(true); }
    catch { addToast("Greška slanja e-maila", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div class="page-sm" style="padding-top:3.5rem;">
      <div style="text-align:center; margin-bottom:2rem;">
        <a href="/" class="sb-logo" style="font-size:1.625rem; display:inline-block; margin-bottom:0.625rem; text-decoration:none;">Study<span>Buddy</span></a>
        <p style="color:var(--text2); font-size:0.9375rem; margin:0;">Oporavak zaporke</p>
      </div>
      <Show when={!success()}>
        <div class="card-sb" style="padding:2rem;">
          <p style="color:var(--text2); font-size:0.875rem; margin:0 0 1.5rem; line-height:1.7;">Unesite vašu e-mail adresu i poslat ćemo vam upute.</p>
          <form onSubmit={handleSubmit}>
            <div class="form-group">
              <label class="form-label">E-mail adresa</label>
              <input type="email" name="email" class="form-input" placeholder="vas@email.com" required />
            </div>
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:0.75rem;" disabled={loading()}>
              <Show when={loading()}><div class="spinner" style="width:15px;height:15px;border-width:2px;border-color:rgba(0,0,0,0.2);border-top-color:#0D1F1A;"></div></Show>
              Pošalji upute
            </button>
          </form>
          <div class="divider-sb"></div>
          <p style="text-align:center; font-size:0.875rem;">
            <a href="/user/signin" style="color:var(--teal); text-decoration:none;">← Natrag na prijavu</a>
          </p>
        </div>
      </Show>
      <Show when={success()}>
        <div class="card-sb" style="padding:2.5rem; text-align:center;">
          <div style="width:52px;height:52px;background:var(--blue-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
            <svg width="22" height="22" fill="none" stroke="var(--blue-soft)" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h2 style="font-family:var(--font-display);font-size:1.375rem;font-weight:700;margin:0 0 0.625rem;color:var(--text);">E-mail poslan</h2>
          <p style="color:var(--text2);margin:0 0 1.5rem;font-size:0.9rem;">Provjerite inbox i slijedite upute.</p>
          <a href="/user/signin" class="btn-outline" style="justify-content:center;">Natrag na prijavu</a>
        </div>
      </Show>
    </div>
  );
}
