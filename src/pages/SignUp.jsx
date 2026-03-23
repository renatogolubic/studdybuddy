import { createSignal, Show } from "solid-js";
import { authService } from "../services/auth.js";
import { SignUpSchema } from "../lib/schemas.js";
import { addToast } from "../components/Toast.jsx";

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
    <div class="page-sm" style="padding-top:3rem;">
      <div style="text-align:center; margin-bottom:2rem;">
        <a href="/" class="sb-logo" style="font-size:1.625rem; display:inline-block; margin-bottom:0.625rem; text-decoration:none;">Study<span>Buddy</span></a>
        <p style="color:var(--text2); font-size:0.9375rem; margin:0;">Besplatni račun za sva učenja</p>
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
            <button type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:0.75rem;" disabled={loading()}>
              <Show when={loading()}><div class="spinner" style="width:15px;height:15px;border-width:2px;border-color:rgba(0,0,0,0.2);border-top-color:#0D1F1A;"></div></Show>
              Registriraj se
            </button>
          </form>
          <div class="divider-sb"></div>
          <p style="text-align:center; font-size:0.875rem; color:var(--text2);">
            Već imate račun? <a href="/user/signin" style="color:var(--teal); text-decoration:none; font-weight:600;">Prijavite se</a>
          </p>
        </div>
      </Show>
      <Show when={success()}>
        <div class="card-sb" style="padding:2.5rem; text-align:center;">
          <div style="width:52px;height:52px;background:var(--teal-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
            <svg width="22" height="22" fill="none" stroke="var(--teal)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style="font-family:var(--font-display);font-size:1.375rem;font-weight:700;margin:0 0 0.625rem;color:var(--text);">Račun je stvoren!</h2>
          <p style="color:var(--text2);margin:0 0 1.5rem;font-size:0.9rem;">Provjerite e-mail za potvrdu računa.</p>
          <a href="/user/signin" class="btn-primary" style="justify-content:center;">Prijavi se</a>
        </div>
      </Show>
    </div>
  );
}
