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

  // === 本日データ:丸ボタン状態だけをリセット（改善版） ===
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

  // スタッフポップアップ表示関数
  function showStaffPopup(groupId, roomId, colIdx, callback) {
    const settings = loadSettings();
    const staffList = settings?.staff || ['真弓', 'ミン', 'ボビ', 'サラミ', 'パビ', '翔平'];
    
    // カスタムスタッフが設定されている場合は追加
    if (settings?.customStaff) {
      staffList.push(settings.customStaff);
    }

    const popup = document.createElement('div');
    popup.className = 'staff-popup-overlay';
    popup.innerHTML = `
      <div class="staff-popup">
        <h3>提供スタッフを選択</h3>
        <div class="staff-list">
          ${staffList.map(staff => `
            <button class="staff-btn" data-staff="${esc(staff)}">${esc(staff)}</button>
          `).join('')}
        </div>
        <button class="staff-cancel">キャンセル</button>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelectorAll('.staff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const staff = btn.dataset.staff;
        callback(staff);
        document.body.removeChild(popup);
      });
    });

    popup.querySelector('.staff-cancel').addEventListener('click', () => {
      document.body.removeChild(popup);
    });
  }

  // ウェルダン選択ポップアップ表示関数
  function showWelldonePopup(groupId, roomId, colIdx, callback) {
    const popup = document.createElement('div');
    popup.className = 'welldone-popup-overlay';
    popup.innerHTML = `
      <div class="welldone-popup">
        <h3>ウェルダンの人数を選択</h3>
        <div class="welldone-list">
          <button class="welldone-btn" data-count="0">なし</button>
          <button class="welldone-btn" data-count="1">W×1名</button>
          <button class="welldone-btn" data-count="2">W×2名</button>
          <button class="welldone-btn" data-count="3">W×3名</button>
          <button class="welldone-btn" data-count="4">W×4名</button>
          <button class="welldone-btn" data-count="5">W×5名</button>
        </div>
        <button class="welldone-cancel">キャンセル</button>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelectorAll('.welldone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const count = Number(btn.dataset.count);
        callback(count);
        document.body.removeChild(popup);
      });
    });

    popup.querySelector('.welldone-cancel').addEventListener('click', () => {
      callback(null);
      document.body.removeChild(popup);
    });
  }

  // 食事スピード変更機能
  function createSpeedSelector(groupId, roomId) {
    const speeds = ['とてもはやい', 'はやい', '普通', 'おそい', 'とてもおそい'];
    const storageKey = `speed-${groupId}-${roomId}`;
    const saved = localStorage.getItem(storageKey) || '普通';

    const selector = document.createElement('select');
    selector.className = 'speed-selector';
    speeds.forEach(speed => {
      const option = document.createElement('option');
      option.value = speed;
      option.textContent = speed;
      if (speed === saved) option.selected = true;
      selector.appendChild(option);
    });

    selector.addEventListener('change', () => {
      localStorage.setItem(storageKey, selector.value);
    });

    return selector;
  }

  function renderFromSettings(data){
    const byTime = { "18:00":[], "18:30":[], "19:00":[] };
    for(const r of data.rooms){
      if(byTime[r.dinner]) byTime[r.dinner].push(r);
    }

    // プランごとの料理名マッピング
    const planDishNames = {
      'スタンダード': ["吸物", "果菜盛", "蒸物", "揚物", "煮物", "ご飯", "甘味"],
      '和牛懐石': ["吸物", "果菜盛", "すき焼き", "フライ", "ステーキ", "ご飯", "甘味"],
      'ステーキ': ["吸物", "果菜盛", "蒸物", "揚物", "ステーキ", "ご飯", "甘味"],
      'しゃぶしゃぶ': ["吸物", "果菜盛", "しゃぶしゃぶ", "蒸物", "揚物", "ご飯", "甘味"],
      '連泊': ["茶碗蒸し", "牛たたき", "焼物", "小鉢", "揚物", "ご飯", "甘味"]
    };

    // プランごとの背景色
    const planColors = {
      'スタンダード': '#E3F2FD',
      '和牛懐石': '#FFEBEE',
      'ステーキ': '#FFF3E0',
      'しゃぶしゃぶ': '#E8F5E9',
      '連泊': '#F3E5F5'
    };

    // プランごとのタグ色
    const planTagColors = {
      'スタンダード': { bg: '#2196F3', color: '#fff' },
      '和牛懐石': { bg: '#F44336', color: '#fff' },
      'ステーキ': { bg: '#FF9800', color: '#fff' },
      'しゃぶしゃぶ': { bg: '#4CAF50', color: '#fff' },
      '連泊': { bg: '#9C27B0', color: '#fff' }
    };

    const groupHtml = (time, list, isLast) => {
      return `
        <div class="time-group" style="border-bottom: ${isLast ? 'none' : '2px solid #e0e0e0'}; padding-bottom: 16px; margin-bottom: ${isLast ? '0' : '16px'};">
          <h2 class="time-group-header" style="margin:8px 0 12px 0; font-size:14px; color:#999; font-weight:normal;">${time}</h2>
          <div class="table like">
            <div class="row-head" style="display:grid;grid-template-columns:240px repeat(7,1fr);gap:8px;padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#666;">
              <div>部屋 / スピード</div>
              <div>吸物</div><div>刺身</div><div>蒸物</div><div>揚物</div><div>煮物</div><div>飯</div><div>甘味</div>
            </div>
            ${list.map(r=>{
              const planBg = planColors[r.plan] || '#f5f5f5';
              const tagColor = planTagColors[r.plan] || { bg: '#757575', color: '#fff' };
              
              // 人数タグを大きく表示
              const guestTag = r.guest ? `<span class="guest-tag" style="display:inline-block; font-size:18px; font-weight:bold; padding:4px 12px; margin-right:8px; background:${tagColor.bg}; color:${tagColor.color}; border-radius:6px;">${r.guest}名</span>` : "";
              
              // プランタグ
              const planTag = r.plan ? `<span class="plan-tag" style="display:inline-block; font-size:13px; padding:3px 10px; margin-right:6px; background:${tagColor.bg}; color:${tagColor.color}; border-radius:4px;">${esc(r.plan)}</span>` : "";

              // プランごとの料理名を取得
              const dishNames = r.plan && planDishNames[r.plan] ? planDishNames[r.plan] : ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];

              // ケーキ・プレート表示
              let sweetTag = '';
              if (r.plan && (r.cake || r.plate)) {
                sweetTag = `<div style="margin-top:4px;"><span class="tag note" style="font-size:11px;">${[r.cake?"ケーキ":null, r.plate?"プレート":null].filter(Boolean).join("・")}</span></div>`;
              }

              // 食事スピードセレクター
              const speedSelector = `<div class="speed-wrap" style="margin-top:6px;"></div>`;

              return `
                <div class="room-row" data-plan="${esc(r.plan||'')}" style="display:grid;grid-template-columns:240px repeat(7,1fr);gap:8px;align-items:center;padding:12px 10px;border-bottom:1px dashed #eee;background:${planBg};">
                  <div>
                    <div style="margin-bottom:8px;">
                      ${guestTag}${planTag}
                    </div>
                    <div><strong style="font-size:15px;">${esc(r.name)}</strong></div>
                    ${speedSelector}
                  </div>
                  ${dishNames.map((dishName, idx) => {
                    const dishKey = dishName;
                    
                    // この料理に該当するアレルギーを収集
                    let allergyNotes = [];
                    if (r.allergies && Array.isArray(r.allergies)) {
                      r.allergies.forEach(allergy => {
                        // 料理名のマッピング（本日の設定で使われる名称 → 実際の料理名）
                        const dishMapping = {
                          '吸物': '吸物',
                          '果菜盛': '刺身',
                          '蒸物': '蒸物',
                          '揚物': '揚物',
                          '煮物': '煮物',
                          '飯': '飯',
                          '甘味': '甘味'
                        };
                        
                        // この料理がアレルギーの対象かチェック
                        if (allergy.targets && allergy.targets.length > 0) {
                          allergy.targets.forEach(target => {
                            if (dishMapping[target] === dishName) {
                              allergyNotes.push(allergy.name);
                            }
                          });
                        }
                      });
                    }
                    
                    // アレルギー表示用HTML（丸ボタンの下に表示）
                    const allergyDisplay = allergyNotes.length > 0 
                      ? `<div class="allergy-display" style="font-size:10px;margin-top:2px;color:#d32f2f;font-weight:bold;">${allergyNotes.join('・')}NG</div>`
                      : '';
                    
                    return `
                      <div class="cell" data-group="${time}" data-room="${esc(r.name)}" data-col="${idx}" data-dish="${esc(dishKey)}" style="text-align:center;">
                        <div class="dishname" style="font-size:11px;min-height:18px;margin-bottom:4px;color:#666;">${dishName}</div>
                        <button class="dotbtn"></button>
                        ${allergyDisplay}
                        <div class="welldone-display" style="font-size:10px;margin-top:2px;color:#d32f2f;display:none;"></div>
                        <div class="staff-display" style="font-size:10px;margin-top:2px;color:#1976d2;display:none;"></div>
                        ${idx === 6 ? sweetTag : ""}
                      </div>
                    `;
                  }).join("")}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    };

    const times = ["18:00", "18:30", "19:00"];
    const html = times.map((time, idx) => 
      groupHtml(time, byTime[time], idx === times.length - 1)
    ).join("");

    const root = document.getElementById('boards');
    if(root && html.trim()){
      root.innerHTML = html;

      // 食事スピードセレクターを各部屋に追加
      root.querySelectorAll('.room-row').forEach(row => {
        const speedWrap = row.querySelector('.speed-wrap');
        if (speedWrap) {
          const roomName = row.querySelector('strong').textContent;
          const timeGroup = row.closest('.time-group').querySelector('.time-group-header').textContent;
          const selector = createSpeedSelector(timeGroup, roomName);
          speedWrap.appendChild(selector);
        }
      });

      // ◯ボタンの状態復元＋クリック保存
      const st = loadBoardV3() || {};
      root.querySelectorAll('.cell').forEach(cell => {
        const btn = cell.querySelector('.dotbtn');
        const welldoneDisplay = cell.querySelector('.welldone-display');
        const staffDisplay = cell.querySelector('.staff-display');
        const groupId = cell.dataset.group;
        const roomId  = cell.dataset.room;
        const colIdx  = Number(cell.dataset.col);
        const dishName = cell.dataset.dish;

        ensureStateV3(st, groupId, roomId, colIdx);

        // ウェルダン情報の復元
        if (!st[groupId][roomId].welldone) {
          st[groupId][roomId].welldone = {};
        }
        const welldoneCount = st[groupId][roomId].welldone[colIdx] || 0;
        if (welldoneCount > 0 && welldoneDisplay) {
          welldoneDisplay.textContent = `W×${welldoneCount}名`;
          welldoneDisplay.style.display = 'block';
        }

        // スタッフ情報の復元
        if (!st[groupId][roomId].staff) {
          st[groupId][roomId].staff = {};
        }
        const staffName = st[groupId][roomId].staff[colIdx];
        if (staffName && staffDisplay) {
          staffDisplay.textContent = staffName;
          staffDisplay.style.display = 'block';
        }

        const cur = st[groupId][roomId][colIdx];
        
        // ボタン内に文字を表示
        btn.textContent = cur;
        btn.setAttribute('data-state', cur);

        btn.addEventListener('click', () => {
          const curSt = loadBoardV3();
          ensureStateV3(curSt, groupId, roomId, colIdx);
          const prev = curSt[groupId][roomId][colIdx];
          let next = '未';

          // 果菜盛りとしゃぶしゃぶは3段階（未→待→済）
          const isSimpleDish = dishName === '果菜盛' || dishName === 'しゃぶしゃぶ';

          if (isSimpleDish) {
            // 3段階遷移: 未→待→済→未
            if (prev === "未") {
              next = "待";
            } else if (prev === "待") {
              next = "済";
              // 済になったときスタッフ選択
              showStaffPopup(groupId, roomId, colIdx, (staff) => {
                const st = loadBoardV3();
                if (!st[groupId][roomId].staff) st[groupId][roomId].staff = {};
                st[groupId][roomId].staff[colIdx] = staff;
                saveBoardV3(st);
                if (staffDisplay) {
                  staffDisplay.textContent = staff;
                  staffDisplay.style.display = 'block';
                }
              });
            } else {
              next = "未";
              // 未に戻したらスタッフ情報削除
              const st = loadBoardV3();
              if (st[groupId][roomId].staff) {
                delete st[groupId][roomId].staff[colIdx];
              }
              if (staffDisplay) {
                staffDisplay.textContent = '';
                staffDisplay.style.display = 'none';
              }
            }
          } else {
            // 4段階遷移: 未→待→注→済→未
            if (prev === "未") {
              next = "待";
              // 煮物の場合、待になったときウェルダン選択
              if (dishName === '煮物' || dishName === 'ステーキ') {
                showWelldonePopup(groupId, roomId, colIdx, (count) => {
                  if (count !== null) {
                    const st = loadBoardV3();
                    if (!st[groupId][roomId].welldone) st[groupId][roomId].welldone = {};
                    st[groupId][roomId].welldone[colIdx] = count;
                    saveBoardV3(st);
                    if (welldoneDisplay) {
                      welldoneDisplay.textContent = count > 0 ? `W×${count}名` : '';
                      welldoneDisplay.style.display = count > 0 ? 'block' : 'none';
                    }
                  }
                });
              }
            } else if (prev === "待") {
              next = "注";
            } else if (prev === "注") {
              next = "済";
              // 済になったときスタッフ選択
              showStaffPopup(groupId, roomId, colIdx, (staff) => {
                const st = loadBoardV3();
                if (!st[groupId][roomId].staff) st[groupId][roomId].staff = {};
                st[groupId][roomId].staff[colIdx] = staff;
                saveBoardV3(st);
                if (staffDisplay) {
                  staffDisplay.textContent = staff;
                  staffDisplay.style.display = 'block';
                }
              });
            } else {
              next = "未";
              // 未に戻したらウェルダンとスタッフ情報削除
              const st = loadBoardV3();
              if (st[groupId][roomId].welldone) {
                delete st[groupId][roomId].welldone[colIdx];
              }
              if (st[groupId][roomId].staff) {
                delete st[groupId][roomId].staff[colIdx];
              }
              if (welldoneDisplay) {
                welldoneDisplay.textContent = '';
                welldoneDisplay.style.display = 'none';
              }
              if (staffDisplay) {
                staffDisplay.textContent = '';
                staffDisplay.style.display = 'none';
              }
            }
          }

          // 時刻表示
          const cellEl = btn.closest('td') || btn.parentElement;
          let timeLine = cellEl.querySelector('.js-time');
          if (!timeLine) {
            timeLine = document.createElement('div');
            timeLine.className = 'js-time';
            timeLine.style.fontSize = '10px';
            timeLine.style.color = '#999';
            timeLine.style.marginTop = '2px';
            cellEl.appendChild(timeLine);
          }
          timeLine.textContent = hhmm(new Date());

          curSt[groupId][roomId][colIdx] = next;
          saveBoardV3(curSt);
          
          // ボタン内の文字を更新
          btn.textContent = next;
          btn.setAttribute('data-state', next);
        });
      });
    }
  }

  /* ==== プラン名タグ追加機能は無効化（料理名の下に直接表示するため不要） ==== */
  function addPlanTagsToDots(){
    // この機能は使用しない
    return;
  }

  // 初期実行
  document.addEventListener('DOMContentLoaded', () => {
    const data = loadSettings();
    if (data) {
      renderFromSettings(data);
    } else {
      renderBoardV3();
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
