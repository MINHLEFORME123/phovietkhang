import os

def fix_quotes(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace broken double quotes
    new_content = content.replace('href="/""', 'href="/"')
    new_content = new_content.replace('href="/menu""', 'href="/menu"')
    new_content = new_content.replace('href="/locations""', 'href="/locations"')
    new_content = new_content.replace('href="/contact""', 'href="/contact"')
    new_content = new_content.replace('href="/inbox""', 'href="/inbox"')
    new_content = new_content.replace('href="/reservations""', 'href="/reservations"')
    new_content = new_content.replace('href="/register""', 'href="/register"')
    new_content = new_content.replace('href="/cart""', 'href="/cart"')
    new_content = new_content.replace('href="/login""', 'href="/login"')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '.gemini' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    if fix_quotes(filepath):
                        print(f"Fixed quotes in: {os.path.relpath(filepath, directory)}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    desktop_dir = r"C:\Users\minhb\OneDrive\Desktop\phovietkhang"
    github_dir = r"C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang"
    
    print("Fixing Desktop directory...")
    process_directory(desktop_dir)
    
    print("Fixing GitHub directory...")
    process_directory(github_dir)
    
    print("Done!")
