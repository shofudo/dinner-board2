// まとまり開始（IIFE）
(() => {
  // タブ切替（シンプル）
  const tabInput = document.getElementById("tab-input");
  const tabKitchen = document.getElementById("tab-kitchen");
  const viewInput = document.getElementById("view-input");
  const viewKitchen = document.getElementById("view-kitchen");
  function show(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
    view.classList.add("is-active");
  }
  tabInput.addEventListener("click", () => { tabInput.setAttribute("aria-selected","true"); tabKitchen.removeAttribute("aria-selected"); show(viewInput); });
  tabKitchen.addEventListener("click", () => { tabKitchen.setAttribute("aria-selected","true"); tabInput.removeAttribute("aria-selected"); show(viewKitchen); });
// === 時刻ユーティリティ（上に追加） ===
function pad2(n){ return String(n).padStart(2,'0'); }
function hhmm(d){ return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
// グローバルに公開（他の関数からも使えるようにする）
window.pad2 = pad2;
window.hhmm = hhmm;

function addMinutes(d, mins){ return new Date(d.getTime() + mins*60000); }
function isHHMM(s){ return /^\d{2}:\d{2}$/.test(String(s||'')); }

  /* ===== 進行表（18:00 / 18:30 / 19:00・2段階） ===== */

  const KEY_BOARD = "dinner.board.v2";

  // === v3 保存・読込（最小セット）===
const KEY_BOARD_V3 = "dinner.board.v3";

function saveBoardV3(state){
  localStorage.setItem(KEY_BOARD_V3, JSON.stringify(state));
}

function loadBoardV3(){
  try{
    const raw = localStorage.getItem(KEY_BOARD_V3);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    return {};
  }
}

function ensureStateV3(state, groupId, roomId, colIdx){
  if(!state[groupId]) state[groupId] = {};
  if(!state[groupId][roomId]) state[groupId][roomId] = {};
  if(typeof state[groupId][roomId][colIdx] !== "string"){
    state[groupId][roomId][colIdx] = "未";
  }
  // === 本日データ：丸ボタン状態だけをリセット ===
function resetBoardStatesToPendingV3(){
  const state = loadBoardV3() || {};
  const DISH_KEYS = ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];

  // 全group→全room→各 dish に対して “未” へ
  for(const gid in state){
    for(const rid in state[gid]){
      for(let i=0; i<DISH_KEYS.length; i++){
        state[gid][rid][i] = "未";
      }
    }
  }
  saveBoardV3(state);
  renderBoardV3(state);
}

}

window.loadBoardV3  = loadBoardV3;
window.saveBoardV3  = saveBoardV3;
window.ensureStateV3 = ensureStateV3;

  const GROUPS = [
    {
      id: "18:00",
      title: "18:00 グループ",
      rooms: [
        { id: "yama",  name: "やまぶき", speed: "N", allergy: "プレ・スタンダード" },
        { id: "nade",  name: "なでしこ", speed: "N", allergy: "プレ・スタンダード" },
        { id: "tsuba", name: "つばき",   speed: "N", allergy: "プレ・スタンダード" }
      ]
    },
    {
      id: "18:30",
      title: "18:30 グループ",
      rooms: [
        { id: "sakura", name: "さくら", speed: "N", allergy: "プレ・スタンダード" },
        { id: "fuji",   name: "ふじ",   speed: "N", allergy: "プレ・スタンダード" },
        { id: "satsuki",name: "さつき", speed: "N", allergy: "プレ・スタンダード" }
      ]
    },
    {
      id: "19:00",
      title: "19:00 グループ",
      rooms: [
        { id: "masuge", name: "きすげ", speed: "N", allergy: "プレ・スタンダード" }
      ]
    }
  ];

  const COLS = ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];

  function saveBoard(state){ localStorage.setItem(KEY_BOARD, JSON.stringify(state)); }
  function loadBoard(){
    try { const raw = localStorage.getItem(KEY_BOARD); return raw ? JSON.parse(raw) : {}; }
    catch { return {}; }
  }
  function ensureState(state, groupId, roomId, colIdx){
    if(!state[groupId]) state[groupId] = {};
    if(!state[groupId][roomId]) state[groupId][roomId] = {};
    if(typeof state[groupId][roomId][colIdx] !== "number") state[groupId][roomId][colIdx] = 0; // 0:未 1:出
  }

  function renderGroup(g, state){
    const rows = g.rooms.map(r => {
      const cells = COLS.map((label, idx) => {
        ensureState(state, g.id, r.id, idx);
        const on = state[g.id][r.id][idx] === 1;
        return `
          <div class="td cell" data-group="${g.id}" data-room="${r.id}" data-col="${idx}">
            <button class="dotbtn ${on ? "is-on": ""}" aria-label="${label}"></button>
            <div class="dotlabel">${on ? "出":"未"}</div>
          </div>`;
      }).join("");
      return `
        <div class="rowline">
          <div class="td room">
            <div><strong>${r.name}</strong></div>
            <div class="badges">
              <span class="badge">速度: ${r.speed}</span>
              <span class="badge">${r.allergy}</span>
            </div>
          </div>
          ${cells}
        </div>`;
    }).join("");

    return `
      <div class="board">
        <h2>${g.title}</h2>
        <div class="table">
          <div class="thead">
            <div class="th room">部屋 / 速度・アレルギー</div>
            ${COLS.map(c => `<div class="th">${c}</div>`).join("")}
          </div>
          <div class="tbody">${rows}</div>
        </div>
      </div>`;
  }

  function renderBoards(){
    const container = document.getElementById("boards");
    const state = loadBoard();
    container.innerHTML = GROUPS.map(g => renderGroup(g, state)).join("");

    container.querySelectorAll(".cell .dotbtn").forEach(btn => {
      btn.addEventListener("click", (e)=>{
        const cell = e.currentTarget.closest(".cell");
        const groupId = cell.dataset.group;
        const roomId  = cell.dataset.room;
        const colIdx  = Number(cell.dataset.col);

        const st = loadBoard();
        ensureState(st, groupId, roomId, colIdx);
        st[groupId][roomId][colIdx] = st[groupId][roomId][colIdx] === 1 ? 0 : 1;
        saveBoard(st);

        const on = st[groupId][roomId][colIdx] === 1;
        e.currentTarget.classList.toggle("is-on", on);
        cell.querySelector(".dotlabel").textContent = on ? "出":"未";
      });
    });
  }

document.getElementById("btn-reset-today")?.addEventListener("click", ()=>{   // ← ? つけるとさらに安全
    if(confirm("本日の進行データを消去します。よろしいですか？")){
      localStorage.removeItem(KEY_BOARD);
      localStorage.removeItem(KEY_BOARD_V3); //
      localStorage.removeItem(`board-state.v1:${new Date().toISOString().slice(0,10)}`);

      renderBoards();
    }
  });

  // 初期表示
  renderBoards();
})(); // まとまり終わり
// ==============================
// 本日の設定（today-settings.v1）→ 発注ボード反映（統一版）
// ==============================
(function(){
  function loadSettings(){
    try{
      const raw = localStorage.getItem('today-settings.v1');
      if(!raw) return null;
      const data = JSON.parse(raw);
      if(!data || !Array.isArray(data.rooms)) return null;
      return data;
    }catch{ return null; }
  }

  function esc(s){
    return String(s||"").replace(/[&<>"']/g, m=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  function renderFromSettings(data){
    const byTime = { "18:00":[], "18:30":[], "19:00":[] };
    for(const r of data.rooms){
      if(byTime[r.dinner]) byTime[r.dinner].push(r);
    }

    const dishHeaders = ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];

    const groupHtml = (time, list) => {
      return `
        <h2 style="margin:24px 0 8px 0;">${time} グループ</h2>
        <div class="table like">
          <div class="row-head" style="display:grid;grid-template-columns:220px repeat(7,1fr);gap:8px;padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#666;">
            <div>部屋 / 速度・アレルギー</div>
            ${dishHeaders.map(h=>`<div>${h}</div>`).join("")}
          </div>
          ${list.map(r=>{
            const tags = [
              r.guest ? `<span class="tag">${r.guest}名</span>` : "",
              r.plan  ? `<span class="tag">${esc(r.plan)}</span>` : "",
              r.allergy ? `<span class="tag warn">アレルギー: ${esc(r.allergy)}</span>` : ""
            ].join("");

            const sweetTag = (r.cake || r.plate)
              ? `<div><span class="tag note">${[r.cake?"ケーキ":null, r.plate?"プレート":null].filter(Boolean).join("・")}</span></div>`
              : `<div class="muted">未</div>`;

            return `
              <div class="room-row" style="display:grid;grid-template-columns:220px repeat(7,1fr);gap:8px;align-items:center;padding:10px;border-bottom:1px dashed #eee;">
                <div><strong>${esc(r.name)}</strong>${tags}</div>
                ${dishHeaders.map((_, idx) => `
                  <div class="cell" data-group="${time}" data-room="${esc(r.name)}" data-col="${idx}" style="text-align:center;">
                    <button class="dotbtn"></button>
                    <div class="dotlabel muted">未</div>
                    ${idx === 6 ? sweetTag : ""}
                  </div>
                `).join("")}
              </div>
            `;
          }).join("")}
        </div>
      `;
    };

    const html =
      groupHtml("18:00", byTime["18:00"]) +
      groupHtml("18:30", byTime["18:30"]) +
      groupHtml("19:00", byTime["19:00"]);

    const root = document.getElementById('boards');
    if(root && html.trim()){
      root.innerHTML = html;

     // ◯ボタンの状態復元＋クリック保存（保存先：dinner.board.v3 文字列）
const st = loadBoardV3() || {};
root.querySelectorAll('.cell').forEach(cell => {
  const btn = cell.querySelector('.dotbtn');
  const label = cell.querySelector('.dotlabel');
  const groupId = cell.dataset.group;       // 例: "18:00"
  const roomId  = cell.dataset.room;        // 例: "やまぶき"
  const colIdx  = Number(cell.dataset.col); // 0〜6

  ensureStateV3(st, groupId, roomId, colIdx);

  // 表示復元：未／発注／提供／HH:MM
  const cur = st[groupId][roomId][colIdx];
  if (label) label.textContent = cur;
  btn.classList.toggle('is-on', cur !== '未');

  btn.addEventListener('click', () => {
    // 直前の状態（最新を読む）
    const curSt = loadBoardV3();
    ensureStateV3(curSt, groupId, roomId, colIdx);
    const prev = curSt[groupId][roomId][colIdx];
    let next = '未';

 // 流れ：未 → 準備 → 発注 → 提供 → 未
if (prev === "未") {
  next = "準備";
} else if (prev === "準備") {
  next = "発注";
} else if (prev === "発注") {
  next = "提供";
} else {
  next = "未";
}

// 押した瞬間の時刻をボタンの下に表示
const cell = btn.closest('td') || btn.parentElement;
let timeLine = cell.querySelector('.js-time');
if (!timeLine) {
  timeLine = document.createElement('div');
  timeLine.className = 'js-time';
  timeLine.style.fontSize = '12px';
  timeLine.style.color = '#666';
  timeLine.style.marginTop = '4px';
  cell.appendChild(timeLine);
}
timeLine.textContent = hhmm(new Date());


    // 保存＆表示更新
    curSt[groupId][roomId][colIdx] = next;
    saveBoardV3(curSt);
    if (label) label.textContent = next;
    btn.classList.toggle('is-on', next !== '未');
  });
});

    }
  }

  // 初期実行
  document.addEventListener('DOMContentLoaded', () => {
    const data = loadSettings();
    if(data) renderFromSettings(data);
  const resetBtn = document.getElementById("btn-reset-today");
  if(resetBtn){
    resetBtn.addEventListener("click", () => {
      if(!confirm("本日の丸の状態をすべて『未』に戻します。よろしいですか？")) return;
      resetBoardStatesToPendingV3();
    });
  }


  });
})();
/* ===== 丸ボタン： 未 → 時間 → 発注 → 提供 のループ ===== */


// 状態を次へ進める
function nextState(cur){
  if (cur === "未") return "時間";     // 次は「時間」（クリックした瞬間の時刻）
  if (cur && /^\d{2}:\d{2}$/.test(cur)) return "発注"; // 「時間」の次は「発注」
  if (cur === "発注") return "提供";   // 次は「提供」
  return "未";                        // それ以外（提供の次など）は「未」に戻す
}

// クリックされた“丸”の近くに小さな表示（タグ）を作る/更新する
function showStateTag(target, text){
  // 同じセル(または近い要素)の中に既存タグがあれば再利用、なければ作成
  let holder = target.closest("td, div, li, section") || target.parentElement;
  if (!holder) holder = target; // 念のため

  let tag = holder.querySelector(".state-tag");
  if (!tag){
    tag = document.createElement("div");
    tag.className = "state-tag";
    // 丸の直後に入れたいので、同じ入れ物の末尾に付ける
    holder.appendChild(tag);
  }
  tag.textContent = text;
}

// 丸っぽい要素の共通セレクタ（ボタンでもdivでも拾えるように広めに指定）
function isCircleLike(el){
  // 既存のクラス名が分からないので、丸に使われがちな候補を広めに
  const cls = (el.className || "") + "";
  return (
    el.tagName === "BUTTON" ||
    cls.includes("dot") || cls.includes("circle") || cls.includes("phase") || cls.includes("status")
  );
}

// boards 領域で“イベント委譲”しておく（後から増える丸にも効く）
const boardsRoot = document.getElementById("boards") || document;
boardsRoot.addEventListener("click", (e) => {
  const t = e.target.closest("button, div, span");
  if(!t || !isCircleLike(t)) return;

  // 現在の状態を読む（data-state に持たせる）
  let cur = t.dataset.state || "未";
  // 次の状態へ
  let nxt = nextState(cur);
  if (nxt === "時間") nxt = hhmm(new Date()); // 「時間」のときは現在時刻を入れる

  // 保存（このページを見ている間だけの簡易保存）
  t.dataset.state = nxt;
  t.setAttribute("aria-label", `状態: ${nxt}`);
  t.title = `状態: ${nxt}`;

  // 画面に小さく表示（丸の近くに出る）
  showStateTag(t, nxt);
});
/* サイクル順 */
const CYCLE = ["準備","発注","提供","未定"];
function nextState(cur){
  const i = CYCLE.indexOf(cur);
  if (i === -1) return CYCLE[0];
  return CYCLE[(i+1) % CYCLE.length];
}

/* そのセルに表示用の行が無ければ作る */
function ensureDisplayLines(cell){
  let stateLine = cell.querySelector('.js-state');
  if(!stateLine){
    stateLine = document.createElement('div');
    stateLine.className = 'js-state';
    stateLine.style.fontSize = '12px';
    stateLine.style.marginTop = '4px';
    cell.appendChild(stateLine);
  }
  let timeLine = cell.querySelector('.js-time');
  if(!timeLine){
    timeLine = document.createElement('div');
    timeLine.className = 'js-time';
    timeLine.style.fontSize = '12px';
    timeLine.style.color = '#666';
    cell.appendChild(timeLine);
  }
  return {stateLine, timeLine};
}

/* クリック（委任）… テーブルがJSで後から描画でもOK */
document.addEventListener('click', (ev)=>{
  const btn = ev.target.closest('.dot, .circle, .round, .btn-round');
  if(!btn) return;

  const cell = btn.closest('td') || btn.parentElement;

  /* 現在→次の状態 */
  const current = btn.dataset.state || "準備";
  const next = nextState(current);
  btn.dataset.state = next;

  /* 表示更新 */
  const {stateLine, timeLine} = ensureDisplayLines(cell);
  const now = new Date();
  stateLine.textContent = (next === "未定") ? "未" : next;
  timeLine.textContent = hhmm(now);
});