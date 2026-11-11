// 송신자(A)를 Node.js에서 실행: node sender.mjs [ws://host:port]
import { createRequire } from 'node:module';
import { IO } from 'iosignal';
const require = createRequire(import.meta.url);
const P = require('./public/protocol.js');
const createSender = require('./public/sender-core.js');

const url = process.argv[2] || `ws://localhost:${process.env.PORT || 3000}`;
const io = new IO(url);
io.on('error', (e) => console.error('error:', e?.message || e));
createSender(io, P, (m) => console.log(`[A] ${m}`));
process.once('SIGINT', () => { io.stop(); process.exit(0); });
