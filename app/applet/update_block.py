with open("server.ts", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

old_block = """              const prevSlot = diarias[horario];
              const sn = normalizeMassName(prevSlot.nome || '');
              const slotKey = `${dt}|${normalizeHorario(horario)}|${sn}`;

              if (slot && prevSlot.ministros && Array.isArray(prevSlot.ministros)) {"""

new_block = """              const prevSlot = diarias[horario];
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

if old_block in text:
    text = text.replace(old_block, new_block)
    with open("server.ts", "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated successfully!")
else:
    print("Not found!")
