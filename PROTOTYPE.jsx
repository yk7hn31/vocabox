const {useState,useRef,useEffect}=React;

function Icon({name,size=16,color='currentColor',sw=2}){
  const a={stroke:color,strokeWidth:sw,strokeLinecap:'round',strokeLinejoin:'round',fill:'none'};
  const ic={
    'x':       <><line {...a} x1="18" y1="6"  x2="6"    y2="18"/><line {...a} x1="6" y1="6" x2="18" y2="18"/></>,
    'check':   <polyline {...a} points="20 6 9 17 4 12"/>,
    'heart':   <path {...a} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    'cup':     <><polyline {...a} points="16 16 12 12 8 16"/><line {...a} x1="12" y1="12" x2="12" y2="21"/><path {...a} d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    'cr':      <polyline {...a} points="9 18 15 12 9 6"/>,
    'ccw':     <><polyline {...a} points="1 4 1 10 7 10"/><path {...a} d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>,
    'award':   <><circle {...a} cx="12" cy="8" r="7"/><polyline {...a} points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    'pen':     <path {...a} d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>,
    'list':    <><line {...a} x1="8" y1="6"  x2="21" y2="6"/><line {...a} x1="8" y1="12" x2="21" y2="12"/><line {...a} x1="8" y1="18" x2="21" y2="18"/><line {...a} x1="3" y1="6" x2="3.01" y2="6"/><line {...a} x1="3" y1="12" x2="3.01" y2="12"/><line {...a} x1="3" y1="18" x2="3.01" y2="18"/></>,
    'file':    <><path {...a} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline {...a} points="14 2 14 8 20 8"/><line {...a} x1="16" y1="13" x2="8" y2="13"/><line {...a} x1="16" y1="17" x2="8" y2="17"/><line {...a} x1="10" y1="9" x2="8" y2="9"/></>,
    'info':    <><circle {...a} cx="12" cy="12" r="10"/><line {...a} x1="12" y1="16" x2="12" y2="12"/><line {...a} x1="12" y1="8" x2="12.01" y2="8"/></>,
    'zap':     <polygon {...a} fill={color} fillOpacity=".15" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{flexShrink:0}}>{ic[name]||null}</svg>;
}

const parseRow=line=>{const r=[];let c='',q=false;for(const ch of line){if(ch==='"'){q=!q}else if(ch===','&&!q){r.push(c.trim());c=''}else c+=ch}return[...r,c.trim()]};
function parseCSV(txt){
  const rows=txt.trim().split(/\r?\n/).filter(r=>r.trim());
  if(rows.length<2)return{err:'데이터가 부족합니다 (최소 2줄 필요)'};
  const h=parseRow(rows[0]).map(s=>s.toLowerCase().replace(/"/g,'').trim());
  const wi=h.indexOf('word'),pi=h.indexOf('pos'),mi=h.findIndex(s=>s==='meanings'||s==='meaning');
  if(wi<0||mi<0)return{err:'"word"와 "meanings" 컬럼이 필요해요'};
  const items=[];
  for(let i=1;i<rows.length;i++){
    const c=parseRow(rows[i]);
    const word=(c[wi]||'').trim(),pos=pi>=0?(c[pi]||'').trim():'';
    const raw=(c[mi]||'').replace(/^"|"$/g,'').trim();
    const meanings=raw.split(';').map(m=>m.trim()).filter(Boolean);
    if(word&&meanings.length)items.push({word,pos,meanings});
  }
  return items.length?{items}:{err:'파싱된 단어가 없습니다'};
}

const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const norm=s=>s.toLowerCase().trim().replace(/\s+/g,' ');
const FB=['없다','있다','하다','되다','보다','주다','오다','가다'];

function buildQuiz(items){
  const pool=items.map(it=>it.meanings[0]);
  return shuffle(items).map((it,i)=>{
    const correct=it.meanings[0];
    let d=shuffle(pool.filter(m=>m!==correct)).slice(0,3);
    let fi=0;while(d.length<3){const f=FB[fi++%FB.length];if(!d.includes(f)&&f!==correct)d.push(f)}
    return{...it,correct,opts:shuffle([correct,...d])};
  });
}

const SAMPLE=`word,pos,meanings
ubiquitous,형용사,어디에나 있는
ephemeral,형용사,일시적인
ambiguous,형용사,모호한
eloquent,형용사,웅변적인
resilient,형용사,회복력 있는
run,동사,달리다;운영하다;작동하다
run,명사,달리기;연속
bank,명사,은행;강둑
novel,형용사,새로운;참신한
novel,명사,소설`;

function UploadScreen({onStart}){
  const [mode,setMode]=useState('mcq');
  const [err,setErr]=useState('');
  const [fname,setFname]=useState('');
  const [items,setItems]=useState(null);
  const [drag,setDrag]=useState(false);
  const ref=useRef();
  const load=txt=>{const r=parseCSV(txt);if(r.err){setErr(r.err);setItems(null)}else{setItems(r.items);setErr('')}};
  const loadFile=f=>{if(!f)return;setFname(f.name);const rd=new FileReader();rd.onload=e=>load(e.target.result);rd.readAsText(f)};
  return(
    <div style={{maxWidth:460,width:'100%'}}>
      <h2 className="sr-only">단어 테스트 시작 화면</h2>
      <div style={{textAlign:'center',marginBottom:22}}>
        <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:26,fontWeight:700,color:'var(--obs)',letterSpacing:'-.04em',marginBottom:5}}>단어 테스트</div>
        <p style={{color:'var(--pine)',fontSize:13,fontFamily:'Inter,sans-serif',letterSpacing:'-.01em'}}>CSV 파일을 업로드하거나 샘플로 시작하세요</p>
      </div>
      <div
        onDrop={e=>{e.preventDefault();setDrag(false);loadFile(e.dataTransfer.files[0])}}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onClick={()=>ref.current.click()}
        style={{background:items?'rgba(0,105,224,.04)':'var(--card)',border:`2px dashed ${drag||items?'var(--elec)':'var(--ghostly)'}`,borderRadius:20,padding:'24px 20px',textAlign:'center',cursor:'pointer',marginBottom:10,transition:'all .2s'}}>
        <input ref={ref} type="file" accept=".csv,.txt" style={{display:'none'}} onChange={e=>loadFile(e.target.files[0])}/>
        <div style={{display:'flex',justifyContent:'center',marginBottom:9}}>
          <Icon name={items?'file':'cup'} size={28} color={items?'var(--elec)':'var(--ash)'} sw={1.5}/>
        </div>
        {items
          ?<p style={{color:'var(--elec)',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif',letterSpacing:'-.01em'}}>{fname} — {items.length}개 항목 로드됨</p>
          :<p style={{color:'var(--pine)',fontSize:13,fontFamily:'Inter,sans-serif',letterSpacing:'-.01em'}}>CSV 드래그 또는 클릭해서 업로드</p>
        }
        {err&&<p style={{color:'var(--coral-b)',fontSize:12,marginTop:6,fontFamily:'Inter,sans-serif'}}>{err}</p>}
      </div>
      <div style={{background:'var(--ghostly)',borderRadius:10,padding:'10px 13px',marginBottom:13,display:'flex',gap:8,alignItems:'flex-start'}}>
        <div style={{marginTop:1}}><Icon name="info" size={13} color="var(--elec)"/></div>
        <p style={{fontSize:11,color:'var(--pine)',fontFamily:'Inter,sans-serif',lineHeight:1.55}}>
          형식: <code style={{background:'rgba(0,0,0,.07)',borderRadius:4,padding:'1px 5px',fontSize:10}}>word,pos,meanings</code> — 뜻이 여러 개면 세미콜론(;)으로 구분. <code style={{background:'rgba(0,0,0,.07)',borderRadius:4,padding:'1px 5px',fontSize:10}}>pos</code> 컬럼은 선택사항.
        </p>
      </div>
      <button onClick={()=>{load(SAMPLE);setFname('sample.csv')}}
        style={{width:'100%',background:'none',border:'1.5px solid var(--ghostly)',borderRadius:12,padding:'11px',fontSize:13,fontWeight:500,color:'var(--pine)',cursor:'pointer',fontFamily:'Inter,sans-serif',letterSpacing:'-.01em',marginBottom:18,transition:'border-color .2s,color .2s'}}>
        샘플 데이터로 시작하기
      </button>
      <p style={{fontSize:11,fontWeight:600,color:'var(--ash)',fontFamily:'Inter,sans-serif',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:8}}>학습 방식</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        {[{id:'mcq',icon:'list',label:'사지선다',sub:'4개 보기 중 선택'},{id:'type',icon:'pen',label:'직접 입력',sub:'뜻을 직접 타이핑'}].map(({id,icon,label,sub})=>(
          <button key={id} className="mbtn" onClick={()=>setMode(id)}
            style={{background:mode===id?'var(--ink)':'var(--card)',borderColor:mode===id?'var(--ink)':'var(--ghostly)',borderWidth:2,borderRadius:14,padding:'13px 14px'}}>
            <div style={{marginBottom:6}}><Icon name={icon} size={15} color={mode===id?'var(--white)':'var(--pine)'}/></div>
            <div style={{fontSize:13,fontWeight:600,color:mode===id?'var(--white)':'var(--obs)',fontFamily:'Inter,sans-serif',letterSpacing:'-.01em'}}>{label}</div>
            <div style={{fontSize:11,color:mode===id?'rgba(255,255,255,.5)':'var(--ash)',fontFamily:'Inter,sans-serif',marginTop:2}}>{sub}</div>
          </button>
        ))}
      </div>
      <div style={{background:'var(--card)',border:'1.5px solid var(--ghostly)',borderRadius:12,padding:'11px 14px',marginBottom:18}}>
        <p style={{fontSize:12,fontWeight:600,color:'var(--elec)',fontFamily:'Inter,sans-serif',letterSpacing:'-.01em',marginBottom:3}}>뜻이 여러 개인 단어 처리</p>
        <p style={{fontSize:11,color:'var(--pine)',fontFamily:'Inter,sans-serif',lineHeight:1.55}}>
          {mode==='mcq'?'사지선다: 첫 번째 뜻으로 출제하고 나머지 뜻은 정답 후 표시해요.':'직접 입력: 세미콜론으로 구분된 모든 뜻을 정답으로 인정해요.'}
        </p>
      </div>
      <button disabled={!items} onClick={()=>items&&onStart(buildQuiz(items),mode)} className="cta"
        style={{width:'100%',background:items?'var(--ink)':'#d1d9e0',color:items?'var(--white)':'var(--ash)',border:'none',borderRadius:32,padding:'14px',fontSize:15,fontWeight:600,letterSpacing:'-.01em',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        테스트 시작하기
        {items&&<Icon name="cr" size={15} color="var(--white)"/>}
      </button>
    </div>
  );
}

function QuizScreen({items,mode,idx,lives,streak,phase,sel,typed,onSel,onType,onSubmit,onCont,total}){
  const item=items[idx];
  const done=phase==='answered';
  const [shk,setShk]=useState(null);
  const inRef=useRef();
  useEffect(()=>{if(mode==='type'&&!done)inRef.current?.focus()},[idx,done,mode]);
  const pick=opt=>{
    if(done)return;
    if(opt!==item.correct){setShk(opt);setTimeout(()=>setShk(null),430)}
    onSel(opt);
  };
  const isRight=mode==='mcq'?sel===item.correct:item.meanings.some(m=>norm(m)===norm(typed));
  const os=opt=>{
    if(!done)return{bg:'var(--card)',bc:'var(--ghostly)',col:'var(--obs)',op:1};
    if(opt===item.correct)return{bg:'var(--mint)',bc:'var(--mint-b)',col:'var(--obs)',op:1};
    if(opt===sel&&opt!==item.correct)return{bg:'var(--coral)',bc:'var(--coral-b)',col:'var(--obs)',op:1};
    return{bg:'var(--card)',bc:'var(--ghostly)',col:'var(--ash)',op:.4};
  };
  return(
    <div style={{width:'100%',maxWidth:460}}>
      <h2 className="sr-only">퀴즈 {idx+1}번째 문제</h2>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
        <button onClick={()=>onCont(true)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 6px',display:'flex',alignItems:'center'}}>
          <Icon name="x" size={18} color="var(--ash)"/>
        </button>
        <div style={{flex:1,height:10,background:'var(--ghostly)',borderRadius:99,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${idx/total*100}%`,background:'var(--elec)',borderRadius:99,transition:'width .5s ease'}}/>
        </div>
        <div style={{display:'flex',gap:3,alignItems:'center'}}>
          {[0,1,2,3,4].map(i=>(
            <span key={i} style={{display:'inline-flex',filter:i<lives?'none':'grayscale(1) opacity(.2)',transition:'filter .4s'}}>
              <Icon name="heart" size={13} color="#ef4444" sw={2}/>
            </span>
          ))}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11}}>
        <span style={{fontSize:12,fontWeight:600,color:'var(--ash)',fontFamily:'Inter,sans-serif',letterSpacing:'-.01em'}}>{idx+1} / {total}</span>
        {streak>=2&&<span style={{background:'#fffaeb',border:'1px solid #fcd34d',borderRadius:99,padding:'3px 11px',fontSize:12,fontWeight:600,color:'#92400e',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
          <Icon name="zap" size={11} color="#92400e" sw={2}/>{streak} 연속
        </span>}
      </div>
      <p style={{color:'var(--pine)',fontSize:14,fontWeight:500,letterSpacing:'-.01em',marginBottom:11,fontFamily:'Inter,sans-serif'}}>다음 단어의 뜻은?</p>
      <div key={`wc${idx}`} className="wcard" style={{background:'var(--card)',borderRadius:32,padding:'30px 36px 22px',boxShadow:'var(--shadow)',marginBottom:14,textAlign:'center'}}>
        {item.pos&&<div style={{display:'inline-block',background:'var(--ghostly)',color:'var(--elec)',borderRadius:99,padding:'3px 12px',fontSize:11,fontWeight:600,letterSpacing:'.05em',textTransform:'uppercase',fontFamily:'Inter,sans-serif',marginBottom:13}}>{item.pos}</div>}
        <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:38,fontWeight:700,color:'var(--obs)',letterSpacing:'-.04em',lineHeight:1.06}}>{item.word}</div>
        {mode==='type'&&item.meanings.length>1&&<div style={{marginTop:8,fontSize:11,color:'var(--ash)',fontFamily:'Inter,sans-serif'}}>뜻이 {item.meanings.length}개 — 어떤 뜻이든 정답</div>}
      </div>
      {mode==='mcq'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
          {item.opts.map((opt,i)=>{
            const s=os(opt);
            return(
              <button key={`${idx}${opt}`} className={`opt${shk===opt?' shake':''}`} disabled={done} onClick={()=>pick(opt)}
                style={{background:s.bg,borderWidth:2,borderColor:s.bc,borderRadius:13,padding:'13px 16px',fontSize:14,fontWeight:500,letterSpacing:'-.01em',display:'flex',alignItems:'center',justifyContent:'space-between',color:s.col,opacity:s.op,cursor:done?'default':'pointer',animation:'slideUp .28s ease both',animationDelay:`${i*.07}s`}}>
                <span>{opt}</span>
                {done&&opt===item.correct&&<Icon name="check" size={15} color="var(--mint-b)"/>}
                {done&&opt===sel&&opt!==item.correct&&<Icon name="x" size={15} color="var(--coral-b)"/>}
              </button>
            );
          })}
        </div>
      )}
      {mode==='type'&&(
        <div style={{marginBottom:12}}>
          <div style={{position:'relative',marginBottom:8}}>
            <input ref={inRef} value={typed} disabled={done}
              onChange={e=>onType(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!done&&typed.trim()&&onSubmit()}
              placeholder="한국어 뜻을 입력하세요"
              style={{width:'100%',background:done?(isRight?'var(--mint)':'var(--coral)'):'var(--card)',border:`2px solid ${done?(isRight?'var(--mint-b)':'var(--coral-b)'):'var(--ghostly)'}`,borderRadius:13,padding:'14px 46px 14px 16px',fontSize:15,fontWeight:500,color:'var(--obs)',fontFamily:'Inter,sans-serif',letterSpacing:'-.01em',transition:'border-color .2s,background .2s'}}/>
            {done&&<div style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)'}}>
              <Icon name={isRight?'check':'x'} size={17} color={isRight?'var(--mint-b)':'var(--coral-b)'}/>
            </div>}
          </div>
          {!done&&<button onClick={onSubmit} disabled={!typed.trim()} className="cta"
            style={{width:'100%',background:typed.trim()?'var(--ink)':'#d1d9e0',color:typed.trim()?'var(--white)':'var(--ash)',border:'none',borderRadius:32,padding:'12px',fontSize:14,fontWeight:600,letterSpacing:'-.01em'}}>
            확인
          </button>}
        </div>
      )}
      {done&&(
        <div className="fdbk" style={{background:isRight?'var(--mint)':'var(--coral)',border:`1.5px solid ${isRight?'var(--mint-b)':'var(--coral-b)'}`,borderRadius:18,padding:'14px 17px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div>
            <p style={{fontWeight:700,fontSize:14,color:isRight?'var(--mint-t)':'var(--coral-b)',fontFamily:'Inter,sans-serif',letterSpacing:'-.01em',marginBottom:item.meanings.length>1||!isRight?3:0}}>
              {isRight?'정답이에요!':'틀렸어요'}
            </p>
            {(!isRight||item.meanings.length>1)&&(
              <p style={{fontSize:12,color:'var(--pine)',fontFamily:'Inter,sans-serif',lineHeight:1.5}}>
                {isRight?'모든 뜻: ':'정답: '}<strong style={{color:'var(--obs)'}}>{item.meanings.join(' / ')}</strong>
              </p>
            )}
          </div>
          <button className="cta" onClick={()=>onCont()}
            style={{background:'var(--ink)',color:'var(--white)',border:'none',borderRadius:32,padding:'10px 17px',fontSize:13,fontWeight:600,letterSpacing:'-.01em',flexShrink:0,display:'flex',alignItems:'center',gap:5}}>
            {idx+1>=total?'결과 보기':'계속하기'}
            <Icon name="cr" size={13} color="var(--white)"/>
          </button>
        </div>
      )}
    </div>
  );
}

function ResultScreen({score,total,onRestart}){
  const pct=Math.round(score/total*100);
  const msg=pct===100?'Perfect':pct>=80?'잘했어요':pct>=60?'좋아요':'다시 해봐요';
  return(
    <div className="rcard" style={{background:'var(--card)',borderRadius:32,padding:'42px 36px',maxWidth:420,width:'100%',textAlign:'center',boxShadow:'var(--shadow)'}}>
      <h2 className="sr-only">퀴즈 결과</h2>
      <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
        <Icon name="award" size={42} color="var(--elec)" sw={1.5}/>
      </div>
      <div style={{fontFamily:"'Montserrat',sans-serif",fontSize:50,fontWeight:700,color:'var(--obs)',letterSpacing:'-.04em',lineHeight:1,marginBottom:4}}>
        {pct}<span style={{fontSize:22}}>점</span>
      </div>
      <p style={{color:'var(--pine)',fontSize:15,fontWeight:600,fontFamily:'Inter,sans-serif',letterSpacing:'-.01em',marginBottom:3}}>{msg}</p>
      <p style={{color:'var(--ash)',fontSize:13,fontFamily:'Inter,sans-serif',letterSpacing:'-.01em',marginBottom:24}}>
        {total}문제 중 <strong style={{color:'var(--obs)'}}>{score}개</strong> 정답
      </p>
      <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap',marginBottom:28}}>
        {Array.from({length:total}).map((_,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:99,background:i<score?'var(--elec)':'var(--ghostly)'}}/>
        ))}
      </div>
      <button className="cta" onClick={onRestart}
        style={{width:'100%',background:'var(--ink)',color:'var(--white)',border:'none',borderRadius:32,padding:'13px',fontSize:15,fontWeight:600,letterSpacing:'-.01em',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        <Icon name="ccw" size={15} color="var(--white)"/>
        다시 도전하기
      </button>
    </div>
  );
}

function App(){
  const [screen,setScreen]=useState('upload');
  const [quiz,setQuiz]=useState([]);
  const [mode,setMode]=useState('mcq');
  const [idx,setIdx]=useState(0);
  const [sel,setSel]=useState(null);
  const [typed,setTyped]=useState('');
  const [phase,setPhase]=useState('answering');
  const [score,setScore]=useState(0);
  const [lives,setLives]=useState(5);
  const [streak,setStreak]=useState(0);

  const start=(items,m)=>{setQuiz(items);setMode(m);setIdx(0);setSel(null);setTyped('');setPhase('answering');setScore(0);setLives(5);setStreak(0);setScreen('quiz')};
  const onSel=opt=>{setSel(opt);setPhase('answered');if(opt===quiz[idx].correct){setScore(s=>s+1);setStreak(s=>s+1)}else{setLives(l=>Math.max(0,l-1));setStreak(0)}};
  const onSubmit=()=>{const ok=quiz[idx].meanings.some(m=>norm(m)===norm(typed));setPhase('answered');if(ok){setScore(s=>s+1);setStreak(s=>s+1)}else{setLives(l=>Math.max(0,l-1));setStreak(0)}};
  const onCont=(exit=false)=>{if(exit){setScreen('upload');return}const n=idx+1;if(n>=quiz.length){setScreen('result');return}setIdx(n);setSel(null);setTyped('');setPhase('answering')};

  const wrap=(align,ch)=><div style={{width:'100%',background:'var(--bg)',minHeight:400,display:'flex',alignItems:align,justifyContent:'center',padding:'20px 16px 32px'}}>{ch}</div>;

  if(screen==='result')return wrap('center',<ResultScreen score={score} total={quiz.length} onRestart={()=>setScreen('upload')}/>);
  if(screen==='upload')return wrap('flex-start',<UploadScreen onStart={start}/>);
  return wrap('flex-start',<QuizScreen items={quiz} mode={mode} idx={idx} lives={lives} streak={streak} phase={phase} sel={sel} typed={typed} onSel={onSel} onType={setTyped} onSubmit={onSubmit} onCont={onCont} total={quiz.length}/>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);