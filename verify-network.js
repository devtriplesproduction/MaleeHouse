const https = require('https');
const url = require('url');

const SUPABASE_URL = 'qdgvxqbdtbnjtxykjgul.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZ3Z4cWJkdGJuanR4eWtqZ3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk1MzQ3OCwiZXhwIjoyMTAwNTI5NDc4fQ.W-Z5e-xUFmqRL7vxp_IHGBtmxXQN_nplZb20TnRUWUQ';

// Custom agent to track sockets
const agent = new https.Agent({ keepAlive: true });

function measureRequest(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      agent: agent
    };

    const timings = {
      dnsLookup: 0,
      tcpConnection: 0,
      tlsHandshake: 0,
      ttfb: 0,
      total: 0,
      reused: false
    };

    const t0 = performance.now();
    let tDns = 0, tTcp = 0, tTls = 0, tTtfb = 0;

    const req = https.request(options, (res) => {
      tTtfb = performance.now();
      timings.ttfb = tTtfb - tTls; // TTFB from end of TLS
      
      const headers = res.headers;

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const tEnd = performance.now();
        timings.total = tEnd - t0;
        timings.download = tEnd - tTtfb;
        
        resolve({
          path,
          timings: {
            dnsLookup: (tDns - t0).toFixed(2),
            tcpConnection: (tTcp - tDns).toFixed(2),
            tlsHandshake: (tTls - tTcp).toFixed(2),
            ttfb: (tTtfb - tTls).toFixed(2),
            download: (tEnd - tTtfb).toFixed(2),
            total: (tEnd - t0).toFixed(2)
          },
          reused: timings.reused,
          httpVersion: res.httpVersion,
          headers
        });
      });
    });

    req.on('socket', (socket) => {
      if (socket.connecting) {
        socket.on('lookup', () => { tDns = performance.now(); });
        socket.on('connect', () => { tTcp = performance.now(); });
        socket.on('secureConnect', () => { tTls = performance.now(); });
      } else {
        // Reused socket
        timings.reused = true;
        tDns = t0; tTcp = t0; tTls = t0;
      }
    });

    req.on('error', (e) => {
      resolve({ path, error: e.message });
    });

    req.end();
  });
}

async function run() {
  console.log("=== Sequential Requests ===");
  const res1 = await measureRequest('/rest/v1/invoices?select=id&limit=1');
  const res2 = await measureRequest('/rest/v1/quotations?select=id&limit=1');
  
  console.log(JSON.stringify([res1, res2], null, 2));

  console.log("=== Parallel Requests (Promise.all) ===");
  const agent2 = new https.Agent({ keepAlive: true });
  // Overriding agent to test parallel connections
  // We'll just run it with the global fetch to simulate Server Actions which use fetch
  
  let socketsCreated = 0;
  agent.on('keylog', () => {}); // dummy
  
  const p1 = measureRequest('/rest/v1/projects?select=id&limit=1');
  const p2 = measureRequest('/rest/v1/projects?select=id&limit=1');
  const p3 = measureRequest('/rest/v1/projects?select=id&limit=1');
  const p4 = measureRequest('/rest/v1/projects?select=id&limit=1');
  
  const parallelRes = await Promise.all([p1, p2, p3, p4]);
  console.log(JSON.stringify(parallelRes, null, 2));
  
  // Count sockets currently alive
  let socketCount = 0;
  for (let key in agent.sockets) {
    socketCount += agent.sockets[key].length;
  }
  console.log("Total open sockets on Agent:", socketCount);
}

run();
