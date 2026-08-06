# DATAPREV Sessões — Documento Mestre

**Projeto:** DATAPREV 2026 — Perfil 4: Inteligência da Informação  
**Candidato:** Guilherme  
**Banca:** FGV  
**Localidade:** João Pessoa/PB  
**Prova objetiva prevista:** 11/10/2026, das 13h às 17h, horário de Brasília  
**Aplicativo:** DATAPREV Sessões  
**Repositório definitivo:** `guerraguilherme/dataprev-sessoes`  
**Versão deste documento:** 1.0  
**Status atual:** PWA 0.5 publicada no repositório independente e aguardando validação inicial no iPhone  
**Última atualização:** 06/08/2026, 14h37, horário local do usuário

> Documento canônico no Google Drive: `DATAPREV Sessões — Documento Mestre`.

---

## 1. Finalidade

Este arquivo preserva a continuidade do chat dedicado ao desenvolvimento, uso e aperfeiçoamento do aplicativo DATAPREV Sessões. Ele registra objetivo, decisões pedagógicas e técnicas, arquitetura, versões, conteúdo, resultados, erros, causas, correções, limitações, estado atual e próximos passos.

Nenhuma decisão importante deve depender apenas da memória da conversa.

---

## 2. Objetivo do chat e do aplicativo

Criar e manter uma PWA mobile-first de sessões guiadas de estudo para o Concurso DATAPREV 2026, Perfil 4 — Inteligência da Informação.

O aplicativo deve executar no celular o planejamento do chat 01 — Controle Geral, Cronograma e Caderno de Erros. Não é uma sequência aleatória de aulas.

Deve:

1. percorrer progressivamente 100% do edital do Perfil 4;
2. seguir o Plano Mestre e a distribuição entre disciplinas;
3. priorizar Conhecimentos Específicos sem abandonar as disciplinas gerais;
4. apresentar teoria objetiva e suficiente;
5. inserir fixação imediatamente após os conceitos;
6. incluir questões finais integradoras e FGV;
7. adaptar revisões aos erros reais;
8. registrar tentativas, segurança, justificativas, notas, tempo e uso de ajuda;
9. produzir relatório autossuficiente;
10. preservar progresso local e sincronizá-lo com Google Sheets;
11. manter próximas sessões prontas antes do fim do estoque;
12. funcionar como PWA instalável no iPhone.

---

## 3. Contexto fixo do candidato

- Guilherme.
- Perfil 4 — Inteligência da Informação.
- João Pessoa/PB.
- Banca FGV.
- Disponibilidade: 18h de segunda a sexta, mais sábado das 7h às 10h.
- Base fraca: Estatística, Machine Learning, Python, SQL, Banco de Dados e Legislação.
- Base média: Raciocínio Lógico.
- Base média a boa: Português.
- Formação: Administração e MBA Executivo em Business Analytics e Big Data pela FGV.

A estratégia deve considerar o maior peso de Conhecimentos Específicos, a nota mínima objetiva, o risco de zerar disciplina e o padrão FGV de conceitos precisos, alternativas próximas, exceções e pegadinhas.

---

## 4. Hierarquia de fontes

1. Edital oficial e retificações.
2. Chat 01 — Controle Geral, Cronograma e Caderno de Erros.
3. Documento Mestre geral do projeto.
4. Desempenho real registrado.
5. Este Documento Mestre.
6. Google Sheets operacional.
7. Código e arquivos publicados.

A revisão adaptativa complementa, mas não substitui, a cobertura do edital.

Regra de fila:

- 70%–80% de avanço planejado;
- 20%–30% de revisão adaptativa, recuperação e aprofundamento.

---

## 5. Relação com o DATAPREV Cards

### DATAPREV Cards

Microestudo rápido, revisão espaçada e treino curto.

- Repositório: `guerraguilherme/dataprev-cards`
- Aplicação: `https://guerraguilherme.github.io/dataprev-cards/`

### DATAPREV Sessões

Sessões completas, progressivas e guiadas.

- Repositório definitivo: `guerraguilherme/dataprev-sessoes`
- Aplicação definitiva: `https://guerraguilherme.github.io/dataprev-sessoes/`

Os aplicativos compartilham a infraestrutura de dados quando útil, mas precisam ter repositórios, Pages, manifests, service workers, caches e ciclos de versão independentes.

---

## 6. Estrutura pedagógica

Cada sessão pode conter:

- disciplina, tópico e item do edital;
- objetivo, prioridade, pré-requisitos e tempo estimado;
- conceitos em sequência pedagógica;
- “o que preciso saber”;
- explicação objetiva;
- exemplo ou código;
- conexão com conteúdo anterior;
- pegadinha e erro comum;
- fixação imediata;
- nova tentativa quando necessário;
- notas por conceito;
- questões finais integradoras e FGV;
- segurança e justificativa;
- correção comentada;
- resumo de revisão;
- próximo passo;
- relatório autossuficiente.

A sessão não deve virar aula acadêmica longa. Deve ensinar o suficiente para compreensão e acerto, com aprofundamento quando necessário.

---

## 7. Profundidade adaptativa

### Origem

Em `MAT-ALG-002`, o conceito de produto vetorial apresentou `i`, `j`, `k`, perpendicularidade e troca de sinal sem introduzir adequadamente a notação e a intuição espacial. O usuário travou. Isso foi classificado como insuficiência do material, não incapacidade do candidato.

### Modelo

1. **Essencial:** explicação curta.
2. **Destravar conceito:** apoio sob demanda no ponto específico.
3. **Resgate de pré-requisito:** reconstrução curta da base faltante.

Botão:

`Não entendi — destravar conceito`

Motivos:

- símbolos e nomenclatura;
- ideia intuitiva;
- cálculo ou passos;
- conexão com o que já foi estudado.

Regras:

- usar ajuda não conta como erro;
- uso de ajuda fica registrado;
- após duas tentativas erradas, resgate pode abrir automaticamente;
- pode haver microchecagem adicional;
- tópicos abstratos, espaciais ou com nova notação recebem maior profundidade inicial;
- tópicos simples continuam concisos.

Produto vetorial deve explicar `i=(1,0,0)`, `j=(0,1,0)`, `k=(0,0,1)`, perpendicularidade, produto escalar x vetorial e `j×i=-k`, sem antecipar determinantes.

---

## 8. Requisitos de interface

- mobile-first;
- sem cabeçalho fixo grande;
- sem barras que cubram conteúdo;
- alto contraste;
- botões acessíveis;
- controles recolhíveis;
- cronômetro de tempo ativo;
- pausa;
- salvamento automático;
- retomada do último ponto;
- relatório copiável;
- funcionamento offline;
- reinício com confirmação;
- mensagens claras de sincronização e busca;
- atualizações sem obrigar a refazer sessões.

O usuário prefere instruções técnicas em uma etapa por vez, com validação antes da próxima.

---

## 9. Arquitetura atual

### Hospedagem

- GitHub Pages.
- Repositório: `guerraguilherme/dataprev-sessoes`.
- Branch: `main`.
- URL: `https://guerraguilherme.github.io/dataprev-sessoes/`.

### PWA 0.5

Publicada com página própria, motor JavaScript consolidado, manifest, service worker, armazenamento local, catálogo, sincronização, relatório e profundidade adaptativa.

### Armazenamento local

- `dataprev_sessoes_state_v1` — estado legado;
- `dataprev_sessoes_states_v2` — estados por sessão;
- `dataprev_sessoes_sync_config_v1` — configuração das Sessões;
- `dataprev_cards_sync_config_v1` — configuração histórica dos Cards.

Os projetos compartilham o domínio `guerraguilherme.github.io`, permitindo reaproveitar localStorage, mas os service workers ficam isolados pelos caminhos dos repositórios.

### Conteúdo

Versão atual: `2026.08.06-sessoes-02`.

A PWA lê o catálogo remoto pelo Apps Script quando configurada. O fallback ainda pode buscar JSON históricos de `dataprev-cards/sessoes/`. A migração integral desses JSON para o novo repositório é pendência técnica.

### Google Sheets

Planilha: `DATAPREV Cards — Banco de Sincronização`  
ID: `1ZlLs2QTUVdGGCvLubb9GzPiBNpEYw2MxGA774npbGDg`

Abas:

- `Regras_Sessoes`;
- `Sessoes_Catalogo`;
- `Sessoes_Publicacoes`;
- `Estado_Sessoes`;
- `Sessoes_Execucoes`;
- `Sessoes_Respostas`;
- `Progresso_Edital`;
- `Fila_Sessoes`.

Apps Script:

- projeto `DATAPREV Cards Sync`;
- versão inicial das Sessões: 3.2;
- correção do JSON: 3.2.1;
- endpoint e token ficam no aparelho/propriedades do script;
- nunca registrar segredo neste arquivo ou no GitHub.

---

## 10. Catálogo e desempenho

### PY-COND-001 — concluída

- 10 conceitos;
- 12 fixações;
- 10 questões finais;
- fixações: 12/12;
- finais: 7/10;
- tempo ativo: 15min21s.

Erros:

- `lista[-1]` x `lista[1]`;
- `and` x `or` em intervalos;
- avaliação de `not` e `and`.

### PY-COND-R01 — concluída

- 4/4 conceitos;
- 6/6 fixações;
- 6/6 finais;
- segurança alta em todas;
- nenhuma segunda tentativa;
- tempo ativo: 8min09s.

Conclusão: revisão corrigiu os três padrões de erro.

### MAT-ALG-002 — em andamento antes da migração

- último ponto observado: conceito 4 de 7, Produto vetorial;
- progresso precisa ser recuperado e validado na PWA 0.5;
- foi o gatilho para a profundidade adaptativa.

### BD-NORM-002 — não iniciada

- 2FN, 3FN e dependências parcial e transitiva;
- deve seguir Matemática na ordem do Plano Mestre.

---

## 11. Histórico cronológico

### PWA 0.1

Primeira versão publicada dentro de `dataprev-cards/sessoes/`, com sessão de Python, salvamento local, cronômetro, notas, segurança, justificativa, relatório e offline. Fechar e reabrir preservou o progresso.

### Apps Script 3.2 / 3.2.1

Erro: `Bad control character in string literal in JSON`.

Causa: quebras de linha não escapadas no JSON incorporado.

Correção: 3.2.1 validada. Catálogo e sincronização passaram a funcionar.

### PWA 0.2 / 0.2.1

A versão 0.2 aparecia e voltava para 0.1.

Causas:

- cache antigo;
- `renderStats()` antigo reescrevia o cabeçalho.

Correção: 0.2.1, atualização do renderizador e cache.

### Configuração de sincronização

Sessões não encontrava configuração dos Cards em alguns contextos.

Correções:

- copiar/importar configuração;
- página independente de configuração;
- opção manual;
- confirmação por checksum.

### Sincronização presa nos Cards

A tela ficou em “Sincronizando”, mas a planilha já tinha recebido o estado. Correção: Cards 1.5.2 com tentativas de confirmação e limite de espera.

### PWA 0.3 / 0.3.1

Catálogo múltiplo e progresso por sessão.

Erro: botão Iniciar rolava para cima sem abrir.

Causa: estado alterado sem renderização.

Correção: renderização explícita após seleção.

### Status concluído como em andamento

Revisão concluída apareceu `in_progress` porque o usuário voltou ao catálogo antes de sincronizar.

Correção: usar `completedAt` e completude, não apenas `phase`.

### PWA 0.4

Introdução da profundidade adaptativa.

Não estabilizou no repositório antigo por conflito de service worker.

### Conflito de service workers

O service worker dos Cards:

1. excluía apenas `/sessoes/`, não `/sessoes-v04/`;
2. apagava caches de outros aplicativos;
3. controlava qualquer subpasta de `/dataprev-cards/`.

Consequências:

- 0.4 voltava para 0.3.1;
- `/sessoes-v04/` abriu DATAPREV Cards zerado.

Decisão: repositório independente.

### PWA 0.5

Repositório `dataprev-sessoes` criado e PWA independente publicada. A primeira abertura e recuperação do progresso aguardam validação do usuário.

---

## 12. Registro de erros e aprendizados

1. **JSON inválido:** validar catálogos antes de publicar.
2. **Versão reescrita:** revisar renderização antes de culpar apenas o cache.
3. **Configuração não compartilhada:** oferecer migração explícita e opção manual.
4. **Sincronização visualmente eterna:** separar envio, confirmação e feedback.
5. **Botão Iniciar sem tela nova:** estado e renderização devem ocorrer juntos.
6. **Concluída como em andamento:** status não pode depender de um único campo de navegação.
7. **Conceito abstrato curto demais:** concisão não pode remover pré-requisitos essenciais.
8. **Service worker antigo:** aplicativos independentes precisam de escopos independentes.
9. **Pasta nova abriu Cards:** mudar subpasta não muda o controle do service worker raiz.
10. **Pipeline de publicação complexo:** usar payload único de staging e publicação transacional pelo Apps Script.

---

## 13. Automação futura

Objetivo: ter nova sessão pronta antes do fim do estoque, sem API paga e sem geração horária desnecessária.

Fluxo desejado:

1. app detecta estoque baixo;
2. registra solicitação simples;
3. geração produz payload único;
4. payload entra em staging;
5. Apps Script valida integralmente;
6. Apps Script publica catálogo e histórico;
7. app baixa o novo snapshot.

A automação completa ainda não está pronta. Não afirmar geração autônoma em tempo real.

---

## 14. Segurança

- não registrar token;
- não publicar credenciais;
- configuração fica no aparelho;
- checkpoint e relatório não contêm chave;
- requisições externas não são cacheadas;
- limpar área de transferência após importação quando possível.

---

## 15. Estado exato em 06/08/2026 às 14h37

### Concluído

- repositório `dataprev-sessoes` criado;
- escrita confirmada;
- PWA 0.5 publicada;
- arquitetura separada;
- duas sessões de Python concluídas e sincronizadas;
- catálogo com quatro sessões;
- profundidade adaptativa definida e implementada;
- Documento Mestre criado no Drive e no GitHub.

### Em andamento

- validar `https://guerraguilherme.github.io/dataprev-sessoes/?v=050`;
- recuperar `MAT-ALG-002`;
- voltar ao conceito 4 de 7;
- testar botão de destravamento;
- validar sincronização na PWA 0.5.

### Pendente

- iniciar `BD-NORM-002`;
- migrar JSON para o repositório novo;
- automação transacional de novos lotes;
- validar offline;
- instalar PWA definitiva;
- encerrar caminhos antigos.

### Próxima ação

O usuário trará o feedback da primeira abertura da PWA 0.5. A próxima resposta deve partir desse feedback.

---

## 16. Regra de atualização

**Este arquivo deve ser atualizado a cada interação deste chat.**

Registrar, quando aplicável:

- data e horário;
- pedido ou feedback;
- decisão;
- alteração técnica;
- resultado do teste;
- erro, causa e correção;
- aprendizado;
- desempenho;
- versão;
- estado atual;
- próximo passo.

Mesmo uma interação pequena deve atualizar ao menos o diário de continuidade ou o estado corrente.

---

## 17. Continuidade em nova conversa

1. Baixar/enviar a versão mais recente deste arquivo.
2. Dizer: `Continuar o desenvolvimento do DATAPREV Sessões a partir do Documento Mestre`.
3. Ler o documento integralmente antes de agir.
4. Não recriar o que já foi concluído.
5. Conferir a seção de estado exato.
6. Retomar pelo próximo passo.
7. Atualizar este arquivo em todas as respostas seguintes.

---

## 18. Versões resumidas

- **0.1:** primeira sessão, persistência, cronômetro, relatório, offline.
- **0.2/0.2.1:** sincronização e correção de versão/renderização.
- **0.3/0.3.1:** catálogo múltiplo e correção do botão Iniciar.
- **0.4:** profundidade adaptativa; bloqueada pelo service worker antigo.
- **0.5:** repositório independente e arquitetura definitiva em validação.

---

## 19. Teste de integridade do documento

O arquivo deve sempre responder:

- o que está sendo construído;
- por que a arquitetura atual foi adotada;
- estado técnico e pedagógico;
- o que já foi estudado;
- dificuldades do usuário;
- erros do sistema e correções;
- pendências;
- próximo passo exato.

Se alguma resposta não estiver clara, atualizar o documento antes de avançar.
