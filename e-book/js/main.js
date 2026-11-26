(() => {
  'use strict';
  const config = window.BPO_CONFIG || {};
  document.querySelectorAll('.privacy-link').forEach(link => {
    if (!config.privacyPolicyUrl) return;
    try { const url = new URL(config.privacyPolicyUrl); if(url.protocol === 'https:') {link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';} } catch (_) {}
  });
  const track = (event) => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event }); };
  const download = document.getElementById('download-guide');
  if (download) download.addEventListener('click', () => track('ebook_download'));
  const form = document.getElementById('lead-form');
  if (!form) return;
  const localPreview = location.protocol === 'file:';
  if (localPreview) {
    const note = document.createElement('p');
    note.className = 'local-preview';
    note.textContent = 'Prévia local: o formulário permite testar a página de obrigado, sem enviar ou armazenar dados.';
    form.prepend(note);
  }
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('span');
  const status = document.getElementById('form-status');
  const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','gbraid','wbraid','fbclid','msclkid'];
  const params = new URLSearchParams(location.search);
  const attribution = {};
  keys.forEach(key => { attribution[key] = (params.get(key) || '').slice(0, 500); });
  function safeReferrer() { try { return new URL(document.referrer).origin; } catch (_) { return ''; } }
  const originalLabel = label.textContent;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    status.hidden = true;
    const data = Object.fromEntries(new FormData(form).entries());
    for (const key of ['nome','email','empresa','cargo']) data[key] = data[key].trim();
    if (data.nome.length < 2 || data.empresa.length < 2) { status.textContent = 'Preencha seu nome completo e o nome da empresa.'; status.hidden = false; return; }
    if (localPreview) {
      location.assign(new URL('./obrigado/index.html', location.href).href);
      return;
    }
    Object.assign(data, attribution, { pagina_url: (location.origin + location.pathname).slice(0,2048), referrer: safeReferrer(), origem: 'LP e-BEF' });
    button.disabled = true; form.setAttribute('aria-busy','true'); label.textContent = 'ENVIANDO...';
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch('/api/lead', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:controller.signal });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.message || 'Não foi possível enviar seus dados. Tente novamente.');
      track('generate_lead');
      location.assign('/e-book/obrigado');
    } catch (error) {
      status.textContent = error.name === 'AbortError' ? 'O envio demorou mais que o esperado. Tente novamente.' : (error.message === 'Failed to fetch' ? 'Não foi possível conectar. Verifique sua internet e tente novamente.' : error.message);
      status.hidden = false; status.focus(); button.disabled = false; form.removeAttribute('aria-busy'); label.textContent = originalLabel;
    } finally { clearTimeout(timer); }
  });
})();
