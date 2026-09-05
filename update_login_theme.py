
import os

# Define the pattern to replace
# Looking for blue-related classes in the login container
old_container_pattern = 'bg-gradient-to-br from-blue-50 to-blue-100/50'
new_container_pattern = 'bg-gradient-to-br from-red-50 to-red-100/50'

old_border_pattern = 'border-blue-300/40'
new_border_pattern = 'border-red-300/40'

old_shadow_pattern = 'shadow-[0_8px_32px_rgba(31,38,135,0.07)]'
new_shadow_pattern = 'shadow-[0_8px_32px_rgba(135,31,38,0.07)]'

old_tab_bg_pattern = 'bg-blue-900/[0.05]'
new_tab_bg_pattern = 'bg-red-900/[0.05]'

old_tab_border_pattern = 'border-blue-200/50'
new_tab_border_pattern = 'border-red-200/50'

old_login_btn_active_pattern = 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
new_login_btn_active_pattern = 'bg-red-600 text-white shadow-lg shadow-red-500/20'

old_cad_btn_active_pattern = 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' # Emerald is fine
new_cad_btn_active_pattern = 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'

old_sup_btn_active_pattern = 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
new_sup_btn_active_pattern = 'bg-red-500/80 text-white shadow-lg shadow-red-500/20'

file_path = "src/App.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Apply replacements specifically in the LoginView area if possible, 
# or globally if it makes sense (the user asked for the login screen)
# To be safe, I will do a broader replacement but check for context if needed.
# Since the prompt is "na tela inicial de login", I should be careful.

# Given the structure of the previous edit, I can target the LoginView specifically 
# by searching for the container class.

content = content.replace(old_container_pattern, new_container_pattern)
content = content.replace(old_border_pattern, new_border_pattern)
content = content.replace(old_shadow_pattern, new_shadow_pattern)
content = content.replace(old_tab_bg_pattern, new_tab_bg_pattern)
content = content.replace(old_tab_border_pattern, new_tab_border_pattern)
content = content.replace(old_login_btn_active_pattern, new_login_btn_active_pattern)
content = content.replace(old_sup_btn_active_pattern, new_sup_btn_active_pattern)

with open(file_path, "w") as f:
    f.write(content)

print("Login screen styles updated to red theme.")
