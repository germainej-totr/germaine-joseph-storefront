// test-webhook.js
const crypto = require('crypto');

const secret = 'test_secret'; // Match this in your .env
const payload = JSON.stringify({
  id: 123456,
  customer: { email: "tailor_test@example.com" },
  line_items: [{ title: "Bespoke Red Label Suit" }]
});

const hmac = crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('base64');

console.log("Run this command in a separate terminal:");
console.log(`curl -X POST http://localhost:3000/api/webhooks/shopify/order-paid \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-Sha256: ${hmac}" \
  -d '${payload}'`);