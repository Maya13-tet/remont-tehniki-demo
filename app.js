(function(){
'use strict';

/* ---------- настройки: после подключения таблицы вставить два адреса ---------- */
var CONFIG={
  PRICES_URL:'',   /* адрес веб-приложения Google Apps Script (чтение цен) */
  FORM_URL:''      /* тот же адрес (приём заявок) */
};

var $=function(s){return document.querySelector(s)};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- образец прайса (показывается, пока нет таблицы) ---------- */
var SAMPLE=[
  {cat:'Электроинструмент',name:'Замена кнопки пуска (дрель, шуруповёрт)',price:600,from:true},
  {cat:'Электроинструмент',name:'Замена угольных щёток',price:400,from:true},
  {cat:'Электроинструмент',name:'Замена сетевого шнура',price:350,from:true},
  {cat:'Электроинструмент',name:'Ремонт или замена патрона',price:500,from:true},
  {cat:'Электроинструмент',name:'Замена подшипников',price:700,from:true},
  {cat:'Электроинструмент',name:'Ремонт редуктора болгарки',price:900,from:true},
  {cat:'Кухонная техника',name:'Замена ножа или привода (блендер, миксер)',price:500,from:true},
  {cat:'Кухонная техника',name:'Ремонт электродвигателя',price:800,from:true},
  {cat:'Кухонная техника',name:'Замена шестерён мясорубки',price:700,from:true},
  {cat:'Чайники и кофеварки',name:'Замена нагревательного элемента',price:700,from:true},
  {cat:'Чайники и кофеварки',name:'Замена шнура или базы чайника',price:400,from:true},
  {cat:'Чайники и кофеварки',name:'Чистка кофеварки от накипи',price:500,from:true},
  {cat:'Пылесосы',name:'Замена сетевого шнура и смотчика',price:600,from:true},
  {cat:'Пылесосы',name:'Замена двигателя',price:1500,from:true},
  {cat:'Пылесосы',name:'Чистка и замена фильтров',price:400,from:true},
  {cat:'Утюги и фены',name:'Замена термостата утюга',price:600,from:true},
  {cat:'Утюги и фены',name:'Замена шнура фена',price:350,from:true},
  {cat:'Утюги и фены',name:'Ремонт нагревателя фена',price:500,from:true}
];

/* иконки и описания категорий (новые категории из таблицы получают значок по умолчанию) */
var ICO={
  tool:'<path d="M5 15h24a4 4 0 014 4v4H21l-3 13h-6l2-13H5z"/><path d="M33 19h7M33 23h7"/>',
  mix:'<path d="M13 6h18l-3 22H16z"/><path d="M11 6h22"/><rect x="15" y="28" width="14" height="9" rx="2"/>',
  kettle:'<path d="M10 19h22l-2 17H12z"/><path d="M32 23h4a3.5 3.5 0 010 9h-3"/><path d="M14 19c0-6 3-8 7-8s7 2 7 8"/><path d="M21 7v4"/>',
  vac:'<circle cx="15" cy="31" r="6"/><circle cx="33" cy="33" r="4"/><path d="M15 25V12h7M22 12l13 21"/>',
  iron:'<path d="M5 33h33c0-9-6-16-15-16H15c-5 0-10 5-10 16z"/><path d="M5 38h33"/><path d="M15 17v-5h11"/>',
  gear:'<circle cx="22" cy="22" r="6"/><path d="M22 6v6M22 32v6M6 22h6M32 22h6M11 11l4 4M29 29l4 4M33 11l-4 4M15 29l-4 4"/>'
};
var META={
  'Электроинструмент':{i:'tool',t:'Дрели, шуруповёрты, болгарки, перфораторы.'},
  'Кухонная техника':{i:'mix',t:'Блендеры, миксеры, мясорубки, измельчители.'},
  'Чайники и кофеварки':{i:'kettle',t:'Электрочайники, кофеварки, термопоты.'},
  'Пылесосы':{i:'vac',t:'Бытовые и ручные пылесосы.'},
  'Утюги и фены':{i:'iron',t:'Утюги, отпариватели, фены.'}
};
function meta(c){return META[c]||{i:'gear',t:'Цены на ремонт смотрите в прайсе.'}}

var items=SAMPLE,cats=[],cur=0,live=false;

function fmt(it){return (it.from?'от ':'')+Number(it.price).toLocaleString('ru-RU')+' ₽'}
function buildCats(){
  cats=[];
  items.forEach(function(it){if(cats.indexOf(it.cat)<0)cats.push(it.cat)});
  if(cur>=cats.length)cur=0;
}

function renderServ(){
  var ul=$('#serv');ul.innerHTML='';
  cats.forEach(function(c,i){
    var m=meta(c),li=document.createElement('li'),b=document.createElement('button');
    b.type='button';
    b.innerHTML='<svg viewBox="0 0 44 44" aria-hidden="true">'+ICO[m.i]+'</svg><h3></h3><p></p>';
    b.querySelector('h3').textContent=c;
    b.querySelector('p').textContent=m.t;
    b.onclick=function(){cur=i;renderPrice();$('#prajs').scrollIntoView({behavior:reduce?'auto':'smooth'})};
    li.appendChild(b);ul.appendChild(li);
  });
}

function renderPrice(){
  var box=$('#tabs');box.innerHTML='';
  cats.forEach(function(c,i){
    var b=document.createElement('button');
    b.type='button';b.className='tab';b.setAttribute('role','tab');
    b.setAttribute('aria-selected',i===cur);b.textContent=c;
    b.onclick=function(){cur=i;renderPrice()};
    box.appendChild(b);
  });
  var ul=$('#price');ul.innerHTML='';
  var list=items.filter(function(it){return it.cat===cats[cur]});
  if(!list.length){ul.innerHTML='<li class="empty">В этой категории пока нет позиций.</li>';return}
  list.forEach(function(it){
    var li=document.createElement('li');li.className='row';
    li.innerHTML='<span class="nm"></span><i class="dots"></i><b></b>';
    li.querySelector('.nm').textContent=it.name;
    li.querySelector('b').textContent=fmt(it);
    ul.appendChild(li);
  });
  var n=$('#srcnote');
  n.className='srcnote'+(live?' live':'');
  n.textContent=live?'Цены загружены из таблицы мастерской.':'Образец прайса для демонстрации. В рабочей версии цены подтягиваются из вашей Google Таблицы.';
}

function renderDevice(){
  var s=$('#fd');s.innerHTML='';
  cats.concat(['Другое']).forEach(function(c){
    var o=document.createElement('option');o.textContent=c;s.appendChild(o);
  });
}

function applyData(){buildCats();renderServ();renderPrice();renderDevice()}
applyData();

/* цены из таблицы */
if(CONFIG.PRICES_URL){
  fetch(CONFIG.PRICES_URL).then(function(r){return r.json()}).then(function(d){
    if(d&&d.items&&d.items.length){items=d.items;live=true;applyData()}
  }).catch(function(){/* остаётся образец */});
}

/* ---------- бирка в первом экране ---------- */
var TAG=[
  ['Дрель','не включается','от 600 ₽'],
  ['Чайник','не нагревает воду','от 700 ₽'],
  ['Пылесос','пропала тяга','от 400 ₽'],
  ['Блендер','не крутится нож','от 500 ₽']
];
var el={i:$('#tgItem'),s:$('#tgIssue'),p:$('#tgPrice'),st:$('#tgStamp')};
function show(k){el.i.textContent=TAG[k][0];el.s.textContent=TAG[k][1];el.p.textContent=TAG[k][2];el.st.classList.add('on')}
function typeTo(node,text,done){
  var n=0;node.textContent='';
  (function step(){
    node.textContent=text.slice(0,++n);
    if(n<text.length)setTimeout(step,55);else if(done)setTimeout(done,350);
  })();
}
if(reduce){show(0)}
else{
  var k=0;
  (function cycle(){
    el.st.classList.remove('on');el.p.textContent='по прайсу';el.s.textContent='';
    typeTo(el.i,TAG[k][0],function(){
      typeTo(el.s,TAG[k][1],function(){
        el.p.textContent=TAG[k][2];el.st.classList.add('on');
        k=(k+1)%TAG.length;
        setTimeout(cycle,3200);
      });
    });
  })();
}

/* ---------- форма ---------- */
var f=$('#form'),err=$('#err');
function showErr(msg,node){err.textContent=msg;err.hidden=false;if(node)node.focus()}
function thanks(title,text){
  var th=$('#thanks');
  th.innerHTML='<h3></h3><p></p>';
  th.querySelector('h3').textContent=title;
  th.querySelector('p').textContent=text;
  th.hidden=false;f.hidden=true;
}
f.addEventListener('submit',function(e){
  e.preventDefault();
  var name=$('#fn').value.trim(),ph=$('#fp').value.replace(/\D/g,'');
  if($('#fh').value)return; /* ловушка для ботов */
  if(name.length<2)return showErr('Напишите, как к вам обращаться.',$('#fn'));
  if(ph.length<10)return showErr('Телефон неполный: нужно не меньше десяти цифр.',$('#fp'));
  if(!$('#fc').checked)return showErr('Поставьте галочку согласия на обработку данных.',$('#fc'));
  err.hidden=true;
  var data={name:name,phone:$('#fp').value.trim(),device:$('#fd').value,issue:$('#fi').value.trim()};
  if(!CONFIG.FORM_URL){
    thanks('Спасибо, '+name+'!','Это демо-версия, заявка никуда не отправлена. В рабочем сайте она появится новой строкой в вашей таблице, а мастеру придёт сообщение в Telegram.');
    return;
  }
  var btn=$('#send');btn.disabled=true;btn.textContent='Отправляем...';
  fetch(CONFIG.FORM_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)})
    .then(function(r){return r.json()})
    .then(function(d){
      if(d&&d.ok)thanks('Спасибо, '+name+'!','Заявка принята. Мы перезвоним в рабочее время.');
      else throw new Error('bad');
    })
    .catch(function(){
      btn.disabled=false;btn.textContent='Отправить заявку';
      showErr('Не получилось отправить. Позвоните нам по телефону из раздела «Где нас найти».');
    });
});
})();
