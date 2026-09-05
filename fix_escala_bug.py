import re

with open("server.ts", "r", encoding="utf-8") as f:
    text = f.read()

target = """          // Para ministros, mostra o mês atual ou se estiver publicado
          let isMesPublicado = !!escalaPublicadaPorMes[mes] || !!escalaPublicadaPorParoquia || !!db.data.config.escalaPublicada;
          
          // let isMesPublicado = !!escalaPublicadaPorMes[mes] || !!escalaPublicadaPorParoquia || !!db.data.config.escalaPublicada;
          if (isMesPublicado) {"""

# Ah I modified it partially already, let's just do a regex replace
text = re.sub(r"let isMesPublicado = !!escalaPublicadaPorMes\[mes\][^\{]+if \([^\)]+\) \{", 
"""let isMesPublicado = !!escalaPublicadaPorMes[mes] || !!escalaPublicadaPorParoquia || !!db.data.config.escalaPublicada;
          
          if (isMesPublicado) {""", text)

with open("server.ts", "w", encoding="utf-8") as f:
    f.write(text)
print("Done")
