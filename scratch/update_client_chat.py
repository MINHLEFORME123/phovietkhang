import os
import re

client_js_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/client.js'

with open(client_js_path, 'r', encoding='utf-8') as f:
    client_js = f.read()

# Find the getSystemPrompt function, we will inject getWelcomeMessage right before it.
welcome_func = '''
    function getWelcomeMessage(lang) {
        const t = chatTranslations[lang] || chatTranslations.en;
        let msg = t.welcome;
        
        if (window.userProfileDocData && window.getLoyaltyTier) {
            const ts = window.userProfileDocData.totalSpent || 0;
            const tier = window.getLoyaltyTier(ts);
            const name = window.userProfileDocData.name || '';
            
            if (['bac', 'vang', 'bach_kim', 'kim_cuong'].includes(tier) && name) {
                if (lang === 'vi') {
                    const tierNameVi = { bac: 'Bạc', vang: 'Vàng', bach_kim: 'Bạch Kim', kim_cuong: 'Kim Cương' }[tier];
                    msg = `Xin chào khách hàng bậc ${tierNameVi} ${name}! Tôi là Trợ lý ảo của Phở Việt Khang. Tôi có thể tư vấn món ăn, tìm cửa hàng gần nhất hoặc tra cứu thông tin giúp bạn. Bạn cần giúp gì?`;
                } else if (lang === 'fi') {
                    const tierNameFi = { bac: 'Hopea', vang: 'Kulta', bach_kim: 'Platina', kim_cuong: 'Timantti' }[tier];
                    msg = `Hei ${tierNameFi}-tason asiakas ${name}! Olen Phở Việt Khangin virtuaaliassistentti. Voin suositella ruokia, etsiä toimipisteitä tai hakea tietoa. Kuinka voin auttaa?`;
                } else if (lang === 'sv') {
                    const tierNameSv = { bac: 'Silver', vang: 'Guld', bach_kim: 'Platina', kim_cuong: 'Diamant' }[tier];
                    msg = `Hej ${tierNameSv}-kund ${name}! Jag är Phở Việt Khangs virtuella assistent. Jag kan rekommendera rätter, hitta restauranger eller söka information. Hur kan jag hjälpa dig?`;
                } else {
                    const tierNameEn = { bac: 'Silver', vang: 'Gold', bach_kim: 'Platinum', kim_cuong: 'Diamond' }[tier];
                    msg = `Hello ${tierNameEn} member ${name}! I am the Phở Việt Khang Virtual Assistant. I can recommend dishes, find locations, or search for info. How can I help you?`;
                }
            }
        }
        return msg;
    }

    function getSystemPrompt(lang) {'''

client_js = client_js.replace('    function getSystemPrompt(lang) {', welcome_func)

# Replace t.welcome in applyLangToChat
client_js = client_js.replace('welcomeEl.textContent = t.welcome;', 'welcomeEl.textContent = getWelcomeMessage(lang);')

# Replace t.welcome in toggle logic
client_js = re.sub(r'welcomeEl\.textContent = chatTranslations\[[^\]]+\]\?\.welcome \|\| chatTranslations\.en\.welcome;', 'welcomeEl.textContent = getWelcomeMessage(getCurrentLang());', client_js)

# Also expose it so auth.js can trigger it when user loads
client_js = client_js.replace("window.addEventListener('languageChanged', applyLangToChat);", "window.addEventListener('languageChanged', applyLangToChat);\n    window.refreshChatGreeting = applyLangToChat;")

with open(client_js_path, 'w', encoding='utf-8') as f:
    f.write(client_js)

print("Injected dynamic welcome message.")
