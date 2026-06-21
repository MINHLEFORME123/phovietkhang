import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

META_TAGS = """
    <!-- Fallback Security Headers -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' https: 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https: blob:; font-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'self';">
    <meta name="referrer" content="strict-origin-when-cross-origin">
"""

def process_html_file(fpath):
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # 1. Add Meta tags before </head>
    if "Content-Security-Policy" not in content:
        content = content.replace("</head>", META_TAGS + "</head>")

    # 2. Fix <form> tags
    # Find all <form ...>
    def fix_form(match):
        form_tag = match.group(0)
        new_tag = form_tag
        if 'method="' not in new_tag:
            # insert method="POST"
            new_tag = new_tag.replace('<form', '<form method="POST"')
        if 'onsubmit=' not in new_tag:
            # insert onsubmit
            new_tag = new_tag.replace('<form', '<form onsubmit="return false;"')
        return new_tag

    content = re.sub(r'<form\b[^>]*>', fix_form, content)

    if content != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {fpath}")

for root, dirs, files in os.walk(ROOT):
    # skip some dirs
    if "node_modules" in root or ".git" in root or "scratch" in root:
        continue
    for fname in files:
        if fname.endswith(".html") and fname not in ["index_test.html"]:
            process_html_file(os.path.join(root, fname))

print("Done fixing security.")
