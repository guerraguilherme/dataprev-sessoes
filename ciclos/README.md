# DATAPREV · Ciclos 1.0.0

Experiência de estudo por questões em `/ciclos/`. Duas provas de treino de 70 questões distintas, com leitura opcional, correção por alternativa, notas, primeira resposta imutável e revisões separadas.

## Contrato de aprendizagem

- 40 gerais (12 Português, 12 Inglês, 5 Lógica, 6 Atualidades/IA, 5 Legislação) e 30 específicas por ciclo; 115 pontos possíveis. A divisão das específicas em 5 Matemática, 6 Estatística, 10 Ciência de Dados, 5 Python/Ferramentas e 4 Banco de Dados é editorial, não uma quota do edital.
- 140 itens autorais, identificados como tais. Não há alegação de autoria oficial ou dificuldade psicometricamente calibrada.
- Cada item tem 5 alternativas com feedback específico, fonte temática e acesso a uma das 56 explicações: essencial, desenvolvimento, outro exemplo, procedimento e confusão comum.
- A primeira resposta registra alternativa, confiança, raciocínio opcional, momento e consulta prévia. Abrir explicação ou notas existentes antes de responder marca consulta. Ler ajuda após corrigir não reclassifica a primeira resposta.
- A revisão esconde a seleção e a correção anteriores. É uma nova tentativa, vinculada à original; não muda a nota do ciclo.
- O caderno reúne erros, dúvidas, consultas e marcações. A prioridade é uma regra transparente, não um diagnóstico automático de causa. A causa é opcional e informada pelo aluno.
- Intervalos sugeridos após revisão: 1 dia para erro ou consulta; 3 dias para acerto sem consulta. Não há promessa de domínio ou de aprovação.
- O ciclo seguinte só é liberado após fechar as 70 respostas anteriores. Depois dos dois ciclos, há revisão; não se apresenta uma repetição como conteúdo novo.

## Persistência e recuperação

Estado exclusivo em `dataprev_ciclos_v1`, schemaVersion 1. Não se lê nem se escreve estado oficial, sync, roadmap, Cards ou mastery da plataforma anterior. O conteúdo certificado EST-PROB-002 e seus artefatos não são alterados nem publicados.

Cada edição grava a versão atual da chave. Falha de armazenamento é visível e mantém os dados na memória para backup. Registro local incompatível é preservado, sem sobrescrita automática. Importação valida o arquivo inteiro antes de gravar; respostas iniciais locais vencem conflitos, variantes importadas são preservadas como evidência adicional, notas diferentes são reunidas e revisões são deduplicadas. O checkpoint inclui posição, rascunho, confiança, consulta, notas, tentativas e tempo ativo. Não existe reset destrutivo.

O relatório Markdown omite gabarito e racional das questões pendentes. O backup JSON contém apenas o estado destes ciclos. Estes registros **não têm sincronização automática na nuvem**. A exportação/importação é a via de continuidade entre dispositivos nesta entrega; a interface informa isso explicitamente.

## Compatibilidade com o trabalho anterior

A nova modalidade multi-ciclo não cabe diretamente no template de uma sessão formal. A equivalência é implementada nos contratos de primeira tentativa, correção explícita, três níveis de confiança, notas recolhíveis, tempo visível, checkpoint, relatório e ausência de escrita externa. O Golden Learning Experience Contract v0.2.0 e o Regression Corpus v0.1.1 permanecem referências para esses comportamentos; não se promove novo mapping nem se simula execução de toda a factory v3.

Todos os arquivos anteriores ficam byte a byte iguais. O app anterior continua disponível em `../`. O leitor estático `reader.html` apresenta questões e ensino sem JavaScript e sem gabaritos antecipados.

## Publicação e offline

Aplicativo estático, sem geração ad hoc, chamadas a LLM ou backend de aluno. Service worker com escopo exclusivo `/ciclos/`; remove apenas caches antigos com prefixo `dataprev-ciclos-`. A instalação só é ativada após precache completo. A interface só declara offline pronto após confirmação de todos os recursos. Os caches da PWA anterior são preservados.

A publicação foi autorizada pelo usuário, inclusive sem aguardar outra aprovação visual humana. A inspeção visual automática na URL servida complementa os testes locais; não deve ser registrada como Safari/iPhone físico PASS.

## Validação reproduzível

```sh
python ciclos/tools/build.py
python ciclos/tests/content.test.py
NODE_PATH=/tmp/dataprev-ciclos-qa/node_modules node ciclos/tests/runtime.test.cjs
node ciclos/tests/offline.test.cjs
```

A suíte DOM usa jsdom 26.1.0. Python usa NumPy para verificações independentes; traces são executados e casos SQL são comparados em SQLite. Os testes de conteúdo verificam estrutura e cálculos selecionados; não são validação humana de dificuldade, nem prova de cobertura integral.

`tests/visual-fixture.html` é uma reprodução estática de telas com dados sintéticos, nas larguras de 390 e 1024 px. Não grava dados. Serve para inspeção de composição e overflow, sem se confundir com teste de teclado físico.

O validador HTML do projeto, aplicado ao HTML com seus módulos CSS/JS incluídos para análise, passa sem erros. Seu único aviso é a ausência de `overflow-x:hidden/clip`; a implementação busca evitar o overflow pela composição, sem ocultar conteúdo que não coube. A medição de layout é feita no navegador servido.

## Limites de conteúdo a expandir

Estes ciclos são uma amostra de treino, não uma cobertura integral do edital. Há lacunas, por exemplo: aprofundamento em distribuições e testes específicos; SVM e misturas gaussianas; redes convolucionais e recomendadores; R, SAS, Hadoop; DDL/transações/NoSQL; delitos informáticos e decretos da LAI; outros tópicos de gramática e atualidades factuais. Produzir esses próximos conjuntos exige novas questões, fontes e validação, sem inventar disponibilidade no celular.
