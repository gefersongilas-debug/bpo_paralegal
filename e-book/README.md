# BPO Paralegal — e-BEF | V16 Performance

## Publicação

Extraia o ZIP e substitua a pasta `e-book` antiga pela nova (não apenas mescle os arquivos, pois a versão anterior contém o PDF duplicado em `assets/guia-ebef-local.js`). O ZIP contém a pasta `e-book/` já nomeada.

No Vercel, em um projeto dedicado a esta LP, use `e-book` como **Root Directory** se a pasta estiver na raiz do repositório. Caso os arquivos internos sejam a própria raiz do repositório, deixe Root Directory padrão. O `vercel.json` fornece o build, a pasta de saída `dist`, os redirects, o cache e as regras de segurança. Se for um projeto existente com outras LPs, integre as regras e a API ao build raiz existente, sem substituir as configurações de outras páginas. A função `api/lead.js` é server-side e precisa estar ativa na raiz do projeto Vercel.

- `/e-book` — versão A tradicional
- `/e-book/a-b` — versão B imersiva
- `/e-book/obrigado` — download direto do PDF
- `/e-book/politica-de-privacidade` — aviso preliminar

## Configuração

- `LEAD_WEBHOOK_URL`: URL HTTPS do webhook real (obrigatória para envio real de leads).
- `SITE_URL`: opcional enquanto não houver domínio definitivo. O build utiliza `VERCEL_PROJECT_PRODUCTION_URL` quando disponível. Depois, informe a origem HTTPS definitiva ou a URL terminada em `/e-book` para canonical, Open Graph e sitemap.
- `USE_GSAP=1`: opcional; carrega GSAP + ScrollTrigger no build se a dependência estiver instalada. O padrão V16 usa o motor nativo otimizado e não baixa as bibliotecas no navegador. Os efeitos de rolagem permanecem reversíveis.
- `js/config.js`: configure `privacyPolicyUrl` com a política oficial antes da campanha.

## Prévia local

Com Node.js disponível, execute `npm run preview` na pasta `e-book` e abra `http://localhost:4173/e-book`. A prévia simula o envio e não encaminha dados a nenhum webhook. O servidor local envia o PDF como anexo. Abrir os HTML diretamente também permite visualizar, mas o comportamento de download pelo protocolo `file://` depende do navegador; use a prévia HTTP para garantir o download sem visualizador.

## Performance

Consulte `AUDITORIA.md` para comparativo de peso, critérios e limites dos testes. As imagens WebP são responsivas; o PDF original não faz parte do carregamento inicial. As fontes Poppins são carregadas pelo Google Fonts de forma não bloqueante (font-display swap). O build não requer domínio personalizado.

Após publicar, teste ambas as rotas no https://pagespeed.web.dev/ em Mobile e Desktop. A nota real depende do ambiente publicado, do dispositivo, da rede e de scripts adicionais de rastreamento. Não há nota PageSpeed atribuída a esta versão antes da publicação.
