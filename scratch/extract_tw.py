import re
try:
    with open('scratch/old_index.html', 'r', encoding='utf-16') as f:
        content = f.read()
except:
    with open('scratch/old_index.html', 'r', encoding='utf-8') as f:
        content = f.read()

match = re.search(r'(<script id="tailwind-config".*?</script>)', content, re.DOTALL)
if match:
    with open('scratch/tw_config.txt', 'w', encoding='utf-8') as f:
        f.write(match.group(1))
    print("Extracted!")
else:
    print("Not found")
