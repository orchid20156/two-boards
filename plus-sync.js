/* Two Boards: Player profile + progress sync across devices. Loaded after plus-records.js. */
(function(){
'use strict';
if(typeof state==='undefined'||typeof render!=='function')return;
var META='tb-sync-v1';
var SKIP=/^(twoBoards\.mode\.v1|twoBoards\.lang|twoBoardsDuel1|twoBoards\.adventure\.(backup|premigrate)|twoBoards\.online\.v1|tb-sync-v1)$/;
var TAKE=/^(two-boards-|twoBoards|tb-)/;
var MAXLEN=850000;
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function keys(){var o=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(TAKE.test(k)&&!SKIP.test(k))o.push(k);}}catch(e){}return o.sort();}
function bundle(){var b={};keys().forEach(function(k){var v=lsGet(k);if(v!=null)b[k]=v;});return b;}
function hash(b){var s='',h=5381;Object.keys(b).sort().forEach(function(k){s+=k+'\u0001'+b[k]+'\u0002';});for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return String(h)+':'+s.length;}
function meta(){try{return JSON.parse(lsGet(META)||'{}')||{};}catch(e){return{};}}
function setMeta(m){lsSet(META,JSON.stringify(m));}
function hasProgress(b){return Object.keys(b).some(function(k){return k!=='twoBoards.online.v1'&&(b[k]||'').length>40;});}
/* merge game records by id so two devices never lose games */
function mergeRecs(a,b){try{var A=JSON.parse(a||'{"recs":[]}').recs||[],B=JSON.parse(b||'{"recs":[]}').recs||[],seen={},out=[];
  A.concat(B).forEach(function(r){if(r&&r.id&&!seen[r.id]){seen[r.id]=1;out.push(r);}});out.sort(function(x,y){return(y.t||0)-(x.t||0);});
  return JSON.stringify({recs:out.slice(0,300)});}catch(e){return b||a;}}
function applyBundle(b,reload){
  var cur=bundle();
  Object.keys(b).forEach(function(k){if(!TAKE.test(k)||SKIP.test(k))return;var v=b[k];if(typeof v!=='string')return;
    lsSet(k,k==='tb-rec-v1'?mergeRecs(cur[k],v):v);});
  setMeta(Object.assign(meta(),{hash:hash(bundle())}));
  if(reload!==false)location.reload();
}
/* ---------- code / file ---------- */
function b64(u8){var s='';for(var i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);}
function unb64(s){var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
async function encode(){
  var json=JSON.stringify({app:'two-boards',v:1,at:Date.now(),data:bundle()});
  var bytes=new TextEncoder().encode(json);
  if(typeof CompressionStream==='function'){try{var cs=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));var buf=new Uint8Array(await new Response(cs).arrayBuffer());return'TB2:'+b64(buf);}catch(e){}}
  return'TB1:'+b64(bytes);
}
async function decode(txt){
  txt=String(txt||'').trim();var json;
  if(txt.charAt(0)==='{')json=txt;
  else if(txt.indexOf('TB1:')===0)json=new TextDecoder().decode(unb64(txt.slice(4).replace(/\s+/g,'')));
  else if(txt.indexOf('TB2:')===0){var u=unb64(txt.slice(4).replace(/\s+/g,''));var ds=new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));json=new TextDecoder().decode(new Uint8Array(await new Response(ds).arrayBuffer()));}
  else throw new Error('format');
  var o=JSON.parse(json);if(!o||o.app!=='two-boards'||!o.data||typeof o.data!=='object')throw new Error('format');return o;
}
/* ---------- cloud ---------- */
var C={state:'off',doc:null,uid:null,at:0,msg:'',pending:null,busy:false,last:0};
function snapData(s){if(!s)return null;try{if(typeof s.exists==='function'&&!s.exists())return null;if(s.exists===false)return null;var d=typeof s.data==='function'?s.data():(s.data!==undefined?s.data:s);return d&&typeof d==='object'&&d.bundle?d:null;}catch(e){return null;}}
async function cloudGet(){
  try{if(typeof C.doc.get==='function')return snapData(await C.doc.get());}catch(e){if(e&&(e.code==='not_found'))return null;throw e;}
  return await new Promise(function(res,rej){var un=null,done=false;try{un=C.doc.onSnapshot(function(s){if(done)return;done=true;try{un&&un();}catch(e){}res(snapData(s));},function(e){if(done)return;done=true;rej(e);});}catch(e){rej(e);}setTimeout(function(){if(!done){done=true;rej(new Error('timeout'));}},8000);});
}
async function cloudPush(){
  if(C.busy||C.state!=='on'||C.pending)return;
  var b=bundle(),h=hash(b);if(!hasProgress(b))return;
  var m=meta();if(m.hash===h&&m.at&&m.at===C.at)return;
  var json=JSON.stringify(b);if(json.length>MAXLEN){C.msg='Your save is too large for cloud sync. Use the save file instead.';C.state='big';refresh();return;}
  C.busy=true;
  try{var at=Date.now();await C.doc.set({v:1,at:at,dev:devName(),bundle:b});C.at=at;setMeta({at:at,hash:h});C.last=at;C.msg='';}
  catch(e){C.msg='Could not reach the cloud just now. Will try again.';}
  C.busy=false;refresh();
}
function devName(){var u=navigator.userAgent||'';return/iPhone|iPad/.test(u)?'iPhone/iPad':/Android/.test(u)?'Android':/Mac/.test(u)?'Mac':/Windows/.test(u)?'Windows':/Linux/.test(u)?'Linux':'device';}
async function cloudPull(){
  var d=await cloudGet(),m=meta(),b=bundle(),h=hash(b);
  if(!d){C.at=0;if(hasProgress(b))await cloudPush();return;}
  C.at=d.at;
  if(m.at===d.at){if(m.hash!==h)await cloudPush();else C.last=d.at;return;}
  if(m.hash&&m.hash===h){applyBundle(d.bundle,true);return;}           /* nothing new here: just take the cloud copy */
  if(!hasProgress(b)){applyBundle(d.bundle,true);return;}              /* fresh device */
  C.pending=d;C.state='on';refresh();                                    /* both changed: ask */
}
async function cloudStart(){
  try{
    if(typeof claude==='undefined'||!claude||typeof claude.use!=='function')return;
    var db=await claude.use('db'),us=await claude.use('user');
    if(!db||!us)return;
    C.uid=await us.id();if(!C.uid)return;
    C.doc=db.doc('data/users/'+C.uid+'/save');C.state='on';
    await cloudPull();
    setInterval(function(){cloudPush();},20000);
    document.addEventListener('visibilitychange',function(){if(document.hidden)cloudPush();});
  }catch(e){C.state='off';}
  refresh();
}
/* ---------- panel ---------- */
var ov=null;
function profile(){try{return{name:adv.player.name||'',avatar:adv.player.avatar||'🦊'};}catch(e){return{name:'',avatar:'🦊'};}}
function avatars(){try{return ADV_AVATARS_ALL.filter(function(a){return advAvatarUnlocked(a);});}catch(e){return['🦊','🐼','🐯','🐸'];}}
function ago(t){if(!t)return'';var s=Math.round((Date.now()-t)/1000);return s<60?'just now':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':Math.round(s/86400)+' d ago';}
function html(){
  var p=profile(),ph='';
  var avs=avatars().map(function(a){return'<button type="button" class="px-lm-chip'+(a===p.avatar?' on':'')+'" data-pl="avatar" data-v="'+a+'" aria-pressed="'+(a===p.avatar)+'"><span aria-hidden="true">'+a+'</span></button>';}).join('');
  var cloud;
  if(C.state==='on'){
    cloud='<p class="pl-ok"><span aria-hidden="true">☁️</span> <b>Cloud sync is on.</b> <span>Your progress follows your Claude account to any device where you open this page.</span></p>'+
      (C.last?'<p class="pl-dim"><span>Last synced:</span> <span>'+ago(C.last)+'</span></p>':'')+(C.msg?'<p class="pl-warn">'+esc(C.msg)+'</p>':'')+
      '<p><button type="button" class="action-btn" data-pl="sync"><span>Sync now</span></button></p>';
    if(C.pending)cloud+='<div class="pl-conflict" role="alert"><p><b>Two different saves found.</b> <span>The cloud has a save from another device.</span> <span>(Your game records are merged either way.)</span></p><p><button type="button" class="action-btn" data-pl="usecloud"><span>Use the cloud save</span></button> <button type="button" class="action-btn" data-pl="usehere"><span>Keep this device</span></button></p></div>';
  }else if(C.state==='big'){cloud='<p class="pl-warn">'+esc(C.msg)+'</p>';}
  else cloud='<p class="pl-dim"><span>Automatic cloud sync only works in the published Claude page. Here, use the save file or code below to move your progress.</span></p>';
  return'<div class="pl-card" role="dialog" aria-modal="true" aria-labelledby="pl-title"><button type="button" class="pl-x" data-pl="close" aria-label="Close">✕</button>'+
   '<h2 id="pl-title"><span aria-hidden="true">👤</span> <span>Player</span></h2>'+
   '<h3>Your profile</h3><label class="pl-lab"><span>Name</span> <input id="pl-name" class="pl-in" maxlength="16" value="'+esc(p.name)+'" autocomplete="nickname"></label>'+
   '<div class="pl-av" role="group" aria-label="Avatar">'+avs+'</div>'+
   '<p><button type="button" class="action-btn" data-pl="saveprof"><span>Save profile</span></button> <span id="pl-pm" class="pl-dim" role="status"></span></p>'+
   '<h3>Use your progress on other devices</h3>'+cloud+
   '<h4>Save file or code</h4><p class="pl-dim"><span>Works everywhere. Export on this device, then import on the other one.</span></p>'+
   '<p class="pl-row"><button type="button" class="action-btn" data-pl="file"><span>Download save file</span></button> <button type="button" class="action-btn" data-pl="copy"><span>Copy save code</span></button></p>'+
   '<textarea id="pl-code" class="pl-ta" rows="3" aria-label="Save code" placeholder="TB2:…"></textarea>'+
   '<p class="pl-row"><button type="button" class="action-btn" data-pl="import"><span>Import from code</span></button> <label class="action-btn pl-fl"><span>Import from file</span><input id="pl-file" type="file" accept=".json,.txt,application/json,text/plain" hidden></label></p>'+
   '<p id="pl-msg" class="pl-dim" role="status"></p><p class="pl-dim"><span>Importing adds your game records to the ones here and replaces the rest of the progress on this device.</span></p></div>';
}
function say(t,bad){var m=ov&&ov.querySelector('#pl-msg');if(m){m.textContent=t;m.className=bad?'pl-warn':'pl-dim';}}
function open(){
  if(ov)close();
  ov=document.createElement('div');ov.id='pl-ov';ov.className='pl-ov';ov.innerHTML=html();document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)close();});
  var f=ov.querySelector('#pl-file');if(f)f.addEventListener('change',onFile);
  var n=ov.querySelector('#pl-name');if(n)n.focus();
}
function close(){if(ov){ov.remove();ov=null;}}
function refresh(){if(!ov)return;var keep=ov.querySelector('#pl-code'),v=keep?keep.value:'',nm=ov.querySelector('#pl-name'),nv=nm?nm.value:null;ov.innerHTML=html();
  var f=ov.querySelector('#pl-file');if(f)f.addEventListener('change',onFile);var c=ov.querySelector('#pl-code');if(c)c.value=v;var n2=ov.querySelector('#pl-name');if(n2&&nv!=null)n2.value=nv;}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ov)close();});
var picked=null;
async function onFile(e){
  var f=e.target.files&&e.target.files[0];if(!f)return;
  try{var o=await decode(await f.text());applyBundle(o.data,true);}catch(x){say('That file is not a Two Boards save.',true);}
}
function dl(name,txt){try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}catch(e){}}
document.addEventListener('click',async function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-pl]');if(!b)return;
  var a=b.dataset.pl;
  if(a==='close'){close();return;}
  if(a==='avatar'){picked=b.dataset.v;ov.querySelectorAll('[data-pl=avatar]').forEach(function(x){var on=x.dataset.v===picked;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on);});return;}
  if(a==='saveprof'){var nm=ov.querySelector('#pl-name').value;try{if(typeof advSetProfile==='function'){var av=picked||profile().avatar;advSetProfile(nm,av);}var pm=ov.querySelector('#pl-pm');if(pm)pm.textContent='Saved.';}catch(e){}return;}
  if(a==='sync'){try{C.pending=null;C.busy=false;await cloudPull();say('');}catch(e){C.msg='Could not reach the cloud just now. Will try again.';}refresh();return;}
  if(a==='usecloud'){var d=C.pending;C.pending=null;if(d)applyBundle(d.bundle,true);return;}
  if(a==='usehere'){C.pending=null;setMeta({at:C.at,hash:''});await cloudPush();refresh();return;}
  if(a==='file'){var code=await encode();dl('two-boards-save.txt',code);say('Save file downloaded.');return;}
  if(a==='copy'){var c2=await encode(),ta=ov.querySelector('#pl-code');ta.value=c2;ta.select();var ok=false;try{ok=await navigator.clipboard.writeText(c2).then(function(){return true;},function(){return false;});}catch(e){}if(!ok){try{ok=document.execCommand('copy');}catch(e){}}say(ok?'Code copied. Paste it on your other device.':'Select the code above and copy it.');return;}
  if(a==='import'){try{var o=await decode(ov.querySelector('#pl-code').value);applyBundle(o.data,true);}catch(e){say('That code did not work. Check that you copied all of it.',true);}return;}
},true);
/* menu entry */
(function(){
  var bar=document.querySelector('.area-bar');if(!bar||bar.querySelector('[data-pl-nav]'))return;
  var b=document.createElement('button');b.type='button';b.className='areabtn';b.setAttribute('data-pl-nav','1');
  b.innerHTML='<span aria-hidden="true">👤</span> <span>Player</span>';
  b.addEventListener('click',open);bar.appendChild(b);
})();
window.tbSync={open:open,bundle:bundle,encode:encode,decode:decode,state:function(){return C;},start:cloudStart};
cloudStart();
})();
