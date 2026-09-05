with open("server.ts", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = """              const prevSlot = diarias[horario];
              const sn = normalizeMassName(prevSlot.nome || '');
              const slotKey = `${dt}|${normalizeHorario(horario)}|${sn}`;

              if (slots[slotKey] && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {
                prevSlot.ministros.forEach((pmNome: string) => {"""

replacement = """              const prevSlot = diarias[horario];
              const sn = normalizeMassName(prevSlot.nome || '');
              const slotKey = `${dt}|${normalizeHorario(horario)}|${sn}`;
              let targetSlotKey = slots[slotKey] ? slotKey : null;
              if (!targetSlotKey) {
                const normH = normalizeHorario(horario);
                const matchingKey = Object.keys(slots).find(k => {
                  const s = slots[k];
                  return s.data === dt && normalizeHorario(s.horario) === normH;
                });
                if (matchingKey) {
                  targetSlotKey = matchingKey;
                }
              }

              if (targetSlotKey && slots[targetSlotKey] && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {
                const slot = slots[targetSlotKey];
                prevSlot.ministros.forEach((pmNome: string) => {"""

if target in text:
    text = text.replace(target, replacement)
    print("Replaced header successfully!")
else:
    print("Target header not found!")

pos_keep = text.find("if (keepExisting")
pos_end_keep = text.find("Shuffle physically once", pos_keep)
if pos_keep != -1 and pos_end_keep != -1:
    keep_block = text[pos_keep:pos_end_keep]
    updated_block = keep_block.replace("slots[slotKey]", "slot")
    text = text[:pos_keep] + updated_block + text[pos_end_keep:]
    print("Replaced slots[slotKey] occurrences successfully!")

with open("server.ts", "w", encoding="utf-8") as f:
    f.write(text)
