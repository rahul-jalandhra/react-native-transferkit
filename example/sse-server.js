const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/stream-sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const tokens = [
      'Hello',
      ' world!',
      ' This',
      ' is',
      ' a',
      ' real-time',
      ' SSE',
      ' stream',
      ' from',
      ' react-native-transferkit.',
      ' 🚀',
    ];

    let index = 0;

    const interval = setInterval(() => {
      if (index < tokens.length) {
        const payload = JSON.stringify({ token: tokens[index] });
        res.write(`event: message\ndata: ${payload}\n\n`);
        index++;
      } else {
        res.write('data: [DONE]\n\n');
        clearInterval(interval);
        res.end();
      }
    }, 100);

    req.on('close', () => {
      clearInterval(interval);
      console.log('Client closed SSE connection');
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found. Try /stream-sse' }));
});

server.listen(PORT, () => {
  console.log(
    `\n✅ Mock SSE Stream Server is running on http://localhost:${PORT}`
  );
  console.log(`   SSE Endpoint: http://localhost:${PORT}/stream-sse`);
  console.log(
    `   Android Emulator Endpoint: http://10.0.2.2:${PORT}/stream-sse\n`
  );
});
