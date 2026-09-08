# DATAPREV Sessões 0.8.0 — experiência integrada

A interface anterior misturava estudo, planejamento e configuração na mesma página, repetia controles de navegação e criava rolagens concorrentes. Esta revisão separa Estudar, Trilha e Ajustes; dá prioridade à retomada e à revisão; acrescenta busca sem distinção de acentos e filtros de disponibilidade; remove a rolagem interna da Trilha; apresenta uma aula com sumário acessível e ajuda expandida no fluxo de leitura.

A prática e as questões finais continuam obrigatórias. O sumário só abre conceitos já alcançados. A ajuda preserva as microperguntas de apoio e fecha por Escape com retorno do foco. As questões finais têm navegação anterior, confiança identificada e justificativa associada ao campo. As cores de correção aparecem após a resposta.

## Correções operacionais

- Atualização do catálogo preserva os objetos da aula e do rascunho ativos; bootstrap não repete uma consulta que substitui a aula. Entrega gated não consome publicação remota ad hoc.
- Configuração de sync é validada antes da gravação, incluindo importação; entrada inválida mantém configuração anterior.
- Status local distingue salvamento no aparelho de confirmação de sync. Erros operacionais aparecem fora de controles recolhidos.
- Abertura de simulado é única, usa o loader multipartes, pausa o relógio da aula e retoma o relógio do simulado. Sair salva o relógio pausado.
- Resultado de simulado não credita alternativas ainda não confirmadas. Navegar para outra questão volta ao começo do enunciado.
- Preparação ad hoc de novos simulados fica bloqueada pelo mesmo contrato gated das sessões.

## Preservação e validação

Não há migração de chaves, alterações no estado oficial do aluno nem novos campos de aprendizagem. Os 29 arquivos de conteúdo e o material certificado EST-PROB-002 permanecem inalterados. O Golden permanece mapped_validated e não publicado. O relatório recalcula apenas respostas confirmadas de simulados, sem modificar tentativas armazenadas.

102 verificações automatizadas: experiência (14), qualidade das sessões (16), revisão/coach (14), entrega e cache (12), Python (8), fundação (38). Os 156 conceitos são renderizados pelo teste de qualidade. Fixtures usam dados fictícios e não enviam estado externo. O contrato de offline é exercitado em service worker simulado; não equivale a um novo teste físico em Safari/iPhone.

O validador HTML da skill lê arquivos isolados e não resolve scripts externos: index.html isolado informa quatro ausências de contrato. Com app.js e experience.js anexados à superfície, apresenta zero erros e um aviso sobre overflow; dimensões serão verificadas visualmente no browser. Não se introduz overflow-x:hidden para ocultar falhas de layout.

A autorização de publicação foi explicitamente fornecida pelo usuário, inclusive diante da indisponibilidade do preview local. A inspeção visual é realizada na publicação. Seu resultado é registrado em architecture/runtime/publication-0.8.0.json.

## Limite da entrega e ordem seguinte

Esta entrega melhora a navegação, leitura e confiabilidade; não atribui nota 9/10 ao produto, não certifica todo o conteúdo nem promete desempenho na prova. A camada de ensino ampliado e as revisões da 0.7.17 continuam disponíveis.

1. Usar os registros reais de erros/dúvidas para priorizar os próximos conteúdos de estudo.
2. Ampliar cobertura publicada nas sequências com lacunas, submetendo cada sessão aos gates de conteúdo, prática e feedback.
3. Fazer uma rodada de dificuldade e qualidade dos distratores dos simulados, com referência verificável às provas e sem confundir material autoral com questão original.
4. Acompanhar falhas reproduzidas no uso diário e capacidade de resolver questões novas; aparência e contagens de cliques não substituem aprendizagem.
