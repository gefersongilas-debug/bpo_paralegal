# Auditoria de performance — V16

## Alterações

- Removidos 6.680.803 bytes de JavaScript contendo uma segunda cópia em base64 do PDF e 32.820 bytes da miniatura não utilizada. A cópia base64 já era excluída do build V15, portanto esta remoção reduz o pacote de distribuição, não o peso inicial da página publicada.
- PDF original preservado byte a byte (5.010.582 bytes). Requisitado somente por clique no botão. Content-Disposition attachment preservado na configuração Vercel e na prévia HTTP.
- Quatro imagens WebP otimizadas: de 227.582 para 103.558 bytes (54,5% de redução). Mantidos os recortes e a composição; resolução e compressão ajustadas.
- Preload condicional de imagens de fundo e prioridade alta da fotografia da hero; o navegador recebe somente a imagem correspondente ao viewport.
- Poppins com `display=swap`, preconnect e folha externa não bloqueante. Fonte alternativa durante o carregamento; sem arquivos de fontes adicionais.
- Holofote: movimento do cursor sob demanda, movimento ambiente a 12,5 fps, somente cards visíveis, pausa em abas ocultas, formulário aberto ou movimento reduzido. Leituras de geometria agrupadas antes das escritas.
- Narrativa: cálculo de dimensões no resize, caracteres criados quando a cena é ativada, alterações apenas nos caracteres que mudaram, desfoque desativado quando zerado. Ajustada a duração da entrada da headline (0,85s) e foto (1,1s), mantendo foco e escala. O formulário mantém o palco fixo e barra contínua. Glassmorphism mais leve no mobile.
- Motor nativo como padrão; GSAP continua disponível via USE_GSAP=1. Não há download de GSAP/ScrollTrigger no build padrão. Cache de CSS/JS/imagens com versão de URLs e regras Vercel.
- Mantidos SEO, acessibilidade, segurança, formulário, UTM e rastreamento A/B. Metadados dependentes de domínio são gerados pelo build quando configurado.

## Estimativa de peso dos recursos próprios iniciais

Valores em kB decimais; HTML, CSS e JS comprimidos com gzip local e imagens WebP pelo tamanho real. Não são medições de transferência nem pontuação do Lighthouse. Excluem fontes externas, GSAP opcional, cabeçalhos, PDF, manifesto, ícones adicionais e scripts de terceiros.

| Página | V15 (kB) | V16 (kB) | Redução |
|---|---:|---:|---:|
| A desktop | 96,7 | 58,7 | 39% |
| A mobile | 41,5 | 30,8 | 26% |
| B desktop | 110,3 | 62,2 | 44% |
| B mobile | 72,2 | 46,4 | 36% |

## Validação

- Build sem domínio e com domínio fictício para verificar canonical/sitemap; referências locais verificadas; sintaxe JS validada.
- Chromium: HTML/CSS/JS carregados em memória em 1440 × 900 e 390 × 844. Layout sem overflow, texto reversível, quatro etapas do formulário, barra de progresso e abertura/fechamento sem deslocamento verificados. A navegação HTTP/file:// no Chromium e Google Fonts foram bloqueados pelo ambiente; teste com fonte de contingência. GSAP opcional não testado.
- Servidor de prévia local: teste HTTP separado das quatro rotas, cabeçalho de download, hash do PDF e endpoint de demonstração. Não é um teste do webhook real ou da infraestrutura Vercel.
- PageSpeed Insights/Lighthouse oficial não executado. Falta URL pública. Testar as duas rotas, Mobile e Desktop, após publicação.

## Alvos para validação pós-publicação

LCP até 2,5s; CLS até 0,1; INP até 200ms (dados de campo no 75º percentil). Não são resultados medidos. Acompanhar TBT no laboratório, evitar adicionar pixels síncronos ou scripts de terceiros sem necessidade, manter imagens dimensionadas e revisar as recomendações do relatório PageSpeed.
