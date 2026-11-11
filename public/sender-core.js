// 송신자(A) 동작: 브라우저 페이지와 Node 스크립트가 공유
(function (root) {
  function createSender(io, P, log) {
    let running = false;
    let cancel = false;

    const announce = (state, extra = {}) => io.signal(P.TAG_STATE, { state, ...extra });

    async function run({ runId, count, size, interval }) {
      if (running) { cancel = true; await new Promise(r => setTimeout(r, 50)); }
      running = true; cancel = false;
      count = Math.max(1, Math.min(100000, count | 0));
      size = Math.max(P.HEADER, Math.min(1024 * 1024, size | 0));
      interval = Math.max(0, Number(interval) || 0);
      log(`시작: run=${runId} ${count}개 × ${size}B, 간격 ${interval}ms`);
      announce('sending', { runId, count, size, interval });
      const t0 = P.now();
      for (let seq = 0; seq < count && !cancel; seq++) {
        io.signal(P.TAG_DATA, P.encode(runId, seq, count, size));
        if (interval > 0) await new Promise(r => setTimeout(r, interval));
        else if ((seq & 63) === 63) await new Promise(r => setTimeout(r, 0)); // 이벤트 루프에 숨 돌릴 틈
      }
      const sendMs = P.now() - t0;
      announce('done', { runId, sent: count, sendMs });
      log(`전송 완료: ${count}개, 송신 소요 ${sendMs.toFixed(1)}ms`);
      running = false;
    }

    io.on('ready', () => {
      io.subscribe(P.TAG_CTRL);
      announce('hello');
      log('서버 연결됨 · 수신자의 시작 명령 대기 중');
    });

    io.on('message', (tag, msg) => {
      if (tag !== P.TAG_CTRL || !msg || typeof msg !== 'object') return;
      if (msg.cmd === 'ping') announce('hello');
      else if (msg.cmd === 'start') run(msg);
    });

    return { run };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createSender;
  else root.createSender = createSender;
})(typeof globalThis !== 'undefined' ? globalThis : this);
