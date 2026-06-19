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

            if (config.heroTitleVi) localStorage.setItem('cachedHeroTitle_vi', config.heroTitleVi);
            else localStorage.removeItem('cachedHeroTitle_vi');
            if (config.heroTitleEn) localStorage.setItem('cachedHeroTitle_en', config.heroTitleEn);
            else localStorage.removeItem('cachedHeroTitle_en');
            if (config.heroTitleFi) localStorage.setItem('cachedHeroTitle_fi', config.heroTitleFi);
            else localStorage.removeItem('cachedHeroTitle_fi');
            if (config.heroTitleSv) localStorage.setItem('cachedHeroTitle_sv', config.heroTitleSv);
            else localStorage.removeItem('cachedHeroTitle_sv');

            if (config.heroDescVi) localStorage.setItem('cachedHeroDesc_vi', config.heroDescVi);
            else localStorage.removeItem('cachedHeroDesc_vi');
            if (config.heroDescEn) localStorage.setItem('cachedHeroDesc_en', config.heroDescEn);
            else localStorage.removeItem('cachedHeroDesc_en');
            if (config.heroDescFi) localStorage.setItem('cachedHeroDesc_fi', config.heroDescFi);
            else localStorage.removeItem('cachedHeroDesc_fi');
            if (config.heroDescSv) localStorage.setItem('cachedHeroDesc_sv', config.heroDescSv);
            else localStorage.removeItem('cachedHeroDesc_sv');

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
            if (config.signatureTitleVi) localStorage.setItem('cachedSignatureTitle_vi', config.signatureTitleVi);
            else localStorage.removeItem('cachedSignatureTitle_vi');
            if (config.signatureTitleEn) localStorage.setItem('cachedSignatureTitle_en', config.signatureTitleEn);
            else localStorage.removeItem('cachedSignatureTitle_en');
            if (config.signatureTitleFi) localStorage.setItem('cachedSignatureTitle_fi', config.signatureTitleFi);
            else localStorage.removeItem('cachedSignatureTitle_fi');
            if (config.signatureTitleSv) localStorage.setItem('cachedSignatureTitle_sv', config.signatureTitleSv);
            else localStorage.removeItem('cachedSignatureTitle_sv');

            if (config.signatureDescVi) localStorage.setItem('cachedSignatureDesc_vi', config.signatureDescVi);
            else localStorage.removeItem('cachedSignatureDesc_vi');
            if (config.signatureDescEn) localStorage.setItem('cachedSignatureDesc_en', config.signatureDescEn);
            else localStorage.removeItem('cachedSignatureDesc_en');
            if (config.signatureDescFi) localStorage.setItem('cachedSignatureDesc_fi', config.signatureDescFi);
            else localStorage.removeItem('cachedSignatureDesc_fi');
            if (config.signatureDescSv) localStorage.setItem('cachedSignatureDesc_sv', config.signatureDescSv);
            else localStorage.removeItem('cachedSignatureDesc_sv');

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

            if (config.storyLabelVi) localStorage.setItem('cachedStoryLabel_vi', config.storyLabelVi);
            else localStorage.removeItem('cachedStoryLabel_vi');
            if (config.storyLabelEn) localStorage.setItem('cachedStoryLabel_en', config.storyLabelEn);
            else localStorage.removeItem('cachedStoryLabel_en');
            if (config.storyLabelFi) localStorage.setItem('cachedStoryLabel_fi', config.storyLabelFi);
            else localStorage.removeItem('cachedStoryLabel_fi');
            if (config.storyLabelSv) localStorage.setItem('cachedStoryLabel_sv', config.storyLabelSv);
            else localStorage.removeItem('cachedStoryLabel_sv');

            if (config.storyTitleVi) localStorage.setItem('cachedStoryTitle_vi', config.storyTitleVi);
            else localStorage.removeItem('cachedStoryTitle_vi');
            if (config.storyTitleEn) localStorage.setItem('cachedStoryTitle_en', config.storyTitleEn);
            else localStorage.removeItem('cachedStoryTitle_en');
            if (config.storyTitleFi) localStorage.setItem('cachedStoryTitle_fi', config.storyTitleFi);
            else localStorage.removeItem('cachedStoryTitle_fi');
            if (config.storyTitleSv) localStorage.setItem('cachedStoryTitle_sv', config.storyTitleSv);
            else localStorage.removeItem('cachedStoryTitle_sv');

            if (config.storyP1Vi) localStorage.setItem('cachedStoryP1_vi', config.storyP1Vi);
            else localStorage.removeItem('cachedStoryP1_vi');
            if (config.storyP1En) localStorage.setItem('cachedStoryP1_en', config.storyP1En);
            else localStorage.removeItem('cachedStoryP1_en');
            if (config.storyP1Fi) localStorage.setItem('cachedStoryP1_fi', config.storyP1Fi);
            else localStorage.removeItem('cachedStoryP1_fi');
            if (config.storyP1Sv) localStorage.setItem('cachedStoryP1_sv', config.storyP1Sv);
            else localStorage.removeItem('cachedStoryP1_sv');

            if (config.storyP2Vi) localStorage.setItem('cachedStoryP2_vi', config.storyP2Vi);
            else localStorage.removeItem('cachedStoryP2_vi');
            if (config.storyP2En) localStorage.setItem('cachedStoryP2_en', config.storyP2En);
            else localStorage.removeItem('cachedStoryP2_en');
            if (config.storyP2Fi) localStorage.setItem('cachedStoryP2_fi', config.storyP2Fi);
            else localStorage.removeItem('cachedStoryP2_fi');
            if (config.storyP2Sv) localStorage.setItem('cachedStoryP2_sv', config.storyP2Sv);
            else localStorage.removeItem('cachedStoryP2_sv');

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
            if (config.ctaTitleVi) localStorage.setItem('cachedCtaTitle_vi', config.ctaTitleVi);
            else localStorage.removeItem('cachedCtaTitle_vi');
            if (config.ctaTitleEn) localStorage.setItem('cachedCtaTitle_en', config.ctaTitleEn);
            else localStorage.removeItem('cachedCtaTitle_en');
            if (config.ctaTitleFi) localStorage.setItem('cachedCtaTitle_fi', config.ctaTitleFi);
            else localStorage.removeItem('cachedCtaTitle_fi');
            if (config.ctaTitleSv) localStorage.setItem('cachedCtaTitle_sv', config.ctaTitleSv);
            else localStorage.removeItem('cachedCtaTitle_sv');

            if (config.ctaDescVi) localStorage.setItem('cachedCtaDesc_vi', config.ctaDescVi);
            else localStorage.removeItem('cachedCtaDesc_vi');
            if (config.ctaDescEn) localStorage.setItem('cachedCtaDesc_en', config.ctaDescEn);
            else localStorage.removeItem('cachedCtaDesc_en');
            if (config.ctaDescFi) localStorage.setItem('cachedCtaDesc_fi', config.ctaDescFi);
            else localStorage.removeItem('cachedCtaDesc_fi');
            if (config.ctaDescSv) localStorage.setItem('cachedCtaDesc_sv', config.ctaDescSv);
            else localStorage.removeItem('cachedCtaDesc_sv');

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
