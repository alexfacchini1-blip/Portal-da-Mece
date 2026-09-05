
import os

# Define the pattern to replace
# Looking for red-related classes in the login container
old_container_pattern = 'bg-gradient-to-br from-red-50 to-red-100/50'
new_container_pattern = 'bg-white'

file_path = "src/App.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Apply replacement specifically for the background class in the container
content = content.replace(old_container_pattern, new_container_pattern)

with open(file_path, "w") as f:
    f.write(content)

print("Login screen background reverted to white.")
