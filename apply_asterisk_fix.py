
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Flag icon with asterisk in all three places
# Look for: {isLider && ( ... <Flag ... )}
# Pattern matches the span/div containing Flag and replaces with just the asterisk

import re

# This pattern looks for the structure:
# {isLider && (
#   <span ... title="Responsável da Missa">
#     <Flag ... />
#   </span>
# )}
# And replaces it with:
# {isLider && (
#   <span className="ml-1 font-black text-blue-900">*</span>
# )}

# Since the structure varies slightly, I'll use a more generic replace approach.
# 1. First, ensure the text in the span is updated.
# 2. Then remove the Flag.

# Search for the block {isLider && ( ... <Flag ... )}
# I will use a regex to find the Flag component and replace the whole span block if needed.

# Actually, simply searching for `<Flag` and replacing it with `*` inside the relevant blocks is easier.
# BUT Flag is an icon component. I should replace it with just the character '*'.

# Revised approach:
# Search for {isLider && (<span ... > <Flag ... /> </span>)}
# And replace with {isLider && (<span ... > * </span>)}

# Pattern to catch the span block that contains the Flag
flag_block_pattern = r'\{isLider && \(\s*<span [^>]*title="Responsável da Missa"[^>]*>\s*<Flag[^>]*\/>\s*<\/span>\s*\)\}'
# Replacement
new_block = '{isLider && (<span className="ml-1 font-bold text-blue-900" title="Responsável da Missa">*</span>)}'

content = re.sub(flag_block_pattern, new_block, content, flags=re.DOTALL)

# For the smaller flag (the one without title="Responsável da Missa")
# Search for {isLider && isActualCoord && ( <Flag ... /> )}
small_flag_pattern = r'\{isLider && isActualCoord && \(\s*<Flag[^>]*\/>\s*\)\}'
new_small_block = '{isLider && isActualCoord && (<span className="ml-1 font-bold text-blue-900">*</span>)}'

content = re.sub(small_flag_pattern, new_small_block, content, flags=re.DOTALL)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced Flags with *')
