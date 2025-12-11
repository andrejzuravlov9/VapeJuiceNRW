/* Simple SPA logic + cart using localStorage
   - Assumes assets/logo.svg exists
   - Price per item 15 EUR
*/

const PRICE = 15;
const state = {
  city: localStorage.getItem('vj_city') || null,
  cart: JSON.parse(localStorage.getItem('vj_cart') || '[]'),
  selectedProducer: null,
  selectedType: null,
  selectedFlavor: null
};

function save() {
  localStorage.setItem('vj_city', state.city || '');
  localStorage.setItem('vj_cart', JSON.stringify(state.cart));
  renderCartCount();
}

/* --- helpers --- */
function qs(sel,ctx=document){return ctx.querySelector(sel)}
function qsa(sel,ctx=document){return Array.from(ctx.querySelectorAll(sel))}

function showPage(id){
  document.querySelectorAll('.page').forEach(p => p.classList.add('page-hidden'));
  const el = document.getElementById(id);
  if(el) el.classList.remove('page-hidden');
  window.scrollTo({top:0,behavior:'smooth'});
}

/* --- initialize home --- */
function initHome(){
  // select previous city
  if(state.city){
    qsa('.city').forEach(b => {
      b.classList.toggle('active', b.dataset.city === state.city);
    });
  }
  qsa('.city').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.city').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.city = btn.dataset.city;
      save();
    });
  });

  qs('#btnContinue').addEventListener('click', () => {
    // require city
    if(!state.city){
      alert('Выберите город доставки.');
      return;
    }
    showPage('manufacturers');
  });

  // info modal
  qs('#infoBtn').addEventListener('click', () => openModal('infoModal'));
  qsa('[data-close]').forEach(b => b.addEventListener('click', () => closeAllModals()));
}

/* --- producers --- */
const PRODUCERS = Array.from({length:8}).map((_,i)=>({
  id:`p${i+1}`,
  name:`Producer ${i+1}`,
  img:`https://via.placeholder.com/300x300.png?text=P${i+1}`
}));

function renderProducers(){
  const root = qs('#producersGrid');
  root.innerHTML = '';
  PRODUCERS.forEach(p => {
    const card = document.createElement('button');
    card.className = 'producer-card';
    card.innerHTML = `<img src="${p.img}" alt="${p.name}"><div class="small muted" style="position:absolute;bottom:8px;left:12px">${p.name}</div>`;
    card.addEventListener('click', () => {
      state.selectedProducer = p;
      save();
      // go to flavors / choose type
      showPage('flavors');
      qs('#flavorsTitle').textContent = `Производитель: ${p.name}`;
    });
    root.appendChild(card);
  });
}

/* --- flavors grid (20 placeholders) --- */
function renderFlavors(){
  const root = qs('#flavorsGrid');
  root.innerHTML = '';
  for(let i=1;i<=20;i++){
    const card = document.createElement('button');
    card.className = 'flavor-card';
    card.innerHTML = `<div class="small muted">Вкус #${i}</div>`;
    // attach click: open product modal
    card.addEventListener('click', () => {
      openProductModal({
        id:`f${i}`,
        name:`Вкус #${i}`,
        producer: state.selectedProducer ? state.selectedProducer.name : '—',
        type: state.selectedType || 'liquid',
        stock: 12
      });
    });
    root.appendChild(card);
  }
}

/* --- product modal --- */
function openProductModal(product){
  const modal = qs('#productModal');
  qs('#productName').textContent = product.name;
  qs('#productMeta').textContent = `${product.producer} · ${product.type === 'pod' ? 'POD' : 'Жидкость'}`;
  qs('#productStock').textContent = `В наличии: ${product.stock} шт`;
  qs('#qtyInput').value = 1;
  modal.classList.remove('modal-hidden');

  // events
  qs('#qtyMinus').onclick = () => {
    const input = qs('#qtyInput');
    input.value = Math.max(1, Number(input.value)-1);
  };
  qs('#qtyPlus').onclick = () => {
    const input = qs('#qtyInput');
    input.value = Math.min(product.stock, Number(input.value)+1);
  };
  qs('#modalClose').onclick = () => modal.classList.add('modal-hidden');

  qs('#addToCartBtn').onclick = () => {
    const qty = Number(qs('#qtyInput').value);
    addToCart({
      id: product.id,
      name: product.name,
      producer: product.producer,
      type: product.type,
      qty,
      price: PRICE
    });
    modal.classList.add('modal-hidden');
    toast(`Добавлено: ${product.name} ×${qty}`);
    // return to manufacturers (per spec)
    showPage('manufacturers');
  };
}

/* --- cart logic --- */
function addToCart(item){
  // if exists, increment
  const found = state.cart.find(i => i.id === item.id && i.type===item.type);
  if(found){
    found.qty += item.qty;
  } else {
    state.cart.push(item);
  }
  save();
}
function renderCartCount(){
  const total = state.cart.reduce((s,i)=>s+i.qty,0);
  qs('#cartCount').textContent = total;
  qs('#cartCount2').textContent = total;
}
function renderReceipt(){
  const root = qs('#receiptBlock');
  root.innerHTML = '';
  const header = document.createElement('div');
  header.className='center small muted';
  const date = new Date().toLocaleString();
  header.innerHTML = `<div>Город: ${state.city || '—'}</div><div>Дата: ${date}</div>`;
  root.appendChild(header);

  if(state.cart.length===0){
    root.innerHTML += `<div class="center small" style="margin-top:18px">Корзина пуста</div>`;
    return;
  }

  state.cart.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<div>${it.producer} · ${it.type} · ${it.name} ×${it.qty}</div><div>${(it.price*it.qty).toFixed(2)}€</div>`;
    root.appendChild(row);
  });

  const total = state.cart.reduce((s,i)=>s + i.qty*i.price,0);
  const totRow = document.createElement('div');
  totRow.className='row';
  totRow.style.fontWeight='700';
  totRow.innerHTML = `<div>Итого</div><div>${total.toFixed(2)}€</div>`;
  root.appendChild(totRow);
}

/* --- copy receipt --- */
function copyReceiptText(){
  const lines = [];
  lines.push(`Город: ${state.city || '—'}`);
  lines.push(`Дата: ${new Date().toLocaleString()}`);
  lines.push('---');
  state.cart.forEach(i => {
    lines.push(`${i.producer} · ${i.type} · ${i.name} ×${i.qty} — ${(i.qty*i.price).toFixed(2)}€`);
  });
  lines.push('---');
  lines.push(`Итого: ${(state.cart.reduce((s,i)=>s+i.qty*i.price,0)).toFixed(2)}€`);
  const text = lines.join('\n');
  navigator.clipboard?.writeText(text).then(()=>toast('Чек скопирован в буфер обмена')).catch(()=>alert('Не удалось скопировать'));
}

/* --- clear cart confirm --- */
function clearCartConfirmed(){
  state.cart = [];
  save();
  renderReceipt();
  showPage('home');
}

/* --- toast --- */
let toastTimeout;
function toast(text){
  const existing = qs('.app-toast');
  if(existing) existing.remove();
  const t = document.createElement('div');
  t.className='app-toast';
  t.style.position='fixed';t.style.left='50%';t.style.bottom='110px';t.style.transform='translateX(-50%)';
  t.style.padding='10px 16px';t.style.borderRadius='10px';t.style.background='rgba(0,0,0,0.7)';t.style.color='white';
  t.textContent = text;
  document.body.appendChild(t);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>t.remove(),2200);
}

/* --- modal util --- */
function openModal(id){ qs(id) ? qs(id).classList.remove('modal-hidden') : null; }
function closeAllModals(){
  document.querySelectorAll('.modal-card').forEach(m => {
    if(m.closest('.modal-hidden')) return;
    m.closest('.modal-hidden')?.classList.add('modal-hidden');
  });
  // simpler:
  document.querySelectorAll('[id$="Modal"]').forEach(el=>{
    if(!el.classList.contains('modal-hidden')) el.classList.add('modal-hidden');
  });
}

/* --- order complete --- */
function placeOrder(){
  if(state.cart.length===0){ alert('Корзина пуста'); return; }
  if(!confirm('Подтвердить заказ?')) return;
  // Here Telegram Mini App should close the webview — attempt:
  try{
    if(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.close) {
      window.Telegram.WebApp.close();
    } else {
      // fallback - simple message
      alert('Заказ подтвержден. (В mini app вызовется закрытие)');
      // optionally clear cart
      state.cart = [];
      save();
      showPage('home');
    }
  }catch(e){
    alert('Заказ подтвержден. Ошибка при закрытии mini app.');
  }
}

/* --- init all --- */
function init(){
  initHome();
  renderProducers();
  renderFlavors();
  renderCartCount();

  // navigation for elements with data-target
  qsa('[data-target]').forEach(b=>{
    b.addEventListener('click', ()=> {
      showPage(b.dataset.target);
      if(b.dataset.target === 'manufacturers') {
        renderProducers();
      } else if(b.dataset.target === 'home') {
        showPage('home');
      }
    });
  });

  // open cart
  qs('#openCartBtn').addEventListener('click', ()=> { showPage('cart'); renderReceipt(); });
  qs('#openCartBtn2').addEventListener('click', ()=> { showPage('cart'); renderReceipt(); });

  // order / copy / clear
  qs('#copyReceipt').addEventListener('click', copyReceiptText);
  qs('#clearCart').addEventListener('click', ()=> openModal('confirmModal'));
  qs('#confirmClear').addEventListener('click', ()=> { clearCartConfirmed(); closeAllModals(); });

  qs('#orderBtn').addEventListener('click', placeOrder);

  // close product modal when clicking backdrop
  document.addEventListener('click', (e)=>{
    if(e.target.classList.contains('modal-backdrop')){
      closeAllModals();
    }
  });

  // initial page
  showPage('home');
}

document.addEventListener('DOMContentLoaded', init);
