import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Calculator, CheckCircle, XCircle, RefreshCw, Star } from 'lucide-react';

interface RationalNumberGameProps {
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

const RationalNumberGame: React.FC<RationalNumberGameProps> = ({ onBack, onScoreUpdate }) => {
  const [question, setQuestion] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [streak, setStreak] = useState(0);

  const generateQuestion = () => {
    const types = ['ADD_FRAC', 'SUB_DECIMAL', 'MIXED'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let qText = '', correct = '', options: string[] = [];

    if (type === 'ADD_FRAC') {
        const d = Math.floor(Math.random() * 8) + 2; // Common denominator base
        const n1 = Math.floor(Math.random() * 10) - 5;
        const n2 = Math.floor(Math.random() * 10) - 5;
        
        qText = `Tính: $\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}}$`;
        const numSum = n1 + n2;
        correct = `$\\frac{${numSum}}{${d}}$`;
        options = [
            correct,
            `$\\frac{${numSum}}{${d * 2}}$`,
            `$\\frac{${n1 - n2}}{${d}}$`,
            `$\\frac{${Math.abs(numSum)}}{${d}}$`
        ];
    } else if (type === 'SUB_DECIMAL') {
        const a = (Math.random() * 10 - 5).toFixed(1);
        const b = (Math.random() * 5).toFixed(1);
        qText = `Tính: $${a} - ${b}$`;
        const ans = (parseFloat(a) - parseFloat(b)).toFixed(1);
        correct = `$${ans}$`;
        options = [
            correct,
            `$${(parseFloat(a) + parseFloat(b)).toFixed(1)}$`,
            `$${(parseFloat(b) - parseFloat(a)).toFixed(1)}$`,
            `$${Math.abs(parseFloat(a) - parseFloat(b)).toFixed(1)}$`
        ];
    } else {
        // Mixed: 0.5 + 1/2
        qText = `Tính: $0.5 + \\frac{1}{2}$`;
        correct = `$1$`;
        options = [`$1$`, `$0.25$`, `$0.5$`, `$\\frac{1}{4}$`];
    }

    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);
    // Dedup
    options = [...new Set(options)];
    while(options.length < 4) options.push(`$${Math.floor(Math.random()*10)}$`);

    setQuestion({ text: qText, correct, options });
    setFeedback(null);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleAnswer = (opt: string) => {
    if (feedback) return;
    
    if (opt === question.correct) {
        const points = 10 + (streak * 2);
        setFeedback({ type: 'success', text: `Chính xác! +${points} điểm` });
        onScoreUpdate(points);
        setStreak(s => s + 1);
        setTimeout(generateQuestion, 1500);
    } else {
        setFeedback({ type: 'error', text: `Sai rồi. Đáp án đúng là ${question.correct}` });
        setStreak(0);
    }
  };

  if (!question) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 animate-fade-in select-none">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold">
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-600" />
            <span>Chuỗi thắng: {streak}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-8 flex flex-col items-center">
          <div className="mb-8">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                  <Calculator className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 text-center">
                  <MathMessage text={question.text} />
              </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {question.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className={`p-6 rounded-xl border-2 text-xl font-bold transition-all hover:scale-105 active:scale-95 ${
                        feedback && opt === question.correct 
                        ? 'bg-green-100 border-green-500 text-green-800' 
                        : feedback && opt !== question.correct && feedback.type === 'error' // highlight logic could be improved
                        ? 'opacity-50'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  >
                      <MathMessage text={opt} />
                  </button>
              ))}
          </div>

          {feedback && (
              <div className={`mt-6 px-6 py-3 rounded-xl font-bold flex items-center gap-2 animate-bounce ${
                  feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                  {feedback.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                  {feedback.text}
              </div>
          )}
      </div>
    </div>
  );
};

export default RationalNumberGame;