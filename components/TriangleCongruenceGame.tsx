import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, BookOpen, PenTool, CheckCircle, HelpCircle, RefreshCw, Layers, ArrowDown, Move, Trophy } from 'lucide-react';

interface TriangleCongruenceGameProps {
  onBack: () => void;
}

// --- MathJax Helper ---
const MathMessage: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const renderMath = async () => {
      if (containerRef.current && (window as any).MathJax) {
        containerRef.current.innerHTML = text;
        try {
          const mathJax = (window as any).MathJax;
          if (mathJax.typesetPromise) {
            await mathJax.typesetClear([containerRef.current]);
            await mathJax.typesetPromise([containerRef.current]);
          } else if (mathJax.typeset) {
            mathJax.typeset([containerRef.current]);
          }
        } catch (e) { console.warn(e); }
      }
    };
    renderMath();
  }, [text]);
  return <span ref={containerRef} className={className} />;
};

// --- Types ---
type CongruenceCase = 'CCC' | 'CGC' | 'GCG' | 'CH-GN' | 'CH-CGV';

// --- Data: Theory ---
const THEORY_DATA: Record<CongruenceCase, { title: string; desc: string; notation: string }> = {
  'CCC': { 
    title: 'Cạnh - Cạnh - Cạnh (c.c.c)', 
    desc: 'Nếu ba cạnh của tam giác này bằng ba cạnh của tam giác kia thì hai tam giác đó bằng nhau.',
    notation: '$AB=A\'B\', AC=A\'C\', BC=B\'C\' \\Rightarrow \\Delta ABC = \\Delta A\'B\'C\'$'
  },
  'CGC': { 
    title: 'Cạnh - Góc - Cạnh (c.g.c)', 
    desc: 'Nếu hai cạnh và góc xen giữa của tam giác này bằng hai cạnh và góc xen giữa của tam giác kia thì hai tam giác đó bằng nhau.',
    notation: '$AB=A\'B\', \\widehat{B}=\\widehat{B\'}, BC=B\'C\' \\Rightarrow \\Delta ABC = \\Delta A\'B\'C\'$'
  },
  'GCG': { 
    title: 'Góc - Cạnh - Góc (g.c.g)', 
    desc: 'Nếu một cạnh và hai góc kề của tam giác này bằng một cạnh và hai góc kề của tam giác kia thì hai tam giác đó bằng nhau.',
    notation: '$\\widehat{B}=\\widehat{B\'}, BC=B\'C\', \\widehat{C}=\\widehat{C\'} \\Rightarrow \\Delta ABC = \\Delta A\'B\'C\'$'
  },
  'CH-GN': { 
    title: 'Cạnh huyền - Góc nhọn', 
    desc: 'Nếu cạnh huyền và một góc nhọn của tam giác vuông này bằng cạnh huyền và một góc nhọn của tam giác vuông kia thì hai tam giác vuông đó bằng nhau.',
    notation: '$\\widehat{A}=\\widehat{A\'}=90^o, BC=B\'C\', \\widehat{B}=\\widehat{B\'} \\Rightarrow \\Delta ABC = \\Delta A\'B\'C\'$'
  },
  'CH-CGV': { 
    title: 'Cạnh huyền - Cạnh góc vuông', 
    desc: 'Nếu cạnh huyền và một cạnh góc vuông của tam giác vuông này bằng cạnh huyền và một cạnh góc vuông của tam giác vuông kia thì hai tam giác vuông đó bằng nhau.',
    notation: '$\\widehat{A}=\\widehat{A\'}=90^o, BC=B\'C\', AB=A\'B\' \\Rightarrow \\Delta ABC = \\Delta A\'B\'C\'$'
  }
};

// --- Data: Proof Problems (Sorting Game) ---
const PROOF_PROBLEMS = [
  {
    id: 1,
    title: "Chứng minh tam giác bằng nhau (C.C.C)",
    given: "Cho hình vẽ, biết $AB = CD$ và $AD = BC$. Chứng minh $\\Delta ABD = \\Delta CDB$.",
    imageType: 'PARALLELOGRAM', // Just a key for rendering logic
    steps: [
      { id: 's1', text: 'Xét $\\Delta ABD$ và $\\Delta CDB$ có:', type: 'header' },
      { id: 's2', text: '$AB = CD$ (giả thiết)', type: 'item' },
      { id: 's3', text: '$AD = BC$ (giả thiết)', type: 'item' },
      { id: 's4', text: '$BD$ là cạnh chung', type: 'item' },
      { id: 's5', text: '$\\Rightarrow \\Delta ABD = \\Delta CDB$ (c.c.c)', type: 'conclusion' }
    ]
  },
  {
    id: 2,
    title: "Chứng minh phân giác (C.G.C)",
    given: "Cho $\\Delta ABC$ cân tại A. Gọi M là trung điểm BC. Chứng minh $\\Delta ABM = \\Delta ACM$.",
    imageType: 'ISOSCELES_MEDIAN',
    steps: [
      { id: 's1', text: 'Xét $\\Delta ABM$ và $\\Delta ACM$ có:', type: 'header' },
      { id: 's2', text: '$AB = AC$ ($\\Delta ABC$ cân tại A)', type: 'item' },
      { id: 's3', text: '$\\widehat{B} = \\widehat{C}$ ($\\Delta ABC$ cân tại A)', type: 'item' },
      { id: 's4', text: '$MB = MC$ (M là trung điểm BC)', type: 'item' },
      { id: 's5', text: '$\\Rightarrow \\Delta ABM = \\Delta ACM$ (c.g.c)', type: 'conclusion' }
      // Note: This could also be CCC, but we force CGC context for variety or accept variations in a real app
    ]
  },
  {
    id: 3,
    title: "Tam giác vuông (CH-CGV)",
    given: "Cho $\\Delta ABC$ cân tại A ($A < 90^o$). Kẻ $BD \\perp AC$, $CE \\perp AB$. Chứng minh $\\Delta ADB = \\Delta AEC$.",
    imageType: 'ALTITUDES',
    steps: [
      { id: 's1', text: 'Xét hai tam giác vuông $\\Delta ADB$ và $\\Delta AEC$ có:', type: 'header' },
      { id: 's2', text: '$\\widehat{D} = \\widehat{E} = 90^o$', type: 'item' },
      { id: 's3', text: '$AB = AC$ ($\\Delta ABC$ cân tại A)', type: 'item' },
      { id: 's4', text: '$\\widehat{A}$ là góc chung', type: 'item' },
      { id: 's5', text: '$\\Rightarrow \\Delta ADB = \\Delta AEC$ (cạnh huyền - góc nhọn)', type: 'conclusion' }
    ]
  }
];

// --- Data: Missing Element Problems (Quiz) ---
// We generate these somewhat randomly or pick from a pool
const MISSING_ELEMENT_POOL = [
  {
    id: 1,
    q: "Để $\\Delta ABC = \\Delta MNP$ theo trường hợp **Cạnh - Góc - Cạnh**, cần thêm điều kiện gì?",
    known: ["$AB = MN$", "$\\widehat{B} = \\widehat{N}$"],
    options: ["$BC = NP$", "$AC = MP$", "$\\widehat{C} = \\widehat{P}$", "$\\widehat{A} = \\widehat{M}$"],
    correct: 0,
    case: 'CGC'
  },
  {
    id: 2,
    q: "Để $\\Delta ABC = \\Delta DEF$ theo trường hợp **Góc - Cạnh - Góc**, cần thêm điều kiện gì?",
    known: ["$\\widehat{A} = \\widehat{D}$", "$AB = DE$"],
    options: ["$\\widehat{C} = \\widehat{F}$", "$\\widehat{B} = \\widehat{E}$", "$BC = EF$", "$AC = DF$"],
    correct: 1,
    case: 'GCG'
  },
  {
    id: 3,
    q: "Cho hai tam giác vuông $ABC$ ($A=90^o$) và $DEF$ ($D=90^o$). Biết $BC = EF$. Để chứng minh theo trường hợp **Cạnh huyền - Cạnh góc vuông**, cần thêm:",
    known: ["$\\widehat{A}=\\widehat{D}=90^o$", "$BC=EF$ (Cạnh huyền)"],
    options: ["$\\widehat{B}=\\widehat{E}$", "$AB=DE$", "$\\widehat{C}=\\widehat{F}$", "$\\widehat{B}=\\widehat{F}$"],
    correct: 1,
    case: 'CH-CGV'
  },
  {
    id: 4,
    q: "Để $\\Delta HIK = \\Delta RST$ theo trường hợp **Cạnh - Cạnh - Cạnh**, yếu tố nào còn thiếu?",
    known: ["$HI = RS$", "$IK = ST$"],
    options: ["$HK = RT$", "$\\widehat{I} = \\widehat{S}$", "$\\widehat{H} = \\widehat{R}$", "$HK = RS$"],
    correct: 0,
    case: 'CCC'
  }
];

const TriangleCongruenceGame: React.FC<TriangleCongruenceGameProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'THEORY' | 'PROOF' | 'QUIZ'>('THEORY');
  const [activeCase, setActiveCase] = useState<CongruenceCase>('CCC');
  
  // Proof Game State
  const [proofIdx, setProofIdx] = useState(0);
  const [poolSteps, setPoolSteps] = useState<any[]>([]);
  const [solutionSteps, setSolutionSteps] = useState<any[]>([]);
  const [proofStatus, setProofStatus] = useState<'PLAYING' | 'SUCCESS' | 'ERROR'>('PLAYING');

  // Quiz Game State
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Initialize Proof Level
  useEffect(() => {
    if (tab === 'PROOF') {
      const prob = PROOF_PROBLEMS[proofIdx];
      // Shuffle steps for the pool
      const shuffled = [...prob.steps].sort(() => 0.5 - Math.random());
      setPoolSteps(shuffled);
      setSolutionSteps([]);
      setProofStatus('PLAYING');
    }
  }, [tab, proofIdx]);

  // Handle Proof Logic
  const handleAddToSolution = (step: any) => {
    if (proofStatus === 'SUCCESS') return;
    setPoolSteps(prev => prev.filter(s => s.id !== step.id));
    setSolutionSteps(prev => [...prev, step]);
    setProofStatus('PLAYING'); // Reset error status on move
  };

  const handleRemoveFromSolution = (step: any) => {
    if (proofStatus === 'SUCCESS') return;
    setSolutionSteps(prev => prev.filter(s => s.id !== step.id));
    setPoolSteps(prev => [...prev, step]);
    setProofStatus('PLAYING');
  };

  const checkProof = () => {
    const prob = PROOF_PROBLEMS[proofIdx];
    // Simple check: Exact order match
    const currentOrderIds = solutionSteps.map(s => s.id).join(',');
    const correctOrderIds = prob.steps.map(s => s.id).join(',');

    if (currentOrderIds === correctOrderIds) {
      setProofStatus('SUCCESS');
      setScore(s => s + 20);
    } else {
      setProofStatus('ERROR');
    }
  };

  // Handle Quiz Logic
  const handleQuizAnswer = (optionIdx: number) => {
    if (quizFeedback) return;
    const prob = MISSING_ELEMENT_POOL[quizIdx];
    if (optionIdx === prob.correct) {
      setQuizFeedback("correct");
      setScore(s => s + 10);
      setTimeout(() => {
        if (quizIdx < MISSING_ELEMENT_POOL.length - 1) {
           setQuizIdx(i => i + 1);
           setQuizFeedback(null);
        } else {
           setQuizFeedback("done");
        }
      }, 1500);
    } else {
      setQuizFeedback("error");
    }
  };

  const resetQuiz = () => {
    setQuizIdx(0);
    setQuizFeedback(null);
    setScore(0);
  };

  // --- Visual Rendering for Theory ---
  const renderTheoryVisual = (c: CongruenceCase) => {
     // Coordinates for two congruent triangles
     // Triangle 1: ABC
     const A = {x: 100, y: 50}, B = {x: 50, y: 150}, C = {x: 150, y: 150};
     // Triangle 2: A'B'C' (Translated & maybe Rotated slightly for visual effect, but keeping aligned for clarity in theory)
     const offset = 220;
     const A2 = {x: 100 + offset, y: 50}, B2 = {x: 50 + offset, y: 150}, C2 = {x: 150 + offset, y: 150};

     // Right triangle coords overrides
     if (c === 'CH-GN' || c === 'CH-CGV') {
         A.x = 50; A.y = 50; // Top Left (A is 90 deg? No, usually A at top, B/C base. Let's make A bottom left for 90)
         // Let's make A = 90 deg.
         A.x = 50; A.y = 150; 
         B.x = 50; B.y = 50;
         C.x = 150; C.y = 150;
         
         A2.x = 50 + offset; A2.y = 150;
         B2.x = 50 + offset; B2.y = 50;
         C2.x = 150 + offset; C2.y = 150;
     }

     const mkColor = "#ef4444"; // Red for markings

     return (
        <svg viewBox="0 0 500 200" className="w-full h-full">
           <defs>
             <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#000" /></marker>
           </defs>
           
           {/* Triangle 1 */}
           <path d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`} fill="white" stroke="#334155" strokeWidth="2"/>
           <text x={A.x} y={A.y-10} textAnchor="middle" className="text-xs font-bold">A</text>
           <text x={B.x-10} y={B.y+5} textAnchor="middle" className="text-xs font-bold">B</text>
           <text x={C.x+10} y={C.y+5} textAnchor="middle" className="text-xs font-bold">C</text>

           {/* Triangle 2 */}
           <path d={`M ${A2.x} ${A2.y} L ${B2.x} ${B2.y} L ${C2.x} ${C2.y} Z`} fill="white" stroke="#334155" strokeWidth="2"/>
           <text x={A2.x} y={A2.y-10} textAnchor="middle" className="text-xs font-bold">A'</text>
           <text x={B2.x-10} y={B2.y+5} textAnchor="middle" className="text-xs font-bold">B'</text>
           <text x={C2.x+10} y={C2.y+5} textAnchor="middle" className="text-xs font-bold">C'</text>

           {/* Markings based on Case */}
           {c === 'CCC' && (
             <>
               {/* Side 1 */}
               <line x1={(A.x+B.x)/2 - 3} y1={(A.y+B.y)/2 - 3} x2={(A.x+B.x)/2 + 3} y2={(A.y+B.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>
               <line x1={(A2.x+B2.x)/2 - 3} y1={(A2.y+B2.y)/2 - 3} x2={(A2.x+B2.x)/2 + 3} y2={(A2.y+B2.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>
               
               {/* Side 2 */}
               <line x1={(B.x+C.x)/2} y1={(B.y+C.y)/2 - 4} x2={(B.x+C.x)/2} y2={(B.y+C.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>
               <line x1={(B.x+C.x)/2 + 4} y1={(B.y+C.y)/2 - 4} x2={(B.x+C.x)/2 + 4} y2={(B.y+C.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>

               <line x1={(B2.x+C2.x)/2} y1={(B2.y+C2.y)/2 - 4} x2={(B2.x+C2.x)/2} y2={(B2.y+C2.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>
               <line x1={(B2.x+C2.x)/2 + 4} y1={(B2.y+C2.y)/2 - 4} x2={(B2.x+C2.x)/2 + 4} y2={(B2.y+C2.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>

               {/* Side 3 */}
               <line x1={(A.x+C.x)/2 - 4} y1={(A.y+C.y)/2 + 4} x2={(A.x+C.x)/2 + 4} y2={(A.y+C.y)/2 - 4} stroke={mkColor} strokeWidth="2"/>
               <line x1={(A2.x+C2.x)/2 - 4} y1={(A2.y+C2.y)/2 + 4} x2={(A2.x+C2.x)/2 + 4} y2={(A2.y+C2.y)/2 - 4} stroke={mkColor} strokeWidth="2"/>
             </>
           )}

           {c === 'CGC' && (
             <>
               {/* Side AB */}
               <line x1={(A.x+B.x)/2 - 3} y1={(A.y+B.y)/2 - 3} x2={(A.x+B.x)/2 + 3} y2={(A.y+B.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>
               <line x1={(A2.x+B2.x)/2 - 3} y1={(A2.y+B2.y)/2 - 3} x2={(A2.x+B2.x)/2 + 3} y2={(A2.y+B2.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>

               {/* Angle B */}
               <path d={`M ${B.x+15} ${B.y} A 15 15 0 0 0 ${B.x+8} ${B.y-12}`} fill="none" stroke={mkColor} strokeWidth="2" />
               <path d={`M ${B2.x+15} ${B2.y} A 15 15 0 0 0 ${B2.x+8} ${B2.y-12}`} fill="none" stroke={mkColor} strokeWidth="2" />

               {/* Side BC */}
               <line x1={(B.x+C.x)/2} y1={(B.y+C.y)/2 - 4} x2={(B.x+C.x)/2} y2={(B.y+C.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>
               <line x1={(B2.x+C2.x)/2} y1={(B2.y+C2.y)/2 - 4} x2={(B2.x+C2.x)/2} y2={(B2.y+C2.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>
             </>
           )}

           {(c === 'GCG') && (
             <>
               {/* Angle B */}
               <path d={`M ${B.x+15} ${B.y} A 15 15 0 0 0 ${B.x+8} ${B.y-12}`} fill="none" stroke={mkColor} strokeWidth="2" />
               <path d={`M ${B2.x+15} ${B2.y} A 15 15 0 0 0 ${B2.x+8} ${B2.y-12}`} fill="none" stroke={mkColor} strokeWidth="2" />

               {/* Side BC */}
               <line x1={(B.x+C.x)/2} y1={(B.y+C.y)/2 - 4} x2={(B.x+C.x)/2} y2={(B.y+C.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>
               <line x1={(B2.x+C2.x)/2} y1={(B2.y+C2.y)/2 - 4} x2={(B2.x+C2.x)/2} y2={(B2.y+C2.y)/2 + 4} stroke={mkColor} strokeWidth="2"/>

               {/* Angle C */}
               <path d={`M ${C.x-15} ${C.y} A 15 15 0 0 1 ${C.x-8} ${C.y-12}`} fill="none" stroke={mkColor} strokeWidth="2" />
               <path d={`M ${C.x-11} ${C.y-8} L ${C.x-8} ${C.y-4}`} stroke={mkColor} strokeWidth="2"/> {/* Tick on angle */}

               <path d={`M ${C2.x-15} ${C2.y} A 15 15 0 0 1 ${C2.x-8} ${C2.y-12}`} fill="none" stroke={mkColor} strokeWidth="2" />
               <path d={`M ${C2.x-11} ${C2.y-8} L ${C2.x-8} ${C2.y-4}`} stroke={mkColor} strokeWidth="2"/>
             </>
           )}

           {(c === 'CH-GN') && (
             <>
                {/* Right Angle */}
                <path d={`M ${A.x} ${A.y-10} L ${A.x+10} ${A.y-10} L ${A.x+10} ${A.y}`} fill="none" stroke="black" />
                <path d={`M ${A2.x} ${A2.y-10} L ${A2.x+10} ${A2.y-10} L ${A2.x+10} ${A2.y}`} fill="none" stroke="black" />

                {/* Hypotenuse BC */}
                <line x1={(B.x+C.x)/2 - 3} y1={(B.y+C.y)/2 - 3} x2={(B.x+C.x)/2 + 3} y2={(B.y+C.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>
                <line x1={(B2.x+C2.x)/2 - 3} y1={(B2.y+C2.y)/2 - 3} x2={(B2.x+C2.x)/2 + 3} y2={(B2.y+C2.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>

                {/* Acute Angle C */}
                <path d={`M ${C.x-20} ${C.y} A 20 20 0 0 1 ${C.x-15} ${C.y-15}`} fill="none" stroke={mkColor} strokeWidth="2" />
                <path d={`M ${C2.x-20} ${C2.y} A 20 20 0 0 1 ${C2.x-15} ${C2.y-15}`} fill="none" stroke={mkColor} strokeWidth="2" />
             </>
           )}

            {(c === 'CH-CGV') && (
             <>
                {/* Right Angle */}
                <path d={`M ${A.x} ${A.y-10} L ${A.x+10} ${A.y-10} L ${A.x+10} ${A.y}`} fill="none" stroke="black" />
                <path d={`M ${A2.x} ${A2.y-10} L ${A2.x+10} ${A2.y-10} L ${A2.x+10} ${A2.y}`} fill="none" stroke="black" />

                {/* Hypotenuse BC */}
                <line x1={(B.x+C.x)/2 - 3} y1={(B.y+C.y)/2 - 3} x2={(B.x+C.x)/2 + 3} y2={(B.y+C.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>
                <line x1={(B2.x+C2.x)/2 - 3} y1={(B2.y+C2.y)/2 - 3} x2={(B2.x+C2.x)/2 + 3} y2={(B2.y+C2.y)/2 + 3} stroke={mkColor} strokeWidth="2"/>

                {/* Leg AB */}
                <line x1={(A.x+B.x)/2 - 4} y1={(A.y+B.y)/2} x2={(A.x+B.x)/2 + 4} y2={(A.y+B.y)/2} stroke={mkColor} strokeWidth="2"/>
                <line x1={(A2.x+B2.x)/2 - 4} y1={(A2.y+B2.y)/2} x2={(A2.x+B2.x)/2 + 4} y2={(A2.y+B2.y)/2} stroke={mkColor} strokeWidth="2"/>
             </>
           )}

        </svg>
     );
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Chứng minh hai tam giác bằng nhau</h2>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
          <Trophy className="w-4 h-4"/> Điểm: {score}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-teal-100 shadow-sm md:w-fit mx-auto">
          <button 
             onClick={() => setTab('THEORY')} 
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${tab === 'THEORY' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <BookOpen className="w-4 h-4"/> Lý thuyết
          </button>
          <button 
             onClick={() => setTab('PROOF')} 
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${tab === 'PROOF' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <Layers className="w-4 h-4"/> Sắp xếp lời giải
          </button>
          <button 
             onClick={() => setTab('QUIZ')} 
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${tab === 'QUIZ' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <HelpCircle className="w-4 h-4"/> Điền khuyết
          </button>
      </div>

      {/* --- CONTENT: THEORY --- */}
      {tab === 'THEORY' && (
         <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-2">
                {Object.keys(THEORY_DATA).map((key) => {
                    const k = key as CongruenceCase;
                    return (
                        <button 
                           key={k}
                           onClick={() => setActiveCase(k)}
                           className={`p-4 rounded-xl border-2 text-left transition-all ${
                               activeCase === k 
                               ? 'bg-teal-50 border-teal-500 shadow-md' 
                               : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                           }`}
                        >
                           <div className={`font-bold ${activeCase === k ? 'text-teal-800' : 'text-slate-700'}`}>
                               {THEORY_DATA[k].title}
                           </div>
                           <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 inline-block px-1 rounded">
                               {k}
                           </div>
                        </button>
                    );
                })}
            </div>
            
            <div className="flex-[2] bg-white rounded-2xl shadow-xl border border-teal-100 p-6 flex flex-col items-center">
                 <div className="w-full h-48 bg-slate-50 rounded-xl mb-6 border border-slate-100">
                    {renderTheoryVisual(activeCase)}
                 </div>
                 
                 <div className="w-full text-center space-y-4">
                     <h3 className="text-2xl font-bold text-teal-700">{THEORY_DATA[activeCase].title}</h3>
                     <p className="text-slate-600">{THEORY_DATA[activeCase].desc}</p>
                     <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-900 font-bold text-lg">
                         <MathMessage text={THEORY_DATA[activeCase].notation} />
                     </div>
                 </div>
            </div>
         </div>
      )}

      {/* --- CONTENT: PROOF GAME --- */}
      {tab === 'PROOF' && (
         <div className="flex flex-col h-full gap-4">
            {/* Problem Statement */}
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl">
               <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-teal-800 text-lg">{PROOF_PROBLEMS[proofIdx].title}</h3>
                   <div className="flex gap-2">
                       <button onClick={() => setProofIdx(Math.max(0, proofIdx-1))} disabled={proofIdx === 0} className="p-1 rounded bg-white border disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
                       <span className="font-bold text-slate-500 px-2">{proofIdx+1}/{PROOF_PROBLEMS.length}</span>
                       <button onClick={() => setProofIdx(Math.min(PROOF_PROBLEMS.length-1, proofIdx+1))} disabled={proofIdx === PROOF_PROBLEMS.length-1} className="p-1 rounded bg-white border disabled:opacity-50"><ChevronLeft className="w-5 h-5 rotate-180"/></button>
                   </div>
               </div>
               <p className="text-slate-700"><MathMessage text={PROOF_PROBLEMS[proofIdx].given} /></p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1">
               {/* Pool */}
               <div className="flex-1 bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Layers className="w-4 h-4"/> Các bước (Nhấn để chọn)
                  </div>
                  {poolSteps.map((step) => (
                      <button 
                        key={step.id} 
                        onClick={() => handleAddToSolution(step)}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm transition-all active:scale-95"
                      >
                         <MathMessage text={step.text} className={step.type === 'header' ? 'font-bold text-slate-800' : step.type === 'conclusion' ? 'font-bold text-teal-700' : 'text-slate-700'} />
                      </button>
                  ))}
                  {poolSteps.length === 0 && <div className="text-center text-slate-400 italic mt-4">Đã chọn hết các bước</div>}
               </div>

               {/* Arrow */}
               <div className="flex items-center justify-center lg:rotate-[-90deg]">
                  <ArrowDown className="w-8 h-8 text-slate-300" />
               </div>

               {/* Solution */}
               <div className={`flex-1 bg-white border-2 rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                   proofStatus === 'SUCCESS' ? 'border-green-400 bg-green-50' : 
                   proofStatus === 'ERROR' ? 'border-red-300 bg-red-50' : 'border-dashed border-slate-300'
               }`}>
                   <div className="flex justify-between items-center">
                       <div className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                          <PenTool className="w-4 h-4"/> Lời giải của bạn
                       </div>
                       {proofStatus === 'SUCCESS' && <div className="text-green-700 font-bold flex items-center gap-1"><CheckCircle className="w-5 h-5"/> Chính xác!</div>}
                       {proofStatus === 'ERROR' && <div className="text-red-700 font-bold text-sm">Sai thứ tự rồi!</div>}
                   </div>

                   {solutionSteps.map((step, idx) => (
                      <button 
                        key={step.id}
                        onClick={() => handleRemoveFromSolution(step)}
                        className="p-3 bg-white border border-slate-200 rounded-lg text-left shadow-sm flex gap-3 hover:bg-red-50 hover:border-red-200 group"
                      >
                         <span className="font-bold text-slate-300 select-none group-hover:text-red-300">{idx+1}.</span>
                         <MathMessage text={step.text} className={step.type === 'header' ? 'font-bold text-slate-800' : step.type === 'conclusion' ? 'font-bold text-teal-700' : 'text-slate-700'} />
                      </button>
                   ))}

                   {solutionSteps.length > 0 && proofStatus !== 'SUCCESS' && (
                       <button 
                         onClick={checkProof} 
                         className="mt-auto py-3 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 shadow-md"
                       >
                         Kiểm tra
                       </button>
                   )}
               </div>
            </div>
         </div>
      )}

      {/* --- CONTENT: QUIZ (Missing Element) --- */}
      {tab === 'QUIZ' && (
         <div className="max-w-3xl mx-auto w-full">
             {quizFeedback === 'done' ? (
                 <div className="text-center py-12 bg-white rounded-2xl shadow-xl border border-teal-100">
                     <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                     <h3 className="text-2xl font-bold text-slate-800 mb-2">Hoàn thành xuất sắc!</h3>
                     <p className="text-slate-500 mb-6">Bạn đã nắm vững các trường hợp bằng nhau của tam giác.</p>
                     <button onClick={resetQuiz} className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold shadow hover:bg-teal-700">Làm lại</button>
                 </div>
             ) : (
                 <div className="bg-white rounded-2xl shadow-xl border border-teal-100 overflow-hidden">
                     <div className="h-2 bg-slate-100 w-full">
                         <div className="h-full bg-teal-500 transition-all duration-500" style={{width: `${((quizIdx+1) / MISSING_ELEMENT_POOL.length) * 100}%`}}></div>
                     </div>
                     
                     <div className="p-8">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Câu hỏi {quizIdx + 1} / {MISSING_ELEMENT_POOL.length}</div>
                         <h3 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                             <MathMessage text={MISSING_ELEMENT_POOL[quizIdx].q} />
                         </h3>
                         
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                             <div className="text-sm font-bold text-slate-500 mb-2">Giả thiết đã có:</div>
                             <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium">
                                 {MISSING_ELEMENT_POOL[quizIdx].known.map((k, i) => (
                                     <li key={i}><MathMessage text={k} /></li>
                                 ))}
                             </ul>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {MISSING_ELEMENT_POOL[quizIdx].options.map((opt, idx) => (
                                 <button
                                     key={idx}
                                     onClick={() => handleQuizAnswer(idx)}
                                     disabled={!!quizFeedback}
                                     className={`p-4 rounded-xl border-2 text-left font-bold text-lg transition-all ${
                                         quizFeedback && idx === MISSING_ELEMENT_POOL[quizIdx].correct
                                         ? 'bg-green-100 border-green-500 text-green-800'
                                         : quizFeedback && idx !== MISSING_ELEMENT_POOL[quizIdx].correct && quizFeedback === 'error' // Simple logic, assumes user clicks once. Better logic requires tracking selected index.
                                         ? 'opacity-50' 
                                         : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                                     }`}
                                 >
                                     <MathMessage text={opt} />
                                 </button>
                             ))}
                         </div>
                         
                         {quizFeedback === 'error' && (
                             <div className="mt-4 text-center text-red-600 font-bold animate-pulse">Chưa đúng, hãy thử lại!</div>
                         )}
                     </div>
                 </div>
             )}
         </div>
      )}

    </div>
  );
};

export default TriangleCongruenceGame;