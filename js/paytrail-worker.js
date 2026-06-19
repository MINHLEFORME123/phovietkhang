/**
 * Cloudflare Worker — Firebase Admin Proxy + Paytrail Gateway for Phở Việt Khang
 *
 * HOW TO DEPLOY:
 * 1. Go to https://dash.cloudflare.com/ → Workers & Pages → Create Application → Create Worker
 * 2. Name it: pvk-admin
 * 3. Paste this entire file content
 * 4. Go to Worker Settings → Variables & Secrets → Add ALL of the following:
 *    - FIREBASE_PRIVATE_KEY         (full PEM string from service account JSON)
 *    - FIREBASE_PRIVATE_KEY_ID      (from service account JSON)
 *    - FIREBASE_SERVICE_ACCOUNT_EMAIL (from service account JSON)
 *    - ADMIN_SECRET                 (strong random string, 32+ chars)
 *    - RESEND_API_KEY               (your Resend API key)
 *    - PAYTRAIL_MERCHANT_ID         (e.g. 375917)
 *    - PAYTRAIL_SECRET              (your Paytrail secret key)
 * 5. Click Save and Deploy
 * 6. Copy the Worker URL (e.g. https://pvk-admin.YOUR_NAME.workers.dev)
 * 7. IMPORTANT: Set workerSecret in Firestore doc "config/apiKeys" to match ADMIN_SECRET
 *
 * IMPORTANT: NEVER hardcode secrets in this file. Always use Environment Variables.
 */

// ─── Firebase Project Config (non-secret, safe to hardcode) ───────────────────
const FIREBASE_PROJECT_ID = 'phovietkhang';

// ─── Allowed Origins (CORS whitelist) ─────────────────────────────────────────
const ALLOWED_ORIGINS = [
    'https://phovietkhang.com',
    'https://www.phovietkhang.com',
    'https://phovietkhang.web.app',
    'https://phovietkhang.firebaseapp.com',
];

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
    };
}

function json(data, status = 200, request = null) {
    const cors = request ? getCorsHeaders(request) : { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0] };
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
    });
}

// =============================================================================
// PAYTRAIL GATEWAY
// =============================================================================

const PAYTRAIL_GROUPS = {
  online_banking_fi: ['bank'],
  mobilepay: ['mobile'],
  bank_card: ['creditcard'],
};

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function hmacSha256(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function paytrailSignature(secret, params, body) {
  const headers = ['checkout-account', 'checkout-algorithm', 'checkout-method', 'checkout-nonce', 'checkout-timestamp'];
  const signing = headers.map(h => `${h}:${params[h]}`).join('\n') + '\n' + body;
  return hmacSha256(secret, signing);
}

async function handlePaytrailPayment(env, orderData) {
  const merchantId = env.PAYTRAIL_MERCHANT_ID;
  const secret = env.PAYTRAIL_SECRET;

  if (!merchantId || !secret) {
    throw new Error('Paytrail credentials not configured. Set PAYTRAIL_MERCHANT_ID and PAYTRAIL_SECRET in Worker Settings.');
  }

  const baseUrl = 'https://phovietkhang.onrender.com';

  const stamp = `${orderData.id}_${Date.now()}`;
  const lang = orderData.language === 'fi' ? 'FI' : 'EN';
  const methodGroup = PAYTRAIL_GROUPS[orderData.paymentMethod];

  const items = (orderData.items || []).map((item, i) => ({
    unitPrice: Math.round((item.price || 0) * 100),
    units: item.qty || 1,
    vatPercentage: 13.5,
    productCode: item.id || `item_${i}`,
    description: item.name || 'Item',
  }));
  if (orderData.deliveryFee > 0) {
    items.push({
      unitPrice: Math.round(orderData.deliveryFee * 100),
      units: 1,
      vatPercentage: 25.5,
      productCode: 'delivery',
      description: 'Delivery fee',
    });
  }
  if (orderData.discountAmount > 0) {
    items.push({
      unitPrice: -Math.round(orderData.discountAmount * 100),
      units: 1,
      vatPercentage: 13.5,
      productCode: 'discount',
      description: 'Discount',
    });
  }

  const amount = items.reduce((sum, item) => sum + item.unitPrice * item.units, 0);

  const payload = {
    stamp,
    reference: orderData.id.slice(0, 20),
    amount,
    currency: 'EUR',
    language: lang,
    ...(methodGroup && { groups: methodGroup }),
    customer: {
      email: orderData.customerEmail,
      firstName: (orderData.customerName || '').split(' ')[0] || '',
      lastName: (orderData.customerName || '').split(' ').slice(1).join(' ') || '',
      phone: orderData.customerPhone || '',
    },
    redirectUrls: {
      success: `${baseUrl}/order-tracking?orderId=${orderData.id}`,
      cancel: `${baseUrl}/cart`,
    },
    callbackUrls: {
      success: `${baseUrl}/api/paytrail-callback`,
      cancel: `${baseUrl}/api/paytrail-callback`,
    },
    items,
  };

  const body = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const nonce = uuidv4();

  const signature = await paytrailSignature(secret, {
    'checkout-account': merchantId,
    'checkout-algorithm': 'sha256',
    'checkout-method': 'POST',
    'checkout-nonce': nonce,
    'checkout-timestamp': timestamp,
  }, body);

  const response = await fetch('https://services.paytrail.com/payments', {
    method: 'POST',
    headers: {
      'checkout-account': merchantId,
      'checkout-algorithm': 'sha256',
      'checkout-method': 'POST',
      'checkout-nonce': nonce,
      'checkout-timestamp': timestamp,
      'signature': signature,
      'Content-Type': 'application/json',
    },
    body,
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Paytrail returned HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  return { transactionId: data.transactionId, checkoutUrl: data.href };
}

// =============================================================================
// JWT / ACCESS TOKEN HELPERS
// =============================================================================

function b64url(data) {
    let s;
    if (typeof data === 'string') {
        s = btoa(unescape(encodeURIComponent(data)));
    } else {
        s = btoa(String.fromCharCode(...new Uint8Array(data)));
    }
    return s.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function importPKCS8(pem) {
    const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
    const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return crypto.subtle.importKey('pkcs8', der.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

let _token = null, _tokenExp = 0;
async function getAccessToken(env) {
    if (_token && Date.now() < _tokenExp) return _token;

    const serviceAccountEmail = env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
    const privateKeyId = env.FIREBASE_PRIVATE_KEY_ID;
    const privateKeyPem = env.FIREBASE_PRIVATE_KEY;

    if (!serviceAccountEmail || !privateKeyPem) {
        throw new Error('Missing Firebase service account environment variables.');
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid: privateKeyId };
    const payload = {
        iss: serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now, exp: now + 3600,
    };

    const h = b64url(JSON.stringify(header));
    const p = b64url(JSON.stringify(payload));
    const msg = `${h}.${p}`;
    const key = await importPKCS8(privateKeyPem);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(msg));
    const jwt = `${msg}.${b64url(sig)}`;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const data = await resp.json();
    if (!data.access_token) throw new Error('Access token error: ' + JSON.stringify(data));

    _token = data.access_token;
    _tokenExp = Date.now() + (data.expires_in - 120) * 1000;
    return _token;
}

// =============================================================================
// IDENTITY TOOLKIT HELPERS
// =============================================================================

const IT = `https://identitytoolkit.googleapis.com/v1`;

async function itPost(env, path, body) {
    const tok = await getAccessToken(env);
    const url = path.startsWith('http') ? path : `${IT}${path}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const text = await r.text();
    let d; try { d = JSON.parse(text); } catch { d = { raw: text }; }
    if (!r.ok) throw new Error(d?.error?.message || text);
    return d;
}

// =============================================================================
// ADMIN ACTIONS
// =============================================================================

async function listAuthUsers(env) {
    let all = [], nextPageToken = '';
    do {
        const body = { maxResults: 1000 };
        if (nextPageToken) body.nextPageToken = nextPageToken;
        const res = await itPost(env, `/projects/${FIREBASE_PROJECT_ID}/accounts:batchGet`, body);
        if (res.users) {
            all = all.concat(res.users.map(u => ({
                uid: u.localId,
                email: u.email || null,
                displayName: u.displayName || null,
                disabled: u.disabled || false,
                emailVerified: u.emailVerified || false,
                createdAt: u.createdAt ? new Date(+u.createdAt).toISOString() : null,
                lastSignIn: u.lastLoginAt ? new Date(+u.lastLoginAt).toISOString() : null,
            })));
        }
        nextPageToken = res.nextPageToken || '';
    } while (nextPageToken);
    return all;
}

async function deleteAuthUser(env, uid) {
    await itPost(env, '/accounts:delete', { localId: uid });
    return { success: true, message: `Đã xoá hoàn toàn tài khoản Firebase Auth: ${uid}` };
}

async function disableUser(env, uid) {
    await itPost(env, '/accounts:update', { localId: uid, disableUser: true });
    return { success: true, message: `Đã vô hiệu hoá tài khoản: ${uid}` };
}

async function enableUser(env, uid) {
    await itPost(env, '/accounts:update', { localId: uid, disableUser: false });
    return { success: true, message: `Đã kích hoạt lại tài khoản: ${uid}` };
}

async function changeUserPassword(env, uid, newPassword) {
    if (!newPassword || newPassword.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    await itPost(env, '/accounts:update', { localId: uid, password: newPassword });
    return { success: true, message: `Đã đổi mật khẩu cho tài khoản: ${uid}` };
}

async function changeUserEmail(env, uid, newEmail) {
    await itPost(env, '/accounts:update', { localId: uid, email: newEmail });
    return { success: true, message: `Đã đổi email của ${uid} thành ${newEmail}` };
}

async function verifyUserEmail(env, uid) {
    await itPost(env, '/accounts:update', { localId: uid, emailVerified: true });
    return { success: true, message: `Đã xác thực email cho tài khoản: ${uid}` };
}

async function getUserInfo(env, uid, email) {
    const body = uid ? { localId: [uid] } : email ? { email: [email] } : null;
    if (!body) throw new Error('Cần uid hoặc email.');
    const res = await itPost(env, '/accounts:lookup', body);
    const u = res.users?.[0];
    if (!u) throw new Error('Không tìm thấy user.');
    return {
        uid: u.localId, email: u.email, displayName: u.displayName,
        disabled: u.disabled || false, emailVerified: u.emailVerified || false,
        createdAt: u.createdAt ? new Date(+u.createdAt).toISOString() : null,
        lastSignIn: u.lastLoginAt ? new Date(+u.lastLoginAt).toISOString() : null,
    };
}

async function updateDisplayName(env, uid, displayName) {
    await itPost(env, '/accounts:update', { localId: uid, displayName });
    return { success: true, message: `Đã cập nhật tên hiển thị của ${uid} thành "${displayName}"` };
}

async function revokeUserTokens(env, uid) {
    const validSince = String(Math.floor(Date.now() / 1000));
    await itPost(env, '/accounts:update', { localId: uid, validSince });
    return { success: true, message: `Đã thu hồi tất cả session (buộc đăng xuất) của: ${uid}` };
}

async function setCustomClaims(uid, claims) {
    return { 
        success: false, 
        message: 'Custom claims cần Firebase Admin SDK. Hãy dùng Firebase Console → Authentication → Users để set claims thủ công.',
    };
}

async function webSearch(query) {
    if (!query) throw new Error('Search query is required');
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
    const html = await response.text();
    const results = [];
    const titleRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    
    let titleMatch, snippetMatch;
    let count = 0;
    
    while (count < 8) {
        titleMatch = titleRegex.exec(html);
        snippetMatch = snippetRegex.exec(html);
        if (!titleMatch) break;
        
        let url = titleMatch[1];
        if (url.includes('uddg=')) {
            const uddg = url.split('uddg=')[1];
            if (uddg) url = decodeURIComponent(uddg.split('&')[0]);
        }
        
        const title = titleMatch[2].replace(/<[^>]+>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
        results.push({ title, url, snippet });
        count++;
    }
    
    if (results.length === 0) {
        let text = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return { query, rawFallback: text.substring(0, 3000) };
    }
    return { query, results };
}

async function browseWebUrl(url) {
    if (!url) throw new Error('URL is required');
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
    
    const response = await fetch(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    const html = await response.text();
    
    let text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
    if (text.length > 6000) text = text.substring(0, 6000) + '... (nội dung đã được rút ngắn)';
    return { url: targetUrl, content: text };
}

async function sendEmailNotification(env, to, subject, html) {
    if (!to || !subject || !html) throw new Error("Missing parameters: to, subject, or html");
    
    const key = env.RESEND_API_KEY;
    if (!key) {
        throw new Error('RESEND_API_KEY environment variable is not set.');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Phở Việt Khang <noreply@phovietkhang.com>',
            to: [to],
            subject: subject,
            html: html
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));
    return { success: true, ...data };
}

// =============================================================================
// MAIN REQUEST HANDLER
// =============================================================================

async function handleRequest(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }
    if (request.method !== 'POST') {
        return json({ error: 'Only POST allowed' }, 405, request);
    }

    // Authenticate using environment variable secret
    const secret = request.headers.get('X-Admin-Secret');
    const expectedSecret = env.ADMIN_SECRET;
    if (!expectedSecret) {
        return json({ error: 'Server misconfigured: ADMIN_SECRET env var not set' }, 500, request);
    }
    if (secret !== expectedSecret) {
        return json({ error: 'Unauthorized - Invalid admin secret' }, 401, request);
    }

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: 'Invalid JSON body' }, 400, request); }

    const { action, args = {} } = body;

    try {
        let result;
        switch (action) {
            case 'listAuthUsers':       result = await listAuthUsers(env); break;
            case 'deleteAuthUser':      result = await deleteAuthUser(env, args.uid); break;
            case 'disableUser':         result = await disableUser(env, args.uid); break;
            case 'enableUser':          result = await enableUser(env, args.uid); break;
            case 'changeUserPassword':  result = await changeUserPassword(env, args.uid, args.newPassword); break;
            case 'changeUserEmail':     result = await changeUserEmail(env, args.uid, args.newEmail); break;
            case 'verifyUserEmail':     result = await verifyUserEmail(env, args.uid); break;
            case 'getUserInfo':         result = await getUserInfo(env, args.uid, args.email); break;
            case 'updateDisplayName':   result = await updateDisplayName(env, args.uid, args.displayName); break;
            case 'revokeUserTokens':    result = await revokeUserTokens(env, args.uid); break;
            case 'setCustomClaims':     result = await setCustomClaims(args.uid, args.claims); break;
            case 'webSearch':           result = await webSearch(args.query); break;
            case 'browseWebUrl':        result = await browseWebUrl(args.url); break;
            case 'sendEmail':           result = await sendEmailNotification(env, args.to, args.subject, args.html); break;
            case 'createPaytrailPayment':
                result = await handlePaytrailPayment(env, args.orderData);
                break;
            default:
                return json({ error: 'Unknown action: ' + action }, 400, request);
        }
        return json(result, 200, request);
    } catch (err) {
        return json({ error: err.message }, 500, request);
    }
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    }
};
