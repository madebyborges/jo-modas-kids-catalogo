# Jo Modas Kids — Catálogo para Conferência

Aplicação React + TypeScript + Vite, estática, com HashRouter. O catálogo é gerado exclusivamente da planilha real; somente as revisões ficam no Supabase. Não há backend próprio, cadastro público ou produtos demonstrativos.

## Executar

Requer Node.js 22.12+ (ou 24+) com npm. Na pasta deste projeto:

```bash
npm install
npm run import:data
npm run validate:data
npm run dev
```

Abra http://127.0.0.1:5173/. Para testar no celular na mesma rede: `npm run dev -- --host 0.0.0.0` e use o IP do computador; autorize o firewall somente na rede privada. A URL local não funciona no WhatsApp fora dessa rede; para isso publique no Pages.

```bash
npm run build
npm run preview
npm test
npx playwright install chromium
npm run test:e2e
```

O build importa novamente o XLSX antes da compilação. `dist/` é o site publicável. Não abra index.html diretamente por file://; use dev, preview ou hospedagem HTTP.

## Estrutura

```text
data-source/                 XLSX original, cópia enriquecida e fontes das imagens
scripts/workbook.ts          leitura XLSX/OpenXML, compatível com namespaces
scripts/importProducts.ts    agrupamento, normalização e alertas
scripts/validateData.ts       reconciliação de todas as linhas com o XLSX
public/data/products.json    catálogo estático, campos originais e hash da fonte
public/data/company.json     tributação e notas gerais da planilha
src/components/              cards, galeria, variações, revisão e dados
src/pages/                   catálogo, produto, configurações, dashboard, problemas, 404
src/hooks/                   produtos, filtros e sessão/revisões
src/services/                cliente Supabase e persistência
src/types/                   contratos TypeScript
src/utils/                   parser, moeda/data e exportação CSV/JSON
supabase/schema.sql          tabela, constraints, índices, trigger, RLS e grants
tests/                       reconciliação, casos de fronteira e testes de navegador
.github/workflows/deploy.yml publicação automática
.env.example                 variáveis públicas sem credenciais
```

## Dados e regras

A planilha contém 46 modelos, 407 variações, 552 unidades e 453 SKUs únicos. Estes números são resultados da importação, não constantes usadas na aplicação. Os pais (`V`) se relacionam aos filhos (`S`) por `Código do pai`. Apenas pais aparecem no catálogo. Cada SKU filho aparece na cor do respectivo pai. Uma cor ausente é apresentada como não informada, sem inventar uma cor.

Todos os 64 campos da aba de importação são preservados nos objetos `source` do pai e dos filhos, inclusive campos nulos. Dados preenchidos podem ser expandidos na interface. Observações originais são mantidas sem reescrita. `Revisao_Marketplaces` também é preservada por referência; suas categorias são explicitamente sugestões, já que a coluna Categoria do cadastro está vazia. `LEIA_ANTES` e `Tributacao_Olist` ficam em company.json e na página Problemas.

Os pais não têm preço próprio nesta fonte. O preço exibido é o menor preço dos filhos, e a faixa é exibida quando há diferença; cada SKU mostra seu próprio preço. O preço original do pai continua nulo em `source`. A importação não divide tamanhos comerciais com `/`. `25/36` permanece exatamente igual, com alerta. `2580.11` permanece separado de `2580.110`, com alerta.

A base ativa `olist_cadastro_mestre_imagens_por_cor.xlsx` preserva a planilha enviada e acrescenta somente links em células de imagem vazias. São 38 modelos com links, dos quais 36 exibem fotos compatíveis. Foram confirmadas fotos específicas para 38 das 52 opções de cor e fotos gerais para cinco modelos sem cor cadastrada. As 14 opções restantes exibem alerta de foto não confirmada. A nova pesquisa de 08/10/2026 aplicou 15 fotos em sete cores, incluindo Branco Capivara da 2745.103; as 15 novas URLs carregaram na verificação de navegador. A busca posterior por descrição confirmou mais cinco fotos de 2305.2081 Ouro Rosado, também verificadas no navegador. GTIN e origem continuam ausentes nos 46 modelos; NCM, estoque, preços, referências, tamanhos, descrições e observações permanecem intactos.

`npm run validate:data` verifica pai válido de todos os filhos, pais e SKUs únicos, contagens e somas, estoque por cor e total, valores de preços, tamanhos exatos, observações e igualdade de todos os campos originais. O hash SHA-256 impede validar um JSON desatualizado. Erros críticos de estrutura/estoque/formato interrompem o importador para não publicar um catálogo parcial. Alertas comerciais não são corrigidos.

Para atualizar: substitua somente `data-source/olist_cadastro_mestre_com_links_imagens.xlsx`, execute importação, validação e build. Referências e SKUs são identidades: se mudarem, as revisões antigas não são automaticamente transferidas. Revise ou migre conscientemente no banco. Referências duplicadas impedem a importação porque as revisões têm referência única.

## Supabase — configuração exata

1. Crie um projeto Supabase, podendo escolher o plano gratuito. Nenhuma credencial foi criada ou incluída aqui.
2. No SQL Editor, abra e execute **todo** `supabase/schema.sql`. O arquivo cria a tabela `public.product_reviews`, constraints (inclusive comentário obrigatório), índices, trigger, RLS e grants. É reaplicável sobre este mesmo schema; não é migração de schemas externos diferentes.
3. Em Authentication → Sign In / Providers, habilite **Anonymous Sign-Ins**. Permita a criação de usuários necessária a esse provedor. Não é necessário configurar email/senha ou criar contas da cliente.
4. Se já executou o schema antigo, execute `supabase/migrate-no-login.sql` para permitir as sessões anônimas. O schema completo já inclui estas políticas para instalações novas.
5. A cliente pode ajustar seu nome em **Configurações**, sem login. Essa preferência fica neste navegador; revisões continuam exclusivamente no Supabase. O nome inicial é Visitante.
6. Em Authentication → URL Configuration, configure Site URL com a URL publicada e inclua `http://127.0.0.1:5173` nos redirects locais se for usar futuros fluxos de recuperação. O acesso automático não utiliza redirects de autenticação.
7. Em Project Settings → API/Data API, copie a URL do projeto e a chave pública `anon` (ou publishable equivalente). Não copie service_role, secret key ou senha do banco.
8. Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
VITE_BASE_PATH=./
```

9. Reinicie `npm run dev` após alterar o ambiente. Variáveis Vite são incorporadas ao build; um deploy precisa ser reconstruído após a troca de chave pública.
10. Abra diretamente o catálogo, aprove um produto e recarregue. Verifique o registro no Table Editor. Solicite correção com comentário, confira o dashboard e exporte. Repita em outro navegador para verificar o compartilhamento.

### Modelo de segurança

O catálogo JSON é público. A aplicação reutiliza a sessão do navegador ou cria automaticamente um usuário anônimo com `signInAnonymously()`. A cliente não precisa informar email/senha. **Qualquer pessoa que acessar o catálogo pode consultar e atualizar as revisões compartilhadas**, conforme o acesso sem login solicitado. O nome exibido identifica a conferência, sem comprovar identidade pessoal.

RLS continua habilitado. A role `anon` (somente chave pública, sem sessão) não tem acesso à tabela; sessões automáticas recebem a role `authenticated`. O trigger grava `auth.uid()` e as datas, a identidade do produto permanece imutável e nenhuma exclusão é permitida. Não há service role no frontend.

LocalStorage armazena apenas a sessão do SDK e a preferência de nome. Revisões continuam exclusivamente no Supabase. Sem configuração ou durante falhas, o catálogo abre e informa a indisponibilidade; não há aprovação offline simulada. Exportações consultam novamente a API.

Teste real após configurar: requisição só com chave pública deve ser negada; token de sessão anônima deve permitir leitura/escrita; correção vazia deve falhar e campos de identidade não podem mudar. Essas verificações dependem do projeto externo.

Veja a documentação oficial de [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous).

## GitHub Pages

1. Crie um repositório e coloque **o conteúdo desta pasta** na raiz, incluindo a planilha original, package-lock.json e `.github/`. Não coloque a pasta outputs/catalogo como subpasta no repositório sem adaptar o workflow.
2. Faça commit e push na branch `main`.
3. Em Settings → Pages, selecione Source → **GitHub Actions**.
4. Em Settings → Secrets and variables → Actions, crie os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, usando apenas valores públicos permitidos. Sem eles o catálogo é publicado, com revisão indisponível.
5. `VITE_BASE_PATH` é opcional, como variável de Actions. Padrão `./` permite raiz e subpasta. Pode definir `/nome-do-repositorio/`; para domínio próprio ou repositório usuario.github.io use `/`.
6. Aguarde o workflow “Publicar catálogo no GitHub Pages”. Ele executa `npm ci`, importação, validação, testes de dados, build, upload e deploy, falhando se qualquer etapa falhar. O job usa Node 22.
7. Abra a URL exibida no deploy, normalmente `https://USUARIO.github.io/REPOSITORIO/`. Rotas usam `#/produto/2656.100`, `#/revisao` e `#/configuracoes`, funcionando também ao recarregar e abrir pelo WhatsApp.
8. Configure essa URL no Supabase e valide acesso automático/gravação no domínio final.

Não há URL pública criada nesta entrega: dependemos do repositório/conta e configuração externos. O build relativo e rotas foram verificados em uma subpasta por teste local de produção.

## Testes e limites da validação

`npm test` verifica a planilha real e os parsers. `npm run test:e2e` inicia outro servidor na porta 5174 com chave de teste e **intercepta a API Supabase local**, sem tocar serviço real. Os testes cobrem busca por filho, agrupamento, cores/tamanhos, filtros, ordenação, sessão automática, aprovação, comentário obrigatório, releitura/persistência simulada, dashboard, CSV/JSON recentes, indisponibilidade e mobile. Alteração de imagens para testar fallback ocorre apenas numa resposta interceptada no navegador, nunca no catálogo entregue. Esses testes não provam execução do SQL, políticas ou persistência em um Supabase real.

O Supabase real foi configurado em 07/10/2026: projeto lmdzgxqdygpsqtkcokaa, região São Paulo, schema aplicado, RLS ativo e Anonymous Sign-Ins habilitado. A conexão está no .env local ignorado pelo Git. Autenticação, leitura, gravação e leitura por outra sessão passaram em testes reais; o produto testado voltou a Não revisado. Correção sem observação foi rejeitada pelo banco, e acesso sem sessão foi bloqueado. A publicação no GitHub Pages continua pendente; configure os secrets do workflow com a URL e chave pública do .env. O sistema não edita o catálogo pela revisão: correções são solicitações; ajustes devem ser feitos na planilha e reimportados.

Referências de implementação: [Supabase Auth](https://supabase.com/docs/guides/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [publicação Vite](https://vite.dev/guide/static-deploy.html).


Na página desktop do produto, as três ações de conferência ficam fixas no rodapé. Cada ação abre um modal, preservando a rolagem; Escape ou o botão Fechar cancela, e salvar fecha o modal após confirmação do Supabase. Correções exigem observação.



## Fotos pesquisadas e associação por cor

A planilha original `data-source/olist_cadastro_mestre_com_links_imagens.xlsx` permanece intacta. `data-source/image-sources.json` registra referência, cor exata da planilha, nome da cor na loja, página de origem, URLs, decisões rejeitadas e pendências. Não se usam fotos de produtos relacionados, de referências semelhantes ou cores não confirmadas. Modelos sem cor cadastrada mantêm fotos gerais sem inventar sua cor.

A galeria principal acompanha a cor selecionada e começa pela primeira cor com imagem confirmada. Selecionar uma cor sem foto mostra o aviso correspondente, sem aproveitar a imagem de outra cor. As URLs originais sem associação continuam disponíveis como links de conferência em uma seção recolhida; as fotos não são renderizadas. Cards, dashboard e filtro de imagens usam exclusivamente fotos associadas para produtos com cores cadastradas. A interface mantém o rodapé de conferência fixo no desktop e o modal de revisão.

Veja `docs/IMAGENS_POR_COR.md`, `docs/enriquecimento-imagens.json` e `docs/verificacao-imagens-por-cor.json`. Para reaplicar o enriquecimento após atualizar as fontes: instale Python e openpyxl, execute `python scripts/enrichImages.py`, depois `npm run import:data` e `npm run build`. A execução normal do aplicativo e o GitHub Actions usam a planilha enriquecida já entregue e não precisam de Python. Confira o manifesto antes de reaplicar sobre uma base diferente. Fotos continuam hospedadas externamente e usam fallback quando indisponíveis.


A revisão de 08/10/2026 bloqueou o fallback de fotos gerais incompatíveis, incluindo Bege com foto Rosa, Branco Capivara com foto de gatinho e Branco Off Glitter com foto Preto. O alerta `mismatched_image` explica as divergências. Veja `docs/REVISAO_FOTOS.md` e `data-source/image-audit.json`. Fotos compatíveis recuperadas da base: 2861.216 Preto c/ Marrom e 2609.233 Azul Marinho (somente a segunda foto).

## Catálogo publicado

Acesse: https://madebyborges.github.io/jo-modas-kids-catalogo/

Repositório: https://github.com/madebyborges/jo-modas-kids-catalogo

As conferências são compartilhadas e salvas no Supabase, com sessão automática sem email/senha. As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas nos secrets do GitHub Actions. Atualizações enviadas para main publicam automaticamente no Pages.

