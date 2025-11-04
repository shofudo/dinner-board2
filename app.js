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

  /* ===== 進行表（18:00 / 18:30 / 19:00・2段階） ===== */
  const KEY_BOARD = "dinner.board.v2";

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

  document.getElementById("resetToday").addEventListener("click", ()=>{
    if(confirm("本日の進行データを消去します。よろしいですか？")){
      localStorage.removeItem(KEY_BOARD);
      localStorage.removeItem(`board-state.v1:${new Date().toISOString().slice(0,10)}`);

      renderBoards();
    }
  });

  // 初期表示
  renderBoards();
})(); // まとまり終わり
// ==============================
// 本日の設定（today-settings.v1）→ 発注ボード反映
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
  function esc(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

  function renderFromSettings(data){
    const byTime = { "18:00":[], "18:30":[], "19:00":[] };
    for(const r of data.rooms){ if(byTime[r.dinner]) byTime[r.dinner].push(r); }

    const dishHeaders = ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];
    const groupHtml = (time, list) => `
      <h2 style="margin:24px 0 8px 0;">${time} グループ</h2>
      <div class="table like">
        <div class="row-head" style="display:grid;grid-template-columns:220px repeat(7,1fr);gap:8px;padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#666;">
          <div>部屋 / 速度・アレルギー</div>
          ${dishHeaders.map(h=>`<div>${h}</div>`).join("")}
        </div>
        ${list.map(r=>{
          const tags = [
            r.guest ? `<span class="tag">${r.guest}名</span>` : "",
            r.plan ? `<span class="tag">${esc(r.plan)}</span>` : "",
            r.allergy ? `<span class="tag warn">アレルギー: ${esc(r.allergy)}</span>` : ""
          ].join("");
          const sweetTag = (r.cake || r.plate)
            ? `<div><span class="tag note">${[r.cake?"ケーキ":null, r.plate?"プレート":null].filter(Boolean).join("・")}</span></div>`
            : `<div class="muted">未</div>`;
          return `
            <div class="room-row" style="display:grid;grid-template-columns:220px repeat(7,1fr);gap:8px;align-items:center;padding:10px;border-bottom:1px dashed #eee;">
              <div><strong>${esc(r.name)}</strong>${tags}</div>
              ${dishHeaders.slice(0,6).map(()=>`<div style="text-align:center;"><div class="dotbtn"></div><div class="muted">未</div></div>`).join("")}
              <div style="text-align:center;">${sweetTag}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    const html = groupHtml("18:00", byTime["18:00"]) + groupHtml("18:30", byTime["18:30"]) + groupHtml("19:00", byTime["19:00"]);
    const root = document.getElementById('boards');
    if(root && html.trim()) root.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const data = loadSettings();
    if(data) renderFromSettings(data);
  });
})();

// ==============================
// 本日の設定（today-settings.v1）→ 発注ボード反映
// ==============================
(function(){
  function loadSettings(){
    try{
      const raw = localStorage.getItem('today-settings.v1');
      if(!raw) return null;
      const data = JSON.parse(raw);
      if(!data || !Array.isArray(data.rooms)) return null;
      return data;
    }catch(e){ return null; }
  }

  function esc(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

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
            // 部屋名の右に [人数] [プラン] [アレルギー] の小タグ
            const tags = [
              r.guest ? `<span class="tag">${r.guest}名</span>` : "",
              r.plan ? `<span class="tag">${esc(r.plan)}</span>` : "",
              r.allergy ? `<span class="tag warn">アレルギー: ${esc(r.allergy)}</span>` : ""
            ].join("");

            // 甘味のセルに ケーキ/プレート の小タグ
            const sweetTag = (r.cake || r.plate)
              ? `<div><span class="tag note">${[r.cake?"ケーキ":null, r.plate?"プレート":null].filter(Boolean).join("・")}</span></div>`
              : `<div class="muted">未</div>`;

            return `
              <div class="room-row" style="display:grid;grid-template-columns:220px repeat(7,1fr);gap:8px;align-items:center;padding:10px;border-bottom:1px dashed #eee;">
                <div><strong>${esc(r.name)}</strong>${tags}</div>
               ${dishHeaders.slice(0,6).map(()=>`
  <div style="text-align:center;">
    <div class="dotbtn"></div>
    <div class="dotlabel muted">未</div>
  </div>
`).join("")}

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
            // ▼▼▼ ここから追加：クリック状態の保存と復元 ▼▼▼
      const dateKey = data.date || new Date().toISOString().slice(0,10);
      const STATE_KEY = `board-state.v1:${dateKey}`;

      function loadBoardState(){
        try{
          return JSON.parse(localStorage.getItem(STATE_KEY)) || {};
        }catch{ return {}; }
      }
      function saveBoardState(state){
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
      }

      const state = loadBoardState();

      // 行ごとにボタンへイベント付与＆保存済み状態の復元
      root.querySelectorAll('.room-row').forEach(row=>{
        const room = row.querySelector('strong')?.textContent?.trim() || '';
        const btns = row.querySelectorAll('.dotbtn');

        btns.forEach((btn, idx)=>{
          const label = btn.parentElement.querySelector('.dotlabel');
          const key = `${room}:${idx}`;

          // 既存保存の復元
          if(state[key]){
            btn.classList.add('is-on');
            if(label){ label.textContent = '出'; label.classList.remove('muted'); }
          }

          // クリックでトグル＆保存
          btn.addEventListener('click', ()=>{
            const on = btn.classList.toggle('is-on');
            if(label){ label.textContent = on ? '出' : '未'; label.classList.toggle('muted', !on); }
            state[key] = on ? 1 : 0;
            saveBoardState(state);
          });
        });
      });
      // ▲▲▲ ここまで追加 ▲▲▲

    }
  }

  // 初期実行（index.html を開いた時だけ効く）
  document.addEventListener('DOMContentLoaded', () => {
    const data = loadSettings();
    if(data) renderFromSettings(data);
  });
})();
