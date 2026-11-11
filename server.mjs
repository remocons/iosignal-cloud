// iosignal 1KB 신호 전송 벤치마크 서버
// - HTTP: public/ 정적 파일과 브라우저용 iosignal 클라이언트(/lib/io.js) 제공
// - WebSocket: 같은 포트에서 iosignal Server 동작
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { Server } from 'iosignal';

const PORT = Number(process.env.PORT) || 3000;
const ROOT = fileURLToPath(new URL('./public/', import.meta.url));
const require = createRequire(import.meta.url);
const IO_BUNDLE = join(require.resolve('iosignal').replace(/dist[\\/]node[\\/].*$/, ''), 'dist/browser/iife/io.js');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const httpServer = http.createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file;
    if (path === '/lib/io.js') {
      file = IO_BUNDLE;
    } else {
      if (path.endsWith('/')) path += 'index.html';
      file = normalize(join(ROOT, path));
      if (!file.startsWith(ROOT)) throw Object.assign(new Error('forbidden'), { code: 'ENOENT' });
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(body);
  } catch (err) {
    res.writeHead(err.code === 'ENOENT' || err.code === 'EISDIR' ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(err.code === 'ENOENT' || err.code === 'EISDIR' ? 'Not found' : 'Server error');
  }
});

// 기본 anonymous 쿼터는 초당 100개 메시지로 제한되어 1000개 연속 전송이 버려진다.
// 로컬 벤치마크용으로 제한 없는 프로필을 익명 연결에 적용한다.
const ioServer = new Server({
  httpServer,
  anonymousQuota: 'bench',
  quotas: {
    bench: { maxMessageBytes: 1024 * 1024, fanout: null, msgPerSec: null, bytesPerSec: null, maxConnections: null },
  },
});

ioServer.on('ready', () => {
  console.log(`iosignal bench server: http://localhost:${PORT}`);
  console.log(`  수신자(B): http://localhost:${PORT}/receiver.html`);
  console.log(`  송신자(A): http://localhost:${PORT}/sender.html  또는  node sender.mjs`);
});

httpServer.listen(PORT);

const shutdown = () => ioServer.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
