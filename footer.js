// ════════════════════════════════════════════
// EMAILJS SETUP
// 1. Sign up free at https://www.emailjs.com
// 2. Create a service (Gmail recommended) → copy Service ID below
// 3. Create an email template → copy Template ID below
//    Template variables used: {{from_name}}, {{from_email}}, {{mobile}},
//    {{product_name}}, {{details}}, {{calc_summary}}
// 4. Copy your Public Key below
// ════════════════════════════════════════════
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ← replace
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ← replace
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ← replace

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

// ── Sourcing Cost Calculator Logic
let calcShipMode = 'sea';

function calcSetShip(btn, mode) {
  calcShipMode = mode;
  document.querySelectorAll('.calc-ship-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('res-ship-label').textContent = mode === 'sea' ? '🚢 Sea Freight' : '✈️ Air Freight';
  calcUpdate();
}

function calcFmt(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Stores last computed values for attaching to email
let calcSnapshot = null;

function calcUpdate() {
  const unitCost = parseFloat(document.getElementById('calc-unit-cost').value) || 0;
  const qty      = parseFloat(document.getElementById('calc-qty').value) || 0;
  const weight   = parseFloat(document.getElementById('calc-weight').value) || 0;
  const dutyPct  = parseFloat(document.getElementById('calc-duty').value) || 0;

  if (!unitCost || !qty) {
    ['res-product','res-shipping','res-duties','res-agent','res-total','res-per-unit'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    document.getElementById('calc-savings').style.display = 'none';
    calcSnapshot = null;
    updateQuoteSummary();
    return;
  }

  const productCost = unitCost * qty;
  const seaRate = Math.max(weight * 1.20, 60);
  const airRate = Math.max(weight * 4.50, 80);
  const shippingCost = calcShipMode === 'sea' ? seaRate : airRate;
  const duties = (productCost + shippingCost) * (dutyPct / 100);
  const agentFee = Math.max(productCost * 0.05, 50);
  const total = productCost + shippingCost + duties + agentFee;
  const perUnit = qty > 0 ? total / qty : 0;

  document.getElementById('res-product').textContent  = calcFmt(productCost);
  document.getElementById('res-shipping').textContent = calcFmt(shippingCost);
  document.getElementById('res-duties').textContent   = calcFmt(duties);
  document.getElementById('res-agent').textContent    = calcFmt(agentFee);
  document.getElementById('res-total').textContent    = calcFmt(total);
  document.getElementById('res-per-unit').textContent = '$' + perUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const savingsBadge = document.getElementById('calc-savings');
  const savings = airRate - seaRate;
  if (savings > 0 && calcShipMode === 'air') {
    document.getElementById('calc-savings-amt').textContent = calcFmt(savings);
    savingsBadge.style.display = 'flex';
  } else if (savings > 0 && calcShipMode === 'sea') {
    savingsBadge.querySelector('.calc-savings-title').innerHTML = 'Switching to sea saves you <span id="calc-savings-amt">' + calcFmt(savings) + '</span>';
    savingsBadge.style.display = 'flex';
  } else {
    savingsBadge.style.display = 'none';
  }

  // Save snapshot for email
  calcSnapshot = {
    unitCost, qty, weight, dutyPct,
    shippingMode: calcShipMode === 'sea' ? 'Sea Freight' : 'Air Freight',
    productCost: calcFmt(productCost),
    shipping: calcFmt(shippingCost),
    duties: calcFmt(duties),
    agentFee: calcFmt(agentFee),
    total: calcFmt(total),
    perUnit: '$' + perUnit.toFixed(2)
  };
  updateQuoteSummary();
}

// ── Show/hide inline quote form
function calcShowQuoteForm() {
  const form = document.getElementById('calc-quote-form');
  form.classList.add('visible');
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  updateQuoteSummary();
}
function calcHideQuoteForm() {
  document.getElementById('calc-quote-form').classList.remove('visible');
}

// ── Update the calculator summary shown inside the form
function updateQuoteSummary() {
  const el = document.getElementById('calc-quote-summary');
  if (!el) return;
  if (!calcSnapshot) {
    el.classList.remove('has-data');
    return;
  }
  const s = calcSnapshot;
  el.innerHTML =
    `<strong>📊 Your Calculator Estimate</strong><br>` +
    `Unit Cost: ${s.unitCost} × ${s.qty} units &nbsp;|&nbsp; Shipping: ${s.shippingMode}<br>` +
    `Product: <strong>${s.productCost}</strong> &nbsp;+&nbsp; Freight: <strong>${s.shipping}</strong> &nbsp;+&nbsp; Duties: <strong>${s.duties}</strong> &nbsp;+&nbsp; Agent Fee: <strong>${s.agentFee}</strong><br>` +
    `<strong style="color:var(--gold-light)">Estimated Total: ${s.total} &nbsp;|&nbsp; Per Unit: ${s.perUnit}</strong>`;
  el.classList.add('has-data');
}

// ── Send quote via EmailJS
async function calcSendQuote() {
  const name    = document.getElementById('qf-name').value.trim();
  const mobile  = document.getElementById('qf-mobile').value.trim();
  const email   = document.getElementById('qf-email').value.trim();
  const product = document.getElementById('qf-product').value.trim();
  const details = document.getElementById('qf-details').value.trim();

  const errEl  = document.getElementById('calc-quote-error');
  const succEl = document.getElementById('calc-quote-success');
  errEl.style.display = 'none';
  succEl.style.display = 'none';

  // Basic validation
  if (!name || !mobile || !email || !product) {
    errEl.textContent = '⚠️ Please fill in all required fields (Name, Mobile, Email, Product Name).';
    errEl.style.display = 'block';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = '⚠️ Please enter a valid email address.';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('calc-quote-submit');
  const labelEl = document.getElementById('calc-submit-label');
  btn.disabled = true;
  labelEl.textContent = '⏳ Sending…';

  const calcSummary = calcSnapshot
    ? `Unit Cost: $${calcSnapshot.unitCost} × ${calcSnapshot.qty} units | Shipping: ${calcSnapshot.shippingMode} | Product Total: ${calcSnapshot.productCost} | Freight: ${calcSnapshot.shipping} | Duties: ${calcSnapshot.duties} | Agent Fee: ${calcSnapshot.agentFee} | TOTAL: ${calcSnapshot.total} | Per Unit: ${calcSnapshot.perUnit}`
    : 'No calculator data entered.';

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:     'info@ezychinadirect.com',
      from_name:    name,
      from_email:   email,
      mobile:       mobile,
      product_name: product,
      details:      details || '(no details provided)',
      calc_summary: calcSummary,
      reply_to:     email
    });

    succEl.style.display = 'block';
    labelEl.textContent = '✅ Sent!';
    // Reset form fields
    ['qf-name','qf-mobile','qf-email','qf-product','qf-details'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('calc-quote-summary').classList.remove('has-data');

  } catch (err) {
    console.error('EmailJS error:', err);
    errEl.textContent = '❌ Could not send. Please email us directly at info@ezychinadirect.com';
    errEl.style.display = 'block';
    btn.disabled = false;
    labelEl.textContent = '📨 Send My Quote Request';
  }
}

// ── Contact form submit handler
function handleSubmit(e) {
  e.preventDefault();
  document.getElementById('form-success').style.display = 'block';
  e.target.style.display = 'none';
}

// ── Product slider initializer
function initSlider(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;
  const prevBtn = document.querySelector(`.pslider-arrow.prev[data-target="${trackId}"]`);
  const nextBtn = document.querySelector(`.pslider-arrow.next[data-target="${trackId}"]`);
  const origCards = Array.from(track.querySelectorAll('.pslide-card'));
  origCards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
  track.style.scrollSnapType = 'none';
  const gap = 18;
  const cardWidth = () => origCards[0].offsetWidth + gap;
  const totalOrigWidth = () => origCards.length * cardWidth();
  track.scrollLeft = 0;
  function checkLoop() {
    const orig = totalOrigWidth();
    if (track.scrollLeft >= orig) track.scrollLeft -= orig;
    else if (track.scrollLeft < 0) track.scrollLeft += orig;
  }
  track.addEventListener('scroll', checkLoop, { passive: true });
  let paused = false;
  const speed = 0.6;
  function autoScroll() {
    if (!paused) track.scrollLeft += speed;
    requestAnimationFrame(autoScroll);
  }
  requestAnimationFrame(autoScroll);
  track.addEventListener('mouseenter', () => paused = true);
  track.addEventListener('mouseleave', () => paused = false);
  let mouseDown = false, startX = 0, startScroll = 0, hasDragged = false;
  track.addEventListener('mousedown', e => {
    mouseDown = true; hasDragged = false;
    startX = e.pageX; startScroll = track.scrollLeft;
    track.style.cursor = 'grabbing'; paused = true;
  });
  document.addEventListener('mouseup', () => {
    if (!mouseDown) return;
    mouseDown = false; track.style.cursor = 'grab'; paused = false;
  });
  document.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) hasDragged = true;
    track.scrollLeft = startScroll - dx;
  });
  track.addEventListener('click', e => { if (hasDragged) e.preventDefault(); }, true);
  let touchStartX = 0, touchStartScroll = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX; touchStartScroll = track.scrollLeft; paused = true;
  }, { passive: true });
  track.addEventListener('touchmove', e => {
    track.scrollLeft = touchStartScroll - (e.touches[0].clientX - touchStartX);
  }, { passive: true });
  track.addEventListener('touchend', () => paused = false);
  if (prevBtn) prevBtn.addEventListener('click', () => track.scrollLeft -= cardWidth());
  if (nextBtn) nextBtn.addEventListener('click', () => track.scrollLeft += cardWidth());
}

// Initialize all product sliders
initSlider('pslider-1');
initSlider('pslider-2');
initSlider('pslider-3');
initSlider('pslider-4');
initSlider('pslider-5');
initSlider('pslider-6');
