import { createSignal, Show } from "solid-js";
import { authService } from "../services/auth.js";
import { SignUpSchema } from "../lib/schemas.js";
import { addToast } from "../components/Toast.jsx";
import AuthVideoBackground from "../components/AuthVideoBackground.jsx";

export default function SignUp() {
  const [success, setSuccess] = createSignal(false);
  const [validation, setValidation] = createSignal({});
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setValidation({}); setLoading(true);
    const data = new FormData(e.target);
    try {
      const v = SignUpSchema.parse({ name: data.get("name"), email: data.get("email"), password: data.get("password"), passwordConfirm: data.get("passwordConfirm") });
      await authService.signUp(v.email, v.password, v.name);
      setSuccess(true);
    } catch (error) {
      if (error.name === "ZodError") { const e = {}; error.issues.forEach(i => { e[i.path[0]] = i.message; }); setValidation(e); }
      else addToast(error.message || "Greška registracije", "error");
    } finally { setLoading(false); }
  };

  return (
    <div style="min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;padding:2rem 1rem;position:relative;overflow:hidden;">
      <AuthVideoBackground />

      <div style="position:relative;z-index:2;width:100%;max-width:440px;animation:scaleIn 0.35s ease;">
        {/* Logo */}
        <div style="text-align:center;margin-bottom:2rem;">
          <a href="/" style="text-decoration:none;display:inline-flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5z" fill="url(#sulg1)" opacity="0.9"/>
              <path d="M3 12l9 5 9-5" stroke="url(#sulg2)" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M3 17l9 5 9-5" stroke="url(#sulg2)" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
              <defs>
                <linearGradient id="sulg1" x1="3" y1="2" x2="21" y2="12" gradientUnits="userSpaceOnUse"><stop stop-color="#9D94FF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
                <linearGradient id="sulg2" x1="3" y1="12" x2="21" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#9D94FF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
              </defs>
            </svg>
            <span style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:var(--text);">
              Study<span style="background:linear-gradient(135deg,var(--violet-bright),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Buddy</span>
            </span>
          </a>
          <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:700;margin:0 0 0.375rem;color:var(--text);">Kreirati račun</h1>
          <p style="color:var(--text2);font-size:0.9375rem;margin:0;">Besplatni račun za sva učenja</p>
        </div>

        <Show when={!success()}>
          <div class="card-sb" style="padding:2rem;">
            <form onSubmit={handleSubmit}>
              <div class="form-group">
                <label class="form-label">Ime i prezime</label>
                <input type="text" name="name" class="form-input" placeholder="Vaše ime" required />
                <Show when={validation().name}><p class="form-error">{validation().name}</p></Show>
              </div>
              <div class="form-group">
                <label class="form-label">E-mail adresa</label>
                <input type="email" name="email" class="form-input" placeholder="vas@email.com" required />
                <Show when={validation().email}><p class="form-error">{validation().email}</p></Show>
              </div>
              <div class="form-group">
                <label class="form-label">Zaporka</label>
                <input type="password" name="password" class="form-input" placeholder="Min. 6 znakova" required />
                <Show when={validation().password}><p class="form-error">{validation().password}</p></Show>
              </div>
              <div class="form-group">
                <label class="form-label">Potvrda zaporke</label>
                <input type="password" name="passwordConfirm" class="form-input" placeholder="Ponovite zaporku" required />
                <Show when={validation().passwordConfirm}><p class="form-error">{validation().passwordConfirm}</p></Show>
              </div>
              <button type="submit" class="btn-primary" style="width:100%;justify-content:center;padding:0.8125rem;margin-top:0.25rem;font-size:0.9375rem;" disabled={loading()}>
                <Show when={loading()}>
                  <div class="spinner" style="width:15px;height:15px;border-width:2px;border-color:rgba(255,255,255,0.2);border-top-color:#fff;" />
                </Show>
                Registriraj se
              </button>
            </form>
            <div class="divider-sb" />
            <p style="text-align:center;font-size:0.875rem;color:var(--text2);margin:0;">
              Već imate račun?{" "}
              <a href="/user/signin" style="color:var(--violet-bright);text-decoration:none;font-weight:600;">Prijavite se</a>
            </p>
          </div>
        </Show>

        <Show when={success()}>
          <div class="card-sb" style="padding:2.5rem;text-align:center;animation:scaleIn 0.3s ease;">
            <div style="width:60px;height:60px;background:var(--success-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;box-shadow:0 0 24px rgba(52,211,153,0.2);">
              <svg width="26" height="26" fill="none" stroke="var(--success)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style="font-family:var(--font-display);font-size:1.5rem;font-weight:700;margin:0 0 0.625rem;color:var(--text);">账Račun je stvoren!</h2>
            <p style="color:var(--text2);margin:0 0 1.75rem;font-size:0.9375rem;line-height:1.6;">Provjerite vaš e-mail za potvrdu računa.</p>
            <a href="/user/signin" class="btn-primary" style="justify-content:center;width:100%;padding:0.8125rem;">Prijavi se</a>
          </div>
        </Show>
      </div>
    </div>
  );
}
