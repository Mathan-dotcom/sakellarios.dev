/**
 * Zero-Dependency Standalone Mock API Server for Frontend Development & Verification
 * Reference: docs/integration/CONTRACT.md
 * Constraints:
 * - Listens on port 4010 (never 4000)
 * - Strictly GET-only (rejects all other methods with 405 Method Not Allowed)
 * - Serves tools/fixtures/*.json derived from committed ledger/ and handler code
 * - Supports failure injection via query parameter ?mode=empty|error500|slow|malformed
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

const PORT = parseInt(process.env.MOCK_API_PORT || '4010', 10);

function readFixture(filename) {
  const filepath = path.join(FIXTURES_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

export function createMockServer() {
  return http.createServer(async (req, res) => {
    // Enable CORS for local dev testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // 1. Strict Method Guard: GET only
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'application/json', Allow: 'GET' });
      res.end(
        JSON.stringify({
          success: false,
          error: `Method ${req.method} Not Allowed. Mock API is strictly read-only.`,
        })
      );
      return;
    }

    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;
    const mode = reqUrl.searchParams.get('mode') || process.env.MOCK_MODE || '';

    // 2. Failure Mode Injections
    if (mode === 'error500') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Injected 500 Internal Server Error' }));
      return;
    }

    if (mode === 'malformed') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"success": true, "data": [ MALFORMED_PAYLOAD_UNPARSED');
      return;
    }

    if (mode === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // 3. Routing Table
    try {
      if (pathname === '/api' || pathname === '/api/') {
        const catalog = readFixture('catalog.json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(catalog, null, 2));
        return;
      }

      if (pathname === '/api/treasury/summary') {
        if (mode === 'empty') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: null }));
          return;
        }
        const summary = readFixture('summary.json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary, null, 2));
        return;
      }

      if (pathname === '/api/treasury/gateway-reserves') {
        if (mode === 'empty') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: { gatewayStatus: 'LIVE_CONNECTED', lastSyncedAt: new Date().toISOString(), corporateAddress: '0x0', chains: [] } }));
          return;
        }
        const reserves = readFixture('gateway-reserves.json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reserves, null, 2));
        return;
      }

      if (pathname === '/api/invoices') {
        if (mode === 'empty') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: { processed: [], pendingEscalation: [] } }));
          return;
        }
        const invoices = readFixture('invoices.json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(invoices, null, 2));
        return;
      }

      if (pathname === '/api/escalations') {
        if (mode === 'empty') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: [] }));
          return;
        }
        const escalations = readFixture('escalations.json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(escalations, null, 2));
        return;
      }

      if (pathname === '/api/audit/receipts') {
        if (mode === 'empty') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: [] }));
          return;
        }
        const receipts = readFixture('receipts.json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(receipts, null, 2));
        return;
      }

      if (pathname === '/api/audit/beancount') {
        const beancountPath = path.join(REPO_ROOT, 'ledger', 'euthyna.beancount');
        const content = fs.readFileSync(beancountPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(mode === 'empty' ? '' : content);
        return;
      }

      // 404 Not Found for unmatched routes
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: `Route ${pathname} not found in mock catalog` }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
}

// Start server if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createMockServer();
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[MOCK-API] Mock API Server running at http://127.0.0.1:${PORT}/api`);
    console.log(`[MOCK-API] Serving fixtures from ${FIXTURES_DIR}`);
  });
}
