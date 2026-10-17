// Economia pura do Ascensão Infinita (sem DOM). É embutida no HTML e também roda no robô de testes (node).
const ECON=(()=>{'use strict';
const CAP=1e300, RB_MIN=1e40, CASCADE=0.5;
const GENS=[
 {name:'Faísca',plural:'Faíscas',icon:'sparkles',base:10,step:1e3},
 {name:'Lamparina',plural:'Lamparinas',icon:'lamp',base:100,step:1e4},
 {name:'Luneta',plural:'Lunetas',icon:'spyglass',base:1e4,step:1e5},
 {name:'Telescópio',plural:'Telescópios',icon:'telescope',base:1e6,step:1e6},
 {name:'Observatório',plural:'Observatórios',icon:'dome',base:1e9,step:1e8},
 {name:'Radiotelescópio',plural:'Radiotelescópios',icon:'dish',base:1e13,step:1e10},
 {name:'Satélite',plural:'Satélites',icon:'satellite',base:1e18,step:1e12},
 {name:'Estação Orbital',plural:'Estações Orbitais',icon:'station',base:1e24,step:1e15}
];
// árvore de Estrelas: x = coluna (0..6), y = linha (0..6)
const TREE=[
 {k:'seed',x:3,y:0,icon:'sprout',name:'Semente Eterna',cost:1,needs:[],desc:'Todos os geradores ×2.'},
 {k:'tickA',x:1,y:1,icon:'bolt',name:'Engrenagem Fina',cost:2,needs:['seed'],desc:'Cada Velocidade vale ×1,15 em vez de ×1,125.'},
 {k:'auto1',x:3,y:1,icon:'cpu',name:'Robô Aprendiz',cost:2,needs:['seed'],desc:'Compra Faíscas, Lamparinas, Lunetas e Telescópios sozinho.'},
 {k:'off1',x:5,y:1,icon:'moon',name:'Sono Produtivo',cost:2,needs:['seed'],desc:'Com o jogo fechado, você ganha 50% do normal (até 8 horas).'},
 {k:'g1x',x:0,y:2,icon:'sparkles',name:'Faísca Brilhante',cost:5,needs:['tickA'],desc:'Faíscas produzem ×10.'},
 {k:'cascade',x:2,y:2,icon:'layers',name:'Expansão Forte',cost:8,needs:['tickA'],desc:'Cada Expansão dá ×2,5 em vez de ×2.'},
 {k:'auto2',x:3,y:2,icon:'factory',name:'Robô Engenheiro',cost:6,needs:['auto1'],desc:'Compra os 4 geradores maiores sozinho.'},
 {k:'autoTick',x:4,y:2,icon:'cog',name:'Robô Relojoeiro',cost:4,needs:['auto1'],desc:'Compra Velocidade sozinho.'},
 {k:'momentum',x:6,y:2,icon:'hourglass',name:'Impulso',cost:6,needs:['off1'],desc:'Quanto mais tempo na vida atual, mais você ganha: ×(1 + minutos).'},
 {k:'galaxyCheap',x:1,y:3,icon:'orbit',name:'Atalho Galáctico',cost:25,needs:['g1x','cascade'],desc:'Galáxias pedem 20 Estações Orbitais a menos.'},
 {k:'autoExp',x:3,y:3,icon:'rocket',name:'Robô Piloto',cost:30,needs:['auto2','autoTick'],desc:'Faz Expansões e Galáxias sozinho.'},
 {k:'starBoost',x:5,y:3,icon:'star',name:'Brilho Acumulado',cost:20,needs:['momentum'],desc:'O bônus das Estrelas ganhas fica mais forte (potência 0,7 em vez de 0,5).'},
 {k:'headStart',x:2,y:4,icon:'rocket',name:'Começo Rápido',cost:80,needs:['galaxyCheap'],desc:'Toda vida e toda Galáxia já começam com 4 Expansões.'},
 {k:'chal',x:4,y:4,icon:'flag',name:'Portal dos Desafios',cost:60,needs:['autoExp'],desc:'Libera os Desafios: vidas difíceis com prêmios para sempre.'},
 {k:'forge',x:6,y:4,icon:'hammer',name:'Forja Estelar',cost:100,needs:['starBoost'],desc:'Renascer dá o dobro de Estrelas.'},
 {k:'tick2',x:1,y:5,icon:'bolt',name:'Galáxias Densas',cost:300,needs:['headStart'],desc:'Cada Galáxia melhora a Velocidade em +0,03 em vez de +0,02.'},
 {k:'autoRb',x:3,y:5,icon:'refresh',name:'Robô Fênix',cost:400,needs:['chal'],desc:'Renasce sozinho quando ganharia 10% das Estrelas que você já juntou, ou quando chegar no limite do universo.'},
 {k:'research',x:5,y:5,icon:'flask',name:'Laboratório',cost:250,needs:['forge'],desc:'Libera as Pesquisas: melhoram sozinhas com o tempo, até offline.'},
 {k:'supernova',x:3,y:6,icon:'sun',name:'Coração da Estrela',cost:3000,needs:['autoRb','tick2','research'],desc:'Libera a Supernova, o renascimento gigante.'}
];
const ROBOTS=['auto1','auto2','autoTick','autoExp','autoRb'];
const CH=[
 {id:'noTick',goal:1e80,name:'Relógio Parado',rule:'Velocidade não pode ser comprada.',reward:'Velocidade +0,01 para sempre.'},
 {id:'four',goal:1e60,name:'Só Quatro',rule:'Só existem os 4 primeiros geradores.',reward:'Expansões pedem 5 geradores a menos.'},
 {id:'noExp',goal:1e150,name:'Sem Expansão',rule:'Expansões liberam geradores, mas não dão bônus.',reward:'Faíscas produzem ×1.000.'},
 {id:'dark',goal:1e180,name:'Escuridão',rule:'Faíscas produzem 10.000× menos.',reward:'Todo o ganho ×5.'},
 {id:'costly',goal:1e200,name:'Inflação',rule:'Os preços sobem 10× mais rápido a cada 10 compras.',reward:'Os preços sobem mais devagar a cada 10 compras.'},
 {id:'noStars',goal:1e230,name:'Céu Apagado',rule:'O bônus das Estrelas fica desligado.',reward:'O bônus das Estrelas fica ainda mais forte (+0,1 de potência).'},
 {id:'oneGal',goal:1e260,name:'Galáxia Distante',rule:'Cada Galáxia pede o dobro de Estações Orbitais.',reward:'Você ganha 1 Galáxia grátis para sempre.'},
 {id:'noAuto',goal:1e290,name:'Sem Robôs',rule:'Todos os robôs ficam desligados.',reward:'Renascer dá +50% Estrelas.'}
];
const LAB=[
 {id:'gen',icon:'sparkles',name:'Lentes Polidas',base:2,desc:'Todos os geradores ×1,25 por nível.'},
 {id:'tick',icon:'bolt',name:'Relógio Atômico',base:4,desc:'Velocidade +0,005 por nível.'},
 {id:'star',icon:'star',name:'Astroquímica',base:6,desc:'Renascer dá +10% Estrelas por nível.'},
 {id:'off',icon:'moon',name:'Turno da Noite',base:3,max:5,desc:'+10% de ganho offline por nível.'},
 {id:'exp',icon:'layers',name:'Mapa Estelar',base:8,desc:'Cada Expansão vale +0,1 a mais por nível.'},
 {id:'dust',icon:'comet',name:'Coleta de Poeira',base:15,desc:'Supernova dá +10% Poeira por nível.',needSN:true}
];
const CONS=[
 {id:'gen',icon:'sparkles',name:'Constelação do Fogo',max:50,price:l=>3**l,desc:'Todos os geradores ×10 por nível.'},
 {id:'star',icon:'star',name:'Constelação da Coroa',max:30,price:l=>2*3**l,desc:'Renascer dá ×2 Estrelas por nível.'},
 {id:'tick',icon:'bolt',name:'Constelação do Relógio',max:20,price:l=>3*4**l,desc:'Velocidade +0,01 por nível.'},
 {id:'slot',icon:'flask',name:'Constelação do Sábio',max:2,price:l=>10*5**l,desc:'+1 pesquisa ao mesmo tempo por nível.'},
 {id:'keep',icon:'scroll',name:'Constelação da Memória',max:1,price:()=>25,desc:'A Supernova não apaga mais a árvore de Estrelas.'},
 {id:'start',icon:'rocket',name:'Constelação da Partida',max:1,price:()=>15,desc:'Depois da Supernova, começa com 1.000 Estrelas.'}
];

const zeros=()=>GENS.map(()=>0);
function fresh(now=Date.now()){return {v:7,points:10,amt:zeros(),bought:zeros(),tick:0,exp:0,gal:0,runTime:0,
 stars:0,starsTotal:0,starsLife:0,rebirths:0,perm:Object.fromEntries(TREE.map(t=>[t.k,false])),chDone:[],chActive:null,
 dust:0,dustTotal:0,supernovas:0,cons:Object.fromEntries(CONS.map(c=>[c.id,0])),
 lab:{lv:Object.fromEntries(LAB.map(r=>[r.id,0])),prog:Object.fromEntries(LAB.map(r=>[r.id,0])),active:[]},
 ach:[],best:0,bestRate:0,total:0,played:0,fastest:0,meteors:0,meteorNext:now+300000,meteorUntil:0,hist:[],seenHelp:false,lastTick:now}}

const ch=s=>s.chActive, won=(s,id)=>s.chDone.includes(id);
const robotsOn=s=>ch(s)!=='noAuto';
const meteorOn=(s,now=Date.now())=>now<s.meteorUntil;
const unlockedGens=s=>ch(s)==='four'?4:Math.min(8,4+s.exp);
const galaxies=s=>s.gal+(won(s,'oneGal')?1:0);
function tickBase(s){return (s.perm.tickA?1.15:1.125)+galaxies(s)*(s.perm.tick2?.03:.02)+(won(s,'noTick')?.01:0)+s.lab.lv.tick*.005+s.cons.tick*.01}
function expMult(s){return ch(s)==='noExp'?1:(s.perm.cascade?2.5:2)+s.lab.lv.exp*.1}
function starPow(s){return (s.perm.starBoost?.7:.5)+(won(s,'noStars')?.1:0)}
function starBonus(s){return ch(s)==='noStars'?1:Math.pow(1+s.starsTotal,starPow(s))}
// fatores globais com rótulo, para a tela "Seu ganho, explicado"
function factors(s,now=Date.now()){const f=[];const p=s.perm;
 f.push(['Velocidade ('+s.tick+'×)',Math.pow(tickBase(s),s.tick)]);
 if(s.exp)f.push(['Expansões ('+s.exp+')',Math.pow(expMult(s),s.exp)]);
 if(p.seed)f.push(['Semente Eterna',2]);
 f.push(['Estrelas juntadas',starBonus(s)]);
 if(s.ach.length)f.push(['Conquistas ('+s.ach.length+')',1+s.ach.length*.05]);
 if(s.lab.lv.gen)f.push(['Pesquisa: Lentes Polidas',Math.pow(1.25,s.lab.lv.gen)]);
 if(s.cons.gen)f.push(['Constelação do Fogo',Math.pow(10,s.cons.gen)]);
 if(s.dustTotal)f.push(['Poeira Estelar juntada',1+s.dustTotal]);
 if(won(s,'dark'))f.push(['Prêmio: Escuridão',5]);
 if(p.momentum)f.push(['Impulso',1+s.runTime/60]);
 if(meteorOn(s,now))f.push(['Chuva de meteoros',3]);
 return f.filter(x=>x[1]!==1)}
function globalMult(s,now){let m=1;for(const [,v] of factors(s,now))m*=v;return m}
function genSelf(s,k){let m=Math.pow(2,Math.floor(s.bought[k]/10));if(k===0){if(s.perm.g1x)m*=10;if(won(s,'noExp'))m*=1e3;if(ch(s)==='dark')m*=1e-4}return m}
function genMult(s,k,g){return Math.min(CAP,genSelf(s,k)*g)}
function rate(s,now){return Math.min(CAP,s.amt[0]*genMult(s,0,globalMult(s,now)))}
function genStep(s,k){const st=GENS[k].step*(ch(s)==='costly'?10:1);return won(s,'costly')?Math.pow(st,.9):st}
function genPrice(s,k,b=s.bought[k]){return GENS[k].base*Math.pow(genStep(s,k),Math.floor(b/10))}
const tickPrice=s=>1e3*Math.pow(10,s.tick);
function expNeed(s){const u=unlockedGens(s),c=won(s,'four')?5:0;if(ch(s)==='four')return {gen:3,n:20+15*s.exp-c};return u<8?{gen:u-1,n:20-c}:{gen:7,n:20+15*(s.exp-4)-c}}
function galNeed(s){return Math.max(20,80+(ch(s)==='oneGal'?120:60)*s.gal-(s.perm.galaxyCheap?20:0))}
const canExpand=s=>{const e=expNeed(s);return s.bought[e.gen]>=e.n};
const canGalaxy=s=>ch(s)!=='four'&&unlockedGens(s)===8&&s.bought[7]>=galNeed(s);
function starMul(s){return (s.perm.forge?2:1)*(1+s.lab.lv.star*.1)*Math.pow(2,s.cons.star)*(won(s,'noAuto')?1.5:1)}
function starGain(s){if(s.points<RB_MIN)return 0;return Math.floor(Math.pow(Math.log10(Math.min(s.points,CAP))/40,2)*starMul(s))}
const nextStarAt=s=>{const want=starGain(s)+1;return Math.pow(10,40*Math.sqrt(want/starMul(s)))};
const canSupernova=s=>s.perm.supernova&&s.points>=CAP&&!ch(s);
function dustGain(s){return Math.floor(Math.sqrt(s.starsLife/100)*(1+s.lab.lv.dust*.1))}
const offlinePct=s=>Math.min(1,(s.perm.off1?.5:0)+s.lab.lv.off*.1);
const labSlots=s=>s.perm.research?1+s.cons.slot:0;
const labDur=(r,l)=>r.base*60*Math.pow(1.5,l);

// ---------- avanço do tempo ----------
function step(s,dt,now=Date.now()){const g=globalMult(s,now),u=unlockedGens(s);
 for(let k=u-1;k>=1;k--)s.amt[k-1]=Math.min(CAP,s.amt[k-1]+s.amt[k]*genMult(s,k,g)*CASCADE*dt);
 const r=Math.min(CAP,s.amt[0]*genMult(s,0,g));s.points=Math.min(CAP,s.points+r*dt);s.total=Math.min(CAP,s.total+r*dt);
 s.runTime+=dt;s.played+=dt;if(s.points>s.best)s.best=s.points;if(r>s.bestRate)s.bestRate=r;return r}
function labStep(s,dt){const done=[];for(const id of s.lab.active.slice(0,labSlots(s))){const r=LAB.find(x=>x.id===id);if(r.max&&s.lab.lv[id]>=r.max)continue;s.lab.prog[id]+=dt;
 while(s.lab.prog[id]>=labDur(r,s.lab.lv[id])&&!(r.max&&s.lab.lv[id]>=r.max)){s.lab.prog[id]-=labDur(r,s.lab.lv[id]);s.lab.lv[id]++;done.push(r)}}return done}

// ---------- compras ----------
function planGen(s,k,budget=s.points){if(k>=unlockedGens(s))return {n:0,cost:0};let n=0,cost=0,b=s.bought[k];
 for(let i=0;i<400;i++){const p=genPrice(s,k,b),left=10-b%10,can=Math.min(left,Math.floor((budget-cost)/p));if(can<=0)break;n+=can;cost+=can*p;b+=can;if(can<left)break}return {n,cost}}
function buyGen(s,k){const p=planGen(s,k);if(!p.n)return 0;s.points-=p.cost;s.amt[k]+=p.n;s.bought[k]+=p.n;return p.n}
function planTick(s){if(ch(s)==='noTick')return {n:0,cost:0};let n=0,cost=0;while(n<500){const p=1e3*Math.pow(10,s.tick+n);if(cost+p>s.points)break;cost+=p;n++}return {n,cost}}
function buyTick(s){const p=planTick(s);if(!p.n)return 0;s.points-=p.cost;s.tick+=p.n;return p.n}
function resetLife(s){s.points=10;s.amt=zeros();s.bought=zeros();s.tick=0;s.runTime=0}
function expand(s){if(!canExpand(s))return false;s.exp++;resetLife(s);return true}
function galaxy(s){if(!canGalaxy(s))return false;s.gal++;s.exp=s.perm.headStart?4:0;resetLife(s);return true}
const chGoal=s=>s.chActive?CH.find(c=>c.id===s.chActive).goal:RB_MIN;
const chOpen=(s,c)=>{const i=CH.indexOf(c);return s.perm.chal&&(i===0||won(s,CH[i-1].id))};
const canRebirth=s=>s.points>=chGoal(s);
function rebirth(s){if(!canRebirth(s))return null;const g=starGain(s),wasCh=s.chActive,t=s.runTime;
 if(wasCh&&!won(s,wasCh))s.chDone.push(wasCh);s.chActive=null;
 s.stars+=g;s.starsTotal+=g;s.starsLife+=g;s.rebirths++;if(!s.fastest||t<s.fastest)s.fastest=t;
 s.exp=s.perm.headStart?4:0;s.gal=0;resetLife(s);return {stars:g,challenge:wasCh}}
function nodeState(s,t){if(s.perm[t.k])return 'owned';if(!t.needs.every(n=>s.perm[n]))return 'locked';return s.stars>=t.cost?'can':'open'}
function buyNode(s,k){const t=TREE.find(x=>x.k===k);if(!t||nodeState(s,t)!=='can')return false;s.stars-=t.cost;s.perm[k]=true;if(k==='research'&&!s.lab.active.length)s.lab.active=['gen'];return true}
function startChallenge(s,id){const c=CH.find(x=>x.id===id);if(!c||!chOpen(s,c)||s.chActive)return false;s.chActive=id;s.exp=0;s.gal=0;resetLife(s);return true}
function quitChallenge(s){s.chActive=null;s.exp=s.perm.headStart?4:0;s.gal=0;resetLife(s)}
function supernova(s){if(!canSupernova(s))return 0;const d=dustGain(s);s.dust+=d;s.dustTotal+=d;s.supernovas++;
 s.stars=s.cons.start?1000:0;s.starsTotal=s.stars;s.starsLife=0;s.rebirths=0;
 if(!s.cons.keep)for(const t of TREE)if(!ROBOTS.includes(t.k))s.perm[t.k]=false;
 s.exp=s.perm.headStart?4:0;s.gal=0;resetLife(s);return d}
function buyCons(s,id){const c=CONS.find(x=>x.id===id);const l=s.cons[id];if(!c||l>=c.max||s.dust<c.price(l))return false;s.dust-=c.price(l);s.cons[id]++;return true}
function setLab(s,id){const r=LAB.find(x=>x.id===id);if(!r||!labSlots(s)||(r.needSN&&!s.supernovas))return false;if(s.lab.active.includes(id)){s.lab.active=s.lab.active.filter(x=>x!==id);return true}
 s.lab.active.push(id);while(s.lab.active.length>labSlots(s))s.lab.active.shift();return true}

// robôs (rodam a cada passo)
function autoRun(s){if(!robotsOn(s))return;const p=s.perm;
 if(p.autoExp){if(canGalaxy(s))galaxy(s);else if(canExpand(s)&&(unlockedGens(s)<8||!canGalaxySoon(s)))expand(s)}
 if(p.autoTick)buyTick(s);
 for(let k=unlockedGens(s)-1;k>=0;k--){if((k>=4&&p.auto2)||(k<4&&p.auto1))buyGen(s,k)}
 if(s.chActive&&canRebirth(s))return rebirth(s);
 if(p.autoRb&&!s.chActive&&s.points>=RB_MIN&&!canSupernova(s)){const g=starGain(s);if(s.points>=CAP||g>=Math.max(1,s.starsTotal*.1))return rebirth(s)}
 return null}
function canGalaxySoon(s){return false}

return {chGoal,chOpen,canRebirth,CAP,RB_MIN,CASCADE,GENS,TREE,CH,LAB,CONS,ROBOTS,fresh,ch,won,robotsOn,meteorOn,unlockedGens,galaxies,tickBase,expMult,starBonus,starPow,factors,globalMult,genSelf,genMult,rate,genPrice,tickPrice,
 expNeed,galNeed,canExpand,canGalaxy,starMul,starGain,nextStarAt,canSupernova,dustGain,offlinePct,labSlots,labDur,step,labStep,planGen,buyGen,planTick,buyTick,resetLife,expand,galaxy,rebirth,nodeState,buyNode,
 startChallenge,quitChallenge,supernova,buyCons,setLab,autoRun};
})();
if(typeof module!=='undefined')module.exports=ECON;
