// まとまり開始(IIFE)
(() => {
  // バージョン確認用(キャッシュ問題のデバッグ)
  const APP_VERSION = '2024-11-08-v3';
  console.log(`🎯 app.jsバージョン: ${APP_VERSION}`);
  console.log('📅 読み込み時刻:', new Date().toLocaleString('ja-JP'));
  
  // === 料理名の読み仮名マップ ===
  const DISH_READINGS = {
    "吸物": "すいもの",
    "すいもの": "すいもの",
    "刺身": "さしみ",
    "さしみ": "さしみ",
    "蒸物": "むしもの",
    "むしもの": "むしもの",
    "揚物": "あげもの",
    "あげもの": "あげもの",
    "煮物": "にもの",
    "にもの": "にもの",
    "飯": "めし・ごはん",
    "ご飯": "ごはん",
    "甘味": "あまみ・デザート",
    "デザート": "デザート",
    "果菜盛": "かなもり",
    "かなもり": "かなもり",
    "しゃぶしゃぶ": "しゃぶしゃぶ",
    "ステーキ": "ステーキ",
    "単品ステーキ": "たんぴんステーキ"
  };

  // === 追加料理を挿入する関数 ===
  function insertExtraDishes(baseDishes, extraDishes, roomName) {
    if (!extraDishes || !Array.isArray(extraDishes) || extraDishes.length === 0) {
      return baseDishes;
    }
    
    const result = [...baseDishes];
    const positionMapping = {
      "果菜盛の前": "果菜盛",
      "蒸物の前": "蒸物",
      "揚物の前": "揚物", 
      "煮物の前": "煮物",
      "御飯の前": "ご飯",
      "甘味の前": "甘味"
    };
    
    // 追加料理を逆順で処理（後ろから挿入すると位置がずれない）
    for (let i = extraDishes.length - 1; i >= 0; i--) {
      const dish = extraDishes[i];
      
      // この部屋に表示する追加料理かチェック
      if (!dish.rooms || !dish.rooms.includes(roomName)) {
        continue;
      }
      
      if (!dish.name || !dish.position) {
        continue;
      }
      
      // 挿入位置を特定
      const targetDish = positionMapping[dish.position];
      const insertIndex = result.findIndex(d => d === targetDish);
      
      if (insertIndex !== -1) {
        // 指定位置の前に挿入
        result.splice(insertIndex, 0, dish.name);
      }
    }
    
    return result;
  }
  
  // グローバルに公開
  window.insertExtraDishes = insertExtraDishes;
  
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
        // 各料理の状態を「未」に戻す
        for(let i=0; i<DISH_KEYS.length; i++){
          state[gid][rid][i] = "未";
        }
        // ウェルダン情報を削除
        if (state[gid][rid].welldone) {
          delete state[gid][rid].welldone;
        }
        // スタッフ情報を削除
        if (state[gid][rid].staff) {
          delete state[gid][rid].staff;
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

  // 待ち時間選択ポップアップ表示関数
  function showWaitTimePopup(groupId, roomId, colIdx, callback) {
    const popup = document.createElement('div');
    popup.className = 'staff-popup-overlay'; // スタッフポップアップと同じスタイルを使用
    popup.innerHTML = `
      <div class="staff-popup">
        <h3>待ち時間を選択</h3>
        <div class="staff-list">
          <button class="staff-btn" data-minutes="5">+5分</button>
          <button class="staff-btn" data-minutes="10">+10分</button>
          <button class="staff-btn" data-minutes="15">+15分</button>
          <button class="staff-btn" data-minutes="20">+20分</button>
          <button class="staff-btn" data-minutes="25">+25分</button>
          <button class="staff-btn" data-minutes="30">+30分</button>
          <button class="staff-btn" data-minutes="voice">声がけ</button>
        </div>
        <button class="staff-cancel">キャンセル</button>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelectorAll('.staff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = btn.dataset.minutes;
        callback(minutes);
        document.body.removeChild(popup);
      });
    });

    popup.querySelector('.staff-cancel').addEventListener('click', () => {
      callback(null);
      document.body.removeChild(popup);
    });
  }

  // 選択した待ち時間から表示時刻を計算する関数
  function calculateWaitTime(minutes) {
    if (minutes === 'voice') {
      return '声がけ';
    }
    
    const now = new Date();
    const targetTime = new Date(now.getTime() + parseInt(minutes) * 60000);
    return hhmm(targetTime);
  }

  // 食事スピード選択ポップアップ表示関数
  function showSpeedPopup(groupId, roomId, callback) {
    // 7段階のスピード設定（VF: Very Fast, F: Fast, LF: Little Fast, N: Normal, LS: Little Slow, S: Slow, VS: Very Slow）
    const speeds = [
      { value: 'VF', label: 'VF (とても早い)', color: '#d32f2f' },
      { value: 'F', label: 'F (早い)', color: '#e57373' },
      { value: 'LF', label: 'LF (少し早い)', color: '#ffb74d' },
      { value: 'N', label: 'N (普通)', color: '#ffffff' },
      { value: 'LS', label: 'LS (少し遅い)', color: '#81d4fa' },
      { value: 'S', label: 'S (遅い)', color: '#64b5f6' },
      { value: 'VS', label: 'VS (とても遅い)', color: '#42a5f5' }
    ];

    const popup = document.createElement('div');
    popup.className = 'staff-popup-overlay';
    popup.innerHTML = `
      <div class="staff-popup">
        <h3>食事スピードを選択</h3>
        <div class="staff-list" style="grid-template-columns: 1fr;">
          ${speeds.map(speed => `
            <button class="staff-btn speed-btn" data-speed="${speed.value}" 
                    style="background: ${speed.color}; border-color: ${speed.value === 'N' ? '#ccc' : speed.color}; 
                           color: ${['VF', 'F', 'S', 'VS'].includes(speed.value) ? '#fff' : '#333'};">
              ${speed.label}
            </button>
          `).join('')}
        </div>
        <button class="staff-cancel">キャンセル</button>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = btn.dataset.speed;
        callback(speed);
        document.body.removeChild(popup);
      });
    });

    popup.querySelector('.staff-cancel').addEventListener('click', () => {
      document.body.removeChild(popup);
    });
  }

  // 食事スピード変更機能（ポップアップ形式）
  function createSpeedSelector(groupId, roomId) {
    const storageKey = `speed-${groupId}-${roomId}`;
    const saved = localStorage.getItem(storageKey) || 'N';

    // スピードと色のマッピング
    const speedColors = {
      'VF': { bg: '#d32f2f', text: '#fff', border: '#d32f2f' },
      'F': { bg: '#e57373', text: '#fff', border: '#e57373' },
      'LF': { bg: '#ffb74d', text: '#333', border: '#ffb74d' },
      'N': { bg: '#ffffff', text: '#333', border: '#ccc' },
      'LS': { bg: '#81d4fa', text: '#333', border: '#81d4fa' },
      'S': { bg: '#64b5f6', text: '#fff', border: '#64b5f6' },
      'VS': { bg: '#42a5f5', text: '#fff', border: '#42a5f5' }
    };

    const container = document.createElement('div');
    container.className = 'speed-selector-container';
    container.style.cssText = 'margin-top: 6px;';

    const button = document.createElement('button');
    button.className = 'speed-display-btn';
    const currentColor = speedColors[saved] || speedColors['N'];
    button.style.cssText = `
      font-size: 13px;
      padding: 6px 16px;
      border: 2px solid ${currentColor.border};
      border-radius: 6px;
      background: ${currentColor.bg};
      color: ${currentColor.text};
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    button.textContent = saved;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    button.addEventListener('click', () => {
      showSpeedPopup(groupId, roomId, (newSpeed) => {
        localStorage.setItem(storageKey, newSpeed);
        const newColor = speedColors[newSpeed] || speedColors['N'];
        button.style.background = newColor.bg;
        button.style.color = newColor.text;
        button.style.borderColor = newColor.border;
        button.textContent = newSpeed;
      });
    });

    container.appendChild(button);
    return container;
  }

  // メモ入力欄を作成する関数
  function createMemoInput(groupId, roomId) {
    const storageKey = `memo-${groupId}-${roomId}`;
    const saved = localStorage.getItem(storageKey) || '';

    const container = document.createElement('div');
    container.className = 'memo-input-container';
    container.style.cssText = 'display:inline-flex;align-items:center;';

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 10;
    input.value = saved;
    input.placeholder = '※メモ';
    input.style.cssText = `
      font-size: 12px;
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fff;
      width: 120px;
      transition: all 0.2s;
    `;

    // フォーカス時のスタイル
    input.addEventListener('focus', () => {
      input.style.borderColor = '#667eea';
      input.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.2)';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = '#ddd';
      input.style.boxShadow = 'none';
    });

    // 入力内容を保存
    input.addEventListener('input', () => {
      localStorage.setItem(storageKey, input.value);
    });

    container.appendChild(input);
    return container;
  }

  function renderFromSettings(data){
    // 追加料理データを読み込む
    let extraDishes = [];
    try {
      const raw = localStorage.getItem('extra-dishes.v1');
      if (raw) {
        extraDishes = JSON.parse(raw);
      }
    } catch(e) {
      console.error('追加料理の読み込みに失敗:', e);
    }
    
    // データに追加料理を含める
    data.extraDishes = extraDishes;
    
    const byTime = { "18:00":[], "18:30":[], "19:00":[] };
    for(const r of data.rooms){
      // startTimeプロパティを追加(dinnerと同じ値)
      r.startTime = r.dinner;
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
        <div class="time-group" style="border-bottom: ${isLast ? 'none' : '1px solid #e0e0e0'}; padding-bottom: 8px; margin-bottom: ${isLast ? '0' : '8px'};">
          <h2 class="time-group-header" style="margin:4px 0 6px 0; font-size:13px; color:#999; font-weight:normal;">${time}</h2>
          <div class="table like">
            ${list.map(r=>{
              const planBg = planColors[r.plan] || '#f5f5f5';
              const tagColor = planTagColors[r.plan] || { bg: '#757575', color: '#fff' };
              
              // 人数タグを大きく表示
              const guestTag = r.guest ? `<span class="guest-tag" style="display:inline-block; font-size:20px; font-weight:900; padding:4px 12px; background:${tagColor.bg}; color:${tagColor.color}; border-radius:6px;">${r.guest}名</span>` : "";
              
              // プランタグ
              const planTag = r.plan ? `<span class="plan-tag" style="display:inline-block; font-size:11px; padding:2px 8px; background:${tagColor.bg}; color:${tagColor.color}; border-radius:4px;">${esc(r.plan)}</span>` : "";

              // プランごとの料理名を取得
              const baseDishes = r.plan && planDishNames[r.plan] ? planDishNames[r.plan] : ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];
              
              // 追加料理を挿入
              const dishNames = insertExtraDishes(baseDishes, data.extraDishes, r.name);
              
              // 部屋データにdishNamesを保存(キッチン表示で使用)
              r.dishNames = dishNames;
              
              // どの料理が追加料理かを判定するためのセット
              const extraDishNames = new Set(data.extraDishes?.map(d => d.name) || []);

              // ケーキ・プレート表示
              let sweetTag = '';
              if (r.plan && (r.cake || r.plate)) {
                sweetTag = `<span class="tag note" style="font-size:11px; margin-left:6px;">${[r.cake?"ケーキ":null, r.plate?"プレート":null].filter(Boolean).join("・")}</span>`;
              }

              // 食事スピードセレクター（プレースホルダー）
              const speedSelector = `<div class="speed-wrap"></div>`;
              
              // メモ欄（プレースホルダー）
              const memoArea = `<div class="memo-wrap"></div>`;

              // グリッド列数を動的に調整（240px + 料理数×1fr）
              const gridColumns = `240px repeat(${dishNames.length},1fr)`;

              return `
                <div class="room-row" data-plan="${esc(r.plan||'')}" data-room-name="${esc(r.name)}" data-time-group="${time}" style="display:grid;grid-template-columns:${gridColumns};gap:6px;align-items:center;padding:6px 8px;border-bottom:1px dashed #eee;background:${planBg};">
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                      ${speedSelector}
                      <strong style="font-size:20px;font-weight:900;">${esc(r.name)}</strong>
                      ${guestTag}
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                      ${planTag}
                      ${sweetTag}
                      ${memoArea}
                    </div>
                  </div>
                  ${dishNames.map((dishName, idx) => {
                    const dishKey = dishName;
                    const isExtraDish = extraDishNames.has(dishName);
                    
                    // この料理に該当するアレルギーを収集
                    let allergyNotes = [];
                    if (r.allergies && Array.isArray(r.allergies)) {
                      r.allergies.forEach(allergy => {
                        // 料理名のマッピング（本日の設定で使われる名称 → 実際の料理名）
                        const dishMapping = {
                          '吸物': '吸物',
                          '果菜盛': '果菜盛',
                          '蒸物': '蒸物',
                          '揚物': '揚物',
                          '煮物': '煮物',
                          '飯': 'ご飯',
                          'ご飯': 'ご飯',
                          '甘味': '甘味',
                          // プラン別の追加料理
                          'ステーキ': 'ステーキ',
                          'しゃぶしゃぶ': 'しゃぶしゃぶ',
                          '茶碗蒸し': '茶碗蒸し',
                          '牛たたき': '牛たたき',
                          '焼物': '焼物',
                          '小鉢': '小鉢',
                          'フライ': 'フライ',
                          'すき焼き': 'すき焼き',
                          '単品ステーキ': '単品ステーキ'
                        
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
                    
                    // 追加料理は四角ボタン、通常料理は丸ボタン
                    const buttonClass = isExtraDish ? 'squarebtn' : 'dotbtn';
                    
                    return `
                      <div class="cell" data-group="${time}" data-room="${esc(r.name)}" data-col="${idx}" data-dish="${esc(dishKey)}" data-extra="${isExtraDish}" style="text-align:center;">
                        <div class="dishname" style="font-size:10px;min-height:12px;margin-bottom:2px;color:#666;">${dishName}</div>
                        <button class="${buttonClass}"></button>
                        ${allergyDisplay}
                        <div class="welldone-display" style="font-size:10px;margin-top:2px;color:#d32f2f;display:none;"></div>
                        <div class="staff-display" style="font-size:10px;margin-top:2px;color:#1976d2;display:none;"></div>
                        ${idx === dishNames.length - 1 && dishName === '甘味' ? sweetTag : ""}
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

      // 食事スピードセレクターとメモ欄を各部屋に追加
      root.querySelectorAll('.room-row').forEach(row => {
        const speedWrap = row.querySelector('.speed-wrap');
        const memoWrap = row.querySelector('.memo-wrap');
        const roomName = row.dataset.roomName;
        const timeGroup = row.dataset.timeGroup;
        
        if (speedWrap && roomName && timeGroup) {
          const selector = createSpeedSelector(timeGroup, roomName);
          speedWrap.appendChild(selector);
        }
        
        // メモ欄を追加
        if (memoWrap && roomName && timeGroup) {
          const memoInput = createMemoInput(timeGroup, roomName);
          memoWrap.appendChild(memoInput);
        }
      });

      // ◯ボタンと□ボタンの状態復元＋クリック保存
      const st = loadBoardV3() || {};
      root.querySelectorAll('.cell').forEach(cell => {
        const btn = cell.querySelector('.dotbtn, .squarebtn');
        if (!btn) return; // ボタンがない場合はスキップ
        
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

        // 待ち時間情報の復元
        if (!st[groupId][roomId].waitTime) {
          st[groupId][roomId].waitTime = {};
        }
        const waitTimeMinutes = st[groupId][roomId].waitTime[colIdx];
        
        const cur = st[groupId][roomId][colIdx];
        
        // 待ち時間表示を復元(「待」状態の場合)
        if (cur === '待' && waitTimeMinutes) {
          const cellEl = cell;
          let timeLine = cellEl.querySelector('.js-time');
          if (!timeLine) {
            timeLine = document.createElement('div');
            timeLine.className = 'js-time';
            cellEl.appendChild(timeLine);
          }
          
          const displayTime = calculateWaitTime(waitTimeMinutes);
          timeLine.textContent = displayTime;
          timeLine.style.fontSize = '16px';
          timeLine.style.color = '#d32f2f';
          timeLine.style.fontWeight = 'bold';
          timeLine.style.marginTop = '4px';
          timeLine.style.cursor = 'pointer';
          
          // クリックで再選択できるようにする
          timeLine.onclick = (e) => {
            e.stopPropagation();
            showWaitTimePopup(groupId, roomId, colIdx, (minutes) => {
              if (minutes !== null) {
                const st = loadBoardV3();
                if (!st[groupId][roomId].waitTime) st[groupId][roomId].waitTime = {};
                st[groupId][roomId].waitTime[colIdx] = minutes;
                saveBoardV3(st);
                
                const displayTime = calculateWaitTime(minutes);
                timeLine.textContent = displayTime;
              }
            });
          };
        }
        
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
              // 待になったとき時間選択ポップアップを表示
              showWaitTimePopup(groupId, roomId, colIdx, (minutes) => {
                if (minutes !== null) {
                  const st = loadBoardV3();
                  if (!st[groupId][roomId].waitTime) st[groupId][roomId].waitTime = {};
                  st[groupId][roomId].waitTime[colIdx] = minutes;
                  saveBoardV3(st);
                  
                  // 時刻表示を更新
                  const cellEl = btn.closest('td') || btn.parentElement;
                  let timeLine = cellEl.querySelector('.js-time');
                  if (timeLine) {
                    const displayTime = calculateWaitTime(minutes);
                    timeLine.textContent = displayTime;
                    // 待の状態の時間表示を大きく赤色に
                    timeLine.style.fontSize = '16px';
                    timeLine.style.color = '#d32f2f';
                    timeLine.style.fontWeight = 'bold';
                    timeLine.style.marginTop = '4px';
                  }
                }
              });
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
              // 未に戻したらスタッフ情報と待ち時間削除
              const st = loadBoardV3();
              if (st[groupId][roomId].staff) {
                delete st[groupId][roomId].staff[colIdx];
              }
              if (st[groupId][roomId].waitTime) {
                delete st[groupId][roomId].waitTime[colIdx];
              }
              saveBoardV3(st);
              if (staffDisplay) {
                staffDisplay.textContent = '';
                staffDisplay.style.display = 'none';
              }
            }
          } else {
            // 煮物とステーキは5段階遷移: 未→肉→待→注→済→未
            // その他は4段階遷移: 未→待→注→済→未
            const isMeatDish = dishName === '煮物' || dishName === 'ステーキ';
            
            if (isMeatDish) {
              // === 肉料理の5段階遷移 ===
              if (prev === "未") {
                next = "肉";
                // 肉になったとき時間選択ポップアップを表示
                showWaitTimePopup(groupId, roomId, colIdx, (minutes) => {
                  if (minutes !== null) {
                    const st = loadBoardV3();
                    if (!st[groupId][roomId].waitTime) st[groupId][roomId].waitTime = {};
                    st[groupId][roomId].waitTime[colIdx] = minutes;
                    saveBoardV3(st);
                  }
                });
              } else if (prev === "肉") {
                next = "待";
                // 待になったとき、ウェルダン選択ポップアップを表示
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
                // 未に戻したらウェルダン、スタッフ情報、待ち時間を削除
                const st = loadBoardV3();
                if (st[groupId][roomId].welldone) {
                  delete st[groupId][roomId].welldone[colIdx];
                }
                if (st[groupId][roomId].staff) {
                  delete st[groupId][roomId].staff[colIdx];
                }
                if (st[groupId][roomId].waitTime) {
                  delete st[groupId][roomId].waitTime[colIdx];
                }
                saveBoardV3(st);
                if (welldoneDisplay) {
                  welldoneDisplay.textContent = '';
                  welldoneDisplay.style.display = 'none';
                }
                if (staffDisplay) {
                  staffDisplay.textContent = '';
                  staffDisplay.style.display = 'none';
                }
              }
            } else {
              // === 通常料理の4段階遷移 ===
              if (prev === "未") {
                next = "待";
                
                // 待になったとき時間選択ポップアップを表示
                showWaitTimePopup(groupId, roomId, colIdx, (minutes) => {
                  if (minutes !== null) {
                    const st = loadBoardV3();
                    if (!st[groupId][roomId].waitTime) st[groupId][roomId].waitTime = {};
                    st[groupId][roomId].waitTime[colIdx] = minutes;
                    saveBoardV3(st);
                  }
                });
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
                // 未に戻したらスタッフ情報と待ち時間を削除
                const st = loadBoardV3();
                if (st[groupId][roomId].staff) {
                  delete st[groupId][roomId].staff[colIdx];
                }
                if (st[groupId][roomId].waitTime) {
                  delete st[groupId][roomId].waitTime[colIdx];
                }
                saveBoardV3(st);
                if (staffDisplay) {
                  staffDisplay.textContent = '';
                  staffDisplay.style.display = 'none';
                }
              }
            }
          }


          // 時刻表示
          const cellEl = btn.closest('td') || btn.parentElement;
          let timeLine = cellEl.querySelector('.js-time');
          if (!timeLine) {
            timeLine = document.createElement('div');
            timeLine.className = 'js-time';
            cellEl.appendChild(timeLine);
          }
          
          // 保存された待ち時間を確認
          const savedWaitTime = curSt[groupId]?.[roomId]?.waitTime?.[colIdx];
          
          // 肉または待の状態の場合、保存された待ち時間を大きく赤字で表示
          if ((next === '肉' || next === '待') && savedWaitTime) {
            const displayTime = calculateWaitTime(savedWaitTime);
            timeLine.textContent = displayTime;
            timeLine.style.fontSize = '16px';
            timeLine.style.color = '#d32f2f';
            timeLine.style.fontWeight = 'bold';
            timeLine.style.marginTop = '4px';
            timeLine.style.cursor = 'pointer';
            
            // クリックで再選択できるようにする
            timeLine.onclick = (e) => {
              e.stopPropagation();
              showWaitTimePopup(groupId, roomId, colIdx, (minutes) => {
                if (minutes !== null) {
                  const st = loadBoardV3();
                  if (!st[groupId][roomId].waitTime) st[groupId][roomId].waitTime = {};
                  st[groupId][roomId].waitTime[colIdx] = minutes;
                  saveBoardV3(st);
                  
                  const displayTime = calculateWaitTime(minutes);
                  timeLine.textContent = displayTime;
                }
              });
            };
          } else if (next === '肉' || next === '待') {
            // 待ち時間が保存されていない場合は現在時刻を表示
            timeLine.textContent = hhmm(new Date());
            timeLine.style.fontSize = '16px';
            timeLine.style.color = '#d32f2f';
            timeLine.style.fontWeight = 'bold';
            timeLine.style.marginTop = '4px';
            timeLine.style.cursor = 'pointer';
            
            // クリックで再選択できるようにする
            timeLine.onclick = (e) => {
              e.stopPropagation();
              showWaitTimePopup(groupId, roomId, colIdx, (minutes) => {
                if (minutes !== null) {
                  const st = loadBoardV3();
                  if (!st[groupId][roomId].waitTime) st[groupId][roomId].waitTime = {};
                  st[groupId][roomId].waitTime[colIdx] = minutes;
                  saveBoardV3(st);
                  
                  const displayTime = calculateWaitTime(minutes);
                  timeLine.textContent = displayTime;
                }
              });
            };
          } else {
            // 肉・待以外の状態では通常の時刻表示
            timeLine.textContent = hhmm(new Date());
            timeLine.style.fontSize = '10px';
            timeLine.style.color = '#999';
            timeLine.style.fontWeight = 'normal';
            timeLine.style.marginTop = '2px';
            timeLine.style.cursor = 'default';
            timeLine.onclick = null;
          }


          curSt[groupId][roomId][colIdx] = next;
          saveBoardV3(curSt);
          
          // ボタン内の文字を更新
          btn.textContent = next;
          btn.setAttribute('data-state', next);
          
          // キッチン表示を更新
          if (typeof window.updateKitchenDisplay === 'function') {
            window.updateKitchenDisplay();
          }
        });
      });
    }
  }

  /* ==== プラン名タグ追加機能は無効化（料理名の下に直接表示するため不要） ==== */
  function addPlanTagsToDots(){
    // この機能は使用しない
    return;
  }

  // === 音を鳴らす機能 ===
  function playNotificationSound() {
    // Web Audio APIを使って短い「ピッ」という音を生成
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 音の設定
      oscillator.frequency.value = 800; // 周波数（高さ）
      oscillator.type = 'sine'; // 音の種類（サイン波 = きれいな音）
      
      // 音量の設定（徐々に小さくなる）
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      // 音を鳴らす
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2); // 0.2秒間鳴らす
      
      console.log('🔔 通知音を鳴らしました');
    } catch (e) {
      console.error('音の再生に失敗:', e);
    }
  }

  // 前回表示されていた料理を記憶する変数
  let previousDisplayedDishes = new Set();

  // === キッチン表示の更新機能 ===
  function updateKitchenDisplay() {
    console.log('🍳 キッチン表示を更新中...');
    
    // 料理名の読み仮名マップ(ここで定義)
    const DISH_READINGS = {
      "吸物": "すいもの",
      "すいもの": "すいもの",
      "刺身": "さしみ",
      "さしみ": "さしみ",
      "蒸物": "むしもの",
      "むしもの": "むしもの",
      "揚物": "あげもの",
      "あげもの": "あげもの",
      "煮物": "にもの",
      "にもの": "にもの",
      "飯": "めし・ごはん",
      "ご飯": "ごはん",
      "甘味": "あまみ・デザート",
      "デザート": "デザート",
      "果菜盛": "かなもり",
      "かなもり": "かなもり",
      "しゃぶしゃぶ": "しゃぶしゃぶ",
      "ステーキ": "ステーキ",
      "すき焼き": "すきやき",
      "単品ステーキ": "たんぴんステーキ",
      "フライ": "フライ",
      "茶碗蒸し": "ちゃわんむし",
      "牛たたき": "ぎゅうたたき",
      "焼物": "やきもの",
      "小鉢": "こばち"
    };
    
    const kitchenDisplay = document.getElementById('kitchen-display');
    if (!kitchenDisplay) {
      console.log('❌ kitchen-display要素が見つかりません');
      return;
    }

    // 現在の進行状態を取得
    const state = loadBoardV3();
    const settings = loadSettings();
    
    console.log('📊 現在の状態:', state);
    console.log('⚙️ 設定データ:', settings);

    if (!settings || !settings.rooms) {
      kitchenDisplay.innerHTML = '<div class="kitchen-no-orders">設定データがありません</div>';
      console.log('❌ 設定データがありません');
      return;
    }

    // プランごとの料理名マッピング
    const planDishNames = {
      'スタンダード': ["吸物", "果菜盛", "蒸物", "揚物", "煮物", "ご飯", "甘味"],
      '和牛懐石': ["吸物", "果菜盛", "すき焼き", "フライ", "ステーキ", "ご飯", "甘味"],
      'ステーキ': ["吸物", "果菜盛", "蒸物", "揚物", "ステーキ", "ご飯", "甘味"],
      'しゃぶしゃぶ': ["吸物", "果菜盛", "しゃぶしゃぶ", "蒸物", "揚物", "ご飯", "甘味"],
      '連泊': ["茶碗蒸し", "牛たたき", "焼物", "小鉢", "揚物", "ご飯", "甘味"]
    };

    // 追加料理データを読み込む
    let extraDishes = [];
    try {
      const raw = localStorage.getItem('extra-dishes.v1');
      if (raw) {
        extraDishes = JSON.parse(raw);
      }
    } catch(e) {
      console.error('追加料理の読み込みに失敗:', e);
    }

    // 各部屋にstartTimeとdishNamesを追加
    settings.rooms.forEach(room => {
      room.startTime = room.dinner;  // 18:00, 18:30, 19:00など
      
      // プランごとの料理名を取得
      const baseDishes = room.plan && planDishNames[room.plan] 
        ? planDishNames[room.plan] 
        : ["吸物","刺身","蒸物","揚物","煮物","飯","甘味"];
      
      // 追加料理を挿入
      room.dishNames = insertExtraDishes(baseDishes, extraDishes, room.name);
      
      console.log(`✅ ${room.name}のデータを準備: startTime=${room.startTime}, 料理数=${room.dishNames.length}`);
    });

    // 料理ごとに集計
    const dishAggregation = {};

    settings.rooms.forEach(room => {
      const groupId = room.startTime;
      const roomId = room.name;

      if (!state[groupId] || !state[groupId][roomId]) {
        console.log(`⚠️ ${roomId}(${groupId})のデータがありません`);
        return;
      }

      const roomState = state[groupId][roomId];
      const welldoneData = roomState.welldone || {};

      // 各料理の状態をチェック
      room.dishNames.forEach((dishName, idx) => {
        const dishState = roomState[idx];
        
        console.log(`📝 ${roomId} - ${dishName}: ${dishState}`);
        
        // 「注」の状態のみ表示（「待」は表示しない、「済」も表示しない）
        if (dishState !== '注') return;

        const key = dishName;
        if (!dishAggregation[key]) {
          dishAggregation[key] = {
            name: dishName,
            reading: DISH_READINGS[dishName] || dishName,
            count: 0,
            rooms: [],
            state: dishState,
            welldoneCount: 0
          };
        }

        dishAggregation[key].count += 1;
        
        // ウェルダン情報を追加
        if (welldoneData[idx]) {
          dishAggregation[key].welldoneCount += welldoneData[idx];
        }

        // より進んだ状態を優先（注 > 待）
        if (dishState === '注' && dishAggregation[key].state === '待') {
          dishAggregation[key].state = '注';
        }

        dishAggregation[key].rooms.push({
          name: roomId,
          guest: room.guest || 2,
          welldone: welldoneData[idx] || 0
        });
      });
    });

    // 料理カードを生成
    const dishCards = Object.values(dishAggregation);
    
    console.log('🍽️ 集計された料理:', dishCards);
    console.log('📊 集計された料理の数:', dishCards.length);
    
    if (dishCards.length > 0) {
      dishCards.forEach(dish => {
        console.log(`  - ${dish.name}(${dish.reading}): ${dish.count}食, 状態=${dish.state}`);
      });
    }

    if (dishCards.length === 0) {
      kitchenDisplay.innerHTML = '<div class="kitchen-no-orders">現在、待機中・調理中の料理はありません</div>';
      console.log('✅ 待機中・調理中の料理はありません');
      // 料理がなくなったので記憶をクリア
      previousDisplayedDishes.clear();
      return;
    }

    // 現在表示する料理のリストを作成
    const currentDisplayedDishes = new Set(dishCards.map(dish => dish.name));
    
    // 新しく追加された料理があるかチェック
    let hasNewDish = false;
    for (const dishName of currentDisplayedDishes) {
      if (!previousDisplayedDishes.has(dishName)) {
        hasNewDish = true;
        console.log(`🆕 新しい料理が追加されました: ${dishName}`);
      }
    }
    
    // 新しい料理があれば音を鳴らす（初回でも鳴らす）
    if (hasNewDish) {
      playNotificationSound();
    }
    
    // 今回の表示を記憶
    previousDisplayedDishes = currentDisplayedDishes;

    // 状態の優先順位: 注 > 待
    dishCards.sort((a, b) => {
      const stateOrder = { '注': 0, '待': 1 };
      return stateOrder[a.state] - stateOrder[b.state];
    });

    const cardsHtml = dishCards.map(dish => {
      const stateClass = dish.state === '注' ? 'state-cooking' : 'state-waiting';
      const stateLabel = dish.state === '注' ? '🔥 調理中' : '⏳ 待機中';

      // 各部屋の人数を合計
      const totalGuests = dish.rooms.reduce((sum, r) => sum + (r.guest || 0), 0);

      const roomsHtml = dish.rooms.map(r => {
        const welldoneText = r.welldone > 0 ? ` (W×${r.welldone})` : '';
        return `<span class="kitchen-room-badge">${r.name} ${r.guest}名${welldoneText}</span>`;
      }).join('');

      const welldoneSection = dish.welldoneCount > 0 
        ? `<div class="kitchen-welldone-info">🥩 ウェルダン: ${dish.welldoneCount}名</div>`
        : '';

      return `
        <div class="kitchen-dish-card ${stateClass}">
          <div class="kitchen-dish-name">${dish.name}</div>
          <div class="kitchen-dish-reading">${dish.reading}</div>
          <div class="kitchen-dish-count">${totalGuests}名</div>
          ${welldoneSection}
          <div style="text-align:center;margin:12px 0;font-size:18px;font-weight:bold;color:#555;">
            ${stateLabel}
          </div>
          <div class="kitchen-dish-rooms">
            ${roomsHtml}
          </div>
        </div>
      `;
    }).join('');

    kitchenDisplay.innerHTML = cardsHtml;
    console.log('✅ キッチン表示を更新しました!');
  }

  // グローバルに公開
  window.updateKitchenDisplay = updateKitchenDisplay;

  // 初期実行
  document.addEventListener('DOMContentLoaded', () => {
    const data = loadSettings();
    if (data) {
      renderFromSettings(data);
    } else {
      renderBoardV3();
    }

    // タブ切り替え時にキッチン表示を更新
    const tabKitchen = document.getElementById('tab-kitchen');
    if (tabKitchen) {
      tabKitchen.addEventListener('click', () => {
        setTimeout(updateKitchenDisplay, 100);
      });
    }

    // 初回表示
    updateKitchenDisplay();

    // ボタンクリック時もキッチン表示を更新（リアルタイム反映）
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('dotbtn') || e.target.classList.contains('squarebtn')) {
        setTimeout(updateKitchenDisplay, 300);
      }
    });

    // === 🔥 別タブでのデータ変更を検知する機能（追加） ===
    // 別のブラウザタブでlocalStorageが変更されたら、このタブも自動的に更新する
    window.addEventListener('storage', (e) => {
      console.log('📡 別タブでデータが変更されました:', e.key);
      
      // dinner.board.v3 が変更されたらキッチン表示を更新
      if (e.key === 'dinner.board.v3') {
        console.log('🔄 キッチン表示を自動更新します');
        setTimeout(updateKitchenDisplay, 100);
      }
      
      // 設定が変更されたら画面全体を再描画
      if (e.key === 'room-settings.v1') {
        console.log('🔄 設定が変更されたので画面を再描画します');
        const newData = loadSettings();
        if (newData) {
          renderFromSettings(newData);
        }
        setTimeout(updateKitchenDisplay, 100);
      }
    });
    
    console.log('✅ 別タブ監視機能を有効化しました！');

    // === リセットボタン（改善版） ===
    const resetBtn = document.getElementById("btn-reset-today");
    if(resetBtn){
      resetBtn.addEventListener("click", () => {
        if (!confirm("本日のデータをすべて初期化します。\n・丸ボタンの状態\n・ウェルダン情報\n・スタッフ情報\n・スピード設定\n・メモ欄\nすべてリセットされます。よろしいですか？")) return;

        // 状態をリセット
        const state = resetBoardStatesToPendingV3();
        
        // 古い形式のデータも削除
        localStorage.removeItem("dinner.board.v2");
        localStorage.removeItem(`board-state.v1:${new Date().toISOString().slice(0,10)}`);
        
        // スピード設定とメモ欄を初期化
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          // speed-で始まるキー、またはmemo-で始まるキーを削除対象にする
          if (key && (key.startsWith('speed-') || key.startsWith('memo-'))) {
            keysToRemove.push(key);
          }
        }
        // 削除実行
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log(`🧹 初期化完了: ${keysToRemove.length}個のスピード・メモ設定を削除しました`);

        // 画面を再描画
        const currentData = loadSettings();
        if (currentData) {
          renderFromSettings(currentData);
        } else {
          renderBoardV3(state);
        }
        
        // キッチン表示も更新
        setTimeout(updateKitchenDisplay, 100);
        
        alert('リセットしました！\n・すべての丸ボタンが「未」になりました\n・ウェルダン情報が削除されました\n・スタッフ情報が削除されました\n・スピード設定が初期化されました（全てN）\n・メモ欄が空になりました');
      });
    }
  });

})();
