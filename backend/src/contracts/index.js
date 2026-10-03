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
 *
 * Commerce files (Person A) - modules/files/files.service.js. `tx` = caller's transaction.
 * assertUsable(fileIds, { ownerId, purpose }, db?)      -> void; 422 FILE_NOT_USABLE unless every file exists,
 *                                                          is owned by ownerId, is unattached and has `purpose`
 * attach(fileIds, { type, id }, tx)                     -> void; all-or-nothing
 * registerReadPolicy(purpose, (user, file) => boolean)  -> who besides the owner may read a private file
 *
 * Finance (Person A) - modules/finance/finance.service.js. Called inside the caller's transaction.
 * @typedef {object} LedgerPosting
 * @property {string} category        LedgerCategory
 * @property {number} amountPaise     positive integer
 * @property {string} sourceType      LedgerSourceType; (sourceType, sourceId) is unique => replays are no-ops
 * @property {string} sourceId
 * @property {string} description
 * @property {string} [eventId]
 * @property {string} [projectId]
 * @property {string} [recordedBy]    user id; omit for system postings
 * @property {Date}   [occurredAt]
 *
 * postIncome(entry, tx) / postExpense(entry, tx) / postRefund(entry, tx) -> boolean (true if newly written)
 */
export {};
