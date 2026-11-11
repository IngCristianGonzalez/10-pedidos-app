export function printElement(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // Simple window.print with CSS targeting id
  const prev = document.body.className;
  document.body.classList.add("printing");
  // Use a style to hide everything except target
  const style = document.createElement("style");
  style.id = "print-style";
  style.textContent = `@media print { body * { visibility: hidden !important; } #${id}, #${id} * { visibility: visible !important; } #${id} { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } @page { size: 80mm auto; margin: 2mm; } }`;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => {
    document.head.removeChild(style);
    document.body.className = prev;
  }, 500);
}
