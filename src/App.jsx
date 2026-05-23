import { useState, useEffect, useRef, useCallback } from "react";

// ── 상수 ──────────────────────────────────────────────
const PIXEL = 6;
const W = 14, H = 18; // 코알라 그리드 크기
const PAD_TOP  = 2;   // 캔버스 상단 여백 (바운스 클리핑 방지)
const PAD_SIDE = 1;   // 캔버스 좌우 여백 (음표 등 측면 요소용)

const LV_NAMES = ["아기 코알라", "꼬마 코알라", "청소년 코알라", "어른 코알라"];
const LV_STARS = ["★☆☆☆", "★★☆☆", "★★★☆", "★★★★"];
const EXP_NEEDED = [30, 70, 120, 999];

const EVO = {
  TOP: { lane: "탑",     champion: "암베사",   player: "Doran",              title: "전사 코알라",   desc: "혼자서도 잘 버텨요",    flavor: "원딜발견",     color: "#c0392b" },
  JGL: { lane: "정글",   champion: "신짜오",   player: "Oner",               title: "갱킹 코알라",   desc: "부지런한 갱킹머신",    flavor: "부지런한 갱킹머신",  color: "#2255cc" },
  MID: { lane: "미드",   champion: "오리아나", player: "Faker",              title: "불멸의 코알라", desc: "완벽한 균형의 전설",   flavor: "흔들리지 않는 완벽한 코알라. 전설이 됐어요.",  color: "#d4a800" },
  BOT: { lane: "봇",     champion: "이즈리얼", player: "Peyz",               title: "캐리 코알라",   desc: "캐리하고 싶어!",       flavor: "기분파지만 폼 올라오면 무적! 킬만 먹으면 OK.", color: "#4488ff" },
  SPT: { lane: "서포터", champion: "세라핀",   player: "Keria",              title: "천사 코알라",   desc: "따뜻한 마음씨",        flavor: "다 잘 챙겨줬어요. 팀원을 빛나게 해줘요.",      color: "#cc44aa" },
};

function determineEvolution(feedCount, playCount, sleepCount) {
  if (sleepCount >= Math.max(feedCount, playCount) * 1.5) return 'TOP';
  if (playCount  >= feedCount  * 1.5) return 'BOT';
  if (feedCount  >= playCount  * 1.5) return 'SPT';
  if (feedCount + playCount + sleepCount >= 25) return 'JGL';
  return 'MID';
}

// ── 코알라 픽셀 정의 ──────────────────────────────────
// 각 모드별로 픽셀 배열 정의 [x, y, color]
const C = {
  GR: "#c8b8b0",   // 몸 회색
  DG: "#8a7068",   // 진한 회색
  LG: "#e8dcd8",   // 밝은 회색 (배)
  PK: "#f4b8c8",   // 귀 안쪽 핑크
  BK: "#2a1e1e",   // 검정 (눈)
  WH: "#fff8f0",   // 흰자
  NS: "#4a3040",   // 코
  BR: "#6a4a38",   // 갈색 (팔다리)
  GN: "#4a7a30",   // 나뭇잎
  RD: "#d84040",   // 화날 때 볼
  YL: "#f0c030",   // 저글링 공
};

// 기본 코알라 바디 (공통)
function getBasePixels() {
  return [
    // ── 왼쪽 귀 (크고 둥글게) ──
    [0,0,C.GR],[1,0,C.GR],[2,0,C.GR],
    [0,1,C.GR],[1,1,C.PK],[2,1,C.GR],
    [0,2,C.GR],[1,2,C.PK],[2,2,C.GR],
    [0,3,C.GR],[1,3,C.GR],[2,3,C.GR],

    // ── 오른쪽 귀 ──
    [11,0,C.GR],[12,0,C.GR],[13,0,C.GR],
    [11,1,C.GR],[12,1,C.PK],[13,1,C.GR],
    [11,2,C.GR],[12,2,C.PK],[13,2,C.GR],
    [11,3,C.GR],[12,3,C.GR],[13,3,C.GR],

    // ── 머리 ──
    [2,1,C.GR],[3,1,C.GR],[4,1,C.GR],[5,1,C.GR],[6,1,C.GR],[7,1,C.GR],[8,1,C.GR],[9,1,C.GR],[10,1,C.GR],[11,1,C.GR],
    [2,2,C.GR],[3,2,C.GR],[4,2,C.GR],[5,2,C.GR],[6,2,C.GR],[7,2,C.GR],[8,2,C.GR],[9,2,C.GR],[10,2,C.GR],[11,2,C.GR],
    [2,3,C.GR],[3,3,C.LG],[4,3,C.LG],[5,3,C.LG],[6,3,C.LG],[7,3,C.LG],[8,3,C.LG],[9,3,C.LG],[10,3,C.LG],[11,3,C.GR],
    [2,4,C.GR],[3,4,C.LG],[4,4,C.LG],[5,4,C.LG],[6,4,C.LG],[7,4,C.LG],[8,4,C.LG],[9,4,C.LG],[10,4,C.LG],[11,4,C.GR],
    [2,5,C.GR],[3,5,C.LG],[4,5,C.LG],[5,5,C.LG],[6,5,C.LG],[7,5,C.LG],[8,5,C.LG],[9,5,C.LG],[10,5,C.LG],[11,5,C.GR],
    [2,6,C.GR],[3,6,C.GR],[4,6,C.GR],[5,6,C.GR],[6,6,C.GR],[7,6,C.GR],[8,6,C.GR],[9,6,C.GR],[10,6,C.GR],[11,6,C.GR],

    // ── 큰 코 ──
    [5,5,C.NS],[6,5,C.NS],[7,5,C.NS],[8,5,C.NS],
    [5,6,C.NS],[6,6,C.NS],[7,6,C.NS],[8,6,C.NS],

    // ── 몸통 ──
    [3,7,C.GR],[4,7,C.GR],[5,7,C.GR],[6,7,C.GR],[7,7,C.GR],[8,7,C.GR],[9,7,C.GR],[10,7,C.GR],
    [2,8,C.GR],[3,8,C.GR],[4,8,C.LG],[5,8,C.LG],[6,8,C.LG],[7,8,C.LG],[8,8,C.LG],[9,8,C.GR],[10,8,C.GR],[11,8,C.GR],
    [2,9,C.GR],[3,9,C.GR],[4,9,C.LG],[5,9,C.LG],[6,9,C.LG],[7,9,C.LG],[8,9,C.LG],[9,9,C.GR],[10,9,C.GR],[11,9,C.GR],
    [2,10,C.GR],[3,10,C.GR],[4,10,C.LG],[5,10,C.LG],[6,10,C.LG],[7,10,C.LG],[8,10,C.LG],[9,10,C.GR],[10,10,C.GR],[11,10,C.GR],
    [3,11,C.GR],[4,11,C.GR],[5,11,C.GR],[6,11,C.GR],[7,11,C.GR],[8,11,C.GR],[9,11,C.GR],[10,11,C.GR],

    // ── 팔 ──
    [1,8,C.BR],[1,9,C.BR],[1,10,C.BR],
    [12,8,C.BR],[12,9,C.BR],[12,10,C.BR],

    // ── 다리 ──
    [3,12,C.BR],[4,12,C.BR],
    [9,12,C.BR],[10,12,C.BR],
    [3,13,C.DG],[4,13,C.DG],
    [9,13,C.DG],[10,13,C.DG],
  ];
}

// 표정별 눈+입 픽셀
function getExpressionPixels(mode) {
  // mode: 'normal'|'happy'|'sleep'|'angry'|'sad'|'dead'
  const eyes = {
    normal: [
      [4,3,C.WH],[4,4,C.BK],
      [9,3,C.WH],[9,4,C.BK],
    ],
    happy: [
      // ^ 모양 눈
      [3,4,C.DG],[4,3,C.DG],[5,4,C.DG],
      [9,4,C.DG],[10,3,C.DG],[11,4,C.DG],
    ],
    sleep: [
      [3,4,C.DG],[4,4,C.DG],[5,4,C.DG],
      [8,4,C.DG],[9,4,C.DG],[10,4,C.DG],
    ],
    angry: [
      // 좁아진 눈
      [3,4,C.DG],[4,4,C.DG],[5,4,C.DG],
      [9,4,C.DG],[10,4,C.DG],[11,4,C.DG],
      // V자 눈썹
      [5,2,C.BK],[4,3,C.BK],
      [8,2,C.BK],[9,3,C.BK],
    ],
    sad: [
      [4,3,C.WH],[4,4,C.BK],
      [9,3,C.WH],[9,4,C.BK],
      // 눈물
      [4,5,C.WH],[9,5,C.WH],
    ],
    dead: [
      // X 눈
      [3,3,C.BK],[5,3,C.BK],[4,4,C.BK],[3,5,C.BK],[5,5,C.BK],
      [8,3,C.BK],[10,3,C.BK],[9,4,C.BK],[8,5,C.BK],[10,5,C.BK],
    ],
  };

  const mouths = {
    normal: [
      [5,7,C.DG],[6,7,C.BK],[7,7,C.BK],[8,7,C.DG],
    ],
    happy: [
      // U자 스마일
      [5,7,C.BK],[6,7,C.BK],[7,7,C.BK],[8,7,C.BK],
      [4,8,C.BK],[9,8,C.BK],
    ],
    sleep: [
      [6,7,C.DG],[7,7,C.DG],
    ],
    angry: [
      // 작은 찡그림
      [5,7,C.BK],[8,7,C.BK],
      [6,8,C.BK],[7,8,C.BK],
    ],
    sad: [
      [5,8,C.BK],[6,8,C.BK],[7,8,C.BK],[8,8,C.BK],
      [5,7,C.BK],[8,7,C.BK],
    ],
    dead: [
      [5,8,C.BK],[6,8,C.BK],[7,8,C.BK],[8,8,C.BK],
    ],
  };

  return [...(eyes[mode] || eyes.normal), ...(mouths[mode] || mouths.normal)];
}

function drawKoala(canvas, { mode = 'normal', bouncingAt = 0, hoppingAt = 0, feedingAt = 0, evolution = null }) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const P = PIXEL;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bouncing = bouncingAt > 0 && Date.now() - bouncingAt < 2000;
  const hopping  = hoppingAt  > 0 && Date.now() - hoppingAt  < 800;
  const evolvedBob = evolution && !bouncing && !hopping && mode !== 'sleep' && mode !== 'dead'
    ? (Math.floor(Date.now() / 600) % 2 === 0 ? -P : 0) : 0;
  const by = (bouncing || hopping) ? (Math.floor(Date.now() / 75) % 2 === 0 ? -P * 2 : 0) : evolvedBob;

  function px(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect((x + PAD_SIDE) * P, (y + PAD_TOP) * P + by, P, P);
  }

  if (mode === 'dead') {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(0.25);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }

  const ARM_KEYS = new Set(['1,8','1,9','1,10','12,8','12,9','12,10']);
  const skipArms = bouncing || mode === 'sleep';
  getBasePixels()
    .filter(([x,y]) => !skipArms || !ARM_KEYS.has(`${x},${y}`))
    .forEach(([x,y,c]) => px(x,y,c));
  getExpressionPixels(mode).forEach(([x,y,c]) => px(x,y,c));

  if (bouncing) {
    // 빨간 삐에로 코
    [[5,5,C.RD],[6,5,C.RD],[7,5,C.RD],[8,5,C.RD],
     [5,6,C.RD],[6,6,C.RD],[7,6,C.RD],[8,6,C.RD]]
      .forEach(([x,y,c]) => px(x,y,c));
    // 팔 위로
    [[0,6,C.BR],[1,6,C.BR],[1,7,C.BR],[12,6,C.BR],[12,7,C.BR],[13,6,C.BR]]
      .forEach(([x,y,c]) => px(x,y,c));
    // 3개 공 빠른 궤도 회전
    const t = Date.now() / 300;
    for (let i = 0; i < 3; i++) {
      const a = t + i * (Math.PI * 2 / 3);
      const bx = Math.round(7 + Math.cos(a) * 6);
      const bt = Math.round(6 + Math.sin(a) * 4);
      if (bx >= 0 && bx + 1 < W && bt >= 0 && bt + 1 < H) {
        px(bx, bt, C.YL); px(bx+1, bt, C.YL);
        px(bx, bt+1, C.YL); px(bx+1, bt+1, C.YL);
      }
    }
  }

  if (mode === 'sleep') {
    // 팔 교차 웅크리기: 왼팔 y=10 앞, 오른팔 y=9 뒤 (배 앞)
    for (let x = 1; x <= 7; x++) px(x, 10, C.BR);
    for (let x = 12; x >= 6; x--) px(x, 9, C.BR);
  }

  if (feedingAt > 0 && Date.now() - feedingAt < 800) {
    const t = (Date.now() - feedingAt) / 800;
    const lx = Math.round(12 - t * 5);
    [[lx,6,C.GN],[lx+1,6,C.GN],[lx,7,C.GN],[lx+1,7,C.GN]].forEach(([x,y,c]) => px(x,y,c));
  }

  // 진화 챔피언 오버레이
  if (evolution) {
    const te = Date.now();

    if (evolution === 'TOP') {
      // 암베사: 뽀글 흰 곱슬머리 + 블레이드 + 사슬 (등 뒤)
      // 뽀글머리 (y=0 교차 밝기로 컬 표현)
      [3,5,7,9].forEach(x => px(x, 0, '#e0e0e0'));
      [4,6,8,10].forEach(x => px(x, 0, '#ffffff'));
      for (let x = 3; x <= 10; x++) px(x, 1, '#f0f0f0');
      px(2,1,'#d8d8d8'); px(11,1,'#d8d8d8');
      px(2,2,'#d8d8d8'); px(11,2,'#d8d8d8');
      if (mode !== 'sleep') {
        // 블레이드 (양팔 바깥)
        [[0,7,'#888'],[0,8,'#bbb'],[0,9,'#ddd'],[0,10,'#bbb'],[0,11,'#888'],
         [13,7,'#888'],[13,8,'#bbb'],[13,9,'#ddd'],[13,10,'#bbb'],[13,11,'#888']]
          .forEach(([x,y,c]) => px(x,y,c));
        // 사슬 (무기 하단에서 아래로 U자 늘어짐)
        [[1,11,'#aaa'],[2,12,'#999'],[3,13,'#888'],
         [4,14,'#999'],[5,14,'#aaa'],[6,14,'#aaa'],[7,14,'#aaa'],[8,14,'#aaa'],[9,14,'#999'],
         [10,13,'#888'],[11,12,'#999'],[12,11,'#aaa']]
          .forEach(([x,y,c]) => px(x,y,c));
      }

    } else if (evolution === 'JGL') {
      // 신짜오: 묶은 검은 머리 (상투) + 긴 창 (오른쪽)
      // 묶은 머리 — 정수리 상투 + 검은 단발
      px(6, 0, '#2a1e1e'); px(7, 0, '#2a1e1e'); // 상투 묶음
      for (let x = 3; x <= 10; x++) px(x, 1, '#2a1e1e');
      px(2,1,'#1a1010'); px(11,1,'#1a1010');
      px(2,2,'#1a1010'); px(11,2,'#1a1010');
      if (mode !== 'sleep') {
        // 긴 창 — 금빛 마름모 창끝 (y=0-2) + 2열 갈색 자루 (y=3-13)
        [[13,0,'#ffd700'],
         [12,1,'#e8b800'],[13,1,'#ffd700'],
         [12,2,'#c89000'],[13,2,'#e8b800']]
          .forEach(([x,y,c]) => px(x,y,c));
        for (let y = 3; y <= 13; y++) px(13, y, '#8b5a2b');
      }

    } else if (evolution === 'MID') {
      // 오리아나: 금발 롱헤어 + 구체 (머리 위 고정 크게) + 시계 태엽 + 로봇 눈 + 스커트
      // 금발 (y=1 + 양옆 y=2-3으로 길게)
      for (let x = 3; x <= 10; x++) px(x, 1, '#d4a800');
      px(2,1,'#b89000'); px(11,1,'#b89000');
      [[2,2,'#b89000'],[11,2,'#b89000'],[2,3,'#b89000'],[11,3,'#b89000']]
        .forEach(([x,y,c]) => px(x,y,c));
      // 구체 (y=0 중앙 5픽 — 금속 구 단면)
      [[5,0,'#606060'],[6,0,'#aaaaaa'],[7,0,'#e0e0e0'],[8,0,'#aaaaaa'],[9,0,'#606060']]
        .forEach(([x,y,c]) => px(x,y,c));
      // 시계 태엽 (오른쪽 어깨 뒤, + 자)
      [[12,5,'#d4a800'],[11,6,'#d4a800'],[12,6,'#f0e060'],[13,6,'#d4a800'],[12,7,'#d4a800']]
        .forEach(([x,y,c]) => px(x,y,c));
      // 로봇 눈 (3×2, 파란 발광)
      [[3,3,'#88aaff'],[4,3,'#aabbff'],[5,3,'#88aaff'],
       [3,4,'#4466ff'],[4,4,'#6688ff'],[5,4,'#4466ff'],
       [8,3,'#88aaff'],[9,3,'#aabbff'],[10,3,'#88aaff'],
       [8,4,'#4466ff'],[9,4,'#6688ff'],[10,4,'#4466ff']]
        .forEach(([x,y,c]) => px(x,y,c));
      // 철제 스커트
      [[4,11,'#707070'],[5,11,'#909090'],[6,11,'#707070'],[7,11,'#707070'],[8,11,'#909090'],[9,11,'#707070'],
       [5,12,'#606060'],[6,12,'#808080'],[7,12,'#808080'],[8,12,'#606060']]
        .forEach(([x,y,c]) => px(x,y,c));

    } else if (evolution === 'BOT') {
      // 이즈리얼: 삐죽 금발 + 파란 비전 건틀릿 + 금빛 모자챙 + 발 밑 비전 서클
      // 삐죽 금발 (y=0 교차)
      [4,6,8,10].forEach(x => px(x, 0, '#f8e060'));
      [3,5,7,9].forEach(x => px(x, 0, '#e0c040'));
      for (let x = 3; x <= 10; x++) px(x, 1, '#f0d050');
      px(2,1,'#c89800'); px(11,1,'#c89800');
      px(2,2,'#c89800'); px(11,2,'#c89800');
      // 파란 비전 건틀릿 (왼손, 깜빡임)
      const glow = Math.floor(te / 300) % 2 === 0;
      if (mode !== 'sleep') {
        [[0,8, glow ? '#88aaff' : '#6699ff'],
         [0,9, glow ? '#aaccff' : '#88aaff'],
         [0,10,'#4477cc']]
          .forEach(([x,y,c]) => px(x,y,c));
        if (glow) px(1, 9, '#ccddff');
      }
      // 금빛 모자 챙
      [[2,2,'#c89000'],[3,2,'#d4a800'],[4,2,'#d4a800'],[5,2,'#d4a800'],
       [6,2,'#d4a800'],[7,2,'#d4a800'],[8,2,'#d4a800'],[9,2,'#c89000']]
        .forEach(([x,y,c]) => px(x,y,c));
      // 발 밑 원형 비전 서클
      const rc = glow ? '#ffd700' : '#d4a800';
      for (let x = 3; x <= 10; x++) px(x, 14, rc);
      [[2,13,rc],[11,13,rc],[2,12,'#c89000'],[11,12,'#c89000']]
        .forEach(([x,y,c]) => px(x,y,c));

    } else if (evolution === 'SPT') {
      // 세라핀: 긴 핑크 머리 + 호버 플랫폼 + 음표 측면 부유
      // 긴 핑크 머리 (y=0-1 top + 양옆 y=2-5 길게)
      for (let x = 3; x <= 10; x++) { px(x, 0, '#ff88cc'); px(x, 1, '#ff88cc'); }
      [[2,1,'#ee5599'],[11,1,'#ee5599'],
       [2,2,'#ff88cc'],[11,2,'#ff88cc'],[2,3,'#ff88cc'],[11,3,'#ff88cc'],
       [1,3,'#ee5599'],[12,3,'#ee5599'],[1,4,'#ff88cc'],[12,4,'#ff88cc'],
       [1,5,'#ee5599'],[12,5,'#ee5599']]
        .forEach(([x,y,c]) => px(x,y,c));
      // 요정 날개 (머리카락 바깥 y=5-7)
      [[0,5,'#ffd0ee'],[0,6,'#ffe8f8'],[0,7,'#ffd0ee'],
       [13,5,'#ffd0ee'],[13,6,'#ffe8f8'],[13,7,'#ffd0ee']]
        .forEach(([x,y,c]) => px(x,y,c));
      // 마이크 (오른손 끝, 수면 중 숨김)
      if (mode !== 'sleep') {
        [[13,7,'#ffffff'],[13,8,'#eeeeee'],[13,9,'#cccccc']]
          .forEach(([x,y,c]) => px(x,y,c));
      }
      // 호버 플랫폼 (by 포함)
      ctx.fillStyle = '#cc88ff';
      for (let bx = 3; bx <= 10; bx++) ctx.fillRect((bx + PAD_SIDE) * P, (14 + PAD_TOP) * P + by, P, P);
      // 음표 ♪ — 코알라 바깥 1열 떨어진 위치에서 부유
      // 오른쪽: stem(14)→head(13), 왼쪽: stem(-1)→head(0) (canvas clip이 out-of-bounds 처리)
      const drawNoteR = (nx, ny, color) => {
        px(nx, ny, color); px(nx, ny + 1, color); px(nx, ny + 2, color); px(nx - 1, ny + 2, color);
      };
      const drawNoteL = (nx, ny, color) => {
        px(nx, ny, color); px(nx, ny + 1, color); px(nx, ny + 2, color); px(nx + 1, ny + 2, color);
      };
      const rny = Math.round(10 - ((te % 2000) / 2000) * 13);
      const lny = Math.round(10 - (((te + 1000) % 2000) / 2000) * 13);
      drawNoteR(14, rny, '#ff88cc');
      drawNoteL(-1, lny, '#ff88cc');
    }
  }

  if (mode === 'dead') ctx.restore();
}

// ── 유틸 ──────────────────────────────────────────────
function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }

function getMode(st) {
  if (st.dead) return 'dead';
  if (st.sleeping) return 'sleep';
  if (st.angry > 0) return 'angry';
  if (st.happy >= 90 && st.hunger >= 70) return 'happy';
  if (st.hunger <= 20 || st.happy <= 20) return 'sad';
  return 'normal';
}

// ── 통계 바 ──────────────────────────────────────────
function StatBar({ label, value, max = 100, color, warn = false }) {
  const pct = clamp((value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#888", width: 38, fontFamily: "monospace" }}>{label}</span>
      <div style={{
        flex: 1, height: 11, background: "#e0ddd8", borderRadius: 3,
        overflow: "hidden", border: `1px solid ${warn ? '#e05050' : '#ccc'}`,
        transition: "border-color .3s",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: warn ? '#e05050' : color,
          borderRadius: 3, transition: "width .5s, background .3s",
        }} />
      </div>
      <span style={{ fontSize: 10, color: warn ? '#e05050' : "#888", width: 28, textAlign: "right", fontFamily: "monospace" }}>
        {Math.round(value)}
      </span>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────
const DEFAULT_STATE = {
  hunger: 80, happy: 70, tired: 20, exp: 0,
  level: 1, sleeping: false, dead: false,
  angry: 0, cd: 0,
  feedCount: 0, playCount: 0, sleepCount: 0, evolution: null,
};

export default function KoalaTamagotchi() {
  const canvasRef = useRef(null);
  const stateRef = useRef(DEFAULT_STATE);
  const feedingAtRef = useRef(0);
  const bouncingAtRef = useRef(0);
  const hoppingAtRef = useRef(0);
  const [renderState, setRenderState] = useState(DEFAULT_STATE);
  const [msg, setMsg] = useState("코알라가 태어났어요! 🐨");

  // localStorage 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem("koala_save");
      if (!saved) return;
      const parsed = JSON.parse(saved);

      const now = Date.now();
      const elapsed = Math.min(now - (parsed.savedAt || now), 2 * 60 * 60 * 1000); // 최대 2시간
      const ticks = Math.floor(elapsed / 2000);

      let st = { ...DEFAULT_STATE, ...parsed, angry: 0 };

      if (ticks > 0 && !st.dead) {
        if (st.sleeping) {
          const sleepTicks = Math.min(ticks, Math.ceil(st.tired / 8));
          st.tired = clamp(st.tired - sleepTicks * 8);
          if (st.tired <= 0) st.sleeping = false;
          const remainTicks = ticks - sleepTicks;
          if (remainTicks > 0 && !st.sleeping) {
            st.hunger = clamp(st.hunger - remainTicks * 1.2);
            st.happy  = clamp(st.happy  - remainTicks * 0.8);
            st.tired  = clamp(st.tired  + remainTicks * 1.0);
          }
        } else {
          st.hunger = clamp(st.hunger - ticks * 1.2);
          st.happy  = clamp(st.happy  - ticks * 0.8);
          st.tired  = clamp(st.tired  + ticks * 1.0);
        }
        if (st.hunger <= 0 && st.happy <= 0) st.dead = true;
      }

      stateRef.current = st;
      setRenderState(st);

      const mins = Math.round(elapsed / 60000);
      if (st.dead) setMsg("...자리를 비운 사이에 쓰러졌어요 😢");
      else if (mins >= 60) setMsg(`${Math.floor(mins/60)}시간 만에 돌아왔군요! 🐨`);
      else if (mins >= 5)  setMsg(`${mins}분 만에 돌아왔군요! 🐨`);
      else                 setMsg("어서와요! 잘 지냈어요? 🐨");
    } catch {}
  }, []);

  // localStorage 저장 (상태 바뀔 때마다)
  const saveToStorage = useCallback((st) => {
    try {
      localStorage.setItem("koala_save", JSON.stringify({
        hunger: st.hunger, happy: st.happy, tired: st.tired,
        exp: st.exp, level: st.level, dead: st.dead, sleeping: st.sleeping,
        feedCount: st.feedCount || 0, playCount: st.playCount || 0,
        sleepCount: st.sleepCount || 0, evolution: st.evolution || null,
        savedAt: Date.now(),
      }));
    } catch {}
  }, []);

  // 상태 업데이트 헬퍼
  const updateState = useCallback((updater) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setRenderState({ ...next });
    saveToStorage(next);
    return next;
  }, [saveToStorage]);

  // 애니메이션 루프
  useEffect(() => {
    let raf;
    function loop() {
      drawKoala(canvasRef.current, {
        mode: getMode(stateRef.current),
        bouncingAt: bouncingAtRef.current,
        hoppingAt: hoppingAtRef.current,
        feedingAt: feedingAtRef.current,
        evolution: stateRef.current.evolution,
      });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 실시간 수치 감소 (2초마다)
  useEffect(() => {
    const iv = setInterval(() => {
      updateState(s => {
        if (s.dead) return s;
        if (s.sleeping) {
          // 자는 동안 피로 회복
          const nextTired = clamp(s.tired - 18);
          const wakeUp = nextTired <= 0;
          if (wakeUp) {
            setTimeout(() => setMsg("기지개~ 잘 잤어요! ☀️"), 0);
          }
          return { ...s, tired: nextTired, sleeping: !wakeUp };
        }

        const next = {
          ...s,
          hunger: clamp(s.hunger - 1.2),
          happy: clamp(s.happy - 0.8),
          tired: clamp(s.tired + 1.0),
          angry: s.angry > 0 ? s.angry - 1 : 0,
          cd: s.cd > 0 ? s.cd - 1 : 0,
        };

        if (next.hunger <= 0 && next.happy <= 0) {
          next.dead = true;
          setTimeout(() => setMsg("...코알라가 쓰러졌어요 😢"), 0);
        } else if (next.hungry <= 10) {
          setTimeout(() => setMsg("배고파요! 밥 주세요! 🍃"), 0);
        } else if (next.tired >= 90) {
          setTimeout(() => setMsg("너무 졸려요... 💤"), 0);
        } else if (next.happy <= 15) {
          setTimeout(() => setMsg("심심해요~ 같이 놀아요! 🎮"), 0);
        }

        return next;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, [updateState]);

  function act(type) {
    const s = stateRef.current;
    if (s.dead) { setMsg("게임 오버예요 😢"); return; }
    if (s.sleeping) { setMsg("자고 있어요... 💤"); return; }
    if (s.cd > 0) { setMsg("잠깐만요~"); return; }

    if (type === "feed") {
      if (s.hunger >= 90) {
        // 화내기!
        updateState(st => ({ ...st, angry: 8 }));
        setMsg("배불러요! 그만 줘요! 😠");
        return;
      }
      feedingAtRef.current = Date.now();
      hoppingAtRef.current = Date.now();
      updateState(st => {
        const n = {
          ...st,
          hunger: clamp(st.hunger + 25),
          tired: clamp(st.tired + 2),
          exp: st.exp + 3,
          cd: 2,
          feedCount: (st.feedCount || 0) + 1,
        };
        return checkLvUp(n);
      });
      setMsg("냠냠~ 유칼립투스 맛있어요! 🍃");

    } else if (type === "play") {
      if (s.tired >= 80) {
        // 화내기!
        updateState(st => ({ ...st, angry: 8 }));
        setMsg("너무 피곤해요! 재워주세요! 😠");
        return;
      }
      bouncingAtRef.current = Date.now();
      updateState(st => {
        const n = {
          ...st,
          happy: clamp(st.happy + 25),
          tired: clamp(st.tired + 15),
          hunger: clamp(st.hunger - 8),
          exp: st.exp + 5,
          cd: 2,
          playCount: (st.playCount || 0) + 1,
        };
        return checkLvUp(n);
      });
      setMsg("히히~ 같이 놀아요! 🎮");

    } else if (type === "sleep") {
      if (s.tired < 30) {
        updateState(st => ({ ...st, angry: 6 }));
        setMsg("안 졸려요! 놀고 싶어요! 😠");
        return;
      }
      updateState(st => ({ ...st, sleeping: true, sleepCount: (st.sleepCount || 0) + 1 }));
      setMsg("쿨쿨... 💤");
    }
  }

  function checkLvUp(s) {
    if (s.level >= 4) return s;
    const needed = EXP_NEEDED[s.level - 1];
    if (s.exp >= needed) {
      const nl = s.level + 1;
      if (nl >= 4) {
        const evo = determineEvolution(s.feedCount || 0, s.playCount || 0, s.sleepCount || 0);
        setTimeout(() => setMsg(`✨ ${EVO[evo].title}로 진화! ${EVO[evo].lane} · ${EVO[evo].champion}`), 100);
        return { ...s, level: nl, exp: 0, evolution: evo };
      }
      setTimeout(() => setMsg(`레벨 업! LV.${nl} ${LV_NAMES[nl - 1]}가 됐어요! 🎉`), 100);
      return { ...s, level: nl, exp: 0 };
    }
    return s;
  }

  function handleReset() {
    localStorage.removeItem("koala_save");
    feedingAtRef.current = 0;
    bouncingAtRef.current = 0;
    hoppingAtRef.current = 0;
    stateRef.current = { ...DEFAULT_STATE };
    setRenderState({ ...DEFAULT_STATE });
    setMsg("새 코알라가 태어났어요! 🐨");
  }


  const st = renderState;
  const lvIdx = Math.min(st.level - 1, 3);
  const maxExp = EXP_NEEDED[Math.min(st.level - 1, 3)];
  const mode = getMode(st);

  const CW = (W + 2 * PAD_SIDE) * PIXEL, CH = (H + 1 + PAD_TOP) * PIXEL;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "1.5rem 1rem", gap: "0.9rem",
      fontFamily: "'Courier New', monospace",
      minHeight: "100vh",
      background: "#f0ede8",
    }}>
      {/* 디바이스 프레임 */}
      <div style={{
        background: "linear-gradient(160deg, #3a4a3a, #222e22)",
        borderRadius: 24,
        padding: 16,
        border: "4px solid #1a2a1a",
        boxShadow: "0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        width: "min(300px, 92vw)",
      }}>
        {/* 스크린 */}
        <div style={{
          background: "#8bac0f",
          borderRadius: 10,
          width: "100%",
          paddingBottom: "70%",
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 3px 10px rgba(0,0,0,0.3)",
        }}>
          <div style={{ position: "absolute", inset: 0 }}>
            {/* 배경 */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <rect width="300" height="210" fill={mode === 'sleep' ? "#0e1a08" : "#8bac0f"}/>
              <rect x="0" y="155" width="300" height="55" fill={mode === 'sleep' ? "#0a1e08" : "#306230"}/>
              {/* 왼쪽 나무 */}
              <rect x="22" y="90" width="8" height="65" fill="#5a3a1a"/>
              <ellipse cx="26" cy="90" rx="22" ry="18" fill={mode === 'sleep' ? "#1a4010" : "#3a7a2a"}/>
              <ellipse cx="14" cy="100" rx="14" ry="12" fill={mode === 'sleep' ? "#1a4010" : "#3a7a2a"}/>
              <ellipse cx="38" cy="100" rx="14" ry="12" fill={mode === 'sleep' ? "#1a4010" : "#3a7a2a"}/>
              {/* 오른쪽 나무 */}
              <rect x="252" y="105" width="8" height="50" fill="#5a3a1a"/>
              <ellipse cx="256" cy="105" rx="20" ry="16" fill={mode === 'sleep' ? "#1a4010" : "#3a7a2a"}/>
              <ellipse cx="244" cy="115" rx="13" ry="11" fill={mode === 'sleep' ? "#1a4010" : "#3a7a2a"}/>
              <ellipse cx="268" cy="115" rx="13" ry="11" fill={mode === 'sleep' ? "#1a4010" : "#3a7a2a"}/>
              {/* 별들 */}
              <rect x="6"   y="14" width="8" height="8" fill="#d0d890" opacity={mode === 'sleep' ? "1"   : ".6"}/>
              <rect x="270" y="24" width="7" height="7" fill="#d0d890" opacity={mode === 'sleep' ? ".9"  : ".5"}/>
              <rect x="138" y="10" width="6" height="6" fill="#d0d890" opacity={mode === 'sleep' ? ".8"  : ".4"}/>
              <rect x="80"  y="30" width="5" height="5" fill="#d0d890" opacity={mode === 'sleep' ? ".7"  : ".3"}/>
              <rect x="200" y="18" width="5" height="5" fill="#d0d890" opacity={mode === 'sleep' ? ".6"  : "0"}/>
              <rect x="50"  y="45" width="4" height="4" fill="#d0d890" opacity={mode === 'sleep' ? ".5"  : "0"}/>
              {/* 달 (수면 중만) */}
              {mode === 'sleep' && <>
                <ellipse cx="238" cy="32" rx="16" ry="16" fill="#e8e090"/>
                <ellipse cx="245" cy="27" rx="12" ry="12" fill="#0e1a08"/>
              </>}
            </svg>

            {/* 코알라 - 발이 SVG 지면(y=155/210)에 맞닿도록 절대 위치 */}
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              style={{
                imageRendering: "pixelated",
                position: "absolute",
                left: "50%",
                top: `calc(73.8% - ${(13 + PAD_TOP) * PIXEL}px)`,
                transform: "translateX(-50%)",
                zIndex: 2,
              }}
            />

            {/* ZZZ */}
            {mode === 'sleep' && (
              <div style={{
                position: 'absolute', top: '10%', right: '18%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 1, pointerEvents: 'none', zIndex: 3,
                color: '#a0c040', fontFamily: 'monospace', fontWeight: 'bold',
              }}>
                {[10, 12, 15].map((size, i) => (
                  <span key={i} className="zzz-char" style={{ fontSize: size, animationDelay: `${i * 0.55}s` }}>z</span>
                ))}
              </div>
            )}

            {/* 메시지 바 */}
            <div style={{
              position: "absolute", bottom: 6, left: 6, right: 6,
              background: "rgba(0,0,0,0.5)",
              color: mode === 'angry' ? "#ff8888" : "#9bbc0f",
              fontSize: 11,
              padding: "3px 8px",
              borderRadius: 4,
              textAlign: "center",
              letterSpacing: ".04em",
              transition: "color .3s",
            }}>
              {msg}
            </div>
          </div>
        </div>
      </div>

      {/* 레벨 뱃지 / 진화 카드 */}
      {st.evolution ? (
        <div style={{
          background: EVO[st.evolution].color + '18',
          border: `2px solid ${EVO[st.evolution].color}`,
          borderRadius: 10,
          padding: '10px 18px',
          textAlign: 'center',
          width: "min(280px, 88vw)",
          boxShadow: `0 2px 14px ${EVO[st.evolution].color}44`,
        }}>
          <div style={{ color: EVO[st.evolution].color, fontWeight: 'bold', fontSize: 14, letterSpacing: '.06em' }}>
            ★★★★ {EVO[st.evolution].title}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>
            {EVO[st.evolution].lane} · {EVO[st.evolution].champion} · {EVO[st.evolution].player}
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: 12, color: "#555", letterSpacing: ".08em",
          background: "#fff", padding: "4px 14px", borderRadius: 5,
          border: "1px solid #ddd", boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}>
          LV.{st.level} {LV_NAMES[lvIdx]} {LV_STARS[lvIdx]}
        </div>
      )}

      {/* 스탯 바 */}
      <div style={{ width: "min(280px, 88vw)", display: "flex", flexDirection: "column", gap: 7 }}>
        <StatBar label="배고픔" value={st.hunger} color="#e8852a" warn={st.hunger < 20}/>
        <StatBar label="행복도" value={st.happy}  color="#2a8be8" warn={st.happy < 20}/>
        <StatBar label="피로도" value={st.tired}  color="#8b4ae8" warn={st.tired > 80}/>
        <StatBar label="경험치" value={st.exp}    max={maxExp}    color="#2aaa55"/>
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { label: "🍃 밥주기", type: "feed", disabled: st.hungry >= 100 },
          { label: "🎮 놀기", type: "play" },
          { label: "💤 재우기", type: "sleep", disabled: st.sleeping },
        ].map(({ label, type, disabled }) => (
          <button
            key={type}
            onClick={() => act(type)}
            disabled={st.dead || disabled}
            style={{
              background: "#fff",
              border: `1px solid ${mode === 'angry' && !st.dead ? '#e05050' : '#ccc'}`,
              color: "#444",
              fontSize: 12,
              fontFamily: "monospace",
              padding: "8px 14px",
              borderRadius: 6,
              cursor: st.dead || disabled ? "default" : "pointer",
              opacity: st.dead ? 0.5 : 1,
              transition: "all .15s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
            onMouseEnter={e => { if (!st.dead) e.currentTarget.style.background = "#f5f3ef"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(.93)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 리셋 */}
      <button
        onClick={handleReset}
        style={{
          background: "transparent", border: "none",
          color: "#bbb", fontSize: 10, fontFamily: "monospace",
          cursor: "pointer", padding: "2px 6px",
          textDecoration: "underline",
        }}
      >
        처음부터
      </button>
    </div>
  );
}