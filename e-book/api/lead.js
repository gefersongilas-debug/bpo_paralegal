// Vercel Node.js function — formulário BPO e-BEF (A/B).
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ok:false,message:'Método não permitido.'}); }
  if (!(req.headers['content-type'] || '').includes('application/json')) return res.status(415).json({ok:false,message:'Formato inválido.'});
  if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ok:false,message:'Origem não permitida.'});
  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ok:false,message:'Origem não permitida.'}); } catch { return res.status(403).json({ok:false,message:'Origem inválida.'}); } }
  if (Number(req.headers['content-length']) > 16384) return res.status(413).json({ok:false,message:'Dados excedem o limite.'});
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ok:false,message:'Dados inválidos.'}); } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ok:false,message:'Dados inválidos.'});
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 16384) return res.status(413).json({ok:false,message:'Dados excedem o limite.'});
  const get = (key, length) => typeof body[key] === 'string' ? body[key].trim().slice(0,length) : '';
  if (get('website',200) || get('honeypot',200)) return res.status(400).json({ok:false,message:'Não foi possível validar o formulário.'});
  const data = { nome:get('nome',120), email:get('email',254), empresa:get('empresa',160), cargo:get('cargo',120) };
  if (data.nome.length < 2 || data.empresa.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return res.status(400).json({ok:false,message:'Confira os campos obrigatórios e o e-mail.'});
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','gbraid','wbraid','fbclid','msclkid']) data[key] = get(key,500);
  data.pagina_url = get('pagina_url',2048); data.referrer = get('referrer',2048); data.origem = 'LP e-BEF'; data.lp_variant = 'A'; try { if (/^\/(?:e-book\/)?a-b(?:\/|$|\.html)/.test(new URL(data.pagina_url).pathname)) data.lp_variant = 'B'; } catch (_) {} data.data_envio = new Date().toISOString();
  const webhook = process.env.BPO_EBEF_LEAD_WEBHOOK_URL || 'https://hook.us1.make.celonis.com/diu5bnlt7kholn8ni5q8kchxeie777zb';
  if (!webhook) return res.status(503).json({ok:false,message:'O serviço de envio está temporariamente indisponível. Tente novamente mais tarde.'});
  try {
    const url = new URL(webhook);
    if (url.protocol !== 'https:') throw new Error('Invalid webhook protocol');
    const response = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(12000),redirect:'error'});
    if (!response.ok) {
      console.error('e-BEF: Make returned HTTP', response.status);
      return res.status(502).json({ok:false,message:'O serviço de recebimento recusou o envio. Tente novamente em instantes.'});
    }
    return res.status(200).json({ok:true});
  } catch (error) {
    console.error('Lead delivery failed:', error.name);
    return res.status(502).json({ok:false,message:error.name === 'TimeoutError' || error.name === 'AbortError' ? 'O serviço de recebimento demorou para responder. Tente novamente.' : 'Não foi possível conectar ao serviço de recebimento. Tente novamente em instantes.'});
  }
};
