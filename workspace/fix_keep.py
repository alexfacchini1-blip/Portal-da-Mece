with open("server.ts", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

old_snippet = """              const prevSlot = diarias[horario];
              const sn = normalizeMassName(prevSlot.nome || '');
              const slotKey = `${dt}|${normalizeHorario(horario)}|${sn}`;

              if (slot && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {"""

new_snippet = """              const prevSlot = diarias[horario];
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
              const slot = targetSlotKey ? slots[targetSlotKey] : null;

              if (slot && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {"""

if old_snippet in text:
    text = text.replace(old_snippet, new_snippet)
    print("Replaced old snippet successfully!")
else:
    print("Old snippet not found!")

# Also make sure slots[slotKey] is replaced with slot in the keepExisting block
pos_keep = text.find("if (keepExisting")
pos_end_keep = text.find("Shuffle physically once", pos_keep)
if pos_keep != -1 and pos_end_keep != -1:
    keep_block = text[pos_keep:pos_end_keep]
    updated_block = keep_block.replace("slots[slotKey]", "slot")
    text = text[:pos_keep] + updated_block + text[pos_end_keep:]
    print("Replaced slots[slotKey] occurrences successfully!")

with open("server.ts", "w", encoding="utf-8") as f:
    f.write(text)
