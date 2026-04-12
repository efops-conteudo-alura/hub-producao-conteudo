# Passo a passo — Coordenador

## Como usar o Seletor de Atividades

O Seletor permite que você envie um curso para um instrutor revisar e selecionar as atividades. Depois, você confere o que foi selecionado, faz ajustes e exporta o JSON final.

---

### 1. Fazer upload do curso

1. Acesse **Seletor de Atividades** no menu lateral
2. Clique em **+ Nova submissão**
3. Arraste o arquivo JSON do curso para a área de upload, ou clique para selecionar
4. Se o arquivo for válido, você avança automaticamente para o próximo passo

> O sistema aceita dois formatos: o JSON exportado diretamente do admin da Alura (com `sections` e `activities`) e o formato gerado pela ferramenta interna (com `lessons` e `exercises`).

---

### 2. Selecionar o instrutor

1. Escolha **Instrutor existente** para selecionar alguém já cadastrado, ou **Novo instrutor** para cadastrar
2. Se for novo: informe o nome completo e o e-mail
3. Clique em **Enviar submissão**

O instrutor **não precisa criar senha**. Basta enviar para ele o link do Seletor de Atividades — ao acessar com o e-mail cadastrado, ele já verá a tarefa atribuída.

---

### 3. Aguardar a revisão

Na lista de submissões, cada tarefa exibe seu status:

- **Aguardando** — o instrutor ainda não revisou
- **Revisado** — o instrutor concluiu a seleção, pronto para exportar
- **Exportado** — o JSON já foi gerado e/ou importado no admin

---

### 4. Conferir e exportar

1. Clique na submissão com status **Revisado**
2. Veja quais atividades o instrutor selecionou
   - Texto riscado em vermelho = conteúdo original antes da edição
   - Texto em verde = alterado pelo instrutor
3. Se precisar ajustar alguma atividade, clique em **Editar** no card
4. Para remover uma atividade da seleção, clique em **Excluir**
5. Para incluir uma atividade que o instrutor não selecionou, role até a seção **Não selecionados** e clique em **+ Incluir na seleção**
6. Quando estiver tudo certo, clique em **⬇ Exportar JSON**

O arquivo baixado está no formato da plataforma Alura, pronto para importar no admin.

---

### Excluir uma submissão

Clique no **×** ao lado da submissão na lista. Você pode excluir em qualquer etapa.
