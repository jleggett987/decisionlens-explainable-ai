// router.js
export function getRoute() {
  const hash = window.location.hash || "#/home";
  const parts = hash.replace(/^#\//, "").split("/");
  return { path: parts[0] || "home", rest: parts.slice(1) };
}

export function goTo(hash) {
  window.location.hash = hash;
}

export function onRouteChange(handler) {
  window.addEventListener("hashchange", handler);
}
