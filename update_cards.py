
import os

# Define the old pattern and the new replacement
old_pattern = 'className="bg-white rounded-2xl shadow-sm border border-slate-200'
new_pattern = 'className="bg-blue-900/[0.04] backdrop-blur-md border border-blue-300/40 shadow-[0_4px_16px_rgba(59,130,246,0.06),inset_0_1px_1px_rgba(255,255,255,0.75)] rounded-2xl'

# Files to update
files_to_update = ["src/App.tsx", "src/components/WelcomeView.tsx"]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r") as f:
        content = f.read()
    
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        with open(file_path, "w") as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Pattern not found in {file_path}")
