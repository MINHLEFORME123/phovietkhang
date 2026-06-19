import os
import re

profile_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/profile.html'

with open(profile_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_tier_config = """            const tierConfig = {
                bronze: { label: currentLabels.bronze, color: '#9a3412', colorBg: '#9a341222', icon: 'shield', discount: '0%', rate: '1%' },
                silver: { label: currentLabels.silver, color: '#9ca3af', colorBg: '#9ca3af22', icon: 'shield', discount: '5%', rate: '1.5%' },
                gold: { label: currentLabels.gold, color: '#eab308', colorBg: '#eab30822', icon: 'workspaces_premium', discount: '10%', rate: '2.5%' },
                platinum: { label: currentLabels.platinum, color: '#06b6d4', colorBg: '#06b6d422', icon: 'diamond', discount: '15%', rate: '4%' },
                diamond: { label: currentLabels.diamond, color: '#7c3aed', colorBg: '#7c3aed22', icon: 'diamond', discount: '20%', rate: '5%' }
            }[tier] || { label: currentLabels.bronze, color: '#78350f', colorBg: '#78350f22', icon: 'shield', discount: '0%', rate: '1%' };"""

new_tier_config = """            const tierConfig = {
                bronze: { label: currentLabels.bronze, color: '#78350f', colorBg: '#78350f22', icon: 'stars', discount: '0%', rate: '1%' },
                silver: { label: currentLabels.silver, color: '#9ca3af', colorBg: '#9ca3af22', icon: 'shield', discount: '2%', rate: '1.5%' },
                gold: { label: currentLabels.gold, color: '#eab308', colorBg: '#eab30822', icon: 'workspace_premium', discount: '5%', rate: '2.5%' },
                platinum: { label: currentLabels.platinum, color: '#94a3b8', colorBg: '#94a3b822', icon: 'military_tech', discount: '10%', rate: '4%' },
                diamond: { label: currentLabels.diamond, color: '#7c3aed', colorBg: '#7c3aed22', icon: 'diamond', discount: '15%', rate: '5%' }
            }[tier] || { label: currentLabels.bronze, color: '#78350f', colorBg: '#78350f22', icon: 'stars', discount: '0%', rate: '1%' };"""

if old_tier_config in content:
    content = content.replace(old_tier_config, new_tier_config)
    with open(profile_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed tierConfig in profile.html")
else:
    print("Could not find exact tierConfig string. Falling back to regex.")
    
    # regex approach just in case whitespace differs
    pattern = r'const tierConfig = \{\s*bronze:.*?\}\[tier\].*?;'
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, new_tier_config, content, flags=re.DOTALL)
        with open(profile_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed tierConfig in profile.html using regex")
    else:
        print("Could not find tierConfig with regex either.")
