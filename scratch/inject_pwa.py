import os
import glob

# Path to workspace
workspace_dir = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

# Files to skip
skip_files = ['node_modules', '.git', '.firebase']

manifest_tag = '    <link rel="manifest" href="/manifest.json">\n'
sw_script = """
    <!-- PWA Service Worker -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered!', reg))
            .catch(err => console.error('Service Worker registration failed', err));
        });
      }
    </script>
"""

def inject_pwa_tags():
    count = 0
    # recursively find all .html files
    for root, dirs, files in os.walk(workspace_dir):
        # skip unwanted directories
        dirs[:] = [d for d in dirs if d not in skip_files]
        
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                modified = False
                
                # Check for manifest
                if 'manifest.json' not in content and '</head>' in content:
                    content = content.replace('</head>', manifest_tag + '</head>')
                    modified = True
                
                # Check for service worker
                if 'serviceWorker.register' not in content and '</body>' in content:
                    content = content.replace('</body>', sw_script + '</body>')
                    modified = True
                
                if modified:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Injected PWA to {file_path}")
                    count += 1
                    
    print(f"Total files updated for PWA: {count}")

if __name__ == '__main__':
    inject_pwa_tags()
