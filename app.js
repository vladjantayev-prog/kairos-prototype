// цели на день (потом заменим на расчёт по анкете)
const GOALS = { cal: 1800, p: 130, c: 240, f: 60 };

const state = {
  tab: 'breakfast',
  step: 0,        // 0: белок/основной выбор, далее шаги
  cart: JSON.parse(localStorage.getItem('kairos_cart') || '[]'),
  history: []     // для Undo
};

const el = s => document.querySelector(s);
const els = s => [...document.querySelectorAll(s)];
const fmt = n => Math.round(n);

function setGoalsUI(){
  el('#calGoal').textContent = GOALS.cal;
  el('#pGoal').textContent   = GOALS.p;
  el('#cGoal').textContent   = GOALS.c;
  el('#fGoal').textContent   = GOALS.f;
}
setGoalsUI();

function recalcTotals(){
  const t = state.cart.reduce((a,i)=>({
      cal:a.cal+i.kcal, p:a.p+i.p, c:a.c+i.c, f:a.f+i.f
  }), {cal:0,p:0,c:0,f:0});
  el('#tCal').textContent = fmt(t.cal);
  el('#tP').textContent   = fmt(t.p);
  el('#tC').textContent   = fmt(t.c);
  el('#tF').textContent   = fmt(t.f);

  el('#calUsed').textContent = fmt(t.cal);
  el('#pUsed').textContent   = fmt(t.p);
  el('#cUsed').textContent   = fmt(t.c);
  el('#fUsed').textContent   = fmt(t.f);
}
function saveCart(){
  localStorage.setItem('kairos_cart', JSON.stringify(state.cart));
  recalcTotals(); renderCart();
}

function renderTabs(){
  els('.tab').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===state.tab);
  });
}
function sectionFor(tab){
  if(tab==='snack') return ['items'];
  if(tab==='breakfast') return ['protein','carbs','fats'];
  if(tab==='lunch') return ['protein','veg','carbs','fats'];
  if(tab==='dinner') return ['protein','veg','carbs','fats'];
  return [];
}

function renderStep(){
  const root = el('#stepRoot'); root.innerHTML='';
  const data = PRODUCTS[state.tab];
  const sections = sectionFor(state.tab);
  const stepKey = sections[Math.min(state.step, sections.length-1)];
  const list = (data[stepKey] || []);

  // заголовок
  const h = document.createElement('h3');
  h.textContent = stepTitle(stepKey);
  root.appendChild(h);

  const grid = document.createElement('div');
  grid.className='grid3';

  list.forEach(item=>{
    const card = document.createElement('div'); card.className='item';
    card.innerHTML = `
      <div class="item_title">${item.name}</div>
      <div class="item_meta">${item.portion}</div>
      <div class="item_meta">Ккал ${fmt(item.kcal)} · Б ${item.p} · У ${item.c} · Ж ${item.f}</div>
      <div class="actions">
        <button class="btn btn--ghost" data-act="add" data-id="${item.id}">Добавить</button>
      </div>`;
    grid.appendChild(card);
  });
  root.appendChild(grid);

  // навигация по шагам
  const nav = document.createElement('div'); nav.className='actions'; nav.style.marginTop='12px';
  const back = document.createElement('button'); back.className='btn btn--ghost'; back.textContent='Назад';
  const next = document.createElement('button'); next.className='btn'; next.textContent='Далее';
  back.onclick = ()=>{ state.step = Math.max(0, state.step-1); renderStep(); };
  next.onclick = ()=>{ state.step = Math.min(sections.length-1, state.step+1); renderStep(); };
  nav.append(back,next);
  root.appendChild(nav);

  root.addEventListener('click', e=>{
    const btn=e.target.closest('[data-act="add"]'); if(!btn) return;
    const id = btn.dataset.id;
    const item = (list.find(x=>x.id===id));
    if(!item) return;
    state.history.push(JSON.stringify(state.cart));
    state.cart.push({...item, tab: state.tab});
    saveCart();
  });
}
function stepTitle(key){
  return {
    protein:'Выбери источник белка', veg:'Добавь овощи',
    carbs:'Выбери гарнир/углеводы', fats:'Добавь полезные жиры',
    items:'Выбери перекус'
  }[key] || 'Выбор';
}

function renderCart(){
  const box = el('#cartList'); box.innerHTML='';
  state.cart.forEach((i,idx)=>{
    const row=document.createElement('div'); row.className='cart_row'; row.tabIndex=0;
    row.dataset.idx = idx;
    row.innerHTML = `
      <div><b>${i.name}</b> <small>(${i.portion}) • ${labelTab(i.tab)}</small></div>
      <div><small>К ${fmt(i.kcal)} · Б ${i.p} · У ${i.c} · Ж ${i.f}</small>
        <button class="btn btn--ghost" data-rm="${idx}">×</button></div>`;
    box.appendChild(row);
  });
  box.onclick = e=>{
    const rm = e.target.closest('[data-rm]');
    if(rm){ state.history.push(JSON.stringify(state.cart));
      state.cart.splice(+rm.dataset.rm,1); saveCart(); }
  };
}
function labelTab(t){ return {breakfast:'завтрак',lunch:'обед',dinner:'ужин',snack:'перекус'}[t]||''; }

// — события UI —
els('.tab').forEach(b=> b.onclick = ()=>{
  state.tab = b.dataset.tab; state.step = 0; renderTabs(); renderStep();
});
el('#saveMeal').onclick = ()=>{ alert('Приём пищи сохранён в корзине дня ✅'); };
el('#clearDay').onclick = ()=>{ state.history.push(JSON.stringify(state.cart)); state.cart=[]; saveCart(); };
el('#undo').onclick = ()=>{
  const last = state.history.pop(); if(!last) return;
  state.cart = JSON.parse(last); saveCart();
};
el('#doublePortion').onclick = ()=>{
  const rows = els('.cart_row:focus'); // выдели строку кликом/Tab
  if(rows.length===0){ alert('Нажми по позиции в корзине, затем ×2'); return; }
  const idx = +rows[0].dataset.idx;
  const i = state.cart[idx]; state.history.push(JSON.stringify(state.cart));
  state.cart[idx] = {...i, kcal:i.kcal*2, p:i.p*2, c:i.c*2, f:i.f*2, portion: i.portion+' ×2'};
  saveCart();
};

// init
renderTabs(); renderStep(); recalcTotals(); renderCart();
