# DATAPREV Sessões 0.7.17 — estudar, recuperar e continuar

Esta revisão transforma tentativas já registradas em reencontros curtos e melhora o ensino de duas sessões existentes. Foi solicitada como continuação da revisão 0.7.16, com autorização persistente de publicação sem bloquear a entrega pela prévia local indisponível.

## Comportamento entregue

- A Home oferece até três revisões, priorizando erros e respostas inseguras, com diversidade entre sessões quando possível. A ação de avançar na Trilha continua disponível.
- Questões finais só são selecionadas depois da correção original. As 12 aplicações autorais novas só entram depois que o aluno responde à fixação correspondente na versão ampliada da explicação.
- Reencontro inicial: 1 dia para erro/dúvida, 3 dias para os demais. Acerto com confiança alta e justificativa que não seja “não sei” usa intervalos de 3, 7 e 14 dias; erro ou dúvida volta no dia seguinte. A declaração do aluno não é avaliação automática da qualidade da justificativa nem medida de domínio.
- A revisão exige alternativa, confiança e uma frase de raciocínio. Pausa preserva o rascunho; correção traz resposta, explicação e data do próximo reencontro.
- Revisões ficam em `reviewPractice.schemaVersion=1`, dentro do checkpoint da sessão. O envio usa a fila existente e a confirmação por checksum. Não há nova conta, endpoint ou serviço de geração.
- Doze conceitos — seis de `EST-VA-001` e seis de `NP-001` — recebem uma camada didática versionada, com exemplo, passos e alerta específico. O arquivo de origem de NumPy continua `PY-NP-001.json`; o ID de delivery é `NP-001`.
- Quatro conjuntos com posições previsíveis recebem apresentação determinística de alternativas novas: MAT-ALG-002, BD-NORM-002, MAT-ALG-004A e EN-TEXT-001. Qualquer registro anterior, inclusive rascunho, mantém a ordem que o aluno já viu. Itens cujo texto depende das letras das alternativas mantêm a ordem de origem.

## Preservação

Os 29 arquivos JSON de material continuam com os hashes da versão 0.7.16. A camada ampliada é explícita em `learning-guides.js`, versão 1.0.0, sem reescrita silenciosa de perguntas, opções ou gabaritos originais. `learningGuideVersions` só é acrescentado em interação do aluno; olhar a Home não inventa revisão, tentativa ou conclusão.

`reviewPractice` guarda revisões separadamente. Campos de primeira tentativa, notas, conclusão, pontuação e `lastTick` da sessão não são substituídos pela revisão. Novas ordens são salvas em `optionOrder`, com índices canônicos e IDs preservados; o relatório enumera a ordem apresentada.

O Golden Sample EST-PROB-002 permanece mapped_validated, não publicado e não auditado novamente. Cards e roadmap não foram alterados. Nenhum resultado foi enviado para a base oficial durante os testes.

## Verificação e limites

88 checks automáticos: 14 de revisão/apresentação/ensino, 16 de regressão funcional, 12 do runtime/cache/HTTP, 8 da fundação Python e 38 arquiteturais. Os exemplos NumPy foram executados; seis respostas de aplicação NumPy e três cálculos de probabilidade foram conferidos. As distinções conceituais e a relação ensino → exercício foram revistas manualmente.

O validador estático, aplicado à superfície alterada com suas dependências reais incorporadas, retorna zero erro e um aviso de ausência de corte global de overflow. O HTML separado de seus scripts gera falsos alertas de persistência/schema/confirm; não é uma validação suficiente para este PWA modular. Os overlays legados não foram refeitos.

A prévia localhost permanece bloqueada no navegador disponível. A publicação não aguarda esse bloqueio, conforme orientação do usuário. O teste funcional usa DOM simulado e dados fictícios; a fixture visual exporta o markup renderizado sem scripts, persistência ou sync. Verificação de Safari/iPhone físico e modo avião no aparelho não é alegada.

Não houve validação real do backend compartilhado com dados do aluno. O contrato existente envia e confirma o JSON completo do checkpoint, incluindo o novo campo; restauradores existentes preservam campos adicionais. A configuração e os dados atuais do iPhone não foram consultados.

## Limites pedagógicos e próxima prioridade

Repetição da questão original mede recuperação daquele item. As novas aplicações variam exemplos, mas não são prova de transferência irrestrita. A justificativa é coletada, não julgada por IA. Não há promessa de nota, domínio global ou probabilidade estimada de gabaritar.

O catálogo continua com 29 sessões e o planejamento com 141 entradas. Essa razão não mede cobertura do edital. A maior dívida restante é completar e aprofundar materiais ligados aos itens do edital; a revisão não pode consumir todo o tempo de avanço. Próxima produção deve usar os checkpoints reais e a matriz curricular para escolher os maiores riscos de prova, preservando mínimos por disciplina e a prioridade dos específicos. Os 15 cadernos anexados não foram certificados questão por questão nesta entrega.

## Fontes de referência

- [AERO — Spacing and retrieval practice](https://www.edresearch.edu.au/guides-resources/practice-guides/spacing-and-retrieval-practice-guide-full-publication): recuperação com intervalo e feedback fundamenta o mecanismo. Os intervalos exatos desta versão são uma regra explícita de produto, não uma personalização calibrada empiricamente.
- [NumPy — Absolute basics](https://numpy.org/doc/stable/user/absolute_beginners.html): semântica dos exemplos de arrays, shape, dtype, indexação e operações, conferida também por execução local.
- [Python — Control flow](https://docs.python.org/3/tutorial/controlflow.html): convenções e relação com a base de programação já disponível.
- [FGV — DATAPREV 2026](https://conhecimento.fgv.br/concursos/dataprev26): fonte do concurso; esta release não altera pesos, roadmap ou mapping curricular.
