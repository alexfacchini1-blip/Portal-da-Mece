
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Chunk 1
old1 = '''                                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                                              isLider
                                                ? "bg-blue-900/5 border-blue-900/30 text-blue-950 font-black shadow-xs"
                                                : "bg-slate-50 border-slate-100/80 text-slate-700"
                                            }`}'''
new1 = '''                                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border transition-all bg-slate-50 border-slate-100/80 text-slate-700`}'''

# Chunk 2
old2 = '''                                              className={`flex items-center justify-between gap-2 p-1 rounded ${isLider ? "bg-blue-900/5 border border-blue-900/20" : ""}`}'''
new2 = '''                                              className={`flex items-center justify-between gap-2 p-1 rounded`}'''

# Chunk 3
old3 = '''                                                        className={`text-xs font-bold flex items-center justify-between gap-2 p-1.5 rounded-lg transition-all ${
                                                          isLider
                                                            ? "bg-blue-900/5 border border-blue-900/30 text-blue-950 shadow-xs"
                                                            : isMe
                                                            ? "text-liturgy-700 bg-liturgy-50 border border-liturgy-100"
                                                            : isDomingo
                                                            ? "text-red-800 bg-red-50/30"
                                                            : "text-slate-700 bg-slate-50/50"
                                                        }`}'''
new3 = '''                                                        className={`text-xs font-bold flex items-center justify-between gap-2 p-1.5 rounded-lg transition-all ${
                                                          isMe
                                                            ? "text-liturgy-700 bg-liturgy-50 border border-liturgy-100"
                                                            : isDomingo
                                                            ? "text-red-800 bg-red-50/30"
                                                            : "text-slate-700 bg-slate-50/50"
                                                        }`}'''

content = content.replace(old1, new1)
content = content.replace(old2, new2)
content = content.replace(old3, new3)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced leader styles')
