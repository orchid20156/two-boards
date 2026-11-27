/* Two Boards: Learning modes (study style, pace, puzzle difficulty). Loaded after app.js. */
(function(){
'use strict';
var app=document.getElementById('app');
if(!app||typeof state==='undefined')return;
var KEY='tb-learn-v1';
var S={style:'guided',pace:'standard',adaptive:false,lvl:0,streak:0,miss:0,best:{},open:false,text:false};
try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&typeof o==='object')for(var k in S)if(k in o)S[k]=o[k];}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
var STYLES=[
 ['guided','🧭','Guided','Lessons with explanations, quick checks and hints.'],
 ['practice','🎲','Practice','Board first. Explanations are folded away, no pressure.'],
 ['quiz','📝','Quiz','Questions only. Test what you remember.'],
 ['challenge','⏱️','Challenge','No hints. A stopwatch counts your time and keeps your best.']];
var PACES=[
 ['kids','🧒','Kids','Bigger buttons, easy puzzles and hints always on.'],
 ['standard','🙂','Standard','The normal experience.'],
 ['pro','🎓','Pro','No hints, a compact layout and harder puzzles.']];
var DIFFS=['beginner','intermediate','advanced','expert'];
var DNAME={beginner:'Beginner',intermediate:'Intermediate',advanced:'Advanced',expert:'Expert'};
function nm(a,k){for(var i=0;i<a.length;i++)if(a[i][0]===k)return a[i];return a[0];}
function setFilter(v){try{state.puzzles.difficultyFilter=v;}catch(e){}}
function toast(t){var d=document.createElement('div');d.className='lm-toast';d.setAttribute('role','status');d.innerHTML=t;document.body.appendChild(d);setTimeout(function(){d.remove();},3200);}
function screen(){return app.querySelector('.puzzle-diff-filter')?'puzzle':app.querySelector('.learn-bar')?'lesson':'other';}

/* ---------- bar ---------- */
var bar=document.createElement('div');bar.id='px-lm';app.parentNode.insertBefore(bar,app);
function chips(list,cur,key){return list.map(function(r){return '<button type="button" class="px-lm-chip'+(r[0]===cur?' on':'')+'" data-px="'+key+'" data-v="'+r[0]+'" aria-pressed="'+(r[0]===cur)+'"><span aria-hidden="true">'+r[1]+'</span> <span>'+r[2]+'</span></button>';}).join('');}
function barHTML(){
  var st=nm(STYLES,S.style),pc=nm(PACES,S.pace),scr=screen();
  var summary='<button type="button" class="px-lm-sum" data-px="toggle" aria-expanded="'+!!S.open+'"><span aria-hidden="true">🎛️</span> <b>Modes</b> <span class="px-lm-cur"><span>'+st[2]+'</span> · <span>'+pc[2]+'</span>'+(S.adaptive?' · <span>Adaptive</span>':'')+'</span> <span aria-hidden="true">'+(S.open?'▲':'▼')+'</span></button>';
  var clock='<span id="px-clock" class="px-lm-clock" hidden></span>';
  var body='';
  if(S.open){
    body='<div class="px-lm-panel">'+
     '<div class="px-lm-row"><b class="px-lm-h">Study style</b><span class="px-lm-chips">'+chips(STYLES,S.style,'style')+'</span><span class="adv-small px-lm-d">'+st[3]+'</span></div>'+
     '<div class="px-lm-row"><b class="px-lm-h">Pace</b><span class="px-lm-chips">'+chips(PACES,S.pace,'pace')+'</span><span class="adv-small px-lm-d">'+pc[3]+'</span></div>'+
     '<div class="px-lm-row"><b class="px-lm-h">Puzzle difficulty</b><span class="px-lm-chips">'+
       ['all'].concat(DIFFS).map(function(d){var on=!S.adaptive&&((state.puzzles.difficultyFilter||'all')===d);return '<button type="button" class="px-lm-chip'+(on?' on':'')+'" data-px="diff" data-v="'+d+'" aria-pressed="'+on+'"><span>'+(d==='all'?'Mixed':DNAME[d])+'</span></button>';}).join('')+
       '<button type="button" class="px-lm-chip'+(S.adaptive?' on':'')+'" data-px="adaptive" aria-pressed="'+!!S.adaptive+'"><span aria-hidden="true">🎯</span> <span>Adaptive</span></button></span>'+
       '<span class="adv-small px-lm-d">'+(S.adaptive?'<span>Solve two in a row to level up. Ask for the answer or a hint twice to level down.</span> <span>Now:</span> <b><span>'+DNAME[DIFFS[S.lvl]]+'</span></b>':'<span>Choose how hard the puzzles are.</span>')+'</span></div>'+
     (S.style==='practice'&&scr==='lesson'?'<div class="px-lm-row"><button type="button" class="px-lm-chip" data-px="text"><span>'+(S.text?'Hide the explanation':'Show the explanation')+'</span></button></div>':'')+
     '</div>';
  }
  bar.innerHTML='<div class="px-lm-top">'+summary+clock+'</div>'+body;
  refreshClock();
}
function apply(){
  var b=document.body;
  ['guided','practice','quiz','challenge'].forEach(function(x){b.classList.toggle('lm-'+x,S.style===x);});
  ['kids','standard','pro'].forEach(function(x){b.classList.toggle('lm-'+x,S.pace===x);});
  b.classList.toggle('lm-showtext',!!S.text);
  b.dataset.lmScreen=screen();
}
function refresh(){apply();barHTML();}

bar.addEventListener('click',function(e){
  var t=e.target.closest('[data-px]');if(!t)return;
  var a=t.dataset.px,v=t.dataset.v,rerender=false;
  if(a==='toggle')S.open=!S.open;
  else if(a==='style'){S.style=v;S.text=false;}
  else if(a==='pace'){S.pace=v;save();try{window.pxPuzzlePace&&window.pxPuzzlePace(v);}catch(x){}S.adaptive=false;setFilter(v==='kids'?'kids':v==='pro'?'pro':'all');rerender=true;}
  else if(a==='diff'){S.adaptive=false;setFilter(v);rerender=true;}
  else if(a==='adaptive'){S.adaptive=!S.adaptive;if(S.adaptive){setFilter(DIFFS[S.lvl]);S.streak=0;S.miss=0;}rerender=true;}
  else if(a==='text')S.text=!S.text;
  save();
  if(rerender){try{render();}catch(x){}}
  refresh();
});
/* the filter chips inside the puzzle sidebar: add an Adaptive chip, and leave adaptive mode when a normal chip is used */
var _rdf=renderDifficultyFilter;
renderDifficultyFilter=function(){
  var s=_rdf();
  var extra='<button type="button" class="diff-btn'+(S.adaptive?' active':'')+'" data-px="adaptive" aria-pressed="'+!!S.adaptive+'"><span aria-hidden="true">🎯</span> <span>Adaptive</span></button>';
  if(S.adaptive)s=s.replace(/ active"/g,'"');
  var k=s.lastIndexOf('</div>');return s.slice(0,k)+extra+s.slice(k);
};
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-action="puzzles-set-difficulty"]');
  if(t&&S.adaptive){S.adaptive=false;save();}
  var a=e.target.closest&&e.target.closest('#app [data-px="adaptive"]');
  if(a){S.adaptive=!S.adaptive;if(S.adaptive){setFilter(DIFFS[S.lvl]);S.streak=0;S.miss=0;}save();try{render();}catch(x){}refresh();e.stopPropagation();}
},true);

/* ---------- adaptive difficulty ---------- */
function level(d){
  var n=Math.max(0,Math.min(3,S.lvl+d));if(n===S.lvl)return;
  S.lvl=n;S.streak=0;S.miss=0;setFilter(DIFFS[n]);save();
  toast((d>0?'⬆️ ':'⬇️ ')+'<span>Puzzle level</span>: <b><span>'+DNAME[DIFFS[n]]+'</span></b>');
  setTimeout(function(){try{render();}catch(x){}refresh();},50);
}
function wrap(name,fn){if(typeof window[name]==='function'){var o=window[name];window[name]=function(){var r=o.apply(this,arguments);try{fn.apply(null,arguments);}catch(e){}return r;};}}
wrap('markPuzzleSolved',function(){if(!S.adaptive)return;S.streak++;S.miss=0;save();if(S.streak>=2)level(1);});
function struggle(){if(!S.adaptive)return;S.miss++;S.streak=0;save();if(S.miss>=2)level(-1);}
['requestPuzzleHint','answerPuzzleChess','answerPuzzleXiangqi','answerPuzzleGo','answerPuzzleCheckers','answerPuzzleGomoku'].forEach(function(n){wrap(n,struggle);});

/* ---------- Challenge stopwatch ---------- */
var cur='',t0=0,frozen=0;
function fmt(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);}
function refreshClock(){
  var c=document.getElementById('px-clock');if(!c)return;
  var on=S.style==='challenge'&&screen()==='puzzle';c.hidden=!on;if(!on)return;
  var k=(app.querySelector('.kicker')||{}).textContent||'';
  if(k!==cur){cur=k;t0=Date.now();frozen=0;}
  var solved=!!app.querySelector('.puzzle-success');
  if(solved&&!frozen){frozen=Date.now()-t0;var b=S.best[k];if(!b||frozen<b){S.best[k]=frozen;save();}}
  var ms=frozen||Date.now()-t0,b2=S.best[k];
  c.innerHTML='<span aria-hidden="true">⏱️</span> <b>'+fmt(ms)+'</b>'+(b2?' · <span>Best</span> '+fmt(b2):'');
}
setInterval(refreshClock,500);

/* ---------- keep classes in step with whatever the app shows ---------- */
var pend=0;
new MutationObserver(function(){if(pend)return;pend=requestAnimationFrame(function(){pend=0;var s=screen();if(document.body.dataset.lmScreen!==s){document.body.dataset.lmScreen=s;barHTML();}});}).observe(app,{childList:true,subtree:true});
if(S.pace!=='standard'&&!S.adaptive&&!state.puzzles.difficultyFilter)setFilter(S.pace);
refresh();
})();
