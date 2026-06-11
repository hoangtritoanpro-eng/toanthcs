import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, BookOpen, Calculator, CheckCircle, HelpCircle, RefreshCw, Trophy, Settings, ArrowRight, X } from 'lucide-react';

interface LCMGCDGameProps {
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

// --- Logic Helpers ---
// Get prime factorization as a map: {2: 2, 3: 1} for 12 (2^2 * 3)
const getPrimeFactors = (n: number): Record<number, number> => {
  const factors: Record<number, number> = {};
  let d = 2;
  let temp = n;
  while (d * d <= temp) {
    while (temp % d === 0) {
      factors[d] = (factors[d] || 0) + 1;
      temp /= d;
    }
    d++;
  }
  if (temp > 1) {
    factors[temp] = (factors[temp] || 0) + 1;
  }
  return factors;
};

// Convert factor map to LaTeX string: 2^2 \cdot 3
const formatFactors = (factors: Record<number, number>) => {
  return Object.entries(factors)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([base, exp]) => exp === 1 ? base : `${base}^${exp}`)
    .join(' \\cdot ');
};

const LCMGCDGame: React.FC<LCMGCDGameProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'GCD' | 'LCM'>('GCD'); // GCD: UCLN, LCM: BCNN
  const [levelData, setLevelData] = useState<{
    num1: number;
    num2: number;
    factors1: Record<number, number>;
    factors2: Record<number, number>;
    allBases: number[];
  } | null>(null);

  // User Selection State
  const [selectedBases, setSelectedBases] = useState<number[]>([]);
  const [selectedExponents, setSelectedExponents] = useState<Record<number, number>>({});
  
  const [feedback, setFeedback] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);
  const [score, setScore] = useState(0);
  const [step, setStep] = useState(1); // 1: Select Bases, 2: Select Exponents, 3: Result

  const initLevel = () => {
    // Generate numbers that share some factors but not all
    let n1, n2, common;
    do {
       n1 = Math.floor(Math.random() * 90) + 10;
       n2 = Math.floor(Math.random() * 90) + 10;
       // Ensure meaningful problem (not coprime if GCD mode, not multiples if possible)
       const f1 = getPrimeFactors(n1);
       const f2 = getPrimeFactors(n2);
       const bases1 = Object.keys(f1).map(Number);
       const bases2 = Object.keys(f2).map(Number);
       common = bases1.filter(b => bases2.includes(b));
    } while (n1 === n2 || (mode === 'GCD' && common.length === 0));

    const f1 = getPrimeFactors(n1);
    const f2 = getPrimeFactors(n2);
    // Union of all bases
    const allBases = Array.from(new Set([...Object.keys(f1), ...Object.keys(f2)])).map(Number).sort((a,b) => a-b);

    setLevelData({ num1: n1, num2: n2, factors1: f1, factors2: f2, allBases });
    
    // Reset state
    setSelectedBases([]);
    setSelectedExponents({});
    setFeedback(null);
    setStep(1);
  };

  useEffect(() => {
    initLevel();
  }, [mode]);

  // --- Handlers ---

  const toggleBase = (base: number) => {
    if (step !== 1) return;
    setSelectedBases(prev => 
      prev.includes(base) ? prev.filter(b => b !== base) : [...prev, base]
    );
  };

  const checkBases = () => {
    if (!levelData) return;
    const { factors1, factors2 } = levelData;
    const b1 = Object.keys(factors1).map(Number);
    const b2 = Object.keys(factors2).map(Number);
    
    let correctBases: number[] = [];
    if (mode === 'GCD') {
        // Common bases
        correctBases = b1.filter(b => b2.includes(b));
    } else {
        // All bases (Union)
        correctBases = Array.from(new Set([...b1, ...b2]));
    }

    const isCorrect = 
        selectedBases.length === correctBases.length && 
        selectedBases.every(b => correctBases.includes(b));

    if (isCorrect) {
        setStep(2);
        setFeedback({ type: 'success', text: 'Chính xác! Bây giờ hãy chọn số mũ phù hợp.' });
        // Initialize exponents for selected bases
        const initialExps: Record<number, number> = {};
        selectedBases.forEach(b => initialExps[b] = 1);
        setSelectedExponents(initialExps);
    } else {
        setFeedback({ 
            type: 'error', 
            text: mode === 'GCD' 
                ? 'Sai rồi. ƯCLN chỉ lấy các thừa số nguyên tố CHUNG.' 
                : 'Sai rồi. BCNN lấy tất cả các thừa số nguyên tố CHUNG và RIÊNG.' 
        });
    }
  };

  const setExponent = (base: number, exp: number) => {
      setSelectedExponents(prev => ({ ...prev, [base]: exp }));
  };

  const checkExponents = () => {
      if (!levelData) return;
      const { factors1, factors2 } = levelData;
      
      let isCorrect = true;
      for (const base of selectedBases) {
          const exp1 = factors1[base] || 0;
          const exp2 = factors2[base] || 0;
          const correctExp = mode === 'GCD' ? Math.min(exp1, exp2) : Math.max(exp1, exp2 || 0, factors1[base] || 0); // LCM takes max
          
          if (selectedExponents[base] !== correctExp) {
              isCorrect = false;
              break;
          }
      }

      if (isCorrect) {
          setScore(s => s + 10);
          setStep(3);
          setFeedback({ type: 'success', text: 'Tuyệt vời! Bạn đã lập công thức đúng.' });
      } else {
          setFeedback({ 
              type: 'error', 
              text: mode === 'GCD' 
                  ? 'ƯCLN chọn số mũ NHỎ NHẤT của mỗi thừa số chung.' 
                  : 'BCNN chọn số mũ LỚN NHẤT của mỗi thừa số.' 
          });
      }
  };

  // --- Rendering ---

  if (!levelData) return <div>Loading...</div>;

  const renderFactorization = (num: number, factors: Record<number, number>) => (
      <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-lg font-mono text-slate-700">
          <MathMessage text={`$${num} = ${formatFactors(factors)}$`} />
      </div>
  );

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Ước chung & Bội chung</h2>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
          <Trophy className="w-4 h-4"/> Điểm: {score}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow border border-teal-100 flex">
              <button 
                onClick={() => setMode('GCD')} 
                className={`px-6 py-2 rounded-lg font-bold transition-all ${mode === 'GCD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  ƯCLN (Ước chung lớn nhất)
              </button>
              <button 
                onClick={() => setMode('LCM')} 
                className={`px-6 py-2 rounded-lg font-bold transition-all ${mode === 'LCM' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  BCNN (Bội chung nhỏ nhất)
              </button>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-6 md:p-8 flex flex-col gap-8">
          
          {/* 1. Problem & Factorization Display */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              <div className="text-center">
                  <div className="text-sm font-bold text-slate-400 mb-1">Số thứ nhất</div>
                  {renderFactorization(levelData.num1, levelData.factors1)}
              </div>
              <div className="text-2xl text-slate-300 font-light">&</div>
              <div className="text-center">
                  <div className="text-sm font-bold text-slate-400 mb-1">Số thứ hai</div>
                  {renderFactorization(levelData.num2, levelData.factors2)}
              </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* 2. Interactive Area */}
          <div className="flex-1 flex flex-col items-center">
              
              {/* Step 1: Select Bases */}
              <div className={`transition-all duration-500 ${step === 1 ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                  <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Bước 1: Chọn thừa số nguyên tố</h3>
                      <p className="text-slate-500 text-sm">
                          {mode === 'GCD' 
                            ? 'Chọn các thừa số chung của cả hai số.' 
                            : 'Chọn tất cả các thừa số (chung và riêng) của hai số.'}
                      </p>
                  </div>
                  <div className="flex gap-4 justify-center flex-wrap">
                      {levelData.allBases.map(base => (
                          <button 
                            key={base}
                            onClick={() => toggleBase(base)}
                            className={`w-12 h-12 rounded-full font-bold text-lg border-2 transition-all ${
                                selectedBases.includes(base) 
                                ? (mode === 'GCD' ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-orange-100 border-orange-500 text-orange-700')
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                            }`}
                          >
                              {base}
                          </button>
                      ))}
                  </div>
                  {step === 1 && (
                      <div className="text-center mt-6">
                          <button onClick={checkBases} className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold shadow hover:bg-teal-700">Tiếp tục</button>
                      </div>
                  )}
              </div>

              {/* Step 2: Select Exponents */}
              {step >= 2 && (
                  <div className={`mt-8 transition-all duration-500 ${step === 2 ? 'opacity-100' : step === 3 ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="text-center mb-4">
                          <h3 className="text-lg font-bold text-slate-800">Bước 2: Chọn số mũ</h3>
                          <p className="text-slate-500 text-sm">
                              {mode === 'GCD' 
                                ? 'Với mỗi thừa số, chọn số mũ NHỎ NHẤT.' 
                                : 'Với mỗi thừa số, chọn số mũ LỚN NHẤT.'}
                          </p>
                      </div>
                      <div className="flex gap-6 justify-center flex-wrap items-end">
                          {selectedBases.map(base => {
                              const exp1 = levelData.factors1[base] || 0;
                              const exp2 = levelData.factors2[base] || 0;
                              const maxExp = Math.max(exp1, exp2);
                              
                              return (
                                  <div key={base} className="flex flex-col items-center gap-2">
                                      <div className="flex flex-col gap-1 h-24 justify-end">
                                          {/* Exponent options visualizer - simplified to buttons */}
                                          {[...Array(maxExp)].map((_, i) => {
                                              const val = i + 1;
                                              return (
                                                  <button
                                                    key={val}
                                                    onClick={() => step === 2 && setExponent(base, val)}
                                                    className={`w-8 h-6 text-xs rounded border transition-colors ${
                                                        selectedExponents[base] === val 
                                                        ? 'bg-teal-600 text-white border-teal-600'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                  >
                                                      ^{val}
                                                  </button>
                                              )
                                          })}
                                      </div>
                                      <div className="text-2xl font-serif font-bold text-slate-800">
                                          {base}
                                          <sup className="text-teal-600 font-sans">{selectedExponents[base]}</sup>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      {step === 2 && (
                          <div className="text-center mt-6">
                              <button onClick={checkExponents} className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold shadow hover:bg-teal-700">Kiểm tra</button>
                          </div>
                      )}
                  </div>
              )}

              {/* Final Result */}
              {step === 3 && (
                  <div className="mt-8 bg-green-50 p-6 rounded-xl border border-green-200 text-center animate-bounce-small">
                      <div className="text-green-800 font-bold mb-2">KẾT QUẢ</div>
                      <div className="text-3xl font-bold text-slate-800">
                          {mode}({levelData.num1}, {levelData.num2}) = <MathMessage text={`$${
                              selectedBases.map(b => `${b}^${selectedExponents[b]}`).join(' \\cdot ')
                          }$`} />
                      </div>
                      <div className="text-slate-500 font-bold mt-2 text-xl">
                          = {selectedBases.reduce((acc, b) => acc * Math.pow(b, selectedExponents[b]), 1)}
                      </div>
                      <button onClick={initLevel} className="mt-6 px-6 py-2 bg-white border border-green-300 text-green-700 rounded-lg font-bold shadow-sm hover:bg-green-100 flex items-center gap-2 mx-auto">
                          <RefreshCw className="w-4 h-4"/> Bài tiếp theo
                      </button>
                  </div>
              )}

          </div>

          {/* Feedback Area */}
          <div className="h-12 flex justify-center items-end">
              {feedback && (
                  <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold animate-in fade-in slide-in-from-bottom-2 ${
                      feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                      {feedback.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <X className="w-5 h-5"/>}
                      {feedback.text}
                  </div>
              )}
          </div>

      </div>
      
      {/* Mini Rule Cheat Sheet */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className={`p-4 rounded-xl border-2 ${mode === 'GCD' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 opacity-60'}`}>
              <h4 className="font-bold text-indigo-900 mb-1">Quy tắc tìm ƯCLN</h4>
              <ul className="list-disc pl-5 text-indigo-800 space-y-1">
                  <li>Chọn thừa số nguyên tố <b>chung</b>.</li>
                  <li>Lấy số mũ <b>nhỏ nhất</b>.</li>
              </ul>
          </div>
          <div className={`p-4 rounded-xl border-2 ${mode === 'LCM' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 opacity-60'}`}>
              <h4 className="font-bold text-orange-900 mb-1">Quy tắc tìm BCNN</h4>
              <ul className="list-disc pl-5 text-orange-800 space-y-1">
                  <li>Chọn thừa số nguyên tố <b>chung và riêng</b>.</li>
                  <li>Lấy số mũ <b>lớn nhất</b>.</li>
              </ul>
          </div>
      </div>

    </div>
  );
};

export default LCMGCDGame;