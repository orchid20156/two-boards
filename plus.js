/* Two Boards: Adventure Plus. Loaded after app.js. Wraps live globals; never edits the base game's data format. */
(function(){
'use strict';
if(typeof advRender!=='function'||typeof dgBattleHTML!=='function')return;
var KEY='tb-plus-v1';
function load(){try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&typeof o==='object')return o;}catch(e){}return {};}
var P=load();
P.perks=P.perks||{};P.rules=P.rules||'normal';P.quests=P.quests||{};P.stats=P.stats||{};P.daily=P.daily||{};P.run=P.run||null;P.bonus=P.bonus||0;
function save(){try{localStorage.setItem(KEY,JSON.stringify(P));}catch(e){}}
function esc(s){return typeof advEsc==='function'?advEsc(String(s)):String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function hero(){return dgHero();}
function pop(t,k){try{advArcPop(t,k||'combo');}catch(e){}}
function tone2(a){try{if(typeof tone==='function')a.forEach(function(x){tone(x[0],x[1],x[2],x[3]||'square',x[4]||.06);});}catch(e){}}

/* ---------- perks (pick 1 of 2 at hero levels 3, 6, 9, 12) ---------- */
var PERKS=[
 {at:3,o:[{id:'brawn',icon:'💪',name:'Brawn',desc:'+2 Might.',s:{might:2}},{id:'scholar',icon:'📚',name:'Scholar',desc:'+2 Wisdom.',s:{wisdom:2}}]},
 {at:6,o:[{id:'ironwill',icon:'🛡️',name:'Iron Will',desc:'+3 Vigor.',s:{vigor:3}},{id:'secondwind',icon:'💨',name:'Second Wind',desc:'Once per fight, a fall at zero lives gives you 1 life back.'}]},
 {at:9,o:[{id:'scavenger',icon:'🎒',name:'Scavenger',desc:'Every win has a chance to give a free potion.'},{id:'battlecry',icon:'📣',name:'Battle Cry',desc:'+3 Might.',s:{might:3}}]},
 {at:12,o:[{id:'titan',icon:'🗿',name:'Titan',desc:'+2 Might, +2 Vigor and +2 Wisdom.',s:{might:2,vigor:2,wisdom:2}},{id:'bossbane',icon:'🐲',name:'Boss Bane',desc:'Bosses never get angry in phase 2.'}]}
];
function perk(id){return P.perks[id]===1;}
function pickedAt(i){return PERKS[i].o.some(function(p){return P.perks[p.id]===1;});}
function pending(){var h=hero();if(!h)return 0;var lv=dgLevel(h.xp),n=0;PERKS.forEach(function(t,i){if(lv>=t.at&&!pickedAt(i))n++;});return n;}
function perkStats(){var t={might:0,vigor:0,wisdom:0};PERKS.forEach(function(x){x.o.forEach(function(p){if(P.perks[p.id]===1&&p.s)for(var k in p.s)t[k]+=p.s[k];});});return t;}

/* ---------- set bonus: worn pieces from the same tier ---------- */
var TIERS=['Bone','Hide','Iron'];
function setInfo(h){
  h=h||hero();var c=[0,0,0];
  if(h&&h.eq)['weapon','armor','charm'].forEach(function(sl){var id=h.eq[sl],it=id&&h.inv.find(function(x){return x.id===id;});if(it&&it.r<3)c[it.b|0]++;});
  var best=0,tier=-1;c.forEach(function(n,i){if(n>best){best=n;tier=i;}});
  return {n:best,tier:tier};
}
function setBonus(h){var s=setInfo(h);return s.n>=3?{might:2,vigor:2,wisdom:2}:s.n===2?{might:2,vigor:0,wisdom:0}:{might:0,vigor:0,wisdom:0};}
var _ml=dgMaxLives;
dgMaxLives=function(){var n=_ml.apply(this,arguments)+(P.rules==='relaxed'?2:P.rules==='hardcore'?-1:0);return Math.max(1,n);};
var _tot=dgTotals;
dgTotals=function(h){var t=_tot(h),b=setBonus(h||hero()),p=perkStats();for(var k in t)t[k]+=b[k]+p[k];return t;};

/* ---------- monster traits and bonus goals (deterministic per level) ---------- */
var TRAITS={
 shielded:{icon:'🛡️',name:'Shielded',tip:'The first hit only breaks its shield.'},
 cursed:{icon:'☠️',name:'Cursed',tip:'A slip costs you an extra life.'},
 regen:{icon:'💚',name:'Regenerating',tip:'Every slip heals it a little.'}
};
var TRAIT_KEYS=['shielded','cursed','regen'];
function traitOf(L){if(!L||L.boss||L.kind==='explore'||(L.n|0)<3)return null;var h=dgHash(L.id+'|trait')%5;return h<3?TRAIT_KEYS[h]:null;}
var GOALS={
 flawless:{icon:'💎',name:'Flawless',tip:'Win without a single slip.'},
 nohint:{icon:'🧠',name:'No hints',tip:'Win without using any hint.'},
 chain:{icon:'⚡',name:'Chain of 5',tip:'Land five good moves in a row.'}
};
var GOAL_KEYS=['flawless','nohint','chain'];
function goalOf(L){if(!L||L.kind==='explore')return null;return GOAL_KEYS[dgHash(L.id+'|goal')%3];}
function pxOf(run){return run.px||(run.px={chain:0,maxChain:0,shield:false,p2:false,revived:false,regen:0});}
function stat(k,v){P.stats[k]=Math.max(P.stats[k]|0,v|0);}
function add(k,v){P.stats[k]=(P.stats[k]|0)+(v||1);}

var _good=advArcGood;
advArcGood=function(e,t){
  var run=advCurrentRun(),L=advCurrentLevel();
  if(!run||!L)return _good(e,t);
  var px=pxOf(run),tr=traitOf(L),n;
  if(tr==='shielded'&&!px.shield&&!t){px.shield=true;n=_good(e,t);run.hits=Math.max(0,(run.hits|0)-1);pop('Shield broken!');}
  else n=_good(e,t);
  px.chain++;px.maxChain=Math.max(px.maxChain,px.chain);stat('chain',px.chain);
  if(px.chain%5===0){var b=150;run.pts=Math.min(99999,(run.pts|0)+b);pop('CRIT +'+b);tone2([[880,0,.08],[1320,.07,.12]]);}
  if(px.chain%8===0){var h=hero();if(h&&(h.belt.heal|0)<9){h.belt.heal=(h.belt.heal|0)+1;pop('Free potion!');}}
  if(L.boss&&!px.p2&&!t&&(run.hits|0)>=3&&!perk('bossbane')){px.p2=true;pop('PHASE 2!');advArcFx().flash='PHASE 2: ENRAGED!';tone2([[110,0,.3,'sawtooth',.1],[82,.1,.4,'sawtooth',.1]]);}
  if(px.p2&&!t){var x=Math.floor(n*.5);run.pts=Math.min(99999,(run.pts|0)+x);}
  return n;
};
var _miss=advArcMiss;
advArcMiss=function(){
  var run=advCurrentRun(),L=advCurrentLevel();
  if(!run||!L)return _miss();
  var px=pxOf(run),m0=run.mistakes|0,tr=traitOf(L);
  _miss();
  px.chain=0;
  var blocked=(run.mistakes|0)<m0;
  if(!blocked){
    if(tr==='cursed'||(px.p2&&L.boss&&false)){run.mistakes=(run.mistakes|0)+1;pop('CURSED!','miss');}
    if(tr==='regen'&&(run.hits|0)>0){run.hits--;pop('Regrows');}
  }
  if(perk('secondwind')&&!px.revived&&advArcLives(run)===0){px.revived=true;run.lifeBase=(run.lifeBase|0)+1;pop('SECOND WIND');tone2([[523,0,.1],[784,.08,.14],[1046,.16,.2]]);}
  if(P.run&&P.run.active===run.levelId&&advArcLives(run)===0){P.run.failed=true;P.run.active=null;P.run.msg='fell';if(P.run.kind==='endless')grantEndless(P.run);save();}
};

/* ---------- battle HUD additions ---------- */
var _bat=dgBattleHTML;
dgBattleHTML=function(L,run,won,kind,dmg){
  var s=_bat(L,run,won,kind,dmg);
  if(!run)return s;
  var px=pxOf(run),tr=traitOf(L),g=goalOf(L),out='';
  if(L.boss&&px.p2&&!won)s=s.replace('class="dg-battle ','class="dg-battle enraged ');
  if(L.boss)out+='<span class="px-chip'+(px.p2?' hot':'')+'">'+(px.p2?'🔥 <span>Phase 2: Enraged</span>':'🐲 <span>Phase 1</span>')+'</span>';
  if(tr){var T=TRAITS[tr];out+='<span class="px-chip" title="'+esc(T.tip)+'"><span aria-hidden="true">'+T.icon+'</span> <span>'+T.name+'</span>: <span>'+T.tip+'</span></span>';}
  if(g){var G=GOALS[g];out+='<span class="px-chip goal" title="'+esc(G.tip)+'"><span aria-hidden="true">🎯</span> <span>Bonus goal</span>: <span>'+G.name+'</span></span>';}
  if(px.chain>=2)out+='<span class="px-chip chain"><span aria-hidden="true">⚡</span> <span>Chain</span> <b>'+px.chain+'</b></span>';
  if(P.run&&P.run.active===run.levelId)out+='<span class="px-chip run"><span aria-hidden="true">🗝️</span> <span>Dungeon run</span> '+(P.run.i+1)+'/'+P.run.steps.length+'</span>';
  return s+(out?'<div class="px-chips">'+out+'</div>':'');
};

/* ---------- finish: bonus goal, quests, run progress ---------- */
var _fin=advFinish;
advFinish=function(L,run,stars,skipped){
  var px=pxOf(run);
  _fin(L,run,stars,skipped);
  P.bonus=0;
  if(skipped||run.showMe)return;
  try{var g0=advRT.lastGain&&advRT.lastGain.hero,h0=hero();if(g0&&h0&&g0.xp>0&&P.rules!=='normal'){var dx=Math.round(g0.xp*.25)*(P.rules==='hardcore'?1:-1);h0.xp=Math.max(0,Math.min(999999,h0.xp+dx));}}catch(e){}
  var g=goalOf(L),ok=false;
  if(g==='flawless')ok=(run.mistakes|0)===0;else if(g==='nohint')ok=(run.hints|0)===0;else if(g==='chain')ok=px.maxChain>=5;
  var h=hero();
  if(ok&&h){P.bonus=40;h.xp=Math.min(999999,h.xp+40);add('goals');try{advSave('goal');}catch(e){}}
  if(traitOf(L)&&stars>=1)add('traits');
  if(L.boss)add('bosses');
  var lt=advRT.lastGain&&advRT.lastGain.hero;
  if(lt){lt.loot.forEach(function(it){if(it.r>=2)add('rare');if(it.r>=3)add('unique');});
    if(perk('scavenger')&&h&&lt.xp>0&&(h.belt.heal|0)<9&&dgHash(L.id+'|'+h.kills)%3===0){h.belt.heal=(h.belt.heal|0)+1;lt.cons.push('heal');try{advSave('scav');}catch(e){}}}
  var R=P.run;
  if(R&&R.active===L.id&&stars>=1){
    var lives=advArcLives(run);R.carry=Math.min(dgMaxLives()-1,dgMaxLives()-lives);
    R.score+=(run.result&&run.result.score)|0;R.stars+=stars;R.i++;R.active=null;
    if(R.kind==='endless'){R.steps.push(endlessStep(R.i));stat('endlessBest',R.i);}else if(R.i>=R.steps.length){R.done=true;grantRun(R);}
  }
  save();advSave('plus');advRender();
};
var _rew=dgRewardHTML;
dgRewardHTML=function(g){
  var s=_rew(g);if(!s)return s;
  var best=g.hero.loot.reduce(function(m,it){return Math.max(m,it.r);},-1),pre='';
  if(best>=0)pre='<div class="px-chest r'+best+'" aria-hidden="true"><span class="px-lid">🎁</span><span class="px-glow"></span></div>';
  var post='';
  if(P.bonus)post='<div class="adv-sticker-new" role="status"><span class="adv-sticker-emoji" aria-hidden="true">🎯</span><span><span>Bonus goal done</span>: <b>+'+P.bonus+' hero XP</b></span></div>';
  return pre+s+post;
};

/* ---------- compare and equip ---------- */
var _item=dgItemHTML;
dgItemHTML=function(it,extra){
  var s=_item(it,extra);
  if(typeof extra!=='string'||extra.indexOf('adv-equip')<0)return s;
  var w=dgWorn(it.slot);if(!w||w.id===it.id)return s+(w?'':'<div class="px-diff"><span class="px-up">▲ <span>Fills an empty slot</span></span></div>');
  var parts=[];
  ['might','vigor','wisdom'].forEach(function(k){var d=((it.s&&it.s[k])|0)-((w.s&&w.s[k])|0);if(d)parts.push('<span class="'+(d>0?'px-up':'px-down')+'">'+(d>0?'▲ +':'▼ ')+d+' <span>'+k.charAt(0).toUpperCase()+k.slice(1)+'</span></span>');});
  if(!parts.length)parts.push('<span class="px-same"><span>Same stats</span></span>');
  return s+'<div class="px-diff" aria-label="Compared with what you wear">'+parts.join(' ')+'</div>';
};

/* ---------- hero screen: set bonus + perk picks ---------- */
var _hero=dgHeroHTML;
dgHeroHTML=function(){
  var s=_hero();if(!hero())return s;
  var si=setInfo(),sb='<h2>Set bonus</h2><p class="adv-small px-set">'+(si.n>=3?'<b>✨ <span>Full set</span>: <span>'+TIERS[si.tier]+'</span></b> <span>+2 Might, +2 Vigor and +2 Wisdom.</span>':si.n===2?'<b>🔗 <span>'+TIERS[si.tier]+'</span> <span>set</span></b> <span>+2 Might.</span>':'<span>Wear 2 pieces from the same tier (Bone, Hide or Iron) for +2 Might. Wear 3 for +2 to every stat. Unique items do not count.</span>')+'</p>';
  var pk='<h2>Hero skills</h2>';
  var lv=dgLevel(hero().xp);
  PERKS.forEach(function(t,i){
    if(pickedAt(i)){var p=t.o.filter(function(q){return P.perks[q.id]===1;})[0];pk+='<div class="px-perk done"><span aria-hidden="true">'+p.icon+'</span> <b>'+p.name+'</b> <span class="adv-small">'+p.desc+'</span></div>';}
    else if(lv>=t.at){pk+='<div class="px-perk new" role="group" aria-label="Choose a skill"><div><b>⭐ <span>Choose a new skill!</span></b></div><div class="adv-row">'+t.o.map(function(p){return '<button type="button" class="adv-btn px-pick" data-action="adv-px-perk" data-id="'+p.id+'"><span aria-hidden="true">'+p.icon+'</span> <b>'+p.name+'</b><span class="adv-small">'+p.desc+'</span></button>';}).join('')+'</div></div>';}
    else pk+='<div class="px-perk locked"><span aria-hidden="true">🔒</span> <span>Hero level</span> '+t.at+': <span>a new skill to choose</span></div>';
  });
  var k=s.indexOf('<h2>Gear skills</h2>');
  return k<0?s+sb+pk:s.slice(0,k)+pk+sb+s.slice(k);
};
var _panel=dgPanelHTML;
dgPanelHTML=function(){
  var s=_panel();if(!s)return s;
  var n=pending();
  return s+(n?'<p class="px-new"><button type="button" class="adv-btn adv-btn-small" data-action="adv-go" data-screen="hero">⭐ <span>Choose a new skill!</span></button></p>':'');
};

/* ---------- dungeon runs, daily dungeon, quests ---------- */
var QUESTS=[
 {id:'q-kill',icon:'⚔️',name:'Monster hunter',desc:'Slay 10 monsters.',goal:10,get:function(){var h=hero();return h?h.kills:0;}},
 {id:'q-chain',icon:'⚡',name:'On a roll',desc:'Land 5 good moves in a row.',goal:5,get:function(){return P.stats.chain|0;}},
 {id:'q-boss',icon:'🐲',name:'Boss breaker',desc:'Defeat a boss.',goal:1,get:function(){return P.stats.bosses|0;}},
 {id:'q-rare',icon:'💎',name:'Treasure find',desc:'Find a Rare or better item.',goal:1,get:function(){return P.stats.rare|0;}},
 {id:'q-unique',icon:'👑',name:'Legend seeker',desc:'Find a Unique item.',goal:1,get:function(){return P.stats.unique|0;}},
 {id:'q-set',icon:'🔗',name:'Matching set',desc:'Wear 3 pieces from the same tier.',goal:3,get:function(){return setInfo().n;}},
 {id:'q-trait',icon:'☠️',name:'Tough customer',desc:'Beat 3 monsters that have a special trait.',goal:3,get:function(){return P.stats.traits|0;}},
 {id:'q-goal',icon:'🎯',name:'Goal getter',desc:'Complete 5 bonus goals.',goal:5,get:function(){return P.stats.goals|0;}},
 {id:'q-run',icon:'🗝️',name:'Delver',desc:'Finish a dungeon run.',goal:1,get:function(){return P.stats.runs|0;}},
 {id:'q-daily',icon:'📅',name:'Daily hero',desc:'Finish a daily dungeon.',goal:1,get:function(){return P.stats.dailies|0;}}
];
window.pxDaily=function(){var d=today(),x=P.daily[d];return x?{dk:d,score:x.score|0}:{dk:'',score:0};};
function today(){return typeof arcDayKey==='function'?arcDayKey():new Date().toISOString().slice(0,10);}
function difficulty(L){return advRealmIndex(L.realm)*20+(L.n|0);}
function pool(){
  var a=[];
  Object.keys(ADV_LEVELS).forEach(function(id){var L=ADV_LEVELS[id];if(L.kind==='explore')return;try{if(advLevelUnlockedById(id))a.push(L);}catch(e){}});
  a.sort(function(x,y){return difficulty(x)-difficulty(y);});
  return a;
}
function endlessStep(i){
  var all=pool(),bosses=all.filter(function(x){return x.boss;}),pl=all.filter(function(x){return !x.boss;});
  var rnd=dgRng(dgHash('endless|'+i+'|'+Date.now()));
  if(i%5===4&&bosses.length){var b0=bosses[Math.floor(rnd()*bosses.length)];return {a:b0.id,b:b0.id};}
  var idx=Math.min(pl.length-1,Math.floor(i*1.4)+Math.floor(rnd()*2));
  return {a:pl[Math.max(0,idx-1)].id,b:pl[Math.min(pl.length-1,idx+1)].id};
}
function grantEndless(R){
  if(R.paid)return;R.paid=true;
  var h=hero();if(!h)return;
  var n=R.i|0,xp=30*n+15*R.risky,lv=dgLevel(h.xp);
  h.xp=Math.min(999999,h.xp+xp);R.xp=xp;R.loot=[];
  var rnd=dgRng(dgHash('end'+R.date+n+h.found)),cnt=n>=7?2:n>=3?1:0;
  for(var i=0;i<cnt;i++){var r=dgRollRarity(rnd,3,i===0),sl=DG_SLOTS[Math.floor(rnd()*3)];h.found++;var it=dgMakeItem(r,sl,rnd,lv,'p'+(Date.now()+i).toString(36));if(it){dgAddItem(h,it);R.loot.push(it);}}
  stat('endlessBest',n);if(n>=5)add('runs');
  save();advSave('px-endless');try{onSync();}catch(e){}
}
function makeRun(kind,seed,N){
  var all=pool();if(all.length<4&&kind!=='boss')return null;var bosses=all.filter(function(x){return x.boss;}),pl=all.filter(function(x){return !x.boss;});if(pl.length<4&&kind!=='boss')return null;
  var rnd=dgRng(dgHash(seed)),steps=[];
  if(kind==='boss'){if(!bosses.length)return null;var bb=bosses.slice();for(var j=0;j<3;j++){var k=Math.floor(rnd()*bb.length);steps.push({a:bb[k].id,b:bb[k].id});if(bb.length>1)bb.splice(k,1);}
    return {kind:kind,date:today(),steps:steps,i:0,picks:[],risky:0,carry:0,score:0,stars:0,active:null,done:false,failed:false,paid:false};}
  if(kind==='endless'){steps.push(endlessStep(0));
    return {kind:kind,date:today(),steps:steps,i:0,picks:[],risky:0,carry:0,score:0,stars:0,active:null,done:false,failed:false,paid:false};}
  for(var i=0;i<N;i++){
    var lo=Math.floor(pl.length*i/N),hi=Math.max(lo+1,Math.floor(pl.length*(i+1)/N));
    var a=pl[lo+Math.floor(rnd()*(hi-lo))],bi=Math.min(pl.length-1,hi+Math.floor(rnd()*Math.max(1,Math.ceil(pl.length/N))));
    var b=pl[bi];
    if(i===N-1&&bosses.length){var bs=bosses;b=bs[Math.floor(rnd()*bs.length)];a=pl[pl.length-1-Math.floor(rnd()*Math.min(3,pl.length))];}
    steps.push({a:a.id,b:b.id===a.id?pl[Math.min(pl.length-1,pl.indexOf(a)+1)].id:b.id});
  }
  return {kind:kind,date:today(),steps:steps,i:0,picks:[],risky:0,carry:0,score:0,stars:0,active:null,done:false,failed:false,paid:false};
}
function startStep(R,pick){
  var id=R.steps[R.i][pick];if(!id||!advLevelUnlockedById(id))return false;
  if(pick==='b')R.risky++;
  R.picks[R.i]=pick;R.active=id;
  advStopDemo();
  var run=advNewRun(id);run.phase='play';run.mistakes=R.carry|0;adv.run=run;adv.level=id;adv.realm=ADV_LEVELS[id].realm;adv.screen='level';
  advRT=Object.assign(advRT,{levelId:null,S:null,nMoves:-1,sel:null,msg:'',msgKind:'',hintCells:null,slip:null,rivalMark:null,showRule:false,confirmReset:false});
  save();advSave('px-step');advRender();return true;
}
function grantRun(R){
  if(R.paid)return;R.paid=true;
  var h=hero();if(!h)return;
  var n=R.steps.length,xp=Math.round((40*n+70*R.risky)*(R.kind==='daily'?1.5:R.kind==='boss'?2:1)),lv=dgLevel(h.xp);
  h.xp=Math.min(999999,h.xp+xp);R.xp=xp;R.loot=[];
  var rnd=dgRng(dgHash(R.kind+R.date+R.score+h.found)),cnt=1+(R.risky>=2?1:0)+(R.kind==='daily'?1:0)+(R.kind==='boss'?1:0);
  for(var i=0;i<cnt;i++){
    var r=dgRollRarity(rnd,3,i===0),sl=DG_SLOTS[Math.floor(rnd()*3)];h.found++;
    var it=dgMakeItem(r,sl,rnd,lv,'p'+(Date.now()+i).toString(36));
    if(it){dgAddItem(h,it);R.loot.push(it);}
  }
  add('runs');if(R.kind==='daily'){add('dailies');P.daily[R.date]={score:R.score,stars:R.stars,risky:R.risky};}
  try{dgSfx('loot',{r:R.loot.reduce(function(m,x){return Math.max(m,x.r);},0),at:.2});}catch(e){}
  save();advSave('px-run');try{onSync();}catch(e){}
}
function plusHTML(){
  var h=hero(),R=P.run,pl=pool(),d=today();
  var o='<section class="adv-screen px-screen"><h1>🗝️ <span>Dungeon</span></h1>';
  if(!h)return o+'<p class="adv-lead"><span>Start your adventure first.</span></p><div class="adv-row"><button class="adv-btn adv-btn-big" data-action="adv-go" data-screen="map">◀ <span>Back to the dungeon</span></button></div></section>';
  if(R&&R.date&&R.kind==='daily'&&R.date!==d&&!R.done&&!R.failed){P.run=R=null;}
  o+='<p class="adv-lead"><span>Fight through several levels in a row. You do not heal between levels. Before each one you choose a safe path or a risky one. The risky path is harder but pays more.</span></p>';
  if(R){
    var N=R.steps.length;
    var TT={daily:'📅 <span>Daily Dungeon</span>',run:'🗝️ <span>Dungeon run</span>',boss:'🐲 <span>Boss Rush</span>',endless:'♾️ <span>Endless</span>'};
    o+='<div class="px-card"><h2>'+TT[R.kind||'run']+'</h2>';
    o+='<p>'+(R.kind==='endless'?'<span>Cleared</span> <b>'+R.i+'</b> · <span>Best</span> <b>'+Math.max(R.i,P.stats.endlessBest|0)+'</b>':'<span>Stage</span> <b>'+Math.min(R.i+1,N)+'</b> / '+N)+' · <span>Lives</span> '+'❤️'.repeat(Math.max(0,dgMaxLives()-(R.carry|0)))+'<span class="adv-small"> ('+(R.carry|0)+' <span>lost</span>)</span></p>';
    if(R.kind!=='endless')o+='<ol class="px-steps" aria-label="Run progress">'+R.steps.map(function(s,i){var st=i<R.i?'done':i===R.i&&!R.failed?'now':'';return '<li class="'+st+'">'+(i<R.i?(R.picks[i]==='b'?'🔥':'🛡️'):i===N-1||R.kind==='boss'?'🐲':'•')+'</li>';}).join('')+'</ol>';
    if(R.done){
      o+='<div class="px-win"><b>🏆 <span>Run complete!</span></b> <span>Score</span> <b>'+R.score+'</b> · +'+R.xp+' <span>hero XP</span></div>';
      (R.loot||[]).forEach(function(it){o+='<div class="dg-loot dg-r-'+DG_RARITIES[it.r]+'">'+dgItemHTML(it,'')+'</div>';});
      o+='<div class="adv-row"><button class="adv-btn" data-action="adv-px-end">'+'<span>Done</span></button></div>';
    }else if(R.failed&&R.kind==='endless'){
      o+='<div class="px-win"><b>♾️ <span>Run over</span></b> <span>Cleared</span> <b>'+R.i+'</b> · +'+(R.xp|0)+' <span>hero XP</span></div>';
      (R.loot||[]).forEach(function(it){o+='<div class="dg-loot dg-r-'+DG_RARITIES[it.r]+'">'+dgItemHTML(it,'')+'</div>';});
      o+='<div class="adv-row"><button class="adv-btn" data-action="adv-px-end"><span>Done</span></button></div>';
    }else if(R.failed){
      o+='<p class="px-lose">☠️ <span>Your run ended. Nothing is lost, but the bonus is gone. Try again!</span></p><div class="adv-row"><button class="adv-btn" data-action="adv-px-end"><span>Done</span></button></div>';
    }else if(R.active){
      o+='<div class="adv-row"><button class="adv-btn adv-btn-big" data-action="adv-level" data-level="'+R.active+'"><span>Back to the fight</span></button></div>';
    }else{
      var s=R.steps[R.i];
      var card=function(id,k,lab,ic,tip){var L=ADV_LEVELS[id],tr=traitOf(L);return '<button type="button" class="adv-btn px-path '+k+'" data-action="adv-px-pick" data-p="'+k+'"><b>'+ic+' <span>'+lab+'</span></b><span class="adv-small"><span>'+esc(advRealmById(L.realm).name)+'</span> · <span>'+esc(L.title)+'</span>'+(L.boss?' · <span>Boss</span>':'')+(tr?' · <span aria-hidden="true">'+TRAITS[tr].icon+'</span> <span>'+TRAITS[tr].name+'</span>':'')+'</span><span class="adv-small">'+tip+'</span></button>';};
      o+='<div class="adv-row px-paths">'+(R.kind==='boss'?card(s.a,'a','Face the boss','🐲','Big rewards at the end.'):card(s.a,'a','Safe path','🛡️','Normal pay.')+card(s.b,'b','Risky path','🔥','Harder level. Pays far more.'))+'</div>';
      o+='<div class="adv-row">'+(R.kind==='endless'&&R.i>0?'<button class="adv-btn adv-btn-small" data-action="adv-px-cash"><span>Cash out</span></button>':'')+'<button class="adv-btn adv-btn-small adv-btn-ghost" data-action="adv-px-end"><span>Give up this run</span></button></div>';
    }
    o+='</div>';
  }else{
    var done=P.daily[d],nb=pool().filter(function(x){return x.boss;}).length;
    o+='<div class="px-card"><h2>⚖️ <span>Rules</span></h2><p class="adv-small">'+({relaxed:'<span>Relaxed: 2 extra lives, 25% less XP.</span>',normal:'<span>Normal: the usual rules.</span>',hardcore:'<span>Hardcore: 1 life fewer, 25% more XP.</span>'})[P.rules]+'</p><div class="adv-row">'+[['relaxed','🌱','Relaxed'],['normal','⚔️','Normal'],['hardcore','💀','Hardcore']].map(function(r){return '<button type="button" class="adv-btn adv-btn-small'+(P.rules===r[0]?'':' adv-btn-ghost')+'" aria-pressed="'+(P.rules===r[0])+'" data-action="adv-px-rules" data-v="'+r[0]+'"><span aria-hidden="true">'+r[1]+'</span> <span>'+r[2]+'</span></button>';}).join('')+'</div></div>';
    o+='<div class="px-card"><h2>📅 <span>Daily Dungeon</span></h2><p class="adv-small">'+d+' · <span>Everyone gets the same path seed today. The levels you can enter depend on how far you have got.</span></p>'+
      (done?'<p><b>✅ <span>Done today!</span></b> <span>Score</span> <b>'+done.score+'</b></p>':'')+
      '<div class="adv-row"><button class="adv-btn adv-btn-big" data-action="adv-px-start" data-kind="daily"'+(pl.length<4||done?' disabled':'')+'><span>Enter the Daily Dungeon</span></button></div></div>';
    o+='<div class="px-card"><h2>🗝️ <span>Dungeon run</span></h2><p class="adv-small"><span>Five levels in a row. The last one is a boss. Bigger rewards.</span></p><div class="adv-row"><button class="adv-btn adv-btn-big" data-action="adv-px-start" data-kind="run"'+(pl.length<4?' disabled':'')+'><span>Start a dungeon run</span></button></div>'+
      (pl.length<4?'<p class="adv-small"><span>Clear a few more levels to unlock this.</span></p>':'')+'</div>';
    o+='<div class="px-card"><h2>🐲 <span>Boss Rush</span></h2><p class="adv-small"><span>Three bosses back to back. No safe path, no healing. Double rewards.</span></p><div class="adv-row"><button class="adv-btn adv-btn-big" data-action="adv-px-start" data-kind="boss"'+(nb<1?' disabled':'')+'><span>Start Boss Rush</span></button></div>'+(nb<1?'<p class="adv-small"><span>Unlock your first boss to play this.</span></p>':'')+'</div>';
    o+='<div class="px-card"><h2>♾️ <span>Endless</span></h2><p class="adv-small"><span>Keep going as long as you survive. Levels get harder and every fifth one is a boss. Cash out any time to keep your reward.</span></p>'+(P.stats.endlessBest?'<p><span>Best</span> <b>'+P.stats.endlessBest+'</b></p>':'')+'<div class="adv-row"><button class="adv-btn adv-btn-big" data-action="adv-px-start" data-kind="endless"'+(pl.length<4?' disabled':'')+'><span>Start Endless</span></button></div></div>';
  }
  try{
    var d2=today(),rows=onOthers().filter(function(x){return x.dk===d2&&x.dly>0;}).map(function(x){return {n:x.name,e:x.emoji,s:x.dly};});
    if(P.daily[d2])rows.push({you:1,n:'',e:adv.player.avatar,s:P.daily[d2].score});
    rows.sort(function(a,b){return b.s-a.s;});
    if(rows.length)o+='<h2>🏆 <span>Daily Dungeon board</span></h2><ol class="arc-table" aria-label="Daily Dungeon board">'+rows.slice(0,10).map(function(r,i){return '<li class="arc-row'+(r.you?' arc-you':'')+'"><span class="arc-pos">'+(i+1)+'</span><span class="arc-who"><span aria-hidden="true">'+r.e+'</span> '+(r.you?'<span data-adv-name></span>':esc(r.n))+'</span><span class="arc-score">'+r.s+'</span></li>';}).join('')+'</ol>';
  }catch(e){}
  var hist=Object.keys(P.daily).sort().slice(-5).reverse();
  if(hist.length)o+='<h2>📅 <span>Daily scores</span></h2><ol class="arc-table">'+hist.map(function(k,i){return '<li class="arc-row"><span class="arc-pos">'+(i+1)+'</span><span class="arc-who">'+k+'</span><span class="arc-score">'+P.daily[k].score+'</span></li>';}).join('')+'</ol>';
  o+='<h2>📜 <span>Quests</span></h2><ul class="px-quests">'+QUESTS.map(function(q){
    var v=Math.min(q.goal,q.get()),ok=v>=q.goal,cl=P.quests[q.id]===1;
    return '<li class="px-q'+(cl?' claimed':ok?' ready':'')+'"><span aria-hidden="true">'+q.icon+'</span> <span class="px-qt"><b>'+q.name+'</b> <span class="adv-small">'+q.desc+'</span></span> <span class="adv-small">'+v+' / '+q.goal+'</span> '+
      (cl?'<span aria-label="Claimed">✅</span>':ok?'<button type="button" class="adv-btn adv-btn-small" data-action="adv-px-claim" data-q="'+q.id+'"><span>Claim</span> +50 XP</button>':'')+'</li>';}).join('')+'</ul>';
  o+='<div class="adv-row"><button class="adv-btn adv-btn-big" data-action="adv-go" data-screen="map">◀ <span>Back to the dungeon</span></button></div></section>';
  return o;
}
ADV_SCREENS.push('plus');
var _rh=advRenderHTML;
advRenderHTML=function(){advEnsure();if(adv.screen==='plus')return plusHTML();return _rh();};
var _map=advMapHTML;
advMapHTML=function(){
  var s=_map();if(!hero())return s;
  var d=today(),q=QUESTS.filter(function(x){return P.quests[x.id]!==1&&x.get()>=x.goal;}).length;
  var card='<div class="px-card px-mapcard"><b>🗝️ <span>Dungeon runs</span></b> <span class="adv-small">'+(P.run&&!P.run.done&&!P.run.failed?'<span>A run is in progress!</span>':P.daily[d]?'<span>Daily done today.</span>':'<span>New daily dungeon today!</span>')+'</span> <button type="button" class="adv-btn adv-btn-small" data-action="adv-go" data-screen="plus"><span>Open</span>'+(q?' 📜'+q:'')+'</button></div>';
  var k=s.lastIndexOf('</section>');
  return k<0?s+card:s.slice(0,k)+card+s.slice(k);
};
var _lvl=advLevelHTML;
advLevelHTML=function(){
  var s=_lvl(),R=P.run,run=advCurrentRun();
  if(!R||!run||R.done&&false)return s;
  var add2='';
  if(run.phase==='reward'&&R.i>0&&!R.active&&!R.failed&&R.steps[R.i-1]&&R.steps[R.i-1][R.picks[R.i-1]]===run.levelId||R.done&&run.phase==='reward')
    add2='<div class="px-card"><b>🗝️ <span>Dungeon run</span></b> '+(R.done?'<span>Run complete!</span>':'<span>Step cleared.</span>')+' <button type="button" class="adv-btn" data-action="adv-go" data-screen="plus"><span>Continue the run</span></button></div>';
  else if(R.failed&&R.msg==='fell')add2='<div class="px-card"><b>☠️ <span>Your dungeon run ended.</span></b> <button type="button" class="adv-btn adv-btn-small" data-action="adv-go" data-screen="plus"><span>Back to the dungeon</span></button></div>';
  if(!add2)return s;
  var k=s.lastIndexOf('</section>');
  return k<0?s+add2:s.slice(0,k)+add2+s.slice(k);
};

var _click=advClickAction;
advClickAction=function(a,el){
  var o=(el&&el.dataset)||{};
  switch(a){
    case 'adv-px-perk':{var t=PERKS.findIndex(function(x){return x.o.some(function(p){return p.id===o.id;});});
      if(t>=0&&!pickedAt(t)&&dgLevel(hero().xp)>=PERKS[t].at){P.perks[o.id]=1;save();tone2([[660,0,.1],[880,.08,.1],[1320,.16,.2]]);}
      return advRender();}
    case 'adv-px-start':{var kd=({daily:1,boss:1,endless:1})[o.kind]?o.kind:'run';var R=makeRun(kd,kd==='daily'?'daily|'+today():kd+'|'+Date.now(),5);if(R){P.run=R;save();}return advRender();}
    case 'adv-px-pick':{if(P.run&&!P.run.active)startStep(P.run,o.p==='b'?'b':'a');return;}
    case 'adv-px-rules':{if(['relaxed','normal','hardcore'].indexOf(o.v)>=0){P.rules=o.v;save();}return advRender();}
    case 'adv-px-cash':{var RR=P.run;if(RR&&RR.kind==='endless'&&!RR.active){RR.failed=true;RR.msg='cash';grantEndless(RR);save();}return advRender();}
    case 'adv-px-end':{P.run=null;save();return advRender();}
    case 'adv-px-claim':{var q=QUESTS.find(function(x){return x.id===o.q;});
      if(q&&P.quests[q.id]!==1&&q.get()>=q.goal){P.quests[q.id]=1;var h=hero();if(h){h.xp=Math.min(999999,h.xp+50);if((h.belt.ward|0)<9)h.belt.ward=(h.belt.ward|0)+1;}save();advSave('quest');tone2([[784,0,.1],[1046,.09,.18]]);}
      return advRender();}
  }
  return _click(a,el);
};
/* make the page react to the new screen/actions even if the base code cached references */
try{window.dgTotals=dgTotals;}catch(e){}
})();
