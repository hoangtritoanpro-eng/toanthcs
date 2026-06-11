import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, BookOpen, Layers, CheckCircle, HelpCircle, Eye, EyeOff, Shuffle, RefreshCw, Trophy } from 'lucide-react';

interface IdentityGameProps {
  onBack: () => void;
}

// --- Constants ---
const IDENTITIES = [
  { id: 1, name: 'Bình phương của một tổng', lhs: '(A+B)^2', rhs: 'A^2 + 2AB + B^2' },
  { id: 2, name: 'Bình phương của một hiệu', lhs: '(A-B)^2', rhs: 'A^2 - 2AB + B^2' },
  { id: 3, name: 'Hiệu hai bình phương', lhs: 'A^2 - B^2', rhs: '(A-B)(A+B)' },
  { id: 4, name: 'Lập phương của một tổng', lhs: '(A+B)^3', rhs: 'A^3 + 3A^2B + 3AB^2 + B^3' },
  { id: 5, name: 'Lập phương của một hiệu', lhs: '(A-B)^3', rhs: 'A^3 - 3A^2B + 3AB^2 - B^3' },
  { id: 6, name: 'Tổng hai lập phương', lhs: 'A^3 + B^3', rhs: '(A+B)(A^2 - AB + B^2)' },
  { id: 7, name: 'Hiệu hai lập phương', lhs: 'A^3 - B^3', rhs: '(A-B)(A^2 + AB + B^2)' },
];

interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correct: number;
  identityId: number;
  explanation?: string;
}

// --- MathJax Helper (Reused) ---
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

const IdentityGame: React.FC<IdentityGameProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'LEARN' | 'MATCH' | 'QUIZ'>('LEARN');
  const [score, setScore] = useState(0);

  // Learn Mode State
  const [hiddenSide, setHiddenSide] = useState<'NONE' | 'LHS' | 'RHS'>('NONE');

  // Match Mode State
  const [matchCards, setMatchCards] = useState<{id: number, text: string, type: 'LHS'|'RHS', status: 'DEFAULT'|'SELECTED'|'MATCHED'}[]>([]);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);

  // Quiz Mode State
  const [quizSession, setQuizSession] = useState<QuizItem[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<{type: 'success'|'error'|'neutral', text: string} | null>(null);

  // --- Random Generator Logic ---
  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const generateQuestion = (): QuizItem => {
    const type = getRandomInt(1, 6); // Randomize identity types 1-6 (7 is simpler to generate from 6 logic)
    let q = '', correct = '', dist1 = '', dist2 = '', dist3 = '', id = 0;

    // Helper for polynomial string
    // const term = (coef: number, power: number) => ...

    switch (type) {
      case 1: // (x + a)^2
      case 2: // (x - a)^2
        {
          const isPlus = type === 1;
          const a = getRandomInt(2, 9);
          const xCoeff = getRandomInt(1, 3); // 1x or 2x or 3x
          const xStr = xCoeff === 1 ? 'x' : `${xCoeff}x`;
          const aSq = a * a;
          const mid = 2 * xCoeff * a;
          const xSqCoeff = xCoeff * xCoeff;
          const xSqStr = xSqCoeff === 1 ? 'x^2' : `${xSqCoeff}x^2`;
          
          id = isPlus ? 1 : 2;
          q = `Khai triển: $(${xStr} ${isPlus ? '+' : '-'} ${a})^2$`;
          
          correct = `$${xSqStr} ${isPlus ? '+' : '-'} ${mid}x + ${aSq}$`;
          // Distractor 1: Wrong sign
          dist1 = `$${xSqStr} ${isPlus ? '-' : '+'} ${mid}x + ${aSq}$`;
          // Distractor 2: Missing factor 2
          dist2 = `$${xSqStr} ${isPlus ? '+' : '-'} ${xCoeff*a}x + ${aSq}$`;
          // Distractor 3: Forgot to square a
          dist3 = `$${xSqStr} ${isPlus ? '+' : '-'} ${mid}x + ${a}$`;
        }
        break;
      
      case 3: // x^2 - a^2 -> (x-a)(x+a)
        {
          const a = getRandomInt(2, 9);
          const aSq = a * a;
          id = 3;
          q = `Viết biểu thức sau dưới dạng tích: $x^2 - ${aSq}$`;
          correct = `$(x - ${a})(x + ${a})$`;
          dist1 = `$(x - ${a})^2$`;
          dist2 = `$(x + ${a})^2$`;
          dist3 = `$(x - ${aSq})(x + ${aSq})$`;
        }
        break;

      case 4: // (x + a)^3
      case 5: // (x - a)^3
        {
          const isPlus = type === 4;
          const a = getRandomInt(2, 4); // Keep numbers small for cubes
          const a3 = a * a * a;
          const a2_3 = 3 * a;
          const a_3 = 3 * a * a;
          
          id = isPlus ? 4 : 5;
          q = `Khai triển: $(x ${isPlus ? '+' : '-'} ${a})^3$`;
          
          // x^3 +/- 3ax^2 + 3a^2x +/- a^3
          correct = `$x^3 ${isPlus ? '+' : '-'} ${a2_3}x^2 + ${a_3}x ${isPlus ? '+' : '-'} ${a3}$`;
          
          // Wrong signs
          dist1 = `$x^3 ${isPlus ? '-' : '+'} ${a2_3}x^2 - ${a_3}x ${isPlus ? '-' : '+'} ${a3}$`;
          
          // Missing coeffs
          dist2 = `$x^3 ${isPlus ? '+' : '-'} ${a}x^2 + ${a*a}x ${isPlus ? '+' : '-'} ${a3}$`;
          
          // Wrong powers
          dist3 = `$x^3 ${isPlus ? '+' : '-'} ${a2_3}x^2 + ${a2_3}x ${isPlus ? '+' : '-'} ${a3}$`;
        }
        break;

      case 6: // x^3 + a^3
        {
          const a = getRandomInt(2, 4);
          const a3 = a*a*a;
          id = 6;
          q = `Viết dưới dạng tích: $x^3 + ${a3}$`;
          correct = `$(x + ${a})(x^2 - ${a}x + ${a*a})$`;
          dist1 = `$(x + ${a})(x^2 + ${a}x + ${a*a})$`;
          dist2 = `$(x - ${a})(x^2 + ${a}x + ${a*a})$`;
          dist3 = `$(x + ${a})^3$`;
        }
        break;
        
      default: // Fallback to simpler Identity 1
          id = 1;
          q = `Khai triển $(x+1)^2$`;
          correct = `$x^2+2x+1$`;
          dist1 = `$x^2+x+1$`;
          dist2 = `$x^2+1$`;
          dist3 = `$x^2-2x+1$`;
    }

    // Shuffle options
    const options = [correct, dist1, dist2, dist3];
    const shuffledOptions = options
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    
    return {
      id: Date.now(), // Random unique ID
      question: q,
      options: shuffledOptions,
      correct: shuffledOptions.indexOf(correct),
      identityId: id
    };
  };

  const initQuizSession = () => {
     // Generate 5 random questions
     const newQuestions = Array.from({ length: 5 }, () => generateQuestion());
     setQuizSession(newQuestions);
     setCurrentQuestionIdx(0);
     setQuizFeedback(null);
  };

  // --- Logic for Matching Game ---
  const initMatchGame = () => {
    // Pick random 4 identities to avoid overcrowding
    const shuffledIds = [...IDENTITIES].sort(() => 0.5 - Math.random()).slice(0, 4);
    
    let cards = [];
    shuffledIds.forEach(item => {
        cards.push({ id: item.id, text: `$${item.lhs}$`, type: 'LHS', status: 'DEFAULT' });
        cards.push({ id: item.id, text: `$${item.rhs}$`, type: 'RHS', status: 'DEFAULT' });
    });

    // Shuffle cards
    // @ts-ignore
    cards = cards.sort(() => 0.5 - Math.random());
    // @ts-ignore
    setMatchCards(cards);
    setSelectedCardIdx(null);
  };

  const handleCardClick = (idx: number) => {
    if (matchCards[idx].status === 'MATCHED') return;
    
    // If no card selected
    if (selectedCardIdx === null) {
        const newCards = [...matchCards];
        newCards[idx].status = 'SELECTED';
        setMatchCards(newCards);
        setSelectedCardIdx(idx);
    } else {
        // If clicking the same card
        if (selectedCardIdx === idx) {
            const newCards = [...matchCards];
            newCards[idx].status = 'DEFAULT';
            setMatchCards(newCards);
            setSelectedCardIdx(null);
            return;
        }

        const first = matchCards[selectedCardIdx];
        const second = matchCards[idx];

        // Check match
        if (first.id === second.id && first.type !== second.type) {
            // MATCH!
            const newCards = [...matchCards];
            newCards[selectedCardIdx].status = 'MATCHED';
            newCards[idx].status = 'MATCHED';
            setMatchCards(newCards);
            setScore(s => s + 10);
            setSelectedCardIdx(null);
        } else {
            // NO MATCH
            const newCards = [...matchCards];
            newCards[idx].status = 'SELECTED'; // Show briefly
            setMatchCards(newCards);
            
            setTimeout(() => {
                const resetCards = [...matchCards];
                // Only reset if they haven't been matched in the meantime (race condition edge case, minimal here)
                if (resetCards[selectedCardIdx].status !== 'MATCHED') resetCards[selectedCardIdx].status = 'DEFAULT';
                if (resetCards[idx].status !== 'MATCHED') resetCards[idx].status = 'DEFAULT';
                setMatchCards(resetCards);
                setSelectedCardIdx(null);
            }, 800);
        }
    }
  };

  useEffect(() => {
    if (tab === 'MATCH') initMatchGame();
    if (tab === 'QUIZ') initQuizSession();
  }, [tab]);

  // --- Quiz Logic ---
  const handleAnswer = (optionIdx: number) => {
     if (quizFeedback || quizSession.length === 0) return; // Prevent multiple clicks

     const q = quizSession[currentQuestionIdx];
     if (optionIdx === q.correct) {
         setQuizFeedback({ type: 'success', text: 'Chính xác! ' + (q.explanation || '') });
         setScore(s => s + 20);
         setTimeout(() => {
             if (currentQuestionIdx < quizSession.length - 1) {
                 setCurrentQuestionIdx(p => p + 1);
                 setQuizFeedback(null);
             } else {
                 setQuizFeedback({ type: 'success', text: 'Chúc mừng! Bạn đã hoàn thành bài luyện tập.' });
             }
         }, 2000);
     } else {
         setQuizFeedback({ type: 'error', text: 'Chưa đúng rồi. Hãy kiểm tra lại dấu và hệ số nhé!' });
     }
  };


  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">7 Hằng đẳng thức đáng nhớ</h2>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
          <Trophy className="w-4 h-4"/> Điểm: {score}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-teal-100 shadow-sm md:w-fit mx-auto">
          <button 
             onClick={() => setTab('LEARN')} 
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${tab === 'LEARN' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <BookOpen className="w-4 h-4"/> Học thuộc
          </button>
          <button 
             onClick={() => setTab('MATCH')} 
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${tab === 'MATCH' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <Layers className="w-4 h-4"/> Ghép thẻ
          </button>
          <button 
             onClick={() => setTab('QUIZ')} 
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${tab === 'QUIZ' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}
          >
             <HelpCircle className="w-4 h-4"/> Luyện tập
          </button>
      </div>

      {/* --- TAB CONTENT: LEARN --- */}
      {tab === 'LEARN' && (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-between items-center mb-2 px-1">
                 <div className="text-sm text-slate-500 font-bold hidden md:block">Danh sách các hằng đẳng thức</div>
                 <div className="flex gap-2 ml-auto">
                    <span className="text-sm font-bold text-slate-500 flex items-center mr-1">Chế độ che:</span>
                    <button onClick={() => setHiddenSide('NONE')} className={`px-2 py-1 text-xs font-bold rounded border ${hiddenSide === 'NONE' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600'}`}>Hiện hết</button>
                    <button onClick={() => setHiddenSide('RHS')} className={`px-2 py-1 text-xs font-bold rounded border ${hiddenSide === 'RHS' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600'}`}>Che vế phải</button>
                    <button onClick={() => setHiddenSide('LHS')} className={`px-2 py-1 text-xs font-bold rounded border ${hiddenSide === 'LHS' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600'}`}>Che vế trái</button>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-12">
                {IDENTITIES.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col hover:border-teal-300 transition-colors">
                        <div className="mb-3 font-bold text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                            {item.id}. {item.name}
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 text-lg md:text-xl font-bold text-slate-800 font-mono">
                            <div 
                                className={`flex-1 p-2 rounded text-center transition-all cursor-pointer border border-transparent ${
                                    hiddenSide === 'LHS' 
                                    ? 'bg-slate-100 text-transparent hover:text-slate-400 select-none border-slate-200' 
                                    : 'hover:bg-slate-50'
                                }`}
                            >
                                <MathMessage text={`$${item.lhs}$`} />
                            </div>
                            
                            <span className="text-slate-400 font-light">=</span>
                            
                            <div 
                                className={`flex-1 p-2 rounded text-center transition-all cursor-pointer border border-transparent ${
                                    hiddenSide === 'RHS' 
                                    ? 'bg-slate-100 text-transparent hover:text-slate-400 select-none border-slate-200' 
                                    : 'hover:bg-slate-50'
                                }`}
                            >
                                <MathMessage text={`$${item.rhs}$`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- TAB CONTENT: MATCH --- */}
      {tab === 'MATCH' && (
          <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 px-4 bg-teal-50 py-2 rounded-lg border border-teal-100">
                  <span className="text-teal-800 font-bold text-sm">Ghép vế trái với vế phải tương ứng</span>
                  <button onClick={initMatchGame} className="text-teal-600 hover:text-teal-800"><RefreshCw className="w-5 h-5"/></button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 content-start pb-12">
                 {matchCards.map((card, idx) => (
                     <div 
                       key={idx}
                       onClick={() => handleCardClick(idx)}
                       className={`
                         h-24 md:h-32 rounded-xl shadow border-2 flex items-center justify-center p-2 cursor-pointer transition-all transform active:scale-95 relative overflow-hidden
                         ${card.status === 'MATCHED' ? 'bg-white border-transparent opacity-0 pointer-events-none' : ''}
                         ${card.status === 'SELECTED' ? 'bg-teal-50 border-teal-500 shadow-md scale-105 z-10' : 'bg-white border-slate-200 hover:border-teal-300'}
                       `}
                     >
                        <div className={`text-sm md:text-lg font-bold ${card.status === 'SELECTED' ? 'text-teal-800' : 'text-slate-700'}`}>
                           <MathMessage text={card.text} />
                        </div>
                     </div>
                 ))}
              </div>
              
              {matchCards.every(c => c.status === 'MATCHED') && (
                  <div className="text-center mt-8 animate-bounce">
                      <h3 className="text-2xl font-bold text-teal-600 mb-2">Tuyệt vời!</h3>
                      <button onClick={initMatchGame} className="px-6 py-2 bg-teal-600 text-white rounded-full font-bold shadow hover:bg-teal-700">Chơi lại</button>
                  </div>
              )}
          </div>
      )}

      {/* --- TAB CONTENT: QUIZ (DYNAMIC) --- */}
      {tab === 'QUIZ' && quizSession.length > 0 && (
          <div className="max-w-2xl mx-auto w-full pb-12">
             <div className="bg-white rounded-2xl shadow-xl border border-teal-100 overflow-hidden">
                 {/* Progress Bar */}
                 <div className="h-2 bg-slate-100 w-full">
                     <div className="h-full bg-teal-500 transition-all duration-500" style={{width: `${((currentQuestionIdx+1) / quizSession.length) * 100}%`}}></div>
                 </div>

                 <div className="p-8">
                     <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                         <span>Câu hỏi {currentQuestionIdx + 1} / {quizSession.length}</span>
                         <span>Dạng: HĐT số {quizSession[currentQuestionIdx].identityId}</span>
                     </div>
                     
                     <h3 className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                         <MathMessage text={quizSession[currentQuestionIdx].question} />
                     </h3>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {quizSession[currentQuestionIdx].options.map((opt, idx) => (
                             <button
                               key={idx}
                               onClick={() => handleAnswer(idx)}
                               disabled={!!quizFeedback}
                               className={`p-4 rounded-xl border-2 text-left font-bold text-lg transition-all ${
                                   quizFeedback && idx === quizSession[currentQuestionIdx].correct 
                                     ? 'bg-green-100 border-green-500 text-green-800' // Correct answer shown
                                     : quizFeedback && idx !== quizSession[currentQuestionIdx].correct && quizFeedback.type === 'error'
                                     ? 'bg-white border-slate-200 text-slate-300' // Fade out wrong options
                                     : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-teal-50'
                               }`}
                             >
                                <MathMessage text={opt} />
                             </button>
                         ))}
                     </div>
                     
                     {/* Feedback Area */}
                     {quizFeedback && (
                         <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
                             quizFeedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                         }`}>
                             {quizFeedback.type === 'success' ? <CheckCircle className="w-6 h-6"/> : <HelpCircle className="w-6 h-6"/>}
                             <div className="font-bold">
                                 <MathMessage text={quizFeedback.text} />
                             </div>
                             
                             <div className="ml-auto flex gap-2">
                               {currentQuestionIdx < quizSession.length - 1 ? (
                                   <button 
                                     onClick={() => {
                                         setCurrentQuestionIdx(c => c + 1);
                                         setQuizFeedback(null);
                                     }}
                                     className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-bold border hover:bg-slate-50"
                                   >
                                      Tiếp theo
                                   </button>
                               ) : (
                                   <button 
                                     onClick={initQuizSession}
                                     className="px-4 py-2 bg-teal-600 text-white rounded-lg shadow-sm text-sm font-bold hover:bg-teal-700"
                                   >
                                      Luyện tập tiếp
                                   </button>
                               )}
                             </div>
                         </div>
                     )}
                 </div>
             </div>
             
             <div className="text-center mt-4">
                 <button onClick={initQuizSession} className="text-slate-400 hover:text-teal-600 text-sm font-bold flex items-center justify-center gap-1 mx-auto">
                    <RefreshCw className="w-4 h-4"/> Đổi bộ câu hỏi khác
                 </button>
             </div>
          </div>
      )}

    </div>
  );
};

export default IdentityGame;