# Análise estrutural da base atual

Fonte ativa: data-source/olist_cadastro_mestre_com_links_imagens.xlsx. A planilha anterior permanece somente como histórico; o importador utiliza exclusivamente a nova.

46 produtos pai, 407 filhos, 552 unidades e 453 SKUs únicos. Nenhum filho órfão, SKU repetido ou pai duplicado. As referências e os SKUs não mudaram em relação à base anterior; as revisões existentes mantêm a mesma identidade. 29 modelos Molekinha e 17 Molekinho.

Quatro abas integralmente lidas: Importar_Olist (453 registros, 64 colunas), Revisao_Marketplaces (46 registros, 17 colunas), LEIA_ANTES (14 registros, 2 colunas), Tributacao_Olist (10 registros, 5 colunas).

A atualização alterou descrição, descrição complementar, título SEO, descrição SEO e slug em 280 linhas; observações em 312 linhas. Os dados corrigidos foram preservados exatamente, sem unir modelos por semelhança de nome.

18 modelos possuem imagens: 35 URLs preenchidas nas colunas URL imagem externa 1 a 5. Os outros 28 permanecem sem imagem. Não há imagens nos filhos; portanto não há foto específica associada a cada cor. Os cards e galerias exibem as fotos do pai, sem inventar associação por cor.

Todos os campos das 453 linhas foram reconciliados independentemente com openpyxl e com a validação TypeScript. Estoques, preços, cores, tamanhos combinados, observações, campos fiscais e URLs foram preservados. Continuam os alertas de referência 2580.11 e tamanho 25/36 de 2656.100.

O detalhamento de cores, tamanhos, URLs, alertas e campos está em analise-planilha.json. A disponibilidade real dos links é registrada em verificacao-links-imagens.json; disponibilidade externa pode mudar sem alteração da planilha.
