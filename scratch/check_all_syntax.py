import os
import re
import subprocess
import tempfile
from bs4 import BeautifulSoup

def check_js_syntax(filepath):
    """Checks JS file syntax using node -c"""
    result = subprocess.run(['node', '-c', filepath], capture_output=True, text=True)
    if result.returncode != 0:
        return result.stderr.strip()
    return None

def check_html_script_syntax(filepath):
    """Extracts inline scripts from HTML and checks their syntax using node -c"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    scripts = soup.find_all('script')
    
    errors = []
    for idx, script in enumerate(scripts):
        # Skip JSON-LD scripts
        if script.get('type') == 'application/ld+json':
            continue
        if script.string and script.string.strip():
            # Create a temporary file
            with tempfile.NamedTemporaryFile(suffix='.js', mode='w', delete=False, encoding='utf-8') as tmp:
                # Wrap inside an async function or just raw JS depending on exports/modules
                code = script.string
                # If script is module, we might have import statements, but node -c can still check basic syntax.
                # If there are import statements, node -c might fail without --experimental-modules, but -c is generally fine.
                tmp.write(code)
                tmp_path = tmp.name
            
            try:
                # Run node -c on the temporary JS file
                result = subprocess.run(['node', '-c', tmp_path], capture_output=True, text=True)
                if result.returncode != 0:
                    errors.append(f"Inline script #{idx+1} syntax error:\n{result.stderr.strip()}")
            finally:
                os.remove(tmp_path)
    return errors

def verify_internal_links_and_assets(filepath, root_dir):
    """Verifies that links and script/link src point to actual files in the workspace"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    soup = BeautifulSoup(content, 'html.parser')
    errors = []
    
    # 1. Check link stylesheets and scripts
    for tag in soup.find_all(['link', 'script', 'img']):
        src_attr = 'href' if tag.name == 'link' else 'src'
        url = tag.get(src_attr)
        if not url:
            continue
            
        # Ignore external URLs, hashes, protocol-relative, etc.
        if url.startswith(('http://', 'https://', '//', '#', 'data:')):
            continue
            
        # Convert absolute path to local path
        if url.startswith('/'):
            local_path = os.path.join(root_dir, url.lstrip('/'))
        else:
            # Relative to file directory
            local_path = os.path.abspath(os.path.join(os.path.dirname(filepath), url))
            
        # Strip query parameters (like ?v=8)
        local_path = local_path.split('?')[0]
        
        # Check if file exists
        if not os.path.exists(local_path):
            errors.append(f"Missing referenced asset: {url} (resolved to: {os.path.relpath(local_path, root_dir)})")
            
    # 2. Check internal href links (a tags)
    for tag in soup.find_all('a'):
        href = tag.get('href')
        if not href:
            continue
        if href.startswith(('http://', 'https://', '//', '#', 'javascript:', 'tel:', 'mailto:')):
            continue
            
        # Clean URL format checking
        # If href is e.g. "/menu", the actual file is "menu.html" in the root directory
        url_path = href.split('?')[0].split('#')[0]
        if url_path == '/':
            local_path = os.path.join(root_dir, 'index.html')
        elif url_path.startswith('/'):
            # It could be /menu (clean URL) -> menu.html or /admin/user-manager -> admin/user-manager.html
            parts = url_path.lstrip('/').split('/')
            # Try matching as clean URL (.html suffix)
            filename = parts[-1]
            if not filename.endswith('.html'):
                filename = filename + '.html'
            parent_dir = os.path.join(root_dir, *parts[:-1]) if len(parts) > 1 else root_dir
            local_path = os.path.join(parent_dir, filename)
            
            # If not found, check if it's a directory (e.g. /admin/ -> admin/index.html)
            if not os.path.exists(local_path):
                local_path_dir = os.path.join(root_dir, url_path.lstrip('/'), 'index.html')
                if os.path.exists(local_path_dir):
                    local_path = local_path_dir
        else:
            # Relative link
            parts = url_path.split('/')
            filename = parts[-1]
            if not filename.endswith('.html'):
                filename = filename + '.html'
            file_dir = os.path.dirname(filepath)
            parent_dir = os.path.join(file_dir, *parts[:-1]) if len(parts) > 1 else file_dir
            local_path = os.path.join(parent_dir, filename)
            
            if not os.path.exists(local_path):
                local_path_dir = os.path.join(file_dir, url_path, 'index.html')
                if os.path.exists(local_path_dir):
                    local_path = local_path_dir

        if not os.path.exists(local_path) and not os.path.exists(local_path.replace('.html', '')):
            errors.append(f"Broken link: href=\"{href}\" (resolved to: {os.path.relpath(local_path, root_dir)})")
            
    return errors

def audit_project(root_dir):
    js_errors = {}
    html_js_errors = {}
    broken_links_assets = {}
    
    for root, dirs, files in os.walk(root_dir):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '.gemini', 'scratch', 'FM-Radio-App', '.firebase')]
        
        for file in files:
            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, root_dir)
            
            # Check standalone JS files
            if file.endswith(('.js', '.mjs')):
                err = check_js_syntax(filepath)
                if err:
                    js_errors[rel_path] = err
                    
            # Check HTML files
            elif file.endswith('.html'):
                # Check inline JS syntax
                inline_errs = check_html_script_syntax(filepath)
                if inline_errs:
                    html_js_errors[rel_path] = inline_errs
                    
                # Check broken links and assets
                link_errs = verify_internal_links_and_assets(filepath, root_dir)
                if link_errs:
                    broken_links_assets[rel_path] = link_errs

    # Print Report
    print("==================================================")
    print("               STANDALONE JS ERRORS               ")
    print("==================================================")
    if not js_errors:
        print("No syntax errors found in standalone JS files.")
    for file, err in js_errors.items():
        print(f"File: {file}\nError:\n{err}\n" + "-"*40)
        
    print("\n==================================================")
    print("             INLINE HTML SCRIPT ERRORS             ")
    print("==================================================")
    if not html_js_errors:
        print("No syntax errors found in inline HTML scripts.")
    for file, errs in html_js_errors.items():
        print(f"File: {file}")
        for err in errs:
            print(f"- {err}")
        print("-"*40)
        
    print("\n==================================================")
    print("             BROKEN LINKS AND ASSETS              ")
    print("==================================================")
    if not broken_links_assets:
        print("No broken links or missing assets found.")
    for file, errs in broken_links_assets.items():
        print(f"File: {file}")
        for err in errs:
            print(f"- {err}")
        print("-"*40)

if __name__ == "__main__":
    desktop_dir = r"C:\Users\minhb\OneDrive\Desktop\phovietkhang"
    audit_project(desktop_dir)
