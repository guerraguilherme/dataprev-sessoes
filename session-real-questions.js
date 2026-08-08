'use strict';

// Questões FGV reais incorporadas às sessões quando o caderno e o gabarito
// estão disponíveis no acervo de estudo. Nada de referência solta para pesquisar fora.
(function(){
  const REAL={
    'PT-INT-C03':{
      label:'DATAPREV 2024 · Q4',
      source:'FGV — DATAPREV 2024 — ATI Análise de Negócio de TI — Tipo 1 — Língua Portuguesa — questão 4',
      prompt:'A felicidade é tão oposta à vida, que estando nela, a gente esquece que vive. Assinale a opção correta sobre o sentido da frase em destaque.',
      options:['É impossível ser feliz e viver.','Viver pressupõe felicidade.','Há uma relação paradoxal entre felicidade e vida.','É preciso esquecer da felicidade para obtê-la.','Descreve-se o caráter efêmero da felicidade.'],
      answer:2,
      explanation:'O gabarito definitivo é C. A frase aproxima felicidade e vida por uma oposição apenas aparente: estar na felicidade faria esquecer a própria percepção de viver. As demais alternativas literalizam, invertem ou acrescentam sentidos que a frase não sustenta.'
    }
  };
  if(typeof renderConcept!=='function')return;
  const base=renderConcept;
  renderConcept=function(){
    const c=session?.concepts?.[state?.conceptIndex];
    if(c&&REAL[c.id])c.realQuestion=REAL[c.id];
    base();
    if(c&&REAL[c.id]){
      // Remove o antigo cartão que apenas mandava consultar o caderno original.
      document.querySelectorAll('#studyBody .session-visual').forEach(el=>{if(el.querySelector('.sv-ref'))el.remove()});
    }
  };
})();
