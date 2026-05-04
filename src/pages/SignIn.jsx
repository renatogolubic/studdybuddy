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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      addToast("Prijava uspješna", "success");
      navigate("/");
    } catch (error) {
      addToast(error.message || "Greška Google prijave", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    try {
      await authService.signInWithGithub();
      addToast("Prijava uspješna", "success");
      navigate("/");
    } catch (error) {
      addToast(error.message || "Greška GitHub prijave", "error");
    } finally {
      setLoading(false);
    }
  };

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
          <button type="button" class="btn-outline" style="width:100%;justify-content:center;padding:0.8125rem;margin-bottom:0.75rem;font-size:0.9375rem;" onClick={handleGoogleSignIn} disabled={loading()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="margin-right:0.5rem;">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-1 .69-2.26 1.1-3.71 1.1-2.87 0-5.3-1.94-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.11c-.22-.69-.35-1.43-.35-2.11s.13-1.42.35-2.11V7.05H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.95l3.68-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.05l3.68 2.84c.86-2.59 3.29-4.51 6.16-4.51z" fill="#EA4335"/>
            </svg>
            Prijava putem Googlea
          </button>
          
          <button type="button" class="btn-outline" style="width:100%;justify-content:center;padding:0.8125rem;margin-bottom:1.5rem;font-size:0.9375rem;" onClick={handleGithubSignIn} disabled={loading()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:0.5rem;color:var(--text);">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Prijava putem GitHub-a
          </button>
          <p style="text-align:center;font-size:0.875rem;color:var(--text2);margin:0;">
            Nemate račun?{" "}
            <a href="/user/signup" style="color:var(--violet-bright);text-decoration:none;font-weight:600;">Registrirajte se</a>
          </p>
        </div>
      </div>
    </div>
  );
}
