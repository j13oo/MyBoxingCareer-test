(() => {
  'use strict';

  const SAVE_KEY = 'ring-life-career-v1';
  const STAT_INFO = {
    power: { name: '힘', icon: '✦', description: '강한 공격과 한 방' },
    speed: { name: '스피드', icon: '➜', description: '빠른 공격과 회피' },
    stamina: { name: '스태미나', icon: '♥', description: '경기 체력과 압박' },
    defense: { name: '방어', icon: '⬟', description: '가드를 올려 피해 감소' }
  };
  const STYLES = { outboxer: '아웃복서', slugger: '슬러거', swarm: '인파이터' };
  const PERSONALITIES = { steady: '침착함', bold: '대담함', disciplined: '성실함' };
  const OPPONENTS = [
    { name: '동네 강자 민수', title: '첫 프로 테스트', stats: { power: 24, speed: 22, stamina: 25, defense: 20 }, stage: 1, reward: 70 },
    { name: '왼손잡이 준호', title: '지역 예선', stats: { power: 31, speed: 34, stamina: 30, defense: 27 }, stage: 2, reward: 110 },
    { name: '철벽 태식', title: '시티 챔피언십', stats: { power: 40, speed: 38, stamina: 41, defense: 45 }, stage: 3, reward: 160 },
    { name: '무패의 레오', title: '전국 타이틀전', stats: { power: 53, speed: 50, stamina: 52, defense: 49 }, stage: 4, reward: 240 },
    { name: '챔피언 강철', title: '월드 챔피언십', stats: { power: 67, speed: 63, stamina: 66, defense: 65 }, stage: 5, reward: 360 }
  ];
  const ITEMS = [
    { id: 'drink', name: '스포츠 드링크', icon: '🧃', price: 35, description: '에너지 35 회복' },
    { id: 'meal', name: '챔피언 식단', icon: '🍱', price: 55, description: '컨디션 30 회복' },
    { id: 'wrap', name: '새 핸드랩', icon: '🥊', price: 80, description: '힘 +2 영구 상승' }
  ];

  const $ = (selector) => document.querySelector(selector);
  const creationScreen = $('#creation-screen');
  const gameScreen = $('#game-screen');
  const tabContent = $('#tab-content');
  let state = null;
  let activeTab = 'training';
  let toastTimer;

  function freshState(form) {
    return {
      name: form.name,
      appearance: form.appearance,
      personality: form.personality,
      style: form.style,
      stats: { power: 25, speed: 25, stamina: 25, defense: 25 },
      energy: 100,
      condition: 100,
      money: 120,
      fame: 0,
      wins: 0,
      losses: 0,
      unlockedStage: 1,
      inventory: [],
      log: [{ text: `<strong>${escapeHtml(form.name)}</strong> 선수의 커리어가 시작됐습니다. 관장의 첫 상대를 만나 보세요.` }]
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn('커리어 저장에 실패했습니다.', error); }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data.name !== 'string' || !data.stats || !data.inventory || !Array.isArray(data.log)) return null;
      return data;
    } catch (error) { console.warn('저장된 커리어를 읽지 못했습니다.', error); return null; }
  }

  function startCareer() {
    creationScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    render();
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
  }

  function addLog(text) {
    state.log.unshift({ text, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) });
    state.log = state.log.slice(0, 7);
  }

  function renderStats() {
    $('#stats-list').innerHTML = Object.entries(STAT_INFO).map(([key, info]) => `
      <div class="stat-row"><span>${info.icon} ${info.name}</span><div class="stat-bar"><i style="width:${Math.min(100, state.stats[key])}%"></i></div><b>${state.stats[key]}</b></div>
    `).join('');
  }

  function renderProfile() {
    $('#profile-name').textContent = state.name;
    $('#profile-meta').textContent = `${STYLES[state.style] || STYLES.outboxer} · ${PERSONALITIES[state.personality] || PERSONALITIES.steady}`;
    $('#career-label').textContent = `PRO CAREER · ${state.unlockedStage}단계`;
    $('#energy-value').textContent = state.energy;
    $('#energy-meter').style.width = `${state.energy}%`;
    $('#condition-value').textContent = state.condition;
    $('#condition-meter').style.width = `${state.condition}%`;
    $('#money-value').textContent = state.money;
    $('#fame-value').textContent = state.fame;
    $('#avatar').dataset.skin = state.appearance;
    $('#ring-avatar').style.filter = state.appearance === 'deep' ? 'brightness(.73)' : state.appearance === 'tan' ? 'sepia(.2)' : '';
    renderStats();
  }

  function renderTraining() {
    const cards = Object.entries(STAT_INFO).map(([key, info]) => `
      <button class="action-card" type="button" data-train="${key}" ${state.energy < 18 ? 'disabled' : ''}>
        <span class="action-icon">${info.icon}</span><b>${info.name} 훈련</b><small>${info.description}<br>+${state.personality === 'disciplined' ? 3 : 2} · 에너지 -18</small>
      </button>`).join('');
    tabContent.innerHTML = `<div class="section-title"><h3>오늘은 무엇을 훈련할까요?</h3><span class="tag">훈련 1회 = 하루</span></div><p class="subcopy">성장시키고 싶은 능력치를 직접 선택하세요. 성실한 성격은 훈련 효과가 더 큽니다.</p><div class="training-grid">${cards}<button class="action-card rest-card" type="button" data-rest><span class="action-icon">☕</span><span><b>휴식하기</b><small>에너지 +30 · 컨디션 +12</small></span></button></div>`;
  }

  function renderOpponents() {
    const list = OPPONENTS.map((opponent, index) => {
      const unlocked = opponent.stage <= state.unlockedStage;
      const rating = Math.round(Object.values(opponent.stats).reduce((sum, value) => sum + value, 0) / 4);
      return `<article class="opponent-card ${unlocked ? '' : 'locked'}"><span class="tag">${opponent.title}</span><h4>${opponent.name}</h4><p class="opponent-meta">종합 능력치 ${rating} · 승리 보상 ${opponent.reward}G</p><p>${unlocked ? '상대를 분석하고 링에 오르세요.' : '앞 단계 상대에게 승리하면 도전할 수 있어요.'}</p><button type="button" data-fight="${index}" ${unlocked ? '' : 'disabled'}>${unlocked ? '시합 신청' : '잠김'}</button></article>`;
    }).join('');
    tabContent.innerHTML = `<div class="section-title"><h3>도전할 상대를 선택하세요</h3><span class="tag">승리 ${state.wins} · 패배 ${state.losses}</span></div><p class="subcopy">에너지가 25 이상이어야 경기를 신청할 수 있습니다. 패배해도 다시 도전할 수 있어요.</p><div class="opponent-grid">${list}</div>`;
  }

  function renderGym() {
    const products = ITEMS.map((item) => `<article class="shop-card"><span class="action-icon">${item.icon}</span><h4>${item.name}</h4><p>${item.description}</p><button type="button" data-buy="${item.id}">구입 · ${item.price}G</button></article>`).join('');
    const bag = state.inventory.length ? state.inventory.map((id, index) => {
      const item = ITEMS.find((entry) => entry.id === id);
      return item ? `<div class="bag-row"><span>${item.icon} ${item.name}</span><button type="button" data-use="${index}">사용</button></div>` : '';
    }).join('') : '<p class="empty-bag">가방이 비어 있어요. 필요한 아이템을 구입해 보세요.</p>';
    tabContent.innerHTML = `<div class="gym-layout"><div><div class="section-title"><h3>복싱장 매점</h3></div><div class="shop-grid">${products}</div><div class="stats-heading"><h3>내 가방</h3><span>${state.inventory.length}개 보유</span></div><div class="bag-list">${bag}</div></div><div><div class="section-title"><h3>관장의 조언</h3></div><div class="gym-note"><b>“좋은 복서는 자기 리듬을 안다.”</b><br>에너지가 낮으면 경기에서 실력이 제대로 나오지 않아. 훈련과 휴식의 균형을 잡고, 네 스타일에 맞는 능력치를 키워 보렴.<br><br>아웃복서는 스피드, 슬러거는 힘, 인파이터는 스태미나가 핵심이야.</div><div class="gym-note" style="margin-top:10px"><b>커리어 기록</b><br>경기 전 에너지 25 이상 필요 · 훈련은 에너지 18 소모 · 승리 시 다음 상대 해금</div></div></div>`;
  }

  function renderLog() {
    $('#event-log').innerHTML = state.log.map((entry) => `<div class="log-entry"><time>${entry.time || 'START'}</time><span>${entry.text}</span></div>`).join('');
  }

  function render() {
    if (!state) return;
    renderProfile();
    if (activeTab === 'training') renderTraining();
    if (activeTab === 'opponents') renderOpponents();
    if (activeTab === 'gym') renderGym();
    renderLog();
    save();
  }

  function train(stat) {
    if (state.energy < 18) return showToast('에너지가 부족해요. 먼저 휴식해 주세요.');
    const gain = state.personality === 'disciplined' ? 3 : 2;
    state.stats[stat] = Math.min(99, state.stats[stat] + gain);
    state.energy = Math.max(0, state.energy - 18);
    state.condition = Math.max(0, state.condition - (state.personality === 'steady' ? 2 : 4));
    addLog(`<strong>${STAT_INFO[stat].name} 훈련</strong> 완료! 능력치가 ${gain} 올랐습니다.`);
    render();
    showToast(`${STAT_INFO[stat].name} +${gain} · 훈련 완료!`);
  }

  function rest() {
    const before = state.energy;
    state.energy = Math.min(100, state.energy + 30);
    state.condition = Math.min(100, state.condition + (state.personality === 'steady' ? 18 : 12));
    if (before === 100 && state.condition === 100) return showToast('이미 컨디션이 충분히 좋아요.');
    addLog('하루 동안 푹 쉬었습니다. 에너지와 컨디션이 회복됐습니다.');
    render();
    showToast('휴식 완료! 몸이 한결 가벼워졌어요.');
  }

  function styleBonus(stats) {
    if (state.style === 'outboxer') return stats.speed * 0.27 + stats.defense * 0.12;
    if (state.style === 'slugger') return stats.power * 0.31;
    return stats.stamina * 0.22 + stats.power * 0.1;
  }

  function startFight(index) {
    const opponent = OPPONENTS[index];
    if (!opponent || opponent.stage > state.unlockedStage) return;
    if (state.energy < 25) return showToast('에너지가 부족해요. 훈련 탭에서 휴식해 주세요.');

    const s = state.stats;
    const playerScore = s.power * 0.32 + s.speed * 0.25 + s.stamina * 0.24 + s.defense * 0.19 + styleBonus(s) + state.energy * 0.15 + state.condition * 0.1 + (state.personality === 'bold' ? 2 : 0) + Math.random() * 11;
    const enemy = opponent.stats;
    const enemyScore = enemy.power * 0.32 + enemy.speed * 0.25 + enemy.stamina * 0.24 + enemy.defense * 0.19 + Math.random() * 11;
    const won = playerScore >= enemyScore;
    const margin = Math.abs(Math.round(playerScore - enemyScore));
    state.energy = Math.max(0, state.energy - 25);
    state.condition = Math.max(0, state.condition - 12);

    if (won) {
      state.wins += 1;
      state.money += opponent.reward;
      const fameGain = 15 + opponent.stage * 8;
      state.fame += fameGain;
      state.unlockedStage = Math.min(OPPONENTS.length, Math.max(state.unlockedStage, opponent.stage + 1));
      if (Math.random() < 0.22) state.inventory.push('drink');
      addLog(`<strong>${opponent.name}에게 승리!</strong> 보상 ${opponent.reward}G와 명성 ${fameGain}을 획득했습니다.`);
    } else {
      state.losses += 1;
      state.money += 20;
      addLog(`<strong>${opponent.name}과의 경기에서 아쉽게 패배.</strong> 참가 보상 20G를 받았습니다. 다시 도전하세요.`);
    }
    save();
    render();
    showFightResult(opponent, won, margin);
  }

  function showFightResult(opponent, won, margin) {
    const modal = document.createElement('div');
    modal.className = 'fight-modal';
    modal.innerHTML = `<div class="fight-box" role="dialog" aria-modal="true" aria-labelledby="fight-title"><p class="eyebrow">FIGHT RESULT · ${opponent.title}</p><h2 id="fight-title">${won ? '승리! 링 위에 당신의 이름을 새겼어요.' : '아쉬운 패배, 다음 경기를 준비해요.'}</h2><div class="fight-score">${won ? 'WIN' : 'LOSE'} <span style="color:#8a999e">·</span> ${margin}점 차</div><p>${won ? `${opponent.name} 선수와의 치열한 경기에서 승리했습니다. 다음 상대가 열렸어요!` : `${opponent.name} 선수에게서 배운 것을 훈련으로 보완해 다시 도전하세요.`}<br>남은 에너지 ${state.energy} · 컨디션 ${state.condition}</p><button class="button button-primary" type="button" data-close>계속 커리어 이어가기</button></div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close]').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
  }

  function buyItem(id) {
    const item = ITEMS.find((entry) => entry.id === id);
    if (!item) return;
    if (state.money < item.price) return showToast('돈이 부족해요. 경기를 통해 보상을 모아 보세요.');
    state.money -= item.price;
    state.inventory.push(id);
    addLog(`${item.name}을(를) 구입했습니다.`);
    render();
    showToast(`${item.name} 구입 완료!`);
  }

  function useItem(index) {
    const id = state.inventory[index];
    const item = ITEMS.find((entry) => entry.id === id);
    if (!item) return;
    if (id === 'drink') state.energy = Math.min(100, state.energy + 35);
    if (id === 'meal') state.condition = Math.min(100, state.condition + 30);
    if (id === 'wrap') state.stats.power = Math.min(99, state.stats.power + 2);
    state.inventory.splice(index, 1);
    addLog(`${item.name}을(를) 사용했습니다.`);
    render();
    showToast(`${item.name} 사용 완료!`);
  }

  $('#create-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = {
      name: $('#player-name').value.trim().slice(0, 16) || '신인 복서',
      appearance: $('#appearance').value,
      personality: $('#personality').value,
      style: document.querySelector('input[name="style"]:checked').value
    };
    state = freshState(form);
    activeTab = 'training';
    save();
    startCareer();
  });

  $('#reset-button').addEventListener('click', () => {
    if (!state) return;
    if (!window.confirm('현재 커리어를 지우고 새 선수로 시작할까요?')) return;
    localStorage.removeItem(SAVE_KEY);
    state = null;
    gameScreen.classList.add('hidden');
    creationScreen.classList.remove('hidden');
    $('#create-form').reset();
    showToast('새로운 커리어를 시작할 수 있어요.');
  });

  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
    activeTab = button.dataset.tab;
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === button));
    render();
  }));

  tabContent.addEventListener('click', (event) => {
    const trainButton = event.target.closest('[data-train]');
    const fightButton = event.target.closest('[data-fight]');
    const buyButton = event.target.closest('[data-buy]');
    const useButton = event.target.closest('[data-use]');
    if (trainButton) train(trainButton.dataset.train);
    else if (event.target.closest('[data-rest]')) rest();
    else if (fightButton) startFight(Number(fightButton.dataset.fight));
    else if (buyButton) buyItem(buyButton.dataset.buy);
    else if (useButton) useItem(Number(useButton.dataset.use));
  });

  state = load();
  if (state) startCareer();
})();
