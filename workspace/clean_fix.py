with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all occurrences of '{activeTab === "relatorios" && ('
r_pos = []
pos = 0
while True:
    idx = text.find('{activeTab === "relatorios" && (', pos)
    if idx == -1:
        break
    r_pos.append(idx)
    pos = idx + 1

print('r_pos:', r_pos)

# Find all occurrences of '{activeTab === "escala" && ('
e_pos = []
pos = 0
while True:
    idx = text.find('{activeTab === "escala" && (', pos)
    if idx == -1:
        break
    e_pos.append(idx)
    pos = idx + 1

print('e_pos:', e_pos)
