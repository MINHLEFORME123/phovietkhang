import os

directory = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang'
html_files = [f for f in os.listdir(directory) if f.endswith('.html')]

trusted_types_script = """<script>
  if (window.trustedTypes && trustedTypes.createPolicy) {
    trustedTypes.createPolicy('default', {
      createHTML: string => string,
      createScriptURL: string => string,
      createScript: string => string,
    });
  }
</script>
"""

for filename in html_files:
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "trustedTypes.createPolicy" not in content:
        # Insert right after <head>
        content = content.replace('<head>', f'<head>\n{trusted_types_script}')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Injected Trusted Types policy to all HTML files.")
