const COLORS = ['#FF4FD8', '#2FE6FF', '#FFC14D', '#B06BFF', '#E9EFFD'];

export function confettiBurst() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:999;';
  document.body.appendChild(overlay);

  const count = 36;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const size = 6 + Math.random() * 6;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.3;
    const duration = 1.6 + Math.random() * 1.2;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const rotateStart = Math.random() * 360;

    piece.style.cssText = `
      position:absolute; top:-20px; left:${left}%;
      width:${size}px; height:${size * 1.4}px;
      background:${color};
      border-radius:2px;
      opacity:0.9;
      transform:rotate(${rotateStart}deg);
      animation: confetti-fall ${duration}s ease-in ${delay}s forwards;
    `;
    overlay.appendChild(piece);
  }

  if (!document.getElementById('confetti-keyframes')) {
    const style = document.createElement('style');
    style.id = 'confetti-keyframes';
    style.textContent = `
      @keyframes confetti-fall {
        to { transform: translateY(100vh) rotate(600deg); opacity: 0.2; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => overlay.remove(), 3200);
}
