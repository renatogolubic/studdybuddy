import { createSignal, createEffect, onCleanup, For } from "solid-js";

/* ─── Theme definitions ─── */
export const THEMES = [
  {
    id: "space",
    name: "Deep Space",
    emoji: "🌌",
    preview: ["#7C6FF7", "#22D3EE", "#0D0F17"],
    vars: {
      "--bg": "#0D0F17",
      "--bg2": "#12151F",
      "--bg3": "#0A0C13",
      "--surface": "rgba(255,255,255,0.04)",
      "--surface2": "rgba(255,255,255,0.07)",
      "--surface3": "rgba(255,255,255,0.10)",
      "--surface-solid": "#1A1D2E",
      "--surface-solid2": "#21253A",
      "--border": "rgba(255,255,255,0.06)",
      "--border2": "rgba(255,255,255,0.11)",
      "--border3": "rgba(255,255,255,0.18)",
      "--accent": "#7C6FF7",
      "--accent-bright": "#9D94FF",
      "--accent-dim": "rgba(124,111,247,0.15)",
      "--accent-glow": "rgba(124,111,247,0.35)",
      "--accent-dark": "#5548C8",
      "--accent2": "#22D3EE",
      "--accent2-dim": "rgba(34,211,238,0.12)",
      "--accent2-glow": "rgba(34,211,238,0.3)",
      "--text": "#F0F1F8",
      "--text2": "#8B91B3",
      "--text3": "#4E5478",
      "--body-bg1": "rgba(124,111,247,0.12)",
      "--body-bg2": "rgba(34,211,238,0.08)",
      "--card-bg": "rgba(255,255,255,0.035)",
    }
  },
  {
    id: "sienna",
    name: "Dark Sienna",
    emoji: "🍷",
    preview: ["#49111C", "#A9927D", "#0A0908"],
    vars: {
      "--bg": "#0A0908",
      "--bg2": "#110A0C",
      "--bg3": "#070605",
      "--surface": "rgba(169,146,125,0.06)",
      "--surface2": "rgba(169,146,125,0.10)",
      "--surface3": "rgba(169,146,125,0.15)",
      "--surface-solid": "#1C0F11",
      "--surface-solid2": "#271318",
      "--border": "rgba(169,146,125,0.07)",
      "--border2": "rgba(169,146,125,0.13)",
      "--border3": "rgba(169,146,125,0.22)",
      "--accent": "#A9927D",
      "--accent-bright": "#C4AB92",
      "--accent-dim": "rgba(169,146,125,0.18)",
      "--accent-glow": "rgba(169,146,125,0.32)",
      "--accent-dark": "#8A7362",
      "--accent2": "#49111C",
      "--accent2-dim": "rgba(73,17,28,0.18)",
      "--accent2-glow": "rgba(73,17,28,0.35)",
      "--text": "#F2F4F3",
      "--text2": "#A9927D",
      "--text3": "#5E503F",
      "--body-bg1": "rgba(73,17,28,0.14)",
      "--body-bg2": "rgba(169,146,125,0.07)",
      "--card-bg": "rgba(169,146,125,0.04)",
    }
  },
  {
    id: "forest",
    name: "Forest Night",
    emoji: "🌿",
    preview: ["#2D6A4F", "#52B788", "#0D1912"],
    vars: {
      "--bg": "#0D1912",
      "--bg2": "#111E17",
      "--bg3": "#09130D",
      "--surface": "rgba(82,183,136,0.05)",
      "--surface2": "rgba(82,183,136,0.09)",
      "--surface3": "rgba(82,183,136,0.14)",
      "--surface-solid": "#182A1E",
      "--surface-solid2": "#1F3528",
      "--border": "rgba(82,183,136,0.08)",
      "--border2": "rgba(82,183,136,0.14)",
      "--border3": "rgba(82,183,136,0.22)",
      "--accent": "#52B788",
      "--accent-bright": "#74C69D",
      "--accent-dim": "rgba(82,183,136,0.15)",
      "--accent-glow": "rgba(82,183,136,0.32)",
      "--accent-dark": "#2D6A4F",
      "--accent2": "#B7E4C7",
      "--accent2-dim": "rgba(183,228,199,0.12)",
      "--accent2-glow": "rgba(183,228,199,0.28)",
      "--text": "#EFF9F3",
      "--text2": "#74C69D",
      "--text3": "#40916C",
      "--body-bg1": "rgba(82,183,136,0.1)",
      "--body-bg2": "rgba(45,106,79,0.07)",
      "--card-bg": "rgba(82,183,136,0.04)",
    }
  },
  {
    id: "sunset",
    name: "Sunset",
    emoji: "🌅",
    preview: ["#E07A5F", "#F2CC8F", "#120800"],
    vars: {
      "--bg": "#120800",
      "--bg2": "#1A0E03",
      "--bg3": "#0D0500",
      "--surface": "rgba(224,122,95,0.06)",
      "--surface2": "rgba(224,122,95,0.10)",
      "--surface3": "rgba(224,122,95,0.15)",
      "--surface-solid": "#221208",
      "--surface-solid2": "#2D1A0E",
      "--border": "rgba(224,122,95,0.08)",
      "--border2": "rgba(224,122,95,0.14)",
      "--border3": "rgba(224,122,95,0.23)",
      "--accent": "#E07A5F",
      "--accent-bright": "#F0957E",
      "--accent-dim": "rgba(224,122,95,0.16)",
      "--accent-glow": "rgba(224,122,95,0.33)",
      "--accent-dark": "#B85C3E",
      "--accent2": "#F2CC8F",
      "--accent2-dim": "rgba(242,204,143,0.13)",
      "--accent2-glow": "rgba(242,204,143,0.28)",
      "--text": "#FDF6EE",
      "--text2": "#C4956A",
      "--text3": "#7A5030",
      "--body-bg1": "rgba(224,122,95,0.12)",
      "--body-bg2": "rgba(242,204,143,0.07)",
      "--card-bg": "rgba(224,122,95,0.04)",
    }
  },
];

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.querySelector("[data-theme='studybuddy']");
  if (!root) return;

  const v = theme.vars;
  const updates = {
    ...v,
    "--violet": v["--accent"],
    "--violet-bright": v["--accent-bright"],
    "--violet-dim": v["--accent-dim"],
    "--violet-glow": v["--accent-glow"],
    "--violet-dark": v["--accent-dark"],
    "--cyan": v["--accent2"],
    "--cyan-dim": v["--accent2-dim"],
    "--cyan-glow": v["--accent2-glow"],
    "--card-bg-val": v["--card-bg"],
  };

  Object.entries(updates).forEach(([k, val]) => root.style.setProperty(k, val));

  document.body.style.backgroundImage = `
    radial-gradient(ellipse 80% 50% at 20% -10%, ${v["--body-bg1"]} 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 110%, ${v["--body-bg2"]} 0%, transparent 55%)
  `;
  document.body.style.backgroundColor = v["--bg"];

  if (theme.light) {
    document.body.style.colorScheme = "light";
    root.setAttribute("data-light", "true");
  } else {
    document.body.style.colorScheme = "dark";
    root.removeAttribute("data-light");
  }

  localStorage.setItem("sb-theme", themeId);
}

/* ─── Component — renders as an inline navbar item ─── */
export default function ThemeSelector() {
  const saved = localStorage.getItem("sb-theme") || "space";
  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(saved);

  createEffect(() => { applyTheme(active()); });

  const select = (id) => { setActive(id); applyTheme(id); setOpen(false); };

  let wrapRef;
  const onDocClick = (e) => { if (wrapRef && !wrapRef.contains(e.target)) setOpen(false); };
  document.addEventListener("mousedown", onDocClick);
  onCleanup(() => document.removeEventListener("mousedown", onDocClick));

  const current = () => THEMES.find(t => t.id === active()) || THEMES[0];

  /* small 3-dot swatch showing the active theme colors */
  const Swatch = () => (
    <div style="display:flex;gap:2px;align-items:center;">
      {current().preview.slice(0, 3).map((c, i) => (
        <div style={`width:${i === 0 ? 8 : 6}px;height:${i === 0 ? 14 : 10}px;border-radius:3px;background:${c};flex-shrink:0;`} />
      ))}
    </div>
  );

  return (
    <div ref={wrapRef} style="position:relative;">
      {/* Trigger — styled like btn-sb */}
      <button
        id="theme-selector-toggle"
        onClick={() => setOpen(o => !o)}
        title="Tema"
        class="btn-sb"
        style={`gap:0.5rem;${open() ? "color:var(--text);background:var(--surface2);" : ""}`}
      >
        <Swatch />
        <span style="font-size:0.8125rem;">Tema</span>
        <svg
          width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"
          viewBox="0 0 24 24"
          style={`transition:transform 0.2s;${open() ? "transform:rotate(180deg)" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open() && (
        <div style={`
          position:absolute;top:calc(100% + 10px);right:0;
          width:232px;
          background:var(--surface-solid);
          border:1px solid var(--border3);
          border-radius:16px;
          padding:0.625rem;
          box-shadow:0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border2);
          backdrop-filter:blur(20px);
          -webkit-backdrop-filter:blur(20px);
          z-index:500;
          animation:themeDropIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
        `}>
          <p style="margin:0 0 0.5rem 0.5rem;font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;">
            Odaberi temu
          </p>

          <div style="display:flex;flex-direction:column;gap:2px;">
            <For each={THEMES}>
              {(theme) => {
                const isActive = () => active() === theme.id;
                return (
                  <button
                    id={`theme-option-${theme.id}`}
                    onClick={() => select(theme.id)}
                    style={`
                      display:flex;align-items:center;gap:0.625rem;
                      width:100%;padding:0.5rem 0.625rem;
                      border-radius:10px;
                      border:1px solid ${isActive() ? "var(--accent)" : "transparent"};
                      background:${isActive() ? "var(--accent-dim)" : "transparent"};
                      cursor:pointer;text-align:left;
                      transition:background 0.13s ease, border-color 0.13s ease;
                      color:var(--text);
                    `}
                    onMouseEnter={e => {
                      if (!isActive()) {
                        e.currentTarget.style.background = "var(--surface2)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive()) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Color swatches */}
                    <div style="display:flex;gap:2px;flex-shrink:0;">
                      {theme.preview.map((c, i) => (
                        <div style={`
                          width:${i === 0 ? 18 : 12}px;height:24px;border-radius:5px;
                          background:${c};
                          border:1px solid rgba(128,128,128,0.2);
                          flex-shrink:0;
                        `} />
                      ))}
                    </div>

                    {/* Label */}
                    <div style="flex:1;min-width:0;">
                      <p style="margin:0;font-size:0.8125rem;font-weight:600;color:var(--text);white-space:nowrap;">
                        {theme.emoji} {theme.name}
                      </p>
                      {theme.light && (
                        <p style="margin:0;font-size:0.675rem;color:var(--text3);">Svijetla tema</p>
                      )}
                    </div>

                    {/* Checkmark */}
                    {isActive() && (
                      <svg width="14" height="14" fill="none" stroke="var(--accent)" stroke-width="2.5" viewBox="0 0 24 24" style="flex-shrink:0;">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              }}
            </For>
          </div>
        </div>
      )}

      <style>{`
        @keyframes themeDropIn {
          from { opacity:0; transform:translateY(-6px) scale(0.97); }
          to   { opacity:1; transform:none; }
        }
      `}</style>
    </div>
  );
}
