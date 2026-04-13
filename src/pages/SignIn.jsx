import { createSignal, Show } from "solid-js";
import { authService } from "../services/auth.js";
import { useNavigate } from "@solidjs/router";
import { SignInSchema } from "../lib/schemas.js";
import { addToast } from "../components/Toast.jsx";
import AuthVideoBackground from "../components/AuthVideoBackground.jsx";

export default function SignIn() {
  const navigate = useNavigate();
  const [validation, setValidation] = createSignal({});
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setValidation({}); setLoading(true);
    const data = new FormData(e.target);
    try {
      const v = SignInSchema.parse({ email: data.get("email"), password: data.get("password") });
      await authService.signIn(v.email, v.password);
      addToast("Prijava uspješna", "success");
      navigate("/");
    } catch (error) {
      if (error.name === "ZodError") {
        const e = {}; error.issues.forEach(i => { e[i.path[0]] = i.message; }); setValidation(e);
      } else addToast(error.message || "Greška prijave", "error");
    } finally { setLoading(false); }
  };

  return (
    <div style="min-height:calc(100vh - 64px);display:flex;align-items:center;justify-content:center;padding:2rem 1rem;position:relative;overflow:hidden;">
      <AuthVideoBackground />

      <div style="position:relative;z-index:2;width:100%;max-width:420px;animation:scaleIn 0.35s ease;">
        {/* Logo */}
        <div style="text-align:center;margin-bottom:2rem;">
          <a href="/" style="text-decoration:none;display:inline-flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5z" fill="url(#slg1)" opacity="0.9"/>
              <path d="M3 12l9 5 9-5" stroke="url(#slg2)" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M3 17l9 5 9-5" stroke="url(#slg2)" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
              <defs>
                <linearGradient id="slg1" x1="3" y1="2" x2="21" y2="12" gradientUnits="userSpaceOnUse"><stop stop-color="#9D94FF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
                <linearGradient id="slg2" x1="3" y1="12" x2="21" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#9D94FF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
              </defs>
            </svg>
            <span style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;letter-spacing:-0.04em;color:var(--text);">
              Study<span style="background:linear-gradient(135deg,var(--violet-bright),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Buddy</span>
            </span>
          </a>
          <h1 style="font-family:var(--font-display);font-size:1.625rem;font-weight:700;margin:0 0 0.375rem;color:var(--text);">Dobro došli natrag</h1>
          <p style="color:var(--text2);font-size:0.9375rem;margin:0;">Prijavite se u vaš račun</p>
        </div>

        {/* Card */}
        <div class="card-sb" style="padding:2rem;">
          <form onSubmit={handleSubmit}>
            <div class="form-group">
              <label class="form-label">E-mail adresa</label>
              <input type="email" name="email" class="form-input" placeholder="vas@email.com" required />
              <Show when={validation().email}>
                <p class="form-error">{validation().email}</p>
              </Show>
            </div>
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:0.4rem;">
                <span class="form-label" style="margin:0;">Zaporka</span>
                <a href="/user/resetpassword" style="font-size:0.8rem;color:var(--violet-bright);text-decoration:none;font-weight:500;transition:opacity 0.15s;" onMouseOver={e => e.target.style.opacity="0.8"} onMouseOut={e => e.target.style.opacity="1"}>
                  Zaboravili ste?
                </a>
              </div>
              <input type="password" name="password" class="form-input" placeholder="••••••••" required />
              <Show when={validation().password}>
                <p class="form-error">{validation().password}</p>
              </Show>
            </div>
            <button type="submit" class="btn-primary" style="width:100%;justify-content:center;padding:0.8125rem;margin-top:0.5rem;font-size:0.9375rem;" disabled={loading()}>
              <Show when={loading()}>
                <div class="spinner" style="width:15px;height:15px;border-width:2px;border-color:rgba(255,255,255,0.2);border-top-color:#fff;" />
              </Show>
              Prijavi se
            </button>
          </form>
          <div class="divider-sb" />
          <p style="text-align:center;font-size:0.875rem;color:var(--text2);margin:0;">
            Nemate račun?{" "}
            <a href="/user/signup" style="color:var(--violet-bright);text-decoration:none;font-weight:600;">Registrirajte se</a>
          </p>
        </div>
      </div>
    </div>
  );
}
