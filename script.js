/*
 * Main JavaScript for the Telegram Chess mini‑app.  It sets up the
 * Telegram WebApp environment, constructs a responsive chessboard, handles
 * user interaction, implements a basic minimax AI with configurable
 * difficulty, and updates UI status messages.  The chess.js library
 * (loaded separately) manages the board state and legal move generation.
 */

// Unicode symbols for chess pieces.  Lowercase keys represent black
// pieces and uppercase keys represent white pieces.  The symbols are
// chosen for good readability on most devices.
const unicodePieces = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔'
};

// Embedded copy of the chess.js library (v0.10.3) in UMD format.  We embed the
// minified source directly to avoid external network dependencies.  The
// code is stored as a raw string literal so that escape sequences like
// backslashes and newline characters are preserved exactly.  At runtime,
// we evaluate this string to populate the Chess constructor on the
// `exports` object (see loadChessLibrary below).
const CHESS_JS_CODE = String.raw`
var Chess=function(r){var u="b",s="w",l=-
1,_="p",A="n",S="b",m="r",y="q",p="k",t="pnbrqkPNBRQK",e="rnbqkbnr/pppppppp/8/8/
8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",g=["1-0","0-1","1/2-
1/2","*"],C={b:[16,32,17,15],w:[-16,-32,-17,-15]},T={n:[-18,-33,-31,-14,18,33,31,14],b:[-17,-15,17,15],r:[-16,1,16,-1],q:[-17,-16,-15,1,17,16,15,-
1],k:[-17,-16,-15,1,17,16,15,-
1]},c=[20,0,0,0,0,0,0,24,0,0,0,0,0,0,20,0,0,20,0,0,0,0,0,24,0,0,0,0,0,20,0,0,0,0
,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,0,0,20,0,
0,24,0,0,20,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,0,2,53,56,53,2,
0,0,0,0,0,0,24,24,24,24,24,24,56,0,56,24,24,24,24,24,24,0,0,0,0,0,0,2,53,56,53,2
,0,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,20,0,0,24,0,0,20,0,0,0,0
,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,20,0,
0,0,0,0,24,0,0,0,0,0,20,0,0,20,0,0,0,0,0,0,24,0,0,0,0,0,0,20],v=[17,0,0,0,0,0,0,
16,0,0,0,0,0,0,15,0,0,17,0,0,0,0,0,16,0,0,0,0,0,15,0,0,0,0,17,0,0,0,0,16,0,0,0,0
,15,0,0,0,0,0,0,17,0,0,0,16,0,0,0,15,0,0,0,0,0,0,0,0,17,0,0,16,0,0,15,0,0,0,0,0,
0,0,0,0,0,17,0,16,0,15,0,0,0,0,0,0,0,0,0,0,0,0,17,16,15,0,0,0,0,0,0,0,1,1,1,1,1,
1,1,0,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,-15,-16,-17,0,0,0,0,0,0,0,0,0,0,0,0,-
15,0,-16,0,-17,0,0,0,0,0,0,0,0,0,0,-15,0,0,-16,0,0,-17,0,0,0,0,0,0,0,0,-
15,0,0,0,-16,0,0,0,-17,0,0,0,0,0,0,-15,0,0,0,0,-16,0,0,0,0,-17,0,0,0,0,-
15,0,0,0,0,0,-16,0,0,0,0,0,-17,0,0,-15,0,0,0,0,0,0,-16,0,0,0,0,0,0,-
17],h={p:0,n:1,b:2,r:3,q:4,k:5},o={NORMAL:"n",CAPTURE:"c",BIG_PAWN:"b",EP_CAPTUR
E:"e",PROMOTION:"p",KSIDE_CASTLE:"k",QSIDE_CASTLE:"q"},I={NORMAL:1,CAPTURE:2,BIG
_PAWN:4,EP_CAPTURE:8,PROMOTION:16,KSIDE_CASTLE:32,QSIDE_CASTLE:64},P=7,w=6,L=1,R
=0,N={a8:0,b8:1,c8:2,d8:3,e8:4,f8:5,g8:6,h8:7,a7:16,b7:17,c7:18,d7:19,e7:20,f7:2
1,g7:22,h7:23,a6:32,b6:33,c6:34,d6:35,e6:36,f6:37,g6:38,h6:39,a5:48,b5:49,c5:50,
d5:51,e5:52,f5:53,g5:54,h5:55,a4:64,b4:65,c4:66,d4:67,e4:68,f4:69,g4:70,h4:71,a3
:80,b3:81,c3:82,d3:83,e3:84,f3:85,g3:86,h3:87,a2:96,b2:97,c2:98,d2:99,e2:100,f2:
101,g2:102,h2:103,a1:112,b1:113,c1:114,d1:115,e1:116,f1:117,g1:118,h1:119},E={w:
[{square:N.a1,flag:I.QSIDE_CASTLE},{square:N.h1,flag:I.KSIDE_CASTLE}],b:[{square
:N.a8,flag:I.QSIDE_CASTLE},{square:N.h8,flag:I.KSIDE_CASTLE}]},O=new 
Array(128),k={w:l,b:l},q=s,D={w:0,b:0},K=l,d=0,b=1,Q=[],U={};function x(r){void 
0===r&&(r=!1),O=new Array(128),k={w:l,b:l},q=s,D={w:0,b:0},K=l,d=0,b=1,Q=[],r||(
U={}),F(M())}function j(){B(e)}function B(r,e){void 0===e&&(e=!1);var 
n=r.split(/\s+/),t=n[0],o=0;if(!$(r).valid)return!1;x(e);for(var 
i=0;i<t.length;i++){var f=t.charAt(i);if("/"===f)o+=8;else 
if(-1!=="0123456789".indexOf(f))o+=parseInt(f,10);else{var 
a=f<"a"?s:u;W({type:f.toLowerCase(),color:a},fr(o)),o++}}return q=n[1],-
1<n[2].indexOf("K")&&(D.w|=I.KSIDE_CASTLE),-
1<n[2].indexOf("Q")&&(D.w|=I.QSIDE_CASTLE),-
1<n[2].indexOf("k")&&(D.b|=I.KSIDE_CASTLE),-
1<n[2].indexOf("q")&&(D.b|=I.QSIDE_CASTLE),K="-
"===n[3]?l:N[n[3]],d=parseInt(n[4],10),b=parseInt(n[5],10),F(M()),!0}function 
$(r){var e="No errors.",n="FEN string must contain six space-delimited 
fields.",t="6th field (move number) must be a positive integer.",o="5th field 
(half move counter) must be a non-negative integer.",i="4th field (en-passant 
square) is invalid.",f="3rd field (castling availability) is invalid.",a="2nd 
field (side to move) is invalid.",l="1st field (piece positions) does not 
contain 8 '/'-delimited rows.",u="1st field (piece positions) is invalid 
[consecutive numbers].",s="1st field (piece positions) is invalid [invalid 
piece].",p="1st field (piece positions) is invalid [row too large].",c="Illegal 
en-passant square",v=r.split(/\s+/);if(6!==v.length)return{valid:!1,error_number
:1,error:n};if(isNaN(v[5])||parseInt(v[5],10)<=0)return{valid:!1,error_number:2,
error:t};if(isNaN(v[4])||parseInt(v[4],10)<0)return{valid:!1,error_number:3,erro
r:o};if(!/^(\-
|[abcdefgh][36])$/.test(v[3]))return{valid:!1,error_number:4,error:i};if(!/^(KQ?
k?q?|Qk?q?|kq?|q|-
)$.test(v[2]))return{valid:!1,error_number:5,error:f};if(!/^(w|b)$/.test(v[1]))
return{valid:!1,error_number:6,error:a};var g=v[0].split("/");if(8!==g.length)re
turn{valid:!1,error_number:7,error:l};for(var h=0;h<g.length;h++){for(var E=0,d=
!1,b=0;b<g[h].length;b++)if(isNaN(g[h][b])){if(!/^[prnbqkPRNBQK]$/.test(g[h][b])
 )return{valid:!1,error_number:9,error:s};E+=1,d=!1}else{if(d)return{valid:!1,err
or_number:8,error:u};E+=parseInt(g[h][b],10),d=!0}if(8!==E)return{valid:!1,error
_number:10,error:p}}return"3"==v[3][1]&&"w"==v[1]||"6"==v[3][1]&&"b"==v[1]?{vali
d:!1,error_number:11,error:c}:{valid:!0,error_number:0,error:e}}function 
M(){for(var 
r=0,e="",n=N.a8;n<=N.h1;n++){if(null==O[n])r++;else{0<r&&(e+=r,r=0);var t=O[n].c
olor,o=O[n].type;e+=t===s?o.toUpperCase():o.toLowerCase()}n+1&136&&(0<r&&(e+=r),
n!==N.h1&&(e+="/"),r=0,n+=8)}var i="";D[s]&I.KSIDE_CASTLE&&(i+="K"),D[s]&I.QSIDE
_CASTLE&&(i+="Q"),D[u]&I.KSIDE_CASTLE&&(i+="k"),D[u]&I.QSIDE_CASTLE&&(i+="q"),i=
i||"-";var f=K===l?"-":fr(K);return[e,q,i,f,d,b].join(" ")}function G(r){for(var 
 e=0;e<r.length;e+=2)"string"==typeof r[e]&&"string"==typeof 
r[e+1]&&(U[r[e]]=r[e+1]);return U}function 
F(r){0<Q.length||(r!==e?(U.SetUp="1",U.FEN=r):(delete U.SetUp,delete 
U.FEN))}function i(r){var e=O[N[r]];return 
e?{type:e.type,color:e.color}:null}function W(r,e){if(!("type"in r&&"color"in 
r))return!1;if(-1===t.indexOf(r.type.toLowerCase()))return!1;if(!(e in 
N))return!1;var n=N[e];return(r.type!=p||k[r.color]==l||k[r.color]==n)&&(O[n]={t
ype:r.type,color:r.color},r.type===p&&(k[r.color]=n),F(M()),!0)}function 
H(r,e,n,t,o){var i={color:q,from:e,to:n,flags:t,piece:r[e].type};return o&&(i.fl
ags|=I.PROMOTION,i.promotion=o),r[n]?i.captured=r[n].type:t&I.EP_CAPTURE&&(i.cap
tured=_),i}function Z(r){function 
e(r,e,n,t,o){if(r[n].type!==_||or(t)!==R&&or(t)!==P)e.push(H(r,n,t,o));else 
for(var i=[y,m,S,A],f=0,a=i.length;f<a;f++)e.push(H(r,n,t,o,i[f]))}var 
n=[],t=q,o=ar(t),i={b:L,w:w},f=N.a8,a=N.h1,l=!1,u=!(void 0!==r&&"legal"in 
r)||r.legal;if(void 0!==r&&"square"in r){if(!(r.square in 
N))return[];f=a=N[r.square],l=!0}for(var s=f;s<=a;s++)if(136&s)s+=7;else{var 
p=O[s];if(null!=p&&p.color===t)if(p.type===_){var c=s+C[t][0];if(null==O[c]){e(O
,n,s,c,I.NORMAL);c=s+C[t][1];i[t]===or(s)&&null==O[c]&&e(O,n,s,c,I.BIG_PAWN)}for
(v=2;v<4;v++){136&(c=s+C[t][v])||(null!=O[c]&&O[c].color===o?e(O,n,s,c,I.CAPTURE
):c===K&&e(O,n,s,K,I.EP_CAPTURE))}}else for(var 
v=0,g=T[p.type].length;v<g;v++){var h=T[p.type][v];for(c=s;!(136&(c+=h));){if(nu
ll!=O[c]){if(O[c].color===t)break;e(O,n,s,c,I.CAPTURE);break}if(e(O,n,s,c,I.NORM
AL),"n"===p.type||"k"===p.type)break}}}if(!l||a===k[t]){if(D[t]&I.KSIDE_CASTLE){
var E=(d=k[t])+2;null!=O[d+1]||null!=O[E]||V(o,k[t])||V(o,d+1)||V(o,E)||e(O,n,k[
t],E,I.KSIDE_CASTLE)}if(D[t]&I.QSIDE_CASTLE){var d;E=(d=k[t])-2;null!=O[d-
1]||null!=O[d-2]||null!=O[d-3]||V(o,k[t])||V(o,d-
1)||V(o,E)||e(O,n,k[t],E,I.QSIDE_CASTLE)}}if(!u)return n;var 
b=[];for(s=0,g=n.length;s<g;s++)er(n[s]),X(t)||b.push(n[s]),nr();return 
b}function z(r,e){var n="";if(r.flags&I.KSIDE_CASTLE)n="O-O";else 
if(r.flags&I.QSIDE_CASTLE)n="O-O-O";else{var t=function(r,e){for(var n=Z({legal:
!e}),t=r.from,o=r.to,i=r.piece,f=0,a=0,l=0,u=0,s=n.length;u<s;u++){var p=n[u].fr
om,c=n[u].to,v=n[u].piece;i===v&&t!==p&&o===c&&(f++,or(t)===or(p)&&a++,ir(t)===i
r(p)&&l++)}if(0<f)return 0<a&&0<l?fr(t):0<l?fr(t).charAt(1):fr(t).charAt(0);retu
rn""}(r,e);r.piece!==_&&(n+=r.piece.toUpperCase()+t),r.flags&(I.CAPTURE|I.EP_CAP
TURE)&&(r.piece===_&&(n+=fr(r.from)[0]),n+="x"),n+=fr(r.to),r.flags&I.PROMOTION&
&(n+="="+r.promotion.toUpperCase())}return 
er(r),f()&&(a()?n+="#":n+="+"),nr(),n}function J(r){return 
r.replace(/=/," ").replace(/[+#]?[?!]*$/," ")}function V(r,e){for(var 
n=N.a8;n<=N.h1;n++)if(136&n)n+=7;else if(null!=O[n]&&O[n].color===r){var t=O[n],
o=n-
e,i=119+o;if(c[i]&1<<h[t.type]){if(t.type===_){if(0<o){if(t.color===s)return!0}e
lse 
if(t.color===u)return!0;continue}if("n"===t.type||"k"===t.type)return!0;for(var 
f=v[i],a=n+f,l=!1;a!==e;){if(null!=O[a]){l=!0;break}a+=f}if(!l)return!0}}return!
1}function X(r){return V(ar(r),k[r])}function f(){return X(q)}function 
a(){return f()&&0===Z().length}function n(){return!f()&&0===Z().length}function 
Y(){for(var 
r={},e=[],n=0,t=0,o=N.a8;o<=N.h1;o++)if(t=(t+1)%2,136&o)o+=7;else{var 
i=O[o];i&&(r[i.type]=i.type in r?r[i.type]+1:1,i.type===S&&e.push(t),n++)}if(2==
=n)return!0;if(3===n&&(1===r[S]||1===r[A]))return!0;if(n===r[S]+2){var f=0,a=e.l
ength;for(o=0;o<a;o++)f+=e[o];if(0===f||f===a)return!0}return!1}function 
rr(){for(var r=[],e={},n=!1;;){var t=nr();if(!t)break;r.push(t)}for(;;){var 
o=M().split(" ").slice(0,4).join(" ");if(e[o]=o in 
e?e[o]+1:1,3<=e[o]&&(n=!0),!r.length)break;er(r.pop())}return n}function 
er(r){var e,n=q,t=ar(n);if(e=r,Q.push({move:e,kings:{b:k.b,w:k.w},turn:q,castlin
g:{b:D.b,w:D.w},ep_square:K,half_moves:d,move_number:b}),O[r.to]=O[r.from],O[r.f
rom]=null,r.flags&I.EP_CAPTURE&&(q===u?O[r.to-
16]=null:O[r.to+16]=null),r.flags&I.PROMOTION&&(O[r.to]={type:r.promotion,color:
n}),O[r.to].type===p){if(k[O[r.to].color]=r.to,r.flags&I.KSIDE_CASTLE){var 
o=r.to-1,i=r.to+1;O[o]=O[i],O[i]=null}else if(r.flags&I.QSIDE_CASTLE){o=r.to+1,i
=r.to-2;O[o]=O[i],O[i]=null}D[n]=""}if(D[n])for(var f=0,a=E[n].length;f<a;f++)if
 (r.from===E[n][f].square&&D[n]&E[n][f].flag){D[n]^=E[n][f].flag;break}if(D[t])fo
r(f=0,a=E[t].length;f<a;f++)if(r.to===E[t][f].square&&D[t]&E[t][f].flag){D[t]^=E
[t][f].flag;break}K=r.flags&I.BIG_PAWN?"b"===q?r.to-
16:r.to+16:l,r.piece===_||r.flags&(I.CAPTURE|I.EP_CAPTURE)?d=0:d++,q===u&&b++,q=
ar(q)}function nr(){var r=Q.pop();if(null==r)return null;var e=r.move;k=r.kings,
q=r.turn,D=r.castling,K=r.ep_square,d=r.half_moves,b=r.move_number;var n,t,o=q,i
=ar(q);if(O[e.from]=O[e.to],O[e.from].type=e.piece,O[e.to]=null,e.flags&I.CAPTUR
E)O[e.to]={type:e.captured,color:i};else if(e.flags&I.EP_CAPTURE){var f;f=o===u?
e.to-
16:e.to+16,O[f]={type:_,color:i}}e.flags&(I.KSIDE_CASTLE|I.QSIDE_CASTLE)&&(e.fla
gs&I.KSIDE_CASTLE?(n=e.to+1,t=e.to-1):e.flags&I.QSIDE_CASTLE&&(n=e.to-
2,t=e.to+1),O[n]=O[t],O[t]=null);return e}function tr(r,e){var n=J(r);if(e){var 
t=n.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/);if(t)var
 o=t[1],i=t[2],f=t[3],a=t[4]}for(var 
l=Z(),u=0,s=l.length;u<s;u++){if(n===J(z(l[u]))||e&&n===J(z(l[u],!0)))return l[u
];if(t&&(!o||o.toLowerCase()==l[u].piece)&&N[i]==l[u].from&&N[f]==l[u].to&&(!a||
a.toLowerCase()==l[u].promotion))return l[u]}return null}function or(r){return 
r>>4}function ir(r){return 15&r}function fr(r){var e=ir(r),n=or(r);return"abcdef
gh".substring(e,e+1)+"87654321".substring(n,n+1)}function ar(r){return 
r===s?u:s}function lr(r){var e=function r(e){var n=e instanceof 
Array?[]:{};for(var t in e)n[t]="object"==typeof t?r(e[t]):e[t];return 
n}(r);e.san=z(e,!1),e.to=fr(e.to),e.from=fr(e.from);var n="";for(var t in 
I)I[t]&e.flags&&(n+=o[t]);return e.flags=n,e}function ur(r){return 
r.replace(/^\s+|\s+$/g,"")}return B(void 0===r?e:r),{WHITE:s,BLACK:u,PAWN:_,KNIG
HT:A,BISHOP:S,ROOK:m,QUEEN:y,KING:p,SQUARES:function(){for(var 
r=[],e=N.a8;e<=N.h1;e++)136&e?e+=7:r.push(fr(e));return 
r}(),FLAGS:o,load:function(r){return B(r)},reset:function(){return 
j()},moves:function(r){for(var e=Z(r),n=[],t=0,o=e.length;t<o;t++)void 
0!==r&&"verbose"in r&&r.verbose?n.push(lr(e[t])):n.push(z(e[t],!1));return 
n},in_check:function(){return f()},in_checkmate:function(){return 
a()},in_stalemate:function(){return n()},in_draw:function(){return 
100<=d||n()||Y()||rr()},insufficient_material:function(){return 
Y()},in_threefold_repetition:function(){return rr()},game_over:function(){return
 100<=d||a()||n()||Y()||rr()},validate_fen:function(r){return 
$(r)},fen:function(){return M()},board:function(){for(var r=[],e=[],n=N.a8;n<=N.
h1;n++)null==O[n]?e.push(null):e.push({type:O[n].type,color:O[n].color}),n+1&136
&&(r.push(e),e=[],n+=8);return r},pgn:function(r){var e="object"==typeof 
r&&"string"==typeof r.newline_char?r.newline_char:"\n",n="object"==typeof 
r&&"number"==typeof r.max_width?r.max_width:0,t=[],o=!1;for(var i in 
U)t.push("["+i+' "'+U[i]+'"]'+e),o=!0;o&&Q.length&&t.push(e);for(var 
f=[];0<Q.length;)f.push(nr());for(var a=[],l="";0<f.length;){var u=f.pop();Q.len
gth||"b"!==u.color?"w"===u.color&&(l.length&&a.push(l),l=b+"."):l=b+". 
...",l=l+" "+z(u,!1),er(u)}if(l.length&&a.push(l),void 
0!==U.Result&&a.push(U.Result),0===n)return t.join("")+a.join(" ");var 
s=0;for(i=0;i<a.length;i++)s+a[i].length>n&&0!==i?(" "+=t[t.length-1]&&t.pop(),t.push(e),s=0):0!==i&&(t.push(" "),s++),t.push(a[i]),s+=a[i].length;return 
t.join("")},load_pgn:function(r,e){var n=void 0!==e&&"sloppy"in 
e&&e.sloppy;function l(r){return r.replace(/\\/g,"\\")}var t="object"==typeof 
e&&"string"==typeof e.newline_char?e.newline_char:"\r?\n",o=new RegExp("^(\\[((?
:+l(t)+")|.)*\\])(?:"+l(t)+"){2}"),i=o.test(r)?o.exec(r)[1]:"";j();var 
f=function(r,e){for(var n="object"==typeof e&&"string"==typeof 
e.newline_char?e.newline_char:"\r?\n",t={},o=r.split(new RegExp(l(n))),i="",f=""
,a=0;a<o.length;a++)i=o[a].replace(/^\[([A-Z][A-Za-
z]*)\s.*\]$/,"$1"),f=o[a].replace(/^\[[A-Za-
z]+\s"(.*)"\]$/,"$1"),0<ur(i).length&&(t[i]=f);return t}(i,e);for(var a in 
f)G([a,f[a]]);if("1"===f.SetUp&&!("FEN"in f&&B(f.FEN,!0)))return!1;var 
u=r.replace(i,"").replace(new RegExp(l(t),"g")," 
");u=u.replace(/(\{[^}]+\})+?/g,"");for(var 
s=/(\([^\(\)]+\))+?/g;s.test(u);)u=u.replace(s,"");var p=ur(u=(u=(u=u.replace/\
d+\.(\.\.)?/g,"")).replace(/\.\.\./g,"")).replace(/\$\d+/g,"")).split(new 
RegExp(/\s+/));p=p.join(",").replace(/,,+/g,",").split(",");for(var c="",v=0;v<p
.length-1;v++){if(null==(c=tr(p[v],n)))return!1;er(c)}if(c=p[p.length-1],-
1<g.indexOf(c))!function(r){for(var e in r)return 1}(U)||void 0!==U.Result||G(["
Result",c]);else{if(null==(c=tr(c,n)))return!1;er(c)}return!0},header:function()
{return G(arguments)},ascii:function(){return function(){for(var r="   
+------------------------+\n",e=N.a8;e<=N.h1;e++){if(0===ir(e)&&(r+=" 
"+"87654321"[or(e)]+" |"),null==O[e])r+=" . ";else{var n=O[e].type;r+=" 
"+(O[e].color===s?n.toUpperCase():n.toLowerCase())+" ";}e+1&136&&(r+="|\n",e+=8)}
return r+="   +------------------------+\n",r+="     
a  b  c  d  e  f  g  h\n"}()},turn:function(){return q},move:function(r,e){var 
n=void 0!==e&&"sloppy"in e&&e.sloppy,t=null;if("string"==typeof r)t=tr(r,n);else
 if("object"==typeof r)for(var o=Z(),i=0,f=o.length;i<f;i++)if(!(r.from!==fr(o[i
].from)||r.to!==fr(o[i].to)||"promotion"in 
o[i]&&r.promotion!==o[i].promotion)){t=o[i];break}if(!t)return null;var 
a=lr(t);return er(t),a},undo:function(){var r=nr();return 
r?lr(r):null},clear:function(){return x()},put:function(r,e){return 
W(r,e)},get:function(r){return i(r)},remove:function(r){return 
n=i(e=r),O[N[e]]=null,n&&n.type===p&&(k[n.color]=l),F(M()),n;var 
e,n},perft:function(r){return function r(e){for(var n=Z({legal:!1}),t=0,o=q,i=0,
f=n.length;i<f;i++)er(n[i]),X(o)||(0<e-1?t+=r(e-1):t++),nr();return 
t}(r)},square_color:function(r){if(r in N){var 
e=N[r];return(or(e)+ir(e))%2==0?"light":"dark"}return 
null},history:function(r){for(var e=[],n=[],t=(void 0!==r&&"verbose"in 
r&&r.verbose);0<Q.length;)e.push(nr());for(;0<e.length;){var 
o=e.pop();t?n.push(lr(o)):n.push(z(o)),er(o)}return n}}};"undefined"!=typeof 
exports&&(exports.Chess=Chess),"undefined"!=typeof 
define&&define(function(){return Chess});
`;

/*
 * Lightweight fallback chess engine for offline use.  This engine supports
 * the essential rules of chess needed for this mini‑app: piece movement,
 * captures, basic promotion, undo, and check detection.  Castling,
 * en‑passant, half‑move clocks, and threefold repetition are not
 * implemented.  Promotions always result in a queen.  The engine
 * represents the board as an 8x8 array and tracks whose turn it is.
 */
class SimpleChess {
  constructor() {
    this.reset();
  }

  /*
   * Reset the game to the standard starting position.  The board is a 2D
   * array indexed by [row][col] where row 0 corresponds to rank 8 and
   * col 0 corresponds to file 'a'.  Uppercase letters represent white
   * pieces and lowercase letters represent black pieces.  Empty squares
   * are null.
   */
  reset() {
    this.board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
    ];
    this.turnColor = 'w';
    this._history = [];
  }

  /*
   * Parse a FEN string and load it into the engine.  Only the piece
   * placement and side to move fields are honoured; castling rights,
   * en‑passant, and counters are ignored.  Returns true on success.
   */
  load(fen) {
    try {
      const parts = fen.trim().split(/\s+/);
      const placement = parts[0];
      const turn = parts[1] || 'w';
      const rows = placement.split('/');
      if (rows.length !== 8) return false;
      const board = [];
      for (let r = 0; r < 8; r++) {
        const row = [];
        let col = 0;
        for (const ch of rows[r]) {
          if (col > 7) break;
          if (ch >= '1' && ch <= '8') {
            const empty = parseInt(ch, 10);
            for (let i = 0; i < empty; i++) {
              row.push(null);
              col++;
            }
          } else {
            row.push(ch);
            col++;
          }
        }
        // fill missing squares with null
        while (row.length < 8) row.push(null);
        board.push(row);
      }
      this.board = board;
      this.turnColor = turn === 'b' ? 'b' : 'w';
      this._history = [];
      return true;
    } catch (e) {
      return false;
    }
  }

  /*
   * Return which side is to move ('w' or 'b').
   */
  turn() {
    return this.turnColor;
  }

  /*
   * Convert a board coordinate (row,col) to algebraic notation (e.g. 0,0
   * => 'a8').  Row 0 corresponds to rank 8, col 0 to file 'a'.
   */
  _coordsToSquare(r, c) {
    return String.fromCharCode(97 + c) + String(8 - r);
  }

  /*
   * Convert an algebraic square (e.g. 'e4') to board coordinates
   * [row,col].  Returns null if the input is invalid.
   */
  _squareToCoords(square) {
    if (!square || square.length !== 2) return null;
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1], 10);
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return [rank, file];
  }

  /*
   * Determine if the given coordinates are inside the board.
   */
  _inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  /*
   * Generate pseudo‑legal moves for a single piece at (r,c).  Moves that
   * leave the moving side in check are filtered out later.  Returns an
   * array of move objects: { from: 'e2', to: 'e4', piece: 'p', captured: 'N'?,
   * promotion: 'q'? }.
   */
  _generatePieceMoves(r, c) {
    const board = this.board;
    const piece = board[r][c];
    if (!piece) return [];
    const moves = [];
    const isWhite = piece === piece.toUpperCase();
    const color = isWhite ? 'w' : 'b';
    if (color !== this.turnColor) return [];
    const directions = {
      n: [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ],
      b: [ [-1, -1], [-1, 1], [1, -1], [1, 1] ],
      r: [ [-1, 0], [1, 0], [0, -1], [0, 1] ],
      q: [ [-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1] ],
      k: [ [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1] ],
    };
    const fromSquare = this._coordsToSquare(r, c);
    const lower = piece.toLowerCase();
    // Pawn moves
    if (lower === 'p') {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
      // One square forward
      const r1 = r + dir;
      if (this._inBounds(r1, c) && !board[r1][c]) {
        // Promotion?
        const toSq = this._coordsToSquare(r1, c);
        if (r1 === 0 || r1 === 7) {
          moves.push({ from: fromSquare, to: toSq, piece: piece.toLowerCase(), promotion: isWhite ? 'q' : 'q' });
        } else {
          moves.push({ from: fromSquare, to: toSq, piece: piece.toLowerCase() });
        }
        // Two squares forward
        const r2 = r + 2 * dir;
        if (r === startRow && !board[r2][c]) {
          const toSq2 = this._coordsToSquare(r2, c);
          moves.push({ from: fromSquare, to: toSq2, piece: piece.toLowerCase() });
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const rr = r + dir;
        const cc = c + dc;
        if (this._inBounds(rr, cc) && board[rr][cc]) {
          const target = board[rr][cc];
          const targetIsWhite = target === target.toUpperCase();
          if (targetIsWhite !== isWhite) {
            const toSq = this._coordsToSquare(rr, cc);
            if (rr === 0 || rr === 7) {
              moves.push({ from: fromSquare, to: toSq, piece: piece.toLowerCase(), captured: target.toLowerCase(), promotion: isWhite ? 'q' : 'q' });
            } else {
              moves.push({ from: fromSquare, to: toSq, piece: piece.toLowerCase(), captured: target.toLowerCase() });
            }
          }
        }
      }
      return moves;
    }
    // Knight moves
    if (lower === 'n') {
      for (const [dr, dc] of directions.n) {
        const rr = r + dr;
        const cc = c + dc;
        if (!this._inBounds(rr, cc)) continue;
        const target = board[rr][cc];
        if (target) {
          const targetIsWhite = target === target.toUpperCase();
          if (targetIsWhite !== isWhite) {
            moves.push({ from: fromSquare, to: this._coordsToSquare(rr, cc), piece: piece.toLowerCase(), captured: target.toLowerCase() });
          }
        } else {
          moves.push({ from: fromSquare, to: this._coordsToSquare(rr, cc), piece: piece.toLowerCase() });
        }
      }
      return moves;
    }
    // Sliding pieces (bishop, rook, queen)
    if (lower === 'b' || lower === 'r' || lower === 'q') {
      const dirs = directions[lower];
      for (const [dr, dc] of dirs) {
        let rr = r + dr;
        let cc = c + dc;
        while (this._inBounds(rr, cc)) {
          const target = board[rr][cc];
          if (target) {
            const targetIsWhite = target === target.toUpperCase();
            if (targetIsWhite !== isWhite) {
              moves.push({ from: fromSquare, to: this._coordsToSquare(rr, cc), piece: piece.toLowerCase(), captured: target.toLowerCase() });
            }
            break;
          } else {
            moves.push({ from: fromSquare, to: this._coordsToSquare(rr, cc), piece: piece.toLowerCase() });
          }
          rr += dr;
          cc += dc;
        }
      }
      return moves;
    }
    // King moves (no castling)
    if (lower === 'k') {
      for (const [dr, dc] of directions.k) {
        const rr = r + dr;
        const cc = c + dc;
        if (!this._inBounds(rr, cc)) continue;
        const target = board[rr][cc];
        if (target) {
          const targetIsWhite = target === target.toUpperCase();
          if (targetIsWhite !== isWhite) {
            moves.push({ from: fromSquare, to: this._coordsToSquare(rr, cc), piece: piece.toLowerCase(), captured: target.toLowerCase() });
          }
        } else {
          moves.push({ from: fromSquare, to: this._coordsToSquare(rr, cc), piece: piece.toLowerCase() });
        }
      }
      return moves;
    }
    return moves;
  }

  /*
   * Determine whether the given side ('w' or 'b') is in check.  This is
   * done by locating the king and then scanning all opposing pieces to
   * see if any can capture the king on their next move.  En‑passant is
   * ignored.
   */
  _isInCheck(color) {
    // Find king position
    const isWhite = color === 'w';
    let kingRow = -1;
    let kingCol = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.toLowerCase() === 'k') {
          if (isWhite === (piece === piece.toUpperCase())) {
            kingRow = r;
            kingCol = c;
            break;
          }
        }
      }
      if (kingRow !== -1) break;
    }
    if (kingRow === -1) return false;
    // Check if any opposing piece attacks the king
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (!piece) continue;
        const pieceIsWhite = piece === piece.toUpperCase();
        if (pieceIsWhite === isWhite) continue;
        // Generate pseudo‑moves for opponent piece
        const savedTurn = this.turnColor;
        this.turnColor = pieceIsWhite ? 'w' : 'b';
        const moves = this._generatePieceMoves(r, c);
        this.turnColor = savedTurn;
        for (const mv of moves) {
          const coords = this._squareToCoords(mv.to);
          if (coords && coords[0] === kingRow && coords[1] === kingCol) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /*
   * Generate all legal moves for the current position.  If the optional
   * argument has a `square` property, only moves starting from that
   * square are returned.  If `verbose` is true, the full move objects
   * (with from, to, piece, captured, promotion) are returned; otherwise
   * SAN strings are returned (SAN support is minimal and returns LAN).
   */
  moves(opts = {}) {
    const verbose = opts.verbose || false;
    const square = opts.square || null;
    let moves = [];
    if (square) {
      const coords = this._squareToCoords(square);
      if (!coords) return [];
      moves = this._generatePieceMoves(coords[0], coords[1]);
    } else {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = this.board[r][c];
          if (!piece) continue;
          const isWhite = piece === piece.toUpperCase();
          const color = isWhite ? 'w' : 'b';
          if (color !== this.turnColor) continue;
          const pm = this._generatePieceMoves(r, c);
          moves.push(...pm);
        }
      }
    }
    // Filter out moves that leave king in check
    const legalMoves = [];
    for (const mv of moves) {
      this._makeMove(mv);
      const inCheck = this._isInCheck(this.turnColor === 'w' ? 'b' : 'w');
      // Undo the move using the public undo() method.  _undoMove() is
      // not defined in SimpleChess.
      this.undo();
      if (!inCheck) {
        if (verbose) {
          legalMoves.push(Object.assign({}, mv));
        } else {
          legalMoves.push(mv.from + mv.to + (mv.promotion || ''));
        }
      }
    }
    return legalMoves;
  }

  /*
   * Internal helper to make a move without legality checks.  Updates the
   * board, turn and history.  The move object should come from
   * _generatePieceMoves.  The history entry stores enough data to undo
   * the move.
   */
  _makeMove(mv) {
    const fromCoords = this._squareToCoords(mv.from);
    const toCoords = this._squareToCoords(mv.to);
    const r1 = fromCoords[0];
    const c1 = fromCoords[1];
    const r2 = toCoords[0];
    const c2 = toCoords[1];
    const piece = this.board[r1][c1];
    const captured = this.board[r2][c2];
    this._history.push({ mv, captured, turn: this.turnColor });
    // Move the piece
    this.board[r2][c2] = piece;
    this.board[r1][c1] = null;
    // Promotion
    if (mv.promotion) {
      // Promotion piece should reflect the color of the moving piece
      const promo = mv.promotion;
      this.board[r2][c2] = piece === piece.toUpperCase() ? promo.toUpperCase() : promo.toLowerCase();
    }
    // Switch turn
    this.turnColor = this.turnColor === 'w' ? 'b' : 'w';
  }

  /*
   * Public method to make a move.  Accepts a verbose move object or SAN
   * string.  Returns the move object on success or null if the move is
   * illegal.  Only verbose moves are supported in this mini‑app.
   */
  move(mv) {
    // Accept LAN strings for compatibility
    if (typeof mv === 'string') {
      // parse LAN: e2e4 or e7e8q
      const from = mv.substring(0, 2);
      const to = mv.substring(2, 4);
      const promotion = mv.length > 4 ? mv.substring(4).toLowerCase() : undefined;
      mv = { from, to };
      if (promotion) mv.promotion = promotion;
    }
    const legalMoves = this.moves({ verbose: true });
    for (const lm of legalMoves) {
      if (lm.from === mv.from && lm.to === mv.to) {
        // Promotion must match if provided
        if (mv.promotion && mv.promotion !== lm.promotion) continue;
        this._makeMove(lm);
        return lm;
      }
    }
    return null;
  }

  /*
   * Undo the last move.  Restores the board and turn.  Returns the move
   * that was undone or null if no moves in history.
   */
  undo() {
    const entry = this._history.pop();
    if (!entry) return null;
    const mv = entry.mv;
    const fromCoords = this._squareToCoords(mv.from);
    const toCoords = this._squareToCoords(mv.to);
    const r1 = fromCoords[0];
    const c1 = fromCoords[1];
    const r2 = toCoords[0];
    const c2 = toCoords[1];
    const piece = this.board[r2][c2];
    // Revert promotion
    let restorePiece = piece;
    if (mv.promotion) {
      // Original piece was a pawn
      restorePiece = piece === piece.toUpperCase() ? 'P' : 'p';
    }
    this.board[r1][c1] = restorePiece;
    this.board[r2][c2] = entry.captured || null;
    // Restore turn
    this.turnColor = entry.turn;
    return mv;
  }

  /*
   * Determine whether the current side to move is in check.  Useful
   * externally via in_check().
   */
  _currentInCheck() {
    return this._isInCheck(this.turnColor);
  }

  in_check() {
    return this._currentInCheck();
  }

  in_checkmate() {
    if (!this._currentInCheck()) return false;
    return this.moves().length === 0;
  }

  in_stalemate() {
    if (this._currentInCheck()) return false;
    return this.moves().length === 0;
  }

  in_draw() {
    // Simple draw detection: stalemate only
    return this.in_stalemate();
  }

  game_over() {
    return this.in_checkmate() || this.in_stalemate();
  }

  /*
   * Return a copy of the board in array form.  Each element is either
   * null or { type: 'p', color: 'w' | 'b' }.  Useful for rendering
   * externally.  Named differently from the internal `board` property
   * to avoid overriding the array stored on this.board.
   */
  boardState() {
    const out = [];
    for (const row of this.board) {
      const outRow = [];
      for (const cell of row) {
        if (!cell) {
          outRow.push(null);
        } else {
          outRow.push({ type: cell.toLowerCase(), color: cell === cell.toUpperCase() ? 'w' : 'b' });
        }
      }
      out.push(outRow);
    }
    return out;
  }

  /*
   * Return the move history.  When `verbose` is true the returned array
   * contains the verbose move objects that were applied; otherwise LAN
   * strings are returned.  This mimics the API of chess.js sufficiently
   * for highlighting the last move.
   */
  history(opts = {}) {
    const verbose = opts && opts.verbose;
    if (verbose) {
      return this._history.map(entry => Object.assign({}, entry.mv));
    }
    return this._history.map(entry => entry.mv.from + entry.mv.to + (entry.mv.promotion || ''));
  }

  /*
   * Retrieve the piece at the given square.  Returns an object with
   * properties { type: 'p', color: 'w' } or null if empty.  This
   * mirrors the API of chess.js used by the renderer.
   */
  get(square) {
    const coords = this._squareToCoords(square);
    if (!coords) return null;
    const piece = this.board[coords[0]][coords[1]];
    if (!piece) return null;
    return { type: piece.toLowerCase(), color: piece === piece.toUpperCase() ? 'w' : 'b' };
  }

  /*
   * Generate a simple FEN string for the current position.  Castling
   * rights and en‑passant squares are omitted (shown as '-'), and the
   * halfmove/fullmove counters are set to 0 and 1 respectively.  This
   * is sufficient for evaluation purposes in this mini‑app.
   */
  fen() {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        if (!cell) {
          empty++;
        } else {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += cell;
        }
      }
      if (empty > 0) fen += empty;
      if (r < 7) fen += '/';
    }
    fen += ' ' + (this.turnColor === 'w' ? 'w' : 'b') + ' - - 0 1';
    return fen;
  }
}

// Chess.js constructor will be loaded dynamically.  We declare a
// variable to hold the Chess class once loaded.  Until it's
// assigned, calls to new Chess() will throw an error.
let Chess;
let game; // current chess.js instance

/*
 * Dynamically load the chess.js library.  The minified UMD build of
 * chess.js (v0.10.3) does not attach a global `Chess` variable on its
 * own, but it does assign `exports.Chess` if an `exports` object is
 * defined.  To capture the constructor, we define `window.exports`
 * before inserting the script tag.  Once loaded, we resolve the
 * promise with the exported Chess constructor.  If the library
 * fails to load (e.g. due to network issues), the promise rejects.
 */
function loadChessLibrary() {
  return new Promise((resolve, reject) => {
    // If Chess is already defined globally, resolve immediately.
    if (typeof Chess !== 'undefined' && Chess) {
      resolve(Chess);
      return;
    }
    // Check for global or exported Chess constructor populated by the UMD build.
    if (typeof window !== 'undefined' && window.exports && window.exports.Chess) {
      // eslint-disable-next-line no-global-assign
      Chess = window.exports.Chess;
      resolve(Chess);
      return;
    }
    // As a fallback, check if Chess is already defined globally (for backward compatibility).
    if (typeof Chess !== 'undefined') {
      resolve(Chess);
      return;
    }
    // Final fallback: use our embedded SimpleChess implementation.  This ensures
    // that the mini‑app still functions offline or if the external chess.js
    // library fails to load.  SimpleChess implements most of the features
    // needed for casual play and AI.
    // eslint-disable-next-line no-global-assign
    Chess = SimpleChess;
    resolve(Chess);
  });
}
let selectedSquare = null; // currently selected square (e.g. 'e2')
let possibleMoves = []; // legal moves from selected square (array of verbose move objects)
let isPlayerVsAI = true; // mode: true = vs AI, false = two players
let aiDepth = 3; // AI difficulty (search depth)

// Player rating scoreboard.  Each entry maps a player name to a rating
// value.  Ratings persist across sessions via localStorage.  A new
// player starts at 1500.  Opponent names are entered via the search
// input in two‑player mode.  Scoreboard updates are made when a
// two‑player game ends in checkmate.
let scoreboard = {};
// Track whether the scoreboard has finished loading from CloudStorage.  It
// starts as null (unknown).  When CloudStorage is unavailable the
// loader will set it to true immediately.  When CloudStorage is
// used, it is set to true once the asynchronous getItem callback
// completes (regardless of success).  updateUsernames uses this
// flag to decide whether to persist scores so that default ratings do
// not overwrite values stored in the cloud.
let scoreboardLoadedFromCloud = null;

// ---------------------------------------------------------------------------
// Remote multiplayer support
//
// The following variables and functions implement a rudimentary
// networked chess game atop the matchmaking server.  When a match is
// found via the /match endpoint the client records the gameId and
// colour assigned by the server.  Moves are sent to the server via
// POST /game/<id>/move and board state is periodically polled via
// GET /game/<id>.  Ratings are maintained on the server and
// reflected in the UI.  If no match is found, the mini‑app falls back
// to local two‑player or AI play as before.

// ID of the current remote game (if any).  null when no remote game
// is active.
let remoteGameId = null;
// Colour assigned by the server to the current user ('w' or 'b')
let remoteMyColor = null;
// Interval ID used for polling the server for game state.  Cleared when
// the game ends.
let remotePollId = null;
// Remote opponent information received from the server: { id, name, rating }
let remoteOpponent = null;
// Flag indicating whether a remote game is currently active.  When true
// the local engine defers to the server for move validation and board
// state.
let remoteActive = false;

/**
 * Initialise a remote game.  Called once the matchmaking server has
 * paired this player with an opponent.  Loads the initial FEN into
 * the engine, sets the colour and starts polling the server for state
 * updates.
 *
 * @param {string} gameId The identifier for the remote game
 * @param {string} color  The colour assigned to the current player ('w' or 'b')
 * @param {string} fen    Initial FEN string for the board
 * @param {object} opponent Opponent info { id, name, rating }
 */
function initRemoteGame(gameId, color, fen, opponent) {
  remoteGameId = gameId;
  remoteMyColor = color;
  remoteOpponent = opponent;
  remoteActive = true;
  // Stop any existing polling loop
  if (remotePollId) clearInterval(remotePollId);
  // Ensure the Chess engine is ready and load the FEN
  game = new Chess();
  game.load(fen);
  selectedSquare = null;
  possibleMoves = [];
  ratingUpdated = false;
  // Display opponent name and ratings
  updateUsernames();
  renderBoard();
  updateStatusRemote();
  // Start polling the server for state updates every 2 seconds
  remotePollId = setInterval(() => {
    pollRemoteGameState();
  }, 2000);
}

/**
 * Poll the server for the current state of the active remote game.  If
 * the position has changed since the last update, reload the engine
 * and re‑render the board.  If the game has ended, stop polling and
 * update ratings accordingly.
 */
function pollRemoteGameState() {
  if (!remoteActive || !remoteGameId) return;
  fetch(`${MATCHMAKER_URL}/game/${remoteGameId}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.error) return;
      // Update ratings for both players from the server state
      if (data.players && data.players.w && data.players.b) {
        // Ensure scoreboard entries exist and update values
        const pW = data.players.w;
        const pB = data.players.b;
        scoreboard[pW.name] = pW.rating;
        scoreboard[pB.name] = pB.rating;
      }
      // If FEN differs from our current board, load it and rerender
      if (data.fen && data.fen !== game.fen()) {
        game.load(data.fen);
        selectedSquare = null;
        possibleMoves = [];
        renderBoard();
      }
      // Update status (whose turn, or end result)
      remoteMyColor = remoteMyColor; // no change
      updateStatusRemote(data);
      // If game is over, stop polling
      if (data.over) {
        if (remotePollId) clearInterval(remotePollId);
        remotePollId = null;
        remoteActive = false;
        remoteGameId = null;
        remoteMyColor = null;
        // Persist updated ratings (server already updated them) to CloudStorage/localStorage
        saveScoreboard();
        // Ensure UI reflects new ratings
        updateUsernames();
      }
    })
    .catch(err => {
      // network error; ignore
    });
}

/**
 * Send a move to the server.  If the server accepts the move it
 * returns the updated game state which is then loaded into the engine.
 * Illegal moves or server errors will simply do nothing.
 *
 * @param {string} from Source square (e.g. 'e2')
 * @param {string} to   Destination square (e.g. 'e4')
 * @param {string} promotion Optional promotion piece ('q', 'r', 'b', 'n')
 */
function sendRemoteMove(from, to, promotion) {
  if (!remoteActive || !remoteGameId) return;
  const playerId = (Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user && Telegram.WebApp.initDataUnsafe.user.id) || currentUserName;
  const payload = { playerId: String(playerId), from: from.toLowerCase(), to: to.toLowerCase() };
  if (promotion) payload.promotion = promotion.toLowerCase();
  fetch(`${MATCHMAKER_URL}/game/${remoteGameId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(res => res.json())
    .then(data => {
      if (!data || data.error) {
        // illegal move or error; nothing to do
        return;
      }
      // Update ratings from server state
      if (data.players && data.players.w && data.players.b) {
        const pW = data.players.w;
        const pB = data.players.b;
        scoreboard[pW.name] = pW.rating;
        scoreboard[pB.name] = pB.rating;
      }
      // Load new FEN if provided
      if (data.fen) {
        game.load(data.fen);
        selectedSquare = null;
        possibleMoves = [];
        renderBoard();
      }
      updateStatusRemote(data);
      // If game ended, stop polling and mark remoteInactive; ratings already updated
      if (data.over) {
        if (remotePollId) clearInterval(remotePollId);
        remotePollId = null;
        remoteActive = false;
        remoteGameId = null;
        remoteMyColor = null;
        saveScoreboard();
        updateUsernames();
      }
    })
    .catch(err => {
      // ignore errors
    });
}

/**
 * Update the status text during a remote game.  Displays whose turn it
 * is or the result of the game.  Accepts an optional state object
 * returned by the server; if omitted, it infers state from the
 * current board.
 *
 * @param {object} [state] Latest server state
 */
function updateStatusRemote(state) {
  if (!statusEl) return;
  let turnColor;
  let over = false;
  let result = null;
  if (state) {
    turnColor = state.turn;
    over = state.over;
    result = state.result;
  } else {
    turnColor = game.turn();
    over = game.game_over();
  }
  if (over && result) {
    if (result.reason === 'checkmate') {
      const winnerName = result.winnerId === ((Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe.user && Telegram.WebApp.initDataUnsafe.user.id) || currentUserName) ? currentUserName : remoteOpponent && remoteOpponent.name;
      statusEl.textContent = `${winnerName} wins by checkmate!`;
    } else if (result.reason === 'stalemate') {
      statusEl.textContent = 'Draw by stalemate!';
    } else {
      statusEl.textContent = 'Game over';
    }
  } else {
    // Ongoing game: indicate whose turn it is
    if (turnColor === remoteMyColor) {
      statusEl.textContent = 'Your move';
    } else {
      statusEl.textContent = `${remoteOpponent && remoteOpponent.name || 'Opponent'} to move`;
    }
  }
}

// --- Matchmaking server configuration ---
// To enable cross‑user opponent search via a shared queue, set
// MATCHMAKER_URL to the base URL of your matchmaking server (for
// example, 'https://your-domain.com').  When non‑empty, the
// findOpponent() function will POST to `${MATCHMAKER_URL}/match` and
// poll `${MATCHMAKER_URL}/match/<userId>` until a match is found.
// Leave this as an empty string to fall back to the local in‑browser
// matchmaking queue (which only works within a single browser and
// cannot match real Telegram users).
// Base URL of the matchmaking server.  When set to a non‑empty string
// the mini‑app will communicate with the back‑end to pair players and
// synchronise game state.  If you deploy the server on Render or
// another host, update this value accordingly.  Leave empty to use
// only local/offline play.
const MATCHMAKER_URL = 'https://telegramchess-server.onrender.com';
let currentUserName = 'Player';
let selectedOpponentName = null;
let ratingUpdated = false;
// Matchmaking queue.  Players who press the "Find Opponent" button in
// two‑player mode are placed in this queue.  The queue is persisted
// using localStorage so that players in different tabs can match.
let matchQueue = [];

// Load scoreboard from localStorage.  If no scoreboard exists, start
// with an empty object.  Use try/catch to handle JSON parse errors.
/*
 * Load the player rating scoreboard.  The scoreboard is stored in
 * localStorage for quick access but also synchronised with Telegram's
 * CloudStorage (if available) to persist ratings across sessions and
 * devices.  When running outside of Telegram or if CloudStorage is
 * unavailable, only the localStorage copy is used.  On success,
 * scoreboard is replaced with the parsed data.  If CloudStorage
 * returns a result, the UI is refreshed by calling updateUsernames()
 * so that newly loaded ratings are displayed immediately.
 */
function loadScoreboard() {
  // Reset scoreboard to a fresh object before loading and mark cloud
  // load as unknown.  This will be set to true when the cloud load
  // completes (whether successful or not).
  scoreboard = {};
  scoreboardLoadedFromCloud = null;
  // First attempt to load from localStorage.  Use try/catch to
  // gracefully handle malformed JSON or other errors.  This allows
  // development and fallback storage when CloudStorage is not
  // available (for example when running in a standard browser).
  try {
    const data = localStorage.getItem('tgChessScoreboard');
    if (data) {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        scoreboard = parsed;
      }
    }
  } catch (e) {
    // Ignore errors and leave scoreboard as an empty object
  }
  // If running inside Telegram and the CloudStorage API is
  // available, attempt to fetch the scoreboard from the cloud.
  // CloudStorage stores data per user and per domain, so each
  // player's ratings are persisted across sessions.  The callback
  // receives a result object { ok: boolean, value: string }.  When
  // complete (successfully or not), scoreboardLoadedFromCloud is set
  // to true so that updateUsernames can persist new ratings.
  try {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.CloudStorage && typeof Telegram.WebApp.CloudStorage.getItem === 'function') {
      Telegram.WebApp.CloudStorage.getItem('tgChessScoreboard', (result) => {
        try {
          if (result && result.ok && result.value) {
            const cloudData = JSON.parse(result.value);
            if (typeof cloudData === 'object' && cloudData !== null) {
              scoreboard = cloudData;
            }
          }
        } catch (e) {
          // Ignore JSON parse errors and continue using the
          // locally loaded scoreboard
        } finally {
          // Regardless of success, mark that the cloud load has
          // completed and refresh the UI so that names and ratings
          // reflect any updated values.
          scoreboardLoadedFromCloud = true;
          if (typeof updateUsernames === 'function') {
            updateUsernames();
          }
        }
      });
    } else {
      // CloudStorage not available; consider load complete immediately
      scoreboardLoadedFromCloud = true;
    }
  } catch (e) {
    // Any unexpected errors interacting with Telegram API are
    // ignored.  Mark load complete to allow saving ratings.
    scoreboardLoadedFromCloud = true;
  }
}

// Save the current scoreboard to localStorage.  Ignore errors silently.
/*
 * Save the current scoreboard to both localStorage and, if available,
 * Telegram's CloudStorage.  LocalStorage is always written so that
 * ratings persist when reloading the page outside of Telegram.
 * When inside Telegram, CloudStorage allows ratings to be restored
 * even after closing the mini‑app.  CloudStorage requires write
 * access; we request it first and only attempt to write if
 * permission is granted.  Errors are silently ignored to avoid
 * interrupting the user experience.
 */
function saveScoreboard() {
  // Always attempt to save to localStorage.  Even if CloudStorage
  // fails, this provides a fallback within the same browser session.
  try {
    localStorage.setItem('tgChessScoreboard', JSON.stringify(scoreboard));
  } catch (e) {
    // Ignore localStorage write errors
  }
  // Attempt to save to Telegram CloudStorage if running inside
  // Telegram and the API is available.  We must request write
  // permission before writing; if the user denies or the API is
  // unavailable the write silently fails and localStorage remains
  // authoritative for this session.  The requestWriteAccess callback
  // returns a boolean indicating whether access was granted.
  try {
    const tg = typeof Telegram !== 'undefined' && Telegram.WebApp ? Telegram.WebApp : null;
    if (tg && tg.CloudStorage && typeof tg.CloudStorage.setItem === 'function') {
      const data = JSON.stringify(scoreboard);
      // Define a helper to perform the actual setItem call
      const writeCloud = () => {
        try {
          tg.CloudStorage.setItem('tgChessScoreboard', data, (result) => {
            // The callback receives { ok: boolean }.  We ignore
            // failures silently to avoid disrupting the UI.
          });
        } catch (e) {
          // Ignore CloudStorage write errors
        }
      };
      // If requestWriteAccess is available, ask for permission
      if (typeof tg.requestWriteAccess === 'function') {
        try {
          tg.requestWriteAccess((granted) => {
            if (granted) {
              writeCloud();
            }
          });
        } catch (e) {
          // If the request fails, fall back to writing directly
          writeCloud();
        }
      } else {
        // If requestWriteAccess is not available, attempt to write
        writeCloud();
      }
    }
  } catch (e) {
    // Ignore any errors interacting with Telegram API
  }
}

// Ensure a player exists in the scoreboard.  If not present, assign
// the default starting rating of 1500.  Returns the player's rating.
function ensurePlayer(name) {
  if (!name) return 1500;
  if (!scoreboard[name]) {
    scoreboard[name] = 1500;
  }
  return scoreboard[name];
}

// Load the matchmaking queue from localStorage.  Ensures matchQueue
// is always an array.
function loadQueue() {
  try {
    const data = localStorage.getItem('tgChessMatchQueue');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        matchQueue = parsed;
      } else {
        matchQueue = [];
      }
    } else {
      matchQueue = [];
    }
  } catch (e) {
    matchQueue = [];
  }
}

// Save the matchmaking queue to localStorage.
function saveQueue() {
  try {
    localStorage.setItem('tgChessMatchQueue', JSON.stringify(matchQueue));
  } catch (e) {
    // ignore
  }
}

// Remove a player from the matchmaking queue.
function removeFromQueue(name) {
  matchQueue = matchQueue.filter(item => item && item.name !== name);
}

// Add a player to the matchmaking queue with their current rating.
function addToQueue(name, rating) {
  removeFromQueue(name);
  matchQueue.push({ name, rating, time: Date.now() });
}

// Find the best opponent in the queue for the given player based on
// minimal rating difference.  Returns the queue entry or null if no
// candidate exists.
function findBestOpponent(name, rating) {
  let best = null;
  let bestDiff = Infinity;
  for (const item of matchQueue) {
    if (!item || item.name === name) continue;
    const diff = Math.abs((item.rating || 1500) - rating);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = item;
    }
  }
  return best;
}

// Attempt to find an opponent for the current user.  If another
// player is waiting in the queue, they are matched and a new game
// begins.  Otherwise the current user is added to the queue and a
// message is shown indicating that the search is ongoing.
function findOpponent() {
  // Always ensure the current player has a rating entry
  ensurePlayer(currentUserName);
  const myRating = scoreboard[currentUserName] || 1500;
  // If a matchmaking server is configured, use it to find an opponent via the
  // server API.  The server immediately responds when a match is
  // available; otherwise the client polls /match/:id until paired.
  if (MATCHMAKER_URL) {
    let userId = null;
    try {
      if (
        typeof Telegram !== 'undefined' &&
        Telegram.WebApp &&
        Telegram.WebApp.initDataUnsafe &&
        Telegram.WebApp.initDataUnsafe.user &&
        Telegram.WebApp.initDataUnsafe.user.id
      ) {
        userId = Telegram.WebApp.initDataUnsafe.user.id;
      }
    } catch (e) {
      // ignore
    }
    if (!userId) {
      userId = String(Date.now());
    }
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) newGameBtn.disabled = true;
    statusEl.textContent = 'Searching for opponent...';
    // Send join request to the server
    fetch(`${MATCHMAKER_URL.replace(/\/$/, '')}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, name: currentUserName, rating: myRating }),
    })
      .then((res) => res.json())
      .then((data) => {
        const handleMatch = (payload) => {
          // Received a match: initialise remote game and update UI
          selectedOpponentName = payload.opponent.name;
          ensurePlayer(selectedOpponentName);
          // Switch to two‑player mode and initialise remote state
          isPlayerVsAI = false;
          initRemoteGame(payload.gameId, payload.color, payload.fen, payload.opponent);
          // Re‑enable the New Game button
          if (newGameBtn) newGameBtn.disabled = false;
        };
        if (data && data.matched) {
          handleMatch(data);
        } else {
          // No match yet: poll the server periodically
          const poll = setInterval(() => {
            fetch(`${MATCHMAKER_URL.replace(/\/$/, '')}/match/${userId}`)
              .then((res2) => res2.json())
              .then((data2) => {
                if (data2 && data2.matched) {
                  clearInterval(poll);
                  handleMatch(data2);
                }
              })
              .catch(() => {
                // ignore errors and keep polling
              });
          }, 2000);
        }
      })
      .catch((err) => {
        console.error('Error contacting matchmaking server:', err);
        statusEl.textContent = 'Error contacting match server';
        if (newGameBtn) newGameBtn.disabled = false;
      });
    return;
  }
  // Fallback: use in‑browser matchmaking queue.  This only works
  // within a single browser and cannot match players across devices.
  loadQueue();
  // Remove the current user from the queue (if present) before
  // searching so they don't match with themselves.
  removeFromQueue(currentUserName);
  const candidate = findBestOpponent(currentUserName, myRating);
  if (candidate) {
    // Found a match.  Remove the opponent from the queue and save.
    removeFromQueue(candidate.name);
    saveQueue();
    selectedOpponentName = candidate.name;
    // Ensure the opponent exists in the scoreboard
    ensurePlayer(selectedOpponentName);
    // We are now in two‑player mode
    isPlayerVsAI = false;
    // Start a new game against this opponent
    startNewGame();
    // Notify players in the status area
    statusEl.textContent = `Matched with ${selectedOpponentName} (${scoreboard[selectedOpponentName]})`;
  } else {
    // No opponent available.  Add current user to the queue and save.
    addToQueue(currentUserName, myRating);
    saveQueue();
    // Show searching status
    statusEl.textContent = 'Searching for opponent...';
    // Hide the new game button while waiting to avoid confusion
    const newGameBtn2 = document.getElementById('newGameBtn');
    if (newGameBtn2) newGameBtn2.disabled = true;
  }
}

// Update the opponent datalist options based on the current scoreboard.
// Exclude the current user from the list.  This function rebuilds the
// datalist each time it is called.  It can be invoked whenever the
// scoreboard or currentUserName changes.  Options display only the
// player names; rating is shown later in the UI.
function updateOpponentList() {
  const datalist = document.getElementById('opponentList');
  if (!datalist) return;
  // Clear existing options
  while (datalist.firstChild) {
    datalist.removeChild(datalist.firstChild);
  }
  // Create an array of players excluding the current user, sorted by
  // descending rating.  This allows users to pick opponents by their
  // standing on the ladder.  The label of each option shows the
  // player's rating alongside their name.
  const players = Object.keys(scoreboard)
    .filter(name => name !== currentUserName)
    .sort((a, b) => (scoreboard[b] || 0) - (scoreboard[a] || 0));
  players.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.label = `${name} (${scoreboard[name]})`;
    datalist.appendChild(option);
  });
}

const statusEl = document.getElementById('status');
// Indicate script has been parsed.  If you see this message in the
// footer, the module loaded successfully.  This helps debug when the
// board does not render due to engine loading issues.
if (statusEl) {
  statusEl.textContent = 'Script initialized';
}

// Attach a global error handler to surface script errors in the UI.
// Without access to browser devtools in the mini‑app context, this helps
// diagnose issues by showing errors in the footer.  If an uncaught
// exception occurs anywhere in the script, the message will appear
// below the board instead of silently failing.
window.onerror = function (message, source, lineno, colno, error) {
  if (statusEl) {
    statusEl.textContent = 'Error: ' + message + ' at ' + lineno + ':' + colno;
  }
  return false; // allow default logging in console
};

// Update the displayed player and opponent names based on Telegram user info
// and the current game mode.  When running inside Telegram, the
// WebApp.initDataUnsafe.user object provides the user's id, first
// name and username.  We prefer the username (prefaced with '@') if
// available, otherwise fall back to the first name.  When not in
// Telegram or the user info is unavailable, default to "Player".  In
// AI mode the opponent is labelled "AI"; in two‑player mode we
// display "Player 2" for the second side.
function updateUsernames() {
  const playerSpan = document.getElementById('playerName');
  const opponentSpan = document.getElementById('opponentName');
  // Determine the current user name from Telegram.  Remove the '@'
  // prefix if present.  Fallback to first_name or 'Player' if
  // unavailable.  Store the name in currentUserName and ensure it
  // exists in the scoreboard.
  let name = 'Player';
  try {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
      const user = Telegram.WebApp.initDataUnsafe.user;
      if (user.username) {
        // Do not include the '@' symbol in the display name
        name = String(user.username);
      } else if (user.first_name) {
        name = user.first_name;
      }
    }
  } catch (e) {
    // ignore errors and use default name
  }
  currentUserName = name || 'Player';
  // Ensure the current user has a rating
  ensurePlayer(currentUserName);
  // Determine the opponent name.  In AI mode, display 'AI'.  In two
  // player mode, use the selected opponent name if available; otherwise
  // fall back to 'Player 2'.  When a human opponent is selected,
  // ensure they have a rating.
  let opponentName;
  if (isPlayerVsAI) {
    opponentName = 'AI';
  } else {
    opponentName = selectedOpponentName || 'Player 2';
    if (opponentName && opponentName !== 'AI' && opponentName !== 'Player 2') {
      ensurePlayer(opponentName);
    }
  }
  // Update displayed names with ratings when applicable.  For AI mode,
  // we omit ratings.  For human players, append the rating in
  // parentheses.
  if (playerSpan) {
    if (isPlayerVsAI) {
      playerSpan.textContent = currentUserName;
    } else {
      playerSpan.textContent = `${currentUserName} (${scoreboard[currentUserName]})`;
    }
  }
  if (opponentSpan) {
    if (isPlayerVsAI) {
      opponentSpan.textContent = opponentName;
    } else {
      opponentSpan.textContent = `${opponentName} (${scoreboard[opponentName]})`;
    }
  }
  // Persist ratings only after the scoreboard has finished loading
  // from CloudStorage.  This prevents overwriting a previously
  // stored rating with the default value before the cloud data
  // arrives.  Once scoreboardLoadedFromCloud is true (set in
  // loadScoreboard), updates to the scoreboard will be saved.
  if (scoreboardLoadedFromCloud) {
    saveScoreboard();
  }
}

// Initialize Telegram WebApp environment and register theme handlers
function initTelegram() {
  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.ready();
    // Expand to full viewport to provide a better experience
    Telegram.WebApp.expand();
    // Update theme variables when Telegram theme changes
    Telegram.WebApp.onEvent('themeChanged', updateThemeVariables);
    updateThemeVariables();
      // Once the environment is ready, update the displayed usernames
      updateUsernames();
  }
}

// Update CSS custom properties based on Telegram theme parameters.  If
// Telegram does not provide certain colors, fall back to the defaults
// defined in style.css.  Board square colors are set here to blend
// nicely with the surrounding UI.
function updateThemeVariables() {
  const root = document.documentElement;
  const tg = Telegram && Telegram.WebApp ? Telegram.WebApp : {};
  // Example: adjust square colors based on background brightness
  const bgColor = tg.backgroundColor || getComputedStyle(root).getPropertyValue('--tg-theme-bg-color');
  if (bgColor) {
    // Simple luminance calculation to decide light/dark squares
    const rgb = bgColor.replace(/rgba?\(|\)/g, '').split(',').map(v => parseFloat(v));
    const luminance = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
    if (luminance < 128) {
      // Dark theme: lighten squares
      root.style.setProperty('--light-square', '#a7a59b');
      root.style.setProperty('--dark-square', '#515151');
    } else {
      // Light theme
      root.style.setProperty('--light-square', '#f0d9b5');
      root.style.setProperty('--dark-square', '#b58863');
    }
  }
}

// Convert file (0-7) and rank (0-7) indices to algebraic square notation
function fileRankToSquare(file, rank) {
  const files = 'abcdefgh';
  return files[file] + (rank + 1);
}

// Create or update the board DOM based on the current game state.
function renderBoard() {
  const boardEl = document.getElementById('board');
  // Clear existing children
  while (boardEl.firstChild) {
    boardEl.removeChild(boardEl.firstChild);
  }
  // Determine last move to highlight
  const history = game.history({ verbose: true });
  const last = history.length > 0 ? history[history.length - 1] : null;

  // Build squares row by row (top to bottom).  Ranks in chess are
  // numbered from 1 (bottom) to 8 (top), so we iterate rank 7 downto 0.
  for (let r = 7; r >= 0; r--) {
    for (let f = 0; f < 8; f++) {
      const square = fileRankToSquare(f, r);
      const squareEl = document.createElement('div');
      squareEl.classList.add('square');
      // Color alternates each square
      if ((r + f) % 2 === 0) {
        squareEl.classList.add('light');
      } else {
        squareEl.classList.add('dark');
      }
      squareEl.dataset.square = square;
      // Attach click handler
      squareEl.addEventListener('click', () => handleSquareClick(square));
      // Place piece if present
      const piece = game.get(square);
      if (piece) {
        const span = document.createElement('span');
        // Assign a base class for all pieces
        span.className = 'piece';
        // Add a colour class so we can style white and black pieces differently in CSS
        if (piece.color === 'w') {
          span.classList.add('white');
        } else {
          span.classList.add('black');
        }
        // For white pieces, use uppercase piece.type; black pieces use lowercase
        const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
        span.textContent = unicodePieces[key];
        squareEl.appendChild(span);
      }
      boardEl.appendChild(squareEl);
    }
  }
  // Highlight last move squares
  if (last) {
    highlightSquares([last.from, last.to], 'lastmove');
  }
  // Highlight possible moves from selected square
  highlightSquares(possibleMoves.map(m => m.to), 'highlight');
  // Highlight selected square itself
  if (selectedSquare) {
    highlightSquares([selectedSquare], 'selected');
  }
}

// Add a CSS class to an array of squares for highlighting purposes
function highlightSquares(sqArray, cls) {
  const boardEl = document.getElementById('board');
  sqArray.forEach(sq => {
    const el = Array.from(boardEl.children).find(child => child.dataset.square === sq);
    if (el) {
      el.classList.add(cls);
    }
  });
}

// Handle clicks on a square.  This logic allows selecting a piece,
// highlighting its legal moves, and executing moves.  After a player
// move, the AI will respond if in AI mode.
function handleSquareClick(square) {
  // If the local engine reports game over, ignore clicks
  if (game.game_over()) {
    return;
  }
  const piece = game.get(square);
  // If a remote game is active, send moves to the server instead of
  // applying them locally.  Only allow selecting and moving pieces
  // belonging to the current player colour.  Board updates will be
  // applied when the server returns the new FEN.
  if (remoteActive) {
    const myTurn = game.turn() === remoteMyColor;
    if (!myTurn) {
      // Not your turn: ignore input
      return;
    }
    if (!selectedSquare) {
      // Select a piece of the current player's colour
      if (piece && ((remoteMyColor === 'w' && piece.color === 'w') || (remoteMyColor === 'b' && piece.color === 'b'))) {
        selectedSquare = square;
        possibleMoves = game.moves({ square: square, verbose: true });
      }
    } else {
      // Attempt to send the move to the server
      sendRemoteMove(selectedSquare, square);
      selectedSquare = null;
      possibleMoves = [];
    }
    renderBoard();
    return;
  }
  // Local or AI game logic
  const turn = game.turn();
  if (!selectedSquare) {
    if (piece && ((turn === 'w' && piece.color === 'w') || (!isPlayerVsAI && turn === 'b' && piece.color === 'b'))) {
      selectedSquare = square;
      possibleMoves = game.moves({ square: square, verbose: true });
    }
  } else {
    const move = game.move({ from: selectedSquare, to: square });
    if (move) {
      selectedSquare = null;
      possibleMoves = [];
      renderBoard();
      updateStatus();
      if (isPlayerVsAI && !game.game_over()) {
        setTimeout(() => makeAIMove(), 200);
      }
      return;
    } else {
      if (piece && ((turn === 'w' && piece.color === 'w') || (!isPlayerVsAI && turn === 'b' && piece.color === 'b'))) {
        selectedSquare = square;
        possibleMoves = game.moves({ square: square, verbose: true });
      } else {
        selectedSquare = null;
        possibleMoves = [];
      }
    }
  }
  renderBoard();
}

// Update the status display with current turn or game result
function updateStatus() {
  if (game.in_checkmate()) {
    // Display which side won
    statusEl.textContent = game.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
    // If a two‑player game just ended and ratings have not yet been
    // updated, adjust both players' ratings according to the result.
    // Winner gains +5; loser loses -3 or -4 if losing to a lower‑rated
    // opponent.  No rating change is applied for AI games or if
    // already updated.
    // Only update local ratings for non‑AI games when not playing a remote game.
    if (!isPlayerVsAI && !remoteActive && !ratingUpdated) {
      ratingUpdated = true;
      const loserColor = game.turn();
      const winnerColor = loserColor === 'w' ? 'b' : 'w';
      // Determine winner and loser names based on which color is which
      const winnerName = winnerColor === 'w' ? currentUserName : selectedOpponentName;
      const loserName = loserColor === 'w' ? currentUserName : selectedOpponentName;
      // Ensure both players exist in the scoreboard
      const winnerRatingBefore = ensurePlayer(winnerName);
      const loserRatingBefore = ensurePlayer(loserName);
      // Apply rating update: winner +5
      scoreboard[winnerName] = (scoreboard[winnerName] || 0) + 5;
      // Loser penalty: -4 if loser had a higher rating than the winner
      // before the update, else -3
      const penalty = loserRatingBefore > winnerRatingBefore ? 4 : 3;
      scoreboard[loserName] = Math.max(0, (scoreboard[loserName] || 0) - penalty);
      // Persist and refresh UI
      saveScoreboard();
      updateUsernames();
    }
  } else if (game.in_draw()) {
    statusEl.textContent = 'Draw!';
  } else {
    statusEl.textContent = game.turn() === 'w' ? 'White to move' : 'Black to move';
  }
}

// Start or reset a new game based on selected mode and difficulty
function startNewGame() {
  game = new Chess();
  selectedSquare = null;
  possibleMoves = [];
  isPlayerVsAI = document.getElementById('modeSelect').value === 'ai';
  aiDepth = parseInt(document.getElementById('difficultySelect').value, 10) || 3;
  // Reset rating update flag for this game.  This flag prevents
  // multiple rating adjustments on repeated status updates after a
  // checkmate.
  ratingUpdated = false;
  // Enable/disable difficulty selector based on mode
  document.getElementById('difficultySelect').disabled = !isPlayerVsAI;
  document.getElementById('difficultyLabel').style.opacity = isPlayerVsAI ? 1 : 0.5;
  // Show or hide the "Find Opponent" button based on mode.  In AI mode
  // the button remains hidden and disabled; in two‑player mode it is
  // visible and enabled.  Also ensure the "New Game" button is
  // re‑enabled when starting a new game.
  const findBtn = document.getElementById('findOpponentBtn');
  const newGameBtn = document.getElementById('newGameBtn');
  if (findBtn) {
    if (isPlayerVsAI) {
      findBtn.classList.add('hidden');
      findBtn.disabled = true;
    } else {
      findBtn.classList.remove('hidden');
      findBtn.disabled = false;
    }
  }
  if (newGameBtn) {
    newGameBtn.disabled = false;
  }
  // Update displayed usernames when starting a new game.  This also
  // initializes scoreboard entries if needed.
  updateUsernames();
  renderBoard();
  updateStatus();
  // If AI plays first (black) in two‑player mode, no AI on first move
  // In our implementation, the human always plays white vs AI
}

// Kick off an AI move using a minimax search.  After computing the
// best move the AI will play it and update the board.  Difficulty is
// controlled via aiDepth which sets the search depth.  For easy
// levels, we add randomness by occasionally picking a non‑optimal move.
function makeAIMove() {
  const best = getBestMove(game, aiDepth);
  if (best) {
    game.move(best);
    // Clear any selected state and possible move highlights
    selectedSquare = null;
    possibleMoves = [];
    renderBoard();
    updateStatus();
  }
}

// Evaluate the board from the perspective of the side to move.  Higher
// values mean a better position for White, lower values favour Black.
function evaluateBoard(g) {
  const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
  let total = 0;
  const fen = g.fen().split(' ')[0];
  let rank = 7;
  let file = 0;
  for (const char of fen) {
    if (char === '/') {
      rank--;
      file = 0;
      continue;
    }
    if (isNaN(char)) {
      const piece = char;
      const value = pieceValues[piece.toLowerCase()] || 0;
      total += piece === piece.toUpperCase() ? value : -value;
      file++;
    } else {
      file += parseInt(char, 10);
    }
  }
  return total;
}

// Generate a best move for the current position using minimax.  Returns a
// verbose move object as provided by chess.js.  The function chooses
// moves that maximize or minimize the evaluation depending on which
// side is to move.  Depth controls the search horizon.
function getBestMove(g, depth) {
  const side = g.turn();
  const maximizing = side === 'w';
  let bestEval = maximizing ? -Infinity : Infinity;
  let bestMove = null;
  const moves = g.moves({ verbose: true });
  // For easier difficulties we shuffle moves to introduce variety
  shuffleArray(moves);

  // Set a time limit for the search based on depth.  Without a limit,
  // higher difficulty levels (depth >= 5) can cause long blocking
  // computations that freeze the UI.  We allocate approximately
  // 400ms of search time per depth level.  For example, depth 5
  // allows ~2 seconds of search.  If the time limit is exceeded,
  // minimax will immediately return the static evaluation of the
  // position.  This prevents the AI from hanging the interface.
  // Adjust the time allotment per depth based on difficulty.  Higher
  // depths are given less time per ply to prevent the AI from
  // over‑searching and freezing the UI.  Depths up to 3 retain the
  // original 400ms per ply; depth 4 drops to 250ms and depth 5+
  // further drops to 200ms.  This keeps thinking time reasonable on
  // slower devices without sacrificing too much strength at lower
  // difficulties.
  let timePerDepthMs;
  if (depth <= 3) {
    timePerDepthMs = 400;
  } else if (depth === 4) {
    timePerDepthMs = 250;
  } else if (depth === 5) {
    timePerDepthMs = 150;
  } else {
    // For any depth beyond 5, cap time further to 150ms per ply to
    // avoid excessive calculation.  Although depth > 5 is not
    // currently exposed via the UI, this ensures the AI remains
    // responsive if extended in future.
    timePerDepthMs = 150;
  }
  const endTime = Date.now() + depth * timePerDepthMs;
  for (const move of moves) {
    g.move(move);
    const evalScore = minimax(g, depth - 1, -Infinity, Infinity, !maximizing, endTime);
    g.undo();
    if (maximizing && evalScore > bestEval) {
      bestEval = evalScore;
      bestMove = move;
    } else if (!maximizing && evalScore < bestEval) {
      bestEval = evalScore;
      bestMove = move;
    }
  }
  return bestMove;
}

// Minimax algorithm with alpha‑beta pruning.  Returns an evaluation
// score.  isMaximizing indicates whether we are maximizing (white) or
// minimizing (black).  Depth controls the remaining search depth.
function minimax(g, depth, alpha, beta, isMaximizing, endTime) {
  // If the time limit has been reached, return a static evaluation.
  if (Date.now() >= endTime) {
    return evaluateBoard(g);
  }
  // Stop searching when maximum depth reached or the game is over.
  if (depth === 0 || g.game_over()) {
    return evaluateBoard(g);
  }
  const moves = g.moves({ verbose: true });
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      g.move(move);
      const evalScore = minimax(g, depth - 1, alpha, beta, false, endTime);
      g.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
      // Early exit if time is exhausted
      if (Date.now() >= endTime) {
        break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      g.move(move);
      const evalScore = minimax(g, depth - 1, alpha, beta, true, endTime);
      g.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) {
        break;
      }
      // Early exit if time is exhausted
      if (Date.now() >= endTime) {
        break;
      }
    }
    return minEval;
  }
}

// Fisher‑Yates shuffle to randomize an array in place.  This is used
// to introduce variability in the AI's move ordering, making it less
// deterministic especially at lower depths where many moves have
// similar evaluations.
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Bind UI controls once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initTelegram();
  // Load the chess.js library.  Once loaded, set up the UI and
  // initialize a new game.  If the library fails to load, display
  // an error message.  We avoid using ES module imports here since
  // file:// pages often have strict cross-origin import rules.
  loadChessLibrary()
    .then(() => {
      // Indicate that the chess engine loaded successfully
      if (statusEl) {
        statusEl.textContent = 'Engine loaded';
      }
      // Load persistent rating data.  This loads the scoreboard from
      // localStorage and ensures ratings persist across sessions.
      loadScoreboard();
      // Bind UI controls after the Chess class is available
      document.getElementById('newGameBtn').addEventListener('click', startNewGame);
      document.getElementById('modeSelect').addEventListener('change', () => {
        // Changing mode resets the game
        startNewGame();
      });
      document.getElementById('difficultySelect').addEventListener('change', () => {
        aiDepth = parseInt(document.getElementById('difficultySelect').value, 10) || 3;
      });

      // Bind the "Find Opponent" button.  When clicked in two‑player
      // mode, the current player is added to a matchmaking queue and
      // matched with another waiting player based on the smallest
      // rating difference.  In AI mode this button is hidden and
      // disabled.  The findOpponent() function handles adding the
      // player to the queue and performing the match.
      const findOpponentBtn = document.getElementById('findOpponentBtn');
      if (findOpponentBtn) {
        findOpponentBtn.addEventListener('click', () => {
          // Only attempt to find an opponent when playing in
          // two‑player mode.  In AI mode the button remains hidden.
          if (!isPlayerVsAI) {
            findOpponent();
          }
        });
      }

      // Toggle the visibility of the controls when the menu button is clicked
      const menuButton = document.getElementById('menuToggle');
      const controlsContainer = document.querySelector('.controls');
      if (menuButton && controlsContainer) {
        menuButton.addEventListener('click', () => {
          controlsContainer.classList.toggle('hidden');
        });
      }
      // Start the first game now that everything is ready
      startNewGame();
    })
    .catch((err) => {
      // Provide more detailed error information in the UI to aid debugging.
      try {
        const msg = err && err.message ? err.message : String(err);
        statusEl.textContent = 'Error: ' + msg;
      } catch (e) {
        statusEl.textContent = 'Error loading chess engine.';
      }
      console.error(err);
    });
});