import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, BookOpen, Layers, CheckCircle, HelpCircle, RefreshCw, Trophy, Target, Calculator, AlignCenterVertical } from 'lucide-react';

interface PolynomialGameProps {
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

type GameTab = 'ANALYSE' | 'LIKE_TERMS' | 'MONO_CALC' | 'POLY_COLUMN';

const PolynomialGame: React.FC<PolynomialGameProps> = ({ onBack }) => {
  const [tab, setTab] = useState<GameTab>('ANALYSE');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{type: 'success'|'error'|'neutral', text: string} | null>(null);

  // --- STATE: Analyse ---
  const [analyseData, setAnalyseData] = useState({ coeff: 0, vars: 'x', latex: '' });
  const [userCoeff, setUserCoeff] = useState('');
  const [userVar, setUserVar] = useState(''); // Simple check, or better: multiple choice for var part

  // --- STATE: Like Terms ---
  const [likeTarget, setLikeTarget] = useState({ latex: '', varPart: '' });
  const [likeOptions, setLikeOptions] = useState<{id: number, latex: string, isLike: boolean, selected: boolean}[]>([]);

  // --- STATE: Mono Calc ---
  const [monoCalc, setMonoCalc] = useState({ q: '', ans: 0 });
  const [userMonoAns, setUserMonoAns] = useState('');

  // --- STATE: Poly Column ---
  const [polyCol, setPolyCol] = useState<{
    p: number[], // coefficients [x^2, x^1, x^0]
    q: number[],
    op: '+' | '-',
    result: number[]
  } | null>(null);
  const [userPolyAns, setUserPolyAns] = useState<string[]>(['', '', '']);

  // --- GENERATORS ---

  const getRandomInt = (min: number, max: number) => {
      const val = Math.floor(Math.random() * (max - min + 1)) + min;
      return val === 0 ? 1 : val; // Avoid 0 for coeffs usually
  };

  const generateMonomialStr = (coeff: number, xExp: number, yExp: number) => {
      let str = coeff === 1 ? '' : coeff === -1 ? '-' : `${coeff}`;
      if (xExp > 0) str += xExp === 1 ? 'x' : `x^${xExp}`;
      if (yExp > 0) str += yExp === 1 ? 'y' : `y^${yExp}`;
      if (xExp === 0 && yExp === 0 && Math.abs(coeff) === 1) str += '1'; 
      return str;
  };

  const getVarPartLatex = (xExp: number, yExp: number) => {
      let str = '';
      if (xExp > 0) str += xExp === 1 ? 'x' : `x^${xExp}`;
      if (yExp > 0) str += yExp === 1 ? 'y' : `y^${yExp}`;
      return str || ''; // constant
  };

  // 1. Analyse Game
  const initAnalyse = () => {
      const c = getRandomInt(-9, 9);
      const x = Math.floor(Math.random() * 3) + 1; // 1..3
      const y = Math.floor(Math.random() * 3); // 0..2
      
      const latex = generateMonomialStr(c, x, y);
      const vars = getVarPartLatex(x, y);
      
      setAnalyseData({ coeff: c, vars, latex: `$${latex}$` });
      setUserCoeff('');
      setUserVar('');
      setFeedback(null);
  };

  // 2. Like Terms Game
  const initLikeTerms = () => {
      // Base variable part
      const x = Math.floor(Math.random() * 3) + 1;
      const y = Math.floor(Math.random() * 2) + 1;
      const varPart = getVarPartLatex(x, y);
      const targetCoeff = getRandomInt(-5, 5);
      const targetLatex = `$${generateMonomialStr(targetCoeff, x, y)}$`;

      // Generate 6 options
      const opts = [];
      let correctCount = 0;
      
      for(let i=0; i<6; i++) {
          const isLike = Math.random() > 0.5; // 50% chance
          if (isLike) correctCount++;
          
          let latex = '';
          const c = getRandomInt(-9, 9);
          if (isLike) {
              latex = `$${generateMonomialStr(c, x, y)}$`;
          } else {
              // Create Distractor
              // Swap powers or change variable
              if (Math.random() > 0.5) {
                  latex = `$${generateMonomialStr(c, y, x)}$`; // Swap powers
              } else {
                  latex = `$${generateMonomialStr(c, x, 0)}$`; // Remove y
              }
          }
          opts.push({ id: i, latex, isLike, selected: false });
      }
      
      // Ensure at least 1 correct answer
      if (correctCount === 0) {
          opts[0].isLike = true;
          opts[0].latex = `$${generateMonomialStr(getRandomInt(2,9), x, y)}$`;
      }

      setLikeTarget({ latex: targetLatex, varPart });
      setLikeOptions(opts);
      setFeedback(null);
  };

  // 3. Mono Calc
  const initMonoCalc = () => {
      const x = Math.floor(Math.random() * 2) + 1;
      const y = Math.floor(Math.random() * 2);
      const varPart = getVarPartLatex(x, y);
      
      const c1 = getRandomInt(-10, 10);
      const c2 = getRandomInt(-10, 10);
      const isAdd = Math.random() > 0.5;
      
      const op = isAdd ? '+' : '-';
      const ans = isAdd ? c1 + c2 : c1 - c2;
      
      // Format: (3x^2) + (-5x^2)
      const term1 = generateMonomialStr(c1, x, y);
      let term2 = generateMonomialStr(c2, x, y);
      if (c2 < 0) term2 = `(${term2})`;
      
      const q = `$${term1} ${op} ${term2} = ?$`;
      
      setMonoCalc({ q, ans });
      setUserMonoAns('');
      setFeedback(null);
  };

  // 4. Poly Column
  const initPolyCol = () => {
      // P(x) = ax^2 + bx + c
      const p = [getRandomInt(1, 5), getRandomInt(-5, 5), getRandomInt(-9, 9)];
      const q = [getRandomInt(1, 5), getRandomInt(-5, 5), getRandomInt(-9, 9)];
      const isAdd = Math.random() > 0.5;
      
      const res = isAdd 
          ? p.map((val, i) => val + q[i])
          : p.map((val, i) => val - q[i]);
          
      setPolyCol({ p, q, op: isAdd ? '+' : '-', result: res });
      setUserPolyAns(['', '', '']);
      setFeedback(null);
  };

  useEffect(() => {
      if (tab === 'ANALYSE') initAnalyse();
      if (tab === 'LIKE_TERMS') initLikeTerms();
      if (tab === 'MONO_CALC') initMonoCalc();
      if (tab === 'POLY_COLUMN') initPolyCol();
  }, [tab]);

  // --- HANDLERS ---

  // 1. Analyse Handler
  const checkAnalyse = () => {
      const c = parseInt(userCoeff);
      // Simplify var check: remove spaces, optional ^1
      // Ideally we use a multiple choice for vars to avoid parsing, but let's try simple exact match logic first 
      // or actually, let's provide buttons for Var Part to select? 
      // Re-design: User enters Coeff. For Var part, we just ask "Phần biến là gì?" and give 2 choices? 
      // Let's stick to input coefficient ONLY for simplicity, and visually identifying var part.
      // Wait, request asked for "Identify single term, coeff, var part".
      // Let's make user input coeff. And for Var part, show 3 options.
      
      if (isNaN(c)) return;
      
      if (c === analyseData.coeff) {
          setScore(s => s + 10);
          setFeedback({ type: 'success', text: 'Chính xác! Hệ số đúng.' });
          setTimeout(initAnalyse, 1500);
      } else {
          setFeedback({ type: 'error', text: `Sai rồi. Hệ số là ${analyseData.coeff}.` });
      }
  };

  // 2. Like Terms Handler
  const toggleOption = (idx: number) => {
      if (feedback) return;
      const newOpts = [...likeOptions];
      newOpts[idx].selected = !newOpts[idx].selected;
      setLikeOptions(newOpts);
  };

  const checkLikeTerms = () => {
      const correctSelected = likeOptions.every(o => (o.isLike && o.selected) || (!o.isLike && !o.selected));
      if (correctSelected) {
          setScore(s => s + 20);
          setFeedback({ type: 'success', text: 'Tuyệt vời! Bạn đã tìm đúng các đơn thức đồng dạng.' });
          setTimeout(initLikeTerms, 2000);
      } else {
          // Highlight errors?
          setFeedback({ type: 'error', text: 'Chưa chính xác. Đơn thức đồng dạng phải có phần biến GIỐNG HỆT nhau.' });
      }
  };

  // 3. Mono Calc Handler
  const checkMonoCalc = () => {
      if (parseInt(userMonoAns) === monoCalc.ans) {
          setScore(s => s + 10);
          setFeedback({ type: 'success', text: 'Đúng rồi!' });
          setTimeout(initMonoCalc, 1500);
      } else {
          setFeedback({ type: 'error', text: 'Sai rồi. Cộng/Trừ đơn thức đồng dạng: Ta cộng/trừ hệ số và giữ nguyên phần biến.' });
      }
  };

  // 4. Poly Column Handler
  const checkPolyCol = () => {
      if (!polyCol) return;
      // Check each coefficient
      const isCorrect = userPolyAns.every((val, idx) => parseInt(val) === polyCol.result[idx]);
      
      if (isCorrect) {
          setScore(s => s + 30);
          setFeedback({ type: 'success', text: 'Xuất sắc! Bạn đã thực hiện phép tính đa thức thành thạo.' });
          setTimeout(initPolyCol, 3000);
      } else {
          setFeedback({ type: 'error', text: 'Kết quả chưa đúng. Hãy kiểm tra lại từng cột nhé.' });
      }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Đơn thức & Đa thức</h2>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
          <Trophy className="w-4 h-4"/> Điểm: {score}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-1 rounded-xl border border-teal-100 shadow-sm md:w-fit mx-auto justify-center">
          <button onClick={() => setTab('ANALYSE')} className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${tab === 'ANALYSE' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
             <Target className="w-4 h-4"/> Nhận diện
          </button>
          <button onClick={() => setTab('LIKE_TERMS')} className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${tab === 'LIKE_TERMS' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
             <Layers className="w-4 h-4"/> Đồng dạng
          </button>
          <button onClick={() => setTab('MONO_CALC')} className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${tab === 'MONO_CALC' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
             <Calculator className="w-4 h-4"/> Cộng Trừ Đơn
          </button>
          <button onClick={() => setTab('POLY_COLUMN')} className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${tab === 'POLY_COLUMN' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>
             <AlignCenterVertical className="w-4 h-4"/> Cột dọc Đa thức
          </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 p-6 relative min-h-[400px]">
          
          {/* 1. ANALYSE */}
          {tab === 'ANALYSE' && (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                  <div className="text-center">
                      <div className="text-sm text-slate-500 font-bold mb-2">Cho đơn thức:</div>
                      <div className="text-5xl font-bold text-slate-800 bg-slate-50 px-8 py-6 rounded-2xl border-2 border-slate-200">
                          <MathMessage text={analyseData.latex} />
                      </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8 w-full max-w-lg">
                      <div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <label className="block text-blue-800 font-bold mb-2">Hệ số là bao nhiêu?</label>
                          <input 
                            type="number" 
                            value={userCoeff}
                            onChange={(e) => setUserCoeff(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && checkAnalyse()}
                            className="w-full p-3 text-center text-xl font-bold rounded-lg border border-blue-300 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="?"
                          />
                      </div>
                      <div className="flex-1 bg-purple-50 p-4 rounded-xl border border-purple-200 opacity-80">
                          <label className="block text-purple-800 font-bold mb-2">Phần biến là:</label>
                          <div className="w-full p-3 text-center text-xl font-bold rounded-lg border border-purple-300 bg-white">
                              <MathMessage text={`$${analyseData.vars}$`} />
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={checkAnalyse}
                    className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
                  >
                    Kiểm tra
                  </button>
              </div>
          )}

          {/* 2. LIKE TERMS */}
          {tab === 'LIKE_TERMS' && (
              <div className="flex flex-col items-center h-full">
                  <div className="mb-6 text-center">
                      <div className="text-slate-500 font-bold mb-2">Chọn các đơn thức đồng dạng với:</div>
                      <div className="text-3xl font-bold text-teal-700 bg-teal-50 px-6 py-3 rounded-xl border border-teal-200 inline-block">
                          <MathMessage text={likeTarget.latex} />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
                      {likeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => toggleOption(opt.id)}
                            disabled={!!feedback}
                            className={`p-4 rounded-xl border-2 text-xl font-bold transition-all relative ${
                                opt.selected 
                                ? 'bg-indigo-100 border-indigo-500 text-indigo-900 shadow-md transform scale-105' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                          >
                              <MathMessage text={opt.latex} />
                              {opt.selected && <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>}
                          </button>
                      ))}
                  </div>

                  <button 
                    onClick={checkLikeTerms}
                    disabled={!!feedback}
                    className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Kiểm tra
                  </button>
              </div>
          )}

          {/* 3. MONO CALC */}
          {tab === 'MONO_CALC' && (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                  <div className="text-center">
                      <div className="text-slate-500 font-bold mb-4">Tính tổng/hiệu hai đơn thức đồng dạng:</div>
                      <div className="text-3xl md:text-4xl font-bold text-slate-800">
                          <MathMessage text={monoCalc.q} />
                      </div>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 max-w-md w-full text-center">
                      <p className="text-amber-800 mb-4 text-sm font-bold">Hãy nhập hệ số của kết quả:</p>
                      <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number"
                            value={userMonoAns}
                            onChange={(e) => setUserMonoAns(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && checkMonoCalc()}
                            className="w-24 p-3 text-center text-xl font-bold rounded-lg border-2 border-amber-300 outline-none focus:border-amber-500"
                            placeholder="..."
                          />
                          <span className="text-xl font-bold text-slate-500">(Phần biến giữ nguyên)</span>
                      </div>
                  </div>

                  <button 
                    onClick={checkMonoCalc}
                    className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
                  >
                    Kiểm tra
                  </button>
              </div>
          )}

          {/* 4. POLY COLUMN */}
          {tab === 'POLY_COLUMN' && polyCol && (
              <div className="flex flex-col items-center h-full">
                  <div className="text-slate-500 font-bold mb-6 flex items-center gap-2">
                      <AlignCenterVertical className="w-5 h-5"/>
                      Tính {polyCol.op === '+' ? 'tổng' : 'hiệu'} hai đa thức P(x) và Q(x)
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                      {/* Grid Layout for vertical calc */}
                      <div className="grid grid-cols-4 gap-x-2 gap-y-4 items-center text-lg md:text-xl font-bold font-mono">
                          
                          {/* Headers (Invisible mostly, but good for spacing) */}
                          <div></div>
                          <div className="text-center text-xs text-slate-400">$x^2$</div>
                          <div className="text-center text-xs text-slate-400">$x$</div>
                          <div className="text-center text-xs text-slate-400">Hệ số tự do</div>

                          {/* Row 1: P(x) */}
                          <div className="text-right text-blue-700 font-sans">P(x)</div>
                          <div className="text-right">{polyCol.p[0]} $x^2$</div>
                          <div className="text-right">{polyCol.p[1] >= 0 ? '+' : ''}{polyCol.p[1]} $x$</div>
                          <div className="text-right">{polyCol.p[2] >= 0 ? '+' : ''}{polyCol.p[2]}</div>

                          {/* Row 2: Q(x) */}
                          <div className="text-right text-purple-700 font-sans flex justify-between">
                              <span className="font-bold text-slate-400 mr-2">{polyCol.op}</span>
                              Q(x)
                          </div>
                          <div className="text-right border-b-2 border-slate-400 pb-2">{polyCol.q[0]} $x^2$</div>
                          <div className="text-right border-b-2 border-slate-400 pb-2">{polyCol.q[1] >= 0 ? '+' : ''}{polyCol.q[1]} $x$</div>
                          <div className="text-right border-b-2 border-slate-400 pb-2">{polyCol.q[2] >= 0 ? '+' : ''}{polyCol.q[2]}</div>

                          {/* Result Row (Inputs) */}
                          <div className="text-right text-teal-700 font-sans">Kết quả</div>
                          
                          <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number" 
                                value={userPolyAns[0]}
                                onChange={(e) => {
                                    const newAns = [...userPolyAns];
                                    newAns[0] = e.target.value;
                                    setUserPolyAns(newAns);
                                }}
                                className="w-16 p-1 text-right border-2 border-teal-200 rounded focus:border-teal-500 outline-none bg-white"
                              />
                              <span>$x^2$</span>
                          </div>

                          <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number" 
                                value={userPolyAns[1]}
                                onChange={(e) => {
                                    const newAns = [...userPolyAns];
                                    newAns[1] = e.target.value;
                                    setUserPolyAns(newAns);
                                }}
                                className="w-16 p-1 text-right border-2 border-teal-200 rounded focus:border-teal-500 outline-none bg-white"
                              />
                              <span>$x$</span>
                          </div>

                          <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number" 
                                value={userPolyAns[2]}
                                onChange={(e) => {
                                    const newAns = [...userPolyAns];
                                    newAns[2] = e.target.value;
                                    setUserPolyAns(newAns);
                                }}
                                className="w-16 p-1 text-right border-2 border-teal-200 rounded focus:border-teal-500 outline-none bg-white"
                              />
                          </div>

                      </div>
                  </div>

                  <button 
                    onClick={checkPolyCol}
                    className="mt-8 bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
                  >
                    Kiểm tra
                  </button>
              </div>
          )}

          {/* Feedback Overlay */}
          {feedback && (
              <div className={`absolute bottom-4 left-4 right-4 p-4 rounded-xl shadow-lg border-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 ${
                  feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                  {feedback.type === 'success' ? <CheckCircle className="w-6 h-6"/> : <HelpCircle className="w-6 h-6"/>}
                  <span className="font-bold">{feedback.text}</span>
              </div>
          )}

      </div>
    </div>
  );
};

export default PolynomialGame;