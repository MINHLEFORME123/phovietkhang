import os

filepath = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang\js\client.js"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Define Sörnäinen/Helsinki localized updates
vi_updates = {
    "seo-title": "Phở Việt Khang | Phở ngon Sörnäinen & Helsinki chuẩn vị",
    "seo-desc": "Thèm phở ngon ở Sörnäinen (Sornainen) hay Helsinki? Ghé ngay nhà hàng Phở Việt Khang tại Pengerkatu 29 (Sörnäinen) hoặc Easton để thưởng thức phở bò hầm xương 24h đậm đà chuẩn vị!",
    "hero-title": "Phở Việt Khang | Phở ngon Sörnäinen & Helsinki chuẩn vị",
    "hero-desc": "Không chỉ có phở, Phở Việt Khang còn mang đầy đủ hương vị Việt Nam đến Helsinki: bún bò Huế, bún chả Hà Nội, bánh xèo, gỏi cuốn tôm, súp hoành thánh, cafe muối và nhiều món ăn đường phố Việt Nam chuẩn vị. Ghé chi nhánh Sörnäinen (Pengerkatu 29) hoặc Easton Helsinki ngay hôm nay!",
    "story-title": "Phở ngon Sörnäinen & Helsinki chuẩn vị từ ngày đầu",
    "story-p2": "Mỗi bát phở Việt Nam, món gỏi cuốn giòn tan hay món ăn truyền thống đường phố đều được làm tươi mỗi ngày tại hai chi nhánh Sörnäinen (Pengerkatu 29) và Easton Helsinki. Hãy đến thưởng thức hương vị thật của Việt Nam ngay trung tâm Helsinki.",
    "sig-desc": "Khám phá những món ăn đặc trưng nhất của nhà hàng Phở Việt Khang: phở ngon hầm xương 24h tại Sörnäinen, bún bò Huế cay nồng, bún chả Hà Nội nướng than hoa, bánh xèo giòn, gỏi cuốn tôm tươi và cafe muối truyền thống. Tất cả được làm tươi mỗi ngày tại cả hai chi nhánh Helsinki.",
    "loc-label": "Tìm chúng tôi",
    "loc-title": "Chi nhánh của chúng tôi",
    "loc-desc": "Ghé thăm Phở Việt Khang tại các chi nhánh được thiết kế tinh tế, mang đậm phong vị ẩm thực truyền thống Việt Nam giữa lòng Helsinki.",
    "loc1-name": "Phở Việt Khang Sörnäinen (Pengerkatu)",
    "loc1-address": "Pengerkatu 29, 00500 Helsinki (Khu vực Sörnäinen / Sornainen / Kallio)",
    "loc1-hours1": "Thứ 2: Đóng cửa",
    "loc1-hours2": "Thứ 3 - Thứ 6: 11:00 - 20:00",
    "loc1-hours3": "Thứ 7 - Chủ Nhật: 12:00 - 20:30",
    "loc2-name": "Phở Việt Khang Easton Helsinki",
    "loc2-address": "Kauppakartanonkatu 3, 00930 Helsinki (Khu vực Itäkeskus)",
    "loc2-hours1": "Thứ 2 - Thứ 6: 11:00 - 21:00",
    "loc2-hours2": "Thứ 7 - Chủ Nhật: 12:00 - 21:00",
    "contact-label": "Kết nối với chúng tôi",
    "contact-title": "Liên hệ",
    "contact-desc": "Chúng tôi luôn sẵn lòng lắng nghe bạn. Vui lòng liên hệ với nhà hàng để đặt bàn lớn, phản hồi chất lượng hoặc hợp tác kinh doanh tại Helsinki.",
    "form-title": "Gửi tin nhắn",
    "form-name": "Họ và tên",
    "form-email": "Địa chỉ email",
    "form-phone": "Số điện thoại",
    "form-message": "Nội dung lời nhắn",
    "form-submit": "Gửi tin nhắn",
    "form-success": "Cảm ơn bạn! Lời nhắn của bạn đã được gửi thành công.",
    "info-email-title": "Email liên hệ",
    "info-phone-title": "Số điện thoại",
    "info-address-title": "Địa chỉ chính (Sörnäinen)",
    "info-address": "Pengerkatu 29, 00500 Helsinki, Phần Lan (Sörnäinen / Kallio)"
}

en_updates = {
    "seo-title": "Phở Việt Khang | Best Pho in Sörnäinen & Helsinki - Authentic Vietnamese",
    "seo-desc": "Looking for the best pho in Sörnäinen (Sornainen) or Helsinki? Visit Phở Việt Khang at Pengerkatu 29 (Sörnäinen) or Easton for authentic 24h slow-simmered bone broth pho and street food!",
    "hero-title": "Phở Việt Khang | Best Pho in Sörnäinen & Helsinki",
    "hero-desc": "More than just pho, Phở Việt Khang brings the full flavor of Vietnam to Helsinki: Hue beef vermicelli, Hanoi grilled pork noodles, crispy banh xeo, fresh goi cuon spring rolls, wonton soup, salted coffee, and authentic Vietnamese street food. Visit us at Sörnäinen (Pengerkatu 29) or Easton Helsinki today!",
    "story-title": "Authentic Vietnamese & Best Pho in Helsinki Since Day One",
    "story-p2": "Every bowl of Vietnamese pho, every crisp summer roll, and every street-food classic is made fresh daily at our Sörnäinen (Pengerkatu 29) and Easton Helsinki locations. Come taste the real flavor of Vietnam in the heart of Helsinki.",
    "sig-desc": "Discover our most popular Vietnamese dishes at Phở Việt Khang: best pho in Sörnäinen with 24-hour slow-simmered bone broth, spicy Hue beef vermicelli, grilled pork noodles, crispy banh xeo, fresh spring rolls, and traditional salted coffee. Made fresh daily at both Helsinki branches.",
    "loc-label": "Find Us",
    "loc-title": "Our Locations",
    "loc-desc": "Visit Phở Việt Khang at one of our spaces, bringing the best authentic Vietnamese pho to Helsinki.",
    "loc1-name": "Phở Việt Khang Sörnäinen (Pengerkatu)",
    "loc1-address": "Pengerkatu 29, 00500 Helsinki (Sörnäinen / Sornainen / Kallio district)",
    "loc1-hours1": "Mon: Closed",
    "loc1-hours2": "Tue-Fri: 11:00 - 20:00",
    "loc1-hours3": "Sat-Sun: 12:00 - 20:30",
    "loc2-name": "Phở Việt Khang Easton Helsinki",
    "loc2-address": "Kauppakartanonkatu 3, 00930 Helsinki (Itäkeskus)",
    "loc2-hours1": "Mon-Fri: 11:00 - 21:00",
    "loc2-hours2": "Sat-Sun: 12:00 - 21:00",
    "contact-label": "Get in Touch",
    "contact-title": "Contact Us",
    "contact-desc": "We would love to hear from you. Reach out for feedback, group bookings, or business inquiries in Sörnäinen or Itäkeskus.",
    "form-title": "Send a Message",
    "form-name": "Full Name",
    "form-email": "Email Address",
    "form-phone": "Phone Number",
    "form-message": "Message",
    "form-submit": "Send Message",
    "form-success": "Thank you! Your message has been sent successfully.",
    "info-email-title": "Email",
    "info-phone-title": "Phone",
    "info-address-title": "Main Address (Sörnäinen)",
    "info-address": "Pengerkatu 29, 00500 Helsinki, Finland (Sörnäinen / Sornainen / Kallio)"
}

fi_updates = {
    "seo-title": "Phở Việt Khang | Paras Pho Sörnäinen & Helsinki - Vietnamilainen Ravintola",
    "seo-desc": "Etsitkö parasta phoa Sörnäisistä (Sornainen) tai Helsingistä? Tule Phở Việt Khangiin Pengerkatu 29:ään (Sörnäinen) tai Eastonille ja nauti aidosta 24h haudutetusta phosta ja katuruoasta!",
    "hero-title": "Phở Việt Khang | Paras Pho Sörnäinen & Helsinki",
    "hero-desc": "Paljon muutakin kuin vain pho: Phở Việt Khang tuo Vietnamin täyden maun Helsinkiin — Hue-yleisnuudelit, hanoilaiset grillattu possu nuudelit, bánh xèo, gỏi cuốn, wonton-keitto, suolattu kahvi ja aitoa vietnamilaista katuruokaa. Käy Sörnäisissä (Pengerkatu 29) tai Easton Helsingissä jo tänään!",
    "story-title": "Aitoa vietnamilaista ruokaa & parasta phoa Helsingissä alusta asti",
    "story-p2": "Jokainen vietnamilaisen phon lautanen, joka rapea kevätkääryle ja jokainen katurikka klassikko valmistetaan tuoreilla raaka-aineilla päivittäin kahdessa toimipisteessämme Sörnäisissä (Pengerkatu 29) ja Easton Helsinki. Tule maistamaan Vietnamin aitoa makua Helsingin sydämessä.",
    "sig-desc": "Tutustu suosituimpiin vietnamilaisiin ruokiimme Phở Việt Khangissa: Sörnäisten paras pho 24-tunnin haudutetulla luuliemellä, tulinen Hue-yleisnuudeli, hanoilainen grillattu possu, rapea bánh xèo, tuoreet gỏi cuốn ja suolattu kahvi. Valmistetaan tuoreesti molemmissa Helsingin ravintoloissamme.",
    "loc-label": "Etsi meidät",
    "loc-title": "Toimipisteemme",
    "loc-desc": "Vierile Phở Việt Khangissa ja nauti Helsingin parhaasta vietnamilaisesta phosta viihtyisissä tiloissamme.",
    "loc1-name": "Phở Việt Khang Sörnäinen (Pengerkatu)",
    "loc1-address": "Pengerkatu 29, 00500 Helsinki (Sörnäinen / Sornainen / Kallio)",
    "loc1-hours1": "Ma: Suljettu",
    "loc1-hours2": "Ti-Pe: 11:00 - 20:00",
    "loc1-hours3": "La-Su: 12:00 - 20:30",
    "loc2-name": "Phở Việt Khang Easton Helsinki",
    "loc2-address": "Kauppakartanonkatu 3, 00930 Helsinki (Itäkeskus)",
    "loc2-hours1": "Ma-Pe: 11:00 - 21:00",
    "loc2-hours2": "La-Su: 12:00 - 21:00",
    "contact-label": "Ota yhteyttä",
    "contact-title": "Yhteystiedot",
    "contact-desc": "Ota meihin yhteyttä palautteiden, pöytävarausten tai yhteistyötarjousten osalta Sörnäisissä tai Itäkeskuksessa.",
    "form-title": "Lähetä viesti",
    "form-name": "Koko nimi",
    "form-email": "Sähköpostiosoite",
    "form-phone": "Puhelinnumero",
    "form-message": "Viesti",
    "form-submit": "Lähetä viesti",
    "form-success": "Kiitos! Viestisi on lähetetty onnistuneesti.",
    "info-email-title": "Sähköposti",
    "info-phone-title": "Puhelin",
    "info-address-title": "Päätoimipiste (Sörnäinen)",
    "info-address": "Pengerkatu 29, 00500 Helsinki, Suomi (Sörnäinen / Sornainen / Kallio)"
}

sv_updates = {
    "seo-title": "Phở Việt Khang | Bästa Pho i Sörnäinen & Helsingfors - Autentisk Vietnamesisk",
    "seo-desc": "Sugen på den bästa phon i Sörnäinen (Sornainen) eller Helsingfors? Besök Phở Việt Khang på Pengerkatu 29 (Sörnäinen) eller Easton för äkta 24h oxbensbuljong pho ja katuruokaa!",
    "hero-title": "Phở Việt Khang | Bästa Pho i Sörnäinen & Helsingfors",
    "hero-desc": "Mer än bara pho, Phở Việt Khang tar med Vietnams fulla smak till Helsingfors: bún bò Huế, bún chả, bánh xèo, gỏi cuốn, wontonsoppa och saltat kaffe. Besök oss i Sörnäinen (Pengerkatu 29) eller Easton Helsinki idag!",
    "story-title": "Autentisk vietnamesisk mat & bästa pho i Helsingfors sedan dag ett",
    "story-p2": "Varje element i vår lokal och på vår meny är noggrant utvalt för att framkalla en känsla av stillsam lyx—en harmonisk balans mellan österns rika arv och den moderna minimalismens sofistikerade estetik i våra filialer i Sörnäinen (Pengerkatu 29) och Easton Helsinki.",
    "sig-desc": "Upptäck våra mest populära vietnamesiska rätter på Phở Việt Khang: den bästa phon i Sörnäinen med 24-timmars oxbensbuljong, kryddig nudelsoppa i Hue-stil, grillat fläsk med nudlar, krispig bánh xèo och färska vårrullar. Gjord färsk varje dag i båda våra restauranger i Helsingfors.",
    "loc-label": "Hitta oss",
    "loc-title": "Våra restauranger",
    "loc-desc": "Besök Phở Việt Khang i Helsingfors och upplev äkta vietnamisisk mat i våra smakfulla lokaler.",
    "loc1-name": "Phở Việt Khang Sörnäinen (Pengerkatu)",
    "loc1-address": "Pengerkatu 29, 00500 Helsingfors (Sörnäinen / Sornainen / Kallio)",
    "loc1-hours1": "Mån: Stängt",
    "loc1-hours2": "Tis-Fre: 11:00 - 20:00",
    "loc1-hours3": "Lör-Sön: 12:00 - 20:30",
    "loc2-name": "Phở Việt Khang Easton Helsinki",
    "loc2-address": "Kauppakartanonkatu 3, 00930 Helsingfors (Itäkeskus)",
    "loc2-hours1": "Mån-Fre: 11:00 - 21:00",
    "loc2-hours2": "Lör-Sön: 12:00 - 21:00",
    "contact-label": "Kontakta oss",
    "contact-title": "Kontakt",
    "contact-desc": "Vi vill gärna höra från dig. Kontakta oss för feedback, bordsbokningar eller samarbeten i Sörnäinen eller Itäkeskus.",
    "form-title": "Skicka ett meddelande",
    "form-name": "Namn",
    "form-email": "E-postadress",
    "form-phone": "Telefonnummer",
    "form-message": "Meddelande",
    "form-submit": "Skicka meddelande",
    "form-success": "Tack! Ditt meddelande har skickats.",
    "info-email-title": "E-post",
    "info-phone-title": "Telefon",
    "info-address-title": "Huvudadress (Sörnäinen)",
    "info-address": "Pengerkatu 29, 00500 Helsingfors, Finland (Sörnäinen / Sornainen / Kallio)"
}

# Function to update key-values in a javascript dictionary block
def inject_translations(lang_key, updates):
    global content
    
    # We find the language block e.g., "  en: {" or "  vi: {"
    # We can inject these key-values inside the block.
    # To do this safely and cleanly without parsing full JS, we can locate the language start
    # e.g., '  vi: {' and replace individual keys if they exist, or append them before the closing '},' of that language.
    
    lang_start = content.find(f"\n  {lang_key}: {{")
    if lang_start == -1:
        lang_start = content.find(f"\n  \"{lang_key}\": {{")
    if lang_start == -1:
        lang_start = content.find(f"\n{lang_key}: {{")
        
    if lang_start == -1:
        print(f"Could not find language block for {lang_key}")
        return
        
    # Find the closing bracket of this language dictionary block
    # Since it's nested, we look for '  },' or '  }' that closes this block
    # In client.js, vi block ends with '  },' before '  en: {'
    next_lang_pos = content.find(f"\n  }},", lang_start)
    if next_lang_pos == -1:
         next_lang_pos = content.find(f"\n  }}", lang_start)
         
    if next_lang_pos == -1:
         print(f"Could not find end of language block for {lang_key}")
         return
         
    block_content = content[lang_start:next_lang_pos]
    
    # For each update key-value
    for k, v in updates.items():
        # Clean quotes inside values
        val_str = v.replace('"', '\\"')
        pattern = f'"{k}":'
        key_pos = block_content.find(pattern)
        if key_pos == -1:
            pattern = f"'{k}':"
            key_pos = block_content.find(pattern)
            
        if key_pos != -1:
            # Key already exists, replace it
            # We need to find the value part: starting after the colon, up to the comma or end of string
            # But in this file, keys are comma-separated or newline-separated
            # Let's use a regex replacement inside this block
            import re
            block_content = re.sub(
                r'"' + re.escape(k) + r'"\s*:\s*"[^"]*"', 
                f'"{k}": "{val_str}"', 
                block_content
            )
            block_content = re.sub(
                r'"' + re.escape(k) + r'"\s*:\s*\'[^\']*\'', 
                f'"{k}": "{val_str}"', 
                block_content
            )
        else:
            # Key doesn't exist, append it at the end of the block
            # Add a comma and the new key-value
            block_content += f',\n    "{k}": "{val_str}"'
            
    # Put it back
    content = content[:lang_start] + block_content + content[next_lang_pos:]

inject_translations("vi", vi_updates)
inject_translations("en", en_updates)
inject_translations("fi", fi_updates)
inject_translations("sv", sv_updates)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("js/client.js translations updated successfully.")
