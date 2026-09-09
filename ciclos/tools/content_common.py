import hashlib,random
LESSONS={}; QUESTIONS=[[],[]]
DISTRIBUTION={'Português':12,'Inglês':12,'Raciocínio Lógico':5,'Atualidades e IA':6,'Legislação':5,'Matemática':5,'Estatística':6,'Ciência de Dados':10,'Python e Ferramentas':5,'Banco de Dados':4}
SPEC={'Matemática','Estatística','Ciência de Dados','Python e Ferramentas','Banco de Dados'}
def lesson(key,title,essence,explain,example,steps,trap,source='Edital fornecido — Anexo I, Perfil 4',deep=''):
 LESSONS[key]=dict(id=key,title=title,essence=essence,explain=explain,example=example,steps=steps,trap=trap,source=source,deep=deep)
def case(prompt,options,reason,wrong,stimulus='',code='',check=None):
 assert len(options)==5 and len(wrong)==4
 return dict(prompt=prompt,options=options,reason=reason,wrong=wrong,stimulus=stimulus,code=code,check=check)
def pair(discipline,topic,key,a,b):
 for cycle,c in enumerate([a,b]):
  n=len(QUESTIONS[cycle])+1;qid=f'CICLO-{cycle+1:02d}-Q{n:03d}'
  order=list(range(5));random.Random(qid+'dataprev-ciclos-v1').shuffle(order)
  opts=[dict(id=f'{qid}-O{i}',text=c['options'][i],feedback=([c['reason']]+c['wrong'])[i]) for i in order]
  QUESTIONS[cycle].append(dict(id=qid,discipline=discipline,topic=topic,lessonId=key,weight=2.5 if discipline in SPEC else 1,origin='Autoral · estilo FGV',demand='Aplicação e análise',prompt=c['prompt'],stimulus=c['stimulus'],code=c['code'],options=opts,answerId=qid+'-O0',explanation=c['reason'],check=c['check']))
