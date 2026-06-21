import os

def check_quotes(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '.gemini' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for double quote issues like href="/"" or href="/menu""
                issues = []
                if 'href="/""' in content:
                    issues.append('href="/""')
                if 'href="/menu""' in content:
                    issues.append('href="/menu""')
                if 'href="/locations""' in content:
                    issues.append('href="/locations""')
                if 'href="/contact""' in content:
                    issues.append('href="/contact""')
                if 'href="/inbox""' in content:
                    issues.append('href="/inbox""')
                
                if issues:
                    print(f"File: {os.path.relpath(filepath, directory)} contains: {issues}")

if __name__ == "__main__":
    check_quotes(r"C:\Users\minhb\OneDrive\Desktop\phovietkhang")
