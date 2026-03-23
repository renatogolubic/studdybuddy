import { createSignal, For } from "solid-js";
export const [toasts, setToasts] = createSignal([]);
let id = 0;
export const addToast = (message, type = "info", duration = 4000) => {
  const toastId = id++;
  setToasts(prev => [...prev, { id: toastId, message, type }]);
  if (duration > 0) setTimeout(() => removeToast(toastId), duration);
  return toastId;
};
export const removeToast = (toastId) => setToasts(prev => prev.filter(t => t.id !== toastId));
export default function Toast() {
  return (
    <div class="toast-container">
      <For each={toasts()}>
        {(toast) => (
          <div class={`toast-item toast-${toast.type}`}>
            <div class="toast-dot"></div>
            <span style="flex:1;">{toast.message}</span>
            <button class="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        )}
      </For>
    </div>
  );
}
