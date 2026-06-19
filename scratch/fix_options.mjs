import fs from 'fs';

const filePath = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js';
let content = fs.readFileSync(filePath, 'utf-8');

const startIndex = content.indexOf('async function addChoiceToOptionGroup');
const endIndex = content.indexOf('async function updateChoiceInOptionGroup');

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `async function addChoiceToOptionGroup(dishId, optionName, choiceLabelVi, choiceLabelEn, choiceLabelFi, choiceLabelSv, choicePrice) {
        try {
            const snap = await getDoc(doc(db, "menu", dishId));
            if (!snap.exists()) return { error: "Không tìm thấy món." };
            let updated = false;
            const price = parseFloat(choicePrice) || 0;
            const options = (snap.data().options || []).map(opt => {
                if ([opt.id, opt.name, opt.nameVi, opt.nameEn, opt.nameFi, opt.nameSv].some(n => (n||'').toLowerCase() === String(optionName||'').toLowerCase())) {
                    if (!opt.choices) opt.choices = [];
                    opt.choices.push({
                        label: choiceLabelEn || choiceLabelVi || choiceLabelSv || '',
                        labelVi: choiceLabelVi || '',
                        labelEn: choiceLabelEn || choiceLabelVi || '',
                        labelFi: choiceLabelFi || choiceLabelVi || '',
                        labelSv: choiceLabelSv || choiceLabelVi || '',
                        price: price
                    });
                    updated = true;
                }
                return opt;
            });
            if (!updated) return { error: "Không tìm thấy nhóm option." };
            await updateDoc(doc(db, "menu", dishId), { options });
            if (window.loadFood) window.loadFood();
            return { success: true, message: \`Đã thêm lựa chọn.\` };
        } catch (e) { return { error: e.message }; }
    }

    async function removeChoiceFromOptionGroup(dishId, optionName, choiceLabel) {
        try {
            const snap = await getDoc(doc(db, "menu", dishId));
            if (!snap.exists()) return { error: "Không tìm thấy món." };
            let updated = false;
            const options = (snap.data().options || []).map(opt => {
                if ([opt.id, opt.name, opt.nameVi, opt.nameEn, opt.nameFi, opt.nameSv].some(n => (n||'').toLowerCase() === String(optionName||'').toLowerCase())) {
                    if (!opt.choices) opt.choices = [];
                    const origLen = opt.choices.length;
                    opt.choices = opt.choices.filter(c => ![c.label, c.labelVi, c.labelEn, c.labelFi, c.labelSv].some(l => (l||'').toLowerCase() === String(choiceLabel||'').toLowerCase()));
                    if (opt.choices.length < origLen) updated = true;
                }
                return opt;
            });
            if (!updated) return { error: "Không tìm thấy." };
            await updateDoc(doc(db, "menu", dishId), { options });
            if (window.loadFood) window.loadFood();
            return { success: true, message: \`Đã xoá lựa chọn.\` };
        } catch (e) { return { error: e.message }; }
    }

    async function updateMenuOptionGroup(dishId, oldOptionName, newOptionNameVi, newOptionNameEn, newOptionNameFi, newOptionNameSv, newOptionType) {
        try {
            const snap = await getDoc(doc(db, "menu", dishId));
            if (!snap.exists()) return { error: "Không tìm thấy món." };
            let updated = false;
            const options = (snap.data().options || []).map(opt => {
                if ([opt.id, opt.name, opt.nameVi, opt.nameEn, opt.nameFi, opt.nameSv].some(n => (n||'').toLowerCase() === String(oldOptionName||'').toLowerCase())) {
                    if (newOptionNameVi !== undefined) { opt.nameVi = newOptionNameVi; opt.name = newOptionNameVi; }
                    if (newOptionNameEn !== undefined) { opt.nameEn = newOptionNameEn; opt.name = newOptionNameEn; }
                    if (newOptionNameFi !== undefined) opt.nameFi = newOptionNameFi;
                    if (newOptionNameSv !== undefined) opt.nameSv = newOptionNameSv;
                    if (newOptionType !== undefined) opt.type = newOptionType;
                    updated = true;
                }
                return opt;
            });
            if (!updated) return { error: "Không tìm thấy nhóm option." };
            await updateDoc(doc(db, "menu", dishId), { options });
            if (window.loadFood) window.loadFood();
            return { success: true, message: \`Đã cập nhật nhóm option.\` };
        } catch (e) { return { error: e.message }; }
    }

    `;
    const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log("Replaced successfully");
} else {
    console.log("Could not find start or end index");
}
