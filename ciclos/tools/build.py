from pathlib import Path
import json,collections,hashlib,html
from content_common import *
import content_languages,content_general,content_quant,content_data,content_code
root=Path(__file__).resolve().parents[1]
for ci,questions in enumerate(QUESTIONS):
 assert len(questions)==70,(ci,len(questions))
 assert dict(collections.Counter(q['discipline'] for q in questions))==DISTRIBUTION
 assert sum(q['weight'] for q in questions)==115
 for q in questions:
  assert len({o['text'] for o in q['options']})==5,q['id']
  assert all(len(o['feedback'])>15 for o in q['options']),q['id']
  assert q['lessonId'] in LESSONS
  q['number']=questions.index(q)+1
  q['officialGroup']='Conhecimentos Específicos' if q['discipline'] in SPEC else q['discipline']
bank={'schemaVersion':1,'contentVersion':'1.0.0','title':'DATAPREV · Ciclos','checkedAt':'2026-09-08','distribution':DISTRIBUTION,'specificAllocation':'Distribuição editorial entre áreas específicas; o edital fixa o total de 30, não esta subdivisão.','provenance':'Questões autorais, não reproduções oficiais. Estilo inspirado nos materiais FGV fornecidos; dificuldade editorial, sem calibração psicométrica.','scope':'Dois ciclos de treino representativos. Não cobrem integralmente o edital. Revisão de pontos fracos não substitui os temas ainda não amostrados.','cycles':[{'id':f'ciclo-{i+1:02d}','title':f'Ciclo {i+1:02d}','subtitle':['Diagnosticar e aprender','Aplicar em novos problemas'][i],'questions':qs} for i,qs in enumerate(QUESTIONS)],'lessons':LESSONS,'sources':[{'title':'Edital DATAPREV fornecido — quadro de provas, item 9.17 e Anexo I, Perfil 4','url':None},{'title':'LAI — texto oficial','url':'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm'},{'title':'LGPD — texto oficial','url':'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm'},{'title':'Marco Civil — texto oficial','url':'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm'},{'title':'Python — controle de fluxo','url':'https://docs.python.org/3/tutorial/controlflow.html'},{'title':'NumPy — broadcasting','url':'https://numpy.org/doc/stable/user/basics.broadcasting.html'},{'title':'pandas — junções','url':'https://pandas.pydata.org/docs/user_guide/merging.html'},{'title':'scikit-learn — vazamento e validação','url':'https://scikit-learn.org/stable/common_pitfalls.html'},{'title':'PostgreSQL — junções','url':'https://www.postgresql.org/docs/current/tutorial-join.html'},{'title':'Spark — RDD','url':'https://spark.apache.org/docs/latest/rdd-programming-guide.html'},{'title':'IES — prática de recuperação e estudo espaçado','url':'https://ies.ed.gov/ncee/wwc/practiceguide/1'}]}
# Internal independent calculation fixtures are published separately, not embedded in the learner bank.
checks=[{'id':q['id'],'code':q['code'],'check':q.pop('check'),'correctText':next(o['text'] for o in q['options'] if o['id']==q['answerId'])} for qs in QUESTIONS for q in qs]
(root/'tests/calculation-fixtures.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
s=json.dumps(bank,ensure_ascii=False,separators=(',',':'))
(root/'content/bank.json').write_text(s+'\n')
# Static reading route survives a failed script, uses native expandable sections, and does not pre-reveal answers.
e=html.escape
parts=['<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ciclos · material para leitura</title><link rel="stylesheet" href="styles.css"></head><body><main class="reading"><a class="text-link" href="./">← Voltar aos ciclos</a><p class="eyebrow">Material de apoio</p><h1>Leia no seu ritmo.</h1><p>Esta versão funciona sem JavaScript. Para responder, registrar notas e acompanhar resultados, use a experiência interativa.</p>']
for cy in bank['cycles']:
 parts.append(f'<h2>{e(cy["title"])}</h2>')
 for q in cy['questions']:
  l=LESSONS[q['lessonId']]
  parts.append(f'<details class="reading-item"><summary>{q["number"]:02d} · {e(q["discipline"])} — {e(q["topic"])}</summary><h3>{e(q["prompt"])}</h3>')
  if q['stimulus']:parts.append(f'<div class="passage">{e(q["stimulus"])}</div>')
  if q['code']:parts.append(f'<pre><code>{e(q["code"])}</code></pre>')
  parts.append('<ol type="A">'+''.join('<li>'+e(o['text'])+'</li>' for o in q['options'])+'</ol>')
  parts.append(f'<details><summary>Estudar o tema</summary><h3>{e(l["title"])}</h3><p><strong>{e(l["essence"])}</strong></p>'+''.join('<p>'+e(p)+'</p>' for p in l['explain'])+'<h4>Outro exemplo resolvido</h4><div class="worked">'+e(l['example'])+'</div><h4>Como resolver</h4><ol>'+''.join('<li>'+e(p)+'</li>' for p in l['steps'])+'</ol><p><strong>Atenção:</strong> '+e(l['trap'])+'</p><p class="muted">'+e(l['source'])+'</p></details></details>')
parts.append('</main></body></html>');(root/'reader.html').write_text('\n'.join(parts))
print(json.dumps({'cycles':2,'questions':sum(map(len,QUESTIONS)),'lessons':len(LESSONS),'pointsPerCycle':115,'bankBytes':len(s.encode()),'sha256':hashlib.sha256((s+'\n').encode()).hexdigest()}))
