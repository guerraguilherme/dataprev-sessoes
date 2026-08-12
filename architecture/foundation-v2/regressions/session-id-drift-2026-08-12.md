# Regressão — drift de session_id no buffer

Data: 2026-08-12
Status: corrigida no runtime; reconciliação de controle registrada

## Sintoma observado

A trilha podia exibir **Falha na geração** para uma sessão cujo conteúdo já havia sido efetivamente produzido e marcado como pronto na base de controle.

Caso observado no iPhone:
- ROADMAP canônico: `MAT-CALC-001` — Limites e continuidade
- conteúdo gerado: `MAT-LIM-001.json`, com `id = MAT-LIM-001`
- resultado: o planner procurava `MAT-CALC-001` no catálogo, não o encontrava e mantinha o estado local de erro.

Segundo caso identificado preventivamente:
- ROADMAP canônico: `NP-001` — Jupyter e NumPy: fundamentos
- conteúdo gerado: `PY-NP-001.json`, com `id = PY-NP-001`

## Causa

O pipeline de geração derivou novos IDs a partir do tema/título em vez de preservar o `session_id` canônico já existente no Session Registry/ROADMAP.

Além disso, os novos arquivos não tinham sido adicionados ao `prepared-sessions-loader.js` nem ao cache offline do service worker.

## Correção aplicada

1. `prepared-sessions-loader.js` passou a declarar explicitamente a fonte física e o `canonicalId` quando houver legado de geração.
2. `MAT-LIM-001.json` é exposto ao runtime como `MAT-CALC-001`.
3. `PY-NP-001.json` é exposto ao runtime como `NP-001`.
4. O loader valida que todo ID entregue ao planner exista no `ROADMAP`; arquivo preparado com identidade não resolvida falha de forma visível em vez de criar uma segunda identidade silenciosa.
5. O service worker foi atualizado para cachear os dois novos arquivos e recebeu nova versão de cache.
6. A Trilha/controle deve manter o ID canônico e pode preservar o filename legado apenas em `content_ref`/nota de migração.

## Invariante preventivo

**O gerador nunca cria ou recalcula `session_id`. A demanda de preparação recebe o `session_id` do roadmap e esse mesmo valor deve atravessar Composer → staging → QA → publicação → Trilha → runtime. Título, assunto e filename não são autoridade de identidade.**

Antes de publicar uma sessão:
- rejeitar `session_id` que não exista no Session Registry/ROADMAP aprovado;
- rejeitar divergência entre `requested_session_id` e `session_payload.session_id`;
- não criar aliases novos silenciosamente; alias é mecanismo temporário de migração documentada;
- atualizar loader/cache somente depois de o payload passar pelo gate;
- confirmar por readback que `catalogById().has(canonical_session_id)` é verdadeiro.

## Teste de regressão

Para cada sessão de buffer:
1. gerar usando um `requested_session_id` conhecido;
2. validar que o payload publicado mantém exatamente esse ID;
3. carregar o catálogo;
4. confirmar que `sessionLocalStatus(requested_session_id) === 'pronta'` quando não iniciada;
5. confirmar que fila local antiga de erro não prevalece sobre conteúdo canônico presente;
6. recarregar online e offline e obter o mesmo ID/status.
