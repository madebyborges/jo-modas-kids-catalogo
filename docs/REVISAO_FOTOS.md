# Revisão das fotos — 08/10/2026

Causa corrigida: cards e dashboard utilizavam fotos gerais como fallback quando faltava associação por cor. Agora somente fotos compatíveis e associadas podem representar produtos com cores cadastradas. Fotos gerais de modelos sem cor continuam disponíveis, sem inventar uma cor.

Foram inspecionadas visualmente 44 fotos gerais da base enriquecida e 69 fotos das galerias associadas. Duas fotos originais compatíveis foram recuperadas: Preto c/ Marrom em 2861.216 e a segunda foto Azul Marinho de 2609.233. A primeira foto Preto de 2609.233 ficou bloqueada. São 32 modelos com fotos exibíveis e 22 opções de cor ainda pendentes.

| Referência | Problema encontrado | Resultado |
|---|---|---|
| 2565.113 | Foto geral Branco não corresponde às cores Preto e Rosa cadastradas. | Foto bloqueada na exibição; URL original preservada |
| 2357.103 | Foto geral Marrom/Bege não corresponde às cores Off e Branca cadastradas. | Foto bloqueada na exibição; URL original preservada |
| 2609.233 | Cadastro Azul Marinho, mas primeira foto Preto. Usar somente a segunda foto Azul Marinho. | Foto bloqueada na exibição; URL original preservada |
| 2749.101 | Cadastro Bege, mas foto Rosa. | Foto bloqueada na exibição; URL original preservada |
| 2745.103 | Cadastro Branco Capivara, mas foto apresenta gatinho e detalhes Rosa. | Foto bloqueada na exibição; URL original preservada |
| 2118.582 | Cadastro Branco Off Glitter, mas foto Preto. | Foto bloqueada na exibição; URL original preservada |

Links sem associação não são mais renderizados como fotos, mesmo na seção de auditoria; continuam acessíveis como links explícitos para conferência. Todos os campos da planilha, links originais, preços, estoque, cores, tamanhos e observações foram preservados.

Validação de interface: catálogo → card → produto → seleção de cor → galeria correspondente; dashboard de correções também usa fotos conferidas. Desktop e celular. Browser plugin not available; Playwright utilizado conforme skill frontend-testing-debugging.

Arquivos: data-source/image-audit.json, data-source/image-sources.json, docs/enriquecimento-imagens.json.

## Nova pesquisa de todas as fotos pendentes — 08/10/2026

37 de 52 opções de cor associadas; 15 pendentes. 35 de 46 modelos com foto exibível. A base possui links em 37 modelos; dois têm apenas fotos incompatíveis e não as exibem. Todos os modelos e cores sem foto foram pesquisados novamente em 08/10/2026. Foram aplicadas 15 novas fotos em sete opções de cor. Os valores originais da planilha e links anteriores foram preservados.

Novas associações: 25006.101 Dourado; 2580.110 Branco/Prata/Pink; 2750.103 Dourado; 2831.113 Azul; 2749.300 Mult Color; 2745.103 Branco Capivara; 2421.116 Preto e Branco. Todas as 15 fotos carregaram e foram inspecionadas. A foto Rosé da 2745.103 e a tabela de medidas da 2750.103 foram rejeitadas; utilizadas as fotos específicas compatíveis. O nome Gatinho da 2745.103 foi mantido conforme a planilha, apesar da variação Branco Capivara.

Build e 20 testes aprovados. 46 pais, 407 variações e 552 unidades preservados. Nenhuma célula não relacionada a imagens mudou, nenhuma URL anterior foi sobrescrita. Prévia local somente 127.0.0.1:5173. Documentação detalhada: docs/IMAGENS_POR_COR.md e docs/validacao-novas-fotos.json.

## Busca por descrição — 08/10/2026

38 de 52 opções de cor associadas; 14 pendentes. 36 de 46 modelos com foto exibível. A base possui links em 38 modelos; dois têm apenas fotos incompatíveis. A busca por descrição em 08/10/2026 confirmou cinco fotos adicionais para 2305.2081 Ouro Rosado. Dados originais e URLs anteriores preservados.

Pesquisadas as 15 opções então pendentes, usando descrições comerciais, material, fechamento, detalhes e cores antes da referência. Exemplo confirmado: Sandália Molekinha Flatform Ouro Rosado com concha e estrela-do-mar; página Renner confirma 2305-2081. Cinco fotos inspecionadas e aplicadas aos dez SKUs dessa cor.

Candidatos recusados: sandália Azul Denim Calita é 2636.204, diferente de 2638.204; tênis elástico Off/Glitter Esperança Show é 2118.592, diferente de 2118.582; Light Foam com velcro aparece como 2580.111 e 2580.103, sem comprovar 2580.11. Fotos de referências divergentes não foram aplicadas. Alguns anúncios não informam a referência; Lojas Mil continuou sem carregar. Isso não prova inexistência de fotos das 14 cores restantes.

Build aprovado, oito testes de dados e 12 de interface aprovados. 46 produtos, 407 variações, 552 unidades preservados. Verificação real local: cinco URLs carregadas, produto exibido em desktop e celular, sem erros de execução na página.
