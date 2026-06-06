import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let cachedConfig = null;

async function loadHomepage() {
    try {
        const docRef = doc(db, "config", "homepage");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            cachedConfig = docSnap.data();
        }

        await applyHomepageConfigAndSignatures();

    } catch (e) {
        console.error("Error loading homepage config", e);
    }
}

async function applyHomepageConfigAndSignatures() {
    if (!cachedConfig) return;
    
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    
    // Helper to get localized string or undefined
    const getVal = (keyBase) => {
        const key = `${keyBase}${lang.charAt(0).toUpperCase() + lang.slice(1)}`; // e.g. heroTitleEn, heroTitleFi
        return cachedConfig[key] || (lang === 'vi' ? cachedConfig[`${keyBase}Vi`] : undefined);
    };

    // Hero
    if (cachedConfig.heroBgUrl) {
        localStorage.setItem('cachedHeroBg', cachedConfig.heroBgUrl);
        const heroBg = document.getElementById('hero-bg');
        if (heroBg) heroBg.src = cachedConfig.heroBgUrl;
    }
    
    const heroTitle = getVal('heroTitle');
    if (heroTitle) {
        localStorage.setItem('cachedHeroTitle', heroTitle);
        const titleElem = document.getElementById('hero-title');
        if (titleElem) titleElem.textContent = heroTitle;
    }
    const heroDesc = getVal('heroDesc');
    if (heroDesc) {
        localStorage.setItem('cachedHeroDesc', heroDesc);
        const descElem = document.getElementById('hero-desc');
        if (descElem) descElem.textContent = heroDesc;
    }

    // Signature Text
    const signatureTitle = getVal('signatureTitle');
    if (signatureTitle) {
        localStorage.setItem('cachedSignatureTitle', signatureTitle);
        const sigTitleElem = document.getElementById('signature-title');
        if (sigTitleElem) sigTitleElem.textContent = signatureTitle;
    }
    const signatureDesc = getVal('signatureDesc');
    if (signatureDesc) {
        localStorage.setItem('cachedSignatureDesc', signatureDesc);
        const sigDescElem = document.getElementById('signature-desc');
        if (sigDescElem) sigDescElem.textContent = signatureDesc;
    }

    // Story
    if (cachedConfig.storyImg) {
        localStorage.setItem('cachedStoryImg', cachedConfig.storyImg);
        const storyImgElem = document.getElementById('story-img');
        if (storyImgElem) storyImgElem.src = cachedConfig.storyImg;
    }
    const storyLabel = getVal('storyLabel');
    if (storyLabel) {
        localStorage.setItem('cachedStoryLabel', storyLabel);
        const storyLabelElem = document.getElementById('story-label');
        if (storyLabelElem) storyLabelElem.textContent = storyLabel;
    }
    const storyTitle = getVal('storyTitle');
    if (storyTitle) {
        localStorage.setItem('cachedStoryTitle', storyTitle);
        const storyTitleElem = document.getElementById('story-title');
        if (storyTitleElem) storyTitleElem.textContent = storyTitle;
    }
    const storyP1 = getVal('storyP1');
    if (storyP1) {
        localStorage.setItem('cachedStoryP1', storyP1);
        const storyP1Elem = document.getElementById('story-p1');
        if (storyP1Elem) storyP1Elem.textContent = storyP1;
    }
    const storyP2 = getVal('storyP2');
    if (storyP2) {
        localStorage.setItem('cachedStoryP2', storyP2);
        const storyP2Elem = document.getElementById('story-p2');
        if (storyP2Elem) storyP2Elem.textContent = storyP2;
    }

    // CTA
    const ctaTitle = getVal('ctaTitle');
    if (ctaTitle) {
        localStorage.setItem('cachedCtaTitle', ctaTitle);
        const ctaTitleElem = document.getElementById('cta-title');
        if (ctaTitleElem) ctaTitleElem.textContent = ctaTitle;
    }
    const ctaDesc = getVal('ctaDesc');
    if (ctaDesc) {
        localStorage.setItem('cachedCtaDesc', ctaDesc);
        const ctaDescElem = document.getElementById('cta-desc');
        if (ctaDescElem) ctaDescElem.textContent = ctaDesc;
    }

    // Signatures rendering
    const sigContainer = document.getElementById('signature-container');
    if (sigContainer && cachedConfig.signatureDishIds && cachedConfig.signatureDishIds.length > 0) {
        // Fetch matching dishes
        const dishes = [];
        for (const id of cachedConfig.signatureDishIds) {
            try {
                const dishSnap = await getDoc(doc(db, "menu", id));
                if (dishSnap.exists()) {
                    dishes.push({ id: dishSnap.id, ...dishSnap.data() });
                }
            } catch(e) {}
        }

        if (dishes.length > 0) {
            let html = '';
            dishes.forEach((dish, index) => {
                const nameVi = dish.nameVi || dish.name || '';
                const nameEn = dish.nameEn || nameVi;
                const nameFi = dish.nameFi || nameVi;
                const displayName = lang === 'vi' ? nameVi : (lang === 'fi' ? nameFi : nameEn);

                const descVi = dish.descVi || dish.description || '';
                const descEn = dish.descEn || descVi;
                const descFi = dish.descFi || descVi;
                const displayDesc = lang === 'vi' ? descVi : (lang === 'fi' ? descFi : descEn);

                const img = dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                
                if (index === 0) {
                    // Large Card
                    html += `
                    <div class="md:col-span-2 md:row-span-2 bg-surface/90 backdrop-blur-sm rounded-DEFAULT border border-outline-variant overflow-hidden group">
                        <div class="relative h-full overflow-hidden">
                            <img alt="${displayName}" class="w-full h-[300px] md:h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${img}"/>
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div class="absolute bottom-0 left-0 p-8">
                                <h3 class="font-title-lg text-3xl font-bold text-white mb-2 drop-shadow-md dynamic-name" data-vi="${nameVi}" data-en="${nameEn}" data-fi="${nameFi}">${displayName}</h3>
                                <p class="font-body-sm text-body-sm text-gray-200 drop-shadow dynamic-desc" data-vi="${descVi}" data-en="${descEn}" data-fi="${descFi}">${displayDesc}</p>
                            </div>
                        </div>
                    </div>`;
                } else {
                    // Small Card
                    html += `
                    <div class="md:col-span-1 bg-surface/90 backdrop-blur-sm rounded-DEFAULT border border-outline-variant overflow-hidden group flex flex-col h-full">
                        <div class="relative h-48 overflow-hidden shrink-0">
                            <img alt="${displayName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${img}"/>
                        </div>
                        <div class="p-6 flex-1 flex flex-col">
                            <h3 class="font-title-lg text-title-lg text-primary-container mb-2 line-clamp-1 dynamic-name" data-vi="${nameVi}" data-en="${nameEn}" data-fi="${nameFi}">${displayName}</h3>
                            <p class="font-body-sm text-body-sm text-secondary line-clamp-2 dynamic-desc" data-vi="${descVi}" data-en="${descEn}" data-fi="${descFi}">${displayDesc}</p>
                        </div>
                    </div>`;
                }
            });
            sigContainer.innerHTML = html;
        } else {
            sigContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">No signature dishes found.</div>';
        }
    }
}

window.addEventListener('languageChanged', () => {
    applyHomepageConfigAndSignatures();
});

document.addEventListener('DOMContentLoaded', () => {
    loadHomepage();
});
