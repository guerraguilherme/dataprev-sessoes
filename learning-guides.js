'use strict';
// Additive, versioned teaching layer. Original session/question IDs and JSON remain unchanged.
window.DP_LEARNING_GUIDES={
  "EST-VA-C01": {
    "sessionId": "EST-VA-001",
    "version": "1.0.0",
    "paragraphs": [
      "Uma variável aleatória transforma cada resultado de um experimento em um número. Primeiro você define o que vai contar ou medir; depois aplica essa mesma regra a qualquer resultado.",
      "Duas moedas: use C para cara e K para coroa. Se X conta as caras, CC vira 2, CK vira 1, KC vira 1 e KK vira 0. O resultado é a sequência de faces; X é o número que você extrai dela."
    ],
    "code": "Resultado   CC   CK   KC   KK\nX            2    1    1    0",
    "steps": [
      "Escreva a regra de X em palavras: número de caras.",
      "Aplique a regra a cada resultado, sem mudar seu significado.",
      "Liste os valores distintos: resultados diferentes podem produzir o mesmo número."
    ],
    "trap": "X não é uma probabilidade. Pode valer 2, 10 ou outro número; P(X=x) é que precisa ficar entre 0 e 1.",
    "transfer": {
      "id": "EST-VA-C01-TRANSFER-v1",
      "prompt": "Um dado é lançado. Y vale 1 quando sai um número par e 0 quando sai um número ímpar. Se o dado mostra 6, qual é Y?",
      "options": [
        "6",
        "1",
        "1/6",
        "0"
      ],
      "answer": 1,
      "explanation": "6 é par; aplicando a regra, Y=1. Não é necessário calcular probabilidade.",
      "feedbackByOption": {
        "option_1": "6 é o resultado do dado. A regra de Y transforma qualquer resultado par em 1.",
        "option_2": "6 é par; aplicando a regra, Y=1. Não é necessário calcular probabilidade.",
        "option_3": "1/6 seria a probabilidade de uma face específica em um dado justo, não o valor de Y.",
        "option_4": "0 corresponde a resultado ímpar. Como 6 é par, Y=1."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "EST-VA-C02": {
    "sessionId": "EST-VA-001",
    "version": "1.0.0",
    "paragraphs": [
      "A distribuição de X relaciona cada valor possível à sua probabilidade. Para montá-la, reúna todos os resultados que levam ao mesmo valor e some suas probabilidades.",
      "Exemplo diferente das moedas: um dado justo gera X=0 nas faces 1 e 2 e X=1 nas faces 3, 4, 5 e 6. Cada face tem probabilidade 1/6. Assim, P(X=0)=2/6 e P(X=1)=4/6."
    ],
    "code": "x   Resultados do dado   P(X=x)\n0   1, 2                2/6\n1   3, 4, 5, 6          4/6\n                        soma = 1",
    "steps": [
      "Liste os caminhos que chegam ao valor pedido.",
      "Some as probabilidades desses caminhos. Só conte casos favoráveis sobre o total se forem equiprováveis.",
      "Confira: probabilidades não negativas e soma igual a 1."
    ],
    "trap": "Ter dois valores possíveis para X não significa que cada um tenha probabilidade 1/2.",
    "transfer": {
      "id": "EST-VA-C02-TRANSFER-v1",
      "prompt": "Um dado justo é lançado. X=0 nas faces 1, 2 e 3; X=1 na face 4; X=2 nas faces 5 e 6. Quanto vale P(X=2)?",
      "options": [
        "1/6",
        "1/3",
        "2/3",
        "1/2"
      ],
      "answer": 1,
      "explanation": "As faces 5 e 6 produzem X=2. Portanto, P(X=2)=2/6=1/3.",
      "feedbackByOption": {
        "option_1": "Há duas faces que produzem X=2, não apenas uma.",
        "option_2": "As faces 5 e 6 produzem X=2. Portanto, P(X=2)=2/6=1/3.",
        "option_3": "2/3 seria a probabilidade de quatro faces; aqui apenas duas atendem à regra.",
        "option_4": "1/2 corresponde a três faces. O valor 2 de X é produzido por duas faces."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "EST-VA-C03": {
    "sessionId": "EST-VA-001",
    "version": "1.0.0",
    "paragraphs": [
      "Uma variável discreta tem valores que podem ser enumerados: primeiro valor, segundo valor e assim por diante. Essa lista pode ser finita ou infinita.",
      "Número de chamados recebidos em uma hora: 0, 1, 2, 3, … Não existem 2,4 chamados. Mas usar casas decimais não torna uma variável contínua: uma nota que só pode ser 0; 0,5; 1; 1,5; …; 10 continua discreta."
    ],
    "code": "",
    "steps": [
      "Pergunte se há uma lista de valores permitidos.",
      "Verifique se valores entre dois vizinhos da lista são impossíveis.",
      "Não use presença de vírgula decimal como critério."
    ],
    "trap": "Discreta não significa necessariamente inteira nem com poucos valores.",
    "transfer": {
      "id": "EST-VA-C03-TRANSFER-v1",
      "prompt": "Uma máquina só vende doses de 0,25 L, 0,50 L e 0,75 L. O volume escolhido em uma venda é:",
      "options": [
        "Contínuo, porque tem decimais",
        "Discreto, porque os valores possíveis formam uma lista",
        "Sempre inteiro",
        "Uma probabilidade"
      ],
      "answer": 1,
      "explanation": "Os valores possíveis são três volumes específicos. Portanto, a variável é discreta.",
      "feedbackByOption": {
        "option_1": "Decimais não bastam para caracterizar continuidade; só três volumes são permitidos.",
        "option_2": "Os valores possíveis são três volumes específicos. Portanto, a variável é discreta.",
        "option_3": "Os volumes não são inteiros em litros, mas a variável continua discreta.",
        "option_4": "Volume é a quantidade observada. A probabilidade é atribuída a cada volume."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "EST-VA-C04": {
    "sessionId": "EST-VA-001",
    "version": "1.0.0",
    "paragraphs": [
      "Em um modelo contínuo, a quantidade pode assumir valores ao longo de um intervalo. Duração de atendimento e temperatura são exemplos usuais: entre dois valores pode existir outro.",
      "Um visor arredonda a duração para segundos inteiros. Isso limita o registro, mas não obriga a duração real a acontecer em saltos de um segundo. Distinga a grandeza modelada da precisão com que foi anotada."
    ],
    "code": "",
    "steps": [
      "Identifique o que está sendo modelado: duração real ou registro arredondado.",
      "Para a grandeza contínua, trabalhe com intervalos, como 2<T<3 minutos.",
      "No modelo contínuo com densidade, uma probabilidade é área em um intervalo; um valor pontual tem probabilidade zero."
    ],
    "trap": "P(T=2)=0 em um modelo contínuo não significa que medir aproximadamente 2 minutos seja impossível.",
    "transfer": {
      "id": "EST-VA-C04-TRANSFER-v1",
      "prompt": "A duração T de um atendimento é modelada por uma distribuição contínua com densidade. Qual afirmação é correta?",
      "options": [
        "P(T=3) precisa ser positiva",
        "T só pode assumir minutos inteiros",
        "P(2<T<4) é a área da densidade entre 2 e 4",
        "A altura da densidade em 3 é P(T=3)"
      ],
      "answer": 2,
      "explanation": "A probabilidade do intervalo é a área sob a densidade nesse intervalo.",
      "feedbackByOption": {
        "option_1": "No modelo contínuo com densidade, P(T=3)=0; probabilidades são calculadas em intervalos.",
        "option_2": "Uma duração contínua pode assumir valores entre os inteiros.",
        "option_3": "A probabilidade do intervalo é a área sob a densidade nesse intervalo.",
        "option_4": "Altura de densidade não é probabilidade pontual. A área em um intervalo é que representa probabilidade."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "EST-VA-C05": {
    "sessionId": "EST-VA-001",
    "version": "1.0.0",
    "paragraphs": [
      "Um evento escrito com X é um filtro sobre os valores da distribuição. Traduza o sinal antes de somar: X≥1 inclui 1; X>1 exclui 1; X≤1 inclui valores menores e também o 1.",
      "Considere P(X=0)=0,1; P(X=1)=0,2; P(X=2)=0,4; P(X=3)=0,3. Para X>1, entram apenas 2 e 3: 0,4+0,3=0,7. Não some os valores 2 e 3; some suas probabilidades."
    ],
    "code": "x          0     1     2     3\nP(X=x)    0,1   0,2   0,4   0,3\nX > 1?    não   não   sim   sim",
    "steps": [
      "Marque quais valores satisfazem a condição.",
      "Some somente as probabilidades dessas linhas.",
      "Confira pelo complemento quando isso ajudar: P(X>1)=1−P(X≤1)."
    ],
    "trap": "“Pelo menos 1” inclui 1. “Mais de 1” não inclui 1.",
    "transfer": {
      "id": "EST-VA-C05-TRANSFER-v1",
      "prompt": "X assume 0, 1 e 2 com probabilidades 0,15; 0,55 e 0,30. Qual é P(X<2)?",
      "options": [
        "0,30",
        "0,55",
        "0,70",
        "1"
      ],
      "answer": 2,
      "explanation": "Entram X=0 e X=1: 0,15+0,55=0,70. Também vale 1−0,30.",
      "feedbackByOption": {
        "option_1": "0,30 é P(X=2), justamente a linha excluída por X<2.",
        "option_2": "X<2 inclui 0 e 1. Falta somar a probabilidade de X=0.",
        "option_3": "Entram X=0 e X=1: 0,15+0,55=0,70. Também vale 1−0,30.",
        "option_4": "O valor X=2 não atende a X<2; a soma de todas as linhas seria 1."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "EST-VA-C06": {
    "sessionId": "EST-VA-001",
    "version": "1.0.0",
    "paragraphs": [
      "P(X=2) olha a distribuição original. P(X=2 | X≥1) informa que X=0 já foi descartado; as probabilidades precisam ser recalculadas dentro do que restou.",
      "Se P(0)=0,2; P(1)=0,3; P(2)=0,5, a condição X≥1 tem probabilidade 0,8. Dentro dela, X=2 ocupa 0,5/0,8=0,625. Em geral, divida a probabilidade da interseção pela probabilidade da condição, quando esta for positiva."
    ],
    "code": "P(X=2 | X≥1) = P(X=2 e X≥1) / P(X≥1)\n                = 0,5 / (0,3+0,5)\n                = 0,625",
    "steps": [
      "Leia depois da barra: esse é o novo universo.",
      "No numerador, mantenha os casos que atendem ao pedido e à condição.",
      "Divida pela probabilidade da condição; confirme que ela não é zero."
    ],
    "trap": "Não trocar P(A|B) por P(B|A). A expressão depois da barra define o denominador.",
    "transfer": {
      "id": "EST-VA-C06-TRANSFER-v1",
      "prompt": "P(X=0)=0,4; P(X=1)=0,4; P(X=2)=0,2. Quanto vale P(X=2 | X≥1)?",
      "options": [
        "0,2",
        "1/3",
        "2/3",
        "0,6"
      ],
      "answer": 1,
      "explanation": "A condição tem probabilidade 0,4+0,2=0,6. A interseção é X=2: 0,2/0,6=1/3.",
      "feedbackByOption": {
        "option_1": "0,2 usa o universo original. Após a condição, é preciso dividir por 0,6.",
        "option_2": "A condição tem probabilidade 0,4+0,2=0,6. A interseção é X=2: 0,2/0,6=1/3.",
        "option_3": "2/3 seria P(X=1 | X≥1), não a probabilidade pedida.",
        "option_4": "0,6 é a probabilidade da condição, que entra no denominador."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "PY-NP-C01": {
    "sessionId": "NP-001",
    "version": "1.0.0",
    "paragraphs": [
      "NumPy é uma biblioteca de Python. A convenção import numpy as np permite usar np como nome curto. np.array(...) cria um ndarray: uma estrutura de elementos com um dtype comum.",
      "Uma lista repete sua sequência ao ser multiplicada por um inteiro. Um array numérico multiplica cada elemento. Leia primeiro qual é o objeto à esquerda do operador; a aparência de lista dos dados não determina o comportamento."
    ],
    "code": "import numpy as np\n\nlista = [2, 4]\na = np.array([2, 4])\nprint(lista * 3)  # [2, 4, 2, 4, 2, 4]\nprint(a * 3)      # [6 12]",
    "steps": [
      "Identifique se o objeto é list ou ndarray.",
      "Para lista * inteiro, repita a sequência.",
      "Para array numérico * escalar, multiplique elemento a elemento."
    ],
    "trap": "Converter a lista para array muda a semântica das operações; não é só uma mudança de nome.",
    "transfer": {
      "id": "PY-NP-C01-TRANSFER-v1",
      "prompt": "Após import numpy as np, considere a=np.array([3,5]). Qual é o resultado de a*2?",
      "options": [
        "[3,5,3,5]",
        "[6,10]",
        "[5,7]",
        "[8]"
      ],
      "answer": 1,
      "explanation": "O array multiplica cada elemento: 3×2=6 e 5×2=10.",
      "feedbackByOption": {
        "option_1": "Essa repetição seria o resultado de uma lista multiplicada por 2.",
        "option_2": "O array multiplica cada elemento: 3×2=6 e 5×2=10.",
        "option_3": "[5,7] corresponde a somar 2, não multiplicar.",
        "option_4": "Somar os elementos não é o efeito de a*2."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "PY-NP-C02": {
    "sessionId": "NP-001",
    "version": "1.0.0",
    "paragraphs": [
      "shape descreve quantos elementos existem em cada eixo. ndim conta os eixos e size conta todos os elementos. Em uma tabela 2D, shape=(linhas, colunas).",
      "Um array 1D com quatro números tem shape=(4,), ndim=1 e size=4. A vírgula indica uma tupla com um elemento; não há segundo eixo implícito. Um array 2D com duas linhas de dois números tem shape=(2,2), ndim=2 e também size=4."
    ],
    "code": "import numpy as np\na = np.array([[2, 4], [6, 8], [10, 12]])\na.shape  # (3, 2): três linhas e duas colunas\na.ndim   # 2: dois eixos\na.size   # 6: três vezes dois elementos",
    "steps": [
      "Conte as linhas e os elementos de cada linha.",
      "Escreva shape na ordem dos eixos.",
      "Multiplique as dimensões para conferir size."
    ],
    "trap": "Arrays com o mesmo size podem ter shapes diferentes; (4,) e (2,2) não representam a mesma estrutura.",
    "transfer": {
      "id": "PY-NP-C02-TRANSFER-v1",
      "prompt": "Um ndarray tem shape=(3,4). Quais são, respectivamente, ndim e size?",
      "options": [
        "3 e 4",
        "2 e 7",
        "2 e 12",
        "12 e 2"
      ],
      "answer": 2,
      "explanation": "A tupla tem dois eixos: ndim=2. Há 3×4=12 elementos: size=12.",
      "feedbackByOption": {
        "option_1": "3 e 4 são tamanhos dos eixos, não ndim e size.",
        "option_2": "Há dois eixos, mas size é o produto 3×4, não a soma.",
        "option_3": "A tupla tem dois eixos: ndim=2. Há 3×4=12 elementos: size=12.",
        "option_4": "Os valores estão invertidos: ndim conta eixos; size conta elementos."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "PY-NP-C03": {
    "sessionId": "NP-001",
    "version": "1.0.0",
    "paragraphs": [
      "dtype é o tipo usado para representar os elementos do array. Em um array numérico comum, misturar inteiros com um número de ponto flutuante geralmente faz os inteiros serem representados como ponto flutuante também.",
      "Por exemplo, [2, 3.5, 6] vira um array de floats: 2 passa a ser representado como 2.0. Um dtype explícito muda a conversão; por isso confira se a questão forneceu dtype=... em vez de presumir uma regra universal."
    ],
    "code": "import numpy as np\na = np.array([2, 3.5, 6])\nprint(a)  # [2.  3.5 6. ]\n# a tem um dtype numérico comum de ponto flutuante.",
    "steps": [
      "Procure dtype explícito.",
      "Se não houver, examine os valores que precisam ser representados.",
      "Inteiros e floats no exemplo comum são acomodados por um dtype de ponto flutuante."
    ],
    "trap": "Homogeneidade é do dtype. Arrays com dtype=object existem; isso não transforma um array comum em uma lista Python.",
    "transfer": {
      "id": "PY-NP-C03-TRANSFER-v1",
      "prompt": "Sem dtype explícito, np.array([4, 1.5]) normalmente usa:",
      "options": [
        "Um tipo inteiro e outro float, um dtype para cada posição",
        "Um dtype comum de ponto flutuante",
        "Somente inteiros, sempre truncando 1.5",
        "Uma lista, não um array"
      ],
      "answer": 1,
      "explanation": "O dtype de ponto flutuante acomoda 4 e 1.5; 4 passa a ser representado como 4.0.",
      "feedbackByOption": {
        "option_1": "Um ndarray tem um dtype comum; não um dtype independente por posição.",
        "option_2": "O dtype de ponto flutuante acomoda 4 e 1.5; 4 passa a ser representado como 4.0.",
        "option_3": "Sem forçar conversão para inteiro, o exemplo preserva o valor fracionário.",
        "option_4": "np.array cria um ndarray; a lista de entrada não muda isso."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "PY-NP-C04": {
    "sessionId": "NP-001",
    "version": "1.0.0",
    "paragraphs": [
      "Em a[linha, coluna], cada índice começa em zero. Primeiro escolha a linha; dentro dela, escolha a coluna. Em a[início:fim], o início entra e o fim fica de fora.",
      "Em 2D, a[:,1] significa todas as linhas da coluna de índice 1. O dois-pontos sozinho seleciona o eixo inteiro. Não troque a ordem: a[1,0] e a[0,1] podem apontar para valores diferentes."
    ],
    "code": "import numpy as np\na = np.array([[5, 7, 9], [11, 13, 15]])\na[1, 2]  # 15: segunda linha, terceira coluna\na[:, 0]  # [5 11]: primeira coluna\na[0, 1:3] # [7 9]: primeira linha, índices 1 e 2",
    "steps": [
      "Numere linhas e colunas a partir de zero.",
      "Resolva uma seleção de cada vez.",
      "Nos slices, exclua o limite final. Slicing básico geralmente cria uma view: alterar a view pode alterar o array original."
    ],
    "trap": "Em listas aninhadas usa-se frequentemente a[1][0]; em NumPy a[1,0] expressa os dois eixos juntos.",
    "transfer": {
      "id": "PY-NP-C04-TRANSFER-v1",
      "prompt": "Para a=np.array([[2,4,6],[8,10,12]]), qual é a[:,1]?",
      "options": [
        "[2,4,6]",
        "[2,8]",
        "[4,10]",
        "[8,10,12]"
      ],
      "answer": 2,
      "explanation": "Os dois-pontos mantêm todas as linhas; a coluna de índice 1 contém 4 e 10.",
      "feedbackByOption": {
        "option_1": "Essa é a primeira linha. O comando pede a coluna de índice 1 em todas as linhas.",
        "option_2": "[2,8] é a coluna de índice 0.",
        "option_3": "Os dois-pontos mantêm todas as linhas; a coluna de índice 1 contém 4 e 10.",
        "option_4": "Essa é a segunda linha. O índice 1 está na posição de coluna, não de linha."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "PY-NP-C05": {
    "sessionId": "NP-001",
    "version": "1.0.0",
    "paragraphs": [
      "Vetorizar uma operação significa expressá-la diretamente sobre o array. Somar um escalar a um array numérico soma esse valor a cada elemento; o resultado mantém o shape nesse caso.",
      "Com dois arrays do mesmo shape, +, − e * operam posição a posição. O produto matricial usa @ em arrays 2D compatíveis. Não confunda multiplicação elemento a elemento com o cálculo linha por coluna."
    ],
    "code": "import numpy as np\na = np.array([2, 4, 6])\na + 3    # [5 7 9]\na * 2    # [4 8 12]\nb = np.array([10, 20, 30])\na + b    # [12 24 36]",
    "steps": [
      "Identifique o operador.",
      "Veja se o outro operando é escalar ou array compatível.",
      "Aplique a operação aos elementos correspondentes; não acrescente novas posições."
    ],
    "trap": "Broadcasting tem regras de compatibilidade; não significa que quaisquer shapes podem ser combinados.",
    "transfer": {
      "id": "PY-NP-C05-TRANSFER-v1",
      "prompt": "Considere a=np.array([2,4]) e b=np.array([3,5]). Quanto vale a*b?",
      "options": [
        "[6,20]",
        "26",
        "[5,9]",
        "[2,4,3,5]"
      ],
      "answer": 0,
      "explanation": "* multiplica posição a posição: 2×3=6 e 4×5=20.",
      "feedbackByOption": {
        "option_1": "* multiplica posição a posição: 2×3=6 e 4×5=20.",
        "option_2": "26 seria a soma dos produtos; a*b sozinho não faz essa soma.",
        "option_3": "[5,9] é a+b.",
        "option_4": "Concatenar não é o efeito de * entre arrays numéricos."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  },
  "PY-NP-C06": {
    "sessionId": "NP-001",
    "version": "1.0.0",
    "paragraphs": [
      "np.arange(início, parada, passo) gera valores sem incluir a parada, no uso com inteiros. np.zeros(shape) e np.ones(shape) criam arrays preenchidos; sum soma elementos e mean calcula a média.",
      "Sem axis, sum e mean consideram todos os elementos. Em uma tabela 2D, axis=0 agrega entre as linhas e produz um resultado por coluna; axis=1 agrega dentro de cada linha."
    ],
    "code": "import numpy as np\nnp.arange(1, 8, 2) # [1 3 5 7]\nnp.zeros((2, 3))  # duas linhas, três colunas de zeros\na = np.array([[1, 3], [5, 7]])\na.sum()           # 16\na.mean()          # 4.0\na.sum(axis=0)     # [6 10]\na.sum(axis=1)     # [4 12]",
    "steps": [
      "Separe criação de array de agregação.",
      "Em arange com inteiros, avance pelo passo e pare antes do limite.",
      "Em sum/mean, confira axis antes de calcular."
    ],
    "trap": "A média divide a soma pela quantidade de elementos considerada; sum não divide. zeros/ones usam floats por padrão, a menos que dtype seja especificado.",
    "transfer": {
      "id": "PY-NP-C06-TRANSFER-v1",
      "prompt": "Considere a=np.array([[2,6],[4,8]]). Qual é a.mean(axis=1)?",
      "options": [
        "[3,7]",
        "[4,6]",
        "5",
        "[8,12]"
      ],
      "answer": 1,
      "explanation": "axis=1 calcula por linha: (2+6)/2=4 e (4+8)/2=6.",
      "feedbackByOption": {
        "option_1": "[3,7] são as médias por coluna, obtidas com axis=0.",
        "option_2": "axis=1 calcula por linha: (2+6)/2=4 e (4+8)/2=6.",
        "option_3": "5 é a média de todos os elementos, sem axis.",
        "option_4": "[8,12] são as somas por linha; mean também divide por dois."
      },
      "provenance": {
        "kind": "authorial",
        "label": "Aplicação autoral em outro exemplo"
      }
    }
  }
};
