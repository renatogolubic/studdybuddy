import { createSignal, Show } from "solid-js";
import { authService } from "../services/auth.js";
import { useNavigate } from "@solidjs/router";
import { SignInSchema } from "../lib/schemas.js";
import { addToast } from "../components/Toast.jsx";

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
      if (error.name === "ZodError") { const e = {}; error.issues.forEach(i => { e[i.path[0]] = i.message; }); setValidation(e); }
      else addToast(error.message || "Greška prijave", "error");
    } finally { setLoading(false); }
  };

  return (
    <div class="page-sm" style="padding-top:3.5rem;">
      <div style="text-align:center; margin-bottom:2rem;">
        <a href="/" class="sb-logo" style="font-size:1.625rem; display:inline-block; margin-bottom:0.625rem; text-decoration:none;">Study<span>Buddy</span></a>
        <p style="color:var(--text2); font-size:0.9375rem; margin:0;">Dobro došli natrag</p>
      </div>
      <div class="card-sb" style="padding:2rem;">
        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label class="form-label">E-mail adresa</label>
            <input type="email" name="email" class="form-input" placeholder="vas@email.com" required />
            <Show when={validation().email}><p class="form-error">{validation().email}</p></Show>
          </div>
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.375rem;">
              <span class="form-label" style="margin:0;">Zaporka</span>
              <a href="/user/resetpassword" style="font-size:0.8rem; color:var(--teal); text-decoration:none;">Zaboravili ste?</a>
            </div>
            <input type="password" name="password" class="form-input" placeholder="••••••••" required />
            <Show when={validation().password}><p class="form-error">{validation().password}</p></Show>
          </div>
          <button type="submit" class="btn-primary" style="width:100%; justify-content:center; padding:0.75rem; margin-top:0.25rem;" disabled={loading()}>
            <Show when={loading()}><div class="spinner" style="width:15px;height:15px;border-width:2px;border-color:rgba(0,0,0,0.2);border-top-color:#0D1F1A;"></div></Show>
            Prijavi se
          </button>
        </form>
        <div class="divider-sb"></div>
        <p style="text-align:center; font-size:0.875rem; color:var(--text2);">
          Nemate račun? <a href="/user/signup" style="color:var(--teal); text-decoration:none; font-weight:600;">Registrirajte se</a>
        </p>
      </div>
    </div>
  );
}
