/* Two Boards: Player profile + progress sync across devices. Loaded after plus-records.js. */
(function(){
'use strict';
if(typeof state==='undefined'||typeof render!=='function')return;
var META='tb-sync-v1';
var SKIP=/^(twoBoards\.mode\.v1|twoBoards\.lang|twoBoardsDuel1|twoBoards\.adventure\.(backup|premigrate)|twoBoards\.online\.v1|tb-sync-v1|tb-gist-v1|tb-acct-v1)$/;
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
var C={state:'off',kind:'',doc:null,uid:null,at:0,msg:'',pending:null,busy:false,last:0};
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
    if(typeof claude==='undefined'||!claude||typeof claude.use!=='function'){if(sb()&&acfg().refresh){if(await atoken())await startAccount();}else if(gcfg().token){startGist();await cloudPull();}refresh();return;}
    var db=await claude.use('db'),us=await claude.use('user');
    if(!db||!us)return;
    C.uid=await us.id();if(!C.uid)return;
    C.doc=db.doc('data/users/'+C.uid+'/save');C.state='on';C.kind='claude';
    await cloudPull();
    C.timer=setInterval(function(){cloudPush();},20000);
    document.addEventListener('visibilitychange',function(){if(document.hidden)cloudPush();});
  }catch(e){C.state='off';if(e&&e.code==='auth'){C.msg='GitHub did not accept the saved token. Connect again.';}}
  refresh();
}

/* ---------- GitHub gist backend (for the copy hosted on GitHub Pages) ---------- */
var GK='tb-gist-v1',GF='two-boards-save.json',GD='Two Boards save (private)';
function gcfg(){try{return JSON.parse(lsGet(GK)||'null')||{};}catch(e){return{};}}
function gsave(o){lsSet(GK,JSON.stringify(o));}
async function gh(path,opt){
  var c=gcfg();opt=opt||{};
  var r=await fetch('https://api.github.com'+path,{method:opt.method||'GET',headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+(opt.token||c.token),'Content-Type':'application/json'},body:opt.body?JSON.stringify(opt.body):undefined});
  if(r.status===401||r.status===403){var e=new Error('auth');e.code='auth';throw e;}
  if(r.status===404){var e2=new Error('nf');e2.code='not_found';throw e2;}
  if(!r.ok){var e3=new Error('http '+r.status);e3.code='http';throw e3;}
  return r.json();
}
function gistDoc(){
  return{
    get:async function(){
      var c=gcfg();if(!c.id)return null;
      var g=await gh('/gists/'+c.id),f=g.files&&g.files[GF];if(!f)return null;
      var txt=f.content;if(f.truncated&&f.raw_url){txt=await (await fetch(f.raw_url)).text();}
      var d=null;try{d=JSON.parse(txt);}catch(e){}
      return{exists:function(){return !!d;},data:function(){return d;}};
    },
    set:async function(v){
      var c=gcfg(),body={description:GD,files:{}};body.files[GF]={content:JSON.stringify(v)};
      if(c.id){await gh('/gists/'+c.id,{method:'PATCH',body:body});}
      else{body.public=false;var g=await gh('/gists',{method:'POST',body:body});c.id=g.id;gsave(c);}
    }
  };
}
async function gistConnect(token){
  token=String(token||'').trim();if(!token)throw new Error('empty');
  var list=await gh('/gists?per_page=100',{token:token}),id='';
  for(var i=0;i<list.length;i++)if(list[i].description===GD&&list[i].files&&list[i].files[GF]){id=list[i].id;break;}
  gsave({token:token,id:id});
  startGist();await cloudPull();
  if(!C.at&&C.state==='on'&&!hasProgress(bundle()))C.msg='';
}
function startGist(){useBackend(gistDoc(),'github');}
function useBackend(doc,kind){
  C.doc=doc;C.state='on';C.kind=kind;
  if(!C.timer){C.timer=setInterval(function(){cloudPush();},20000);document.addEventListener('visibilitychange',function(){if(document.hidden)cloudPush();});}
}
function gistOff(){var c=gcfg();lsSet(GK,'');C.state='off';C.kind='';C.doc=null;C.at=0;C.pending=null;setMeta({});refresh();}

/* ---------- Accounts (Supabase: email + password, no server of our own) ---------- */
var AK='tb-acct-v1',A={msg:'',ok:false,busy:false,del:false};
function sb(){var c=window.TB_SUPABASE;return c&&c.url&&c.key?c:null;}
function acfg(){try{return JSON.parse(lsGet(AK)||'null')||{};}catch(e){return{};}}
function asave(o){lsSet(AK,o?JSON.stringify(o):'');}
function storeSession(j,email){var o=acfg();asave({access:j.access_token,refresh:j.refresh_token||o.refresh,exp:Math.floor(Date.now()/1000)+(j.expires_in||3600),uid:(j.user&&j.user.id)||o.uid,email:email||(j.user&&j.user.email)||o.email});}
async function sreq(path,opt){
  opt=opt||{};var c=sb(),h={'apikey':c.key,'Content-Type':'application/json'},tok=opt.auth===false?null:await atoken();
  h.Authorization='Bearer '+(tok||c.key);if(opt.prefer)h.Prefer=opt.prefer;
  var r=await fetch(c.url.replace(/\/$/,'')+path,{method:opt.method||'GET',headers:h,body:opt.body?JSON.stringify(opt.body):undefined});
  var j=null;try{j=await r.json();}catch(e){}
  if(!r.ok){var e=new Error((j&&(j.msg||j.error_description||j.message))||('http '+r.status));e.status=r.status;throw e;}
  return j;
}
async function atoken(){
  var a=acfg();if(!a.access)return null;if(a.exp&&a.exp-60>Date.now()/1000)return a.access;if(!a.refresh)return null;
  try{var j=await sreq('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:a.refresh},auth:false});storeSession(j,a.email);return j.access_token;}
  catch(e){if(e.status===400||e.status===401)asave(null);return null;}
}
function accountDoc(){
  var uid=acfg().uid;
  return{
    get:async function(){var rows=await sreq('/rest/v1/saves?user_id=eq.'+uid+'&select=data');var d=rows&&rows[0]&&rows[0].data;return{exists:function(){return !!d;},data:function(){return d;}};},
    set:async function(v){await sreq('/rest/v1/saves?on_conflict=user_id',{method:'POST',prefer:'resolution=merge-duplicates,return=minimal',body:{user_id:uid,data:v}});}
  };
}
async function startAccount(){useBackend(accountDoc(),'account');await cloudPull();}
function friendly(e){var m=String(e&&e.message||'');
  if(/invalid login/i.test(m))return'Wrong email or password.';
  if(/password/i.test(m)&&/(least|short|weak)/i.test(m))return'That password is too short. Use at least 6 characters.';
  if(/rate|too many|seconds/i.test(m))return'Too many tries. Please wait a minute and try again.';
  if(/not confirmed/i.test(m))return'Please confirm your email first. Check your inbox.';
  if(/valid email|invalid.*email/i.test(m))return'That email does not look right.';
  return'Something went wrong. Check your internet and try again.';}
async function doAuth(kind,email,pw){
  A.msg='';A.ok=false;A.busy=true;refresh();
  try{
    if(!email||(kind!=='forgot'&&!pw)){A.msg=kind==='forgot'?'Type your email first.':'Type your email and password.';A.busy=false;refresh();return;}
    if(kind==='forgot'){await sreq('/auth/v1/recover',{method:'POST',body:{email:email},auth:false});A.msg='If that email has an account, we sent a link to choose a new password.';A.ok=true;}
    else if(kind==='login'){var j=await sreq('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email,password:pw},auth:false});storeSession(j,email);await startAccount();}
    else{var j2=await sreq('/auth/v1/signup',{method:'POST',body:{email:email,password:pw},auth:false});
      if(j2&&j2.access_token){storeSession(j2,email);await startAccount();}
      else{A.msg='Almost done! If this email is new, check your inbox and press the confirm link, then log in. If you already have an account, just log in.';A.ok=true;}}
  }catch(e){A.msg=friendly(e);A.ok=false;C.state=acfg().access?C.state:'off';}
  A.busy=false;refresh();
}
async function accountOut(){try{await sreq('/auth/v1/logout',{method:'POST'});}catch(e){}asave(null);setMeta({});C.state='off';C.kind='';C.doc=null;C.pending=null;A.msg='';A.del=false;refresh();}
async function accountDelete(){try{await sreq('/rest/v1/rpc/delete_me',{method:'POST',body:{}});}catch(e){A.msg='Could not delete the account right now.';A.del=false;refresh();return;}asave(null);setMeta({});C.state='off';C.kind='';C.doc=null;A.del=false;A.msg='Your account and cloud save were deleted.';A.ok=true;refresh();}
function acctHTML(){
  var a=acfg();
  if(C.kind==='account'&&a.email)return'<p class="pl-ok"><span aria-hidden="true">✅</span> <span>Signed in as</span> <b>'+esc(a.email)+'</b></p>'+
    '<p><button type="button" class="action-btn" data-pl="aclogout"><span>Log out</span></button> '+
    (A.del?'<button type="button" class="action-btn rc-danger" data-pl="acdel2"><span>Yes, delete my account</span></button> <button type="button" class="action-btn" data-pl="acdel0"><span>Keep it</span></button>':'<button type="button" class="action-btn" data-pl="acdel1"><span>Delete account</span></button>')+'</p>'+(A.msg?'<p class="'+(A.ok?'pl-ok':'pl-warn')+'">'+esc(A.msg)+'</p>':'');
  return'<p class="pl-dim"><span>Make an account to keep your progress safe and use it on any device. Ask a grown-up first if you are under 13.</span></p>'+
    '<label class="pl-lab"><span>Email</span> <input id="pl-em" class="pl-in" type="email" autocomplete="email"></label>'+
    '<label class="pl-lab"><span>Password</span> <input id="pl-pw" class="pl-in" type="password" autocomplete="current-password"></label>'+
    '<p class="pl-row"><button type="button" class="action-btn" data-pl="aclogin" '+(A.busy?'disabled':'')+'><span>Log in</span></button> <button type="button" class="action-btn" data-pl="acsignup" '+(A.busy?'disabled':'')+'><span>Sign up</span></button> <button type="button" class="action-btn" data-pl="acforgot" '+(A.busy?'disabled':'')+'><span>Forgot password</span></button></p>'+
    (A.msg?'<p class="'+(A.ok?'pl-ok':'pl-warn')+'" role="status">'+esc(A.msg)+'</p>':'');
}
/* ---------- panel ---------- */
var ov=null;
function inClaude(){return typeof claude!=='undefined'&&claude&&typeof claude.use==='function';}
function profile(){try{return{name:adv.player.name||'',avatar:adv.player.avatar||'🦊'};}catch(e){return{name:'',avatar:'🦊'};}}
function avatars(){try{return ADV_AVATARS_ALL.filter(function(a){return advAvatarUnlocked(a);});}catch(e){return['🦊','🐼','🐯','🐸'];}}
function ago(t){if(!t)return'';var s=Math.round((Date.now()-t)/1000);return s<60?'just now':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':Math.round(s/86400)+' d ago';}
function html(){
  var p=profile(),ph='';
  var avs=avatars().map(function(a){return'<button type="button" class="px-lm-chip'+(a===p.avatar?' on':'')+'" data-pl="avatar" data-v="'+a+'" aria-pressed="'+(a===p.avatar)+'"><span aria-hidden="true">'+a+'</span></button>';}).join('');
  var cloud;
  if(C.state==='on'){
    cloud=(C.kind==='account'?acctHTML():'')+'<p class="pl-ok"><span aria-hidden="true">☁️</span> <b>Cloud sync is on.</b> <span>'+(C.kind==='github'?'Your progress is saved in a private GitHub gist and follows you to any device where you connect the same token.':C.kind==='account'?'Your progress is saved to your account and follows you to any device where you log in.':'Your progress follows your Claude account to any device where you open this page.')+'</span></p>'+
      (C.last?'<p class="pl-dim"><span>Last synced:</span> <span>'+ago(C.last)+'</span></p>':'')+(C.msg?'<p class="pl-warn">'+esc(C.msg)+'</p>':'')+
      '<p><button type="button" class="action-btn" data-pl="sync"><span>Sync now</span></button>'+(C.kind==='github'?' <button type="button" class="action-btn" data-pl="gistoff"><span>Disconnect GitHub</span></button>':'')+'</p>';
    if(C.pending)cloud+='<div class="pl-conflict" role="alert"><p><b>Two different saves found.</b> <span>The cloud has a save from another device.</span> <span>(Your game records are merged either way.)</span></p><p><button type="button" class="action-btn" data-pl="usecloud"><span>Use the cloud save</span></button> <button type="button" class="action-btn" data-pl="usehere"><span>Keep this device</span></button></p></div>';
  }else if(C.state==='big'){cloud='<p class="pl-warn">'+esc(C.msg)+'</p>';}
  else cloud=(C.msg?'<p class="pl-warn">'+esc(C.msg)+'</p>':'')+(inClaude()?'<p class="pl-dim"><span>Cloud sync is not available right now. Use the save file or code below.</span></p>':sb()?acctHTML():
    '<p class="pl-dim"><span>Sync your progress with a private GitHub gist. No server needed.</span></p>'+
    '<ol class="pl-steps pl-dim"><li><a href="https://github.com/settings/tokens/new?scopes=gist&description=Two%20Boards" target="_blank" rel="noopener"><span>Create a GitHub token</span></a> <span>with only the “gist” permission.</span></li><li><span>Paste it here and press Connect. Do the same on your other devices.</span></li></ol>'+
    '<label class="pl-lab"><span>Token</span> <input id="pl-tok" class="pl-in" type="password" autocomplete="off" placeholder="ghp_…"></label>'+
    '<p><button type="button" class="action-btn" data-pl="gistcon"><span>Connect GitHub</span></button></p>'+
    '<p class="pl-dim"><span>The token stays in this browser only. It is never added to your save.</span></p>');
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
function refresh(){if(!ov)return;var keep=ov.querySelector('#pl-code'),v=keep?keep.value:'',nm=ov.querySelector('#pl-name'),nv=nm?nm.value:null,eo=ov.querySelector('#pl-em'),ev0=eo?eo.value:'';ov.innerHTML=html();
  var f=ov.querySelector('#pl-file');if(f)f.addEventListener('change',onFile);var c=ov.querySelector('#pl-code');if(c)c.value=v;var n2=ov.querySelector('#pl-name');if(n2&&nv!=null)n2.value=nv;if(ev0){var e2=ov.querySelector('#pl-em');if(e2)e2.value=ev0;}}
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
  if(a==='aclogin'||a==='acsignup'||a==='acforgot'){var em=ov.querySelector('#pl-em'),pw=ov.querySelector('#pl-pw');await doAuth(a==='aclogin'?'login':a==='acsignup'?'signup':'forgot',em&&em.value.trim(),pw&&pw.value);return;}
  if(a==='aclogout'){await accountOut();return;}
  if(a==='acdel1'){A.del=true;refresh();return;}
  if(a==='acdel0'){A.del=false;refresh();return;}
  if(a==='acdel2'){await accountDelete();return;}
  if(a==='gistcon'){var tk=ov.querySelector('#pl-tok');C.msg='';try{await gistConnect(tk&&tk.value);}catch(e){C.state='off';C.msg=e&&e.code==='auth'?'GitHub did not accept that token. Check that it has the “gist” permission.':'Could not connect to GitHub. Check the token and your internet connection.';}refresh();return;}
  if(a==='gistoff'){gistOff();return;}
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
