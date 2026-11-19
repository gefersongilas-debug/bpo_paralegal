/**
 * BPO Paralegal | Vercel Function
 * Recebe campos individuais das duas LPs e encaminha ao respectivo webhook Make.
 * Compatível também com a versão anterior dos formulários que enviava `campos`.
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
    return res.status(405).json({ ok: false, error: 'Metodo nao permitido' });
  }

  let lead;
  try {
    lead = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    return res.status(400).json({ ok: false, error: 'JSON invalido' });
  }
  if (!lead || typeof lead !== 'object' || Array.isArray(lead)) {
    return res.status(400).json({ ok: false, error: 'Corpo invalido' });
  }

  const origem = lead.lp_origem || (lead.tracking && lead.tracking.lp_origem);
  const webhook = WEBHOOKS[origem];
  if (!webhook) {
    return res.status(400).json({ ok: false, error: 'Formulario nao identificado' });
  }

  const dados = { ...lead, lp_origem: origem };
  // Compatibilidade com JS antigo (cache do navegador ou deploy parcial).
  if (lead.campos && typeof lead.campos === 'object' && !Array.isArray(lead.campos)) {
    const campos = Object.values(lead.campos);
    const nomes = ['nome', 'empresa', 'email', 'telefone', 'servico'];
    nomes.forEach((chave, i) => {
      if (dados[chave] == null) dados[chave] = campos[i] && campos[i].valor != null ? campos[i].valor : '';
    });
    for (const campo of campos.slice(5)) {
      if (!campo || typeof campo !== 'object') continue;
      if (campo.id === 'input_referral_source' && dados.origem_referencia == null) {
        dados.origem_referencia = campo.valor;
      }
      if (campo.id === 'input_mobile' && dados.dispositivo == null) {
        dados.dispositivo = campo.valor;
      }
      if (campo.id === 'input_uri' && dados.url_formulario == null) {
        dados.url_formulario = campo.valor;
      }
    }
  }

  // Os metadados de campanha ja vem na raiz do JS novo.
  // Se vierem no objeto legado tracking, preenche somente os ausentes.
  if (lead.tracking && typeof lead.tracking === 'object' && !Array.isArray(lead.tracking)) {
    for (const [chave, valor] of Object.entries(lead.tracking)) {
      if (dados[chave] === undefined) dados[chave] = valor;
    }
  }
  delete dados.campos;
  delete dados.tracking;

  const nomes = ['nome', 'empresa', 'email', 'telefone', 'servico'];
  if (nomes.some((chave) => typeof dados[chave] !== 'string' || !dados[chave].trim())) {
    return res.status(400).json({ ok: false, error: 'Campos obrigatorios ausentes' });
  }
  const payload = JSON.stringify(dados);
  if (payload.length > 100000) {
    return res.status(413).json({ ok: false, error: 'Formulario muito grande' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: controller.signal,
    });
    if (!upstream.ok) {
      console.error('Make retornou HTTP', upstream.status, 'LP:', origem);
      return res.status(502).json({ ok: false, error: 'O Make nao recebeu os dados' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro ao encaminhar formulario ao Make:', origem, error.message);
    return res.status(502).json({ ok: false, error: 'Falha de comunicacao com o Make' });
  } finally {
    clearTimeout(timeout);
  }
};
