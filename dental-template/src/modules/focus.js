/** Keyboard focus stays inside an open drawer and returns to its trigger. */
export function containFocus(container) {
  const trigger = document.activeElement;
  const controls = () => [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea, [tabindex="0"]')].filter(el => !el.hidden && el.getClientRects().length);
  const onKey = (event) => {
    if (event.key !== 'Tab') return;
    const list = controls();
    if (!list.length) { event.preventDefault(); return; }
    const first = list[0], last = list.at(-1);
    if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
      event.preventDefault(); last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
      event.preventDefault(); first.focus({ preventScroll: true });
    }
  };
  document.addEventListener('keydown', onKey);
  controls()[0]?.focus({ preventScroll: true });
  return (restore = true) => {
    document.removeEventListener('keydown', onKey);
    if (restore && trigger?.isConnected) trigger.focus({ preventScroll: true });
  };
}
