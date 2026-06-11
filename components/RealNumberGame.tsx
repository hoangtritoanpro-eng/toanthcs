import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Target, Scissors, Divide, CheckCircle, ArrowRight } from 'lucide-react';

interface RealNumberGameProps {
  onBack: () => void;
  onScoreUpdate: (points: number) => void;
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
          if (mathJax.typesetPromise) await mathJax.typesetPromise([containerRef.current]);
          else if (mathJax.typeset) mathJax.typeset([containerRef.current]);
        } catch (e) { console.warn(e); }
      }
    };
    renderMath();
  }, [text]);
  return <span ref={containerRef} className={className} />;
};

const RealNumberGame: React.FC<RealNumberGameProps> = ({ onBack, onScoreUpdate }) => {
  const [mode, setMode] = useState<'ROOT' | 'ROUND'>('ROOT');
  const [question, setQuestion] = useState<any>(null);
  const [userAns, setUserAns] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const initRoot = () => {
      // Perfect squares or simple decimals
      const type = Math.random();
      let val = 0, ans = 0;
      if (type < 0.6) {
          // Integer square
          ans = Math.floor(Math.random() * 15);
          val = ans * ans;
      } else {
          // Decimal square: 0.5 -> 0.25
          const root = (Math.floor(Math.random() * 9) + 1) / 10; // 0.1 .. 0.9
          ans = root;
          val = parseFloat((root * root).toFixed(2));
      }
      setQuestion({ 
          text: `Tìm căn bậc hai số học: $\\sqrt{${val}}$`, 
          ans: ans,
          hint: `${ans} x ${ans} = ${val}`
      });
      setFeedback(null);
      setUserAns('');
  };

  const initRound = () => {
      // Random float
      const num = Math.random() * 100;
      const precision = Math.random() > 0.5 ? 1 : 2; // 1 decimal or 2 decimals
      const pName = precision === 1 ? 'phần mười (chữ số thập phân thứ nhất)' : 'phần trăm (chữ số thập phân thứ hai)';
      
      const factor = Math.pow(10, precision);
      const ans = Math.round(num * factor) / factor;
      
      setQuestion({
          text: `Làm tròn số $${num.toFixed(4)}$ đến hàng ${pName}.`,
          ans: ans,
          original: num
      });
      setFeedback(null);
      setUserAns('');
  };

  useEffect(() => {
      if (mode === 'ROOT') initRoot();
      else initRound();
  }, [mode]);

  const checkAnswer = () => {
      if (feedback) return;
      const val = parseFloat(userAns);
      if (isNaN(val)) return;

      if (val === question.ans) {
          setFeedback({ type: 'success', text: 'Chính xác! +20 Điểm' });
          onScoreUpdate(20);
          setTimeout(() => {
              if (mode === 'ROOT') initRoot(); else initRound();
          }, 2000);
      } else {
          setFeedback({ type: 'error', text: `Sai rồi. Đáp án đúng là ${question.ans}` });
      }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 animate-fade-in select-none">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        
        <div className="flex bg-white rounded-lg p-1 border border-teal-100">
            <button onClick={() => setMode('ROOT')} className={`px-4 py-1 rounded font-bold ${mode === 'ROOT' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}>Căn bậc hai</button>
            <button onClick={() => setMode('ROUND')} className={`px-4 py-1 rounded font-bold ${mode === 'ROUND' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}>Làm tròn số</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-8 flex flex-col items-center">
          {question && (
              <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                      {mode === 'ROOT' ? <Divide className="w-10 h-10" /> : <Scissors className="w-10 h-10" />}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                      <MathMessage text={question.text} />
                  </h2>
                  <p className="text-slate-400 text-sm">Nhập kết quả vào ô bên dưới</p>
              </div>
          )}

          <div className="flex gap-4 w-full max-w-md">
              <input 
                type="number" 
                value={userAns}
                onChange={(e) => setUserAns(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder="Kết quả..."
                className="flex-1 p-4 rounded-xl border-2 border-slate-200 text-2xl font-bold text-center outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all"
              />
              <button 
                onClick={checkAnswer}
                className="bg-teal-600 text-white px-6 rounded-xl font-bold hover:bg-teal-700 shadow-lg active:translate-y-0.5 transition-all"
              >
                <ArrowRight className="w-8 h-8"/>
              </button>
          </div>

          {feedback && (
              <div className={`mt-8 px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 animate-in zoom-in ${
                  feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                  {feedback.type === 'success' ? <CheckCircle className="w-6 h-6"/> : null}
                  {feedback.text}
              </div>
          )}
      </div>
    </div>
  );
};

export default RealNumberGame;