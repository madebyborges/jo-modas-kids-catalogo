# Tamanhos editáveis

O botão **Editar tamanhos** abre as variações da cor selecionada, identificadas pelo estoque e SKU. Os campos salvam ao pressionar Enter ou perder foco. Concluir finaliza o campo em edição antes de fechar; entradas inválidas impedem o fechamento até serem corrigidas.

A confirmação aparece no topo por cinco segundos. Em erro de rede ou conflito, o valor anteriormente salvo permanece no catálogo e o editor mostra o erro. Um tamanho já utilizado por outra variação da mesma cor é recusado. Tamanhos combinados não são divididos nem corrigidos automaticamente. A correção de 25/36 só ocorre por ação manual.

Os ajustes ficam em public.product_variant_sizes, com chave por SKU, referência/cor imutáveis, versão, data e autor. A versão impede sobrescrever outra edição simultânea. O JSON/XLSX original permanece preservado, incluindo source, observações e quantidades. O alerta de tamanho suspeito é retirado da apresentação quando esse SKU é corrigido manualmente; a referência 2580.11 e os demais alertas continuam preservados.

RLS exige sessão automática para escrita, seguindo o acesso compartilhado sem login solicitado. A leitura pública permite carregar os ajustes junto do catálogo. Os avisos de [acesso anônimo](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins) correspondem a esse modo. Não há service role no frontend. Execute supabase/product-sizes.sql para provisionar uma instalação nova.

O catálogo busca ajustes ao abrir rotas ou retornar à aba. Se o Supabase falhar, continua exibindo o catálogo original ou os últimos ajustes carregados nesta sessão. Não utiliza localStorage como banco.
