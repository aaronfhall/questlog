(() => {
  'use strict';

  const STORAGE_KEY = 'questlog.state.v1';
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const RANKS = ['Novice','Squire','Adept','Veteran','Champion','Warlord','Legend'];
  const rankFor = (level) => RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 3))];

  function xpToNext(level) { return 90 + (level - 1) * 35; }
  function maxHpFor(level) { return 50 + (level - 1) * 4; }

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function defaultState() {
    return {
      name: 'Adventurer',
      level: 1,
      xp: 0,
      hp: 50,
      gold: 20,
      lastReset: todayStr(),
      habits: [
        { id: uid(), title: 'Drink a glass of water' },
        { id: uid(), title: 'Tidy the workbench' }
      ],
      dailies: [
        { id: uid(), title: 'Morning stretch', done: false, streak: 0 },
        { id: uid(), title: '30 min focused work', done: false, streak: 0 }
      ],
      todos: [
        { id: uid(), title: 'Set up this app the way you like it' }
      ],
      rewards: [
        { id: uid(), title: '30 min guilt-free gaming', cost: 30 },
        { id: uid(), title: 'Order takeout', cost: 60 }
      ]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
    } catch (e) {
      console.error('Questlog: failed to load state', e);
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Questlog: failed to save state', e);
    }
  }

  let state = loadState();

  // ---------- daily reset ----------
  function applyDailyReset() {
    const today = todayStr();
    if (state.lastReset === today) return;

    let missed = 0;
    state.dailies.forEach((d) => {
      if (d.done) {
        d.streak = (d.streak || 0) + 1;
      } else {
        d.streak = 0;
        missed += 1;
      }
      d.done = false;
    });

    if (missed > 0) {
      state.hp = Math.max(0, state.hp - missed * 6);
    }
    state.lastReset = today;
    handleDeathIfNeeded();
    saveState();
  }

  function handleDeathIfNeeded() {
    if (state.hp <= 0) {
      state.hp = maxHpFor(state.level);
      state.gold = Math.floor(state.gold / 2);
      queueToast('Defeated in the field — you respawn at full HP, down half your gold.');
    }
  }

  // ---------- core rewards ----------
  function gainXp(amount) {
    state.xp += amount;
    let leveled = false;
    while (state.xp >= xpToNext(state.level)) {
      state.xp -= xpToNext(state.level);
      state.level += 1;
      state.hp = maxHpFor(state.level);
      leveled = true;
    }
    return leveled;
  }

  function loseHp(amount) {
    state.hp = Math.max(0, state.hp - amount);
    handleDeathIfNeeded();
  }

  function gainGold(amount) {
    state.gold = Math.max(0, state.gold + amount);
  }

  // ---------- toast ----------
  let toastTimer = null;
  function queueToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function floatNumber(text, cls) {
    const wrap = document.getElementById('floaters');
    const span = document.createElement('span');
    span.className = 'floater ' + cls;
    span.textContent = text;
    wrap.appendChild(span);
    setTimeout(() => span.remove(), 1150);
  }

  function flashBar(id) {
    const bar = document.getElementById(id).closest('.bar');
    bar.classList.remove('flash');
    void bar.offsetWidth;
    bar.classList.add('flash');
  }

  function bumpBadge() {
    const badge = document.getElementById('badge');
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  }

  // ---------- render ----------
  function renderSegments(container, count) {
    container.innerHTML = '';
    const n = Math.min(20, Math.max(5, count));
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      container.appendChild(s);
    }
  }

  function render() {
    document.getElementById('heroName').value = state.name;
    document.getElementById('badge').textContent = state.level;
    document.getElementById('levelLabel').textContent = `Level ${state.level}`;
    document.getElementById('rankLabel').textContent = rankFor(state.level);
    document.getElementById('goldCount').textContent = state.gold;

    const maxHp = maxHpFor(state.level);
    const hpPct = Math.max(0, Math.min(1, state.hp / maxHp));
    document.getElementById('hpFill').style.transform = `scaleX(${hpPct})`;
    document.getElementById('hpValue').textContent = `${state.hp}/${maxHp}`;
    renderSegments(document.getElementById('hpSegments'), maxHp / 4);

    const need = xpToNext(state.level);
    const xpPct = Math.max(0, Math.min(1, state.xp / need));
    document.getElementById('xpFill').style.transform = `scaleX(${xpPct})`;
    document.getElementById('xpValue').textContent = `${state.xp}/${need}`;
    renderSegments(document.getElementById('xpSegments'), need / 10);

    renderHabits();
    renderDailies();
    renderTodos();
    renderShop();
  }

  function emptyRow(text) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = text;
    return li;
  }

  function renderHabits() {
    const list = document.getElementById('habitsList');
    list.innerHTML = '';
    if (!state.habits.length) { list.appendChild(emptyRow('No habits yet. Add one below.')); return; }
    state.habits.forEach((h) => {
      const li = document.createElement('li');
      li.className = 'item';
      li.innerHTML = `
        <button class="pill-btn minus" data-act="habit-minus" data-id="${h.id}">−</button>
        <span class="item-title">${escapeHtml(h.title)}</span>
        <button class="pill-btn plus" data-act="habit-plus" data-id="${h.id}">+</button>
        <button class="remove-btn" data-act="habit-remove" data-id="${h.id}">✕</button>
      `;
      list.appendChild(li);
    });
  }

  function renderDailies() {
    const list = document.getElementById('dailiesList');
    list.innerHTML = '';
    if (!state.dailies.length) { list.appendChild(emptyRow('No dailies yet. Add one below.')); return; }
    state.dailies.forEach((d) => {
      const li = document.createElement('li');
      li.className = 'item' + (d.done ? ' done' : '');
      li.innerHTML = `
        <button class="checkbox ${d.done ? 'checked' : ''}" data-act="daily-toggle" data-id="${d.id}">${d.done ? '✓' : ''}</button>
        <span class="item-title">${escapeHtml(d.title)}</span>
        <span class="item-streak">${d.streak > 0 ? d.streak + 'd streak' : ''}</span>
        <button class="remove-btn" data-act="daily-remove" data-id="${d.id}">✕</button>
      `;
      list.appendChild(li);
    });
  }

  function renderTodos() {
    const list = document.getElementById('todosList');
    list.innerHTML = '';
    if (!state.todos.length) { list.appendChild(emptyRow('No quests pending. Add one below.')); return; }
    state.todos.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'item';
      li.innerHTML = `
        <button class="checkbox" data-act="todo-complete" data-id="${t.id}"></button>
        <span class="item-title">${escapeHtml(t.title)}</span>
        <button class="remove-btn" data-act="todo-remove" data-id="${t.id}">✕</button>
      `;
      list.appendChild(li);
    });
  }

  function renderShop() {
    const list = document.getElementById('shopList');
    list.innerHTML = '';
    if (!state.rewards.length) { list.appendChild(emptyRow('No rewards yet. Add one below.')); return; }
    state.rewards.forEach((r) => {
      const canAfford = state.gold >= r.cost;
      const li = document.createElement('li');
      li.className = 'item shop-item';
      li.innerHTML = `
        <span class="item-title">${escapeHtml(r.title)}</span>
        <span class="shop-cost">◆ ${r.cost}</span>
        <button class="buy-btn" data-act="reward-buy" data-id="${r.id}" ${canAfford ? '' : 'disabled'}>Redeem</button>
        <button class="remove-btn" data-act="reward-remove" data-id="${r.id}">✕</button>
      `;
      list.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- actions ----------
  function findById(arr, id) { return arr.find((x) => x.id === id); }

  function onListClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;

    if (act === 'habit-plus') {
      const leveled = gainXp(8);
      gainGold(2);
      floatNumber('+8 xp', 'up');
      flashBar('xpFill');
      if (leveled) { bumpBadge(); queueToast(`Level up! You're now level ${state.level}.`); }
    } else if (act === 'habit-minus') {
      loseHp(5);
      floatNumber('−5 hp', 'down');
      flashBar('hpFill');
    } else if (act === 'habit-remove') {
      state.habits = state.habits.filter((h) => h.id !== id);
    } else if (act === 'daily-toggle') {
      const d = findById(state.dailies, id);
      if (!d) return;
      d.done = !d.done;
      if (d.done) {
        const leveled = gainXp(15);
        gainGold(5);
        floatNumber('+15 xp', 'up');
        flashBar('xpFill');
        if (leveled) { bumpBadge(); queueToast(`Level up! You're now level ${state.level}.`); }
      }
    } else if (act === 'daily-remove') {
      state.dailies = state.dailies.filter((d) => d.id !== id);
    } else if (act === 'todo-complete') {
      const t = findById(state.todos, id);
      if (!t) return;
      const leveled = gainXp(25);
      gainGold(10);
      floatNumber('+25 xp', 'up');
      flashBar('xpFill');
      state.todos = state.todos.filter((x) => x.id !== id);
      queueToast(leveled ? `Quest complete — and level up! You're now level ${state.level}.` : 'Quest complete.');
    } else if (act === 'todo-remove') {
      state.todos = state.todos.filter((t) => t.id !== id);
    } else if (act === 'reward-buy') {
      const r = findById(state.rewards, id);
      if (!r || state.gold < r.cost) return;
      gainGold(-r.cost);
      queueToast(`Redeemed: ${r.title}`);
    } else if (act === 'reward-remove') {
      state.rewards = state.rewards.filter((r) => r.id !== id);
    }

    saveState();
    render();
  }

  function onAddSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const kind = form.dataset.kind;
    const textInput = form.querySelector('input[type="text"]');
    const title = textInput.value.trim();
    if (!title) return;

    if (kind === 'habit') {
      state.habits.push({ id: uid(), title });
    } else if (kind === 'daily') {
      state.dailies.push({ id: uid(), title, done: false, streak: 0 });
    } else if (kind === 'todo') {
      state.todos.push({ id: uid(), title });
    } else if (kind === 'reward') {
      const costInput = form.querySelector('.cost-input');
      const cost = Math.max(1, parseInt(costInput.value, 10) || 1);
      state.rewards.push({ id: uid(), title, cost });
      costInput.value = '';
    }

    textInput.value = '';
    saveState();
    render();
  }

  function onTabClick(e) {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  }

  function onNameChange() {
    state.name = document.getElementById('heroName').value.trim() || 'Adventurer';
    saveState();
  }

  function init() {
    applyDailyReset();
    render();

    document.getElementById('tabs').addEventListener('click', onTabClick);
    document.querySelectorAll('.list').forEach((l) => l.addEventListener('click', onListClick));
    document.querySelectorAll('.add-row').forEach((f) => f.addEventListener('submit', onAddSubmit));
    document.getElementById('heroName').addEventListener('change', onNameChange);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW registration failed', e));
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
