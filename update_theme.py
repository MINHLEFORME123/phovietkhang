import os
import re

files_to_update = [
    'admin/index.html',
    'admin/user-manager.html',
    'admin/order-manager.html',
    'admin/food-list.html',
    'admin/food-add.html',
    'admin/reservations.html',
    'admin/feedback.html',
    'admin/messages.html',
    'kitchen/index.html',
    'host/index.html'
]

tailwind_config_str = '''<script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          "colors": {
                  "inverse-primary": "#a9c7ff",
                  "surface-dim": "#d8dadc",
                  "outline-variant": "#c4c6d0",
                  "on-surface": "#191c1e",
                  "outline": "#747780",
                  "secondary-fixed-dim": "#c8c6c5",
                  "on-error-container": "#93000a",
                  "surface-container-highest": "#e0e3e5",
                  "tertiary-fixed-dim": "#b7c8e1",
                  "background": "#f7f9fb",
                  "surface-tint": "#405f91",
                  "on-secondary-fixed": "#1c1b1b",
                  "on-primary-fixed": "#001b3d",
                  "on-tertiary-fixed": "#0b1c30",
                  "secondary-container": "#e2dfde",
                  "on-secondary-container": "#636262",
                  "surface-bright": "#f7f9fb",
                  "on-primary-fixed-variant": "#264778",
                  "error-container": "#ffdad6",
                  "primary-container": "#002b5b",
                  "on-secondary-fixed-variant": "#474746",
                  "surface": "#f7f9fb",
                  "on-error": "#ffffff",
                  "tertiary-container": "#1d2d41",
                  "inverse-on-surface": "#eff1f3",
                  "secondary": "#5f5e5e",
                  "tertiary-fixed": "#d3e4fe",
                  "on-tertiary-container": "#8495ad",
                  "primary-fixed-dim": "#a9c7ff",
                  "surface-variant": "#e0e3e5",
                  "on-primary-container": "#7594ca",
                  "on-primary": "#ffffff",
                  "surface-container-high": "#e6e8ea",
                  "surface-container-low": "#f2f4f6",
                  "on-surface-variant": "#43474f",
                  "error": "#ba1a1a",
                  "primary": "#001736",
                  "on-tertiary-fixed-variant": "#38485d",
                  "primary-fixed": "#d6e3ff",
                  "on-tertiary": "#ffffff",
                  "inverse-surface": "#2d3133",
                  "surface-container": "#eceef0",
                  "secondary-fixed": "#e5e2e1",
                  "surface-container-lowest": "#ffffff",
                  "tertiary": "#07182b",
                  "on-background": "#191c1e",
                  "on-secondary": "#ffffff"
          },
          "fontFamily": {
                  "headline-md": ["EB Garamond"],
                  "body-md": ["Inter"]
          }
        }
      }
    }
    </script>
    <style>
        .bg-pattern-light {
            background-image: linear-gradient(rgba(211, 211, 255, 0.85), rgba(255, 255, 255, 0.85)), url('https://lh3.googleusercontent.com/aida/AP1WRLu6c1eOBycoOhr8d1SXuiHHJ2p6UFS7W2aOZkBXjny6fvIs_6xymLzH0UsMR7FkOSpmq8iA3Rgj70jVG88PGuJNINDzY5gsPYOgnDgBh3IcKArWymKf-uL7T7agVDPUQUJOCSw0gvHUm-wOQkE9H9OVVAAbstEFTKz5Z8_Lg8OSzO2KJuFfVFtK3doqWktfqKKktFzNLf_TzWkD-TcfU94V1-qBjNCjlurGOnhw60gdCD9fBNRYgHzWMpMp') !important;
            background-repeat: repeat;
            background-size: 400px;
            background-attachment: fixed;
        }
    </style>'''

for fpath in files_to_update:
    if not os.path.exists(fpath):
        print(f'{fpath} does not exist.')
        continue
    
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace tailwind config block
    # Match from <script>\s*tailwind.config to </script>
    content = re.sub(r'<script>\s*tailwind\.config.*?<\/script>', tailwind_config_str, content, flags=re.DOTALL)
    
    # 2. Replace body class
    # Replace anything in body class with the new ones
    content = re.sub(r'<body class=\"[^\"]*\"', '<body class=\"text-on-surface antialiased flex h-screen overflow-hidden bg-pattern-light\"', content)
    
    # 3. Class Replacements for semantic tokens
    # Using word boundaries or space matches to prevent partial class replacement
    content = content.replace('bg-surface ', 'bg-surface/90 backdrop-blur-md ')
    content = content.replace('bg-surface"', 'bg-surface/90 backdrop-blur-md"')
    
    content = content.replace('border-gray-800', 'border-outline-variant/30')
    content = content.replace('border-gray-700', 'border-outline-variant/50')
    
    content = content.replace('text-white', 'text-on-surface')
    content = content.replace('text-gray-300', 'text-on-surface-variant')
    content = content.replace('text-gray-400', 'text-secondary')
    content = content.replace('text-gray-500', 'text-outline')
    
    content = content.replace('bg-gray-900', 'bg-surface-container')
    content = content.replace('bg-gray-800', 'bg-surface-container-highest')
    content = content.replace('bg-[#0b0f19]', 'bg-pattern-light')

    content = content.replace('hover:bg-surface-highlight', 'hover:bg-surface-container-high')
    content = content.replace('bg-primary/20 text-primary', 'bg-primary-container text-on-primary-container font-semibold')
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Updated {fpath}')
