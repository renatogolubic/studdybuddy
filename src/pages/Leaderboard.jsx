import { createResource, Show, For } from "solid-js";
import { getLeaderboard } from "../services/db.js";
import { authService, isAuthenticated } from "../services/auth.js";

function getAvatarInitial(name) {
  return name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function getAvatarGradient(name) {
  const colors = [
    ["#7C6FF7","#5548C8"],["#22D3EE","#0EA5E9"],["#34D399","#059669"],
    ["#F87171","#DC2626"],["#FBBF24","#D97706"],["#818CF8","#4F46E5"]
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
}

export default function Leaderboard() {
  const [users] = createResource(() => getLeaderboard(50));

  const currentUserUid = () => isAuthenticated() ? authService.getCurrentUser()?.uid : null;

  return (
    <div class="page-container" style="max-width:800px;padding-top:2.5rem;">
      <div style="text-align:center;margin-bottom:3rem;">
        <div style="width:60px;height:60px;background:var(--violet-dim);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
           <span style="font-size:2rem;line-height:1;">🏆</span>
        </div>
        <h1 style="font-family:var(--font-display);font-size:2.5rem;font-weight:800;margin:0 0 0.5rem;background:linear-gradient(135deg,var(--warning),#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
          Rang-lista
        </h1>
        <p style="color:var(--text2);font-size:1.0625rem;margin:0;">
          Najbolji korisnici prema osvojenim bodovima za dijeljenje znanja
        </p>
      </div>

      <Show when={users.loading}>
        <div style="display:flex;justify-content:center;padding:4rem;">
          <div class="spinner" style="width:3rem;height:3rem;border-top-color:var(--warning);" />
        </div>
      </Show>

      <Show when={!users.loading && users()?.length === 0}>
         <div class="card-sb" style="padding:4rem;text-align:center;">
            <p style="color:var(--text3);font-size:1.125rem;">Trenutno nema korisnika na rang-listi.</p>
         </div>
      </Show>

      <Show when={!users.loading && users()?.length > 0}>
        {/* Podium for top 3 */}
        <div style="display:flex;justify-content:center;align-items:flex-end;height:240px;gap:1rem;margin-bottom:3rem;padding:0 1rem;">
          {/* 2nd place */}
          <Show when={users().length >= 2}>
            <div style="display:flex;flex-direction:column;align-items:center;width:30%;max-width:140px;animation:fadeUp 0.6s ease 0.2s backwards;">
               <div style={`width:56px;height:56px;border-radius:50%;background:${getAvatarGradient(users()[1].displayName)};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;margin-bottom:0.75rem;border:3px solid #E5E7EB;box-shadow:0 0 16px rgba(229,231,235,0.4);`}>
                  {getAvatarInitial(users()[1].displayName)}
               </div>
               <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.25rem;color:var(--text);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">
                  {users()[1].displayName}
               </div>
               <div style="color:var(--warning);font-weight:700;font-size:1.1rem;margin-bottom:0.5rem;">{users()[1].points || 0}</div>
               <div style="width:100%;height:100px;background:linear-gradient(180deg,#E5E7EB 0%,rgba(229,231,235,0.2) 100%);border-radius:var(--radius-md) var(--radius-md) 0 0;display:flex;justify-content:center;padding-top:1rem;position:relative;">
                  <span style="font-family:var(--font-display);font-size:2.5rem;font-weight:800;color:var(--bg);line-height:1;opacity:0.6;">2</span>
               </div>
            </div>
          </Show>

          {/* 1st place */}
          <Show when={users().length >= 1}>
            <div style="display:flex;flex-direction:column;align-items:center;width:35%;max-width:160px;animation:fadeUp 0.6s ease 0s backwards;z-index:2;">
               <div style="font-size:1.5rem;margin-bottom:-10px;z-index:3;animation:blobFloat 3s ease-in-out infinite;">👑</div>
               <div style={`width:72px;height:72px;border-radius:50%;background:${getAvatarGradient(users()[0].displayName)};display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;color:#fff;margin-bottom:0.75rem;border:4px solid #FBBF24;box-shadow:0 0 24px rgba(251,191,36,0.6);`}>
                  {getAvatarInitial(users()[0].displayName)}
               </div>
               <div style="font-weight:800;font-size:1.1rem;margin-bottom:0.25rem;color:var(--text);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">
                  {users()[0].displayName}
               </div>
               <div style="color:var(--warning);font-weight:800;font-size:1.25rem;margin-bottom:0.5rem;">{users()[0].points || 0}</div>
               <div style="width:100%;height:140px;background:linear-gradient(180deg,#FBBF24 0%,rgba(251,191,36,0.2) 100%);border-radius:var(--radius-md) var(--radius-md) 0 0;display:flex;justify-content:center;padding-top:1.25rem;position:relative;box-shadow:0 -4px 20px rgba(251,191,36,0.3);">
                  <span style="font-family:var(--font-display);font-size:3.5rem;font-weight:800;color:var(--bg);line-height:1;opacity:0.7;">1</span>
               </div>
            </div>
          </Show>

          {/* 3rd place */}
          <Show when={users().length >= 3}>
            <div style="display:flex;flex-direction:column;align-items:center;width:30%;max-width:140px;animation:fadeUp 0.6s ease 0.4s backwards;">
               <div style={`width:56px;height:56px;border-radius:50%;background:${getAvatarGradient(users()[2].displayName)};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;margin-bottom:0.75rem;border:3px solid #D97706;box-shadow:0 0 16px rgba(217,119,6,0.4);`}>
                  {getAvatarInitial(users()[2].displayName)}
               </div>
               <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.25rem;color:var(--text);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">
                  {users()[2].displayName}
               </div>
               <div style="color:var(--warning);font-weight:700;font-size:1.1rem;margin-bottom:0.5rem;">{users()[2].points || 0}</div>
               <div style="width:100%;height:80px;background:linear-gradient(180deg,#D97706 0%,rgba(217,119,6,0.2) 100%);border-radius:var(--radius-md) var(--radius-md) 0 0;display:flex;justify-content:center;padding-top:0.75rem;position:relative;">
                  <span style="font-family:var(--font-display);font-size:2.25rem;font-weight:800;color:var(--bg);line-height:1;opacity:0.6;">3</span>
               </div>
            </div>
          </Show>
        </div>

        {/* List of everyone else + top 3 in list form too */}
        <div class="card-sb" style="overflow:hidden;">
          <div style="display:flex;justify-content:space-between;padding:1rem 1.5rem;background:rgba(255,255,255,0.02);border-bottom:1px solid var(--border2);font-size:0.8125rem;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:1px;">
            <span>Rang i Korisnik</span>
            <span>Bodovi</span>
          </div>
          
          <div style="display:flex;flex-direction:column;">
            <For each={users()}>
              {(user, i) => {
                const isMe = user.uid && currentUserUid() === user.uid;
                const trStyle = "display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;border-bottom:1px solid var(--border);" + (isMe ? "background:var(--violet-dim);" : "transition:background 0.2s;");
                
                return (
                  <div style={trStyle} onMouseOver={(e)=> { if(!isMe) e.currentTarget.style.background="var(--surface2)"}} onMouseOut={(e)=> { if(!isMe) e.currentTarget.style.background="transparent"}}>
                    <div style="display:flex;align-items:center;gap:1.25rem;">
                       <span style="font-family:var(--font-display);font-size:1.25rem;font-weight:800;color:var(--text3);width:24px;text-align:center;">
                          {i() + 1}
                       </span>
                       <div style="display:flex;align-items:center;gap:0.875rem;">
                          <div style={`width:36px;height:36px;border-radius:50%;background:${getAvatarGradient(user.displayName)};display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:#fff;`}>
                             {getAvatarInitial(user.displayName)}
                          </div>
                          <div>
                            <div style="font-weight:600;color:var(--text);display:flex;align-items:center;gap:0.5rem;">
                               {user.displayName}
                               <Show when={isMe}>
                                 <span style="font-size:0.6rem;background:var(--violet);color:#fff;padding:2px 6px;border-radius:100px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Ti</span>
                               </Show>
                            </div>
                            <Show when={user.role === "admin"}>
                               <div style="font-size:0.75rem;color:var(--warning);">Admin</div>
                            </Show>
                          </div>
                       </div>
                    </div>
                    <div style="font-family:var(--font-display);font-size:1.25rem;font-weight:700;color:var(--warning);">
                       {user.points || 0}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
