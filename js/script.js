document.documentElement.classList.add("js");

// Suporte inteligente a query param ?plano=basico
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("plano") === "basico" && !window.location.pathname.endsWith("basico.html")) {
  window.location.replace("basico.html" + window.location.search);
}

window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
});

// =========================================================================
// CONFIGURAÇÃO DO LINK DE UPGRADE (PLANO BÁSICO -> PLANO COMPLETO)
// =========================================================================
const UPGRADE_CHECKOUT_URL = "https://pay.lowify.com.br/checkout.php?product_id=UPGRADE_COMPLETO";

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('[data-upgrade-link]').forEach(function(el) {
    const rawHref = el.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.includes('UPGRADE_COMPLETO')) {
      el.setAttribute('href', UPGRADE_CHECKOUT_URL);
    }
  });
});

// =========================================================================
// FORÇAR REDIRECIONAMENTO COM DETECTOR E DESPACHO GARANTIDO DO META PIXEL
// =========================================================================

// 1. Interceptar cliques em botões de upgrade (Lowify / Cakto / Kiwify)
document.addEventListener('click', function(e) {
  const link = e.target.closest('[data-upgrade-link], a[href*="lowify"], a[href*="cakto"], a[href*="kiwify"], a[href*="checkout"], a[href*="pay."]');
  if (!link) return;

  let targetUrl = link.getAttribute('href') || UPGRADE_CHECKOUT_URL;
  if (!targetUrl || targetUrl.startsWith('#') || targetUrl.startsWith('javascript:')) return;

  // Força a interceptação na fase de captura
  e.preventDefault();
  e.stopPropagation();

  // Preservação total de UTMs da página atual
  try {
    const currentParams = new URLSearchParams(window.location.search);
    const destUrlObj = new URL(targetUrl, window.location.origin);
    for (const [key, value] of currentParams.entries()) {
      if (key !== 'plano' && !destUrlObj.searchParams.has(key)) {
        destUrlObj.searchParams.set(key, value);
      }
    }
    targetUrl = destUrlObj.href;
  } catch (err) {}

  // Disparo do Meta Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'InitiateCheckout', {
      content_name: '50 Mapas de Arcos Desconstruídos - Upgrade Plano Completo',
      content_category: 'Upgrade',
      value: 14.90,
      currency: 'BRL',
      num_items: 1
    });
  }

  link.style.opacity = '0.75';
  link.style.pointerEvents = 'none';

  let navigated = false;
  setTimeout(function() {
    if (navigated) return;
    navigated = true;
    window.location.href = targetUrl;
  }, 220);
}, true);

// 2. Interceptar download/abertura dos materiais PDF para registrar engajamento no Pixel
document.addEventListener('click', function(e) {
  const downloadLink = e.target.closest('a[href*=".pdf"]');
  if (!downloadLink) return;

  const card = downloadLink.closest('.material-card');
  const title = card ? (card.querySelector('h3')?.innerText || 'Material PDF') : 'Material PDF';

  if (typeof fbq === 'function') {
    fbq('trackCustom', 'DownloadMaterial', {
      material_name: title,
      file_url: downloadLink.getAttribute('href')
    });
  }
}, true);
