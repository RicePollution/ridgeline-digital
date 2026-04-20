// Custom cursor: Win95 (old web) → modern (new web) on hover of interactive elements
(function () {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const wrap = document.createElement('div');
  wrap.id = 'cursor-wrap';

  const imgOld = document.createElement('img');
  imgOld.src = 'assets/cursor-win95.svg';
  imgOld.className = 'cursor-img cursor-img--old';
  imgOld.setAttribute('aria-hidden', 'true');
  imgOld.draggable = false;

  const imgNew = document.createElement('img');
  imgNew.src = 'assets/cursor-modern.svg';
  imgNew.className = 'cursor-img cursor-img--new';
  imgNew.setAttribute('aria-hidden', 'true');
  imgNew.draggable = false;

  wrap.appendChild(imgOld);
  wrap.appendChild(imgNew);
  document.body.appendChild(wrap);
  document.body.classList.add('has-custom-cursor');

  // rAF-throttled position update
  let mx = -200, my = -200, pending = false;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!pending) {
      pending = true;
      requestAnimationFrame(() => {
        wrap.style.transform = `translate(${mx}px,${my}px)`;
        pending = false;
      });
    }
  });

  // Switch to modern cursor over interactive elements
  const TARGETS = 'a, button, [role="button"], .btn, .service-item, .article-card, input, textarea, select, label[for]';
  document.querySelectorAll(TARGETS).forEach(el => {
    el.addEventListener('mouseenter', () => wrap.classList.add('cursor--modern'));
    el.addEventListener('mouseleave', () => wrap.classList.remove('cursor--modern'));
  });
})();
