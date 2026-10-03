import { AppError } from '../../lib/AppError.js';

function configurationError() {
  return new AppError('ODOO_NOT_CONFIGURED', 503, 'Odoo CRM is not configured');
}

export function createOdooClient({ config, fetchImpl = globalThis.fetch } = {}) {
  let uidPromise;
  let requestId = 0;

  async function rpc(service, method, args) {
    if (!config?.odooEnabled || !config.odooPassword) throw configurationError();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.odooTimeoutMs ?? 5000);
    try {
      const response = await fetchImpl(`${config.odooUrl}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { service, method, args },
          id: ++requestId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AppError('ODOO_UNAVAILABLE', 503, `Odoo CRM returned HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (payload.error) {
        const detail = payload.error?.data?.message || payload.error?.message || 'Odoo request failed';
        throw new AppError('ODOO_REQUEST_FAILED', 502, detail);
      }
      return payload.result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error?.name === 'AbortError') {
        throw new AppError('ODOO_TIMEOUT', 504, 'Odoo CRM did not respond in time');
      }
      throw new AppError('ODOO_UNAVAILABLE', 503, 'Odoo CRM is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  async function authenticate() {
    uidPromise ??= rpc('common', 'authenticate', [
      config.odooDatabase,
      config.odooUsername,
      config.odooPassword,
      {},
    ]).then((uid) => {
      if (!uid) {
        uidPromise = undefined;
        throw new AppError('ODOO_AUTH_FAILED', 502, 'Odoo CRM credentials were rejected');
      }
      return uid;
    }).catch((error) => {
      uidPromise = undefined;
      throw error;
    });
    return uidPromise;
  }

  async function execute(model, method, args = [], kwargs = {}) {
    const uid = await authenticate();
    return rpc('object', 'execute_kw', [
      config.odooDatabase,
      uid,
      config.odooPassword,
      model,
      method,
      args,
      kwargs,
    ]);
  }

  return {
    authenticate,
    execute,
    get webUrl() { return config.odooWebUrl; },
  };
}
