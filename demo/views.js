// views.js
export function showView(viewId) {
  document.querySelectorAll("[data-view]").forEach(v => (v.style.display = "none"));
  const el = document.getElementById(viewId);
  if (el) el.style.display = "";
}
