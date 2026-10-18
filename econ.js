// Economia pura do Ascensão Infinita (sem DOM). É embutida no HTML e também roda no robô de testes (node).
const ECON=(()=>{'use strict';
const CAP=1e300, RB_MIN=1e40;
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
 {k:'g2x',x:0,y:3,icon:'lamp',name:'Chama Dupla',cost:20,needs:['g1x'],desc:'Lamparinas e Lunetas produzem ×5.'},
 {k:'galaxyCheap',x:1,y:3,icon:'orbit',name:'Atalho Galáctico',cost:25,needs:['g1x','cascade'],desc:'Galáxias pedem 20 Estações Orbitais a menos.'},
 {k:'autoExp',x:3,y:3,icon:'rocket',name:'Robô Piloto',cost:30,needs:['auto2','autoTick'],desc:'Faz Expansões e Galáxias sozinho.'},
 {k:'starBoost',x:5,y:3,icon:'star',name:'Brilho Acumulado',cost:20,needs:['momentum'],desc:'O bônus das Estrelas ganhas fica mais forte (potência 0,7 em vez de 0,5).'},
 {k:'attractor',x:6,y:3,icon:'comet',name:'Atrator de Meteoros',cost:15,needs:['momentum'],desc:'Chuvas de meteoros vêm 2× mais e valem ×5 em vez de ×3.'},
 {k:'workshop',x:0,y:4,icon:'hammer',name:'Oficina Estelar',cost:150,needs:['g2x','galaxyCheap'],desc:'Libera a Oficina: melhorias sem fim compradas com Estrelas.'},
 {k:'headStart',x:2,y:4,icon:'rocket',name:'Começo Rápido',cost:80,needs:['galaxyCheap'],desc:'Toda vida e toda Galáxia já começam com 4 Expansões.'},
 {k:'chal',x:4,y:4,icon:'flag',name:'Portal dos Desafios',cost:60,needs:['autoExp'],desc:'Libera os Desafios: vidas difíceis com prêmios para sempre.'},
 {k:'forge',x:6,y:4,icon:'star',name:'Forja Estelar',cost:100,needs:['starBoost'],desc:'Renascer dá o dobro de Estrelas.'},
 {k:'tick2',x:1,y:5,icon:'bolt',name:'Galáxias Densas',cost:300,needs:['headStart'],desc:'Cada Galáxia melhora a Velocidade em +0,03 em vez de +0,02.'},
 {k:'autoRb',x:3,y:5,icon:'refresh',name:'Robô Fênix',cost:400,needs:['chal'],desc:'Renasce sozinho quando ganharia 10% das Estrelas que você já juntou, ou quando chegar no limite do universo.'},
 {k:'research',x:5,y:5,icon:'flask',name:'Laboratório',cost:250,needs:['forge'],desc:'Libera as Pesquisas: melhoram sozinhas com o tempo, até offline.'},
 {k:'tick3',x:0,y:6,icon:'clock',name:'Engrenagem Mestra',cost:1500,needs:['tick2','workshop'],desc:'Velocidade +0,03 para sempre.'},
 {k:'supernova',x:3,y:6,icon:'sun',name:'Coração da Estrela',cost:3000,needs:['autoRb','tick2','research'],desc:'Libera a Supernova, o renascimento gigante.'},
 {k:'deepLab',x:6,y:6,icon:'flask',name:'Laboratório Profundo',cost:2000,needs:['research','forge'],desc:'Pesquisas andam 50% mais rápido.'}
];
const ROBOTS=['auto1','auto2','autoTick','autoExp','autoRb'];
// tier 1 pede o Portal; tier 2 pede 3 Supernovas
const CH=[
 {id:'noTick',tier:1,goal:1e120,name:'Relógio Parado',rule:'Velocidade não pode ser comprada.',reward:'Velocidade +0,01 para sempre.'},
 {id:'four',tier:1,goal:1e70,name:'Só Quatro',rule:'Só existem os 4 primeiros geradores.',reward:'Expansões pedem 5 geradores a menos.'},
 {id:'noExp',tier:1,goal:1e200,name:'Sem Expansão',rule:'Expansões liberam geradores, mas não dão bônus.',reward:'Faíscas produzem ×1.000.'},
 {id:'dark',tier:1,goal:1e180,name:'Escuridão',rule:'Faíscas produzem 100 milhões de vezes menos.',reward:'Todo o ganho ×5.'},
 {id:'costly',tier:1,goal:1e220,name:'Inflação',rule:'Os preços sobem 100× mais rápido a cada 10 compras.',reward:'Os preços sobem mais devagar a cada 10 compras.'},
 {id:'noStars',tier:1,goal:1e250,name:'Céu Apagado',rule:'O bônus das Estrelas fica desligado.',reward:'O bônus das Estrelas fica ainda mais forte (+0,1 de potência).'},
 {id:'oneGal',tier:1,goal:1e270,name:'Galáxia Distante',rule:'Cada Galáxia pede o dobro de Estações Orbitais.',reward:'Você ganha 1 Galáxia grátis para sempre.'},
 {id:'noAuto',tier:1,goal:1e300,name:'Sem Robôs',rule:'Todos os robôs ficam desligados.',reward:'Renascer dá +50% Estrelas.'},
 {id:'six',tier:2,goal:1e280,name:'Cascata Curta',rule:'Só existem os 6 primeiros geradores.',reward:'A cascata fica mais forte: +0,05.'},
 {id:'frozen',tier:2,goal:1e260,name:'Universo Congelado',rule:'Sem Velocidade e sem Galáxias.',reward:'Velocidade +0,02 para sempre.'},
 {id:'weak',tier:2,goal:1e290,name:'Estrelas Fracas',rule:'O bônus das Estrelas fica bem mais fraco.',reward:'Renascer dá ×3 Estrelas.'},
 {id:'tiny',tier:2,goal:1e300,name:'Universo Pequeno',rule:'Expansões sem bônus e Faíscas 1 milhão de vezes mais fracas.',reward:'Supernova dá ×2 Poeira.'}
];
const LAB=[
 {id:'gen',icon:'sparkles',name:'Lentes Polidas',base:2,desc:'Todos os geradores ×1,25 por nível.'},
 {id:'tick',icon:'bolt',name:'Relógio Atômico',base:4,desc:'Velocidade +0,005 por nível.'},
 {id:'star',icon:'star',name:'Astroquímica',base:6,desc:'Renascer dá +10% Estrelas por nível.'},
 {id:'off',icon:'moon',name:'Turno da Noite',base:3,max:5,desc:'+10% de ganho offline por nível.'},
 {id:'exp',icon:'layers',name:'Mapa Estelar',base:8,desc:'Cada Expansão vale +0,1 a mais por nível.'},
 {id:'casc',icon:'station',name:'Fluxo em Cascata',base:30,max:10,desc:'Cada gerador produz +1% a mais do gerador de baixo por nível.'},
 {id:'dust',icon:'comet',name:'Coleta de Poeira',base:15,desc:'Supernova dá +10% Poeira por nível.',needSN:true},
 {id:'bh',icon:'galaxy',name:'Gravidade Extrema',base:20,desc:'O Buraco Negro fica 10% mais forte por nível.',needBH:true}
];
const CONS=[
 {id:'gen',icon:'sparkles',name:'Constelação do Fogo',max:50,price:l=>Math.ceil(2*4**l),desc:'Todos os geradores ×10 por nível.'},
 {id:'star',icon:'star',name:'Constelação da Coroa',max:30,price:l=>3*5**l,desc:'Renascer dá ×1,5 Estrelas por nível.'},
 {id:'tick',icon:'bolt',name:'Constelação do Relógio',max:20,price:l=>3*4**l,desc:'Velocidade +0,01 por nível.'},
 {id:'dust',icon:'comet',name:'Constelação do Cometa',max:20,price:l=>10*5**l,desc:'Supernova dá ×1,25 Poeira por nível.'},
 {id:'slot',icon:'flask',name:'Constelação do Sábio',max:2,price:l=>10*5**l,desc:'+1 pesquisa ao mesmo tempo por nível.'},
 {id:'start',icon:'rocket',name:'Constelação da Partida',max:1,price:()=>15,desc:'Depois da Supernova, começa com 1.000 Estrelas.'},
 {id:'off',icon:'moon',name:'Constelação da Lua',max:1,price:()=>20,desc:'Com o jogo fechado você ganha 100%, por até 24 horas.'},
 {id:'keep',icon:'scroll',name:'Constelação da Memória',max:1,price:()=>20,desc:'A Supernova não apaga mais a árvore de Estrelas.'},
 {id:'bh',icon:'galaxy',name:'Constelação do Abismo',max:1,price:()=>30,desc:'Libera o Buraco Negro, que acelera o tempo de vez em quando.'},
 {id:'bang',icon:'nova',name:'Big Bang',max:1,price:()=>3e5,desc:'O FINAL: cria um universo novo. Você vence o jogo (e pode continuar jogando). Todo o ganho ×1e10.'}
];
// Oficina Estelar: melhorias sem fim compradas com Estrelas
const WORK=[
 {id:'gen',icon:'sparkles',name:'Forja de Geradores',max:1e4,price:l=>200*4**l,desc:'Todos os geradores ×3 por nível.'},
 {id:'star',icon:'star',name:'Prensa de Estrelas',max:1e4,price:l=>1000*6**l,desc:'Renascer dá ×1,5 Estrelas por nível.'},
 {id:'tick',icon:'bolt',name:'Torno de Precisão',max:20,price:l=>500*5**l,desc:'Velocidade +0,01 por nível.'},
 {id:'exp',icon:'expand',name:'Alargador',max:20,price:l=>300*5**l,desc:'Cada Expansão vale +0,25 a mais por nível.'},
 {id:'casc',icon:'station',name:'Bomba de Cascata',max:10,price:l=>5000*20**l,desc:'Cada gerador produz +5% a mais do gerador de baixo por nível.'}
];
const BHUP=[
 {id:'pow',name:'Massa',max:30,price:l=>5*3**l,desc:'O tempo acelera +2× a mais.'},
 {id:'dur',name:'Horizonte',max:20,price:l=>8*3**l,desc:'Fica ativo +2 segundos.'},
 {id:'per',name:'Rotação',max:15,price:l=>10*3**l,desc:'Ativa 10% mais vezes.'}
];
const MILES=[
 {n:1,desc:'Os robôs da árvore continuam depois de cada Supernova.'},
 {n:3,desc:'Libera os Desafios da Supernova.'},
 {n:5,desc:'+1 vaga no Laboratório.'},
 {n:10,desc:'Robô Supernova: explode sozinho quando chega no limite.'},
 {n:25,desc:'Pesquisas andam 2× mais rápido.'},
 {n:50,desc:'Supernova dá ×2 Poeira.'}
];

const zeros=()=>GENS.map(()=>0);
const map0=a=>Object.fromEntries(a.map(x=>[x.id,0]));
function fresh(now=Date.now()){return {v:8,points:10,amt:zeros(),bought:zeros(),tick:0,exp:0,gal:0,runTime:0,
 stars:0,starsTotal:0,starsLife:0,rebirths:0,perm:Object.fromEntries(TREE.map(t=>[t.k,false])),chDone:[],chActive:null,
 dust:0,dustTotal:0,supernovas:0,cons:map0(CONS),work:map0(WORK),bh:{lv:map0(BHUP),t:0},
 lab:{lv:map0(LAB),prog:map0(LAB),active:[]},
 ach:[],best:0,bestRate:0,total:0,played:0,fastest:0,meteors:0,meteorNext:now+300000,meteorUntil:0,hist:[],seenHelp:false,lastTick:now}}

const ch=s=>s.chActive, won=(s,id)=>s.chDone.includes(id), mile=(s,n)=>s.supernovas>=n;
const robotsOn=s=>ch(s)!=='noAuto';
const meteorOn=(s,now=Date.now())=>now<s.meteorUntil;
const meteorMul=s=>s.perm.attractor?5:3;
const unlockedGens=s=>ch(s)==='four'?4:Math.min(ch(s)==='six'?6:8,4+s.exp);
const galaxies=s=>ch(s)==='frozen'?0:s.gal+(won(s,'oneGal')?1:0);
const noTick=s=>ch(s)==='noTick'||ch(s)==='frozen';
function tickBase(s){return (s.perm.tickA?1.15:1.125)+galaxies(s)*(s.perm.tick2?.03:.02)+(won(s,'noTick')?.01:0)+(won(s,'frozen')?.02:0)+(s.perm.tick3?.03:0)+s.lab.lv.tick*.005+s.cons.tick*.01+s.work.tick*.01}
function expMult(s){return ch(s)==='noExp'||ch(s)==='tiny'?1:(s.perm.cascade?2.5:2)+s.lab.lv.exp*.1+s.work.exp*.25}
function cascade(s){return .5+s.work.casc*.05+s.lab.lv.casc*.01+(won(s,'six')?.05:0)}
function starPow(s){return ch(s)==='weak'?.2:(s.perm.starBoost?.7:.5)+(won(s,'noStars')?.1:0)}
function starBonus(s){return ch(s)==='noStars'?1:Math.pow(1+s.starsTotal,starPow(s))}
// Buraco Negro: a cada "período" segundos, fica ativo "duração" segundos acelerando o tempo
const bhOpen=s=>s.cons.bh>0;
const bhPower=s=>(5+2*s.bh.lv.pow)*(1+s.lab.lv.bh*.1);
const bhDur=s=>10+2*s.bh.lv.dur;
const bhPeriod=s=>Math.max(30,120*Math.pow(.9,s.bh.lv.per));
const bhActive=s=>bhOpen(s)&&(s.bh.t%bhPeriod(s))<bhDur(s);
// fatores globais com rótulo, para a tela "Seu ganho, explicado"
function factors(s,now=Date.now()){const f=[];const p=s.perm;
 f.push(['Velocidade ('+s.tick+'×)',Math.pow(tickBase(s),s.tick)]);
 if(s.exp)f.push(['Expansões ('+s.exp+')',Math.pow(expMult(s),s.exp)]);
 if(p.seed)f.push(['Semente Eterna',2]);
 f.push(['Estrelas juntadas',starBonus(s)]);
 if(s.ach.length)f.push(['Conquistas ('+s.ach.length+')',1+s.ach.length*.05]);
 if(s.work.gen)f.push(['Oficina: Forja de Geradores',Math.pow(3,s.work.gen)]);
 if(s.lab.lv.gen)f.push(['Pesquisa: Lentes Polidas',Math.pow(1.25,s.lab.lv.gen)]);
 if(s.cons.gen)f.push(['Constelação do Fogo',Math.pow(10,s.cons.gen)]);
 if(s.dustTotal)f.push(['Poeira Estelar juntada',1+s.dustTotal]);
 if(s.cons.bang)f.push(['Big Bang',1e10]);
 if(won(s,'dark'))f.push(['Prêmio: Escuridão',5]);
 if(p.momentum)f.push(['Impulso',1+s.runTime/60]);
 if(meteorOn(s,now))f.push(['Chuva de meteoros',meteorMul(s)]);
 return f.filter(x=>x[1]!==1)}
function globalMult(s,now){let m=1;for(const [,v] of factors(s,now))m*=v;return m}
function genSelf(s,k){let m=Math.pow(2,Math.floor(s.bought[k]/10));
 if(k===0){if(s.perm.g1x)m*=10;if(won(s,'noExp'))m*=1e3;if(ch(s)==='dark')m*=1e-8;if(ch(s)==='tiny')m*=1e-6}
 if((k===1||k===2)&&s.perm.g2x)m*=5;return m}
function genMult(s,k,g){return Math.min(CAP,genSelf(s,k)*g)}
function rate(s,now){return Math.min(CAP,s.amt[0]*genMult(s,0,globalMult(s,now)))}
function genStep(s,k){const st=GENS[k].step*(ch(s)==='costly'?100:1);return won(s,'costly')?Math.pow(st,.9):st}
function genPrice(s,k,b=s.bought[k]){return GENS[k].base*Math.pow(genStep(s,k),Math.floor(b/10))}
const tickPrice=s=>1e3*Math.pow(10,s.tick);
function expNeed(s){const u=unlockedGens(s),c=won(s,'four')?5:0,top=ch(s)==='four'?4:ch(s)==='six'?6:8;
 if(u<top)return {gen:u-1,n:20-c};return {gen:top-1,n:20+15*(s.exp-(top-4))-c}}
function galNeed(s){return Math.max(20,80+(ch(s)==='oneGal'?120:60)*s.gal-(s.perm.galaxyCheap?20:0))}
const canExpand=s=>{const e=expNeed(s);return s.bought[e.gen]>=e.n};
const canGalaxy=s=>!['four','six','frozen'].includes(ch(s))&&unlockedGens(s)===8&&s.bought[7]>=galNeed(s);
function starMul(s){return (s.perm.forge?2:1)*(1+s.lab.lv.star*.1)*Math.pow(1.5,s.cons.star)*Math.pow(1.5,s.work.star)*(won(s,'noAuto')?1.5:1)*(won(s,'weak')?3:1)}
function starGain(s){if(s.points<RB_MIN)return 0;return Math.floor(Math.pow(Math.log10(Math.min(s.points,CAP))/40,2)*starMul(s))}
const nextStarAt=s=>{const want=starGain(s)+1;return Math.pow(10,40*Math.sqrt(want/starMul(s)))};
const canSupernova=s=>s.perm.supernova&&s.points>=CAP&&!ch(s);
function dustMul(s){return (1+s.lab.lv.dust*.1)*Math.pow(1.25,s.cons.dust)*(won(s,'tiny')?2:1)*(mile(s,50)?2:1)}
function dustGain(s){return Math.floor(Math.pow(s.starsLife/20,.35)*dustMul(s))}
const offlinePct=s=>s.cons.off?1:Math.min(1,(s.perm.off1?.5:0)+s.lab.lv.off*.1);
const offlineHours=s=>s.cons.off?24:8;
const labSlots=s=>s.perm.research?1+s.cons.slot+(mile(s,5)?1:0):0;
const labSpeed=s=>(s.perm.deepLab?1.5:1)*(mile(s,25)?2:1);
const labDur=(r,l)=>r.base*60*Math.pow(1.5,l);
const labLocked=(s,r)=>(r.needSN&&!s.supernovas)||(r.needBH&&!bhOpen(s));

// ---------- avanço do tempo ----------
function step(s,dt,now=Date.now()){let dte=dt;if(bhOpen(s)){if(bhActive(s))dte=dt*bhPower(s);s.bh.t+=dt}
 const g=globalMult(s,now),u=unlockedGens(s),c=cascade(s);
 for(let k=u-1;k>=1;k--)s.amt[k-1]=Math.min(CAP,s.amt[k-1]+s.amt[k]*genMult(s,k,g)*c*dte);
 const r=Math.min(CAP,s.amt[0]*genMult(s,0,g));s.points=Math.min(CAP,s.points+r*dte);s.total=Math.min(CAP,s.total+r*dte);
 s.runTime+=dt;s.played+=dt;if(s.points>s.best)s.best=s.points;if(r>s.bestRate)s.bestRate=r;return r}
function labStep(s,dt){const done=[],sp=labSpeed(s);for(const id of s.lab.active.slice(0,labSlots(s))){const r=LAB.find(x=>x.id===id);if((r.max&&s.lab.lv[id]>=r.max)||labLocked(s,r))continue;s.lab.prog[id]+=dt*sp;
 while(s.lab.prog[id]>=labDur(r,s.lab.lv[id])&&!(r.max&&s.lab.lv[id]>=r.max)){s.lab.prog[id]-=labDur(r,s.lab.lv[id]);s.lab.lv[id]++;done.push(r)}}return done}

// ---------- compras ----------
function planGen(s,k,budget=s.points){if(k>=unlockedGens(s))return {n:0,cost:0};let n=0,cost=0,b=s.bought[k];
 for(let i=0;i<400;i++){const p=genPrice(s,k,b),left=10-b%10,can=Math.min(left,Math.floor((budget-cost)/p));if(can<=0)break;n+=can;cost+=can*p;b+=can;if(can<left)break}return {n,cost}}
function buyGen(s,k){const p=planGen(s,k);if(!p.n)return 0;s.points-=p.cost;s.amt[k]+=p.n;s.bought[k]+=p.n;return p.n}
function planTick(s){if(noTick(s))return {n:0,cost:0};let n=0,cost=0;while(n<500){const p=1e3*Math.pow(10,s.tick+n);if(cost+p>s.points)break;cost+=p;n++}return {n,cost}}
function buyTick(s){const p=planTick(s);if(!p.n)return 0;s.points-=p.cost;s.tick+=p.n;return p.n}
function resetLife(s){s.points=10;s.amt=zeros();s.bought=zeros();s.tick=0;s.runTime=0}
function expand(s){if(!canExpand(s))return false;s.exp++;resetLife(s);return true}
function galaxy(s){if(!canGalaxy(s))return false;s.gal++;s.exp=s.perm.headStart?4:0;resetLife(s);return true}
const chGoal=s=>s.chActive?CH.find(c=>c.id===s.chActive).goal:RB_MIN;
function chOpen(s,c){const tier=CH.filter(x=>x.tier===c.tier),i=tier.indexOf(c);if(c.tier===1&&!s.perm.chal)return false;if(c.tier===2&&!mile(s,3))return false;return i===0||won(s,tier[i-1].id)}
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
function planWork(s,id){const w=WORK.find(x=>x.id===id);if(!w||!s.perm.workshop)return {n:0,cost:0};let n=0,cost=0;while(s.work[id]+n<w.max&&n<200){const p=w.price(s.work[id]+n);if(cost+p>s.stars)break;cost+=p;n++}return {n,cost}}
function buyWork(s,id){const p=planWork(s,id);if(!p.n)return 0;s.stars-=p.cost;s.work[id]+=p.n;return p.n}
function buyBH(s,id){const u=BHUP.find(x=>x.id===id);if(!u||!bhOpen(s))return false;const l=s.bh.lv[id];if(l>=u.max||s.dust<u.price(l))return false;s.dust-=u.price(l);s.bh.lv[id]++;return true}
function setLab(s,id){const r=LAB.find(x=>x.id===id);if(!r||!labSlots(s)||labLocked(s,r))return false;if(s.lab.active.includes(id)){s.lab.active=s.lab.active.filter(x=>x!==id);return true}
 s.lab.active.push(id);while(s.lab.active.length>labSlots(s))s.lab.active.shift();return true}

// robôs (rodam a cada passo)
function autoRun(s){if(!robotsOn(s))return null;const p=s.perm;
 if(mile(s,10)&&canSupernova(s))return {nova:supernova(s)};
 if(p.autoExp){if(canGalaxy(s))galaxy(s);else if(canExpand(s))expand(s)}
 if(p.autoTick)buyTick(s);
 for(let k=unlockedGens(s)-1;k>=0;k--){if((k>=4&&p.auto2)||(k<4&&p.auto1))buyGen(s,k)}
 if(s.chActive&&canRebirth(s))return rebirth(s);
 if(p.autoRb&&!s.chActive&&s.points>=RB_MIN&&!canSupernova(s)){const g=starGain(s);if(s.points>=CAP||g>=Math.max(1,s.starsTotal*.1))return rebirth(s)}
 return null}

return {chGoal,chOpen,canRebirth,CAP,RB_MIN,GENS,TREE,CH,LAB,CONS,WORK,BHUP,MILES,ROBOTS,fresh,ch,won,mile,robotsOn,meteorOn,meteorMul,unlockedGens,galaxies,noTick,tickBase,expMult,cascade,starBonus,starPow,
 bhOpen,bhPower,bhDur,bhPeriod,bhActive,factors,globalMult,genSelf,genMult,rate,genPrice,tickPrice,
 expNeed,galNeed,canExpand,canGalaxy,starMul,starGain,nextStarAt,canSupernova,dustMul,dustGain,offlinePct,offlineHours,labSlots,labSpeed,labDur,labLocked,step,labStep,planGen,buyGen,planTick,buyTick,resetLife,expand,galaxy,rebirth,nodeState,buyNode,
 startChallenge,quitChallenge,supernova,buyCons,planWork,buyWork,buyBH,setLab,autoRun};
})();
if(typeof module!=='undefined')module.exports=ECON;
