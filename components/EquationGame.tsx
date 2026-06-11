import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RefreshCw, CheckCircle, XCircle, BrainCircuit, Scale, ArrowRight, Plus, Minus, AlertCircle, Dices, Settings2, ArrowLeftRight, Calculator } from 'lucide-react';
import { getMathExplanation } from '../services/geminiService';
import { TeacherMessage } from '../types';

// --- Shared Types & Helpers ---
interface SideState {
  xCount: number;
  unitCount: number;
}

// Improved MathJax Helper
const MathMessage: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (containerRef.current && (window as any).MathJax) {
        // Set content directly
        containerRef.current.innerHTML = text;
        try {
          const mathJax = (window as any).MathJax;
          // Use typesetPromise if available for better performance
          if (mathJax.typesetPromise) {
            await mathJax.typesetClear([containerRef.current]);
            await mathJax.typesetPromise([containerRef.current]);
          } else if (mathJax.typeset) {
            mathJax.typeset([containerRef.current]);
          }
        } catch (e) {
          console.warn("MathJax formatting warning", e);
        }
      }
    };
    renderMath();
  }, [text]);

  return <span ref={containerRef} className={className} style={{ display: 'inline-block', minHeight: '1.5em' }} />;
};

// Formatting Helper: Converts state to clean LaTeX string
const formatExpression = (s: SideState) => {
  let parts = [];
  
  // Handle x term
  if (s.xCount !== 0) {
     if (s.xCount === 1) parts.push('x');
     else if (s.xCount === -1) parts.push('-x');
     else parts.push(`${s.xCount}x`);
  }
  
  // Handle unit term
  if (s.unitCount !== 0) {
     if (parts.length === 0) {
       parts.push(`${s.unitCount}`);
     } else {
       if (s.unitCount > 0) parts.push(`+ ${s.unitCount}`);
       else parts.push(`- ${Math.abs(s.unitCount)}`);
     }
  }
  
  if (parts.length === 0) return '0';
  return parts.join(' ');
};

// --- Visual Components ---

interface BalanceScaleProps {
  lhs: SideState;
  rhs: SideState;
  solutionX: number;
}

const BalanceScale: React.FC<BalanceScaleProps> = ({ lhs, rhs, solutionX }) => {
  // Logic to determine tilt
  const lVal = lhs.xCount * solutionX + lhs.unitCount;
  const rVal = rhs.xCount * solutionX + rhs.unitCount;
  
  // Calculate tilt angle (degrees)
  let tiltAngle = 0;
  if (Math.abs(lVal - rVal) > 0.001) {
    // Limit max tilt
    tiltAngle = lVal > rVal ? -12 : 12;
  }

  const yOffset = tiltAngle === 0 ? 0 : tiltAngle > 0 ? 40 : -40;
  const leftY = -yOffset; 
  const rightY = yOffset; 

  const renderBlocks = (count: number, type: 'x' | '1' | '-x' | '-1') => {
    const blocks = [];
    const absCount = Math.abs(count);
    // Limit visual blocks
    const displayCount = Math.min(absCount, 15); 
    const isOverflow = absCount > 15;

    for (let i = 0; i < displayCount; i++) {
      let colorClass = '';
      let text = '';
      let shapeClass = '';

      if (type === 'x' || type === '-x') {
        colorClass = count > 0 
          ? 'bg-blue-500 border-blue-600 text-white shadow-[0_3px_0_#1e40af]' 
          : 'bg-white border-2 border-blue-500 text-blue-600 shadow-sm';
        text = count > 0 ? 'x' : '-x';
        shapeClass = 'w-10 h-10 rounded md:w-12 md:h-12 text-sm md:text-base font-bold';
      } else {
        colorClass = count > 0 
          ? 'bg-amber-300 border-amber-500 text-amber-900 shadow-[0_3px_0_#b45309]' 
          : 'bg-white border-2 border-amber-400 text-amber-700 shadow-sm';
        text = count > 0 ? '1' : '-1';
        shapeClass = 'w-8 h-8 rounded-full md:w-10 md:h-10 text-xs md:text-sm font-bold';
      }

      blocks.push(
        <div key={`${type}-${i}`} className={`${shapeClass} ${colorClass} border flex items-center justify-center m-[3px] transition-all animate-in zoom-in duration-300`}>
          {text}
        </div>
      );
    }
    
    if (isOverflow) {
       blocks.push(
        <div key="overflow" className="text-xs font-bold text-slate-500 ml-1 self-center">+{absCount - 15}</div>
       )
    }

    return blocks;
  };

  return (
    <div className="relative w-full h-80 flex items-end justify-center mt-20 md:mt-24 mb-12">
      {/* Base */}
      <div className="absolute bottom-0 w-48 h-6 bg-slate-700 rounded-t-xl z-10 shadow-lg"></div>
      <div className="absolute bottom-6 w-6 h-36 bg-slate-400 z-0 bg-gradient-to-r from-slate-500 to-slate-400"></div>

      {/* Beam (Tilting) */}
      <div 
        className="absolute bottom-[9.5rem] w-[95%] h-4 bg-slate-600 rounded-full z-10 shadow-lg origin-center transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ transform: `rotate(${tiltAngle}deg)` }}
      ></div>

      {/* Plates Container */}
      <div className="absolute bottom-[9.5rem] w-[95%] flex justify-between px-2 items-end pointer-events-none">
        
        {/* Left Plate System */}
        <div 
          className="flex flex-col items-center transform relative transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ transform: `translateY(calc(6rem + ${leftY}px))` }}
        >
           {/* Label Bubble */}
           <div className="absolute -top-[16rem] transition-all duration-300 pointer-events-auto hover:scale-110">
             <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border-2 border-teal-200 text-teal-900 font-bold text-lg whitespace-nowrap z-20 min-w-[100px] text-center">
               <MathMessage text={`$${formatExpression(lhs)}$`} />
             </div>
             <div className="w-[2px] h-12 bg-teal-200/50 mx-auto"></div>
           </div>

          {/* Items */}
          <div className="mb-3 flex flex-wrap-reverse justify-center w-44 md:w-60 gap-1 content-end min-h-[120px]">
             {renderBlocks(lhs.xCount, lhs.xCount >= 0 ? 'x' : '-x')}
             {renderBlocks(lhs.unitCount, lhs.unitCount >= 0 ? '1' : '-1')}
          </div>
          {/* Plate */}
          <div className="w-52 md:w-72 h-4 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full shadow-lg relative border-b-4 border-slate-500/20">
             <div className="absolute -top-24 left-1/2 -ml-[1px] w-[2px] h-24 bg-slate-400"></div>
          </div>
        </div>

        {/* Right Plate System */}
        <div 
          className="flex flex-col items-center transform relative transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ transform: `translateY(calc(6rem + ${rightY}px))` }}
        >
           {/* Label Bubble */}
           <div className="absolute -top-[16rem] transition-all duration-300 pointer-events-auto hover:scale-110">
             <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border-2 border-teal-200 text-teal-900 font-bold text-lg whitespace-nowrap z-20 min-w-[100px] text-center">
               <MathMessage text={`$${formatExpression(rhs)}$`} />
             </div>
             <div className="w-[2px] h-12 bg-teal-200/50 mx-auto"></div>
           </div>

          {/* Items */}
          <div className="mb-3 flex flex-wrap-reverse justify-center w-44 md:w-60 gap-1 content-end min-h-[120px]">
             {renderBlocks(rhs.xCount, rhs.xCount >= 0 ? 'x' : '-x')}
             {renderBlocks(rhs.unitCount, rhs.unitCount >= 0 ? '1' : '-1')}
          </div>
          {/* Plate */}
          <div className="w-52 md:w-72 h-4 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full shadow-lg relative border-b-4 border-slate-500/20">
            <div className="absolute -top-24 left-1/2 -ml-[1px] w-[2px] h-24 bg-slate-400"></div>
          </div>
        </div>
      </div>

      {/* Center Pivot */}
      <div className="absolute bottom-[8.5rem] w-10 h-10 bg-teal-500 rounded-full border-4 border-white z-20 shadow-xl flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full"></div>
      </div>
    </div>
  );
};

// --- Main Game Component ---

interface EquationGameProps {
  onBack: () => void;
}

const EquationGame: React.FC<EquationGameProps> = ({ onBack }) => {
  const [lhs, setLhs] = useState<SideState>({ xCount: 3, unitCount: 1 });
  const [rhs, setRhs] = useState<SideState>({ xCount: 1, unitCount: 7 });
  const [solutionX, setSolutionX] = useState<number>(3);
  const [message, setMessage] = useState<TeacherMessage>({ text: "Hãy tìm giá trị của x sao cho cân thăng bằng!", type: 'intro' });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');

  // User input states for custom steps
  const [xStep, setXStep] = useState<number>(1);
  const [numStep, setNumStep] = useState<number>(1);

  // Generate a new solvable linear equation
  const initLevel = useCallback(() => {
    const x = Math.floor(Math.random() * 8) - 3; 
    if (x === 0) { initLevel(); return; }

    const A = Math.floor(Math.random() * 4) + 1; 
    const C = Math.floor(Math.random() * 3); 
    const finalA = A + C + 1; 
    const finalC = C;
    const B = Math.floor(Math.random() * 5);
    const D = (finalA * x) + B - (finalC * x);

    if (Math.abs(B) > 8 || Math.abs(D) > 8) {
       initLevel(); return;
    }

    setSolutionX(x);
    setLhs({ xCount: finalA, unitCount: B });
    setRhs({ xCount: finalC, unitCount: D });
    setMessage({ text: "Mục tiêu: Cô lập x về một vế. Em có thể thay đổi giá trị thêm/bớt ở bên dưới.", type: 'intro' });
    setXStep(1);
    setNumStep(1);
    setUserAnswer('');
  }, []);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Check balance and update message
  useEffect(() => {
    const lVal = lhs.xCount * solutionX + lhs.unitCount;
    const rVal = rhs.xCount * solutionX + rhs.unitCount;
    const isBalanced = Math.abs(lVal - rVal) < 0.001;

    if (isBalanced) {
      if ((lhs.xCount === 1 && lhs.unitCount === 0 && rhs.xCount === 0) || 
          (rhs.xCount === 1 && rhs.unitCount === 0 && lhs.xCount === 0)) {
         setMessage({ text: `Tuyệt vời! Phương trình đã được giải: $x = ${solutionX}$.`, type: 'success' });
      } else if ((lhs.xCount === -1 && lhs.unitCount === 0 && rhs.xCount === 0) || 
          (rhs.xCount === -1 && rhs.unitCount === 0 && lhs.xCount === 0)) {
           setMessage({ text: `Gần đúng rồi! Em đang có $-x$, hãy đổi dấu cả 2 vế để tìm $x$.`, type: 'intro' });   
      }
    } else {
      setMessage({ text: "Cẩn thận! Cân đang bị nghiêng. Hãy làm cho hai vế bằng nhau.", type: 'error' });
    }
  }, [lhs, rhs, solutionX]);


  // Operations
  const modifySide = (side: 'left' | 'right' | 'both', type: 'x' | '1', sign: number) => {
    const amount = type === 'x' ? xStep : numStep;
    const value = sign * amount;
    
    if (amount > 100) {
      setMessage({ text: "Giá trị quá lớn, hãy chọn số nhỏ hơn nhé!", type: 'error' });
      return;
    }

    if (side === 'left' || side === 'both') {
      setLhs(prev => ({
        ...prev,
        xCount: type === 'x' ? prev.xCount + value : prev.xCount,
        unitCount: type === '1' ? prev.unitCount + value : prev.unitCount
      }));
    }
    
    if (side === 'right' || side === 'both') {
      setRhs(prev => ({
        ...prev,
        xCount: type === 'x' ? prev.xCount + value : prev.xCount,
        unitCount: type === '1' ? prev.unitCount + value : prev.unitCount
      }));
    }

    // Feedback logic (optional)
  };

  // Divide Both Sides
  const handleDivide = () => {
    let coeff = 0;
    if (lhs.xCount !== 0 && rhs.xCount === 0) coeff = lhs.xCount;
    else if (rhs.xCount !== 0 && lhs.xCount === 0) coeff = rhs.xCount;
    
    if (coeff === 0) coeff = Math.max(Math.abs(lhs.xCount), Math.abs(rhs.xCount));
    if (coeff === 0 || coeff === 1 || coeff === -1) {
       setMessage({ text: "Chưa cần chia hoặc không thể chia lúc này.", type: 'hint' });
       return;
    }

    if (lhs.xCount % coeff === 0 && lhs.unitCount % coeff === 0 &&
        rhs.xCount % coeff === 0 && rhs.unitCount % coeff === 0) {
        
        setLhs({ xCount: lhs.xCount / coeff, unitCount: lhs.unitCount / coeff });
        setRhs({ xCount: rhs.xCount / coeff, unitCount: rhs.unitCount / coeff });
        setMessage({ text: `Đã chia cả hai vế cho ${coeff}.`, type: 'hint' });
    } else {
        setMessage({ text: `Không thể chia hết cho ${coeff}. Hãy rút gọn phương trình thêm.`, type: 'error' });
    }
  };

  const checkAnswer = () => {
    const val = parseInt(userAnswer);
    if (isNaN(val)) {
      setMessage({ text: "Vui lòng nhập một số nguyên.", type: 'error' });
      return;
    }
    if (val === solutionX) {
      setMessage({ text: `Chính xác! $x = ${solutionX}$. Chúc mừng em!`, type: 'success' });
      setScore(s => s + 20);
      setTimeout(initLevel, 3000);
    } else {
      setMessage({ text: `Chưa đúng. Em hãy thử biến đổi tiếp hoặc kiểm tra lại nhé.`, type: 'error' });
    }
  }

  const getFullEquationLatex = () => {
    return `$${formatExpression(lhs)} = ${formatExpression(rhs)}$`;
  };

  const askAi = async () => {
    setIsAiLoading(true);
    const eq = getFullEquationLatex().replace(/\$/g, '');
    const prompt = `Phương trình hiện tại: ${eq}. Học sinh đang cố gắng cân bằng 2 vế. Gợi ý nước đi tiếp theo.`;
    const explanation = await getMathExplanation("Giải phương trình bậc nhất", prompt, "lớp 8");
    setMessage({ text: explanation, type: 'ai' });
    setIsAiLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] md:h-full max-w-6xl mx-auto p-2 md:p-4 animate-fade-in">
       {/* Header */}
       <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="hidden md:inline">Quay lại</span>
        </button>
        <div className="bg-white px-4 md:px-8 py-3 rounded-2xl shadow-sm border border-teal-100 hidden md:block">
           <span className="text-3xl font-bold text-slate-800 tracking-wider">
             <MathMessage text={getFullEquationLatex()} />
           </span>
        </div>
        <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-xl font-bold shadow-sm border border-yellow-100">
          Điểm: {score}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 flex flex-col relative overflow-hidden">
        
        {/* Visualization Area - Flexible & Scrollable */}
        <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 overflow-y-auto custom-scrollbar relative">
           {/* Mobile Equation Display */}
           <div className="md:hidden absolute top-4 left-0 w-full text-center pointer-events-none">
              <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow border border-teal-100 font-bold text-xl text-slate-800">
                 <MathMessage text={getFullEquationLatex()} />
              </span>
           </div>

           <BalanceScale lhs={lhs} rhs={rhs} solutionX={solutionX} />
        </div>

        {/* Controls Area - Fixed at bottom of container, scrollable if needed on very small screens */}
        <div className="bg-white border-t border-slate-200 z-10 flex-shrink-0 max-h-[50vh] overflow-y-auto custom-scrollbar">
          
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
            
             {/* SECTION 1: Config & Tools */}
             <div className="p-3 md:p-4 md:w-56 flex flex-col gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <Settings2 className="w-4 h-4"/> Tùy chỉnh
                </div>
                
                {/* Num Step */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                   <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">1</div>
                   <input 
                      type="number" 
                      min="1" max="99" 
                      value={numStep} 
                      onChange={(e) => setNumStep(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 p-1 text-center border-none outline-none font-bold text-slate-700 bg-transparent"
                   />
                   <button onClick={() => setNumStep(Math.floor(Math.random() * 9) + 1)} className="ml-auto text-slate-400 hover:text-teal-600"><Dices className="w-4 h-4"/></button>
                </div>

                {/* X Step */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                   <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">x</div>
                   <input 
                      type="number" 
                      min="1" max="10" 
                      value={xStep} 
                      onChange={(e) => setXStep(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 p-1 text-center border-none outline-none font-bold text-slate-700 bg-transparent"
                   />
                   <span className="text-xs text-slate-400 ml-auto">Hệ số</span>
                </div>

                <button onClick={handleDivide} className="mt-auto w-full py-2 bg-white border border-teal-200 text-teal-700 rounded-lg font-bold hover:bg-teal-50 text-sm">
                  Chia để rút gọn
                </button>
             </div>

            {/* SECTION 2: Operations */}
            <div className="p-3 md:p-4 flex-1">
               
               {/* Independent Controls */}
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                     <div className="text-center font-bold text-blue-800/60 mb-2 text-xs uppercase">Vế Trái (LHS)</div>
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => modifySide('left', 'x', 1)} className="h-10 bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Plus className="w-3 h-3 mr-1"/>{xStep}x</button>
                        <button onClick={() => modifySide('left', 'x', -1)} className="h-10 bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Minus className="w-3 h-3 mr-1"/>{xStep}x</button>
                        <button onClick={() => modifySide('left', '1', 1)} className="h-10 bg-white text-amber-600 border border-amber-200 rounded hover:bg-amber-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Plus className="w-3 h-3 mr-1"/>{numStep}</button>
                        <button onClick={() => modifySide('left', '1', -1)} className="h-10 bg-white text-amber-600 border border-amber-200 rounded hover:bg-amber-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Minus className="w-3 h-3 mr-1"/>{numStep}</button>
                     </div>
                  </div>
                  <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                     <div className="text-center font-bold text-indigo-800/60 mb-2 text-xs uppercase">Vế Phải (RHS)</div>
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => modifySide('right', 'x', 1)} className="h-10 bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Plus className="w-3 h-3 mr-1"/>{xStep}x</button>
                        <button onClick={() => modifySide('right', 'x', -1)} className="h-10 bg-white text-blue-600 border border-blue-200 rounded hover:bg-blue-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Minus className="w-3 h-3 mr-1"/>{xStep}x</button>
                        <button onClick={() => modifySide('right', '1', 1)} className="h-10 bg-white text-amber-600 border border-amber-200 rounded hover:bg-amber-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Plus className="w-3 h-3 mr-1"/>{numStep}</button>
                        <button onClick={() => modifySide('right', '1', -1)} className="h-10 bg-white text-amber-600 border border-amber-200 rounded hover:bg-amber-50 font-bold flex justify-center items-center text-sm shadow-sm active:translate-y-0.5"><Minus className="w-3 h-3 mr-1"/>{numStep}</button>
                     </div>
                  </div>
               </div>

               {/* Both Sides Control (For convenience/balance) */}
               <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg">
                  <div className="text-xs font-bold text-slate-500 uppercase flex items-center whitespace-nowrap"><ArrowLeftRight className="w-3 h-3 mr-1"/> Cả 2 vế:</div>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                     <button onClick={() => modifySide('both', 'x', 1)} className="py-2 bg-white text-slate-700 rounded shadow-sm text-xs font-bold hover:bg-slate-50 border border-slate-200">+{xStep}x</button>
                     <button onClick={() => modifySide('both', 'x', -1)} className="py-2 bg-white text-slate-700 rounded shadow-sm text-xs font-bold hover:bg-slate-50 border border-slate-200">-{xStep}x</button>
                     <button onClick={() => modifySide('both', '1', 1)} className="py-2 bg-white text-slate-700 rounded shadow-sm text-xs font-bold hover:bg-slate-50 border border-slate-200">+{numStep}</button>
                     <button onClick={() => modifySide('both', '1', -1)} className="py-2 bg-white text-slate-700 rounded shadow-sm text-xs font-bold hover:bg-slate-50 border border-slate-200">-{numStep}</button>
                  </div>
               </div>

            </div>

            {/* SECTION 3: Feedback & Input */}
            <div className="p-3 md:p-4 md:w-72 bg-slate-50/50 flex flex-col justify-between gap-3">
              <div className={`p-3 rounded-lg flex-1 overflow-y-auto max-h-24 md:max-h-none ${
                message.type === 'error' ? 'bg-red-50 text-red-900 border border-red-100' :
                message.type === 'success' ? 'bg-green-50 text-green-900 border border-green-100' :
                message.type === 'ai' ? 'bg-purple-50 text-purple-900 border border-purple-100' :
                'bg-white text-slate-700 border border-slate-200'
              }`}>
                 <div className="flex items-start gap-2">
                   <div className="mt-0.5">
                     {message.type === 'ai' && <BrainCircuit className="w-4 h-4 text-purple-600" />}
                     {message.type === 'intro' && <Scale className="w-4 h-4 text-teal-600" />}
                     {message.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                     {message.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                   </div>
                   <div className="text-sm">
                      <MathMessage text={message.text} />
                   </div>
                 </div>
              </div>

               {/* Solve Input */}
              <div className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700">x = </span>
                  <input 
                    type="number" 
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                    className="w-full p-1 border-b-2 border-slate-200 outline-none focus:border-teal-500 font-bold text-center"
                    placeholder="?"
                  />
                  <button onClick={checkAnswer} className="bg-teal-500 text-white p-2 rounded hover:bg-teal-600"><CheckCircle className="w-4 h-4"/></button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={askAi} 
                  disabled={isAiLoading}
                  className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-xs font-bold flex items-center justify-center transition-colors border border-purple-200"
                >
                  {isAiLoading ? '...' : 'Gợi ý AI'} <BrainCircuit className="ml-1 w-3 h-3" />
                </button>
                <button 
                  onClick={initLevel} 
                  className="px-3 py-2 bg-white text-slate-600 rounded-lg hover:bg-slate-100 border border-slate-200 text-xs font-bold flex items-center transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EquationGame;