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
            if (config.heroBgUrl) {
                localStorage.setItem('cachedHeroBg', config.heroBgUrl);
                const heroBg = document.getElementById('hero-bg');
                if (heroBg) heroBg.src = config.heroBgUrl;
            }
            if (config.heroTitleVi) {
                localStorage.setItem('cachedHeroTitle', config.heroTitleVi);
                const titleElem = document.getElementById('hero-title');
                if (titleElem) {
                    titleElem.textContent = config.heroTitleVi;
                }
            }
            if (config.heroDescVi) {
                localStorage.setItem('cachedHeroDesc', config.heroDescVi);
                const descElem = document.getElementById('hero-desc');
                if (descElem) {
                    descElem.textContent = config.heroDescVi;
                }
            }
            if (config.signatureTitleVi) {
                localStorage.setItem('cachedSignatureTitle', config.signatureTitleVi);
                const sigTitleElem = document.getElementById('signature-title');
                if (sigTitleElem) sigTitleElem.textContent = config.signatureTitleVi;
            }
            if (config.signatureDescVi) {
                localStorage.setItem('cachedSignatureDesc', config.signatureDescVi);
                const sigDescElem = document.getElementById('signature-desc');
                if (sigDescElem) sigDescElem.textContent = config.signatureDescVi;
            }

            // Apply config to Story
            if (config.storyImg) {
                localStorage.setItem('cachedStoryImg', config.storyImg);
                const storyImgElem = document.getElementById('story-img');
                if (storyImgElem) storyImgElem.src = config.storyImg;
            }
            if (config.storyLabelVi) {
                localStorage.setItem('cachedStoryLabel', config.storyLabelVi);
                const storyLabelElem = document.getElementById('story-label');
                if (storyLabelElem) storyLabelElem.textContent = config.storyLabelVi;
            }
            if (config.storyTitleVi) {
                localStorage.setItem('cachedStoryTitle', config.storyTitleVi);
                const storyTitleElem = document.getElementById('story-title');
                if (storyTitleElem) storyTitleElem.textContent = config.storyTitleVi;
            }
            if (config.storyP1Vi) {
                localStorage.setItem('cachedStoryP1', config.storyP1Vi);
                const storyP1Elem = document.getElementById('story-p1');
                if (storyP1Elem) storyP1Elem.textContent = config.storyP1Vi;
            }
            if (config.storyP2Vi) {
                localStorage.setItem('cachedStoryP2', config.storyP2Vi);
                const storyP2Elem = document.getElementById('story-p2');
                if (storyP2Elem) storyP2Elem.textContent = config.storyP2Vi;
            }

            // Apply config to CTA
            if (config.ctaTitleVi) {
                localStorage.setItem('cachedCtaTitle', config.ctaTitleVi);
                const ctaTitleElem = document.getElementById('cta-title');
                if (ctaTitleElem) ctaTitleElem.textContent = config.ctaTitleVi;
            }
            if (config.ctaDescVi) {
                localStorage.setItem('cachedCtaDesc', config.ctaDescVi);
                const ctaDescElem = document.getElementById('cta-desc');
                if (ctaDescElem) ctaDescElem.textContent = config.ctaDescVi;
            }
        }

        // Apply config to Signatures
        const sigContainer = document.getElementById('signature-container');
        if (sigContainer && config && config.signatureDishIds && config.signatureDishIds.length > 0) {
            sigContainer.innerHTML = '<div class="col-span-full text-center py-10"><span class="material-symbols-outlined animate-spin text-4xl">sync</span></div>';
            
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

            if (dishes.length > 0) {
                let html = '';
                dishes.forEach((dish, index) => {
                    const name = dish.nameVi || dish.name || '';
                    const desc = dish.descVi || dish.description || '';
                    const img = dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
                    
                    if (index === 0) {
                        // Large Card
                        html += `
                        <div class="md:col-span-2 md:row-span-2 bg-surface/90 backdrop-blur-sm rounded-DEFAULT border-2 border-primary shadow-md shadow-primary/10 overflow-hidden group">
                            <div class="relative h-full overflow-hidden">
                                <img alt="${name}" class="w-full h-[300px] md:h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${img}"/>
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div class="absolute bottom-0 left-0 p-8">
                                    <h3 class="font-title-lg text-3xl font-bold text-white mb-2 drop-shadow-md">${name}</h3>
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
                                <h3 class="font-title-lg text-title-lg text-primary-container mb-2 line-clamp-1">${name}</h3>
                                <p class="font-body-sm text-body-sm text-secondary line-clamp-2">${desc}</p>
                            </div>
                        </div>`;
                    }
                });
                sigContainer.innerHTML = html;
            } else {
                sigContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">No signature dishes found.</div>';
            }
        }

    } catch (e) {
        console.error("Error loading homepage config", e);
    }
}

async function loadFeedbackMarquee() {
    const r1Container = document.getElementById('marquee-row-1');
    const r2Container = document.getElementById('marquee-row-2');
    if (!r1Container || !r2Container) return;

    try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        
        let feedbacks = [];
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            feedbacks.push({
                name: data.name || "Anonymous",
                message: data.message || "",
                loc: /Easton/i.test(data.message) ? "Easton Helsinki" : "Pengerkatu",
                rating: 5
            });
        });

        if (feedbacks.length === 0) {
            feedbacks = [
                { name: "Minh Anh", loc: "Pengerkatu", message: "Phở tái lăn ở đây chuẩn vị Hà Nội, nước dùng đậm đà thơm nức mũi tỏi. Ăn một lần là nghiền luôn!", rating: 5 },
                { name: "Mikko S.", loc: "Easton Helsinki", message: "Helsingin paras pho-keitto! Pengerkadun viihtyisä tunnelma on ihana ja ystävällinen palvelu.", rating: 5 }
            ];
        }

        function makeCard(r) {
            const initial = r.name.charAt(0);
            const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
            return `
                <div class="w-[350px] shrink-0 bg-surface/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-primary-container/40">
                    <div>
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-lg">${initial}</div>
                            <div>
                                <h4 class="font-bold text-white text-sm">${r.name}</h4>
                                <span class="text-xs text-secondary">${r.loc}</span>
                            </div>
                        </div>
                        <div class="text-yellow-400 text-sm mb-3">${stars}</div>
                        <p class="text-gray-300 text-sm italic leading-relaxed">"${r.message}"</p>
                    </div>
                </div>
            `;
        }

        let row1HTML = "";
        let row2HTML = "";
        
        const half = Math.ceil(feedbacks.length / 2);
        const row1Source = feedbacks.slice(0, half);
        const row2Source = feedbacks.slice(half);

        // Repeat 3 times to make it long enough for seamless infinite scroll
        for (let i = 0; i < 3; i++) {
            row1Source.forEach(r => {
                row1HTML += makeCard(r);
            });
            row2Source.forEach(r => {
                row2HTML += makeCard(r);
            });
        }

        r1Container.innerHTML = row1HTML;
        r2Container.innerHTML = row2HTML;

    } catch (e) {
        console.error("Error loading feedback marquee:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHomepage();
    loadFeedbackMarquee();
});
