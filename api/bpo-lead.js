/**
 * BPO Paralegal | Vercel Function: encaminhamento seguro de formularios ao Make.
 * Cada landing page tem seu webhook independente; nenhuma configuracao manual e necessaria.
 * Em producao, e possivel substituir URLs pelas variaveis de ambiente abaixo.
 */
const WEBHOOKS = {
  paralegal: process.env.MAKE_WEBHOOK_PARALEGAL ||
    'https://hook.us1.make.celonis.com/o70lpu6427wd3r4hinylq4yxv58r5mkb',
  serv_societ_docs: process.env.MAKE_WEBHOOK_SERV_SOCIET_DOCS ||
    'https://hook.us1.make.celonis.com/vg01slhh0ngd8i70xwnykaqkgvwu8gi7',
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok:false, error:'Metodo nao permitido' });
  }

  let lead;
  try {
    lead = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return res.status(400).json({ ok:false, error:'JSON invalido' });
  }
  if (!lead || typeof lead !== 'object' || Array.isArray(lead)) {
    return res.status(400).json({ ok:false, error:'Corpo invalido' });
  }
  const origem = lead.lp_origem || (lead.tracking && lead.tracking.lp_origem);
  const webhook = WEBHOOKS[origem];
  if (!webhook || !lead.campos || typeof lead.campos !== 'object') {
    return res.status(400).json({ ok:false, error:'Formulario nao identificado' });
  }
  const payload = JSON.stringify(lead);
  if (payload.length > 100000) {
    return res.status(413).json({ ok:false, error:'Formulario muito grande' });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(webhook, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:payload,
      signal:controller.signal,
    });
    if (!upstream.ok) {
      console.error('Make retornou status HTTP', upstream.status, 'LP:', origem);
      return res.status(502).json({ ok:false, error:'O Make nao recebeu os dados' });
    }
    return res.status(200).json({ ok:true });
  } catch (error) {
    console.error('Erro ao encaminhar formulario ao Make:', origem, error.message);
    return res.status(502).json({ ok:false, error:'Falha de comunicacao com o Make' });
  } finally {
    clearTimeout(timeout);
  }
};
