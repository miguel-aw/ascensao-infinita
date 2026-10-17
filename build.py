# Junta econ.js dentro de ui.html e gera o jogo em um arquivo único (index.html).
s = open('ui.html').read().replace('/*ECON*/', open('econ.js').read())
open('index.html', 'w').write(s)
open('ascensao_infinita.html', 'w').write(s)
print('ok')
