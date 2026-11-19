(() => {
  'use strict';

  const SAVE_KEY = 'ring-life-career-v1';
  const INFO = {
    power: { name: '힘', icon: '✦', tip: '강한 공격과 한 방' },
    speed: { name: '스피드', icon: '➜', tip: '빠른 공격과 거리 조절' },
    stamina: { name: '스태미나', icon: '♥', tip: '경기 체력과 압박' },
    defense: { name: '방어', icon: '⬟', tip: '가드를 올려 피해 감소' }
  };
  const STYLE_NAMES = { outboxer: '아웃복서', slugger: '슬러거', swarm: '인파이터' };
  const PERSONALITY_NAMES = { steady: '침착함', bold: '대담함', disciplined: '성실함' };
  const OPPONENTS = [
    { name: '첫 스파링 파트너 도윤', title: '생활체육 아마추어전', stats: { power: 21, speed: 22, stamina: 22, defense: 21 }, stage: 1, reward: 45 },
    { name: '남부 체육관 지후', title: '아마추어 오픈 매치', stats: { power: 24, speed: 23, stamina: 25, defense: 23 }, stage: 1, reward: 55 },
    { name: '왼손잡이 준호', title: '구 단위 아마추어전', stats: { power: 25, speed: 29, stamina: 27, defense: 25 }, stage: 1, reward: 65 },
    { name: '침착한 복서 서연', title: '시·도 아마추어 예선', stats: { power: 29, speed: 30, stamina: 31, defense: 32 }, stage: 2, reward: 85 },
    { name: '돌주먹 태식', title: '시·도 아마추어 준결승', stats: { power: 36, speed: 30, stamina: 34, defense: 32 }, stage: 2, reward: 100 },
    { name: '스텝의 달인 유진', title: '전국 아마추어 대회', stats: { power: 34, speed: 40, stamina: 36, defense: 35 }, stage: 3, reward: 125 },
    { name: '연속 우승자 민재', title: '전국 아마추어 결승', stats: { power: 41, speed: 40, stamina: 42, defense: 40 }, stage: 3, reward: 160 },
    { name: '프로 테스트 강현', title: '프로 데뷔 테스트', stats: { power: 44, speed: 43, stamina: 43, defense: 42 }, stage: 4, reward: 190 },
    { name: '무패의 레오', title: '프로 신인전', stats: { power: 49, speed: 48, stamina: 50, defense: 47 }, stage: 4, reward: 230 },
    { name: '랭커 후보 성훈', title: '프로 랭킹 매치', stats: { power: 56, speed: 53, stamina: 54, defense: 56 }, stage: 5, reward: 300 },
    { name: '챔피언 강철', title: '타이틀 도전자 결정전', stats: { power: 64, speed: 62, stamina: 65, defense: 63 }, stage: 6, reward: 420 }
  ];
  const ITEMS = [
    { id: 'drink', name: '스포츠 드링크', icon: '🧃', price: 35, description: '에너지 35 회복' },
    { id: 'meal', name: '챔피언 식단', icon: '🍱', price: 55, description: '컨디션 30 회복' },
    { id: 'wrap', name: '새 핸드랩', icon: '🥊', price: 80, description: '힘 +2 영구 상승' }
  ];
  const ROUNDS = [
    [
      { label: '잽으로 거리 조절', stat: 'speed', amount: 3, text: '잽으로 상대의 리듬을 끊고 링 중앙을 차지했습니다.' },
      { label: '선제 공격', stat: 'power', amount: 2, text: '먼저 강하게 들어가 상대를 뒤로 물러서게 했습니다.' },
      { label: '단단히 가드', stat: 'defense', amount: 3, text: '가드를 단단히 올려 상대의 공격을 흘려냈습니다.' }
    ],
    [
      { label: '몸통 공격', stat: 'power', amount: 3, text: '복부를 공략해 상대의 체력을 조금씩 깎았습니다.' },
      { label: '체력 아끼기', stat: 'stamina', amount: 3, text: '호흡을 고르고 다음 라운드를 위한 체력을 비축했습니다.' },
      { label: '연속 잽', stat: 'speed', amount: 2, second: 'stamina', secondAmount: 1, text: '빠른 연속 잽으로 주도권을 놓치지 않았습니다.' }
    ],
    [
      { label: '정면 승부', stat: 'power', amount: 4, text: '마지막 라운드, 강한 펀치로 승부를 걸었습니다.' },
      { label: '안전 운영', stat: 'defense', amount: 4, text: '빈틈을 보이지 않고 점수를 지키는 전략을 택했습니다.' },
      { label: '역전 러시', stat: 'stamina', amount: 3, second: 'speed', secondAmount: 2, text: '남은 힘을 모두 끌어내 빠르게 몰아붙였습니다.' }
    ]
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  let activeTab = 'training';
  const tabContent = $('#tab-content');

  function readState() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
  }
  function writeState(data) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { showToast('저장 공간이 부족해 커리어를 저장하지 못했어요.'); }
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2100);
  }
  function addLog(data, message) {
    data.log = Array.isArray(data.log) ? data.log : [];
    data.log.unshift({ text: message, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) });
    data.log = data.log.slice(0, 7);
  }
  function getAppearance(data) {
    return {
      skin: data.appearance || 'light',
      hair: data.hairStyle || 'short',
      hairColor: data.hairColor || 'black',
      build: data.build || 'balanced',
      outfit: data.outfitColor || 'red'
    };
  }
  function paintAvatar(element, data) {
    if (!element) return;
    const a = getAppearance(data);
    element.classList.add('character-avatar');
    Object.entries(a).forEach(([key, value]) => { if (key !== 'hairColor') element.dataset[key] = value; });
    element.dataset.haircolor = a.hairColor;
    element.innerHTML = '<span class="pixel-boxer"><i class="pixel-hair"></i><i class="pixel-head"><i class="pixel-eyes"></i></i><i class="pixel-body"></i><i class="pixel-shorts"></i><i class="pixel-glove pixel-glove-left"></i><i class="pixel-glove pixel-glove-right"></i><i class="pixel-boot pixel-boot-left"></i><i class="pixel-boot pixel-boot-right"></i></span>';
  }
  function updatePreview() {
    const form = $('#create-form');
    if (!form) return;
    const data = {
      name: $('#player-name').value.trim() || '신인 복서',
      appearance: $('#appearance').value,
      hairStyle: $('#hair-style').value,
      hairColor: $('#hair-color').value,
      build: $('#build').value,
      outfitColor: $('#outfit-color').value
    };
    paintAvatar($('#creation-avatar'), data);
    $('#creation-preview-name').textContent = data.name;
    $('#creation-preview-description').textContent = `${{ light: '밝은 피부', tan: '구릿빛 피부', deep: '짙은 피부' }[data.appearance]} · ${{ short: '스포츠컷', fade: '페이드컷', curly: '곱슬머리', long: '긴 머리' }[data.hairStyle]} · ${{ balanced: '균형형', lean: '날렵한 체형', stocky: '다부진 체형' }[data.build]}`;
  }
  function syncProfile(data) {
    if (!data) return;
    if (!data.careerLevel) data.careerLevel = 'amateur';
    $('#profile-name').textContent = data.name || '복서';
    $('#profile-meta').textContent = `${STYLE_NAMES[data.style] || STYLE_NAMES.outboxer} · ${PERSONALITY_NAMES[data.personality] || PERSONALITY_NAMES.steady}`;
    $('#career-label').textContent = `${data.careerLevel === 'pro' ? 'PRO' : 'AMATEUR'} CAREER · ${data.wins || 0}승`;
    $('#energy-value').textContent = data.energy;
    $('#energy-meter').style.width = `${data.energy}%`;
    $('#condition-value').textContent = data.condition;
    $('#condition-meter').style.width = `${data.condition}%`;
    $('#money-value').textContent = data.money;
    $('#fame-value').textContent = data.fame;
    paintAvatar($('#avatar'), data);
    paintAvatar($('#ring-avatar'), data);
    const statList = $('#stats-list');
    statList.innerHTML = Object.entries(INFO).map(([key, item]) => `<div class="stat-row"><span>${item.icon} ${item.name}</span><div class="stat-bar"><i style="width:${Math.min(100, data.stats[key])}%"></i></div><b>${data.stats[key]}</b></div>`).join('');
    $('#event-log').innerHTML = (data.log || []).map((entry) => `<div class="log-entry"><time>${entry.time || 'START'}</time><span>${entry.text || ''}</span></div>`).join('');
  }
  function setActiveTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
    renderTab();
  }
  function renderTraining(data) {
    const gain = data.personality === 'disciplined' ? 2 : 1;
    const forced = data.restDaysRemaining || 0;
    const cards = Object.entries(INFO).map(([key, item]) => `<button class="action-card" type="button" data-up-train="${key}" ${forced || data.energy < 18 ? 'disabled' : ''}><span class="action-icon">${item.icon}</span><b>${item.name} 훈련</b><small>${item.tip}<br>+${gain} · 에너지 -18</small></button>`).join('');
    const cycle = data.trainingDaysInCycle || 0;
    tabContent.innerHTML = `<div class="section-title"><h3>오늘은 무엇을 훈련할까요?</h3><span class="tag">훈련 주기 ${cycle}/5일</span></div><p class="subcopy">${forced ? `훈련 누적 한도에 도달했습니다. 필수 휴식을 ${forced}일 더 해야 다시 훈련할 수 있습니다.` : `5일 훈련 후 2일 필수 휴식이 필요합니다. 훈련 성장량 +${gain} · 성실한 성격은 효과가 더 큽니다.`}</p><div class="training-grid">${cards}<button class="action-card rest-card" type="button" data-up-rest><span class="action-icon">☕</span><span><b>${forced ? `필수 휴식 (${forced}일 남음)` : '휴식하기'}</b><small>에너지 +30 · 컨디션 +${data.personality === 'steady' ? 18 : 12}</small></span></button></div>`;
  }
  function renderOpponents(data) {
    if (Number.isInteger(data.pendingBout)) return renderCamp(data);
    const rating = boxerRating(data);
    tabContent.innerHTML = `<div class="section-title"><h3>매치메이커</h3><span class="tag">${data.careerLevel === 'pro' ? '프로' : '아마추어'} · ${data.wins || 0}승 ${data.losses || 0}패</span></div><p class="subcopy">선수 능력과 명성에 맞춰 매치메이커가 다음 상대를 정합니다. 시합이 잡히면 훈련 캠프에서 준비를 시작합니다.</p><article class="opponent-card matchmaker-card"><span class="tag">현재 선수 평점 ${Math.round(rating)} · 명성 ${data.fame || 0}</span><h4>다음 시합 상대를 배정받으세요</h4><p class="opponent-meta">아마추어 커리어에서 실적을 쌓으면 프로 무대로 진출합니다.</p><button type="button" data-up-matchmake ${data.energy < 25 ? 'disabled' : ''}>매치메이커에 시합 신청</button></article>`;
  }
  function boxerRating(data) {
    const s = data.stats || {};
    return (Number(s.power || 1) + Number(s.speed || 1) + Number(s.stamina || 1) + Number(s.defense || 1)) / 4 + Math.min(10, Number(data.fame || 0) * .04);
  }
  function chooseOpponent(data) {
    const rating = boxerRating(data);
    const pool = OPPONENTS.map((opponent, index) => ({ opponent, index, rating: Object.values(opponent.stats).reduce((a, b) => a + b, 0) / 4 })).filter((entry) => data.careerLevel === 'pro' ? entry.opponent.stage >= 4 : entry.opponent.stage <= 3);
    const recent = data.recentOpponents || [];
    const fresh = pool.filter((entry) => !recent.includes(entry.index));
    const choices = (fresh.length ? fresh : pool).sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating)).slice(0, 3);
    return choices[Math.floor(Math.random() * choices.length)] || pool[0];
  }
  function recordTrainingDay(data) {
    data.trainingDaysInCycle = (data.trainingDaysInCycle || 0) + 1;
    if (data.trainingDaysInCycle >= 5) data.restDaysRemaining = 2;
  }
  function takeRestDay(data) {
    if ((data.restDaysRemaining || 0) > 0) {
      data.restDaysRemaining -= 1;
      if (data.restDaysRemaining === 0) data.trainingDaysInCycle = 0;
      return true;
    }
    return false;
  }
  function renderCamp(data) {
    const opponent = OPPONENTS[data.pendingBout];
    if (!opponent) { delete data.pendingBout; writeState(data); return renderOpponents(data); }
    const days = data.campDays || 0;
    const options = Object.entries(INFO).map(([key, item]) => `<option value="${key}" ${data.campFocus === key ? 'selected' : ''}>${item.name}</option>`).join('');
    const forced = data.restDaysRemaining || 0;
    tabContent.innerHTML = `<div class="section-title"><h3>시합 준비 훈련 캠프</h3><span class="tag">${days}/3일 진행</span></div><div class="camp-opponent"><span class="tag">${opponent.title}</span><h4>${opponent.name}</h4><p>상대의 스타일을 분석하고 이번 경기에서 키울 능력치를 정하세요. 5일 훈련 후 2일 휴식이 필요합니다.</p></div><div class="camp-controls"><label>오늘 집중할 능력치<select id="camp-focus">${options}</select></label><button class="button button-primary" type="button" data-up-camp-train ${days >= 3 || data.energy < 10 || forced ? 'disabled' : ''}>캠프 훈련 진행 (${days}/3)</button><button class="button" type="button" data-up-camp-rest>${forced ? `필수 휴식 (${forced}일 남음)` : '휴식 · 에너지 회복'}</button></div><p class="subcopy">${forced ? `훈련 누적 한도입니다. 필수 휴식 ${forced}일을 마쳐야 다음 일정을 진행할 수 있습니다.` : `훈련 주기 ${data.trainingDaysInCycle || 0}/5일`}</p><div class="camp-progress">${[0, 1, 2].map((n) => `<span class="camp-day ${n < days ? 'done' : ''}">DAY ${n + 1}${n < days ? ' ✓' : ''}</span>`).join('')}</div><div class="camp-finish"><p>${days ? '캠프 훈련을 마쳤습니다. 준비가 되면 경기에 들어가세요.' : '최소 하루 훈련 캠프를 진행한 뒤 경기를 시작할 수 있습니다.'}</p><button class="button button-primary" type="button" data-up-bell ${days < 1 || data.energy < 25 || forced ? 'disabled' : ''}>계체 완료 · 경기장 입장</button><button class="button button-quiet" type="button" data-up-cancel>시합 취소</button></div>`;
    $('#camp-focus').addEventListener('change', (event) => { const fresh = readState(); fresh.campFocus = event.target.value; writeState(fresh); });
  }
  function renderFight(data) {
    const fight = data.liveFight;
    const opponent = OPPONENTS[fight.opponentIndex];
    const visibleLines = fight.lines.map((line, index) => `<p class="fight-line ${index === fight.lines.length - 1 ? 'latest' : ''}">${line}</p>`).join('');
    if (fight.step >= 3) return finishFight(data);
    const choices = ROUNDS[fight.step].map((choice, index) => `<button class="tactic-card" type="button" data-up-tactic="${index}"><b>${choice.label}</b><small>${choice.text}</small></button>`).join('');
    tabContent.innerHTML = `<div class="section-title"><h3>ROUND ${fight.step + 1} · ${opponent.name}와 경기 중</h3><span class="tag">${fight.step}/3 라운드 선택 완료</span></div><div class="fight-scoreboard"><div><small>${escapeHtml(data.name)}</small><b>${Math.round(fight.playerScore)}</b></div><span>VS</span><div><small>${opponent.name}</small><b>${Math.round(fight.enemyScore)}</b></div></div><div class="fight-live-log" aria-live="polite">${visibleLines || '<p class="fight-line latest">종이 울렸습니다. 코치의 전략을 선택하세요.</p>'}</div><h4 class="decision-title">이번 순간, 어떤 전략을 선택할까요?</h4><div class="tactic-grid">${choices}</div>`;
  }
  function startBout(data) {
    const opponent = OPPONENTS[data.pendingBout];
    const stats = data.stats;
    const styleBonus = data.style === 'outboxer' ? stats.speed * .27 + stats.defense * .12 : data.style === 'slugger' ? stats.power * .31 : stats.stamina * .22 + stats.power * .1;
    const playerScore = stats.power * .32 + stats.speed * .25 + stats.stamina * .24 + stats.defense * .19 + styleBonus * .2 + data.energy * .025 + data.condition * .02 + (data.personality === 'bold' ? 1 : 0) + Math.random() * 4;
    const enemy = opponent.stats;
    const enemyScore = enemy.power * .32 + enemy.speed * .25 + enemy.stamina * .24 + enemy.defense * .19 + Math.random() * 8;
    data.liveFight = { opponentIndex: data.pendingBout, step: 0, playerScore, enemyScore, lines: ['종이 울렸습니다. 두 선수가 중앙에서 잽을 주고받습니다.'] };
    addLog(data, `<strong>${opponent.name}와의 시합 시작!</strong> 코너에서 작전을 선택하며 경기를 이끕니다.`);
    writeState(data);
    renderTab();
  }
  function chooseTactic(index) {
    const data = readState();
    if (!data?.liveFight) return;
    const fight = data.liveFight;
    const roundChoices = ROUNDS[fight.step];
    const choice = roundChoices[index];
    if (!choice) return;
    const values = data.stats;
    const tacticValue = values[choice.stat] * .12 + choice.amount * 1.1;
    fight.playerScore += tacticValue + Math.random() * 1.5;
    fight.enemyScore += Math.random() * 1.3;
    if (choice.stat === 'power') fight.enemyScore += 1.5;
    if (choice.stat === 'defense') fight.enemyScore -= 2;
    if (choice.second) fight.playerScore += values[choice.second] * .05 + choice.secondAmount * .6;
    fight.lines.push(`ROUND ${fight.step + 1}: ${choice.text}`);
    if (fight.step < 2) {
      const pressure = fight.enemyScore > fight.playerScore ? '상대가 조금 앞서고 있습니다.' : '좋은 흐름을 이어가고 있습니다.';
      fight.lines.push(`라운드 종료, 코너로 돌아옵니다. ${pressure}`);
    }
    fight.step += 1;
    writeState(data);
    if (fight.step === 3) finishFight(data);
    else renderTab();
  }
  function finishFight(data) {
    const fight = data.liveFight;
    const opponent = OPPONENTS[fight.opponentIndex];
    const won = fight.playerScore + Math.random() * 2 >= fight.enemyScore;
    const margin = Math.abs(Math.round(fight.playerScore - fight.enemyScore));
    data.energy = Math.max(0, data.energy - 25);
    data.condition = Math.max(0, data.condition - 12);
    if (won) {
      data.wins = (data.wins || 0) + 1;
      data.money += opponent.reward;
      const fame = 15 + opponent.stage * 8;
      data.fame += fame;
      data.unlockedStage = Math.min(OPPONENTS.length, Math.max(data.unlockedStage || 1, opponent.stage + 1));
      if (data.careerLevel !== 'pro' && data.wins >= 5 && data.fame >= 90) {
        data.careerLevel = 'pro';
        addLog(data, '<strong>프로 전향!</strong> 아마추어 무대의 성적을 인정받아 프로 커리어를 시작합니다.');
      }
      addLog(data, `<strong>${opponent.name}에게 승리!</strong> 보상 ${opponent.reward}G와 명성 ${fame}을 획득했습니다.`);
    } else {
      data.losses = (data.losses || 0) + 1;
      data.money += 20;
      addLog(data, `<strong>${opponent.name}과의 경기에서 패배.</strong> 참가 보상 20G를 받았습니다. 다시 훈련해 재도전하세요.`);
    }
    data.lastFight = { won, opponent: opponent.name, margin, lines: fight.lines.slice() };
    delete data.pendingBout;
    delete data.campDays;
    delete data.campFocus;
    delete data.liveFight;
    writeState(data);
    syncProfile(data);
    tabContent.innerHTML = `<div class="fight-result ${won ? 'win' : 'loss'}"><p class="eyebrow">FULL-TIME · ${opponent.title}</p><h3>${won ? '승리! 다음 단계가 열렸습니다.' : '아쉬운 패배, 다시 도전할 수 있어요.'}</h3><div class="fight-scoreboard"><div><small>${escapeHtml(data.name)}</small><b>${won ? 'WIN' : 'LOSE'}</b></div><span>${margin}점 차</span><div><small>${opponent.name}</small><b>경기 종료</b></div></div><div class="fight-live-log">${fight.lines.map((line) => `<p class="fight-line">${line}</p>`).join('')}<p class="fight-line latest">${won ? '심판의 손이 당신 쪽으로 올라갑니다! 관중의 환호가 경기장을 채웁니다.' : '심판 판정이 상대에게 향합니다. 코치가 다음 훈련 계획을 준비합니다.'}</p></div><button class="button button-primary" type="button" data-up-back-opponents>상대 목록으로</button></div>`;
  }
  function renderGym(data) {
    const goods = ITEMS.map((item) => `<article class="shop-card"><span class="action-icon">${item.icon}</span><h4>${item.name}</h4><p>${item.description}</p><button type="button" data-up-buy="${item.id}">구입 · ${item.price}G</button></article>`).join('');
    const bag = (data.inventory || []).map((id, i) => {
      const item = ITEMS.find((entry) => entry.id === id);
      return item ? `<div class="bag-row"><span>${item.icon} ${item.name}</span><button type="button" data-up-use="${i}">사용</button></div>` : '';
    }).join('') || '<p class="empty-bag">가방이 비어 있어요. 필요한 아이템을 구입해 보세요.</p>';
    tabContent.innerHTML = `<div class="gym-layout"><div><div class="section-title"><h3>복싱장 매점</h3></div><div class="shop-grid">${goods}</div><div class="stats-heading"><h3>내 가방</h3><span>${(data.inventory || []).length}개 보유</span></div><div class="bag-list">${bag}</div></div><div><div class="section-title"><h3>관장의 조언</h3></div><div class="gym-note"><b>“좋은 복서는 자기 리듬을 안다.”</b><br>에너지가 낮으면 경기에서 실력이 제대로 나오지 않아. 훈련과 휴식의 균형을 잡고, 네 스타일에 맞는 능력치를 키워 보렴.<br><br>아웃복서는 스피드, 슬러거는 힘, 인파이터는 스태미나가 핵심이야.</div><div class="gym-note" style="margin-top:10px"><b>커리어 기록</b><br>경기 전 에너지 25 이상 필요 · 훈련은 에너지 18 소모 · 승리 시 다음 상대 해금</div></div></div>`;
  }
  function renderTab() {
    const data = readState();
    if (!data || !tabContent) return;
    syncProfile(data);
    if (data.liveFight) renderFight(data);
    else if (Number.isInteger(data.pendingBout)) renderCamp(data);
    else if (activeTab === 'training') renderTraining(data);
    else if (activeTab === 'opponents') renderOpponents(data);
    else renderGym(data);
  }
  function handleAction(event) {
    const target = event.target.closest('button');
    if (!target) return;
    const data = readState();
    if (!data) return;
    if (target.hasAttribute('data-up-matchmake')) {
      if (data.energy < 25) return showToast('에너지가 부족해요. 먼저 휴식해 주세요.');
      data.careerLevel = data.careerLevel || 'amateur';
      const match = chooseOpponent(data);
      if (!match) return showToast('현재 배정할 수 있는 상대가 없습니다.');
      data.pendingBout = match.index;
      data.recentOpponents = [...(data.recentOpponents || []), match.index].slice(-3);
      data.campDays = 0;
      data.campFocus = data.style === 'slugger' ? 'power' : data.style === 'swarm' ? 'stamina' : 'speed';
      addLog(data, `<strong>매치메이커가 ${OPPONENTS[match.index].name}와 시합을 잡았습니다.</strong> 훈련 캠프를 시작합니다.`);
      writeState(data);
      setActiveTab('opponents');
    } else if (target.hasAttribute('data-up-camp-train')) {
      if ((data.campDays || 0) >= 3 || data.energy < 10 || (data.restDaysRemaining || 0) > 0) return;
      const focus = $('#camp-focus').value;
      data.stats[focus] = Math.min(99, data.stats[focus] + 1);
      data.energy = Math.max(0, data.energy - 10);
      data.condition = Math.max(0, data.condition - 2);
      data.campDays = (data.campDays || 0) + 1;
      recordTrainingDay(data);
      addLog(data, `<strong>캠프 ${data.campDays}일 차:</strong> ${INFO[focus].name} 집중 훈련으로 능력치가 1 올랐습니다.`);
      writeState(data); renderTab(); showToast(`${INFO[focus].name} +1 · 캠프 ${data.campDays}/3일`);
    } else if (target.hasAttribute('data-up-camp-rest')) {
      takeRestDay(data);
      data.energy = Math.min(100, data.energy + 30);
      data.condition = Math.min(100, data.condition + (data.personality === 'steady' ? 18 : 12));
      addLog(data, '훈련 캠프에서 휴식해 에너지와 컨디션을 회복했습니다.');
      writeState(data); renderTab();
    } else if (target.hasAttribute('data-up-bell')) {
      if (data.energy < 25 || (data.campDays || 0) < 1) return;
      startBout(data);
    } else if (target.hasAttribute('data-up-cancel')) {
      addLog(data, `${OPPONENTS[data.pendingBout].name}와의 시합을 취소했습니다.`);
      delete data.pendingBout; delete data.campDays; delete data.campFocus;
      writeState(data); renderTab();
    } else if (target.dataset.upTactic !== undefined) chooseTactic(Number(target.dataset.upTactic));
    else if (target.hasAttribute('data-up-back-opponents')) setActiveTab('opponents');
    else if (target.dataset.upTrain) {
      const gain = data.personality === 'disciplined' ? 2 : 1;
      if ((data.restDaysRemaining || 0) > 0) return showToast(`필수 휴식 ${data.restDaysRemaining}일을 먼저 마쳐야 합니다.`);
      if (data.energy < 18) return showToast('에너지가 부족해요. 먼저 휴식해 주세요.');
      data.stats[target.dataset.upTrain] = Math.min(99, data.stats[target.dataset.upTrain] + gain);
      data.energy = Math.max(0, data.energy - 18);
      data.condition = Math.max(0, data.condition - (data.personality === 'steady' ? 2 : 4));
      recordTrainingDay(data);
      addLog(data, `<strong>${INFO[target.dataset.upTrain].name} 훈련</strong> 완료! 능력치가 ${gain} 올랐습니다.`);
      writeState(data); renderTab(); showToast(`${INFO[target.dataset.upTrain].name} +${gain} · 훈련 완료!`);
    } else if (target.hasAttribute('data-up-rest')) {
      const before = data.energy;
      const mandatory = takeRestDay(data);
      data.energy = Math.min(100, data.energy + 30);
      data.condition = Math.min(100, data.condition + (data.personality === 'steady' ? 18 : 12));
      if (!mandatory && before === 100 && data.condition === 100) return showToast('이미 컨디션이 충분히 좋아요.');
      addLog(data, mandatory ? `필수 휴식일을 보냈습니다. ${data.restDaysRemaining ? `남은 휴식 ${data.restDaysRemaining}일.` : '훈련 주기가 초기화되었습니다.'}` : '하루 동안 푹 쉬었습니다. 에너지와 컨디션이 회복됐습니다.');
      writeState(data); renderTab();
    } else if (target.dataset.upBuy) {
      const item = ITEMS.find((entry) => entry.id === target.dataset.upBuy);
      if (data.money < item.price) return showToast('돈이 부족해요. 경기를 통해 보상을 모아 보세요.');
      data.money -= item.price; data.inventory = data.inventory || []; data.inventory.push(item.id);
      addLog(data, `${item.name}을(를) 구입했습니다.`); writeState(data); renderTab();
    } else if (target.dataset.upUse !== undefined) {
      const index = Number(target.dataset.upUse), id = data.inventory[index];
      if (id === 'drink') data.energy = Math.min(100, data.energy + 35);
      if (id === 'meal') data.condition = Math.min(100, data.condition + 30);
      if (id === 'wrap') data.stats.power = Math.min(99, data.stats.power + 2);
      data.inventory.splice(index, 1);
      const item = ITEMS.find((entry) => entry.id === id);
      if (item) addLog(data, `${item.name}을(를) 사용했습니다.`);
      writeState(data); renderTab();
    }
  }

  $('#create-form').addEventListener('submit', () => {
    setTimeout(() => {
      const data = readState();
      if (!data) return;
      data.hairStyle = $('#hair-style').value;
      data.hairColor = $('#hair-color').value;
      data.build = $('#build').value;
      data.outfitColor = $('#outfit-color').value;
      data.careerLevel = 'amateur';
      data.trainingDaysInCycle = 0;
      data.restDaysRemaining = 0;
      writeState(data);
      activeTab = 'training';
      renderTab();
    }, 0);
  });
  ['player-name', 'appearance', 'hair-style', 'hair-color', 'build', 'outfit-color'].forEach((id) => $(`#${id}`).addEventListener('input', updatePreview));
  ['appearance', 'hair-style', 'hair-color', 'build', 'outfit-color'].forEach((id) => $(`#${id}`).addEventListener('change', updatePreview));
  tabContent.addEventListener('click', handleAction, true);
  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault(); event.stopImmediatePropagation(); setActiveTab(button.dataset.tab);
  }, true));
  updatePreview();
  const saved = readState();
  if (saved) { activeTab = 'training'; syncProfile(saved); renderTab(); }
})();
