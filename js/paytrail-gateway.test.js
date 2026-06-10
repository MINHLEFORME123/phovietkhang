import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// Mock Paytrail API config
const PAYTRAIL_MERCHANT_ID = 123456;
const PAYTRAIL_SECRET = 'test_secret_key_12345';
const PAYTRAIL_API_URL = 'https://services.paytrail.com/payments';

function createPaymentPayload(order) {
  return {
    checkoutTransactionId: order.id,
    checkoutAmount: Math.round(order.total * 100),
    checkoutCurrency: 'EUR',
    checkoutStamp: Math.floor(new Date(order.createdAt).getTime() / 1000).toString(),
    checkoutReference: order.id.slice(0, 20),
    checkoutMerchant: PAYTRAIL_MERCHANT_ID,
    items: order.items.map((item, i) => ({
      unitPrice: Math.round(item.price * 100),
      units: item.qty,
      vatPercentage: 1350,
      productCode: item.id,
      description: item.name,
    })),
    customer: {
      email: order.customerEmail,
      firstName: order.customerName.split(' ')[0] || '',
      lastName: order.customerName.split(' ').slice(1).join(' ') || '',
      phone: order.customerPhone,
    },
    redirectUrls: {
      success: `${globalThis.location?.origin || 'http://localhost:5000'}/order-tracking.html?orderId=${order.id}`,
      cancel: `${globalThis.location?.origin || 'http://localhost:5000'}/cart.html`,
    },
  };
}

function validatePaytrailConfig(config) {
  const errors = [];
  if (!config.merchantId || typeof config.merchantId !== 'number') errors.push('Missing or invalid merchantId');
  if (!config.secret || typeof config.secret !== 'string') errors.push('Missing or invalid secret');
  if (!config.apiUrl || !config.apiUrl.startsWith('https://')) errors.push('Missing or invalid apiUrl');
  return { valid: errors.length === 0, errors };
}

async function mockPaytrailCreatePayment(payload) {
  const validation = validatePaytrailConfig({
    merchantId: PAYTRAIL_MERCHANT_ID,
    secret: PAYTRAIL_SECRET,
    apiUrl: PAYTRAIL_API_URL,
  });
  if (!validation.valid) {
    throw new Error(`Paytrail config invalid: ${validation.errors.join(', ')}`);
  }
  if (!payload.checkoutAmount || payload.checkoutAmount <= 0) {
    throw new Error('Invalid payment amount');
  }
  if (!payload.customer?.email) {
    throw new Error('Customer email required');
  }
  return {
    transactionId: `paytrail_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    checkoutUrl: `${PAYTRAIL_API_URL}/${payload.checkoutTransactionId}/payment`,
    reference: payload.checkoutReference,
    amount: payload.checkoutAmount,
    currency: payload.checkoutCurrency,
    status: 'ok',
  };
}

describe('Paytrail Gateway Integration', () => {

  describe('Config validation', () => {
    it('should reject empty config', () => {
      const result = validatePaytrailConfig({});
      assert.equal(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should reject missing merchantId', () => {
      const result = validatePaytrailConfig({ secret: 'abc', apiUrl: 'https://api.paytrail.com' });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('merchantId')));
    });

    it('should reject non-numeric merchantId', () => {
      const result = validatePaytrailConfig({ merchantId: 'abc', secret: 'abc', apiUrl: 'https://api.paytrail.com' });
      assert.equal(result.valid, false);
    });

    it('should reject missing secret', () => {
      const result = validatePaytrailConfig({ merchantId: 123456, apiUrl: 'https://api.paytrail.com' });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('secret')));
    });

    it('should reject non-https apiUrl', () => {
      const result = validatePaytrailConfig({ merchantId: 123456, secret: 'abc', apiUrl: 'http://api.paytrail.com' });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('apiUrl')));
    });

    it('should accept valid config', () => {
      const result = validatePaytrailConfig({
        merchantId: 123456,
        secret: 'test_key',
        apiUrl: 'https://services.paytrail.com/payments',
      });
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });
  });

  describe('Payment payload creation', () => {
    const sampleOrder = {
      id: 'order_test_001',
      total: 45.50,
      createdAt: new Date('2026-06-09T12:00:00Z'),
      customerEmail: 'test@example.com',
      customerName: 'Minh Bui',
      customerPhone: '+358401234567',
      items: [
        { id: 'pho001', name: 'Pho Bo', price: 15.50, qty: 2 },
        { id: 'cha001', name: 'Cha Gio', price: 7.25, qty: 1 },
      ],
    };

    it('should create valid payload with correct amount', () => {
      const payload = createPaymentPayload(sampleOrder);
      assert.equal(payload.checkoutAmount, 4550);
      assert.equal(payload.checkoutCurrency, 'EUR');
      assert.equal(payload.checkoutMerchant, PAYTRAIL_MERCHANT_ID);
    });

    it('should include all order items', () => {
      const payload = createPaymentPayload(sampleOrder);
      assert.equal(payload.items.length, 2);
      assert.equal(payload.items[0].unitPrice, 1550);
      assert.equal(payload.items[0].units, 2);
      assert.equal(payload.items[1].unitPrice, 725);
      assert.equal(payload.items[1].units, 1);
    });

    it('should include customer info', () => {
      const payload = createPaymentPayload(sampleOrder);
      assert.equal(payload.customer.email, 'test@example.com');
      assert.equal(payload.customer.firstName, 'Minh');
      assert.equal(payload.customer.lastName, 'Bui');
      assert.equal(payload.customer.phone, '+358401234567');
    });

    it('should include redirect URLs', () => {
      const payload = createPaymentPayload(sampleOrder);
      assert.ok(payload.redirectUrls.success.includes('order-tracking.html'));
      assert.ok(payload.redirectUrls.cancel.includes('cart.html'));
      assert.ok(payload.redirectUrls.success.includes(sampleOrder.id));
    });

    it('should generate stamp from timestamp', () => {
      const payload = createPaymentPayload(sampleOrder);
      const stamp = parseInt(payload.checkoutStamp, 10);
      assert.ok(!isNaN(stamp));
      assert.ok(stamp > 0);
      assert.equal(payload.checkoutStamp, Math.floor(sampleOrder.createdAt.getTime() / 1000).toString());
    });
  });

  describe('Payment creation API call', () => {
    it('should succeed with valid payload', async () => {
      const payload = createPaymentPayload({
        id: 'order_test_002',
        total: 25.00,
        createdAt: new Date(),
        customerEmail: 'buyer@example.com',
        customerName: 'Test User',
        customerPhone: '+358401234567',
        items: [{ id: 'pho002', name: 'Pho Ga', price: 12.50, qty: 2 }],
      });
      const result = await mockPaytrailCreatePayment(payload);
      assert.equal(result.status, 'ok');
      assert.ok(result.transactionId.startsWith('paytrail_'));
      assert.ok(result.checkoutUrl);
      assert.equal(result.amount, 2500);
    });

    it('should reject zero amount', async () => {
      const payload = createPaymentPayload({
        id: 'order_test_003',
        total: 0,
        createdAt: new Date(),
        customerEmail: 'buyer@example.com',
        customerName: 'Test User',
        customerPhone: '+358401234567',
        items: [{ id: 'pho003', name: 'Pho', price: 0, qty: 1 }],
      });
      await assert.rejects(
        () => mockPaytrailCreatePayment(payload),
        { message: /Invalid payment amount/ }
      );
    });

    it('should reject missing customer email', async () => {
      const payload = createPaymentPayload({
        id: 'order_test_004',
        total: 10.00,
        createdAt: new Date(),
        customerEmail: '',
        customerName: 'Test',
        customerPhone: '+358401234567',
        items: [{ id: 'pho004', name: 'Pho', price: 10.00, qty: 1 }],
      });
      await assert.rejects(
        () => mockPaytrailCreatePayment(payload),
        { message: /Customer email required/ }
      );
    });
  });

});
