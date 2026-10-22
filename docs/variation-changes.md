# Jo Modas Kids — inclusão, estoque e remoção de tamanhos

Implementação no projeto original:
`C:\Users\edils\Documents\Codex\2026-10-07\quero-que-voc-implemente-integralmente-o\outputs\catalogo`.

## Uso

1. Abra um produto e selecione uma cor.
2. Na seção Tamanhos, use **+ Adicionar**. Preencha tamanho (por exemplo, `27/28`) e quantidade inicial. A cor já vem selecionada.
3. Tente adicionar o mesmo tamanho na mesma cor: o formulário deve informar a duplicidade. A mesma numeração em outra cor é permitida.
4. Toque em um tamanho para **Editar estoque** ou **Remover tamanho**.
5. A remoção mostra explicitamente tamanho e cor; **Cancelar** preserva a variação, **Remover** salva a revisão.
6. Recarregue a página: a mudança deve permanecer. Confira os totais da cor e do produto e expanda **Histórico dos tamanhos**.
7. Na conferência, exporte CSV e JSON. CSV contém estoque, variações atuais e histórico; JSON inclui também variações estruturadas e registros de alterações com autor e data.
8. Simule indisponibilidade do Supabase: o catálogo continua disponível, as ações de tamanhos ficam indisponíveis e a exportação cancela caso não consiga buscar as revisões atuais. Use **Tentar novamente** após a recuperação.

## Persistência e decisões

- O JSON e a planilha base permanecem intactos. A leitura combina fotos, correções de nomes já existentes e as novas revisões de variações.
- Tamanhos compostos são strings únicas. Aceita-se o formato já usado pelo catálogo: até três dígitos, com um segundo grupo opcional após `/`.
- Estoque deve ser inteiro entre zero e 2147483647. Duplicados são validados no produto exibido, por cor, antes da gravação.
- `product_variation_changes` guarda eventos imutáveis `added`, `updated` e `removed`, referência, SKU pai, cor, tamanho, estoque, SKU da variação, usuário e timestamp do servidor. Variações novas recebem SKU técnico `manual:<UUID>`; esse SKU não é uma nova referência comercial.
- A RPC `record_variation_change` usa `SECURITY INVOKER`. O trigger autentica, fixa autor/data e compara a última revisão esperada sob trava de transação para detectar concorrência. Não há `service_role` no frontend.
- RLS mantém o acesso compartilhado da conferência existente: leitura pública e escrita por identidades do Supabase Auth, inclusive as sessões anônimas já utilizadas pelo projeto. Não foi introduzida exigência de email/senha nem isolamento por usuário que impediria a colaboração existente.
- Clientes não têm permissão para editar ou apagar eventos antigos. A remoção é um evento, não um DELETE.
- As correções antigas de nomenclatura continuam funcionando nas variações sem novos eventos. No editor antigo, variações já revisadas ficam bloqueadas para renomeação e explicam que estoque e remoção são feitos tocando no tamanho. Isso impede conflito entre o sistema antigo de renomeação e o histórico novo.
- Histórico é carregado com paginação. Falha no carregamento não derruba o catálogo; mantém os últimos dados disponíveis na sessão, com aviso de somente leitura. Escritas só atualizam a interface após confirmação do servidor.
- As exportações buscam as revisões de variações novamente antes de gerar o arquivo e cancelam em caso de falha.

## Migration e situação do banco

Migration criada pelo Supabase CLI:
`supabase/migrations/20261022142533_variation_changes.sql`.

Também há uma cópia SQL em `supabase/variation-changes.sql`. Execute **uma só** das cópias; elas representam a mesma migration.

A migration `variation_changes` foi aplicada em 22/10/2026 ao projeto remoto `jo-modas-kids-catalogo` (`lmdzgxqdygpsqtkcokaa`), após a retomada do banco. Foram comparados os checksums completos antes e depois: os 43 registros de conferência e 55 registros de fotos ficaram idênticos; a tabela antiga de tamanhos permaneceu vazia. Nenhum registro existente foi alterado ou excluído.

Em novos ambientes, aplique a migration pelo processo de deploy do Supabase ou execute a cópia SQL no SQL Editor do projeto correto. Ela cria tabela, índice, trigger, RPC, grants e políticas RLS em uma transação. Nenhuma tabela existente é removida ou alterada. Depois consulte:

```sql
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename='product_variation_changes';
select policyname, roles, cmd from pg_policies
where schemaname='public' and tablename='product_variation_changes';
select id, product_reference, color, size, action, stock, user_id, created_at
from public.product_variation_changes order by id desc limit 20;
```

Sem a migration, a nova edição permanece em somente leitura. O workflow existente publica o site no GitHub Pages ao receber o código na branch main.

## Arquivos alterados

- `src/services/variationChanges.ts`: tipos dos eventos, validação, leitura paginada, RPC, composição do catálogo e histórico.
- `src/components/VariationDialog.tsx`: modal de inclusão, ações, estoque e confirmação de remoção.
- `src/components/ProductVariants.tsx`: botão discreto e ação ao tocar no tamanho.
- `src/components/ProductSizeEditor.tsx`: proteção de nomenclatura para variações já revisadas.
- `src/hooks/useProducts.ts`: carregamento, modo somente leitura e aceitação das revisões confirmadas.
- `src/pages/ProductPage.tsx`: integração com cor selecionada, mensagens e histórico.
- `src/pages/ReviewDashboardPage.tsx`: exportação com revisões atualizadas e dados estruturados.
- `src/utils/csvExport.ts`: estoque, variações e histórico no CSV.
- `src/types/product.ts`, `src/App.tsx`, `src/styles.css`: tipos, integração e estilos compatíveis com o layout existente.
- `supabase/migrations/20261022142533_variation_changes.sql` e `supabase/variation-changes.sql`: schema, RPC e RLS.
- `tests/variationChanges.test.ts`: composição, imutabilidade do catálogo, remoção, reinclusão, estoque, duplicados e exportação.
- `tests/e2e/catalog.spec.ts`: backend simulado ampliado, novos fluxos e adaptação do teste antigo ao menu de tamanhos.

## Validação

- 13 testes de unidade/dados passaram, incluindo reconciliação da planilha com o JSON base.
- TypeScript e build Vite passaram. A importação que regrava o JSON estático não foi executada; o build foi feito diretamente, preservando o catálogo original.
- PostgreSQL local: schema/RPC, RLS de anon/authenticated, inclusão/estoque/remoção/reinclusão, conflito, quantidade negativa, proibição de UPDATE e DELETE e autoria validaram.
- Playwright: os 25 cenários passaram na execução completa final (2,1 minutos), incluindo os novos fluxos e as regressões de fotos, conferência e navegação.
- Ambiente: `http://127.0.0.1:5174`, Chromium, desktop 1440px e mobile 390px. Browser plugin indisponível; usado Playwright existente. Fluxo novo sem exceções JavaScript; screenshots do modal capturadas nos dois tamanhos. Falhas HTTP deliberadas pertencem aos testes de indisponibilidade.
- Banco remoto: migration aplicada, RLS habilitada e RPC validada em uma transação revertida, sem deixar produtos de teste. Os advisors mantêm alertas sobre sessões anônimas e proteção de senhas já existentes; as configurações de acesso anteriores foram preservadas.

Com dependências instaladas, execute na raiz do projeto:

```sh
node --import tsx --test tests/*.test.ts
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test
```

O ZIP entregue contém o código do projeto e as migrations, sem `.env`, credenciais, `.git`, dependências ou arquivos temporários. Configure as variáveis públicas conforme `.env.example` ao usar a cópia.
