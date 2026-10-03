/**
 * Cross-module contracts (JSDoc only). Implementations live in each module's service.
 *
 * Payments (Person A) - modules/payments
 * @typedef {'MEMBERSHIP'|'TICKET'|'MERCH_ORDER'} PaymentPurpose
 *
 * @typedef {object} CreatePaymentInput
 * @property {string} userId
 * @property {PaymentPurpose} purpose
 * @property {string} refId            membership / reservation / order id
 * @property {number} amountPaise      ALWAYS computed server-side, never from the client
 * @property {string} [idempotencyKey]
 *
 * @typedef {object} CreatePaymentResult
 * @property {string} paymentId
 * @property {'RAZORPAY'|'MOCK'} provider
 * @property {string} gatewayOrderId
 * @property {number} amountPaise
 * @property {'INR'} currency
 * @property {string} keyId
 *
 * createPayment(input)                                  -> CreatePaymentResult
 * registerPurposeHandler(purpose, async (payment, tx) => void, { onFailed? })
 * refund(paymentId, amountPaise, reason)                -> { refundId }
 */
export {};
