/* Two Boards: extra puzzles for Kids (easier) and Pro (harder) pace. Standard mode keeps the original puzzle set. Loaded before plus-learn.js. */
(function(){
'use strict';
if(typeof CHESS_PUZZLES==='undefined'||typeof GOMOKU_PUZZLES==='undefined'||typeof state==='undefined')return;
var DATA={"chess":{"kids":[{"pieces":[{"r":4,"c":3,"t":"q","c2":"w"},{"r":5,"c":0,"t":"k","c2":"w"},{"r":7,"c":1,"t":"k","c2":"b"}],"line":[{"from":[4,3],"to":[7,3]}],"san":["Qd4-d1#"]},{"pieces":[{"r":0,"c":1,"t":"k","c2":"b"},{"r":1,"c":6,"t":"r","c2":"w"},{"r":4,"c":3,"t":"k","c2":"w"},{"r":6,"c":4,"t":"r","c2":"w"}],"line":[{"from":[6,4],"to":[0,4]}],"san":["Re2-e8#"]},{"pieces":[{"r":0,"c":4,"t":"q","c2":"w"},{"r":4,"c":0,"t":"n","c2":"b"},{"r":7,"c":5,"t":"k","c2":"w"},{"r":7,"c":7,"t":"k","c2":"b"}],"line":[{"from":[0,4],"to":[0,7]}],"san":["Qe8-h8#"]},{"pieces":[{"r":0,"c":7,"t":"k","c2":"b"},{"r":2,"c":2,"t":"r","c2":"w"},{"r":2,"c":6,"t":"k","c2":"w"},{"r":7,"c":7,"t":"r","c2":"b"}],"line":[{"from":[2,2],"to":[0,2]}],"san":["Rc6-c8#"]},{"pieces":[{"r":0,"c":0,"t":"k","c2":"b"},{"r":1,"c":2,"t":"k","c2":"w"},{"r":1,"c":6,"t":"q","c2":"w"},{"r":5,"c":5,"t":"r","c2":"w"}],"line":[{"from":[1,6],"to":[7,0]}],"san":["Qg7-a1#"]},{"pieces":[{"r":0,"c":3,"t":"r","c2":"w"},{"r":5,"c":6,"t":"b","c2":"w"},{"r":6,"c":0,"t":"k","c2":"b"},{"r":6,"c":2,"t":"k","c2":"w"}],"line":[{"from":[0,3],"to":[0,0]}],"san":["Rd8-a8#"]},{"pieces":[{"r":1,"c":5,"t":"k","c2":"w"},{"r":2,"c":7,"t":"k","c2":"b"},{"r":4,"c":6,"t":"q","c2":"w"},{"r":6,"c":4,"t":"b","c2":"b"}],"line":[{"from":[4,6],"to":[2,6]}],"san":["Qg4-g6#"]},{"pieces":[{"r":2,"c":0,"t":"n","c2":"w"},{"r":4,"c":1,"t":"r","c2":"w"},{"r":5,"c":6,"t":"k","c2":"w"},{"r":7,"c":6,"t":"k","c2":"b"}],"line":[{"from":[4,1],"to":[7,1]}],"san":["Rb4-b1#"]},{"pieces":[{"r":0,"c":2,"t":"k","c2":"b"},{"r":1,"c":0,"t":"q","c2":"w"},{"r":2,"c":6,"t":"k","c2":"w"},{"r":6,"c":1,"t":"q","c2":"w"}],"line":[{"from":[6,1],"to":[0,1]}],"san":["Qb2-b8#"]},{"pieces":[{"r":0,"c":7,"t":"k","c2":"b"},{"r":2,"c":5,"t":"k","c2":"w"},{"r":3,"c":6,"t":"q","c2":"w"}],"line":[{"from":[3,6],"to":[1,6]}],"san":["Qg5-g7#"]},{"pieces":[{"r":1,"c":1,"t":"r","c2":"w"},{"r":2,"c":6,"t":"k","c2":"w"},{"r":4,"c":1,"t":"r","c2":"w"},{"r":7,"c":0,"t":"k","c2":"b"}],"line":[{"from":[1,1],"to":[1,0]}],"san":["Rb7-a7#"]},{"pieces":[{"r":4,"c":2,"t":"k","c2":"w"},{"r":5,"c":0,"t":"k","c2":"b"},{"r":5,"c":7,"t":"n","c2":"b"},{"r":6,"c":2,"t":"q","c2":"w"}],"line":[{"from":[6,2],"to":[5,1]}],"san":["Qc2-b3#"]},{"pieces":[{"r":0,"c":4,"t":"r","c2":"w"},{"r":1,"c":6,"t":"r","c2":"b"},{"r":5,"c":1,"t":"k","c2":"w"},{"r":7,"c":1,"t":"k","c2":"b"}],"line":[{"from":[0,4],"to":[7,4]}],"san":["Re8-e1#"]},{"pieces":[{"r":1,"c":0,"t":"k","c2":"b"},{"r":2,"c":2,"t":"q","c2":"w"},{"r":3,"c":1,"t":"r","c2":"w"},{"r":5,"c":7,"t":"k","c2":"w"}],"line":[{"from":[2,2],"to":[1,1]}],"san":["Qc6-b7#"]}],"pro":[{"pieces":[{"r":2,"c":3,"t":"q","c2":"w"},{"r":3,"c":1,"t":"k","c2":"b"},{"r":6,"c":0,"t":"k","c2":"w"}],"line":[{"from":[6,0],"to":[5,1]},{"from":[3,1],"to":[3,0]},{"from":[5,1],"to":[4,2]},{"from":[3,0],"to":[4,0]},{"from":[2,3],"to":[2,0]}],"san":["Ka2-b3","Kb5-a5","Kb3-c4","Ka5-a4","Qd6-a6#"]},{"pieces":[{"r":0,"c":0,"t":"k","c2":"w"},{"r":0,"c":7,"t":"r","c2":"w"},{"r":2,"c":2,"t":"k","c2":"b"},{"r":7,"c":3,"t":"r","c2":"w"}],"line":[{"from":[0,7],"to":[3,7]},{"from":[2,2],"to":[1,2]},{"from":[3,7],"to":[2,7]},{"from":[1,2],"to":[0,2]},{"from":[2,7],"to":[2,2]}],"san":["Rh8-h5","Kc6-c7","Rh5-h6","Kc7-c8","Rh6-c6#"]},{"pieces":[{"r":0,"c":2,"t":"r","c2":"w"},{"r":1,"c":6,"t":"k","c2":"w"},{"r":4,"c":6,"t":"q","c2":"w"},{"r":6,"c":5,"t":"k","c2":"b"}],"line":[{"from":[0,2],"to":[5,2]},{"from":[6,5],"to":[7,5]},{"from":[5,2],"to":[6,2]},{"from":[7,5],"to":[7,4]},{"from":[4,6],"to":[7,6]}],"san":["Rc8-c3","Kf2-f1","Rc3-c2","Kf1-e1","Qg4-g1#"]},{"pieces":[{"r":1,"c":5,"t":"q","c2":"w"},{"r":4,"c":7,"t":"k","c2":"w"},{"r":7,"c":6,"t":"r","c2":"b"},{"r":7,"c":7,"t":"k","c2":"b"}],"line":[{"from":[1,5],"to":[5,5]},{"from":[7,6],"to":[6,6]},{"from":[4,7],"to":[5,7]},{"from":[7,7],"to":[7,6]},{"from":[5,5],"to":[6,6]}],"san":["Qf7-f3+","Rg1-g2","Kh4-h3","Kh1-g1","Qf3xg2#"]},{"pieces":[{"r":1,"c":1,"t":"r","c2":"w"},{"r":2,"c":6,"t":"k","c2":"b"},{"r":5,"c":7,"t":"k","c2":"w"},{"r":6,"c":1,"t":"b","c2":"w"}],"line":[{"from":[5,7],"to":[4,6]},{"from":[2,6],"to":[2,7]},{"from":[4,6],"to":[3,5]},{"from":[2,7],"to":[3,7]},{"from":[1,1],"to":[1,7]}],"san":["Kh3-g4","Kg6-h6","Kg4-f5","Kh6-h5","Rb7-h7#"]},{"pieces":[{"r":1,"c":7,"t":"n","c2":"w"},{"r":5,"c":1,"t":"q","c2":"w"},{"r":6,"c":7,"t":"k","c2":"w"},{"r":7,"c":5,"t":"k","c2":"b"}],"line":[{"from":[5,1],"to":[6,2]},{"from":[7,5],"to":[7,4]},{"from":[6,7],"to":[5,6]},{"from":[7,4],"to":[7,5]},{"from":[6,2],"to":[6,5]}],"san":["Qb3-c2","Kf1-e1","Kh2-g3","Ke1-f1","Qc2-f2#"]},{"pieces":[{"r":0,"c":5,"t":"k","c2":"b"},{"r":2,"c":5,"t":"k","c2":"w"},{"r":4,"c":3,"t":"n","c2":"b"},{"r":4,"c":5,"t":"r","c2":"w"}],"line":[{"from":[4,5],"to":[4,3]},{"from":[0,5],"to":[0,6]},{"from":[4,3],"to":[4,7]},{"from":[0,6],"to":[0,5]},{"from":[4,7],"to":[0,7]}],"san":["Rf4xd4","Kf8-g8","Rd4-h4","Kg8-f8","Rh4-h8#"]},{"pieces":[{"r":0,"c":3,"t":"k","c2":"b"},{"r":3,"c":5,"t":"k","c2":"w"},{"r":6,"c":1,"t":"q","c2":"w"},{"r":7,"c":0,"t":"b","c2":"w"},{"r":7,"c":7,"t":"n","c2":"b"}],"line":[{"from":[6,1],"to":[1,1]},{"from":[0,3],"to":[0,4]},{"from":[3,5],"to":[2,4]},{"from":[0,4],"to":[0,5]},{"from":[1,1],"to":[0,1]}],"san":["Qb2-b7","Kd8-e8","Kf5-e6","Ke8-f8","Qb7-b8#"]},{"pieces":[{"r":3,"c":3,"t":"q","c2":"w"},{"r":4,"c":1,"t":"k","c2":"b"},{"r":5,"c":3,"t":"k","c2":"w"}],"line":[{"from":[5,3],"to":[6,2]},{"from":[4,1],"to":[4,0]},{"from":[6,2],"to":[5,2]},{"from":[4,0],"to":[5,0]},{"from":[3,3],"to":[3,0]}],"san":["Kd3-c2","Kb4-a4","Kc2-c3","Ka4-a3","Qd5-a5#"]},{"pieces":[{"r":0,"c":0,"t":"k","c2":"w"},{"r":4,"c":1,"t":"r","c2":"w"},{"r":4,"c":4,"t":"r","c2":"w"},{"r":5,"c":7,"t":"k","c2":"b"}],"line":[{"from":[4,4],"to":[4,6]},{"from":[5,7],"to":[6,7]},{"from":[4,1],"to":[5,1]},{"from":[6,7],"to":[7,7]},{"from":[5,1],"to":[5,7]}],"san":["Re4-g4","Kh3-h2","Rb4-b3","Kh2-h1","Rb3-h3#"]}]},"gomoku":{"kids":[{"black":["I5","J5","K5","L5"],"white":["J8","L8","M6","G3"],"line":["M5"],"depth":1},{"black":["I13","J12","I11","H10","G9","J8"],"white":["H14","K14","L13","E12","K11","G6"],"line":["K13"],"depth":1},{"black":["F10","F9","F8","F7"],"white":["G10","D9","I9","E5"],"line":["F11"],"depth":1},{"black":["G8","E5","F5","G5","I5"],"white":["C9","J5","K5","C4","H1"],"line":["H5"],"depth":1},{"black":["I5","J5","K5","L5","N2"],"white":["I6","G4","L4","K3","M1"],"line":["H5"],"depth":1},{"black":["H9","J9","K9","L9"],"white":["F13","G11","F10","M8"],"line":["I9"],"depth":1},{"black":["J6","L6","K5","J4","I3","N3","G1"],"white":["G8","L8","O7","H5","I4","M4","N2"],"line":["M7"],"depth":1},{"black":["C12","H11","G10","E8","I8","D7","G7"],"white":["G13","E10","I7","I6","E5","G5","H5"],"line":["F9"],"depth":1},{"black":["I8","H6","I6","G5","I5","I4"],"white":["J7","M7","F5","H4","E3","I3"],"line":["I7"],"depth":1},{"black":["F13","D11","F11","F10","H10","F9","H9"],"white":["B14","C14","D13","C12","E10","I9","E8"],"line":["F12"],"depth":1},{"black":["C10","D9","E8","F7"],"white":["C11","G6","G5","I4"],"line":["B11"],"depth":1},{"black":["G10","B9","D6","E6","F6","G6","F4"],"white":["E9","D8","H8","E7","B6","H6","C3"],"line":["C6"],"depth":1},{"black":["G13","M13","I12","L12","J10","I9"],"white":["I14","O14","I11","L11","L8","M7"],"line":["K11"],"depth":1},{"black":["E13","F12","G11","H10"],"white":["D10","J8","F7","H7"],"line":["D14"],"depth":1}],"pro":[{"black":["J11","E10","I10","K10","M10","I9","E7","H6","I6","H5","I4"],"white":["G12","L12","G9","F8","M8","L6","M6","E5","K4","L4","M4"],"line":["I8","I7","I12","I11","H13","G14","L9"],"depth":4},{"black":["H12","K12","I11","I10","K10","E8","F7","I7","F6"],"white":["F13","G11","J11","H10","E6","H6","I6","F5","G5"],"line":["I9","I8","I12","I13","J12","G12","L12"],"depth":4},{"black":["I13","D11","E11","H11","C9","E9","A8","H8"],"white":["D13","G12","A9","D8","I8","C7","I6","H5"],"line":["G11","F11","F10","H12","G9","D12","I7"],"depth":4},{"black":["G11","B10","F10","I10","G9","B8","C7","F7","F6","G4"],"white":["C10","G10","H10","F9","J9","E8","F5","H5","B4","J4"],"line":["D8","E9","E7","C9","D7","B7","G7"],"depth":4},{"black":["I14","G13","F12","D11","F11","H11","L11","F10","I10","I9","L8"],"white":["E15","H14","K14","D13","F13","I13","K13","J12","H10","J9","G8"],"line":["G11","E11","I11","J11","I8","I12","I7"],"depth":4},{"black":["D13","E11","F11","K10","H9","J9","F7","C6"],"white":["D14","G13","C12","J10","G9","I9","J8","G6"],"line":["G10","E12","I8","J7","L11","M12","H7"],"depth":4},{"black":["N11","K10","J9","J8","M8","O8","K7","O7","J4","N4","I3"],"white":["H11","H10","K9","H8","I8","N8","N7","G6","H3","J3","O3"],"line":["L6","M5","K5","M7","H2"],"depth":3},{"black":["B8","D7","I7","I6","E5","F5","I5","D4","D3","G2","I2"],"white":["B10","D9","D8","I8","C7","G7","F6","H5","C3","E3","H2"],"line":["D5","D6","C5","B5","G5"],"depth":3},{"black":["C7","F7","D6","E6","F6","I4","G3","H3","B1","H1"],"white":["G8","A7","A6","G6","H6","H5","D4","A3","E3","E2"],"line":["F4","E5","F5","F8","F3"],"depth":3},{"black":["H10","E9","G8","H8","F7","I7","H5","I5","H4"],"white":["E11","J11","G10","G9","I8","L8","K6","E3","I3"],"line":["H7","H6","G7","E7","J7"],"depth":3}]}};
var KEY='tb-pz-v1',LKEY='tb-learn-v1';
var Z={cur:'standard',stash:{kids:{},pro:{}}};
try{var z=JSON.parse(localStorage.getItem(KEY)||'null');if(z&&z.stash)Z=z;}catch(e){}
function zsave(){try{localStorage.setItem(KEY,JSON.stringify(Z));}catch(e){}}
function wantedPace(){try{var o=JSON.parse(localStorage.getItem(LKEY)||'null');return o&&(o.pace==='kids'||o.pace==='pro')?o.pace:'standard';}catch(e){return 'standard';}}
var ARR={chess:CHESS_PUZZLES,gomoku:GOMOKU_PUZZLES};
var PROG={chess:'chessPuzzles',gomoku:'gomokuPuzzles'};
var STD={chess:CHESS_PUZZLES.length,gomoku:GOMOKU_PUZZLES.length};

/* ---------- builders ---------- */
var LET='abcdefgh';
function chessMake(d,tier,i){
  var kids=tier==='kids',n=d.line.length;
  var line=d.san.length>1?'The line is '+d.san.map(function(s,k){return k%2===0?((k/2+1)+'. '+s):s;}).join(' ')+'.':'The line is 1. '+d.san[0]+'.';
  return {
    title:(kids?'Kids Mate ':'Master Mate ')+(i+1),difficulty:kids?'beginner':'advanced',tier:tier,type:'mate',
    intro:kids?'White to move and checkmate in 1. Find the move that attacks the king and leaves it no escape.':'White to move and force checkmate in 3. Black has a defence to every try except the right one. Be ready for a quiet move.',
    sequence:d.line.map(function(m){return {from:m.from,to:m.to};}),
    explanation:line,
    progressText:'Correct so far. Black has replied. Find the next move.',
    successText:'Checkmate! The king is attacked and has no escape. '+line.replace('The line is','The whole line was'),
    failText:kids?'That is not checkmate. Look for a move that attacks the king while every square next to it is covered or blocked. A wrong move starts the puzzle over.':'That does not force mate in 3. Look for the quiet move that takes squares away. A wrong move starts the puzzle over.',
    setup:function(){var b=emptyChessBoard();d.pieces.forEach(function(p){b[p.r][p.c]={t:p.t,c:p.c2};});return {board:b,turn:'w',rights:{wK:false,wQ:false,bK:false,bQ:false},ep:null};}
  };
}
function gomokuMake(d,tier,i){
  var kids=tier==='kids',n=d.depth;
  var mine=d.line.filter(function(x,k){return k%2===0;});
  var o={title:(kids?'Kids Five ':'Master Five ')+(i+1),difficulty:kids?'beginner':'advanced',tier:tier,checkType:'sequence',kind:kids?'five':'vcf',color:'black',goal:'five',movesToWin:n,
    stones:{black:d.black,white:d.white},line:d.line};
  if(kids){
    o.intro='Black to move. Make five in a row to win.';
    o.explanation='Move 1 ('+d.line[0]+'): five in a row. Black already had four stones in line, so one more finishes the game.';
    o.progressText='Correct so far.';
    o.successText='Five in a row. Black wins!';
    o.failText='That does not make five in a row. Look for the row of four stones and find the empty spot that completes it. A wrong move starts the puzzle over.';
  }else{
    o.intro='Black to move and win by force in '+n+' moves, counting the stone that makes five. White defends as well as possible, so the moves have to come in exactly the right order.';
    o.explanation='The winning order is '+mine.join(', ')+'. Every move before the finish is a four, so White must answer each one and never gets a free move.';
    o.progressText='Correct so far: White had to reply. Keep the pressure on and find the next move.';
    o.successText='Five in a row. Every move before the finish was a four, so White never had a free move to counter-attack.';
    o.failText='That is not the winning line. Black wins by force in '+n+' moves, but only with one exact order of threats. A wrong move starts the puzzle over.';
  }
  return gomokuMakePuzzle(o);
}
var EX={chess:{kids:DATA.chess.kids.map(function(d,i){return chessMake(d,'kids',i);}),pro:DATA.chess.pro.map(function(d,i){return chessMake(d,'pro',i);})},
        gomoku:{kids:DATA.gomoku.kids.map(function(d,i){return gomokuMake(d,'kids',i);}),pro:DATA.gomoku.pro.map(function(d,i){return gomokuMake(d,'pro',i);})}};
try{GOMOKU_HINT_TIER1.five='Look for a row of four stones with one empty spot that completes five in a row.';}catch(e){}

/* ---------- swap the extra puzzles in and out, keeping progress per pace ---------- */
function stashOut(pace){
  var S=Z.stash[pace]=Z.stash[pace]||{};
  Object.keys(PROG).forEach(function(g){
    var p=state.progress[PROG[g]]||[];
    S[g]=p.filter(function(x){return typeof x==='number'&&x>=STD[g];});
    state.progress[PROG[g]]=p.filter(function(x){return !(typeof x==='number'&&x>=STD[g]);});
  });
  var cr=state.gamify.creditedPuzzles||[],keep=[],mine=[];
  cr.forEach(function(k){var m=/^(chess|gomoku)-(\d+)$/.exec(k);(m&&+m[2]>=STD[m[1]]?mine:keep).push(k);});
  S.cred=mine;state.gamify.creditedPuzzles=keep;
}
function stashIn(pace){
  var S=Z.stash[pace]||{};
  Object.keys(PROG).forEach(function(g){
    var p=state.progress[PROG[g]]||[];(S[g]||[]).forEach(function(x){if(p.indexOf(x)<0)p.push(x);});state.progress[PROG[g]]=p;
  });
  var cr=state.gamify.creditedPuzzles||[];(S.cred||[]).forEach(function(k){if(cr.indexOf(k)<0)cr.push(k);});state.gamify.creditedPuzzles=cr;
}
function setArrays(pace){
  Object.keys(ARR).forEach(function(g){var a=ARR[g];a.length=STD[g];if(pace!=='standard')EX[g][pace].forEach(function(p){a.push(p);});});
}
function swapTo(pace){
  if(pace===Z.cur){setArrays(pace);return;}
  stashOut(Z.cur);setArrays(pace);stashIn(pace);Z.cur=pace;zsave();
  try{saveProgress();saveGamify();}catch(e){}
  try{state.puzzles.chessIndex=0;state.puzzles.chessAttempt=null;state.puzzles.gomokuIndex=0;state.puzzles.gomokuAttempt=null;}catch(e){}
}
window.pxPuzzlePace=function(pace){swapTo(pace);};
swapTo(wantedPace());

/* ---------- filters: Kids / Pro sets first, with a fallback for games without extra puzzles ---------- */
var _f=filteredPuzzleIndices;
filteredPuzzleIndices=function(arr,t){
  if(t==='kids'||t==='pro'){
    var o=[];arr.forEach(function(p,i){if(p.tier===t)o.push(i);});
    if(o.length)return o;
    return _f(arr,t==='kids'?'beginner':'advanced');
  }
  return _f(arr,t);
};
var _rd=renderDifficultyFilter;
renderDifficultyFilter=function(){
  var s=_rd(),cur=state.puzzles.difficultyFilter||'all';
  if(Z.cur==='standard')return s;
  var chip='<button class="diff-btn'+(cur===Z.cur?' active':'')+'" data-action="puzzles-set-difficulty" data-diff="'+Z.cur+'"><span aria-hidden="true">'+(Z.cur==='kids'?'🧒':'🎓')+'</span> <span>'+(Z.cur==='kids'?'Kids set':'Pro set')+'</span></button>';
  return s.replace('<div class="puzzle-diff-filter">','<div class="puzzle-diff-filter">'+chip);
};
})();
