/* Two Boards: Game Records. Saves every finished game against the CPU or a friend, with stats and replay. Loaded after app.js. */
(function(){
'use strict';
if(typeof state==='undefined'||typeof render!=='function'||typeof renderPlaySection!=='function')return;
var KEY='tb-rec-v1',MAX=300;
var R={recs:[]};
try{var o=JSON.parse(localStorage.getItem(KEY)||'null');if(o&&Array.isArray(o.recs))R.recs=o.recs;}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(R));}catch(e){}}
var V={on:false,g:'all',m:'all',open:-1,k:0,more:false,clear:false,seq:0};
var GAMES=[['chess','♟️','Chess'],['go','⚫','Go'],['xiangqi','🐘','Xiangqi'],['checkers','🔴','Chinese Checkers'],['gomoku','⚪','Gomoku'],['janggi','🏯','Janggi'],['shogi','⛩️','Shogi']];
function gname(g){for(var i=0;i<GAMES.length;i++)if(GAMES[i][0]===g)return GAMES[i];return[g,'🎲',g];}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* ---------- recording ---------- */
function add(rec){rec.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);R.recs.unshift(rec);if(R.recs.length>MAX)R.recs.length=MAX;save();toast(rec);}
function toast(rec){try{var d=document.createElement('div');d.className='lm-toast rc-toast';d.setAttribute('role','status');
  var ic=rec.r==='win'?'🏆':rec.r==='loss'?'📕':rec.r==='draw'?'🤝':'📒';
  d.innerHTML='<span aria-hidden="true">'+ic+'</span> <span>Game saved to My Games</span>';document.body.appendChild(d);setTimeout(function(){d.remove();},2600);}catch(e){}}
function sq(r,c){return String.fromCharCode(97+c)+(8-r);}
function xsq(r,c){return String.fromCharCode(97+c)+(10-r);}
function gsq(r,c){return String.fromCharCode(65+c+(c>=8?1:0))+(19-r);}
function ksq(r,c){return String.fromCharCode(65+c)+(15-r);}
function mkCpu(g){
  var p=state.play,o=p[g],r=null,rec=null,N;
  if(g==='chess'){if(!o||!o.status||!o.status.over)return null;
    r=o.status.result==='w-wins-checkmate'?'win':o.status.result==='b-wins-checkmate'?'loss':'draw';
    var mv=(o.moveHistory||[]).map(function(m){return[m.from[0],m.from[1],m.to[0],m.to[1]];});
    rec={g:g,d:p.chessDifficulty,r:r,n:mv.length,mv:mv,tx:mv.map(function(m,i){return(i%2?'AI: ':'You: ')+sq(m[0],m[1])+' → '+sq(m[2],m[3]);})};}
  else if(g==='xiangqi'){if(!o||!o.status||!o.status.over)return null;
    var s=String(o.status.result||'');r=/^r-wins/.test(s)?'win':/^b-wins/.test(s)?'loss':'draw';
    var mx=(o.moveHistory||[]).map(function(m){return[m.from[0],m.from[1],m.to[0],m.to[1]];});
    rec={g:g,d:p.xiangqiDifficulty,r:r,n:mx.length,mv:mx,tx:mx.map(function(m,i){return(i%2?'AI: ':'You: ')+xsq(m[0],m[1])+' → '+xsq(m[2],m[3]);})};}
  else if(g==='go'){if(!o||!o.gameOver)return null;
    var sc=o.scores||{black:0,white:0};r=sc.black>sc.white?'win':sc.black<sc.white?'loss':'draw';
    var ml=o.moveLog||[];
    rec={g:g,d:'',r:r,n:ml.length,mv:ml.map(function(m){return m.r==null?null:[m.r,m.c];}),tx:ml.map(function(m){return(m.by==='you'?'You: ':'AI: ')+(m.r==null?'pass':gsq(m.r,m.c));}),sc:[Math.round(sc.black*10)/10,Math.round(sc.white*10)/10]};}
  else if(g==='checkers'){if(!o||!o.winner)return null;
    var cl=o.moveLog||[];r=o.winner==='red'?'win':'loss';
    rec={g:g,d:p.checkersDifficulty,r:r,n:cl.length,mv:null,tx:cl.map(function(m){return(m.by==='you'?'You: ':'AI: ')+m.text;})};}
  else if(g==='gomoku'){if(!o||!o.over)return null;
    r=o.result==='human'?'win':o.result==='ai'?'loss':'draw';
    var gl=o.moveLog||[];
    rec={g:g,d:p.gomokuDifficulty,r:r,n:gl.length,mv:gl.map(function(m){return[m.r,m.c,m.by==='you'?o.human:o.ai];}),tx:gl.map(function(m){return(m.by==='you'?'You: ':'AI: ')+ksq(m.r,m.c);})};}
  if(!rec)return null;rec.m='cpu';rec.t=Date.now();return rec;
}
function mkMg(g){
  var M=MG[g],a=M&&M.game;if(!a||!a.over||a.task||a.puz)return null;
  var res=a.result||{};var r=res.draw?'draw':res.winner===a.human?'win':'loss';
  var rc=a.rec||[];
  return{g:g,m:'cpu',d:M.level||'',r:r,n:rc.length,mv:rc.map(function(x){return x.m;}),tx:rc.map(function(x,i){return((i%2===0)===(a.human===1)?'You: ':'AI: ')+x.x;}),h:a.human,t:Date.now()};
}
function over(g){var o=state.play[g];if(!o)return false;
  return g==='chess'||g==='xiangqi'?!!(o.status&&o.status.over):g==='go'?!!o.gameOver:g==='checkers'?!!o.winner:g==='gomoku'?!!o.over:false;}
var idleWas=true;
function check(){
  try{
    var friend=typeof DUEL!=='undefined'&&DUEL.state!=='idle';
    ['chess','go','xiangqi','checkers','gomoku'].forEach(function(g){
      var o=state.play[g];if(!o||o.__rec||!over(g))return;
      o.__rec=1;if(friend||o.duel)return;
      if(g==='gomoku'&&!o.moveLog)return;
      var rec=mkCpu(g);if(rec&&rec.n>0)add(rec);
    });
    ['janggi','shogi'].forEach(function(g){
      var a=MG[g]&&MG[g].game;if(!a||!a.over||a.__rec)return;
      a.__rec=1;if(friend||(typeof mgDuel==='function'&&mgDuel(g)))return;
      var rec=mkMg(g);if(rec&&rec.n>0)add(rec);
    });
  }catch(e){}
}
/* mg moves: keep a move list next to the engine's own history */
var mgApply0=mgApply;
mgApply=function(e,t,o){
  var a=MG[e]&&MG[e].game,txt='',n0=0;
  try{if(a&&!a.task&&!a.puz){n0=a.hist.length;txt=(e==='janggi'?jgMoveText:sgMoveText)(a.pos,t);}}catch(x){txt='?';}
  var out=mgApply0.apply(this,arguments);
  try{if(a&&!a.task&&!a.puz&&a.hist.length===n0+1){(a.rec=a.rec||[]).push({m:Array.prototype.slice.call(t),x:txt});}}catch(x){}
  return out;};
if(typeof mgUndo==='function'){var mgUndo0=mgUndo;mgUndo=function(e){var out=mgUndo0.apply(this,arguments);try{var a=MG[e].game;if(a&&a.rec)a.rec.length=Math.min(a.rec.length,a.hist.length);}catch(x){}return out;};}
/* friends: the duel layer archives each finished game once */
if(typeof duelArchive==='function'){
  var arch0=duelArchive;
  duelArchive=function(){
    var go=typeof DUEL!=='undefined'&&!DUEL.archived&&!DUEL.replaying&&DUEL.hist&&DUEL.hist.length;
    var out=arch0.apply(this,arguments);
    if(go){try{addFriend();}catch(e){}}
    return out;};
}
function addFriend(){
  var g=DUEL.game,msg=String(DUEL.endMsg||''),r='other';
  var first=(DUEL.role==='host')===(DUEL.first==='host');
  if(/You resigned/i.test(msg))r='loss';
  else if(/friend resigned/i.test(msg))r='win';
  else if(/draw/i.test(msg))r='draw';
  else if(/left the duel|out of step/i.test(msg))r='other';
  else{
    var o=state.play[g];
    try{
      if(g==='chess'&&o&&o.status){var s=o.status.result;r=s==='w-wins-checkmate'?(first?'win':'loss'):s==='b-wins-checkmate'?(first?'loss':'win'):'draw';}
      else if(g==='xiangqi'&&o&&o.status){var s2=String(o.status.result||'');r=/^r-wins/.test(s2)?(first?'win':'loss'):/^b-wins/.test(s2)?(first?'loss':'win'):'draw';}
      else if(g==='go'&&o&&o.scores){var me=o.duel?o.duel.me:(first?'black':'white');var d=o.scores.black-o.scores.white;r=d===0?'draw':((d>0)===(me==='black')?'win':'loss');}
      else if(g==='checkers'&&o&&o.winner){r=((o.winner==='red')===first)?'win':'loss';}
      else if(g==='gomoku'&&o&&o.over){r=o.result==='draw'?'draw':o.result==='human'?'win':'loss';}
      else if(g==='janggi'||g==='shogi'){var a=MG[g].game;if(a&&a.over){var rs=a.result||{};r=rs.draw?'draw':rs.winner===a.human?'win':'loss';}}
    }catch(e){}
  }
  try{var st=state.play[g];if(st)st.__rec=1;var ga=MG[g]&&MG[g].game;if(ga)ga.__rec=1;}catch(e){}
  add({g:g,m:'friend',d:'',r:r,n:DUEL.hist.length,mv:null,tx:[],t:Date.now(),note:msg});
}
/* ---------- render hook ---------- */
var render0=render;
render=function(){var out=render0.apply(this,arguments);check();return out;};
var play0=renderPlaySection;
renderPlaySection=function(){
  var tabs='<div class="rc-tabs" role="group" aria-label="Play or records"><button type="button" class="game-tab'+(V.on?'':' active')+'" data-rc="play"><span aria-hidden="true">⚔️</span> <span>Play</span></button>'+
    '<button type="button" class="game-tab'+(V.on?' active':'')+'" data-rc="open"><span aria-hidden="true">📒</span> <span>My games</span> <span class="rc-count">'+R.recs.length+'</span></button></div>';
  if(!V.on)return tabs+play0.apply(this,arguments);
  return tabs+recsHTML();
};
/* ---------- stats + list ---------- */
function filt(){return R.recs.filter(function(r){return(V.g==='all'||r.g===V.g)&&(V.m==='all'||r.m===V.m);});}
function tally(list){var t={win:0,loss:0,draw:0,other:0};list.forEach(function(r){t[r.r]=(t[r.r]||0)+1;});return t;}
function pct(t){var n=t.win+t.loss+t.draw;return n?Math.round(100*t.win/n):0;}
function dateStr(t){try{var d=new Date(t);return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});}catch(e){return'';}}
function streak(){var s=0;for(var i=0;i<R.recs.length;i++){var r=R.recs[i].r;if(r==='win')s++;else if(r==='other')continue;else break;}return s;}
function badge(r){return r==='win'?['🏆','Win','win']:r==='loss'?['📕','Loss','loss']:r==='draw'?['🤝','Draw','draw']:['•','Ended','other'];}
function recsHTML(){
  var all=R.recs,t=tally(all),list=filt();
  if(!all.length)return'<div class="rc-box"><h2>My games</h2><p class="rc-empty"><span>No games saved yet.</span> <span>Finish a game against the computer or a friend and it will appear here.</span></p></div>';
  var h='<div class="rc-box"><h2>My games</h2>';
  h+='<div class="rc-stats">'+
    '<div class="rc-stat"><b>'+all.length+'</b><span>Games</span></div>'+
    '<div class="rc-stat"><b>'+t.win+'</b><span>Wins</span></div>'+
    '<div class="rc-stat"><b>'+t.loss+'</b><span>Losses</span></div>'+
    '<div class="rc-stat"><b>'+t.draw+'</b><span>Draws</span></div>'+
    '<div class="rc-stat"><b>'+pct(t)+'%</b><span>Win rate</span></div>'+
    '<div class="rc-stat"><b>'+streak()+'</b><span>Current streak</span></div></div>';
  /* per game bars */
  h+='<div class="rc-per">';
  GAMES.forEach(function(G){var tt=tally(all.filter(function(r){return r.g===G[0];}));var n=tt.win+tt.loss+tt.draw+tt.other;if(!n)return;
    var w=Math.round(100*tt.win/n),d=Math.round(100*tt.draw/n),l=Math.max(0,100-w-d);
    h+='<div class="rc-prow"><span class="rc-pn"><span aria-hidden="true">'+G[1]+'</span> <span>'+G[2]+'</span></span><span class="rc-bar" aria-hidden="true"><i class="w" style="width:'+w+'%"></i><i class="d" style="width:'+d+'%"></i><i class="l" style="width:'+l+'%"></i></span><span class="rc-pt"><span>'+tt.win+'</span>–<span>'+tt.loss+'</span>–<span>'+tt.draw+'</span></span></div>';});
  h+='</div>';
  /* filters */
  h+='<div class="rc-filters"><span class="rc-chips">'+chip('g','all','All games')+GAMES.map(function(G){return chip('g',G[0],G[1]+' '+G[2],1);}).join('')+'</span>'+
     '<span class="rc-chips">'+chip('m','all','Anyone')+chip('m','cpu','🤖 Computer',1)+chip('m','friend','👥 Friends',1)+'</span></div>';
  if(!list.length)h+='<p class="rc-empty"><span>No games match this filter.</span></p>';
  var shown=V.more?list:list.slice(0,25);
  h+='<ul class="rc-list">'+shown.map(function(r){var i=R.recs.indexOf(r);return rowHTML(r,i);}).join('')+'</ul>';
  if(list.length>25&&!V.more)h+='<button type="button" class="action-btn" data-rc="more"><span>Show all</span></button>';
  h+='<div class="rc-foot"><button type="button" class="action-btn" data-rc="export"><span>Export as text</span></button> '+
    (V.clear?'<button type="button" class="action-btn rc-danger" data-rc="clear2"><span>Yes, delete all records</span></button> <button type="button" class="action-btn" data-rc="clear0"><span>Keep them</span></button>':'<button type="button" class="action-btn" data-rc="clear1"><span>Clear records</span></button>')+'</div></div>';
  return h;
}
function chip(k,v,label,emoji){var on=V[k]===v;
  if(emoji){var p=label.indexOf(' ');return'<button type="button" class="px-lm-chip'+(on?' on':'')+'" data-rc="f" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+on+'"><span aria-hidden="true">'+label.slice(0,p)+'</span> <span>'+label.slice(p+1)+'</span></button>';}
  return'<button type="button" class="px-lm-chip'+(on?' on':'')+'" data-rc="f" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+on+'"><span>'+label+'</span></button>';}
function rowHTML(r,i){
  var b=badge(r.r),G=gname(r.g),open=V.open===i;
  var who=r.m==='friend'?'<span aria-hidden="true">👥</span> <span>Friend</span>':'<span aria-hidden="true">🤖</span> <span>Computer</span>';
  var dd=r.d?' <span class="rc-dim">· <span>'+({easy:'Easy',normal:'Normal',hard:'Hard'}[r.d]||esc(r.d))+'</span></span>':'';
  var h='<li class="rc-row rc-'+b[2]+'"><div class="rc-main"><span class="rc-res"><span aria-hidden="true">'+b[0]+'</span> <span>'+b[1]+'</span></span> '+
   '<span class="rc-g"><span aria-hidden="true">'+G[1]+'</span> <span>'+G[2]+'</span></span> <span class="rc-who">'+who+dd+'</span> '+
   '<span class="rc-meta"><span>'+dateStr(r.t)+'</span> · <span>'+r.n+'</span> <span>'+(r.n===1?'move':'moves')+'</span>'+(r.sc?' · <span>'+r.sc[0]+'</span>–<span>'+r.sc[1]+'</span>':'')+'</span></div>'+
   '<div class="rc-act"><button type="button" class="action-btn" data-rc="open-row" data-i="'+i+'" aria-expanded="'+open+'"><span>'+(open?'Hide':'Review')+'</span></button> '+
   '<button type="button" class="action-btn" data-rc="del" data-i="'+i+'" aria-label="Delete this record"><span aria-hidden="true">🗑️</span></button></div>';
  if(open)h+=detailHTML(r,i);
  return h+'</li>';
}
/* ---------- replay ---------- */
function canBoard(r){return r.mv&&(r.g==='chess'||r.g==='xiangqi'||r.g==='go'||r.g==='gomoku'||r.g==='janggi'||r.g==='shogi');}
function detailHTML(r,i){
  var h='<div class="rc-detail">';
  if(r.m==='friend'){
    var idx=friendIdx(r);
    h+=(idx>=0?'<p><button type="button" class="action-btn" data-rc="friend-rep" data-i="'+i+'"><span>▶ Replay this game</span></button></p>':'<p class="rc-dim"><span>The replay of this friend game is no longer stored. Only the 12 most recent friend replays are kept.</span></p>');
    if(r.note)h+='<p class="rc-dim">'+esc(r.note)+'</p>';
    return h+'</div>';
  }
  var k=Math.max(0,Math.min(r.n,V.k));
  if(canBoard(r)){
    h+='<div class="rc-board">'+boardAt(r,k)+'</div>'+
     '<div class="rc-ctl"><button type="button" class="action-btn" data-rc="step" data-d="-999" aria-label="Start">⏮</button><button type="button" class="action-btn" data-rc="step" data-d="-1" aria-label="Back">◀</button>'+
     '<span class="rc-pos"><span>Move</span> <b>'+k+'</b> <span>of</span> <b>'+r.n+'</b></span>'+
     '<button type="button" class="action-btn" data-rc="step" data-d="1" aria-label="Next">▶</button><button type="button" class="action-btn" data-rc="step" data-d="999" aria-label="End">⏭</button></div>';
  }
  if(r.tx&&r.tx.length){
    h+='<ol class="rc-moves">'+r.tx.map(function(t,j){return'<li class="'+(j+1===k?'cur':'')+'"><button type="button" class="rc-mv" data-rc="goto" data-k="'+(j+1)+'">'+esc(t)+'</button></li>';}).join('')+'</ol>';
  }
  return h+'</div>';
}
function friendIdx(r){try{var L=duelHistList();for(var i=0;i<L.length;i++)if(L[i].game===r.g&&Math.abs((L[i].t||0)-r.t)<5000)return i;}catch(e){}return -1;}
var CG={w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}};
var XG={r:{g:'帥',a:'仕',e:'相',h:'傌',r:'俥',c:'炮',s:'兵'},b:{g:'將',a:'士',e:'象',h:'馬',r:'車',c:'砲',s:'卒'}};
function chessAt(r,k){
  var gs=initialChessGS(),last=null;
  for(var i=0;i<k;i++){var m=r.mv[i];var L=generateLegalMoves(gs).filter(function(x){return x.from[0]===m[0]&&x.from[1]===m[1]&&x.to[0]===m[2]&&x.to[1]===m[3];});
    if(!L.length)break;var pick=L.filter(function(x){return x.promotion==='q';})[0]||L[0];gs=applyMove(gs,pick);last=m;}
  var s=44,h='<svg viewBox="0 0 '+(s*8)+' '+(s*8)+'" class="rc-svg" role="img" aria-label="Chess board">';
  for(var y=0;y<8;y++)for(var x=0;x<8;x++){var hi=last&&((last[0]===y&&last[1]===x)||(last[2]===y&&last[3]===x));
    h+='<rect x="'+x*s+'" y="'+y*s+'" width="'+s+'" height="'+s+'" fill="'+((x+y)%2?'#A9784A':'#F4EBD5')+'"/>'+(hi?'<rect x="'+x*s+'" y="'+y*s+'" width="'+s+'" height="'+s+'" fill="#e8c33a" opacity=".45"/>':'');
    var p=gs.board[y][x];if(p)h+='<text x="'+(x*s+s/2)+'" y="'+(y*s+s*0.76)+'" text-anchor="middle" font-size="'+s*0.8+'" fill="'+(p.c==='w'?'#fff':'#111')+'" stroke="'+(p.c==='w'?'#111':'none')+'" stroke-width="'+(p.c==='w'?0.9:0)+'">'+CG[p.c==='w'?'b':'b'][p.t]+'</text>';}
  return h+'</svg>';
}
function xqAt(r,k){
  var gs=initialXiangqiGS(),last=null;
  for(var i=0;i<k;i++){var m=r.mv[i];var L=xqGenerateLegalMoves(gs).filter(function(x){return x.from[0]===m[0]&&x.from[1]===m[1]&&x.to[0]===m[2]&&x.to[1]===m[3];});
    if(!L.length)break;gs=xqApplyMove(gs,L[0]);last=m;}
  var s=40,pad=24,W=pad*2+8*s,H=pad*2+9*s,h='<svg viewBox="0 0 '+W+' '+H+'" class="rc-svg" role="img" aria-label="Xiangqi board"><rect width="'+W+'" height="'+H+'" fill="#E2BE80" rx="6"/>';
  var X=function(c){return pad+c*s;},Y=function(y){return pad+y*s;},ln='stroke="#5a4a30" stroke-width="1"';
  for(var y=0;y<10;y++)h+='<line x1="'+X(0)+'" y1="'+Y(y)+'" x2="'+X(8)+'" y2="'+Y(y)+'" '+ln+'/>';
  for(var c=0;c<9;c++){if(c===0||c===8)h+='<line x1="'+X(c)+'" y1="'+Y(0)+'" x2="'+X(c)+'" y2="'+Y(9)+'" '+ln+'/>';else{h+='<line x1="'+X(c)+'" y1="'+Y(0)+'" x2="'+X(c)+'" y2="'+Y(4)+'" '+ln+'/><line x1="'+X(c)+'" y1="'+Y(5)+'" x2="'+X(c)+'" y2="'+Y(9)+'" '+ln+'/>';}}
  h+='<line x1="'+X(3)+'" y1="'+Y(0)+'" x2="'+X(5)+'" y2="'+Y(2)+'" '+ln+'/><line x1="'+X(5)+'" y1="'+Y(0)+'" x2="'+X(3)+'" y2="'+Y(2)+'" '+ln+'/><line x1="'+X(3)+'" y1="'+Y(7)+'" x2="'+X(5)+'" y2="'+Y(9)+'" '+ln+'/><line x1="'+X(5)+'" y1="'+Y(7)+'" x2="'+X(3)+'" y2="'+Y(9)+'" '+ln+'/>';
  if(last)[[last[0],last[1]],[last[2],last[3]]].forEach(function(q){h+='<circle cx="'+X(q[1])+'" cy="'+Y(q[0])+'" r="'+(s*0.46)+'" fill="#e8c33a" opacity=".55"/>';});
  for(var y2=0;y2<10;y2++)for(var c2=0;c2<9;c2++){var p=gs.board[y2][c2];if(!p)continue;var red=p.c==='r';
    h+='<circle cx="'+X(c2)+'" cy="'+Y(y2)+'" r="'+(s*0.42)+'" fill="#F7EBCF" stroke="'+(red?'#B22':'#222')+'" stroke-width="2"/><text x="'+X(c2)+'" y="'+(Y(y2)+s*0.16)+'" text-anchor="middle" font-size="'+s*0.46+'" font-weight="700" fill="'+(red?'#B22':'#222')+'">'+XG[p.c][p.t]+'</text>';}
  return h+'</svg>';
}
function stoneBoard(n,cells,last,label,star){
  var s=n>15?22:30,pad=s,W=pad*2+(n-1)*s,h='<svg viewBox="0 0 '+W+' '+W+'" class="rc-svg" role="img" aria-label="'+label+'"><rect width="'+W+'" height="'+W+'" fill="#DDB56A" rx="6"/>';
  for(var i=0;i<n;i++)h+='<line x1="'+pad+'" y1="'+(pad+i*s)+'" x2="'+(pad+(n-1)*s)+'" y2="'+(pad+i*s)+'" stroke="#5a4a30" stroke-width="1"/><line x1="'+(pad+i*s)+'" y1="'+pad+'" x2="'+(pad+i*s)+'" y2="'+(pad+(n-1)*s)+'" stroke="#5a4a30" stroke-width="1"/>';
  (star||[]).forEach(function(q){h+='<circle cx="'+(pad+q[1]*s)+'" cy="'+(pad+q[0]*s)+'" r="2.5" fill="#5a4a30"/>';});
  cells.forEach(function(c){h+='<circle cx="'+(pad+c[1]*s)+'" cy="'+(pad+c[0]*s)+'" r="'+(s*0.46)+'" fill="'+(c[2]==='black'?'#111':'#f6f6f2')+'" stroke="#333" stroke-width="1"/>';});
  if(last)h+='<circle cx="'+(pad+last[1]*s)+'" cy="'+(pad+last[0]*s)+'" r="'+(s*0.2)+'" fill="none" stroke="#e33" stroke-width="2"/>';
  return h+'</svg>';
}
function goAt(r,k){
  var b=emptyGoBoard(19),ko=null,last=null,col='black';
  for(var i=0;i<k;i++){var m=r.mv[i];if(m){var t=tryPlaceStone(b,m[0],m[1],col,ko);if(t&&t.legal){b=t.board;ko=t.koPoint;last=m;}}else{ko=null;}col=col==='black'?'white':'black';}
  var cells=[];for(var y=0;y<19;y++)for(var x=0;x<19;x++)if(b[y][x])cells.push([y,x,b[y][x]]);
  var st=[];[3,9,15].forEach(function(a){[3,9,15].forEach(function(c){st.push([a,c]);});});
  return stoneBoard(19,cells,last,'Go board',st);
}
function gomokuAt(r,k){
  var cells=[],last=null;for(var i=0;i<k;i++){var m=r.mv[i];cells.push([m[0],m[1],m[2]]);last=m;}
  return stoneBoard(15,cells,last,'Gomoku board',[[7,7]]);
}
function mgAt(r,k){
  var pos=r.g==='janggi'?jgNew():sgNew(),E=mgEngine(r.g),last=[];
  for(var i=0;i<k;i++){var m=r.mv[i];try{E.doM(pos,m);last=r.g==='janggi'?[m[0],m[1]]:[m[0]>=100?-1:m[0],m[1]];}catch(e){break;}}
  var o={last:last,flip:r.h===-1};
  return'<div class="rc-mgwrap">'+(r.g==='janggi'?jgBoardSVG(pos.b,o):sgBoardSVG(pos.b,o))+'</div>';
}
function boardAt(r,k){
  try{return r.g==='chess'?chessAt(r,k):r.g==='xiangqi'?xqAt(r,k):r.g==='go'?goAt(r,k):r.g==='gomoku'?gomokuAt(r,k):mgAt(r,k);}catch(e){return'';}
}
/* ---------- clicks ---------- */
function exportText(){
  var L=['Two Boards — game records',''];
  R.recs.forEach(function(r){var G=gname(r.g);L.push('['+new Date(r.t).toISOString().slice(0,16).replace('T',' ')+'] '+G[2]+' · '+(r.m==='friend'?'friend':'computer'+(r.d?' ('+r.d+')':''))+' · '+badge(r.r)[1]+' · '+r.n+' moves');
    if(r.tx&&r.tx.length)L.push('  '+r.tx.join(' | '));});
  return L.join('\n');
}
function doExport(){
  try{var blob=new Blob([exportText()],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='two-boards-games.txt';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}catch(e){}
}
var app=document.getElementById('app');
app.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-rc]');if(!b)return;
  ev.preventDefault();ev.stopPropagation();
  var a=b.dataset.rc;
  if(a==='open'){V.on=true;V.open=-1;}
  else if(a==='play'){V.on=false;}
  else if(a==='f'){V[b.dataset.k]=b.dataset.v;V.open=-1;V.more=false;}
  else if(a==='more'){V.more=true;}
  else if(a==='open-row'){var i=+b.dataset.i;V.open=V.open===i?-1:i;V.k=V.open>=0?R.recs[i].n:0;}
  else if(a==='step'){var r=R.recs[V.open];if(r){var d=+b.dataset.d;V.k=d<=-999?0:d>=999?r.n:Math.max(0,Math.min(r.n,V.k+d));}}
  else if(a==='goto'){V.k=+b.dataset.k;}
  else if(a==='del'){R.recs.splice(+b.dataset.i,1);V.open=-1;save();}
  else if(a==='clear1'){V.clear=true;}
  else if(a==='clear0'){V.clear=false;}
  else if(a==='clear2'){R.recs=[];V.clear=false;V.open=-1;save();}
  else if(a==='export'){doExport();return;}
  else if(a==='friend-rep'){var rr=R.recs[+b.dataset.i],ix=rr?friendIdx(rr):-1;if(ix>=0){V.on=false;duelReplayOpen(ix);return;}}
  render();
},true);

/* a visible entry in the main menu */
(function(){
  var bar=document.querySelector('.area-bar');if(!bar||bar.querySelector('[data-rc-nav]'))return;
  var b=document.createElement('button');b.type='button';b.className='areabtn';b.setAttribute('data-rc-nav','1');
  b.innerHTML='<span aria-hidden="true">📒</span> <span>My games</span>';
  b.addEventListener('click',function(){if(state.mode==='adventure'&&typeof modeSwitch==='function')modeSwitch('learning');state.section='play';V.on=true;V.open=-1;render();window.scrollTo(0,0);});
  bar.appendChild(b);
})();
/* leaving the Play page and coming back should start on the game itself */
window.tbRecords={all:function(){return R.recs.slice();},show:function(){state.section='play';V.on=true;render();}};
})();
