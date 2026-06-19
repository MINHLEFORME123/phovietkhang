import fs from 'fs';

const filePath = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin.js';
let content = fs.readFileSync(filePath, 'utf-8');

const startTag = 'async function addMenuOptionGroup(dishId, optionNameVi, optionNameEn, optionNameFi, optionType, choices) {';
const endTag = 'async function updateMenuName(dishId, nameVi, nameEn, nameFi) {';

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `async function addMenuOptionGroup(dishId, optionNameVi, optionNameEn, optionNameFi, optionType, choices) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };

            const nameVi = optionNameVi || '';
            const nameEn = optionNameEn || nameVi;
            const nameFi = optionNameFi || nameVi;

            const options = normalizeOptions(targetDoc.options || []);
            // Check if group already exists in any language
            const exists = options.some(opt =>
                (opt.nameVi || '').toLowerCase() === nameVi.toLowerCase() ||
                (opt.nameEn || '').toLowerCase() === nameEn.toLowerCase()
            );
            if (exists) return { error: \`Nhóm option "\${nameVi}" đã tồn tại.\` };

            const groupId = "opt_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

            options.push({
                id: groupId,
                name: nameEn,
                nameVi: nameVi,
                nameEn: nameEn,
                nameFi: nameFi,
                type: optionType || 'toggle',
                choices: Array.isArray(choices) ? choices.map(c => {
                    const lVi = c.labelVi || c.label || '';
                    const lEn = c.labelEn || c.label || lVi;
                    const lFi = c.labelFi || c.label || lVi;
                    return {
                        label: lEn,
                        labelVi: lVi,
                        labelEn: lEn,
                        labelFi: lFi,
                        price: parseFloat(c.price) || 0
                    };
                }) : []
            });

            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: \`Đã thêm nhóm option "\${nameVi}" thành công với ID: \${groupId}. BẠN CÓ THỂ SỬ DỤNG ID NÀY (thay vì tên) để thêm lựa chọn (lệnh 6C).\`, groupId: groupId };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function removeMenuOptionGroup(dishId, optionName) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };

            const options = normalizeOptions(targetDoc.options || []);
            const originalLength = options.length;
            const updatedOptions = options.filter(opt => {
                const matchesOpt = (opt.id || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                return !matchesOpt;
            });

            if (originalLength === updatedOptions.length) {
                return { error: \`Không tìm thấy nhóm option "\${optionName}".\` };
            }

            await updateDoc(docRef, { options: updatedOptions });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: \`Đã xoá nhóm option "\${optionName}" thành công.\` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function addChoiceToOptionGroup(dishId, optionName, choiceLabelVi, choiceLabelEn, choiceLabelFi, choicePrice) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };

            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.id || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                if (matchesOpt) {
                    if (!opt.choices) opt.choices = [];
                    const lVi = choiceLabelVi || '';
                    const lEn = choiceLabelEn || lVi;
                    const lFi = choiceLabelFi || lVi;

                    // Check if choice already exists in any language
                    const exists = opt.choices.some(c =>
                        (c.label || '').toLowerCase() === lEn.toLowerCase() ||
                        (c.labelVi || '').toLowerCase() === lVi.toLowerCase()
                    );
                    if (!exists) {
                        opt.choices.push({
                            label: lEn,
                            labelVi: lVi,
                            labelEn: lEn,
                            labelFi: lFi,
                            price: parseFloat(choicePrice) || 0
                        });
                        updated = true;
                    }
                }
                return opt;
            });

            if (!updated) return { error: \`Nhóm option "\${optionName}" không tồn tại hoặc lựa chọn "\${choiceLabelVi}" đã có sẵn.\` };

            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: \`Đã thêm lựa chọn "\${choiceLabelVi}" vào nhóm "\${optionName}" thành công.\` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function removeChoiceFromOptionGroup(dishId, optionName, choiceLabel) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };

            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.id || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                if (matchesOpt) {
                    if (!opt.choices) opt.choices = [];
                    const originalLength = opt.choices.length;
                    opt.choices = opt.choices.filter(c => {
                        const matchesChoice = (c.label || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelVi || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelEn || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelFi || '').toLowerCase() === choiceLabel.toLowerCase();
                        return !matchesChoice;
                    });
                    if (opt.choices.length < originalLength) {
                        updated = true;
                    }
                }
                return opt;
            });

            if (!updated) return { error: \`Không tìm thấy nhóm "\${optionName}" hoặc lựa chọn "\${choiceLabel}".\` };

            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: \`Đã xoá lựa chọn "\${choiceLabel}" khỏi nhóm "\${optionName}" thành công.\` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuOptionGroup(dishId, oldOptionName, newOptionNameVi, newOptionNameEn, newOptionNameFi, newOptionType) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };

            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.id || '').toLowerCase() === oldOptionName.toLowerCase() ||
                                   (opt.name || '').toLowerCase() === oldOptionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === oldOptionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === oldOptionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === oldOptionName.toLowerCase();
                if (matchesOpt) {
                    if (newOptionNameVi) opt.nameVi = newOptionNameVi;
                    if (newOptionNameEn) {
                        opt.nameEn = newOptionNameEn;
                        opt.name = newOptionNameEn;
                    }
                    if (newOptionNameFi) opt.nameFi = newOptionNameFi;
                    if (newOptionType) opt.type = newOptionType;
                    updated = true;
                }
                return opt;
            });

            if (!updated) return { error: \`Không tìm thấy nhóm option "\${oldOptionName}".\` };

            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: \`Đã cập nhật nhóm option "\${oldOptionName}" thành công.\` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateChoiceInOptionGroup(dishId, optionName, oldChoiceLabel, newChoiceLabelVi, newChoiceLabelEn, newChoiceLabelFi, newChoicePrice) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };

            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.id || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                if (matchesOpt) {
                    if (!opt.choices) opt.choices = [];
                    opt.choices = opt.choices.map(c => {
                        const matchesChoice = (c.label || '').toLowerCase() === oldChoiceLabel.toLowerCase() ||
                                              (c.labelVi || '').toLowerCase() === oldChoiceLabel.toLowerCase() ||
                                              (c.labelEn || '').toLowerCase() === oldChoiceLabel.toLowerCase() ||
                                              (c.labelFi || '').toLowerCase() === oldChoiceLabel.toLowerCase();
                        if (matchesChoice) {
                            if (newChoiceLabelVi) c.labelVi = newChoiceLabelVi;
                            if (newChoiceLabelEn) {
                                c.labelEn = newChoiceLabelEn;
                                c.label = newChoiceLabelEn;
                            }
                            if (newChoiceLabelFi) c.labelFi = newChoiceLabelFi;
                            if (newChoicePrice !== undefined && newChoicePrice !== null) c.price = parseFloat(newChoicePrice);
                            updated = true;
                        }
                        return c;
                    });
                }
                return opt;
            });

            if (!updated) return { error: \`Không tìm thấy lựa chọn "\${oldChoiceLabel}" trong nhóm "\${optionName}".\` };

            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: \`Đã cập nhật lựa chọn "\${oldChoiceLabel}" thành công.\` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    `;
    const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log("Replaced js/admin.js successfully");
} else {
    console.log("Could not find start or end index in js/admin.js");
}
