const translations = {
  vi: {
    "nav-home": "Trang chủ", "nav-menu": "Thực đơn", "nav-locations": "Địa điểm", "nav-contact": "Liên hệ", "nav-reservations": "Đặt bàn", "nav-register": "Đăng ký", "nav-inbox": "Hộp thư", "inbox-title": "Hộp thư của bạn",
    "menu-label": "Thực đơn của chúng tôi", "menu-title": "Thực Đơn", "menu-desc": "Hành trình được chọn lọc kỹ lưỡng qua những truyền thống ẩm thực Việt Nam tinh hoa nhất, được chế tác với sự chuẩn xác và đam mê.",
    "cat-appetizers": "Khai vị", "cat-mains": "Món chính", "cat-drinks": "Đồ uống", "cat-desserts": "Tráng miệng",
    "app1-title": "Gỏi cuốn tôm", "app1-desc": "Cuốn tay tỉ mỉ với tôm sú tươi rói, bún gạo, rau thơm, chấm tương đậu phộng.",
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
    "dish4-title": "Gỏi cuốn tôm", "dish4-desc": "Cuốn tay tỉ mỉ với tôm sú tươi rói, bún gạo, và rau thơm, chấm cùng tương đậu phộng béo ngậy.",
    "dish5-title": "Cafe muối", "dish5-desc": "Cà phê phin đậm đà nguyên bản kết hợp cùng lớp kem mặn sánh mịn, đánh thức mọi giác quan.",
    "cta-title": "Trải Nghiệm Hành Trình Trọn Vẹn",
    "cta-desc": "Khám phá thực đơn nếm thử theo mùa và các món gọi riêng đầy đủ của chúng tôi, được thiết kế để mang lại sự thăng hoa và thích thú.",
    "cta-btn1": "Xem Thực Đơn",
    "cta-btn2": "Tìm Địa Điểm",
    "footer-desc": "Nghệ Thuật Ẩm Thực Châu Á.", "footer-privacy": "Chính sách bảo mật", "footer-terms": "Điều khoản dịch vụ", "footer-careers": "Tuyển dụng", "footer-press": "Tài liệu báo chí", "footer-copyright": "© 2026 PHỞ VIỆT KHANG. BẢN QUYỀN ĐÃ ĐƯỢC BẢO HỘ.",
    "cart-title": "Giỏ hàng & Thanh toán", "order-items": "Món ăn đã chọn", "empty-cart": "Giỏ hàng của bạn đang trống.", "browse-menu": "Xem Thực đơn", "order-summary": "Tổng quan đơn hàng", "total-label": "Tổng cộng:", "your-name": "Tên của bạn", "phone-number": "Số điện thoại", "dine-in": "Ăn tại bàn", "takeaway": "Mang về", "delivery": "Giao hàng", "table-number": "Số bàn", "delivery-address": "Địa chỉ giao hàng", "notes": "Ghi chú cho bếp (Tùy chọn)", "place-order": "Đặt hàng ngay",
    "reviews-label": "Trải nghiệm thực tế", "reviews-title": "Khách hàng nói gì về chúng tôi"
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
    "cart-title": "Your Cart & Checkout", "order-items": "Order Items", "empty-cart": "Your cart is empty.", "browse-menu": "Browse Menu", "order-summary": "Order Summary", "total-label": "Total:", "your-name": "Your Name", "phone-number": "Phone Number", "dine-in": "Dine In", "takeaway": "Takeaway", "delivery": "Delivery", "table-number": "Table Number", "delivery-address": "Delivery Address", "notes": "Notes for Kitchen (Optional)", "place-order": "Place Order Now",
    "reviews-label": "Guest Experiences", "reviews-title": "What Our Guests Say"
  },
  fi: {
    "nav-home": "Koti", "nav-menu": "Menu", "nav-locations": "Toimipisteet", "nav-contact": "Yhteystiedot", "nav-reservations": "Varaukset", "nav-register": "Rekisteröidy", "nav-inbox": "Postilaatikko", "inbox-title": "Postilaatikkosi",
    "menu-label": "Tarjontamme", "menu-title": "Ruokalista", "menu-desc": "Huolella kuratoitu matka hienoimpien vietnamilaisten keittiöperinteiden läpi, valmistettu tarkkuudella ja intohimolla.",
    "cat-appetizers": "Alkupalat", "cat-mains": "Pääruoat", "cat-drinks": "Juomat", "cat-desserts": "Jälkiruoat",
    "app1-title": "Katkarapu-kevätkaäryleet", "app1-desc": "Tuoreet kevätrullat tiikerikatkaravuilla, riisinuudeleilla, yrteillä ja maapähkinäkastikkeella.",
    "app2-title": "Wonton-keitto", "app2-desc": "Kirkas luuliemi käsintehdyillä possu-katkarapunyyteillä.",
    "app3-title": "Rapeat kevätkääryleet", "app3-desc": "Rapeat paistetut kevätkääryleet possulla, korvasienillä ja makealla chilikastikkeella.",
    "app4-title": "Mini Bánh Xèo", "app4-desc": "Rapeat vietnamilaiset letut katkaravuilla, idullisilla ja tuoreilla yrteillä.",
    "main1-title": "Ankka-paistettu riisi", "main1-desc": "Ankanrasvassa paistettu rapea riisi, paahdettu ankka ja hapanimeläpikkelssit.",
    "main2-title": "Paistettu harvinainen naudan Pho", "main2-desc": "Wokkipannulla paistettu harvinainen nauta valkosipuliaromilla rikkaassa perinteisessä liemessä.",
    "main3-title": "Bún Bò Huế", "main3-desc": "Tulinen Huen tyylinen naudanlieminuudelikeitto sitruunaruoholla, chiliöljyllä ja yrteillä.",
    "main4-title": "Murrettu riisi porsaankyljyksellä", "main4-desc": "Murrettu riisi grillatulla porsaankyljyksellä, paistetulla kananmunalla ja pikkelöidyillä kasviksilla.",
    "main5-title": "Hanoin grillatut possunuudelit", "main5-desc": "Hanoin tyylinen grillattu possu riisinuudeleilla, yrteillä ja dippiliemellä.",
    "main6-title": "Merenelävänuudelit", "main6-desc": "Wokkipannulla paistetut munanauhanaudelit katkaravuilla, kalmarilla ja kauden kasviksilla.",
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
    "cart-title": "Ostoskori & Kassa", "order-items": "Tilauksen tuotteet", "empty-cart": "Ostoskoriisi on tyhjä.", "browse-menu": "Selaa ruokalistaa", "order-summary": "Yhteenveto", "total-label": "Yhteensä:", "your-name": "Nimesi", "phone-number": "Puhelinnumero", "dine-in": "Syö paikan päällä", "takeaway": "Mukaan", "delivery": "Kotiinkuljetus", "table-number": "Pöydän numero", "delivery-address": "Toimitusosoite", "notes": "Huomautukset keittiölle (valinnainen)", "place-order": "Tilaa nyt",
    "reviews-label": "Asiakaskokemukset", "reviews-title": "Mitä asiakkaamme sanovat" maapähkinäkastikkeen kera.",
    "dish5-title": "Suolattu Kahvi", "dish5-desc": "Voimakas perinteinen suodatinkahvi, jonka päällä on pehmeä, suolainen kermavaahto herättämään aistisi.",
    "cta-title": "Koe Koko Matka",
    "cta-desc": "Tutustu koko kausiluonteiseen maistelumenuumme ja a la carte -tarjontaamme, jotka on suunniteltu ilahduttamaan.",
    "cta-btn1": "Näytä Menu",
    "cta-btn2": "Etsi Toimipiste",
    "footer-desc": "Aasialaisen Gastronomian Taide.", "footer-privacy": "Tietosuojakäytäntö", "footer-terms": "Käyttöehdot", "footer-careers": "Urat", "footer-press": "Lehdistöpaketti", "footer-copyright": "© 2026 PHO VIET KHANG. KAIKKI OIKEUDET PIDÄTETÄÄN.",
    "cart-title": "Ostoskori & Kassa", "order-items": "Tilauksen tuotteet", "empty-cart": "Ostoskorisi on tyhjä.", "browse-menu": "Selaa ruokalistaa", "order-summary": "Yhteenveto", "total-label": "Yhteensä:", "your-name": "Nimesi", "phone-number": "Puhelinnumero", "dine-in": "Syö paikan päällä", "takeaway": "Mukaan", "delivery": "Kotiinkuljetus", "table-number": "Pöydän numero", "delivery-address": "Toimitusosoite", "notes": "Huomautukset keittiölle (valinnainen)", "place-order": "Tilaa nyt"
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

function initUnifiedNavbar() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/admin/') || path.includes('/kitchen/') || path.includes('/host/')) {
    return;
  }
  
  nav.className = "fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30";
  nav.innerHTML = `
    <div class="flex justify-between items-center max-w-7xl mx-auto px-4 md:px-16 h-20">
        <a class="font-headline-sm text-2xl font-bold tracking-wider flex items-center gap-2 text-black dark:text-white" href="index.html">
            <span class="material-symbols-outlined text-3xl text-black dark:text-white">ramen_dining</span>
            <span class="text-black dark:text-white">PHỞ VIỆT KHANG</span>
        </a>
        <div class="hidden md:flex items-center space-x-8 font-body-md text-base font-semibold tracking-wide">
            <a class="text-secondary hover:text-white transition-colors" href="index.html" data-i18n="nav-home">Home</a>
            <a class="text-secondary hover:text-white transition-colors" href="menu.html" data-i18n="nav-menu">Menu</a>
            <a class="text-secondary hover:text-white transition-colors" href="locations.html" data-i18n="nav-locations">Locations</a>
            <a class="text-secondary hover:text-white transition-colors" href="contact.html" data-i18n="nav-contact">Contact</a>
            <a class="text-secondary hover:text-white transition-colors relative flex items-center gap-1" href="inbox.html" id="nav-inbox-link">
                <span data-i18n="nav-inbox">Inbox</span>
                <span id="inbox-badge-nav" class="hidden w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            </a>
        </div>
        <div class="flex items-center space-x-4">
            <div class="hidden md:flex items-center space-x-2 mr-2">
                <img id="lang-vi" src="https://hatscripts.github.io/circle-flags/flags/vn.svg" alt="VN" class="w-8 h-8 cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-transparent" style="border-radius: 50% !important;" title="Tiếng Việt" onclick="changeLanguage('vi')">
                <img id="lang-en" src="https://hatscripts.github.io/circle-flags/flags/gb.svg" alt="UK" class="w-8 h-8 cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-transparent" style="border-radius: 50% !important;" title="English" onclick="changeLanguage('en')">
                <img id="lang-fi" src="https://hatscripts.github.io/circle-flags/flags/fi.svg" alt="FI" class="w-8 h-8 cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-transparent" style="border-radius: 50% !important;" title="Suomi" onclick="changeLanguage('fi')">
            </div>
            <a id="nav-register-btn" class="hidden md:inline-flex border-2 border-primary-container text-primary-container font-body-sm text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-container hover:text-white transition-all duration-300 shadow-sm" href="register.html" data-i18n="nav-register">
                Register
            </a>
            <a class="hidden md:inline-flex bg-primary-container text-on-primary-container font-body-sm text-sm font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition-all duration-300 bg-gradient-to-tr from-primary-container to-[#003d82]" href="reservations.html" data-i18n="nav-reservations">
                Reservations
            </a>
            <!-- Cart Icon -->
            <a href="cart.html" class="nav-cart-btn relative" title="View Cart">
                <span class="material-symbols-outlined text-[24px]">shopping_cart</span>
                <span id="cart-count" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
            </a>
            <!-- User Icon -->
            <a id="nav-user-btn" href="login.html" class="text-black dark:text-white hover:text-primary-container">
                <span class="material-symbols-outlined text-[24px]">account_circle</span>
            </a>
            <button class="md:hidden text-black dark:text-white p-2" onclick="toggleMobileMenu()">
                <span class="material-symbols-outlined">menu</span>
            </button>
        </div>
    </div>
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="hidden md:hidden bg-surface/95 backdrop-blur-md border-t border-outline-variant/30 px-4 py-4 space-y-3 font-semibold text-base">
        <a class="block text-secondary hover:text-white transition-colors" href="index.html" data-i18n="nav-home">Home</a>
        <a class="block text-secondary hover:text-white transition-colors" href="menu.html" data-i18n="nav-menu">Menu</a>
        <a class="block text-secondary hover:text-white transition-colors" href="locations.html" data-i18n="nav-locations">Locations</a>
        <a class="block text-secondary hover:text-white transition-colors" href="contact.html" data-i18n="nav-contact">Contact</a>
        <a class="block text-secondary hover:text-white transition-colors flex items-center gap-1" href="inbox.html"><span data-i18n="nav-inbox">Inbox</span><span id="inbox-badge-nav-mobile" class="hidden w-2 h-2 bg-red-500 rounded-full animate-ping"></span></a>
        <div class="flex items-center space-x-2 pt-2 border-t border-outline-variant/20">
            <img id="lang-vi-mobile" src="https://hatscripts.github.io/circle-flags/flags/vn.svg" alt="VN" class="w-8 h-8 cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-transparent" style="border-radius: 50% !important;" onclick="changeLanguage('vi')">
            <img id="lang-en-mobile" src="https://hatscripts.github.io/circle-flags/flags/gb.svg" alt="UK" class="w-8 h-8 cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-transparent" style="border-radius: 50% !important;" onclick="changeLanguage('en')">
            <img id="lang-fi-mobile" src="https://hatscripts.github.io/circle-flags/flags/fi.svg" alt="FI" class="w-8 h-8 cursor-pointer hover:opacity-80 transition-all duration-300 ring-2 ring-transparent" style="border-radius: 50% !important;" onclick="changeLanguage('fi')">
        </div>
        <div class="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
            <a id="nav-register-btn-mobile" class="w-full text-center border-2 border-primary-container text-primary-container font-body-sm text-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary-container hover:text-white transition-all duration-300" href="register.html" data-i18n="nav-register">Register</a>
            <a class="w-full text-center bg-primary-container text-on-primary-container font-body-sm text-sm font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition-all duration-300 bg-gradient-to-tr from-primary-container to-[#003d82]" href="reservations.html" data-i18n="nav-reservations">Reservations</a>
        </div>
    </div>
  `;
  
  window.toggleMobileMenu = function() {
    const mm = document.getElementById('mobile-menu');
    if (mm) mm.classList.toggle('hidden');
  };
}

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

document.addEventListener('DOMContentLoaded', () => {
  initUnifiedNavbar();
  const savedLang = localStorage.getItem('selectedLanguage') || 'en';
  changeLanguage(savedLang);
});

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
  e.preventDefault();
  document.body.classList.add('page-exit');
  setTimeout(() => { window.location.href = href; }, 300);
});
