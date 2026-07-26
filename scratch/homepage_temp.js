import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, query, where, limit, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function loadHomepage() {
    try {
        const docRef = doc(db, "config", "homepage");
        const docSnap = await getDoc(docRef);
        
        let config = null;
        if (docSnap.exists()) {
            config = docSnap.data();
        }

        // Apply config to Hero
        if (config) {
            if (config.heroBgUrl && (config.heroBgUrl.startsWith('http') || config.heroBgUrl.startsWith('data:'))) {
                localStorage.setItem('cachedHeroBg', config.heroBgUrl);
                const heroBg = document.getElementById('hero-bg');
                if (heroBg) heroBg.src = config.heroBgUrl;
            } else {
                localStorage.removeItem('cachedHeroBg');
            }

            

            const updateHeroText = () => {
                const lang = localStorage.getItem('selectedLanguage') || 'en';
                const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
                
                let title = config['heroTitle' + langCap];
                if (lang === 'vi' && title === "Tinh Hoa Ẩm Thực Việt Tại Helsinki") title = null;
                const titleElem = document.getElementById('hero-title');
                if (titleElem) {
                    if (title) {
                        titleElem.textContent = title;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['hero-title']) {
                        titleElem.textContent = translations[lang]['hero-title'];
                    }
                }
                
                let desc = config['heroDesc' + langCap];
                if (lang === 'vi' && desc === "Mê món Việt? Ghé ngay Phở Việt Khang nhé! Tụi mình nấu Phở hầm xương thơm lừng và các món ăn mang đậm chất đường phố Việt Nam ngay tại trung tâm Helsinki.") desc = null;
                const descElem = document.getElementById('hero-desc');
                if (descElem) {
                    if (desc) {
                        descElem.textContent = desc;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['hero-desc']) {
                        descElem.textContent = translations[lang]['hero-desc'];
                    }
                }
            };
            updateHeroText();
            window.addEventListener('languageChanged', updateHeroText);

            // Apply config to Signatures (Trilingual Support -> 4 languages)
            

            const updateSignatureText = () => {
                const lang = localStorage.getItem('selectedLanguage') || 'en';
                const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
                
                let title = config['signatureTitle' + langCap];
                if (lang === 'vi' && title === "Món Đặc Sản") title = null;
                const sigTitleElem = document.getElementById('signature-title');
                if (sigTitleElem) {
                    if (title) {
                        sigTitleElem.textContent = title;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['sig-title']) {
                        sigTitleElem.textContent = translations[lang]['sig-title'];
                    }
                }
                
                let desc = config['signatureDesc' + langCap];
                if (lang === 'vi' && desc === "Khám phá các món đặc sản trứ danh như Phở, Bún Bò Huế và Bún Thịt Nướng.") desc = null;
                const sigDescElem = document.getElementById('signature-desc');
                if (sigDescElem) {
                    if (desc) {
                        sigDescElem.textContent = desc;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['sig-desc']) {
                        sigDescElem.textContent = translations[lang]['sig-desc'];
                    }
                }
            };

            updateSignatureText();
            window.addEventListener('languageChanged', updateSignatureText);

            // Apply config to Story
            if (config.storyImg && (config.storyImg.startsWith('http') || config.storyImg.startsWith('data:'))) {
                localStorage.setItem('cachedStoryImg', config.storyImg);
                const storyImgElem = document.getElementById('story-img');
                if (storyImgElem) storyImgElem.src = config.storyImg;
            } else {
                localStorage.removeItem('cachedStoryImg');
            }

            

            const updateStoryText = () => {
                const lang = localStorage.getItem('selectedLanguage') || 'en';
                const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
                
                const label = config['storyLabel' + langCap];
                const storyLabelElem = document.getElementById('story-label');
                if (storyLabelElem) {
                    if (label) {
                        storyLabelElem.textContent = label;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['story-label']) {
                        storyLabelElem.textContent = translations[lang]['story-label'];
                    }
                }
                
                const title = config['storyTitle' + langCap];
                const storyTitleElem = document.getElementById('story-title');
                if (storyTitleElem) {
                    if (title) {
                        storyTitleElem.textContent = title;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['story-title']) {
                        storyTitleElem.textContent = translations[lang]['story-title'];
                    }
                }
                
                const p1 = config['storyP1' + langCap];
                const storyP1Elem = document.getElementById('story-p1');
                if (storyP1Elem) {
                    if (p1) {
                        storyP1Elem.textContent = p1;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['story-p1']) {
                        storyP1Elem.textContent = translations[lang]['story-p1'];
                    }
                }
                
                const p2 = config['storyP2' + langCap];
                const storyP2Elem = document.getElementById('story-p2');
                if (storyP2Elem) {
                    if (p2) {
                        storyP2Elem.textContent = p2;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['story-p2']) {
                        storyP2Elem.textContent = translations[lang]['story-p2'];
                    }
                }
            };
            updateStoryText();
            window.addEventListener('languageChanged', updateStoryText);

            // Apply config to CTA
            

            const updateCtaText = () => {
                const lang = localStorage.getItem('selectedLanguage') || 'en';
                const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);

                const title = config['ctaTitle' + langCap];
                const ctaTitleElem = document.getElementById('cta-title');
                if (ctaTitleElem) {
                    if (title) {
                        ctaTitleElem.textContent = title;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['cta-title']) {
                        ctaTitleElem.textContent = translations[lang]['cta-title'];
                    }
                }
                
                const desc = config['ctaDesc' + langCap];
                const ctaDescElem = document.getElementById('cta-desc');
                if (ctaDescElem) {
                    if (desc) {
                        ctaDescElem.textContent = desc;
                    } else if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['cta-desc']) {
                        ctaDescElem.textContent = translations[lang]['cta-desc'];
                    }
                }
            };
            updateCtaText();
            window.addEventListener('languageChanged', updateCtaText);
        }

        const sigContainer = document.getElementById('signature-container');
        if (sigContainer && config && config.signatureDishIds && config.signatureDishIds.length > 0) {
            const hasPreRendered = sigContainer.children.length > 0 && !sigContainer.querySelector('.animate-spin') && !sigContainer.innerHTML.includes('<!-- Dynamic signature dishes');
            if (!hasPreRendered) {
                sigContainer.innerHTML = '<div class="col-span-full text-center py-10"><span class="material-symbols-outlined animate-spin text-4xl">sync</span></div>';
            }
            
            // Fetch the specific dishes
            const dishes = [];
            for (const id of config.signatureDishIds) {
                try {
                    const dishSnap = await getDoc(doc(db, "menu", id));
                    if (dishSnap.exists()) {
                        dishes.push({ id: dishSnap.id, ...dishSnap.data() });
                    }
                } catch(e) {}
            }

            const renderDishes = () => {
                if (dishes.length > 0) {
                    const lang = localStorage.getItem('selectedLanguage') || 'en';
                    const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
                    let html = '';
                    dishes.forEach((dish, index) => {
                        const name = dish['name' + langCap] || dish.nameEn || dish.nameVi || dish.name || '';
                        const desc = dish['description' + langCap] || dish['desc' + langCap] || dish.descriptionEn || dish.descEn || dish.descriptionVi || dish.descVi || dish.description || '';
                        const img = dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                        
                        if (index === 0) {
                            // Large Card
                            html += `
                            <div class="md:col-span-2 md:row-span-2 bg-surface/90 backdrop-blur-sm rounded-DEFAULT border-2 border-primary shadow-md shadow-primary/10 overflow-hidden group">
                                <div class="relative h-full overflow-hidden">
                                    <img alt="${name}" class="w-full h-[300px] md:h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${img}"/>
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    <div class="absolute bottom-0 left-0 p-8">
                                        <h3 class="font-title-lg text-3xl font-bold text-white mb-2 drop-shadow-md">
                                            ${name}
                                            ${dish.allergenWarning ? '<span class="inline-flex items-center gap-1 bg-red-900/80 text-red-100 text-xs px-2 py-0.5 rounded-md font-semibold border border-red-500/50 ml-2 align-middle" title="Chứa thành phần dễ gây dị ứng"><span class="material-symbols-outlined text-[14px]">warning</span> Dị ứng</span>' : ''}
                                        </h3>
                                        <p class="font-body-sm text-body-sm text-gray-200 drop-shadow">${desc}</p>
                                    </div>
                                </div>
                            </div>`;
                        } else {
                            // Small Card
                            html += `
                            <div class="md:col-span-1 bg-surface/90 backdrop-blur-sm rounded-DEFAULT border-2 border-primary shadow-md shadow-primary/10 overflow-hidden group flex flex-col h-full">
                                <div class="relative h-48 overflow-hidden shrink-0">
                                    <img alt="${name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${img}"/>
                                </div>
                                <div class="p-6 flex-1 flex flex-col">
                                    <h3 class="font-title-lg text-title-lg text-primary-container mb-2 line-clamp-1">
                                        ${name}
                                        ${dish.allergenWarning ? '<span class="inline-flex items-center gap-1 bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded border border-red-200 ml-1 align-middle" title="Chứa thành phần dễ gây dị ứng"><span class="material-symbols-outlined text-[12px]">warning</span></span>' : ''}
                                    </h3>
                                    <p class="font-body-sm text-body-sm text-secondary line-clamp-2">${desc}</p>
                                </div>
                            </div>`;
                        }
                    });
                    sigContainer.innerHTML = html;
                } else {
                    sigContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">No signature dishes found.</div>';
                }
            };

            renderDishes();
            window.addEventListener('languageChanged', renderDishes);
        }

    } catch (e) {
        console.error("Error loading homepage config", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHomepage();
});
