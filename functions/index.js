const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// ─── CORS helper ───────────────────────────────────────────────────────────────
// All callable functions use the Firebase SDK which handles CORS automatically.

// ─── AUTH HELPER ────────────────────────────────────────────────────────────────
async function assertAdmin(context) {
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "Bạn chưa đăng nhập.");
    }
    const db = getFirestore();
    const userSnap = await db.collection("users").doc(context.auth.uid).get();
    if (!userSnap.exists || userSnap.data().role !== "admin") {
        throw new HttpsError("permission-denied", "Chỉ admin mới được thực hiện thao tác này.");
    }
}

// ─── 1. List all Firebase Auth users ────────────────────────────────────────────
exports.adminListAuthUsers = onCall(async (request) => {
    await assertAdmin(request);
    const auth = getAuth();
    const listResult = await auth.listUsers(1000);
    return listResult.users.map(u => ({
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || null,
        disabled: u.disabled,
        emailVerified: u.emailVerified,
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime,
        customClaims: u.customClaims || null
    }));
});

// ─── 2. Delete a Firebase Auth user (real delete, not just Firestore doc) ───────
exports.adminDeleteAuthUser = onCall(async (request) => {
    await assertAdmin(request);
    const { uid } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "Thiếu uid.");

    const auth = getAuth();
    const db = getFirestore();

    await auth.deleteUser(uid);
    // Also remove Firestore document if it exists
    try {
        await db.collection("users").doc(uid).delete();
    } catch (_) { /* Firestore doc may not exist, ignore */ }

    return { success: true, message: `Đã xoá hoàn toàn tài khoản ${uid} khỏi Firebase Auth và Firestore.` };
});

// ─── 3. Disable a Firebase Auth user ───────────────────────────────────────────
exports.adminDisableUser = onCall(async (request) => {
    await assertAdmin(request);
    const { uid } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "Thiếu uid.");
    await getAuth().updateUser(uid, { disabled: true });
    return { success: true, message: `Đã vô hiệu hoá tài khoản ${uid}.` };
});

// ─── 4. Enable a Firebase Auth user ────────────────────────────────────────────
exports.adminEnableUser = onCall(async (request) => {
    await assertAdmin(request);
    const { uid } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "Thiếu uid.");
    await getAuth().updateUser(uid, { disabled: false });
    return { success: true, message: `Đã kích hoạt lại tài khoản ${uid}.` };
});

// ─── 5. Change another user's password ─────────────────────────────────────────
exports.adminChangeUserPassword = onCall(async (request) => {
    await assertAdmin(request);
    const { uid, newPassword } = request.data;
    if (!uid || !newPassword) throw new HttpsError("invalid-argument", "Thiếu uid hoặc newPassword.");
    if (newPassword.length < 6) throw new HttpsError("invalid-argument", "Mật khẩu phải ít nhất 6 ký tự.");
    await getAuth().updateUser(uid, { password: newPassword });
    return { success: true, message: `Đã đổi mật khẩu cho tài khoản ${uid} thành công.` };
});

// ─── 6. Change another user's email ────────────────────────────────────────────
exports.adminChangeUserEmail = onCall(async (request) => {
    await assertAdmin(request);
    const { uid, newEmail } = request.data;
    if (!uid || !newEmail) throw new HttpsError("invalid-argument", "Thiếu uid hoặc newEmail.");
    const auth = getAuth();
    const db = getFirestore();
    await auth.updateUser(uid, { email: newEmail });
    // Sync to Firestore
    await db.collection("users").doc(uid).update({ email: newEmail });
    return { success: true, message: `Đã đổi email của ${uid} thành ${newEmail}.` };
});

// ─── 7. Force verify user's email ───────────────────────────────────────────────
exports.adminVerifyUserEmail = onCall(async (request) => {
    await assertAdmin(request);
    const { uid } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "Thiếu uid.");
    await getAuth().updateUser(uid, { emailVerified: true });
    return { success: true, message: `Đã xác thực email cho tài khoản ${uid}.` };
});

// ─── 8. Set custom claims (e.g. { admin: true }) ────────────────────────────────
exports.adminSetCustomClaims = onCall(async (request) => {
    await assertAdmin(request);
    const { uid, claims } = request.data;
    if (!uid || typeof claims !== "object") throw new HttpsError("invalid-argument", "Thiếu uid hoặc claims (object).");
    await getAuth().setCustomUserClaims(uid, claims);
    return { success: true, message: `Đã đặt custom claims cho ${uid}: ${JSON.stringify(claims)}.` };
});

// ─── 9. Get a single Firebase Auth user info ────────────────────────────────────
exports.adminGetUserInfo = onCall(async (request) => {
    await assertAdmin(request);
    const { uid, email } = request.data;
    const auth = getAuth();
    let userRecord;
    if (uid) {
        userRecord = await auth.getUser(uid);
    } else if (email) {
        userRecord = await auth.getUserByEmail(email);
    } else {
        throw new HttpsError("invalid-argument", "Cần truyền uid hoặc email.");
    }
    return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        disabled: userRecord.disabled,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastSignIn: userRecord.metadata.lastSignInTime,
        customClaims: userRecord.customClaims || null
    };
});

// ─── 10. Revoke user's refresh tokens (force logout everywhere) ──────────────────
exports.adminRevokeUserTokens = onCall(async (request) => {
    await assertAdmin(request);
    const { uid } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "Thiếu uid.");
    await getAuth().revokeRefreshTokens(uid);
    return { success: true, message: `Đã thu hồi toàn bộ session (buộc đăng xuất) của tài khoản ${uid}.` };
});

// ─── 11. Update display name ─────────────────────────────────────────────────────
exports.adminUpdateDisplayName = onCall(async (request) => {
    await assertAdmin(request);
    const { uid, displayName } = request.data;
    if (!uid || !displayName) throw new HttpsError("invalid-argument", "Thiếu uid hoặc displayName.");
    const auth = getAuth();
    const db = getFirestore();
    await auth.updateUser(uid, { displayName });
    await db.collection("users").doc(uid).update({ name: displayName });
    return { success: true, message: `Đã cập nhật tên hiển thị của ${uid} thành "${displayName}".` };
});

// ─── 12. Generate a custom sign-in token (for impersonation/testing) ────────────
exports.adminGenerateCustomToken = onCall(async (request) => {
    await assertAdmin(request);
    const { uid } = request.data;
    if (!uid) throw new HttpsError("invalid-argument", "Thiếu uid.");
    const token = await getAuth().createCustomToken(uid);
    return { success: true, customToken: token, message: `Đã tạo custom token cho ${uid}. Sử dụng token này để đăng nhập thủ công nếu cần.` };
});
