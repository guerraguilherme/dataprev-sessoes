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
    },
    'PT-GEN-C02':{
      label:'TJMT 2024 · Q5',
      source:'FGV — TJMT 2024 — Analista Judiciário — Tecnologia da Informação — Tipo 1 — Língua Portuguesa — questão 5',
      prompt:'Entre as frases abaixo, assinale aquela que pertence ao modo descritivo de organização discursiva.',
      options:['As maritacas do ninho do telhado despertaram cedo e começaram a fazer barulho de imediato.','Seus cantos incomodam por sua estridência e altura, mas fazem parte do cenário da casa.','Após partirem, deixam um pouco de saudade, mas voltam religiosamente ao final do dia e voltam a repousar no ninho.','Há anos que essas maritacas fazem seu ninho no meu telhado e, depois de algum tempo, abandonam tudo, mas deixam a certeza de que voltam.','Daqui a algum tempo voltarei a ouvir os seus cantos, o bater de suas asas e os guinchos dos filhotes até que tudo recomece.'],
      answer:1,
      explanation:'O gabarito definitivo é B. A alternativa B concentra-se em características dos cantos — estridência e altura — e em sua integração ao cenário, sem desenvolver uma sucessão de acontecimentos. As demais alternativas enfatizam ações ou progressão temporal.'
    }
  };
  if(typeof renderConcept!=='function')return;
  const base=renderConcept;
  renderConcept=function(){
    const c=session?.concepts?.[state?.conceptIndex];
    if(c&&REAL[c.id])c.realQuestion=REAL[c.id];
    base();
    if(c&&REAL[c.id])document.querySelectorAll('#studyBody .session-visual').forEach(el=>{if(el.querySelector('.sv-ref'))el.remove()});
  };
})();
