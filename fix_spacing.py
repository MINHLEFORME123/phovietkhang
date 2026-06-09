import glob, os
files = glob.glob('*.html') + ['js/client.js']
for f in files:
    if not os.path.exists(f): continue
    content = open(f, 'r', encoding='utf-8').read()
    
    # Nav links spacing
    content = content.replace(
        'class="hidden md:flex items-center space-x-8 font-body-md text-xl font-semibold tracking-wide"', 
        'class="hidden md:flex items-center space-x-16 font-body-md text-xl font-semibold tracking-wide"'
    )
    
    # Right buttons group
    content = content.replace(
        '<div class="flex items-center space-x-4">\n                <div class="hidden md:flex items-center space-x-2 mr-2">', 
        '<div class="flex items-center space-x-8">\n                <div class="hidden md:flex items-center space-x-4 mr-4">'
    )
    
    content = content.replace(
        '<div class="flex items-center space-x-4">\n                <a class="hidden md:inline-flex', 
        '<div class="flex items-center space-x-8">\n                <a class="hidden md:inline-flex'
    )
    
    content = content.replace(
        '<div class="flex items-center space-x-4">\n                <!-- Flags -->\n                <div class="hidden md:flex items-center space-x-2 mr-2">', 
        '<div class="flex items-center space-x-8">\n                <!-- Flags -->\n                <div class="hidden md:flex items-center space-x-4 mr-4">'
    )
    
    # Mobile flags spacing
    content = content.replace(
        '<div class="flex items-center space-x-4 mb-2">', 
        '<div class="flex items-center space-x-8 mb-4">'
    )
    
    open(f, 'w', encoding='utf-8').write(content)
print('Spacing updated!')
