/**
 * Purpose-handler registry (contract: payments.registerPurposeHandler).
 * Other modules register what happens when a payment for their purpose is PAID (or FAILED):
 *   registerPurposeHandler('MEMBERSHIP', async (payment, tx) => { ...activate... });
 * The handler runs INSIDE the webhook transaction, so its writes commit or roll back together
 * with the PAID status and the ledger entry.
 */
export function createRegistry() {
  const handlers = new Map();
  return {
    register(purpose, onPaid, { onFailed } = {}) {
      handlers.set(purpose, { onPaid, onFailed });
    },
    get: (purpose) => handlers.get(purpose),
  };
}

// Shared instance used by the app; tests build their own with createRegistry().
export const sharedRegistry = createRegistry();
export const registerPurposeHandler = sharedRegistry.register;
