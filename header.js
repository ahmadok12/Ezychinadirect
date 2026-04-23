// ── Stars Generator
const starsEl = document.getElementById('stars');
for (let i = 0; i < 90; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  const size = Math.random() * 2 + 0.5;
  s.style.cssText = `
    left: ${Math.random()*100}%;
    top:  ${Math.random()*62}%;
    width: ${size}px;
    height: ${size}px;
    --d: ${(Math.random()*4+1.5).toFixed(1)}s;
    --op1: ${(Math.random()*0.5+0.4).toFixed(2)};
    --op2: ${(Math.random()*0.2).toFixed(2)};
    animation-delay: ${(Math.random()*5).toFixed(1)}s;
  `;
  starsEl.appendChild(s);
}

// ── Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Mobile hamburger menu (if applicable)
// Uncomment and wire up if a mobile menu drawer is added
// const ham = document.getElementById('ham');
// if (ham) {
//   ham.addEventListener('click', () => {
//     document.querySelector('.nav-links').classList.toggle('open');
//   });
// }
