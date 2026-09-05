import re

with open("server.ts", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Replace liderancasHistoricas initialization
target1 = """      const liderancasHistoricas: { [nome: string]: number } = {};
      if (db.data.escalaGerada && db.data.escalaGerada[targetParoquia]) {
        Object.values(db.data.escalaGerada[targetParoquia]).forEach((dia: any) => {
          Object.values(dia).forEach((missa: any) => {
            if (missa.lider) {
              liderancasHistoricas[missa.lider] = (liderancasHistoricas[missa.lider] || 0) + 1;
            }
          });
        });
      }"""

replacement1 = """      // O histórico de lideranças foi resetado para não penalizar quem foi muito líder no mês passado
      const liderancasHistoricas: { [nome: string]: number } = {};"""
      
if target1 in text:
    text = text.replace(target1, replacement1, 1)
    print("Replaced target1")
else:
    print("target1 not found")

with open("server.ts", "w", encoding="utf-8") as f:
    f.write(text)
