import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, RefreshCw, CheckCircle, XCircle, BrainCircuit, ArrowRight, Plus, Minus } from 'lucide-react';
import FractionVisual from './FractionVisual';
import { getMathExplanation } from '../services/geminiService';
import { GameMode, TeacherMessage } from '../types';

interface FractionGameProps {
  onBack: () => void;
}

const PALETTE = [
  'fill-red-400', 'fill-orange-400', 'fill-amber-400', 
  'fill-lime-400', 'fill-green-400', 'fill-emerald-400', 'fill-teal-400', 
  'fill-cyan-400', 'fill-sky-400', 'fill-blue-400', 'fill-indigo-400', 
  'fill-violet-400', 'fill-purple-400', 'fill-fuchsia-400', 'fill-pink-400', 
  'fill-rose-400'
];

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

// Helper component to render MathJax
const MathMessage: React.FC<{ text: string }> = ({ text }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && (window as any).MathJax) {
      // Clear previous mathjax elements if any (simple reset)
      // Trigger typeset
      (window as any).MathJax.typesetPromise([containerRef.current]).catch((err: any) => console.log('MathJax error:', err));
    }
  }, [text]);

  return <span ref={containerRef} dangerouslySetInnerHTML={{ __html: text }} />;
};

const FractionGame: React.FC<FractionGameProps> = ({ onBack }) => {
  const [mode, setMode] = useState<GameMode>(GameMode.EQUALITY);
  
  // State for Equality Mode
  const [targetFraction, setTargetFraction] = useState({ n: 1, d: 2 });
  const [userFraction, setUserFraction] = useState({ n: 1, d: 2 });
  
  // State for Addition Mode
  const [addOp1, setAddOp1] = useState({ n: 1, d: 4 });
  const [addOp2, setAddOp2] = useState({ n: 2, d: 4 }); 
  const [addResult, setAddResult] = useState({ n: 1, d: 4 });
  const [addColors, setAddColors] = useState({ op1: 'fill-blue-400', op2: 'fill-purple-400' });

  const [message, setMessage] = useState<TeacherMessage>({ text: "Chào mừng các em đến với bài học Phân số!", type: 'intro' });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize Equality Level
  const initEquality = useCallback(() => {
    const d = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, 5
    const n = Math.floor(Math.random() * (d - 1)) + 1;
    setTargetFraction({ n, d });
    // User starts reset
    setUserFraction({ n: 1, d: Math.floor(Math.random() * 5) + 2 }); 
    setMessage({ text: "Hãy kéo thanh trượt để điều chỉnh phân số bên phải sao cho bằng bên trái nhé!", type: 'intro' });
  }, []);

  // Initialize Addition Level with Diversity
  const initAddition = useCallback(() => {
    // Randomize colors
    const c1 = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    let c2 = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    while (c1 === c2) c2 = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    setAddColors({ op1: c1, op2: c2 });

    const isDifferentDenom = Math.random() > 0.4; // 60% chance for different denom

    if (isDifferentDenom) {
       let valid = false;
       let attempts = 0;
       while (!valid && attempts < 50) {
         attempts++;
         const d1 = Math.floor(Math.random() * 5) + 2; // 2..6
         const d2 = Math.floor(Math.random() * 5) + 2; // 2..6
         
         if (d1 === d2) continue;

         // Check LCM to keep visuals clean (max slices ~12)
         const lcm = (d1 * d2) / gcd(d1, d2);
         if (lcm > 12) continue;

         const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
         
         // n2 constraint: n1/d1 + n2/d2 <= 1
         const maxN2 = Math.floor(d2 * (1 - (n1/d1)));
         if (maxN2 < 1) continue;

         const n2 = Math.floor(Math.random() * maxN2) + 1;

         setAddOp1({ n: n1, d: d1 });
         setAddOp2({ n: n2, d: d2 });
         setAddResult({ n: 1, d: 2 }); // Reset user input to basic
         setMessage({ text: "Hai phân số khác mẫu! Em hãy tìm mẫu số chung trước nhé.", type: 'intro' });
         valid = true;
       }
       // Fallback if loop fails
       if (!valid) {
          setAddOp1({n:1, d:2}); setAddOp2({n:1, d:3}); setAddResult({n:1, d:2});
          setMessage({ text: "Hai phân số khác mẫu! Em hãy tìm mẫu số chung trước nhé.", type: 'intro' });
       }
    } else {
       // Same Denom
       const d = [3, 4, 5, 6, 7, 8, 9, 10, 12][Math.floor(Math.random() * 9)];
       const n1 = Math.floor(Math.random() * (d - 1)) + 1;
       const maxN2 = d - n1;
       
       if (maxN2 < 1) { 
           setAddOp1({n: 1, d}); setAddOp2({n: 1, d});
       } else {
           const n2 = Math.floor(Math.random() * maxN2) + 1;
           setAddOp1({ n: n1, d });
           setAddOp2({ n: n2, d });
       }
       setAddResult({ n: 1, d: 2 });
       setMessage({ text: "Cùng mẫu số thì cộng tử số thôi! Cố lên nào.", type: 'intro' });
    }
  }, []);

  useEffect(() => {
    if (mode === GameMode.EQUALITY) initEquality();
    else initAddition();
  }, [mode, initEquality, initAddition]);

  const checkEquality = () => {
    const val1 = targetFraction.n / targetFraction.d;
    const val2 = userFraction.n / userFraction.d;
    
    // Check float equality with epsilon
    if (Math.abs(val1 - val2) < 0.001) {
      setMessage({ text: "Chính xác! Hai phân số bằng nhau. Giỏi lắm!", type: 'success' });
      setScore(s => s + 10);
      setTimeout(initEquality, 2000);
    } else {
      setMessage({ text: "Chưa đúng rồi. Hãy quan sát kỹ phần tô màu nhé.", type: 'error' });
    }
  };

  const checkAddition = () => {
    const val1 = addOp1.n / addOp1.d;
    const val2 = addOp2.n / addOp2.d;
    const expected = val1 + val2;
    const user = addResult.n / addResult.d;

    if (Math.abs(user - expected) < 0.001) {
       // Using LaTeX formatting
       const latexEq = `Xuất sắc! $\\frac{${addOp1.n}}{${addOp1.d}} + \\frac{${addOp2.n}}{${addOp2.d}} = \\frac{${addResult.n}}{${addResult.d}}$`;
       setMessage({ text: latexEq, type: 'success' });
       setScore(s => s + 10);
       setTimeout(initAddition, 3000);
    } else {
       if (addResult.d === addOp1.d && addOp1.d !== addOp2.d) {
         setMessage({ text: "Chưa đúng. Hai phân số đang khác mẫu số, em cần quy đồng mẫu số chung trước.", type: 'error' });
       } else {
         setMessage({ text: "Kết quả chưa chính xác. Hãy kiểm tra lại tử số và mẫu số nhé.", type: 'error' });
       }
    }
  };

  const askAi = async () => {
    setIsAiLoading(true);
    let topic = "";
    let data = "";

    if (mode === GameMode.EQUALITY) {
      topic = "So sánh phân số bằng hình ảnh trực quan";
      data = `Phân số mục tiêu: ${targetFraction.n}/${targetFraction.d}. Phân số học sinh đang chọn: ${userFraction.n}/${userFraction.d}.`;
    } else {
      topic = "Cộng phân số";
      data = `Phép tính: ${addOp1.n}/${addOp1.d} + ${addOp2.n}/${addOp2.d}. Kết quả học sinh chọn: ${addResult.n}/${addResult.d}.`;
    }

    const explanation = await getMathExplanation(topic, data);
    setMessage({ text: explanation, type: 'ai' });
    setIsAiLoading(false);
  };

  // Controls Component with Slider
  const NumberControl = ({ 
    label, 
    value, 
    onChange, 
    min = 1, 
    max = 12 
  }: { label: string, value: number, onChange: (v: number) => void, min?: number, max?: number }) => (
    <div className="flex flex-col items-center mx-2 bg-white p-3 rounded-lg shadow-sm border border-teal-100 w-full md:w-48">
      <div className="flex justify-between w-full items-center mb-1">
         <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
         <span className="text-xl font-bold text-teal-700 bg-teal-50 px-2 rounded">{value}</span>
      </div>
      
      {/* Slider Input */}
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 my-2 hover:bg-slate-300 transition-colors"
      />

      <div className="flex items-center justify-between w-full gap-2">
        <button 
          onClick={() => onChange(Math.max(min, value - 1))}
          className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
          title="Giảm"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => onChange(Math.min(max, value + 1))}
          className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600 transition-colors"
          title="Tăng"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 animate-fade-in">
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="hidden md:inline">Quay lại</span>
        </button>
        
        <div className="flex bg-white rounded-full p-1 shadow-md border border-teal-100">
          <button 
            onClick={() => setMode(GameMode.EQUALITY)}
            className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-colors ${mode === GameMode.EQUALITY ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            Đẳng thức
          </button>
          <button 
            onClick={() => setMode(GameMode.ADDITION)}
            className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-colors ${mode === GameMode.ADDITION ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            Cộng phân số
          </button>
        </div>

        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 md:px-4 md:py-2 rounded-lg font-bold shadow-sm text-sm md:text-base">
          Điểm: {score}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 flex flex-col relative overflow-hidden h-[60vh] md:h-auto">
        
        {/* Visual Stage - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative custom-scrollbar">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4 md:p-8 min-h-full">
            
            {mode === GameMode.EQUALITY && (
              <>
                {/* Left Side (Locked) */}
                <div className="flex flex-col items-center">
                  <div className="mb-4 bg-white p-4 rounded-full shadow-lg">
                    <FractionVisual numerator={targetFraction.n} denominator={targetFraction.d} />
                  </div>
                  <div className="text-3xl font-bold text-slate-700 font-mono">
                    {targetFraction.n} <hr className="border-t-2 border-slate-700 w-full my-1" /> {targetFraction.d}
                  </div>
                </div>

                <div className="text-4xl text-slate-400 font-bold my-4 md:my-0">=</div>

                {/* Right Side (Interactive) */}
                <div className="flex flex-col items-center p-6 bg-teal-50/50 rounded-xl border-2 border-dashed border-teal-200">
                  <div className="mb-6 bg-white p-4 rounded-full shadow-lg ring-4 ring-teal-100">
                    <FractionVisual numerator={userFraction.n} denominator={userFraction.d} />
                  </div>
                  
                  <div className="flex flex-col gap-4 w-full">
                    <NumberControl 
                      label="Tử số" 
                      value={userFraction.n} 
                      onChange={(v) => setUserFraction(prev => ({ ...prev, n: v }))}
                      max={userFraction.d} 
                    />
                    <hr className="border-t-2 border-slate-300 w-full" />
                    <NumberControl 
                      label="Mẫu số" 
                      value={userFraction.d} 
                      onChange={(v) => setUserFraction(prev => ({ ...prev, d: v, n: Math.min(prev.n, v) }))} 
                    />
                  </div>
                </div>
              </>
            )}

            {mode === GameMode.ADDITION && (
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Operand 1 */}
                <div className="flex flex-col items-center scale-75 md:scale-90">
                  <FractionVisual numerator={addOp1.n} denominator={addOp1.d} color={addColors.op1} />
                  <span className="mt-2 text-2xl font-bold font-mono">{addOp1.n}/{addOp1.d}</span>
                </div>
                
                <Plus className="w-8 h-8 text-slate-400" />
                
                {/* Operand 2 */}
                <div className="flex flex-col items-center scale-75 md:scale-90">
                  <FractionVisual numerator={addOp2.n} denominator={addOp2.d} color={addColors.op2} />
                  <span className="mt-2 text-2xl font-bold font-mono">{addOp2.n}/{addOp2.d}</span>
                </div>

                <ArrowRight className="w-8 h-8 text-slate-400 rotate-90 md:rotate-0 my-2" />

                {/* Result Input */}
                <div className="flex flex-col items-center p-6 bg-teal-50 rounded-xl border-2 border-teal-200">
                   <FractionVisual numerator={addResult.n} denominator={addResult.d} color="fill-teal-500" />
                   <div className="mt-6 flex flex-col gap-4 w-full">
                      <NumberControl 
                        label="Tử số kết quả" 
                        value={addResult.n} 
                        onChange={(v) => setAddResult(prev => ({...prev, n: v}))}
                        max={addResult.d * 2} // Allow result to go higher for improper fractions
                      />
                      <hr className="w-full border-t-2 border-slate-400" />
                       <NumberControl 
                        label="Mẫu số kết quả" 
                        value={addResult.d} 
                        onChange={(v) => setAddResult(prev => ({...prev, d: v}))}
                        max={12}
                      />
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white border-t border-slate-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
          <div className={`flex items-start gap-3 flex-1 p-3 rounded-lg w-full ${
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'ai' ? 'bg-purple-50 text-purple-900' :
            'bg-slate-50 text-slate-700'
          }`}>
             <div className="mt-1 flex-shrink-0">
               {message.type === 'ai' && <BrainCircuit className="w-5 h-5 text-purple-600" />}
               {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
               {message.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
               {message.type === 'intro' && <span className="text-2xl">👨‍🏫</span>}
             </div>
             <div className="font-medium text-sm md:text-base leading-tight">
               <MathMessage text={message.text} />
             </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
             <button 
                onClick={askAi}
                disabled={isAiLoading}
                className="flex-1 md:flex-none flex items-center justify-center px-3 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-bold transition-all disabled:opacity-50 text-sm whitespace-nowrap"
             >
               {isAiLoading ? '...' : 'Hỏi AI'}
               <BrainCircuit className="ml-1 w-4 h-4" />
             </button>

             <button 
                onClick={mode === GameMode.EQUALITY ? checkEquality : checkAddition}
                className="flex-[2] md:flex-none flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-lg shadow-teal-200 font-bold text-lg transform hover:scale-105 transition-all whitespace-nowrap"
             >
               Kiểm tra
               <CheckCircle className="ml-2 w-5 h-5" />
             </button>

             <button 
               onClick={mode === GameMode.EQUALITY ? initEquality : initAddition}
               className="flex-none p-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
               title="Làm lại"
             >
               <RefreshCw className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FractionGame;