# iosignal-cloud

[iosignal](https://www.npmjs.com/package/iosignal) 서버로 1KB 신호 전송을 눈으로 확인하는 벤치마크입니다.

- **A (송신자)**: B의 명령을 받아 1KB 시그널을 N번 보냅니다.
- **B (수신자)**: 도착한 조각을 보드에 칠합니다. 전송 시간이 짧으면 파란색, 길면 붉은색입니다.
  모두 도착하면 조각 사이 틈이 사라지며 하나의 네모가 되고, 통계가 표시됩니다.

## 실행

```bash
npm install
npm start            # http://localhost:3000
```

1. `http://localhost:3000/sender.html` 열기 (A). 또는 터미널에서 `npm run sender`
2. `http://localhost:3000/receiver.html` 열기 (B)
3. B에서 **시작** 클릭

포트는 `PORT` 환경 변수로 바꿀 수 있습니다.

## 구성

| 파일 | 역할 |
| --- | --- |
| `server.mjs` | HTTP 정적 파일 + 같은 포트의 iosignal WebSocket 서버 |
| `sender.mjs` | Node.js 송신자(A) |
| `public/protocol.js` | 패킷 형식(24바이트 헤더 + 검증용 페이로드), 태그 이름 |
| `public/sender-core.js` | 송신 로직(브라우저·Node 공용) |
| `public/receiver.html` | 수신자(B): 보드, 범례, 통계 |

태그: `bench_ctrl`(B→A 시작/핑), `bench_data`(A→B 데이터), `bench_state`(A→B 상태).

## 통계

수신/손실, 순서 뒤바뀜, 손상·중복, 총 소요 시간(첫 송신~마지막 수신), 처리량, 초당 메시지,
전송 시간 최소·평균·p50·p95·p99·최대·표준편차, A 송신 소요.

전송 시간은 `B 수신 시각 − A 송신 시각`이므로 A와 B가 다른 기기면 시계 차이가 섞입니다.
색은 최소~최대 범위 안에서 상대적으로 칠해집니다.

## 참고

iosignal 기본 `anonymous` 쿼터는 초당 100개 메시지로 제한되어 연속 전송이 버려집니다.
이 서버는 로컬 테스트용으로 익명 연결에 제한 없는 `bench` 쿼터를 적용합니다.
인증이 없으므로 공개 네트워크에 그대로 띄우지 마세요.
