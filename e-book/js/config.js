// Informe a URL oficial da política de privacidade antes da campanha.
window.BPO_CONFIG = Object.freeze({ privacyPolicyUrl: '' });

// Load the brand font without blocking the first paint; keep the noscript fallback.
const bpoFontSheet = document.getElementById('poppins-css');
if (bpoFontSheet) bpoFontSheet.media = 'all';
