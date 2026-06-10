const translations = {
  vi: {
    "nav-home": "Trang chủ", "nav-menu": "Thực đơn", "nav-locations": "Địa điểm", "nav-contact": "Liên hệ", "nav-reservations": "Đặt bàn", "nav-register": "Đăng ký", "nav-inbox": "Hộp thư", "inbox-title": "Hộp thư của bạn",
    "menu-label": "Thực đơn của chúng tôi", "menu-title": "Thực Đơn", "menu-desc": "Hành trình được chọn lọc kỹ lưỡng qua những truyền thống ẩm thực Việt Nam tinh hoa nhất, được chế tác với sự chuẩn xác và đam mê.",
    "cat-appetizers": "Khai vị", "cat-mains": "Món chính", "cat-drinks": "Đồ uống", "cat-desserts": "Tráng miệng",
    "app1-title": "Gỏi cuốn tôm", "app1-desc": "Cuốn tay tỉ mỉ với tôm sút tươi rói, bún gạo, rau thơm, chấm tương đậu phộng.",
    "app2-title": "Súp hoành thánh", "app2-desc": "Nước dùng xương hầm trong với hoành thánh nhân tôm thịt thủ công.",
    "app3-title": "Chả giò", "app3-desc": "Nem rán giòn với nhân thịt heo, mộc nhĩ, chấm tương ớt ngọt.",
    "app4-title": "Bánh xèo mini", "app4-desc": "Bánh xèo giòn với tôm, giá đỗ, và rau thơm tươi.",
    "main1-title": "Cơm rang vịt", "main1-desc": "Cơm rang giòn với mỡ vịt, vịt quay mềm, dưa góp chua ngọt.",
    "main2-title": "Phở tái lăn", "main2-desc": "Thịt bò xào tái lăn thơm tỏi trong nước phở đậm vị truyền thống.",
    "main3-title": "Bún bò Huế", "main3-desc": "Bún bò cay kiểu Huế với sả, dầu ớt, và rau thơm.",
    "main4-title": "Cơm tấm sườn", "main4-desc": "Cơm tấm với sườn nướng, trứng ốp la, và đồ chua.",
    "main5-title": "Bún chả Hà Nội", "main5-desc": "Thịt nướng kiểu Hà Nội với bún, rau thơm, và nước chấm.",
    "main6-title": "Mì xào hải sản", "main6-desc": "Mì trứng xào với tôm, mực, và rau theo mùa.",
    "drink1-title": "Cafe muối", "drink1-desc": "Cà phê phin truyền thống với kem muối béo ngậy.",
    "drink2-title": "Trà đào cam sả", "drink2-desc": "Trà đào với cam tươi và sả thơm.",
    "drink3-title": "Sinh tố bơ", "drink3-desc": "Sinh tố bơ béo mịn với sữa đặc.",
    "dessert1-title": "Chè ba màu", "dessert1-desc": "Chè ba màu với đậu xanh, đậu đỏ, và thạch lá dứa.",
    "dessert2-title": "Bánh flan", "dessert2-desc": "Bánh caramel Việt Nam với cà phê rưới nhẹ.",
    "dessert3-title": "Kem dừa", "dessert3-desc": "Kem dừa phục vụ trong gáo dừa non.",
    "hero-title": "Nghệ Thuật Ẩm Thực Châu Á",
    "hero-desc": "Sự khám phá tinh tế các hương vị di sản qua lăng kính ẩm thực hiện đại. Trải nghiệm sự thanh tịnh trên từng đĩa ăn.",
    "hero-reserve": "Đặt bàn ngay",
    "story-label": "Di sản của chúng tôi",
    "story-title": "Nơi truyền thống gặp gỡ sự chuẩn xác",
    "story-p1": "Tại Phở Việt Khang, chúng tôi loại bỏ những chi tiết rườm rà để tôn vinh tinh túy thực sự của nguyên liệu châu Á. Triết lý của chúng tôi bắt nguồn từ chiều sâu trí tuệ của kỹ thuật truyền thống, được nâng tầm bởi sự chuẩn xác nghiêm ngặt của ẩm thực đương đại.",
    "story-p2": "Mỗi yếu tố trong không gian và thực đơn của chúng tôi đều được giám tuyển tỉ mỉ để gợi lên cảm giác sang trọng tĩnh lặng—một sự cân bằng hài hòa giữa di sản lâu đời của phương Đông và thẩm mỹ tinh tế của chủ nghĩa tối giản hiện đại.",
    "sig-title": "Món ăn đặc trưng",
    "sig-desc": "Danh sách tuyển chọn các món ăn được yêu thích nhất của chúng tôi, thể hiện cam kết về sự hoàn hảo trong cả thị giác lẫn ẩm thực.",
    "dish1-title": "Cơm rang vịt", "dish1-desc": "Hạt cơm giòn rụm rang cùng mỡ vịt thơm lừng, ăn kèm thịt vịt quay mềm mộng và dưa góp chua ngọt thanh mát.",
    "dish2-title": "Súp hoành thánh", "dish2-desc": "Nước dùng thanh ngọt hầm từ xương, vỏ bánh mỏng tang bọc nhân tôm thịt đậm đà.",
    "dish3-title": "Phở tái lăn", "dish3-desc": "Thịt bò xào lăn lửa lớn xém cạnh thơm nức mũi tỏi, hòa quyện trong nước phở đậm vị truyền thống.",
    "dish4-title": "Gỏi cuốn tôm", "dish4-desc": "Cuốn tay tỉ mỉ với tôm sút tươi rói, bún gạo, và rau thơm, chấm cùng tương đậu phộng béo ngậy.",
    "dish5-title": "Cafe muối", "dish5-desc": "Cà phê phin đậm đà nguyên bản kết hợp cùng lớp kem mặn sánh mịn, đánh thức mọi giác quan.",
    "cta-title": "Trải Nghiệm Hành Trình Trọn Vẹn",
    "cta-desc": "Khám phá thực đơn nếm thử theo mùa và các món gọi riêng đầy đủ của chúng tôi, được thiết kế để mang lại sự thăng hoa và thích thú.",
    "cta-btn1": "Xem Thực Đơn",
    "cta-btn2": "Tìm Địa Điểm",
    "footer-desc": "Nghệ Thuật Ẩm Thực Châu Á.", "footer-privacy": "Chính sách bảo mật", "footer-terms": "Điều khoản dịch vụ", "footer-careers": "Tuyển dụng", "footer-press": "Tài liệu báo chí", "footer-copyright": "© 2026 PHỞ VIỆT KHANG. BẢN QUYỀN ĐÃ ĐƯỢC BẢO HỘ.",
    "cart-title": "Giỏ hàng & Thanh toán", "order-items": "Món ăn đã chọn", "empty-cart": "Giỏ hàng của bạn đang trống.", "browse-menu": "Xem Thực đơn", "order-summary": "Tổng quan đơn hàng", "total-label": "Tổng cộng:", "your-name": "Tên của bạn", "phone-number": "Số điện thoại", "dine-in": "Ăn tại bàn", "takeaway": "Mang về", "delivery": "Giao hàng", "table-number": "Số bàn", "delivery-address": "Địa chỉ giao hàng", "notes": "Ghi chú cho bếp (Tùy chọn)", "place-order": "Đặt hàng ngay", "payment-method": "Phương thức thanh toán", "payment-online-banking": "Online banking (Finland)", "payment-online-banking-desc": "Thanh toán qua ngân hàng trực tuyến tại Phần Lan", "payment-mobilepay-desc": "Thanh toán nhanh bằng ứng dụng MobilePay", "payment-bank-card": "Thẻ ngân hàng", "payment-bank-card-desc": "Thanh toán bằng thẻ Visa, Mastercard hoặc debit", "payment-note": "Bạn có thể chọn trước phương thức thanh toán online phù hợp khi gửi đơn hàng.",
    "reviews-label": "Trải nghiệm thực tế", "reviews-title": "Khách hàng nói gì về chúng tôi",
    "ai-assistant": "Trợ lý Phở Việt Khang", "ai-placeholder": "Hỏi về món ăn, địa điểm...", "ai-welcome": "Xin chào! Tôi là Trợ lý ảo của Phở Việt Khang. Tôi có thể tư vấn món ăn, tìm cửa hàng gần nhất hoặc tra cứu thông tin giúp bạn. Bạn cần giúp gì?"
  },
  en: {
    "nav-home": "Home", "nav-menu": "Menu", "nav-locations": "Locations", "nav-contact": "Contact", "nav-reservations": "Reservations", "nav-register": "Register", "nav-inbox": "Inbox", "inbox-title": "Your Mailbox",
    "menu-label": "Our Offerings", "menu-title": "The Menu", "menu-desc": "A carefully curated journey through the finest Vietnamese culinary traditions, crafted with precision and passion.",
    "cat-appetizers": "Appetizers", "cat-mains": "Main Courses", "cat-drinks": "Beverages", "cat-desserts": "Desserts",
    "app1-title": "Shrimp Fresh Spring Rolls", "app1-desc": "Fresh spring rolls with tiger prawns, rice vermicelli, herbs, and peanut dipping sauce.",
    "app2-title": "Wonton Soup", "app2-desc": "Clear bone broth with handmade pork and shrimp wontons.",
    "app3-title": "Crispy Spring Rolls", "app3-desc": "Crispy fried spring rolls with pork, wood ear mushrooms, and sweet chili dip.",
    "app4-title": "Mini Bánh Xèo", "app4-desc": "Crispy Vietnamese crepes with shrimp, bean sprouts, and fresh herbs.",
    "main1-title": "Duck Fried Rice", "main1-desc": "Duck fried rice with crispy rice, roasted duck, and sweet pickles.",
    "main2-title": "Stir-fried Rare Beef Pho", "main2-desc": "Stir-fried rare beef pho with garlic aroma in rich traditional broth.",
    "main3-title": "Bún Bò Huế", "main3-desc": "Spicy Hue-style beef noodle soup with lemongrass, chili oil, and herbs.",
    "main4-title": "Broken Rice with Pork Chop", "main4-desc": "Broken rice with grilled pork chop, fried egg, and pickled vegetables.",
    "main5-title": "Hanoi Grilled Pork Noodles", "main5-desc": "Hanoi-style grilled pork with rice noodles, herbs, and dipping broth.",
    "main6-title": "Seafood Stir-fried Noodles", "main6-desc": "Stir-fried egg noodles with shrimp, squid, and seasonal vegetables.",
    "drink1-title": "Salted Coffee", "drink1-desc": "Traditional drip coffee with salted cream foam.",
    "drink2-title": "Peach Lemongrass Tea", "drink2-desc": "Peach tea with orange and lemongrass.",
    "drink3-title": "Avocado Smoothie", "drink3-desc": "Creamy avocado smoothie with condensed milk.",
    "dessert1-title": "Three-Color Dessert", "dessert1-desc": "Three-color dessert with mung beans, red beans, and pandan jelly.",
    "dessert2-title": "Vietnamese Flan", "dessert2-desc": "Vietnamese caramel custard with coffee drizzle.",
    "dessert3-title": "Coconut Ice Cream", "dessert3-desc": "Coconut ice cream served in a young coconut shell.",
    "hero-title": "The Art of Asian Gastronomy",
    "hero-desc": "A refined exploration of heritage flavors presented through the lens of modern culinary precision. Experience ordered serenity on every plate.",
    "hero-reserve": "Reserve Now",
    "story-label": "Our Heritage",
    "story-title": "Where Tradition Meets Precision",
    "story-p1": "At Pho Viet Khang, we strip away unnecessary ornamentation to reveal the true essence of pan-Asian ingredients. Our philosophy is rooted in the intellectual depth of traditional techniques, elevated by the strict precision of contemporary gastronomy.",
    "story-p2": "Every element in our space and on our menu is deliberately curated to evoke a quiet sense of luxury—a harmonious balance between the enduring heritage of the East and the refined aesthetic of modern minimalism.",
    "sig-title": "Signature Creations",
    "sig-desc": "A curated selection of our most revered dishes, demonstrating our commitment to visual and culinary excellence.",
    "dish1-title": "Duck Fried Rice", "dish1-desc": "Crispy rice stir-fried in fragrant duck fat, served with tender roasted duck and refreshing sweet and sour pickles.",
    "dish2-title": "Wonton Soup", "dish2-desc": "Clear, sweet bone broth with paper-thin dumplings filled with rich pork and shrimp.",
    "dish3-title": "Stir-fried Rare Beef Pho", "dish3-desc": "Wok-seared beef with a smoky garlic aroma, submerged in our traditional rich pho broth.",
    "dish4-title": "Shrimp Fresh Spring Rolls", "dish4-desc": "Meticulously hand-rolled with fresh tiger prawns, rice vermicelli, and herbs, served with a creamy peanut dipping sauce.",
    "dish5-title": "Salted Coffee", "dish5-desc": "Bold traditional drip coffee topped with a smooth, savory salted cream foam to awaken your senses.",
    "cta-title": "Experience the Full Journey",
    "cta-desc": "Discover our complete seasonal tasting menu and a la carte offerings, designed to transport and delight.",
    "cta-btn1": "View Menu",
    "cta-btn2": "Find a Location",
    "footer-desc": "The Art of Asian Gastronomy.", "footer-privacy": "Privacy Policy", "footer-terms": "Terms of Service", "footer-careers": "Careers", "footer-press": "Press Kit", "footer-copyright": "© 2026 PHO VIET KHANG. ALL RIGHTS RESERVED.",
    "cart-title": "Your Cart & Checkout", "order-items": "Order Items", "empty-cart": "Your cart is empty.", "browse-menu": "Browse Menu", "order-summary": "Order Summary", "total-label": "Total:", "your-name": "Your Name", "phone-number": "Phone Number", "dine-in": "Dine In", "takeaway": "Takeaway", "delivery": "Delivery", "table-number": "Table Number", "delivery-address": "Delivery Address", "notes": "Notes for Kitchen (Optional)", "place-order": "Place Order Now", "payment-method": "Payment Method", "payment-online-banking": "Online banking (Finland)", "payment-online-banking-desc": "Pay using Finnish online banking", "payment-mobilepay-desc": "Fast checkout with the MobilePay app", "payment-bank-card": "Bank Card", "payment-bank-card-desc": "Pay using Visa, Mastercard or debit card", "payment-note": "Customers can choose their preferred online payment method before sending the order.",
    "reviews-label": "Guest Experiences", "reviews-title": "What Our Guests Say",
    "ai-assistant": "Pho Viet Khang Assistant", "ai-placeholder": "Ask about dishes, locations...", "ai-welcome": "Hello! I am the Phở Việt Khang Virtual Assistant. I can recommend dishes, find locations, or search for info. How can I help you?"
  },
  fi: {
    "nav-home": "Koti", "nav-menu": "Menu", "nav-locations": "Toimipisteet", "nav-contact": "Yhteystiedot", "nav-reservations": "Varaukset", "nav-register": "Rekisteröidy", "nav-inbox": "Postilaatikko", "inbox-title": "Postilaatikkosi",
    "menu-label": "Tarjontamme", "menu-title": "Ruokalista", "menu-desc": "Huolella kuratoitu matka hienoimpien vietnamilaisten keittiöperinteiden läpi, valmistettu tarkkuudella ja intohimolla.",
    "cat-appetizers": "Alkupalat", "cat-mains": "Pääruoat", "cat-drinks": "Juomat", "cat-desserts": "Jälkiruoat",
    "app1-title": "Katkarapu-kevätkääryleet", "app1-desc": "Tuoreet kevätrullat tiikerikatkaravuilla, riisinuudeleilla, yrteillä ja maapähkinäkastikkeella.",
    "app2-title": "Wonton-keitto", "app2-desc": "Kirkas luuliemi käsintehdyillä possu-katkarapunyyteillä.",
    "app3-title": "Rapeat kevätkääryleet", "app3-desc": "Rapeat paistetut kevätkääryleet possulla, korvasienillä ja makealla chilikastikkeella.",
    "app4-title": "Mini Bánh Xèo", "app4-desc": "Rapeat vietnamilaiset letut katkaravuilla, iduilla ja tuoreilla yrteillä.",
    "main1-title": "Ankka-paistettu riisi", "main1-desc": "Ankanrasvassa paistettu rapea riisi, paahdettu ankka ja hapanimeläpikkelssit.",
    "main2-title": "Paistettu harvinainen naudan Pho", "main2-desc": "Wokkipannulla paistettu harvinainen nauta valkosipuliaromilla rikkaassa perinteisessä liemessä.",
    "main3-title": "Bún Bò Huế", "main3-desc": "Tulinen Huen tyylinen naudanlieminuudelikeitto sitruunaruoholla, chiliöljyllä ja yrteillä.",
    "main4-title": "Murrettu riisi porsaankyljyksellä", "main4-desc": "Murrettu riisi grillatulla porsaankyljyksellä, paistetulla kananmunalla ja pikkelöidyillä kasviksilla.",
    "main5-title": "Hanoin grillatut possunuudelit", "main5-desc": "Hanoin tyylinen grillattu possu riisinuudeleilla, yrteillä ja dippiliemellä.",
    "main6-title": "Merenelävänuudelit", "main6-desc": "Wokkipannulla paistetut munanauhanuudelit katkaravuilla, kalmarilla ja kauden kasviksilla.",
    "drink1-title": "Suolattu kahvi", "drink1-desc": "Perinteinen suodatinkahvi suolaisella kermavaahdolla.",
    "drink2-title": "Persikka-sitruunaruohotee", "drink2-desc": "Persikkatee appelsiinilla ja sitruunaruoholla.",
    "drink3-title": "Avokadosmoothie", "drink3-desc": "Kermainen avokadosmoothie kondensoitulla maidolla.",
    "dessert1-title": "Kolmen värin jälkiruoka", "dessert1-desc": "Kolmen värin jälkiruoka mungpavuilla, punaisilla pavuilla ja pandanhyytelöllä.",
    "dessert2-title": "Vietnamilainen flan", "dessert2-desc": "Vietnamilainen karamellivanukas kahvitiputuksella.",
    "dessert3-title": "Kookos jäätelö", "dessert3-desc": "Kookos jäätelö tarjoiltuna nuoressa kookoskuoressa.",
    "hero-title": "Aasialaisen Gastronomian Taide",
    "hero-desc": "Perinteisten makujen hienostunut tutkimusmatka modernin keittiötaidon tarkkuudella. Koe harmoninen seesteisyys jokaisella lautasella.",
    "hero-reserve": "Varaa Nyt",
    "story-label": "Perintömme",
    "story-title": "Missä Perinne Kohtaa Tarkkuuden",
    "story-p1": "Pho Viet Khangissa karsimme turhat koristeet paljastaaksemme aasialaisten raaka-aineiden todellisen olemuksen. Filosofiamme juontaa juurensa perinteisten tekniikoiden älyllisestä syvyydestä, jota kohottaa nykyaikaisen gastronomian tiukka tarkkuus.",
    "story-p2": "Jokainen elementti tilassamme ja ruokalistallamme on harkiten valittu tuomaan esiin hiljaista ylellisyyttä—harmoninen tasapaino idän kestävän perinnön ja modernin minimalismin hienostuneen estetiikan välillä.",
    "sig-title": "Nimikkoannokset",
    "sig-desc": "Kuratoitu valikoima arvostetuimpia ruokiamme, jotka osoittavat sitoutumisemme visuaaliseen ja kulinaariseen erinomaisuuteen.",
    "dish1-title": "Ankka-paistettu Riisi", "dish1-desc": "Rapeaa riisiä, joka on paistettu tuoksuvassa ankanrasvassa, tarjoillaan murean paahdetun ankan ja raikkaan hapanimelän pikkelssin kera.",
    "dish2-title": "Wonton-keitto", "dish2-desc": "Kirkas, makea luuliemi paperinohuilla nyyteillä, jotka on täytetty rikkaalla possulla ja katkaravulla.",
    "dish3-title": "Paistettu Harvinainen Naudan Pho", "dish3-desc": "Wokkipannulla paistettua nautaa savuisella valkosipuliaromin vivahteella, upotettuna perinteiseen rikkaaseen pho-liemeen.",
    "dish4-title": "Katkarapu-Kevätkääryleet", "dish4-desc": "Huolella käsin kääriitty tuoreilla tiikerikatkaravuilla, riisinuudeleilla ja yrteillä, tarjoillaan kermaisen maapähkinäkastikkeen kera.",
    "dish5-title": "Suolattu Kahvi", "dish5-desc": "Voimakas perinteinen suodatinkahvi, jonka päällä on pehmeä, suolainen kermavaahto herättämään aistisi.",
    "cta-title": "Koe Koko Matka",
    "cta-desc": "Tutustu koko kausiluonteiseen maistelumenuumme ja a la carte -tarjontaamme, jotka on suunniteltu ilahduttamaan.",
    "cta-btn1": "Näytä Menu",
    "cta-btn2": "Etsi Toimipiste",
    "footer-desc": "Aasialaisen Gastronomian Taide.", "footer-privacy": "Tietosuojakäytäntö", "footer-terms": "Käyttöehdot", "footer-careers": "Urat", "footer-press": "Lehdistöpaketti", "footer-copyright": "© 2026 PHO VIET KHANG. KAIKKI OIKEUDET PIDÄTETÄÄN.",
    "cart-title": "Ostoskori & Kassa", "order-items": "Tilauksen tuotteet", "empty-cart": "Ostoskoriisi on tyhjä.", "browse-menu": "Selaa ruokalistaa", "order-summary": "Yhteenveto", "total-label": "Yhteensä:", "your-name": "Nimesi", "phone-number": "Puhelinnumero", "dine-in": "Syö paikan päällä", "takeaway": "Mukaan", "delivery": "Kotiinkuljetus", "table-number": "Pöydän numero", "delivery-address": "Toimitusosoite", "notes": "Huomautukset keittiölle (valinnainen)", "place-order": "Tilaa nyt", "payment-method": "Maksutapa", "payment-online-banking": "Verkkopankki (Suomi)", "payment-online-banking-desc": "Maksa suomalaisen verkkopankin kautta", "payment-mobilepay-desc": "Nopea maksu MobilePay-sovelluksella", "payment-bank-card": "Pankkikortti", "payment-bank-card-desc": "Maksa Visa-, Mastercard- tai debit-kortilla", "payment-note": "Asiakas voi valita sopivan verkkomaksutavan jo ennen tilauksen lähettämistä.",
    "reviews-label": "Asiakaskokemukset", "reviews-title": "Mitä asiakkaamme sanovat",
    "ai-assistant": "Pho Viet Khang Assistentti", "ai-placeholder": "Kysy ruoista, toimipisteistä...", "ai-welcome": "Hei! Olen Phở Việt Khangin virtuaaliassistentti. Voin suositella ruokia, etsiä toimipisteitä tai hakea tietoa. Kuinka voin auttaa?"
  }
};

// --- Custom Beautiful Notification System ---
window.showNotification = function(message, type = 'info') {
    let container = document.getElementById('pvk-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pvk-toast-container';
        container.className = 'fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(container);
        
        // Add minimal CSS for animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            .toast-enter { animation: slideInRight 0.3s ease-out forwards; }
            .toast-exit { animation: slideOutRight 0.3s ease-in forwards; }
        `;
        document.head.appendChild(style);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-enter pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-[400px] transition-all';
    
    let icon = 'info';
    let colors = 'bg-surface/90 border-outline-variant/50 text-on-surface';
    let iconColor = 'text-primary';

    if (type === 'error') {
        icon = 'error';
        colors = 'bg-error-container/95 border-error/20 text-on-error-container';
        iconColor = 'text-error';
    } else if (type === 'success') {
        icon = 'check_circle';
        colors = 'bg-green-100/95 border-green-200 text-green-900 dark:bg-green-900/90 dark:border-green-800 dark:text-green-50';
        iconColor = 'text-green-600 dark:text-green-400';
    }

    toast.className += ' ' + colors;

    toast.innerHTML = `
        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
        <div class="flex-1 font-body-sm text-sm font-medium leading-tight">${message}</div>
        <button class="text-current opacity-60 hover:opacity-100 transition-opacity p-1" onclick="this.parentElement.classList.add('toast-exit'); setTimeout(() => this.parentElement.remove(), 300)">
            <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.replace('toast-enter', 'toast-exit');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
};

function changeLanguage(lang) {
  localStorage.setItem('selectedLanguage', lang);

  if (!translations[lang]) return;

  // Batch DOM reads first, then writes to prevent layout thrashing
  const elems = document.querySelectorAll('[data-i18n]');
  const updates = [];
  elems.forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      updates.push({ elem, text: translations[lang][key] });
    }
  });

  requestAnimationFrame(() => {
    updates.forEach(({ elem, text }) => {
      elem.textContent = text;
    });

    document.querySelectorAll('[id^="lang-"]').forEach(btn => {
      if (btn.id === `lang-${lang}` || btn.id === `lang-${lang}-mobile`) {
        btn.classList.add('ring-primary', 'scale-110');
        btn.classList.remove('ring-transparent', 'scale-100');
      } else {
        btn.classList.remove('ring-primary', 'scale-110');
        btn.classList.add('ring-transparent', 'scale-100');
      }
    });

    // Dispatch after DOM is updated
    window.dispatchEvent(new Event('languageChanged'));
  });
}

const savedLang = localStorage.getItem('selectedLanguage') || 'en';
changeLanguage(savedLang);

// --- FIX: Append chat to <html> to avoid body animation transforms breaking position:fixed ---
// Body animations (pageFadeIn/pageFadeOut) can create containing blocks.
// Appending to <html> keeps chat immune to body-level transforms.
// Chat appended to <html> for immune positioning
const chatTarget = document.documentElement;

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
  e.preventDefault();
  document.body.classList.add('page-exit');
  setTimeout(() => { window.location.href = href; }, 300);
});

// --- FLOATING AI CUSTOMER ASSISTANT ---
(async function() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/admin/') || path.includes('/kitchen/') || path.includes('/host/')) {
        return;
    }

    // Inject styles for client assistant
    const style = document.createElement('style');
    style.textContent = `
        .pvk-chat-window {
            position: fixed !important;
            bottom: 100px !important;
            right: 20px !important;
            width: min(380px, calc(100vw - 40px)) !important;
            max-height: 65vh !important;
            z-index: 2147483647 !important;
            display: none;
            flex-direction: column;
            border-radius: 16px;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
            background-color: #0c1220;
            color: #f3f4f6;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
            transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            transform: translateZ(0);
        }
        .pvk-chat-window.show {
            display: flex !important;
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        .pvk-chat-bubble {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 13px;
            line-height: 1.45;
            word-wrap: break-word;
            margin-bottom: 2px;
        }
        .pvk-bubble-user {
            background-color: #3b82f6;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        .pvk-bubble-ai {
            background-color: #1a2333;
            color: #e5e7eb;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .pvk-chat-bubble strong { color: #60a5fa; font-weight: 600; }
        .pvk-chat-toggle-btn {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 56px !important;
            height: 56px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.5);
            z-index: 2147483647 !important;
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease;
            pointer-events: auto !important;
            will-change: auto;
            transform: translateZ(0);
        }
        .pvk-chat-toggle-btn::before {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid rgba(59, 130, 246, 0.4);
            animation: pvk-pulse-ring 2.5s ease-out infinite;
            pointer-events: none;
        }
        .pvk-chat-toggle-btn:hover {
            transform: scale(1.08) !important;
            background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        }
        .pvk-chat-toggle-btn:active {
            transform: scale(0.94) !important;
        }
        @keyframes pvk-pulse-ring {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .dots-loader span {
            width: 6px;
            height: 6px;
            margin: 0 2px;
            background-color: #9ca3af;
            border-radius: 50%;
            display: inline-block;
            animation: bounceDots 1.4s infinite both;
        }
        .dots-loader span:nth-child(2) { animation-delay: .2s; }
        .dots-loader span:nth-child(3) { animation-delay: .4s; }
        @keyframes bounceDots {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        @media (max-width: 480px) {
            .pvk-chat-toggle-btn {
                width: 50px !important;
                height: 50px !important;
                bottom: 16px !important;
                right: 16px !important;
            }
            .pvk-chat-window {
                width: calc(100vw - 32px) !important;
                right: 16px !important;
                bottom: 80px !important;
                max-height: 60vh !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Create Markup - append directly to body (no wrapper div to avoid fixed positioning issues)
    const chatToggleHTML = `
        <div class="pvk-chat-toggle-btn" id="client-chat-toggle" style="position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;transform:translateZ(0)!important;">
            <span class="material-symbols-outlined text-[28px]" id="client-chat-icon">chat</span>
        </div>
    `;
    const chatWinHTML = `
        <div class="pvk-chat-window" id="client-chat-win" style="position:fixed!important;bottom:100px!important;right:20px!important;z-index:2147483647!important;transform:translateZ(0)!important;">
            <div class="p-4 bg-[#141b2b] border-b border-gray-800 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="font-bold text-white text-sm" data-chat-title>Trợ lý Phở Việt Khang</span>
                </div>
                <button id="client-chat-close" class="text-secondary hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0" id="client-chat-messages">
                <div class="pvk-chat-bubble pvk-bubble-ai" id="client-chat-welcome-msg">
                    Xin chào! Tôi là Trợ lý ảo của Phở Việt Khang. Tôi có thể tư vấn món ăn, tìm cửa hàng gần nhất hoặc tra cứu thông tin giúp bạn. Bạn cần giúp gì?
                </div>
            </div>
            <div class="p-3 border-t border-gray-800 bg-[#0c1220] flex gap-2 shrink-0">
                <input type="text" id="client-chat-input" placeholder="Hỏi về món ăn, địa điểm..." class="flex-1 bg-[#141b2b] border border-gray-700 rounded-xl text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                <button id="client-chat-send" class="bg-primary hover:bg-blue-600 text-white p-2 rounded-xl transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">send</span>
                </button>
            </div>
        </div>
    `;
    chatTarget.insertAdjacentHTML('beforeend', chatToggleHTML);
    chatTarget.insertAdjacentHTML('beforeend', chatWinHTML);

    const toggleBtn = document.getElementById('client-chat-toggle');
    const chatWin = document.getElementById('client-chat-win');
    const closeBtn = document.getElementById('client-chat-close');
    const chatInput = document.getElementById('client-chat-input');
    const sendBtn = document.getElementById('client-chat-send');
    const msgArea = document.getElementById('client-chat-messages');
    const chatIcon = document.getElementById('client-chat-icon');

    const chatTranslations = {
        vi: {
            title: "Trợ lý Phở Việt Khang",
            placeholder: "Hỏi về món ăn, địa điểm...",
            welcome: "Xin chào! Tôi là Trợ lý ảo của Phở Việt Khang. Tôi có thể tư vấn món ăn, tìm cửa hàng gần nhất hoặc tra cứu thông tin giúp bạn. Bạn cần giúp gì?"
        },
        en: {
            title: "Pho Viet Khang Assistant",
            placeholder: "Ask about dishes, locations...",
            welcome: "Hello! I am the Phở Việt Khang Virtual Assistant. I can recommend dishes, find locations, or search for info. How can I help you?"
        },
        fi: {
            title: "Pho Viet Khang Assistentti",
            placeholder: "Kysy ruoista, toimipisteistä...",
            welcome: "Hei! Olen Phở Việt Khangin virtuaaliassistentti. Voin suositella ruokia, etsiä toimipisteitä tai hakea tietoa. Kuinka voin auttaa?"
        }
    };

    const langNames = { vi: 'Vietnamese', en: 'English', fi: 'Finnish' };

    function getSystemPrompt(lang) {
        const langName = langNames[lang] || 'English';
        return `You are a helpful and polite virtual assistant for the Vietnamese restaurant "Phở Việt Khang" in Helsinki.
Your goal is to consult customers on the menu, tell them about locations & hours, search the web for additional info if needed, and introduce our heritage.

IMPORTANT: The customer's selected language is ${langName}. You MUST respond in ${langName} unless they explicitly ask you to respond in a different language. All menu item names can be displayed in Vietnamese, English, or Finnish — use the language matching the customer's selection.

Locations:
1. Pengerkatu Branch: Pengerkatu 29, 00500 Helsinki (Tue-Fri: 11:00-20:00, Sat-Sun: 12:00-20:30, Mon: Closed).
2. Easton Helsinki Branch: Kauppakartanonkatu 3, 00930 Helsinki (Mon-Fri: 11:00-21:00, Sat-Sun: 12:00-21:00).
Phone: +358 44 978 9995.

To search the web or consult the menu, use the following tools:
1. listAllFoodItems()
   Args: {}
   Returns the current menu dishes (names in Vi/En/Fi, prices, and descriptions).
2. webSearch(query)
   Args: { "query": string }
   Searches the web for additional info.
3. browseWebUrl(url)
   Args: { "url": string }
   Reads the content of any webpage.
4. createReservation(name, phone, email, date, time, guests, location, notes)
   Args: { "name": string, "phone": string, "email": string, "date": string (YYYY-MM-DD), "time": string (e.g. "18:00"), "guests": number, "location": string ("pengerkatu" or "easton"), "notes": string (optional) }
   Creates a table reservation at Phở Việt Khang. Use this when the customer wants to book a table. Ask for all required fields if not provided.
5. checkReservationStatus(phone)
   Args: { "phone": string }
   Checks the status of a reservation by phone number. Use this when the customer wants to know their reservation status.
6. getCartItems()
   Args: {}
   Returns all items currently in the customer's shopping cart.
7. addCartItem(name, qty, options)
   Args: { "name": string, "qty": number (default 1), "options": string[] (optional, e.g. ["Large", "Extra Cheese (+€2.00)"]) }
   Adds an item to the customer's cart. You MUST first call listAllFoodItems to find the exact item name and available options. The name must match a menu item name (vi or en). Options are display strings exactly as shown in the menu popup.
8. removeCartItem(name)
   Args: { "name": string }
   Removes all quantities of an item from the customer's cart by name.
9. showMenuSearch(query)
   Args: { "query": string }
   Navigates to the menu page and filters items matching the query (e.g. "gà", "chicken", "phở"). The menu page will display only matching items. Use this when the customer wants to see specific dishes.

Rules:
- Always respond in ${langName}. This is the customer's chosen language.
- When outputting tool calls, output ONLY the <tool_call> JSON block.
- You do NOT have any tools to modify orders, menu items, prices, or user accounts. You cannot take orders or process payments. If the user asks you to modify something, politely decline and state you are only a customer service assistant. However, you CAN create table reservations (createReservation), check reservation status (checkReservationStatus), manage the shopping cart (getCartItems, addCartItem, removeCartItem), and navigate the menu page with showMenuSearch(query).
- Format tool calls like:
<tool_call>
{
  "tool": "listAllFoodItems",
  "args": {}
}
</tool_call>`;
    }

    function getCurrentLang() {
        return localStorage.getItem('selectedLanguage') || 'en';
    }

    // Language sync helper
    let chatInitialized = false;
    const applyLangToChat = () => {
        const lang = getCurrentLang();
        const t = chatTranslations[lang] || chatTranslations.en;
        const titleEl = chatWin.querySelector('[data-chat-title]');
        if (titleEl) titleEl.textContent = t.title;
        if (chatInput) chatInput.placeholder = t.placeholder;

        // Update system prompt to match current language
        chatMessages[0] = { role: 'system', content: getSystemPrompt(lang) };

        // If chat was already opened, reset conversation on language change
        if (chatInitialized) {
            chatMessages.length = 1; // Keep only system prompt
            const msgArea = document.getElementById('client-chat-messages');
            if (msgArea) {
                msgArea.innerHTML = '';
                const welcomeEl = document.createElement('div');
                welcomeEl.className = 'pvk-chat-bubble pvk-bubble-ai animate-fade-in';
                welcomeEl.id = 'client-chat-welcome-msg';
                welcomeEl.textContent = t.welcome;
                msgArea.appendChild(welcomeEl);
            }
        }
    };

    window.addEventListener('languageChanged', applyLangToChat);

    // Dynamic Firebase Firestore Import
    const { db, getApiKeys } = await import("./firebase-config.js");
    const { collection, getDocs, addDoc, query, where } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");

    const apiKeys = await getApiKeys();
    const CLOUDFLARE_WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev';
    const WORKER_SECRET = apiKeys.workerSecret;

    async function callWorker(action, args = {}) {
        const resp = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': WORKER_SECRET,
            },
            body: JSON.stringify({ action, args }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || `Worker error ${resp.status}`);
        return data;
    }

    // Tools for customer AI
    async function listAllFoodItems() {
        try {
            const qSnap = await getDocs(collection(db, "menu"));
            const items = [];
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.isAvailable !== false) {
                    items.push({
                        nameVi: data.nameVi || '',
                        nameEn: data.nameEn || '',
                        nameFi: data.nameFi || '',
                        categoryVi: data.categoryVi || data.category || '',
                        categoryEn: data.categoryEn || '',
                        categoryFi: data.categoryFi || '',
                        price: data.price,
                        descriptionVi: data.descVi || '',
                        descriptionEn: data.descEn || '',
                        descriptionFi: data.descFi || '',
                        preparationTime: data.preparationTime || 15,
                        tags: data.tags || []
                    });
                }
            });
            return items;
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function webSearch(query) {
        try {
            return await callWorker('webSearch', { query });
        } catch (e) {
            console.error('[webSearch]', e);
            return { error: e.message };
        }
    }

    async function browseWebUrl(url) {
        try {
            return await callWorker('browseWebUrl', { url });
        } catch (e) {
            console.error('[browseWebUrl]', e);
            return { error: e.message };
        }
    }

    async function createReservation(name, phone, email, date, time, guests, location, notes) {
        try {
            if (!name || !phone || !date || !time || !guests || !location) {
                return { error: 'Missing required fields: name, phone, date, time, guests, location' };
            }
            const locLabel = location.toLowerCase() === 'easton' ? 'Easton Helsinki' : 'Pengerkatu';
            await addDoc(collection(db, 'reservations'), {
                name,
                phone,
                email: email || '',
                date,
                time,
                guests: parseInt(guests, 10),
                location: locLabel,
                notes: notes || '',
                status: 'pending',
                createdAt: new Date()
            });
            return { success: true, message: `Reservation confirmed at ${locLabel} for ${guests} guests on ${date} at ${time}.` };
        } catch (e) {
            console.error('[createReservation]', e);
            return { error: e.message };
        }
    }

    async function checkReservationStatus(phone) {
        try {
            if (!phone) return { error: 'Phone number is required.' };
            const q = query(collection(db, 'reservations'), where('phone', '==', phone));
            const snap = await getDocs(q);
            if (snap.empty) return { found: false, message: 'No reservation found for this phone number.' };
            const reservations = [];
            snap.forEach(docSnap => {
                const d = docSnap.data();
                reservations.push({
                    name: d.name,
                    date: d.date,
                    time: d.time,
                    guests: d.guests,
                    location: d.location,
                    status: d.status,
                    notes: d.notes || ''
                });
            });
            return { found: true, reservations };
        } catch (e) {
            console.error('[checkReservationStatus]', e);
            return { error: e.message };
        }
    }

    async function getCartItems() {
        try {
            const cart = typeof window.getCart === 'function' ? window.getCart() : [];
            if (!cart || cart.length === 0) return { empty: true, message: 'Cart is empty.' };
            const items = cart.map(item => ({
                name: item.name,
                qty: item.qty,
                price: item.price,
                options: item.options || [],
                id: item.id
            }));
            const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
            return { items, total: Math.round(total * 100) / 100, count: items.length };
        } catch (e) {
            console.error('[getCartItems]', e);
            return { error: e.message };
        }
    }

    async function addCartItem(name, qty, options) {
        try {
            if (!name) return { error: 'Item name is required.' };
            const qSnap = await getDocs(collection(db, 'menu'));
            let matched = null;
            qSnap.forEach(docSnap => {
                const d = docSnap.data();
                if (d.isAvailable === false) return;
                const names = [d.nameVi, d.nameEn, d.nameFi].map(s => (s || '').toLowerCase());
                if (names.includes(name.toLowerCase())) {
                    matched = { id: docSnap.id, ...d };
                }
            });
            if (!matched) return { error: `Menu item "${name}" not found or unavailable.` };
            const displayName = matched.nameVi || matched.nameEn || name;
            const itemOptions = Array.isArray(options) ? options : [];
            if (typeof window.addToCart === 'function') {
                window.addToCart(matched.id, displayName, matched.price, matched.image || '', itemOptions);
            }
            return { success: true, message: `Added ${displayName} x${qty || 1} to cart.` };
        } catch (e) {
            console.error('[addCartItem]', e);
            return { error: e.message };
        }
    }

    async function removeCartItem(name) {
        try {
            if (!name) return { error: 'Item name is required.' };
            const cart = typeof window.getCart === 'function' ? window.getCart() : [];
            const match = cart.find(i => i.name && i.name.toLowerCase() === name.toLowerCase());
            if (!match) return { error: `Item "${name}" not found in cart.` };
            if (typeof window.removeFromCart === 'function') {
                window.removeFromCart(match.id);
            }
            return { success: true, message: `Removed ${match.name} from cart.` };
        } catch (e) {
            console.error('[removeCartItem]', e);
            return { error: e.message };
        }
    }

    async function showMenuSearch(query) {
        try {
            if (!query) return { error: 'Search query is required.' };
            const currentPath = window.location.pathname.toLowerCase();
            const isMenuPage = currentPath.endsWith('menu.html') || currentPath.endsWith('menu/');
            if (isMenuPage) {
                window.__menuSearchFilter = query;
                if (typeof window.applyMenuFilter === 'function') window.applyMenuFilter(query);
                return { success: true, message: `Filtered menu for: "${query}"` };
            }
            window.location.href = `menu.html?search=${encodeURIComponent(query)}`;
            return { success: true, message: `Navigating to menu filtered for: "${query}"` };
        } catch (e) {
            console.error('[showMenuSearch]', e);
            return { error: e.message };
        }
    }

    // Toggle window
    toggleBtn.addEventListener('click', () => {
        if (chatWin.classList.contains('show')) {
            chatWin.classList.remove('show');
            setTimeout(() => chatWin.style.display = 'none', 250);
            chatIcon.textContent = 'chat';
        } else {
            chatInitialized = true;
            chatWin.style.display = 'flex';
            chatWin.offsetHeight; // force reflow
            chatWin.classList.add('show');
            chatIcon.textContent = 'keyboard_arrow_down';
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWin.classList.remove('show');
        setTimeout(() => chatWin.style.display = 'none', 250);
        chatIcon.textContent = 'chat';
    });

    // Chat Logic - system prompt is dynamically set by applyLangToChat()
    // Persist chat history across page navigation
    const CHAT_STORAGE_KEY = 'pvk_chat_history';
    let chatMessages = [];
    try {
        const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                chatMessages = parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to restore chat history:', e);
    }
    // Ensure system prompt is always first
    if (chatMessages.length === 0 || chatMessages[0].role !== 'system') {
        chatMessages = [{ role: 'system', content: getSystemPrompt(getCurrentLang()) }];
    }
    applyLangToChat();

    function saveChatHistory() {
        try {
            // Keep last 50 messages + system prompt
            const toSave = chatMessages.length > 51 
                ? [chatMessages[0], ...chatMessages.slice(-50)]
                : chatMessages;
            sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Failed to save chat history:', e);
        }
    }

    function stripThinking(str) {
        if (!str) return "";
        return str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    }

    function renderMarkdown(text) {
        if (!text) return '';
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return escaped
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    function appendBubble(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `pvk-chat-bubble pvk-bubble-${sender}`;
        if (sender === 'ai') {
            bubble.innerHTML = renderMarkdown(text);
        } else {
            bubble.textContent = text;
        }
        msgArea.appendChild(bubble);
        msgArea.scrollTop = msgArea.scrollHeight;
        return bubble;
    }

    function appendLoadingBubble() {
        const bubble = document.createElement('div');
        bubble.className = `pvk-chat-bubble pvk-bubble-ai dots-loader`;
        bubble.id = 'client-chat-loading-bubble';
        bubble.innerHTML = '<span></span><span></span><span></span>';
        msgArea.appendChild(bubble);
        msgArea.scrollTop = msgArea.scrollHeight;
    }

    function removeLoadingBubble() {
        const bubble = document.getElementById('client-chat-loading-bubble');
        if (bubble) bubble.remove();
    }

    const CEREBRAS_KEYS = [
        apiKeys.cerebrasPrimary,
        apiKeys.cerebrasBackup
    ];

    const OPENROUTER_API_KEYS = apiKeys.openRouterKeys || [];

    async function callCerebras(payload, model = 'gpt-oss-120b') {
        let lastErr;
        for (const key of CEREBRAS_KEYS) {
            if (!key) continue;
            try {
                const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ model, messages: payload.messages })
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errText}`);
                }
                return await response.json();
            } catch (e) {
                console.warn(`[Cerebras] Key failed: ${e.message}`);
                lastErr = e;
            }
        }
        throw lastErr;
    }

    async function callOpenRouterWithFallback(payload) {
        const models = [
            'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
            'meta-llama/llama-3-8b-instruct:free',
            'google/gemma-2-9b-it:free'
        ];
        
        for (const model of models) {
            for (const key of OPENROUTER_API_KEYS) {
                try {
                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 
                            'Authorization': `Bearer ${key}`, 
                            'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify({ ...payload, model })
                    });
                    if (response.ok) return await response.json();
                } catch (err) {
                    console.warn(`[OpenRouter] Failed: ${err.message}`);
                }
            }
        }
        throw new Error("All AI fallbacks failed.");
    }

    let toolCallCount = 0;

    async function handleAgentResponse(responseText) {
        const textClean = stripThinking(responseText);
        const regex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
        const matches = [...textClean.matchAll(regex)];

        if (matches.length > 0) {
            toolCallCount++;
            if (toolCallCount > 4) {
                removeLoadingBubble();
                const limitMsgs = {
                    vi: "Hệ thống: AI đã dừng lại để tránh quá tải hạn ngạch API.",
                    en: "System: AI stopped to avoid API quota overload.",
                    fi: "Järjestelmä: AI pysäytettiin API-kvotaan liiallista välttämiseksi."
                };
                appendBubble(limitMsgs[getCurrentLang()] || limitMsgs.en, 'ai');
                return;
            }

            const results = [];
            for (const match of matches) {
                try {
                    const payload = JSON.parse(match[1].trim());
                    const { tool, args } = payload;
                    let result;
                    if (tool === 'listAllFoodItems') {
                        result = await listAllFoodItems();
                    } else if (tool === 'webSearch') {
                        result = await webSearch(args.query);
                    } else if (tool === 'browseWebUrl') {
                        result = await browseWebUrl(args.url);
                    } else if (tool === 'createReservation') {
                        result = await createReservation(args.name, args.phone, args.email, args.date, args.time, args.guests, args.location, args.notes);
                    } else if (tool === 'checkReservationStatus') {
                        result = await checkReservationStatus(args.phone);
                    } else if (tool === 'getCartItems') {
                        result = await getCartItems();
                    } else if (tool === 'addCartItem') {
                        result = await addCartItem(args.name, args.qty, args.options);
                    } else if (tool === 'removeCartItem') {
                        result = await removeCartItem(args.name);
                    } else if (tool === 'showMenuSearch') {
                        result = await showMenuSearch(args.query);
                    } else {
                        const notSupportedMsgs = {
                            vi: `Tool ${tool} không được hỗ trợ.`,
                            en: `Tool ${tool} is not supported.`,
                            fi: `Työkalua ${tool} ei tueta.`
                        };
                        result = { error: notSupportedMsgs[getCurrentLang()] || notSupportedMsgs.en };
                    }
                    results.push({ tool, success: true, result });
                } catch (e) {
                    results.push({ success: false, error: e.message });
                }
            }

            const feedbackContent = results.map((r, idx) => `[Tool Result ${idx + 1} - ${r.tool}]: ${JSON.stringify(r.result || { error: r.error })}`).join('\n\n');
            chatMessages.push({
                role: 'user',
                content: `Dưới đây là kết quả của các công cụ tra cứu bạn đã gọi:\n\n${feedbackContent}\n\nHãy tổng hợp kết quả này và trả lời khách hàng.`
            });
            saveChatHistory();

            await fetchAiResponse();
        } else {
            removeLoadingBubble();
            appendBubble(textClean, 'ai');
        }
    }

    async function fetchAiResponse() {
        try {
            let data;
            try {
                data = await callCerebras({ messages: chatMessages }, 'gpt-oss-120b');
            } catch (primaryErr) {
                try {
                    data = await callCerebras({ messages: chatMessages }, 'zai-glm-4.7');
                } catch (backupErr) {
                    data = await callOpenRouterWithFallback({ messages: chatMessages });
                }
            }

            const responseText = data.choices[0].message.content;
            chatMessages.push({ role: 'assistant', content: responseText });
            saveChatHistory();
            await handleAgentResponse(responseText);
        } catch (err) {
            const errMessages = {
                vi: 'Lỗi kết nối AI: ',
                en: 'AI connection error: ',
                fi: 'AI yhteysvirhe: '
            };
            const errMsg = errMessages[getCurrentLang()] || errMessages.en;
            removeLoadingBubble();
            appendBubble(`${errMsg}${err.message}`, 'ai');
        }
    }

    async function sendMessage() {
        const val = chatInput.value.trim();
        if (!val) return;

        chatInput.value = '';
        appendBubble(val, 'user');
        chatMessages.push({ role: 'user', content: val });
        saveChatHistory();

        toolCallCount = 0;
        appendLoadingBubble();
        await fetchAiResponse();
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
})();
