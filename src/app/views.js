// views.js
export function showView(viewId) {
  document.querySelectorAll("[data-view]").forEach(v => (v.style.display = "none"));
  const el = document.getElementById(viewId);
  if (el) {
    el.style.display = "";
    console.log(`[showView] Showing view: #${viewId}`);
  } else {
    console.warn(`[showView] Tried to show missing view: #${viewId}`);
  }
}
