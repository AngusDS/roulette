// === 自訂比例 ===
const prizeConfig = [
  { name: '請我吃飯', percent: 10, color: '#36A2EB' },
  { name: '請你飲料', percent: 35, color: '#FFCE56' },
  { name: '謝謝參與', percent: 10, color: '#3313ebff' },
  { name: '請你吃飯', percent: 10, color: '#ff5656ff' },
  { name: '???', percent: 5, color: '#000000ff' },
  { name: 'Starbucks', percent: 30, color: '#4CAF50' }
];

// 獎項陣列只保留名稱與顏色
const prizes = prizeConfig.map(cfg => cfg.name);
const colors = prizeConfig.map(cfg => cfg.color);

// 畫輪盤時依比例決定弧度
function drawWheel() {
  const { cx, cy, r } = metrics();
  let startAngle = 0;

  prizeConfig.forEach((cfg, i) => {
    const arc = (Math.PI * 2) * (cfg.percent / 100); // 該獎項的角度
    const endAngle = startAngle + arc;

    // 畫扇區
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = cfg.color;
    ctx.fill();

    // 文字（畫在扇區中間角度上）
    const textAngle = startAngle + arc / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(textAngle);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(14, Math.floor(r * 0.09))}px Arial`;
    ctx.fillText(cfg.name, r - 30, 8);
    ctx.restore();

    startAngle = endAngle;
  });

  // 中心裝飾
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(4, r * 0.02), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
}


const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const spinBtn = document.getElementById('spin');
const resultDiv = document.getElementById('result');

let angle = 0;        // 目前輪盤角度（度）
let spinning = false; // 動畫中避免重複點擊

// === 依實際 canvas 尺寸動態計算 ===
function metrics() {
  const W = wheel.width;
  const H = wheel.height;
  const cx = W / 2;
  const cy = H / 2;
  const r  = Math.min(W, H) / 2; // 半徑（緊貼邊緣）
  return { W, H, cx, cy, r };
}



// === 固定在「下方」的指針（不旋轉）===
function drawPointerBottom() {
  const { cx, cy, r } = metrics();

  // 反轉（朝上 ▲），位置仍在下方
  const baseY = cy + r + 15;                       // 底邊靠近最下緣
  const tipY  = baseY - Math.max(28, r * 0.12);   // 尖端在底邊上方
  const halfW = Math.max(12,  r * 0.06);          // ← 你原本漏掉這行

  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.lineTo(cx - halfW, baseY);
  ctx.lineTo(cx + halfW, baseY);
  ctx.closePath();
  ctx.fillStyle = '#e91e63';
  ctx.fill();
}


// === ease-out（收尾放慢）===
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// (可選) 更好的亂數角度
function secureRandomAngle() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const r = buf[0] / 2 ** 32; // 0~1
  return r * 360 + 2880;       // 至少兩圈
}

// === 以 x=275, y=200 的 canvas 座標為中獎區域 ===
function showResult() {
  const { cx, cy } = metrics();
  // 以輪盤中心為原點，計算 x=275, y=200 的極角
  const dx = 275 - cx;
  const dy = 500 - cy;
  let theta = Math.atan2(dy, dx) * 180 / Math.PI; // -180~180
  if (theta < 0) theta += 360; // 0~360
  // 輪盤已經旋轉 angle 度，反推回原始扇區
  let eff = (theta - angle + 360) % 360;

  // 依照 prizeConfig 的比例，計算每個獎項的起始/結束角度
  let start = 0;
  let idx = 0;
  for (let i = 0; i < prizeConfig.length; i++) {
    const arc = 360 * (prizeConfig[i].percent / 100);
    const end = start + arc;
    if (eff >= start && eff < end) {
      idx = i;
      break;
    }
    start = end;
  }
  resultDiv.textContent = `恭喜獲得：${prizeConfig[idx].name}`;
}

// === 動畫 ===
function spinWheel() {
  if (spinning) return;
  spinning = true;
  resultDiv.textContent = '';

  const target = secureRandomAngle(); // 或 Math.random()*360 + 720
  let start = null;

  function animate(ts) {
    if (start === null) start = ts;
    const { W, H, cx, cy } = metrics();
    const progress = ts - start;
    const t = Math.min(progress / 8000, 1); // 3 秒
    angle = (target * easeOut(t)) % 360;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    drawWheel();
    ctx.restore();
    drawPointerBottom();

    if (t < 1) requestAnimationFrame(animate);
    else { spinning = false; showResult(); }
  }
  requestAnimationFrame(animate);
}

// === 初次繪製 ===
(function init() {
  const { W, H } = metrics();
  ctx.clearRect(0, 0, W, H);
  drawWheel();
  drawPointerBottom(); // 指針固定在下方
})();

spinBtn.addEventListener('click', spinWheel);
