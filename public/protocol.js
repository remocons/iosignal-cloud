// A(송신자)와 B(수신자)가 함께 쓰는 프로토콜 정의 (브라우저 / Node 공용)
// 패킷 레이아웃 (리틀 엔디언):
//   0  u32  runId
//   4  u32  seq      (0부터)
//   8  u32  total
//  12  u32  size     (패킷 전체 바이트)
//  16  f64  sendTime (epoch ms, 소수점 이하 = 마이크로초 단위 정밀도)
//  24 ...   payload  byte[i] = (seq + i) & 0xff  (무결성 검사용)
(function (root) {
  const P = {
    TAG_DATA: 'bench_data',   // A -> B : 1KB 신호
    TAG_CTRL: 'bench_ctrl',   // B -> A : { cmd: 'start', runId, count, size, interval } / { cmd: 'ping' }
    TAG_STATE: 'bench_state', // A -> B : { state: 'hello' | 'sending' | 'done', ... }
    HEADER: 24,

    now() {
      return (typeof performance !== 'undefined' && performance.timeOrigin)
        ? performance.timeOrigin + performance.now()
        : Date.now();
    },

    encode(runId, seq, total, size) {
      const buf = new Uint8Array(size);
      const dv = new DataView(buf.buffer);
      dv.setUint32(0, runId, true);
      dv.setUint32(4, seq, true);
      dv.setUint32(8, total, true);
      dv.setUint32(12, size, true);
      for (let i = P.HEADER; i < size; i++) buf[i] = (seq + i) & 0xff;
      dv.setFloat64(16, P.now(), true); // 마지막에 기록해서 생성 비용을 빼고 측정
      return buf;
    },

    decode(bytes) {
      const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      if (u8.byteLength < P.HEADER) return null;
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      const pkt = {
        runId: dv.getUint32(0, true),
        seq: dv.getUint32(4, true),
        total: dv.getUint32(8, true),
        size: dv.getUint32(12, true),
        sendTime: dv.getFloat64(16, true),
        bytes: u8.byteLength,
        intact: true,
      };
      if (pkt.size !== u8.byteLength) pkt.intact = false;
      else for (let i = P.HEADER; i < u8.byteLength; i++) {
        if (u8[i] !== ((pkt.seq + i) & 0xff)) { pkt.intact = false; break; }
      }
      return pkt;
    },

    wsUrl(loc) {
      return (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host;
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
  else root.BenchProtocol = P;
})(typeof globalThis !== 'undefined' ? globalThis : this);
