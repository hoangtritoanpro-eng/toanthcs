import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RefreshCw, CheckCircle, RotateCcw, Move, MousePointer2, GitCommit, ArrowRightLeft } from 'lucide-react';

interface AngleGameProps {
  onBack: () => void;
}

// MathJax Component for rendering angle notation (static text)
const MathMessage: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const renderMath = async () => {
      if (containerRef.current && (window as any).MathJax) {
        containerRef.current.innerHTML = text;
        try {
          const mathJax = (window as any).MathJax;
          if (mathJax.typesetPromise) await mathJax.typesetPromise([containerRef.current]);
          else if (mathJax.typeset) mathJax.typeset([containerRef.current]);
        } catch (e) { console.warn(e); }
      }
    };
    renderMath();
  }, [text]);
  return <span ref={containerRef} className={className} />;
};

const AngleGame: React.FC<AngleGameProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'MEASURE' | 'RELATIONS'>('MEASURE');
  
  // --- STATE FOR MEASURE MODE ---
  const [targetAngle, setTargetAngle] = useState(60);
  const [rotationOffset, setRotationOffset] = useState(0); 
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' }>({ 
    text: 'Dùng thước đo góc để đo độ lớn của góc xOy.', 
    type: 'neutral' 
  });
  const [protractorPos, setProtractorPos] = useState({ x: 400, y: 450 }); 
  const [protractorAngle, setProtractorAngle] = useState(0);
  const [guideAngle, setGuideAngle] = useState(90);
  const [interactionMode, setInteractionMode] = useState<'NONE' | 'DRAG' | 'ROTATE' | 'GUIDE'>('NONE');
  const svgRef = useRef<SVGSVGElement>(null);

  // --- STATE FOR RELATIONS MODE ---
  const [relationType, setRelationType] = useState<'OPPOSITE' | 'ADJACENT_SUPP' | 'PARALLEL'>('OPPOSITE');
  const [relationQ, setRelationQ] = useState<any>(null);

  // Constants
  const CENTER_X = 400; 
  const CENTER_Y = 400; 
  const RAY_LENGTH = 380;
  const PROTRACTOR_RADIUS = 280; 
  const HOLE_RADIUS = 15;

  // Init Measure
  const initLevel = useCallback(() => {
    const angle = Math.floor(Math.random() * 160) + 10; 
    const rot = Math.floor(Math.random() * 180) + 180;
    setTargetAngle(angle);
    setRotationOffset(rot);
    setUserAnswer('');
    setFeedback({ text: 'Dùng thước đo góc để đo độ lớn của góc xOy.', type: 'neutral' });
    setProtractorPos({ x: CENTER_X, y: CENTER_Y + 120 });
    setProtractorAngle(0);
    setGuideAngle(90);
  }, []);

  // Init Relation
  const initRelation = useCallback(() => {
      // Choose random relation type
      const types: ('OPPOSITE' | 'ADJACENT_SUPP' | 'PARALLEL')[] = ['OPPOSITE', 'ADJACENT_SUPP', 'PARALLEL'];
      const rType = types[Math.floor(Math.random() * types.length)];
      setRelationType(rType);

      const baseAngle = Math.floor(Math.random() * 60) + 30; // 30-90 base
      let q = {};

      if (rType === 'OPPOSITE') {
          q = {
              text: `Biết $\\widehat{O_1} = ${baseAngle}^\\circ$. Tính $\\widehat{O_3}$ (đối đỉnh)?`,
              ans: baseAngle,
              labels: { 1: baseAngle, 2: '?', 3: '?', 4: '?' },
              highlight: [1, 3]
          };
      } else if (rType === 'ADJACENT_SUPP') {
          q = {
              text: `Biết $\\widehat{O_1} = ${baseAngle}^\\circ$. Tính $\\widehat{O_2}$ (kề bù)?`,
              ans: 180 - baseAngle,
              labels: { 1: baseAngle, 2: '?', 3: '?', 4: '?' },
              highlight: [1, 2]
          };
      } else {
          // PARALLEL (Sole trong / Dong vi)
          const isSole = Math.random() > 0.5;
          q = {
              text: isSole 
                ? `Biết $a // b$ và $\\widehat{A_1} = ${baseAngle}^\\circ$. Tính $\\widehat{B_1}$ (so le trong)?`
                : `Biết $a // b$ và $\\widehat{A_1} = ${baseAngle}^\\circ$. Tính $\\widehat{B_2}$ (đồng vị)?`,
              ans: baseAngle,
              subType: isSole ? 'SOLE' : 'DONGVI'
          };
      }
      setRelationQ(q);
      setUserAnswer('');
      setFeedback({ text: 'Quan sát hình vẽ và tính góc.', type: 'neutral' });
  }, []);

  useEffect(() => {
    if (mode === 'MEASURE') initLevel();
    else initRelation();
  }, [mode, initLevel, initRelation]);

  // --- Interaction Handlers (Measure Mode) ---
  const handleMouseDown = (mode: 'DRAG' | 'ROTATE' | 'GUIDE', e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation(); setInteractionMode(mode);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (interactionMode === 'NONE' || !svgRef.current) return;
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } 
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }

    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const mouseX = (clientX - CTM.e) / CTM.a;
    const mouseY = (clientY - CTM.f) / CTM.d;

    if (interactionMode === 'DRAG') {
      setProtractorPos({ x: mouseX, y: mouseY });
    } else if (interactionMode === 'ROTATE') {
      const deltaX = mouseX - protractorPos.x;
      const deltaY = mouseY - protractorPos.y;
      const angleDeg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      setProtractorAngle(angleDeg + 90);
    } else if (interactionMode === 'GUIDE') {
       const deltaX = mouseX - protractorPos.x;
       const deltaY = mouseY - protractorPos.y;
       const rad = -protractorAngle * (Math.PI / 180);
       const dx_local = deltaX * Math.cos(rad) - deltaY * Math.sin(rad);
       const dy_local = deltaX * Math.sin(rad) + deltaY * Math.cos(rad);
       const localDeg = Math.atan2(dy_local, dx_local) * (180 / Math.PI);
       let guideVal = localDeg <= 0 ? -localDeg : (localDeg > 90 ? 180 : 0);
       setGuideAngle(guideVal);
    }
  };

  const handleMouseUp = () => setInteractionMode('NONE');

  const checkAnswer = () => {
    const val = parseInt(userAnswer);
    if (isNaN(val)) return;

    if (mode === 'MEASURE') {
        if (Math.abs(val - targetAngle) <= 2) {
            setFeedback({ text: `Chính xác! Góc $\\widehat{xOy} = ${targetAngle}^\\circ$.`, type: 'success' });
            setScore(s => s + 10);
            setTimeout(initLevel, 3000);
        } else {
            setFeedback({ text: `Chưa đúng. Em hãy đặt tâm thước trùng đỉnh O...`, type: 'error' });
        }
    } else {
        if (val === relationQ.ans) {
            setFeedback({ text: `Chính xác! Đáp án là ${relationQ.ans}$^\\circ$.`, type: 'success' });
            setScore(s => s + 10);
            setTimeout(initRelation, 2000);
        } else {
            setFeedback({ text: `Sai rồi. Hãy nhớ lại tính chất các góc.`, type: 'error' });
        }
    }
  };

  // --- Rendering Helpers ---
  const ray1X = CENTER_X + RAY_LENGTH * Math.cos(rotationOffset * Math.PI / 180);
  const ray1Y = CENTER_Y + RAY_LENGTH * Math.sin(rotationOffset * Math.PI / 180);
  const ray2X = CENTER_X + RAY_LENGTH * Math.cos((rotationOffset - targetAngle) * Math.PI / 180);
  const ray2Y = CENTER_Y + RAY_LENGTH * Math.sin((rotationOffset - targetAngle) * Math.PI / 180);

  const renderProtractor = () => {
    // ... (Keep existing implementation logic for brevity, it works well)
    // Re-implementing simplified version to ensure it compiles in this update block
    const radius = PROTRACTOR_RADIUS;
    const ticks = [];
    for (let i = 0; i <= 180; i++) {
        const isMajor = i % 10 === 0;
        if (isMajor || i % 5 === 0) {
            const angle = -(i * Math.PI) / 180;
            const x1 = Math.cos(angle) * (radius - 4);
            const y1 = Math.sin(angle) * (radius - 4);
            const x2 = Math.cos(angle) * (radius - (isMajor ? 24 : 16));
            const y2 = Math.sin(angle) * (radius - (isMajor ? 24 : 16));
            ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth={isMajor?2:1} />);
            if (isMajor) {
                const tx = Math.cos(angle) * (radius - 40);
                const ty = Math.sin(angle) * (radius - 40);
                ticks.push(<text key={`t${i}`} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#0f172a" className="pointer-events-none">{i}</text>);
            }
        }
    }
    return (
        <g transform={`translate(${protractorPos.x}, ${protractorPos.y}) rotate(${protractorAngle})`} 
           className="cursor-move drop-shadow-xl" onMouseDown={(e)=>handleMouseDown('DRAG',e)} onTouchStart={(e)=>handleMouseDown('DRAG',e)}>
            <path d={`M -${radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0 L ${HOLE_RADIUS} 0 A ${HOLE_RADIUS} ${HOLE_RADIUS} 0 0 0 -${HOLE_RADIUS} 0 Z`} fill="rgba(255,255,255,0.9)" stroke="#94a3b8" />
            <line x1={-radius} y1="0" x2={radius} y2="0" stroke="black" strokeWidth="2"/>
            {ticks}
            <g transform={`translate(0, -${radius})`} onMouseDown={(e)=>handleMouseDown('ROTATE',e)} onTouchStart={(e)=>handleMouseDown('ROTATE',e)} className="cursor-grab hover:scale-110">
               <circle r="20" fill="#fbbf24" stroke="#b45309"/> <text y="2" textAnchor="middle" dominantBaseline="middle" fontSize="16">↻</text>
            </g>
            <g transform={`rotate(${-guideAngle})`} onMouseDown={(e)=>handleMouseDown('GUIDE',e)} onTouchStart={(e)=>handleMouseDown('GUIDE',e)} className="cursor-crosshair">
               <line x1="0" y1="0" x2={radius} y2="0" stroke="red" strokeWidth="2"/>
               <circle cx={radius} cy="0" r="15" fill="red"/>
               <g transform={`translate(${radius+40}, 0) rotate(${-(protractorAngle-guideAngle)})`}>
                   <rect x="-30" y="-15" width="60" height="30" fill="white" stroke="red" rx="5"/>
                   <text y="5" textAnchor="middle" fontWeight="bold">{Math.round(guideAngle)}°</text>
               </g>
            </g>
        </g>
    )
  };

  const renderRelations = () => {
      // Center for relations
      const CX = 400, CY = 300;
      
      if (relationType === 'PARALLEL') {
          // Two parallel lines and a transversal
          const y1 = 200, y2 = 400;
          const slant = 0.5; // slope
          const transX = (y: number) => (y - CY)/slant + CX;
          
          return (
              <g stroke="black" strokeWidth="2">
                  {/* Line a */}
                  <line x1="100" y1={y1} x2="700" y2={y1} />
                  <text x="710" y={y1} className="font-bold font-serif">a</text>
                  {/* Line b */}
                  <line x1="100" y1={y2} x2="700" y2={y2} />
                  <text x="710" y={y2} className="font-bold font-serif">b</text>
                  {/* Transversal c */}
                  <line x1={CX - 150} y1="100" x2={CX + 150} y2="500" stroke="#ef4444" />
                  <text x={CX + 160} y="500" className="font-bold font-serif text-red-600">c</text>

                  {/* Intersection A (Top) */}
                  <g transform={`translate(${CX - 75}, ${y1})`}>
                      <text x="-20" y="-20" className="font-bold">A</text>
                      <text x="20" y="-10" className="text-xs">1</text>
                      {/* Arc for A1 */}
                      <path d="M 30 0 A 30 30 0 0 0 18 -24" fill="none" stroke="blue" strokeWidth="3"/>
                  </g>

                  {/* Intersection B (Bottom) */}
                  <g transform={`translate(${CX + 75}, ${y2})`}>
                      <text x="-20" y="30" className="font-bold">B</text>
                      {relationQ.subType === 'SOLE' ? (
                          <>
                            <text x="-20" y="15" className="text-xs">1</text>
                            <path d="M -30 0 A 30 30 0 0 0 -18 24" fill="none" stroke="green" strokeWidth="3"/>
                          </>
                      ) : (
                          <>
                            <text x="20" y="-10" className="text-xs">2</text>
                            <path d="M 30 0 A 30 30 0 0 0 18 -24" fill="none" stroke="green" strokeWidth="3"/>
                          </>
                      )}
                  </g>
              </g>
          );
      } else {
          // Intersecting Lines (X shape)
          return (
              <g stroke="black" strokeWidth="2">
                  <line x1="200" y1="200" x2="600" y2="400" />
                  <line x1="200" y1="400" x2="600" y2="200" />
                  <circle cx={CX} cy={CY} r="4" fill="black"/>
                  <text x={CX} y={CY-10} textAnchor="middle" className="font-bold">O</text>
                  
                  {/* Angles O1, O2, O3, O4 */}
                  <text x={CX} y={CY-40} className="text-xs font-bold fill-blue-600">1</text>
                  <text x={CX+40} y={CY} className="text-xs font-bold fill-green-600">2</text>
                  <text x={CX} y={CY+50} className="text-xs font-bold fill-orange-600">3</text>
                  <text x={CX-40} y={CY} className="text-xs font-bold">4</text>

                  {/* Highlights */}
                  {relationQ.highlight.includes(1) && <path d={`M ${CX-30} ${CY-15} Q ${CX} ${CY-40} ${CX+30} ${CY-15}`} fill="none" stroke="blue" strokeWidth="3"/>}
                  {relationQ.highlight.includes(2) && <path d={`M ${CX+30} ${CY-15} Q ${CX+40} ${CY} ${CX+30} ${CY+15}`} fill="none" stroke="green" strokeWidth="3"/>}
                  {relationQ.highlight.includes(3) && <path d={`M ${CX-30} ${CY+15} Q ${CX} ${CY+40} ${CX+30} ${CY+15}`} fill="none" stroke="orange" strokeWidth="3"/>}
              </g>
          );
      }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 animate-fade-in select-none">
       <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        
        <div className="flex bg-white rounded-lg border border-teal-100 p-1">
            <button onClick={()=>setMode('MEASURE')} className={`px-4 py-1 rounded font-bold flex items-center gap-2 ${mode==='MEASURE'?'bg-teal-600 text-white':'text-slate-500'}`}><Move className="w-4 h-4"/> Đo góc</button>
            <button onClick={()=>setMode('RELATIONS')} className={`px-4 py-1 rounded font-bold flex items-center gap-2 ${mode==='RELATIONS'?'bg-teal-600 text-white':'text-slate-500'}`}><GitCommit className="w-4 h-4"/> Quan hệ góc</button>
        </div>

        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm">
          Điểm: {score}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 relative overflow-hidden h-[500px] lg:h-[600px]">
           <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-full bg-slate-50 touch-none cursor-default"
             onMouseMove={handleMouseMove} onTouchMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchEnd={handleMouseUp}
           >
              <defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {mode === 'MEASURE' ? (
                  <>
                    <g stroke="#0f172a" strokeWidth="5" strokeLinecap="round">
                        <circle cx={CENTER_X} cy={CENTER_Y} r="6" fill="#0f172a" />
                        <text x={CENTER_X - 35} y={CENTER_Y + 35} fontSize="32" fill="#0f172a">O</text>
                        <line x1={CENTER_X} y1={CENTER_Y} x2={ray1X} y2={ray1Y} />
                        <line x1={CENTER_X} y1={CENTER_Y} x2={ray2X} y2={ray2Y} />
                        <path d={`M ${CENTER_X + 50 * Math.cos(rotationOffset * Math.PI/180)} ${CENTER_Y + 50 * Math.sin(rotationOffset * Math.PI/180)} A 50 50 0 0 0 ${CENTER_X + 50 * Math.cos((rotationOffset - targetAngle) * Math.PI/180)} ${CENTER_Y + 50 * Math.sin((rotationOffset - targetAngle) * Math.PI/180)}`} fill="none" stroke="#0d9488" strokeWidth="3" strokeDasharray="6,4"/>
                    </g>
                    {renderProtractor()}
                  </>
              ) : (
                  renderRelations()
              )}
           </svg>
        </div>

        <div className="lg:w-80 flex flex-col gap-5">
           <div className={`p-5 rounded-2xl border-2 flex flex-col gap-3 transition-colors ${feedback.type === 'success' ? 'bg-green-50 border-green-200' : feedback.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
               <div className="text-base font-bold text-slate-700 leading-relaxed">
                  {mode === 'RELATIONS' && relationQ ? <MathMessage text={relationQ.text}/> : <MathMessage text={feedback.text} />}
               </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-lg">
               <label className="block text-xs font-extrabold text-slate-500 uppercase mb-3 flex items-center gap-1">
                 <MousePointer2 className="w-3 h-3"/> Nhập kết quả ($^\circ$)
               </label>
               <div className="flex gap-3">
                   <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkAnswer()} placeholder="?" className="flex-1 p-3 text-center text-3xl font-bold rounded-xl border-2 border-slate-200 outline-none focus:border-teal-500" />
                   <button onClick={checkAnswer} className="bg-teal-600 text-white px-6 rounded-xl font-bold hover:bg-teal-700 shadow-lg active:translate-y-0.5 transition-all"><CheckCircle className="w-8 h-8" /></button>
               </div>
           </div>

           <button onClick={mode==='MEASURE' ? initLevel : initRelation} className="flex items-center justify-center gap-2 p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-bold transition-colors border border-slate-200">
             <RefreshCw className="w-5 h-5"/> Bài tập khác
           </button>
        </div>
      </div>
    </div>
  );
};

export default AngleGame;