// Lưu thông tin liên hệ khách đã nhập (tên, SĐT, email, địa chỉ...) vào
// localStorage để tự điền sẵn cho lần đặt hàng / đặt bàn tiếp theo.
const KEY = 'pvk_customer_info';

export function saveCustomerInfo(info) {
    try {
        // Chỉ ghi đè các trường có giá trị — không xoá dữ liệu cũ bằng chuỗi rỗng
        const cleaned = Object.fromEntries(
            Object.entries(info || {}).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
        );
        if (Object.keys(cleaned).length === 0) return;
        const existing = JSON.parse(localStorage.getItem(KEY) || '{}');
        localStorage.setItem(KEY, JSON.stringify({ ...existing, ...cleaned }));
    } catch (e) {
        console.warn('Could not save customer info:', e);
    }
}

export function getCustomerInfo() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
        return {};
    }
}

// mapping: { 'input-element-id': 'savedFieldKey' } — chỉ điền vào ô đang trống
export function prefillFields(mapping) {
    const saved = getCustomerInfo();
    for (const [fieldId, key] of Object.entries(mapping)) {
        const el = document.getElementById(fieldId);
        if (el && !el.value && saved[key]) {
            el.value = saved[key];
        }
    }
}
