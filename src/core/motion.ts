export function prefersReducedMotion(): boolean {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  return query.matches;
}
