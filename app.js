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
  
  if (tabInput && tabKitchen) {
    tabInput.addEventListener("click", () => { 
      tabInput.setAttribute("aria-selected","true"); 
      tabKitchen.removeAttribute("aria-selected"); 
      show(viewInput); 
    });
    tabKitchen.addEventListener("click", () => { 
      tabKitchen.setAttribute("aria-selected","true"); 
      tabInput.removeAttribute("aria-selected"); 
      show(viewKitchen); 
    });
  }

  // === 時刻ユーティリティ ===
  function pad2(n){ return String(n).padStart(2,'0'); }
  function hhmm(d){ return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  
  // グローバルに公開
  window.pad2 = pad2;
  window.hhmm = hhmm;

  function addMinutes(d, mins){ return new Date(d.getTime() + mins*60000); }
  function isHHMM(s){ return /^\d{2}:\d{2}$/.test(String(s||'')); }

  /* ===== 進行表 ===== */
  const KEY_BOARD = "dinner.board.v2";
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
  }

  // === 本日データ：丸ボタン状態だけをリセット（改善版） ===
  function resetBoardStatesToPendingV3(){
    const state = loadBoardV3() || {};
    const DISH_KEYS = ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];

    // すべての状態を「未」にリセット
    for(const gid in state){
      for(const rid in state[gid]){
        for(let i=0; i<DISH_KEYS.length; i++){
          state[gid][rid][i] = "未";
        }
      }
    }
    saveBoardV3(state);
    return state;
  }

  window.loadBoardV3 = loadBoardV3;
  window.saveBoardV3 = saveBoardV3;
  window.ensureStateV3 = ensureStateV3;
  window.resetBoardStatesToPendingV3 = resetBoardStatesToPendingV3;

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
    try { 
      const raw = localStorage.getItem(KEY_BOARD); 
      return raw ? JSON.parse(raw) : {}; 
    } catch { 
      return {}; 
    }
  }
  
  function ensureState(state, groupId, roomId, colIdx){
    if(!state[groupId]) state[groupId] = {};
    if(!state[groupId][roomId]) state[groupId][roomId] = {};
    if(typeof state[groupId][roomId][colIdx] !== "number") state[groupId][roomId][colIdx] = 0;
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

  function renderBoardV3(state){
    const container = document.getElementById("boards");
    if (!container) return;
    
    const boardState = state || loadBoard();
    container.innerHTML = GROUPS.map(g => renderGroup(g, boardState)).join("");

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

  window.renderBoardV3 = renderBoardV3;

  // 初期表示
  renderBoardV3();

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
    }catch{ 
      return null; 
    }
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
    
    // プランごとの料理名マッピング
    const planDishNames = {
      'スタンダード': ["吸物", "刺身", "蒸物", "揚物", "煮物", "飯", "甘味"],
      '和牛懐石': ["吸物", "刺身", "蒸物", "揚物", "煮物", "飯", "甘味"],
      'ステーキ': ["吸物", "サラダ", "蒸物", "ステーキ", "煮物", "ご飯", "甘味"],
      'しゃぶしゃぶ': ["果菜盛", "蒸物", "合肴", "しゃぶしゃぶ", "煮物", "ご飯", "甘味"],
      '連泊': ["吸物", "刺身", "蒸物", "揚物", "煮物", "飯", "甘味"]
    };

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

            // プランごとの淡い色分け
            const planColors = {
              'スタンダード': '#e3f2fd',    // 淡い青
              '和牛懐石': '#fff3e0',        // 淡いオレンジ
              'ステーキ': '#fce4ec',        // 淡いピンク
              'しゃぶしゃぶ': '#f3e5f5',    // 淡い紫
              '連泊': '#e8f5e9'             // 淡い緑
            };
            const planBg = planColors[r.plan] || '#f5f5f5';
            const planTextColor = '#555';

            return `
              <div class="room-row" data-plan="${esc(r.plan||'')}" style="display:grid;grid-template-columns:220px repeat(7,1fr);gap:8px;align-items:center;padding:10px;border-bottom:1px dashed #eee;">
                <div><strong>${esc(r.name)}</strong>${tags}</div>
                ${dishHeaders.map((_, idx) => `
                  <div class="cell" data-group="${time}" data-room="${esc(r.name)}" data-col="${idx}" style="text-align:center;">
                    <button class="dotbtn"></button>
                    <div class="dotlabel muted">未</div>
                    ${r.plan ? `<div class="plan-label" style="font-size:10px;color:${planTextColor};background:${planBg};padding:2px 8px;border-radius:6px;margin-top:4px;display:inline-block;">${esc(r.plan)}</div>` : ''}
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

      // ◯ボタンの状態復元＋クリック保存
      const st = loadBoardV3() || {};
      root.querySelectorAll('.cell').forEach(cell => {
        const btn = cell.querySelector('.dotbtn');
        const label = cell.querySelector('.dotlabel');
        const groupId = cell.dataset.group;
        const roomId  = cell.dataset.room;
        const colIdx  = Number(cell.dataset.col);

        ensureStateV3(st, groupId, roomId, colIdx);

        const cur = st[groupId][roomId][colIdx];
        if (label) label.textContent = cur;
        btn.classList.toggle('is-on', cur !== '未');
        
        // data-state属性を設定（CSSで色分けするため）
        btn.setAttribute('data-state', cur);

        btn.addEventListener('click', () => {
          const curSt = loadBoardV3();
          ensureStateV3(curSt, groupId, roomId, colIdx);
          const prev = curSt[groupId][roomId][colIdx];
          let next = '未';

          if (prev === "未") {
            next = "準備";
          } else if (prev === "準備") {
            next = "発注";
          } else if (prev === "発注") {
            next = "提供";
          } else {
            next = "未";
          }

          // 時刻表示
          const cellEl = btn.closest('td') || btn.parentElement;
          let timeLine = cellEl.querySelector('.js-time');
          if (!timeLine) {
            timeLine = document.createElement('div');
            timeLine.className = 'js-time';
            timeLine.style.fontSize = '12px';
            timeLine.style.color = '#666';
            timeLine.style.marginTop = '4px';
            cellEl.appendChild(timeLine);
          }
          timeLine.textContent = hhmm(new Date());

          curSt[groupId][roomId][colIdx] = next;
          saveBoardV3(curSt);
          if (label) label.textContent = next;
          btn.classList.toggle('is-on', next !== '未');
          
          // data-state属性を更新
          btn.setAttribute('data-state', next);
        });
      });
    }
  }

  /* ==== プラン名タグ追加 ==== */
  function addPlanTagsToDots(){
    const rows = document.querySelectorAll('#boards .row, #boards .rowline, #boards .room-row');
    console.log('[planTag] rows=', rows.length);

    if (!rows.length) return;

    rows.forEach(row => {
      let planText = (row.dataset && row.dataset.plan) ? String(row.dataset.plan).trim() : '';

      if(!planText){
        const candidates = [];
        row.querySelectorAll('.js-plan-badge, .badge, [data-plan-label], .tag').forEach(el => {
          const t = (el.textContent || '').trim();
          if (!t) return;
          if (/\d+\s*名$/.test(t)) return;
          if (t.startsWith('アレルギー')) return;
          candidates.push(t);
        });

        const KNOWN = ['スタンダード','和牛懐石','ステーキ','しゃぶしゃぶ','連泊','未選択'];
        planText =
          candidates.find(t => KNOWN.includes(t)) ||
          candidates.sort((a,b)=>b.length-a.length)[0] || '';
      }

      if(!planText){
        console.log('[planTag] ❌ planTextなし row=', row);
        return;
      }
      console.log('[planTag] ✅ planText=', planText, 'row=', row);

      const dots = row.querySelectorAll('.dotbtn, button.dotbtn');
      if(!dots.length) return;

      dots.forEach(dot => {
        if (dot.nextElementSibling?.classList?.contains('plan-tag')) return;

        const tag = document.createElement('span');
        tag.className = 'plan-tag';
        tag.textContent = planText;
        tag.style.fontSize = '10px';
        tag.style.color = '#999';
        tag.style.marginLeft = '4px';
        dot.after(tag);
      });
    });
  }

  // 初期実行
  document.addEventListener('DOMContentLoaded', () => {
    const data = loadSettings();
    if (data) {
      renderFromSettings(data);
    } else {
      renderBoardV3();
    }

    // プランタグ追加
    setTimeout(addPlanTagsToDots, 0);

    const boards = document.getElementById('boards');
    if (boards) {
      const mo = new MutationObserver(() => {
        addPlanTagsToDots();
      });
      mo.observe(boards, { childList: true, subtree: true });
    }

    // === リセットボタン（改善版） ===
    const resetBtn = document.getElementById("btn-reset-today");
    if(resetBtn){
      resetBtn.addEventListener("click", () => {
        if (!confirm("本日の丸ボタンの状態をすべて『未』に戻します。よろしいですか？")) return;

        // 状態をリセット
        const state = resetBoardStatesToPendingV3();
        
        // 古い形式のデータも削除
        localStorage.removeItem("dinner.board.v2");
        localStorage.removeItem(`board-state.v1:${new Date().toISOString().slice(0,10)}`);

        // 画面を再描画
        const currentData = loadSettings();
        if (currentData) {
          renderFromSettings(currentData);
          alert('リセットしました！すべての丸ボタンが「未」になりました。');
        } else {
          renderBoardV3(state);
          alert('リセットしました！すべての丸ボタンが「未」になりました。');
        }
      });
    }
  });

})();
