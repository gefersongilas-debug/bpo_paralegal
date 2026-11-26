const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const prefix = '/e-book';
const raw = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '');
let site = '';
if (raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || !['/', '/e-book', '/e-book/'].includes(url.pathname) || url.search || url.hash) throw new Error('SITE_URL deve ser a origem HTTPS ou a URL HTTPS terminada em /e-book.');
  site = url.origin;
}
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'e-book'), { recursive: true });
for (const name of ['site.webmanifest','assets','css','js']) {
  fs.cpSync(path.join(root, name), path.join(out, 'e-book', name), { recursive: true, filter: src => !src.endsWith('guia-ebef-local.js') && !src.endsWith('capa-ebook.webp') });
}
const vendor = path.join(out, 'e-book', 'js', 'vendor');
const gsapRoot = path.join(root, 'node_modules', 'gsap', 'dist');
const useGsap = process.env.USE_GSAP === '1';
const hasGsap = useGsap && ['gsap.min.js','ScrollTrigger.min.js'].every(name => fs.existsSync(path.join(gsapRoot, name)));
if (hasGsap) {
  fs.mkdirSync(vendor, { recursive: true });
  for (const name of ['gsap.min.js','ScrollTrigger.min.js']) fs.copyFileSync(path.join(gsapRoot, name), path.join(vendor, name));
} else if (useGsap) throw new Error('GSAP não instalado. Execute npm install antes do build.');
else console.warn('Motor nativo ativo (USE_GSAP=1 para habilitar GSAP instalado).');
const pages = [
  ['index.html', 'e-book.html', prefix],
  ['a-b/index.html', 'e-book/a-b.html', prefix + '/a-b'],
  ['obrigado/index.html', 'e-book/obrigado.html', prefix + '/obrigado'],
  ['politica-de-privacidade.html', 'e-book/politica-de-privacidade.html', prefix + '/politica-de-privacidade'],
  ['404.html', '404.html', '/404']
];
for (const [file, dest, route] of pages) {
  let html = fs.readFileSync(path.join(root, file), 'utf8');
  // Absolute public URLs work with or without trailing slash, including hard refresh.
  html = html.replace(/\b(href|src|srcset|content)="(?:\.\.\/|\.\/)(?=(?:assets|css|js)\/|site\.webmanifest)/g, `$1="${prefix}/`);
  html = html.replace(/href="(?:\.\.\/|\.\/)index\.html"/g, `href="${prefix}"`);
  html = html.replace(/href="(?:\.\.\/|\.\/)politica-de-privacidade\.html"/g, `href="${prefix}/politica-de-privacidade"`);
  html = html.replace(/href="\/"/g, `href="${prefix}"`);
  if (file === 'a-b/index.html' && hasGsap) {
    html = html.replace(`<script defer src="${prefix}/js/immersive.js?v=16"></script>`, `<script defer src="${prefix}/js/vendor/gsap.min.js"></script>\n<script defer src="${prefix}/js/vendor/ScrollTrigger.min.js"></script>\n<script defer src="${prefix}/js/immersive.js?v=16"></script>`);
  }
  if (site) {
    html = html.replace(/content="\/e-book\/assets\/og-ebef\.jpg"/g, `content="${site}${prefix}/assets/og-ebef.jpg"`);
    let meta = `<link rel="canonical" href="${site}${file === 'a-b/index.html' ? prefix : route}"><meta property="og:url" content="${site}${route}">`;
    if (file === 'index.html') meta += `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:'BPO Paralegal',url:site+prefix,logo:site+prefix+'/assets/logo-bpo.webp'})}</script>`;
    html = html.replace('<!-- SITE_METADATA -->', meta);
  }
  fs.writeFileSync(path.join(out, dest), html);
}
// Preserve a standalone root page for hosts without redirect configuration.
fs.copyFileSync(path.join(out, 'e-book.html'), path.join(out, 'index.html'));
const manifest = path.join(out, 'e-book', 'site.webmanifest');
const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
data.start_url = prefix; data.scope = '/';
for (const icon of data.icons) icon.src = icon.src.replace(/^\.\//, prefix + '/');
fs.writeFileSync(manifest, JSON.stringify(data, null, 2));
fs.copyFileSync(path.join(root, 'robots.txt'), path.join(out, 'robots.txt'));
if (site) {
  fs.writeFileSync(path.join(out,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site}${prefix}</loc></url></urlset>\n`);
  fs.appendFileSync(path.join(out,'robots.txt'), `Sitemap: ${site}/sitemap.xml\n`);
} else console.warn('SITE_URL não configurada: metadados absolutos e sitemap serão gerados com o domínio.');
