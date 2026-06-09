/**
 * Cloudflare Worker — Firebase Admin Proxy + Paytrail Gateway for Phở Việt Khang
 *
 * HOW TO DEPLOY:
 * 1. Go to https://dash.cloudflare.com/ → Workers & Pages → Create Application → Create Worker
 * 2. Name it: pvk-admin
 * 3. Paste this entire file content
 * 4. Go to Worker Settings → Variables → Add the 2 Paytrail secrets below
 * 5. Click Save and Deploy
 * 6. Copy the Worker URL (e.g. https://pvk-admin.YOUR_NAME.workers.dev)
 * 7. IMPORTANT: Set workerSecret in Firestore doc "config/apiKeys" to "pvk-firebase-admin-2024"
 *
 * REQUIRED Environment Variables / Secrets:
 *   - PAYTRAIL_MERCHANT_ID  (e.g. 123456)
 *   - PAYTRAIL_SECRET       (e.g. your_paytrail_secret_key)
 */

// ─── Service Account Credentials ──────────────────────────────────────────────
const FIREBASE_PROJECT_ID = 'phovietkhang';
const SERVICE_ACCOUNT_EMAIL = 'firebase-adminsdk-fbsvc@phovietkhang.iam.gserviceaccount.com';
const PRIVATE_KEY_ID = '27970ca00571f7002ec246ceef1d79f9699284d4';
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDHHi9he1IPYnAf
e/qOs8f3rZm28sZRUv/FSUexslLInaY+gXZwMt4QuIKTCh1A5G2WBw7aWwVvMZZb
Xn3NG2n5yRA5YHpAJ6Pe6cCXn2xFlKZDiNS6bS4xfpNxfIlcxa+lgatX3J7dEIes
RAa17te25+KPjfQWKdKk0HhCEe9tH8JzEPNbwCW0cJWN9NYHyufXn8jtBjnaOOnQ
gKgx3wT956OIl0Hgj7J9j9SeEGibzVWNRjuI/Lc3C2ica3lBmol/mN+l0d6aqpp/
oBhrYkb2kelXLxoxBJn24TlBn7dGuTq2PTlTu3cG1izzT19o3Zi4s/R9PIX6psS9
Q2NmtXDDAgMBAAECggEALsSPOmU9u/FSBoMXMadWY3056neRTw6glpUEqt8IhKhK
oMnFqMq5z9GWkbTBdDly59cWjQDuANTzzNgf0ioLNSkdj2xyqljlK3lZzAMc6ibk
+l3MIVF9lRB2zyQCG3EvNT+EoCloguHcDAEaVmcX8ZT7aN5do0sFd8KjTFlsFAQE
jSvyoKFWwYw37bw5Inl+SDKnxn9qQ9rT3SQbVmaJORAJ2BiBB0BLs8nphZgiJDC7
aWRW0+U5ByG61LOo8CIm6dJhm3UKlcY42SjEWCyd+v0ScgG1K65d354aVfo/4ux0
NEMJqkyL7isRKRnnlMAcHrM5cX37DYnzj2KwbrGp2QKBgQDoMnR9jXg3jGLRkude
zNqeQtn8tPR5USf5vdQDdHwSwPJd94fFlgK/GnhFHhaaobG4SGXaUtRKVWnJes+f
ocSRFlJusJ2VTbUYTSGNpJ4s4w85zzsFjzOhMtyXjd0aBiVbJ8OiVmJK7CkxlEbf
Q4NI6QJePERa/PVpT9qF+/r/pQKBgQDbh6IzgVjJowX5bur1bkjVpusEqXBz3MBh
2H/3AS0igf0fg0jG6xVoiLN0Krb4IYq7c78hfpn3S3VAOl01FND69MmE5qhz5UBv
7h1CZkpk44NCsmjgcBBxW1wpOfIMRwqZcfttwYX44rqybNX25YMCg40yMK5AQNk0
BelCPnBCRwKBgCK8SYjuvOkyayYG3+3in2HFhm6zc08iwOQvbaQGrPjxPFCqUvlP
86E7CHrugVsojTmQOwxqD6//DxBA+wZaYNmDiVldunU3Zrv37ekOk0sLvJ9dTOsL
/SFERpO1eToHaVc1n6KNYa7rnU35bJDBvMYPdXc7dM5XwS6772jTxTyxAoGAd8TQ
5n68HQ4XFVXBVHN9wyqU7+8tTdjzEK7Yab83i6sVmRq8GuJoxKZIGamwN0G9ebWV
YkW65GNDre3pqisYNMJWK27YGprJhAeJ6Q77qX1CwKGrfD9HiUDJ0Cgv+SjNDJhW
DzRUzkuMhgnA1jmzNyzkXKyYdK+skKhk8WI1RsMCgYA++QYAj2a7Ed9VzTxa80mI
DHmofsWtFJVtAgAboQIGJbStZzkdlC57zxFBT50LsemtUvh4dn+eOpOy5aFcnu+E
30T88050p2v8QufPwzQB897NNlcrGNHZ1yRWL0Ewc3IKwN5ZyABFs+MoSevTLWDo
jx7tG9a928eULH35q5t9Ig==
-----END PRIVATE KEY-----`;

// ─── Shared Secret (must match workerSecret in Firestore config/apiKeys) ──────
const ADMIN_SECRET = 'pvk-firebase-admin-2024';

// ─── CORS ─────────────────────────────────────────────────────────────────────
const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    });
}

// =============================================================================
// PAYTRAIL GATEWAY
// =============================================================================

const PAYTRAIL_GROUPS = {
  online_banking_fi: ['bank'],    // Finnish online banking
  mobilepay: ['mobile'],          // MobilePay
  bank_card: ['creditcard'],      // Credit/Debit cards
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

async function handlePaytrailPayment(orderData) {
  // Test credentials (override with PAYTRAIL_MERCHANT_ID / PAYTRAIL_SECRET env vars for production)
  const merchantId = typeof PAYTRAIL_MERCHANT_ID !== 'undefined' ? PAYTRAIL_MERCHANT_ID : '375917';
  const secret = typeof PAYTRAIL_SECRET !== 'undefined' ? PAYTRAIL_SECRET : 'SAIPPUAKAUPPIAS';
  const baseUrl = 'https://phovietkhang.onrender.com';

  const stamp = `${orderData.id}_${Date.now()}`;
  const amount = Math.round(orderData.total * 100);
  const lang = orderData.language === 'fi' ? 'FI' : 'EN';
  const methodGroup = PAYTRAIL_GROUPS[orderData.paymentMethod];

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
      success: `${baseUrl}/order-tracking.html?orderId=${orderData.id}`,  /* Paytrail appends &checkout-transaction-id=UUID */
      cancel: `${baseUrl}/cart.html`,
    },
    callbackUrls: {
      success: `${baseUrl}/api/paytrail-callback`,
      cancel: `${baseUrl}/api/paytrail-callback`,
    },
    items: (() => {
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
      return items;
    })(),
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
async function getAccessToken() {
    if (_token && Date.now() < _tokenExp) return _token;

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid: PRIVATE_KEY_ID };
    const payload = {
        iss: SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now, exp: now + 3600,
    };

    const h = b64url(JSON.stringify(header));
    const p = b64url(JSON.stringify(payload));
    const msg = `${h}.${p}`;
    const key = await importPKCS8(PRIVATE_KEY_PEM);
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

async function itPost(path, body) {
    const tok = await getAccessToken();
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

async function listAuthUsers() {
    let all = [], nextPageToken = '';
    do {
        const body = { maxResults: 1000 };
        if (nextPageToken) body.nextPageToken = nextPageToken;
        const res = await itPost(`/projects/${FIREBASE_PROJECT_ID}/accounts:batchGet`, body);
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

async function deleteAuthUser(uid) {
    await itPost('/accounts:delete', { localId: uid });
    return { success: true, message: `Đã xoá hoàn toàn tài khoản Firebase Auth: ${uid}` };
}

async function disableUser(uid) {
    await itPost('/accounts:update', { localId: uid, disableUser: true });
    return { success: true, message: `Đã vô hiệu hoá tài khoản: ${uid}` };
}

async function enableUser(uid) {
    await itPost('/accounts:update', { localId: uid, disableUser: false });
    return { success: true, message: `Đã kích hoạt lại tài khoản: ${uid}` };
}

async function changeUserPassword(uid, newPassword) {
    if (!newPassword || newPassword.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    await itPost('/accounts:update', { localId: uid, password: newPassword });
    return { success: true, message: `Đã đổi mật khẩu cho tài khoản: ${uid}` };
}

async function changeUserEmail(uid, newEmail) {
    await itPost('/accounts:update', { localId: uid, email: newEmail });
    return { success: true, message: `Đã đổi email của ${uid} thành ${newEmail}` };
}

async function verifyUserEmail(uid) {
    await itPost('/accounts:update', { localId: uid, emailVerified: true });
    return { success: true, message: `Đã xác thực email cho tài khoản: ${uid}` };
}

async function getUserInfo(uid, email) {
    const body = uid ? { localId: [uid] } : email ? { email: [email] } : null;
    if (!body) throw new Error('Cần uid hoặc email.');
    const res = await itPost('/accounts:lookup', body);
    const u = res.users?.[0];
    if (!u) throw new Error('Không tìm thấy user.');
    return {
        uid: u.localId, email: u.email, displayName: u.displayName,
        disabled: u.disabled || false, emailVerified: u.emailVerified || false,
        createdAt: u.createdAt ? new Date(+u.createdAt).toISOString() : null,
        lastSignIn: u.lastLoginAt ? new Date(+u.lastLoginAt).toISOString() : null,
    };
}

async function updateDisplayName(uid, displayName) {
    await itPost('/accounts:update', { localId: uid, displayName });
    return { success: true, message: `Đã cập nhật tên hiển thị của ${uid} thành "${displayName}"` };
}

async function revokeUserTokens(uid) {
    const validSince = String(Math.floor(Date.now() / 1000));
    await itPost('/accounts:update', { localId: uid, validSince });
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

async function sendEmailNotification(to, subject, html, customApiKey = null) {
    if (!to || !subject || !html) throw new Error("Missing parameters: to, subject, or html");
    let key = customApiKey || 're_btL9vRa1_F5U5MyzMECeReQhRQmQXvEBT';

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'Phở Việt Khang <onboarding@resend.dev>',
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

async function handleRequest(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
        return json({ error: 'Only POST allowed' }, 405);
    }

    // Authenticate
    const secret = request.headers.get('X-Admin-Secret');
    if (secret !== ADMIN_SECRET) {
        return json({ error: 'Unauthorized - Invalid admin secret' }, 401);
    }

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: 'Invalid JSON body' }, 400); }

    const { action, args = {} } = body;

    try {
        let result;
        switch (action) {
            case 'listAuthUsers':       result = await listAuthUsers(); break;
            case 'deleteAuthUser':      result = await deleteAuthUser(args.uid); break;
            case 'disableUser':         result = await disableUser(args.uid); break;
            case 'enableUser':          result = await enableUser(args.uid); break;
            case 'changeUserPassword':  result = await changeUserPassword(args.uid, args.newPassword); break;
            case 'changeUserEmail':     result = await changeUserEmail(args.uid, args.newEmail); break;
            case 'verifyUserEmail':     result = await verifyUserEmail(args.uid); break;
            case 'getUserInfo':         result = await getUserInfo(args.uid, args.email); break;
            case 'updateDisplayName':   result = await updateDisplayName(args.uid, args.displayName); break;
            case 'revokeUserTokens':    result = await revokeUserTokens(args.uid); break;
            case 'setCustomClaims':     result = await setCustomClaims(args.uid, args.claims); break;
            case 'webSearch':           result = await webSearch(args.query); break;
            case 'browseWebUrl':        result = await browseWebUrl(args.url); break;
            case 'sendEmail':           result = await sendEmailNotification(args.to, args.subject, args.html, args.apiKey); break;
            case 'createPaytrailPayment':
                result = await handlePaytrailPayment(args.orderData);
                break;
            default:
                return json({ error: 'Unknown action: ' + action }, 400);
        }
        return json(result);
    } catch (err) {
        return json({ error: err.message }, 500);
    }
}

addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request));
});
