# Fotos enviadas na conferência

Abra um produto e clique em **Editar fotos**. Selecione a cor, envie fotos ou use os ícones de estrela (principal), imagem (substituir) e lixeira (remover da galeria). Clique em **Salvar fotos** para publicar as mudanças. Cancele para descartar os envios ainda não salvos. No celular, **Enviar fotos** abre o seletor de arquivos/fotos do aparelho.

- JPG, PNG e WebP; até 10 MB por foto e 12 fotos por cor.
- As fotos ficam no bucket público `product-photos` do Supabase Storage. A associação por referência/cor fica em `public.product_photo_sets`.
- O catálogo e seus campos continuam no JSON gerado do XLSX. As fotos salvas são aplicadas como uma camada sobre os links originais; não alteram referências, preços ou estoques.
- A edição usa a mesma sessão anônima automática da conferência. Qualquer visitante do link pode editar as fotos compartilhadas, conforme o acesso sem login solicitado. Não há chave privada no navegador.
- RLS permite leitura pública das associações e exige sessão para inserir/atualizar. O caminho dos arquivos é `id-do-autor/uuid.ext`, sem sobrescrita. A limpeza de uploads cancelados exige o próprio autor.
- Uma versão por associação impede que um editor antigo sobrescreva uma alteração feita em outro navegador. Em caso de conflito, feche e abra novamente o editor.
- Ao voltar ao catálogo, abrir um produto ou retornar à aba, as fotos são consultadas novamente. Se o Supabase estiver indisponível, o catálogo original continua acessível e o editor apresenta erro sem anunciar salvamento.
- Remover/substituir fotos salvas retira sua associação da galeria; arquivos antigos permanecem no Storage como backup. Arquivos de envios interrompidos pelo fechamento do navegador também podem permanecer sem associação. A limpeza administrativa deve comparar objetos com URLs em `product_photo_sets` e conservar os arquivos necessários.

## Configuração

Em um projeto novo, execute `supabase/schema.sql` e depois `supabase/product-photos.sql` no SQL Editor. No projeto atual, o complemento já foi aplicado por migration. O bucket permite somente os três tipos de imagem indicados e limite de 10 MB no servidor. Não é necessário mudar as variáveis do GitHub Pages.

## Verificação

Testes automatizados cobrem upload, substituição, ordem/principal, remoção, cancelamento, validação, isolamento por cor e persistência. Foi enviado um arquivo real do modelo 2305.2081/Ouro Rosado pela interface e conferida a leitura em outra sessão mobile; a associação original foi restaurada após o teste.

Os avisos do advisor sobre [acesso anônimo](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins) correspondem ao modo sem login solicitado. A função interna `rls_auto_enable()` teve sua execução revogada para papéis públicos após a auditoria; continua funcionando como event trigger administrativo. A proteção de senhas vazadas é configuração anterior e não participa deste fluxo sem senha.
