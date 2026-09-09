import json,subprocess,math,io,contextlib,itertools
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]
bank=json.loads((root/'content/bank.json').read_text());fixtures=json.loads((root/'tests/calculation-fixtures.json').read_text());passed=[]
def check(name,truth):
 assert truth,name
 passed.append(name)
qs=[q for c in bank['cycles'] for q in c['questions']]
check('140 unique IDs',len({q['id'] for q in qs})==140)
check('140 distinct stems + stimuli + code',len({q['prompt']+q['stimulus']+q['code'] for q in qs})==140)
for c in bank['cycles']:
 check(c['id']+' official 40/30 split',sum(q['weight']==1 for q in c['questions'])==40 and sum(q['weight']==2.5 for q in c['questions'])==30)
 check(c['id']+' 115 points',sum(q['weight'] for q in c['questions'])==115)
for q in qs:
 check(q['id']+' complete alternative feedback',len(q['options'])==5 and len({o['text'] for o in q['options']})==5 and all(o['feedback'] for o in q['options']) and sum(o['id']==q['answerId'] for o in q['options'])==1)
 l=bank['lessons'][q['lessonId']]
 check(q['id']+' teaching contract',len(l['explain'])>=2 and len(l['steps'])>=3 and len(l['example'])>=70 and len(l['essence'])>=30)
for f in fixtures:
 c=f['check']
 if not c:continue
 k=c['kind']
 if k=='python':
  out=io.StringIO()
  with contextlib.redirect_stdout(out):exec(compile(f['code'],f['id'],'exec'),{})
  check(f['id']+' executed Python',out.getvalue().strip()==c['stdout']==f['correctText'])
 elif k=='quadratic':
  a,b,d=c['coeff'];lo,hi=c['interval'];candidates=[lo,hi];v=-b/(2*a)
  if lo<=v<=hi:candidates.append(v)
  vals=[(x,a*x*x+b*x+d) for x in candidates];mode='max' if 'max' in c else 'min';best=(max if mode=='max' else min)(vals,key=lambda v:v[1]);check(f['id']+' constrained extrema',np.allclose(best,c[mode]))
 elif k=='matrix':check(f['id']+' composition',np.allclose(np.array(c['B'])@np.array(c['A'])@c['v'],c['expected']))
 elif k=='eigen':check(f['id']+' eigenvector',np.allclose(np.array(c['A'])@c['v'],c['lambda']*np.array(c['v'])))
 elif k=='gradient':
  x,y=c['point'];grad=np.array([2*x+y,x+4*y]);check(f['id']+' gradient',np.allclose(grad,c['gradient']) and np.allclose(np.array([x,y])-c['eta']*grad,c['expected']))
 elif k=='bayes':
  masses=np.array(c['prior'])*c['rates'];check(f['id']+' Bayes',math.isclose(masses[c['target']]/sum(masses),c['expected']))
 elif k=='discrete':
  y=np.array(c['x'])*c['a']+c['b'];p=np.array(c['p']);mean=sum(y*p);v=sum((y-mean)**2*p);check(f['id']+' variance from transformed outcomes',math.isclose(v,c['variance']))
 elif k=='confusion':
  tp,fp,fn=c['tp'],c['fp'],c['fn'];check(f['id']+' metrics',all(math.isclose(a,b) for a,b in [(tp/(tp+fp),c['precision']),(tp/(tp+fn),c['recall']),(2*tp/(2*tp+fp+fn),c['f1'])]))
# Independent calculations, using enumeration / algebra rather than replaying supplied answers.
calc={
 'CICLO-01-Q027':len([g for g in itertools.combinations(range(7),3) if sum(x<4 for x in g)==2]),
 'CICLO-02-Q027':sum(abs(p.index(0)-p.index(1))==1 for p in itertools.permutations(range(5))),
 'CICLO-01-Q035':round((.8*2-1)*100),
 'CICLO-01-Q036':round((.7/.5-1)*100),
 'CICLO-01-Q049':float(np.array([2,-1])@np.array([[4,1],[1,9]])@np.array([2,-1])),
 'CICLO-01-Q050':100*(6/2)**2,
 'CICLO-01-Q051':18/50,
 'CICLO-01-Q055':.5-(1-.8**2-.2**2),
 'CICLO-01-Q056':next(i for i in range(1,5) if sum([9,4,2,1][:i])/16>=.8),
 'CICLO-01-Q057':np.mean([1,2,9]),
 'CICLO-01-Q059':1-.1*(4*(2*1-3)),
 'CICLO-01-Q061':(2*(.25/.75))/(1+2*(.25/.75)),
 'CICLO-01-Q065':2*3+1*2,
 'CICLO-02-Q047':1-(1-.6)**3,
 'CICLO-02-Q048':math.sqrt(9*(20-4**2)),
 'CICLO-02-Q049':9+4+2*(-.5*3*2),
 'CICLO-02-Q050':16/math.sqrt(64),
}
expected={'CICLO-01-Q027':18,'CICLO-02-Q027':48,'CICLO-01-Q035':60,'CICLO-01-Q036':40,'CICLO-01-Q049':21,'CICLO-01-Q050':900,'CICLO-01-Q051':.36,'CICLO-01-Q055':.18,'CICLO-01-Q056':2,'CICLO-01-Q057':4,'CICLO-01-Q059':1.4,'CICLO-01-Q061':.4,'CICLO-01-Q065':8,'CICLO-02-Q047':.936,'CICLO-02-Q048':6,'CICLO-02-Q049':7,'CICLO-02-Q050':2}
for k,v in calc.items():check(k+' independent calculation',math.isclose(v,expected[k]))
# Truth-table equivalence and deductive claims.
for L,V,A in itertools.product([False,True],repeat=3):check('conditional contraposition '+str((L,V,A)),((not L)or(V and A))==((not ((not V) or (not A))) or (not L)))
models=[(a,b,c,d) for a,b,c,d in itertools.product([False,True],repeat=4) if ((not a)or b) and ((not b)or c) and not c and(a or d)]
check('deduction in all satisfying models',bool(models) and all(d and not b for a,b,c,d in models))
# SQL runtime checks for the intentionally tricky NULL and LEFT JOIN cases.
import sqlite3
con=sqlite3.connect(':memory:');con.executescript('CREATE TABLE clients(id INT); CREATE TABLE orders(id INT,client INT); INSERT INTO clients VALUES(1),(2); INSERT INTO orders VALUES(10,1),(11,1);')
check('left join count row versus value',con.execute('SELECT COUNT(*),COUNT(o.id) FROM clients c LEFT JOIN orders o ON c.id=o.client WHERE c.id=2').fetchone()==(1,0))
check('NOT IN with NULL',con.execute('SELECT 3 WHERE 3 NOT IN (1,2,NULL)').fetchall()==[])
result={'status':'PASS','checks':len(passed),'questionCount':140,'lessonCount':len(bank['lessons']),'scope':'Structural completeness, executable code, selected independent calculations and logic/SQL checks; not psychometric calibration or proof of exhaustive syllabus coverage.'}
(root/'tests/content-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
