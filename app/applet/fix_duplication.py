with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find all occurrences of `{activeTab === "relatorios" && (`
r_pos = []
pos = 0
while True:
    idx = text.find('{activeTab === "relatorios" && (', pos)
    if idx == -1:
        break
    r_pos.append(idx)
    pos = idx + 1

print('r_pos:', r_pos)

# Find first `{activeTab === "escala" && (` after r_pos[0]
e_idx = text.find('{activeTab === "escala" && (')
print('e_idx:', e_idx)
