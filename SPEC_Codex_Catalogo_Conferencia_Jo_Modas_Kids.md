# SPEC — Sistema de Conferência de Catálogo Jo Modas Kids

## 1. Objetivo

Desenvolver um pequeno sistema web para conferência e validação de produtos antes da importação definitiva para o Olist e posterior publicação no Mercado Livre e Shopee.

O sistema será utilizado pela cliente para revisar visualmente cada produto, conferir dados comerciais, variações, tamanhos, cores, estoque, informações fiscais, imagens e observações, e registrar se o cadastro está correto ou precisa de ajustes.

A aplicação deve ser simples o suficiente para uma pessoa sem conhecimento técnico usar pelo navegador.

O sistema será hospedado no GitHub Pages.

O GitHub Pages será responsável apenas pelo front end estático.

As revisões da cliente devem ser salvas online no Supabase.

---

# 2. Arquivo fonte

Usar como fonte principal de dados:

`olist_cadastro_mestre_ncm_cfop.xlsx`

Antes de desenvolver a interface, analisar completamente a estrutura da planilha.

A planilha contém produtos pai e produtos filhos.

## 2.1 Produto pai

Um produto pai representa um modelo agrupador.

Identificação esperada:

```text
Tipo do produto = V
```

O pai possui um SKU próprio.

Exemplo:

```text
P25006101
```

## 2.2 Produto filho

Um produto filho representa uma variação vendável.

Identificação esperada:

```text
Tipo do produto = S
```

O relacionamento é feito por:

```text
Código do pai = SKU do produto pai
```

Exemplo:

```text
SKU filho:
25006101DOURADOT26

Código do pai:
P25006101
```

## 2.3 Variações

A coluna `Variações` pode conter:

```text
Cor:Dourado||Tamanho:26
```

ou:

```text
Tamanho:27
```

O sistema precisa interpretar corretamente essas informações.

---

# 3. Regra central de agrupamento

Nunca exibir cada SKU filho como um produto independente no catálogo principal.

O catálogo precisa exibir apenas o produto pai.

Estrutura conceitual:

```text
Produto
  Cor
    Tamanho
      SKU
      estoque
```

Exemplo:

```text
Tênis Casual Infantil Molekinha
Ref. 25006.101

Dourado
  26
  28
  29
  30

Prata
  29
  30
  31
  32
```

Cada tamanho continua ligado ao SKU filho correspondente.

---

# 4. Tecnologias obrigatórias

Utilizar:

```text
React
TypeScript
Vite
React Router
CSS moderno
Supabase
Lucide Icons
```

Pode utilizar uma biblioteca pequena de componentes, desde que não gere dependência desnecessária.

Evitar frameworks pesados.

Não utilizar Next.js.

Não criar servidor próprio.

A aplicação deve funcionar como SPA estática no GitHub Pages.

---

# 5. Arquitetura

Arquitetura esperada:

```text
Planilha XLSX
      ↓
Script de importação
      ↓
JSON normalizado
      ↓
React
      ↓
GitHub Pages

Revisões da cliente
      ↓
Supabase
```

O catálogo de produtos deve continuar estático.

O Supabase deve armazenar apenas dados que mudam durante a conferência.

Não armazenar a planilha inteira no banco.

---

# 6. Estrutura sugerida do projeto

```text
/
├─ public/
│  └─ data/
│     └─ products.json
│
├─ scripts/
│  └─ importProducts.ts
│
├─ src/
│  ├─ components/
│  │  ├─ ProductCard/
│  │  ├─ ProductGallery/
│  │  ├─ ProductVariants/
│  │  ├─ ProductTechnicalData/
│  │  ├─ ReviewStatus/
│  │  ├─ ReviewForm/
│  │  ├─ SearchBar/
│  │  ├─ Filters/
│  │  ├─ StatsCards/
│  │  └─ EmptyState/
│  │
│  ├─ pages/
│  │  ├─ CatalogPage.tsx
│  │  ├─ ProductPage.tsx
│  │  ├─ ReviewDashboardPage.tsx
│  │  └─ NotFoundPage.tsx
│  │
│  ├─ services/
│  │  ├─ supabase.ts
│  │  └─ reviews.ts
│  │
│  ├─ hooks/
│  │  ├─ useProducts.ts
│  │  ├─ useReviews.ts
│  │  └─ useFilters.ts
│  │
│  ├─ types/
│  │  ├─ product.ts
│  │  └─ review.ts
│  │
│  ├─ utils/
│  │  ├─ productParser.ts
│  │  ├─ productValidation.ts
│  │  ├─ csvExport.ts
│  │  └─ formatters.ts
│  │
│  ├─ data/
│  ├─ App.tsx
│  └─ main.tsx
│
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
│
├─ .env.example
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
└─ README.md
```

---

# 7. Importação da planilha

Criar um comando:

```bash
npm run import:data
```

Esse comando deve:

1. Ler `olist_cadastro_mestre_ncm_cfop.xlsx`
2. Localizar a aba de importação de produtos
3. Ler todos os produtos
4. Identificar os produtos pai
5. Identificar todos os filhos
6. Relacionar filhos ao respectivo pai
7. Interpretar `Variações`
8. Agrupar por cor
9. Agrupar os tamanhos dentro de cada cor
10. Preservar SKU de cada variação
11. Preservar estoque individual
12. Somar estoque por cor
13. Somar estoque total
14. Copiar dados técnicos
15. Copiar observações
16. Copiar imagens disponíveis
17. Detectar possíveis inconsistências
18. Gerar JSON normalizado
19. Salvar em:

```text
public/data/products.json
```

Não fazer o navegador interpretar o XLSX em cada acesso.

A conversão deve acontecer no desenvolvimento e no processo de build.

---

# 8. Estrutura de dados

Criar tipos TypeScript semelhantes a:

```ts
type ProductReviewStatus =
  | "pending"
  | "approved"
  | "needs_correction";

interface ProductVariant {
  sku: string;
  size: string;
  color?: string;
  stock: number;
  price?: number;
}

interface ProductColor {
  name: string;
  stock: number;
  variants: ProductVariant[];
}

interface DataWarning {
  type: string;
  message: string;
  severity: "info" | "warning" | "error";
}

interface Product {
  parentSku: string;
  reference: string;
  supplierCode?: string;

  name: string;
  brand?: string;
  category?: string;

  price?: number;
  totalStock: number;

  description?: string;
  complementaryDescription?: string;

  ncm?: string;
  origin?: string;
  gtin?: string;
  unit?: string;

  status?: string;
  productType?: string;

  seoTitle?: string;
  seoDescription?: string;
  slug?: string;

  imageUrls: string[];

  colors: ProductColor[];

  observations?: string[];

  dataWarnings: DataWarning[];
}
```

Não é obrigatório usar exatamente esses nomes, mas a arquitetura deve manter a mesma clareza.

---

# 9. Tamanhos combinados

Numerações comerciais como:

```text
19/20
21/22
23/24
25/26
27/28
29/30
31/32
33/34
35/36
```

são um único tamanho comercial.

Nunca transformar:

```text
27/28
```

em:

```text
27
28
```

Preservar exatamente como está na planilha.

---

# 10. Dashboard principal

A página inicial deve ser um catálogo administrativo.

Título:

```text
Catálogo para Conferência
```

Texto de apoio:

```text
Revise os produtos antes da publicação no Olist, Mercado Livre e Shopee.
```

Mostrar indicadores:

```text
Total de modelos
Total de variações
Total de unidades
Produtos aprovados
Produtos com correção solicitada
Produtos ainda não revisados
Produtos com alertas
```

Os indicadores de revisão devem vir do Supabase.

---

# 11. Cards de produto

Cada produto pai deve aparecer como um card.

Mostrar:

```text
Imagem principal
Nome
Marca
Referência
Preço
Estoque total
Quantidade de cores
Quantidade de tamanhos
Status da revisão
Indicador de pendência
```

Status possíveis:

```text
Não revisado
Correto
Precisa corrigir
```

Os filhos não podem aparecer como cards independentes.

---

# 12. Pesquisa

Criar pesquisa em tempo real.

Permitir encontrar produto por:

```text
Nome
Referência
SKU pai
SKU filho
Marca
Cor
Tamanho
```

---

# 13. Filtros

Adicionar filtros por:

```text
Marca
Categoria
Cor
Status da revisão
Com alerta
Sem alerta
Com imagem
Sem imagem
```

Ordenação:

```text
Nome A-Z
Nome Z-A
Referência
Preço crescente
Preço decrescente
Maior estoque
Menor estoque
```

---

# 14. Tela de produto

Essa é a tela mais importante do sistema.

Criar experiência semelhante a uma página de produto de ecommerce, porém com informações administrativas.

Layout desktop:

```text
Galeria à esquerda
Informações à direita
```

No mobile:

```text
Galeria
Informações
Variações
Dados técnicos
Revisão
```

---

# 15. Galeria de imagens

Usar campos como:

```text
URL imagem 1
URL imagem 2
URL imagem 3
...
```

Se houver imagens válidas:

Mostrar galeria.

Se não houver:

Mostrar placeholder elegante:

```text
Imagem ainda não cadastrada
```

Caso uma imagem falhe:

Não quebrar o layout.

Usar fallback automático.

---

# 16. Informações principais

Mostrar:

```text
Nome
Marca
Referência
Preço
Estoque total
Descrição
Descrição complementar
```

---

# 17. Variações por cor

Se houver mais de uma cor, mostrar seleção de cor.

Exemplo:

```text
Dourado
Prata
```

Ao selecionar `Dourado`, mostrar somente os tamanhos daquela cor.

Exemplo:

```text
26
1 unidade

28
1 unidade

33
2 unidades
```

Também mostrar:

```text
Estoque da cor
Quantidade de tamanhos
```

Caso não exista cor cadastrada:

Mostrar diretamente os tamanhos.

---

# 18. Dados técnicos

Criar seção:

```text
Dados do cadastro
```

Mostrar sempre que existirem:

```text
SKU pai
Referência
Código do fornecedor
Marca
Categoria
NCM
Origem
GTIN
Unidade
Tipo do produto
Situação
Slug
Título SEO
Descrição SEO
```

Também pode mostrar outros campos úteis existentes na planilha.

Não exibir dezenas de linhas vazias.

Para campos importantes ausentes, pode mostrar:

```text
Não informado
```

---

# 19. Dados fiscais

Mostrar uma seção visual:

```text
Dados fiscais
```

Com:

```text
NCM
Origem
GTIN
Unidade
```

Também mostrar a informação global da configuração fiscal da Jo Modas Kids:

```text
Regime: MEI / SIMEI
CRT: 4
CFOP interno: 5.102
CFOP interestadual: 6.102
Regra Olist: ?.102
```

Esses dados globais podem vir de um arquivo separado:

```text
public/data/company.json
```

Não repetir esses dados dentro de todos os produtos no JSON se não for necessário.

---

# 20. Alertas de dados

Criar validações durante o import.

Detectar:

```text
SKU duplicado
Produto filho sem pai
Produto pai sem filhos
Preço ausente
NCM ausente
Marca ausente
Referência ausente
Estoque negativo
Variação mal formatada
Cor inconsistente
Tamanho inconsistente
Produto sem imagem
GTIN ausente
Origem ausente
```

Gerar:

```text
dataWarnings
```

Exemplo:

```json
{
  "type": "suspicious_size",
  "severity": "warning",
  "message": "Tamanho 25/36 precisa ser conferido."
}
```

---

# 21. Alertas conhecidos

Existem pelo menos dois casos que já precisam aparecer destacados.

## Referência 2580.11

É muito semelhante à referência:

```text
2580.110
```

Não alterar automaticamente.

Mostrar alerta:

```text
Referência precisa ser conferida.
Existe também o produto 2580.110.
```

---

## Referência 2656.100

Na cor Azul Marinho existe:

```text
25/36
```

Preservar exatamente como veio da planilha.

Não corrigir automaticamente.

Mostrar alerta:

```text
Tamanho 25/36 precisa ser conferido.
```

---

# 22. Supabase

O Supabase deve guardar somente as revisões.

Não armazenar toda a lista de produtos no banco.

Criar projeto Supabase utilizando plano gratuito.

---

# 23. Variáveis de ambiente

Criar:

```text
.env.example
```

Com:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Nunca usar:

```text
SUPABASE_SERVICE_ROLE_KEY
```

no front end.

Nunca publicar service role key no GitHub.

A chave anon pode ser utilizada no front end desde que as políticas RLS estejam configuradas corretamente.

---

# 24. Banco de dados

Criar tabela:

```sql
product_reviews
```

Estrutura sugerida:

```sql
create table product_reviews (
  id uuid primary key default gen_random_uuid(),

  product_reference text not null unique,
  parent_sku text not null,

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'needs_correction')),

  comment text,

  reviewer_name text,

  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Criar índice:

```sql
create index product_reviews_reference_idx
on product_reviews(product_reference);
```

---

# 25. Atualização automática de updated_at

Criar trigger para atualizar:

```text
updated_at
```

sempre que uma revisão for modificada.

---

# 26. Segurança no Supabase

Ativar:

```text
Row Level Security
```

Não deixar a tabela aberta sem política.

Como esta primeira versão será utilizada apenas para conferência simples por link, implementar uma estratégia segura e compatível com um projeto sem login complexo.

Preferência:

Criar autenticação simples para a cliente usando Supabase Auth.

Pode utilizar:

```text
Magic Link
```

ou:

```text
email e senha
```

O usuário precisa estar autenticado para alterar revisões.

Usuários autenticados podem:

```text
ler product_reviews
criar product_reviews
atualizar product_reviews
```

Usuários anônimos não podem alterar dados.

Se for necessário permitir leitura do catálogo sem login, tudo bem, pois o catálogo está no JSON do GitHub Pages.

A parte de revisão deve exigir login.

---

# 27. Login

Criar página simples de autenticação.

Pode usar:

```text
/review-login
```

ou uma modal.

Fluxo:

```text
Cliente abre o catálogo
↓
Pode visualizar produtos
↓
Ao tentar revisar
↓
Sistema pede login
↓
Cliente autentica
↓
Pode aprovar ou solicitar correção
```

Também pode exigir login desde o início se isso deixar a implementação mais consistente.

Não criar sistema de cadastro público.

---

# 28. Revisão de produto

Na página do produto criar bloco:

```text
Conferência
```

Botões:

```text
Está correto
Precisa corrigir
```

Status inicial:

```text
Não revisado
```

Se clicar:

```text
Está correto
```

salvar:

```text
status = approved
```

Se clicar:

```text
Precisa corrigir
```

abrir campo de comentário obrigatório.

Exemplos:

```text
A foto dourada está errada.

O preço correto é R$ 149,90.

Não existe tamanho 31.

A descrição precisa ser alterada.
```

Salvar no Supabase.

---

# 29. Feedback após salvar

Mostrar feedback visual:

```text
Revisão salva
```

Não recarregar a página inteira.

Usar atualização otimista quando fizer sentido.

Se houver erro:

```text
Não foi possível salvar a revisão.
Tente novamente.
```

---

# 30. Nome do revisor

A revisão deve registrar:

```text
reviewer_name
```

Se estiver usando Supabase Auth, o nome pode vir do metadata do usuário.

Caso não exista:

permitir definir nome no primeiro acesso.

---

# 31. Dashboard de conferência

Criar rota:

```text
#/revisao
```

Mostrar:

```text
Total de modelos
Aprovados
Precisam de correção
Não revisados
Percentual concluído
```

Adicionar barra de progresso.

Exemplo:

```text
32 de 46 produtos revisados
69,6%
```

---

# 32. Lista de pendências

Na tela de revisão mostrar rapidamente produtos com:

```text
Precisa corrigir
```

Exibir:

```text
Imagem
Referência
Nome
Comentário
Data da revisão
```

Permitir clicar e voltar para o produto.

---

# 33. Histórico simples

Sempre que a cliente atualizar uma revisão, atualizar o registro atual.

Não é obrigatório implementar histórico completo nesta primeira versão.

Mas organizar o código de forma que seja possível adicionar uma tabela:

```text
review_history
```

posteriormente.

---

# 34. Exportação

Mesmo utilizando Supabase, manter opção de exportação.

Adicionar:

```text
Exportar conferência
```

Gerar CSV contendo:

```text
Referência
SKU pai
Nome
Marca
Status
Comentário
Revisor
Data da revisão
```

Adicionar também:

```text
Exportar JSON
```

Os dados exportados devem usar os registros mais recentes do Supabase.

---

# 35. Interface

Criar uma interface administrativa profissional.

Referências visuais:

```text
Stripe Dashboard
Linear
Shopify Admin
```

Não copiar diretamente nenhuma interface.

Características:

```text
Minimalista
Muito espaço em branco
Tipografia clara
Cards limpos
Hierarquia forte
Sombras discretas
Bordas suaves
Boa densidade de informação
```

Não usar estética infantil.

Não usar neon.

Não abusar de gradientes.

---

# 36. Cores

Base:

```text
Branco
Cinza muito claro
Quase preto
```

Status:

```text
Verde = correto
Amarelo ou laranja = atenção
Vermelho discreto = erro
Cinza = não revisado
```

---

# 37. Responsividade

O sistema deve funcionar perfeitamente em:

```text
Desktop
Notebook
Tablet
Celular
```

A cliente pode abrir o link pelo WhatsApp no celular.

Priorizar boa experiência mobile.

---

# 38. Navegação

Utilizar `HashRouter` para evitar problemas de rota no GitHub Pages.

Exemplo:

```text
/#/
/#/produto/25006.101
/#/revisao
```

---

# 39. GitHub Pages

Configurar:

```text
vite.config.ts
```

para funcionar corretamente em repositório GitHub Pages.

Não assumir que o site será hospedado na raiz do domínio.

Permitir configuração por:

```text
base
```

---

# 40. GitHub Actions

Criar:

```text
.github/workflows/deploy.yml
```

Fluxo:

```text
checkout
setup node
npm ci
npm run import:data
npm run build
upload dist
deploy GitHub Pages
```

O workflow deve falhar caso:

```text
import:data
```

ou:

```text
build
```

falhe.

---

# 41. Planilha no repositório

Criar pasta:

```text
data-source/
```

Adicionar:

```text
data-source/olist_cadastro_mestre_ncm_cfop.xlsx
```

O script deve procurar a planilha nessa pasta.

Quando a planilha for substituída, basta executar:

```bash
npm run import:data
```

para atualizar o catálogo.

---

# 42. Comandos esperados

O projeto precisa suportar:

```bash
npm install
npm run import:data
npm run dev
npm run build
npm run preview
```

Opcionalmente:

```bash
npm run validate:data
```

---

# 43. Validação dos dados

Criar script separado ou integrado:

```text
validate:data
```

Ele precisa gerar resumo no terminal:

```text
Produtos pai: 46
Variações: 407
Estoque total: 552
Produtos com alertas: X
Produtos sem imagem: X
Produtos sem GTIN: X
Produtos sem origem: X
```

Não usar esses números como valores fixos.

Calcular tudo a partir da planilha.

---

# 44. Não alterar dados silenciosamente

Essa regra é obrigatória.

Se encontrar informação estranha:

Não corrigir automaticamente.

Exemplo:

```text
25/36
```

deve continuar:

```text
25/36
```

e receber warning.

A aplicação é uma ferramenta de conferência.

Não é uma ferramenta de correção automática.

---

# 45. Dados vazios

Não inventar:

```text
GTIN
EAN
Origem
Imagem
Peso
Dimensões
Categoria
NCM
```

caso não existam ou não tenham sido definidos na planilha.

Se estiver vazio:

mostrar como pendência quando for relevante.

---

# 46. Página de erros e dados incompletos

Criar uma área opcional:

```text
Problemas encontrados
```

Agrupar:

```text
Erros críticos
Alertas
Informações ausentes
```

Isso ajuda a validar o arquivo antes de enviar para Olist.

---

# 47. Persistência

Não usar localStorage como armazenamento principal das revisões.

Fonte oficial das revisões:

```text
Supabase
```

Pode usar localStorage apenas para:

```text
filtros
preferências visuais
cache temporário
```

Nunca considerar localStorage como fonte definitiva da aprovação da cliente.

---

# 48. Sincronização

Ao abrir o site:

1. carregar `products.json`
2. buscar revisões no Supabase
3. juntar ambos pelo campo:

```text
product_reference
```

ou:

```text
parent_sku
```

Preferir referência como chave funcional e parent SKU como redundância.

---

# 49. Estado offline

Se Supabase estiver indisponível:

O catálogo deve continuar visível.

Mostrar aviso:

```text
O catálogo está disponível, mas as revisões estão temporariamente indisponíveis.
```

Não apagar dados locais nem causar tela branca.

---

# 50. Segurança

Nunca colocar no código:

```text
senha do banco
service role key
token privado
credencial de administrador
```

Variáveis públicas do Vite:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

podem existir no front end.

A segurança precisa vir das políticas RLS e autenticação.

---

# 51. README

Criar documentação completa explicando:

## Instalação

```bash
npm install
```

## Importação

```bash
npm run import:data
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Supabase

Explicar:

1. criar projeto
2. criar tabela
3. executar SQL
4. habilitar RLS
5. configurar Auth
6. copiar URL
7. copiar anon key
8. criar `.env`
9. testar login
10. testar gravação

## GitHub Pages

Explicar:

1. criar repositório
2. push
3. abrir Settings
4. Pages
5. configurar GitHub Actions
6. aguardar deploy
7. abrir URL publicada

---

# 52. SQL de configuração

Criar arquivo:

```text
supabase/schema.sql
```

Ele deve conter:

```text
criação da tabela
índices
trigger updated_at
RLS
políticas necessárias
```

Não pedir que o usuário escreva o SQL manualmente.

Entregar arquivo pronto.

---

# 53. .env.example

Criar:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

Não colocar credenciais reais.

---

# 54. Experiência da cliente

A experiência final precisa ser aproximadamente:

```text
Cliente recebe link
↓
Abre catálogo
↓
Vê todos os produtos
↓
Pesquisa ou abre um produto
↓
Analisa foto
↓
Analisa nome
↓
Analisa preço
↓
Seleciona cor
↓
Confere tamanhos
↓
Confere quantidades
↓
Confere descrição
↓
Confere dados fiscais
↓
Marca "Está correto"
```

ou:

```text
Marca "Precisa corrigir"
↓
Escreve o motivo
↓
Salva
```

Você abre o mesmo sistema e consegue visualizar o progresso.

---

# 55. Não usar aparência de planilha

Embora os dados venham de XLSX, o front end não deve parecer uma planilha.

A interface precisa parecer:

```text
Catálogo
+
Painel administrativo
+
Ferramenta de aprovação
```

---

# 56. Performance

Como a quantidade de produtos é pequena, não é necessário backend para consulta do catálogo.

Ainda assim:

```text
lazy load de imagens
memoização quando útil
evitar rerenderizações desnecessárias
```

O carregamento precisa ser rápido.

---

# 57. Acessibilidade

Implementar:

```text
labels
focus states
navegação por teclado
contraste adequado
alt nas imagens
aria quando necessário
```

---

# 58. Estados da aplicação

Criar corretamente:

```text
loading
empty
error
success
offline
```

Não deixar tela vazia enquanto carrega.

---

# 59. Testes obrigatórios

Antes de finalizar, testar:

```text
Produto com uma cor
Produto com várias cores
Produto sem cor
Produto com tamanho simples
Produto com tamanho duplo
Produto sem imagem
Produto com imagem inválida
Produto sem GTIN
Produto sem origem
Produto com alerta
Produto aprovado
Produto com correção
Persistência no Supabase
Login
Logout
Exportação CSV
Exportação JSON
Filtros
Busca
Ordenação
Mobile
Desktop
GitHub Pages
```

---

# 60. Validações específicas

Confirmar que:

```text
produto pai nunca aparece duplicado
filho sempre está no pai correto
estoque total = soma dos filhos
estoque da cor = soma dos tamanhos daquela cor
preço exibido é coerente com as variações
tamanhos combinados não são divididos
```

---

# 61. Build obrigatório

Antes de considerar o trabalho pronto:

Executar:

```bash
npm run import:data
npm run build
```

Corrigir:

```text
erros TypeScript
warnings críticos
imports quebrados
rotas quebradas
dados não encontrados
```

Não entregar código que não compile.

---

# 62. Resultado esperado

Ao final eu devo conseguir clonar o repositório e executar:

```bash
npm install
npm run import:data
npm run dev
```

e visualizar o catálogo completo.

Também devo conseguir executar:

```bash
npm run build
```

sem erros.

Depois de fazer push para GitHub:

```text
GitHub Actions
↓
Build
↓
GitHub Pages
```

deve publicar automaticamente.

---

# 63. Critérios de aceite

O projeto só está concluído se:

- o XLSX for convertido automaticamente
- os produtos pai forem agrupados corretamente
- todas as variações estiverem ligadas ao pai
- cores funcionarem
- tamanhos funcionarem
- estoque estiver correto
- dados técnicos estiverem visíveis
- NCM estiver visível
- preço estiver visível
- observações estiverem visíveis
- alertas estiverem visíveis
- imagens tiverem fallback
- Supabase estiver integrado
- autenticação estiver funcionando
- aprovação estiver funcionando
- correção com comentário estiver funcionando
- dashboard de revisão estiver funcionando
- CSV estiver funcionando
- JSON estiver funcionando
- GitHub Pages estiver funcionando
- layout mobile estiver funcionando
- build estiver sem erros

---

# 64. Ordem de execução para o Codex

Não tente implementar tudo de uma vez sem compreender os dados.

Executar nesta ordem:

## Etapa 1

Analisar:

```text
olist_cadastro_mestre_ncm_cfop.xlsx
```

Apresentar no terminal ou em documentação curta:

```text
quantidade de pais
quantidade de filhos
quantidade de estoque
campos encontrados
tipos de variação encontrados
problemas encontrados
```

## Etapa 2

Implementar:

```text
importProducts.ts
```

Gerar:

```text
products.json
```

Validar os dados.

## Etapa 3

Criar interface do catálogo.

## Etapa 4

Criar página detalhada do produto.

## Etapa 5

Criar busca, filtros e ordenação.

## Etapa 6

Criar Supabase e schema SQL.

## Etapa 7

Criar autenticação.

## Etapa 8

Criar revisão.

## Etapa 9

Criar dashboard de revisão.

## Etapa 10

Criar exportação.

## Etapa 11

Configurar GitHub Pages.

## Etapa 12

Testar tudo.

---

# 65. Regra final

Não entregar apenas um protótipo visual.

Não entregar apenas componentes isolados.

Não criar dados fictícios para substituir a planilha.

Não corrigir silenciosamente informações suspeitas.

Não remover campos importantes.

Não comprometer segurança do Supabase.

O resultado precisa ser um sistema utilizável de ponta a ponta.

O foco é permitir que a cliente confira o catálogo inteiro antes da importação e publicação oficial.

Quando terminar, apresentar:

1. estrutura final do projeto
2. resumo das decisões
3. comandos para executar
4. instruções do Supabase
5. instruções do GitHub Pages
6. pendências encontradas nos dados
7. URL local de teste
8. confirmação de que o build passou
