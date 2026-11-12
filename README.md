# V5 — Remoção do selo GreatPages

- O selo visual “Feito com GreatPages” foi removido das duas LPs, incluindo as imagens de logo usadas só para esse selo.
- As tags `meta name="generator"` que identificavam o editor foram removidas.
- O `index.html` da **raiz** é uma página de redirecionamento para `/serv_societ_docs/` quando alguém acessa `/` na Vercel. Ele é diferente dos `index.html` dentro das duas subpastas, que são as LPs completas. Não é necessário excluir ou editar o índice da raiz.
- GTM, Meta Pixel, formulários e campos de webhook não foram alterados.

---

# V4 — Correção de caminhos locais

A V3 usava caminhos absolutos (`/serv_societ_docs/assets/` ou `/paralegal/assets/`), que não resolvem ao abrir um `index.html` com `file://`. Na V4, HTML e JS carregam `assets/` a partir de cada página, e CSS carrega imagens via `../images/`. As URLs das mídias permanecem internas e funcionam tanto em pré-visualização local quanto nas rotas com barra final da Vercel.

No Vercel, as rotas `/serv_societ_docs` e `/paralegal` redirecionam para as versões com `/` final, assegurando o funcionamento dos caminhos relativos. A página raiz redireciona localmente e no deploy para a primeira LP.

**Webhook:** cada formulário segue com `data-webhook-url=""`; CRM e conversões reais continuam pendentes.

**SEO:** canonical e URLs antigas deverão ser ajustados após confirmação do domínio.

---

# Migração V3 — Licenciamento e Alvarás + BPO (Vercel)

**Entrega V3:** imagens locais consolidadas, substituição dos fundos fallback externos pelos arquivos correspondentes já exportados e extração de todos os ícones base64/percent-encoded SVG/PNG para `/assets/images/inline/` dentro de cada landing page. Não houve alteração das copies, formulários, IDs de GTM ou pixels.

**Importante:** Não houve acesso a CDN para confrontar cada imagem fallback com o arquivo remoto byte a byte. O relacionamento foi feito pelos seletores e pelos arquivos de imagem principais do mesmo componente presentes no próprio pacote original. Recomenda-se conferir a aparência no deployment final.

**Autonomia:** imagens, SVGs codificados e fontes de texto Poppins/Onest/Roboto/Open Sans fornecidas no export estão locais. Descartamos declarações de subconjuntos de fontes ausentes no export e removemos referências à fonte Font Awesome 6 Pro remota (não incluída no pacote e de licenciamento próprio). A dependência externa de utilitários do telefone era redundante: a própria biblioteca e utilitários já estão incluídos no `main.js`, por isso ela foi removida. GTM e Pixel Meta continuam acessando seus fornecedores por necessidade do tracking; não são mídias de layout. Metadados/links de SEO ainda contêm a URL antiga até definição de domínio.

**Formulários:** continuam com `data-webhook-url=""` individual em cada `index.html`. Não há integração ativa. Não marcar como concluído até testar o envio real e o CRM. O webhook direto no navegador necessita política CORS compatível.

**Responsividade:** revisão estrutural das folhas e renderização em 320, 390, 768 e 1366 px, com ajuste específico abaixo de 360 px para evitar corte horizontal de conteúdo; a execução completa dos scripts e o teste na URL final permanecem para o QA em produção. O menu, máscaras e a submissão precisam ser conferidos com a página online antes da desativação.

## Roteamento
- `/serv_societ_docs/` — Licenciamento e Alvarás
- `/paralegal/` — BPO / Gestão Paralegal
- `/` — redireciona para a primeira LP

## Checklist do pedido
- [x] Ambas LPs em pastas independentes, no mesmo repositório
- [x] Mídias do layout (imagens e SVGs inline) movidas/repontadas para assets locais
- [x] Fallbacks externos de imagens substituídos por assets exportados
- [x] HTML, CSS, scripts e arquivos revisados para dependências de mídia
- [x] Removida requisição CDN redundante da biblioteca telefônica
- [x] GTM compartilhado `GTM-TM6NCR6K` preservado em ambas as LPs
- [x] Pixel Meta `1595571945071289` preservado nas duas LPs
- [x] Campos dos formulários e webhooks independentes preservados
- [ ] Teste funcional de menu, formulários e imagem no domínio online Vercel
- [ ] Webhooks reais fornecidos/instalados em cada HTML
- [ ] Integração CRM testada por envio real
- [ ] GT confirmar Amplitude, GTM e eventos/pixels em produção
- [ ] Definição do domínio final, URL canonical/SEO e DNS
- [ ] Aprovação final antes de desligar conta GreatPages


---

# Migração — Licenciamento e Alvarás + BPO → Vercel (V2)

Projeto estático único para GitHub/Vercel. Layout, copy, imagens, formulários, máscaras e mensagens originais foram preservados, com o envio de formulários preparado para webhooks **individuais** (sem API central ou variáveis de ambiente).

## Identificação confirmada nos arquivos

| LP | Rota | Título original | Formulários | GTM original | Pixel Meta original |
|---|---|---|---:|---|---|
| Licenciamento e Alvarás | `/serv_societ_docs/` | BPO Paralegal - Serviços Empresariais | 1 | GTM-TM6NCR6K | 1595571945071289 |
| BPO / Gestão Paralegal | `/paralegal/` | BPO Paralegal - Gestão Paralegal para Empresas | 1 | GTM-TM6NCR6K | 1595571945071289 |

**GTM:** carregamento via JavaScript original em `assets/js/main.js` e `noscript` no HTML. Não foi instalada uma segunda cópia, pois o mesmo ID já estava ativo na configuração das duas LPs. O código informado na task não é uma implementação independente de GTM diferente da que já existe. Validar publicamente via Tag Assistant.

**Amplitude:** não encontrado nos arquivos HTML, JS ou CSS disponíveis. Pode existir como tag disparada por dentro do GTM, inacessível a esta análise estática; responsável GT deve confirmar. **Não foi instalada uma instância nova.**

**Pixel Meta:** ID 1595571945071289, eventos `PageView` e `Lead` mantidos no JS exportado. GT deve confirmar disparos/deduplicação depois de publicar.

## Webhook: instalar **diretamente em cada formulário**, de modo independente

Existe um formulário em cada LP. Nada foi configurado ou disparado para webhooks reais nesta V2.

1. No arquivo `serv_societ_docs/index.html`, procure a tag `<form ... class="... e_formulario ..." data-webhook-url="">` e cole a **URL HTTPS do webhook da LP Licenciamento e Alvarás** entre as aspas de `data-webhook-url`.
2. No arquivo `paralegal/index.html`, procure a tag semelhante e cole a **URL HTTPS do webhook da LP BPO**.
3. Mantenha os campos e opções existentes. O script `assets/js/main.js` da própria LP manda o JSON com `campos`, `elemento`, `eid` e dados de origem/URL ao webhook correspondente.
4. O envio só mostra mensagem de sucesso e dispara a conversão de `Lead` depois de resposta HTTP de sucesso. Se o webhook estiver em branco ou a requisição falhar, o usuário verá um erro e não verá confirmação falsa.
5. Para webhook externo chamado diretamente pelo navegador, o servidor precisa aceitar requisições **CORS**; como o POST usa JSON, pode ser necessário permitir **OPTIONS (preflight)** e responder com `Access-Control-Allow-Origin`. Se o destino não permitir CORS, será necessário mudar para um proxy server-side. URLs inseridas no HTML serão visíveis publicamente; avalie medidas antispam e privacidade.

**Não existe mais `api/conversion.js` ou `LEADS_WEBHOOK_URL`: foi removida a API compartilhada da versão anterior conforme solicitado.**

## Publicar na Vercel

1. Crie um único repositório e envie **o conteúdo do ZIP** diretamente para a raiz, mantendo as duas subpastas.
2. Vercel → New Project → importe o repositório → Framework Preset: **Other**, sem build/output personalizado; Root Directory: `./`.
3. Acesse `/serv_societ_docs/` e `/paralegal/`. A rota `/` redireciona para `/serv_societ_docs/`.
4. Quando os webhooks reais forem fornecidos, cole cada URL no seu respectivo HTML, faça deploy e realize envios completos de teste.
5. Configure o domínio final com permissão de gerenciar DNS. Não é garantido que um domínio `great.app.br` controlado pelo GreatPages possa ser apontado à Vercel.
6. Revisar canonical, metatags sociais e JSON-LD ainda referentes às URLs antigas quando o domínio definitivo estiver conhecido.

## Checklist de entrega e pendências

### Conferência por arquivo (concluída)
- [x] LPs identificadas corretamente pelos títulos, descrições e conteúdo
- [x] ZIP único com 2 pastas e arquivos locais
- [x] Cópia de GTM-TM6NCR6K encontrada nas duas LPs, mantida sem duplicação
- [x] Pixel Meta 1595571945071289 encontrado e mantido nas duas LPs
- [x] Formulário de cada LP identificado e preservado (nome, empresa, e-mail, telefone, opções)
- [x] Preparação de webhook individual por formulário, sem API central
- [x] Página de obrigado: nenhuma URL configurada; mensagem original de sucesso mantida
- [x] Links para WhatsApp: **não foram localizados**; CTAs levam aos formulários internos. Campo Telefone/Whatsapp presente.
- [x] Amplitude: ausência constatada nos arquivos exportados (não instalado automaticamente)

### A validar fora do ZIP (pendente)
- [ ] Colar webhook real, separado em cada LP, validar CORS e testar ponta a ponta até CRM
- [ ] Validar visual desktop e mobile comparando com originais publicados
- [ ] Conferir logo mobile (fallback de imagem 0.png para 1.png nos exports originais)
- [ ] Garantir que nenhuma imagem de fallback dependa do GreatPages antes do desligamento
- [ ] Confirmar com GT se o GTM compartilhado é intencional; verificar tags Amplitude, pixels e acionamentos internamente no contêiner
- [ ] Validar GTM, Meta PageView/Lead e eventos de conversão no navegador com Tag Assistant/Pixel Helper
- [ ] Confirmar domínio final/DNS e corrigir canonical/SEO/links
- [ ] Aprovação e aceite da equipe GT e cliente; só então desativar a unidade GreatPages

## Notas
- O export original inclui dependências JavaScript e HTML do GreatPages, mantidas por fidelidade ao layout. As principais mídias estão localizadas em `assets`, mas algumas URLs de fallback ainda referenciam domínios do GreatPages.
- A LGPD exige que o consentimento e as mensagens de privacidade continuem adequados; o aviso de cookie original foi preservado.
- Não é correto declarar conversões como funcionando até testes reais no ambiente final.
