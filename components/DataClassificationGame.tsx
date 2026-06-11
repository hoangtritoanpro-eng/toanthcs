import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle, HelpCircle, RefreshCw, Trophy, Table, Percent, FileText, Calculator } from 'lucide-react';

interface DataClassificationGameProps {
  onBack: () => void;
}

// --- Types ---
type GameMode = 'CLASSIFY' | 'PERCENTAGE';

interface ClassifyScenario {
  title: string;
  col1Header: string;
  col2Header: string;
  data: { c1: string | number, c2: string | number }[];
  col1Type: 'QUALITATIVE' | 'QUANTITATIVE'; // Dữ liệu định tính | Dữ liệu định lượng
  col2Type: 'QUALITATIVE' | 'QUANTITATIVE';
  explanation: string;
}

interface PercentageScenario {
  topic: string;
  categories: { name: string, count: number }[];
  targetIndex: number; // Index of the category to calculate percentage for
}

// --- Data Generators ---

const CLASSIFY_SCENARIOS_TEMPLATE = [
  {
    title: 'Size áo đồng phục',
    col1: { header: 'Tên học sinh', type: 'QUALITATIVE', samples: ['An', 'Bình', 'Chi', 'Dũng'] },
    col2: { header: 'Cỡ áo', type: 'QUALITATIVE', samples: ['S', 'M', 'L', 'XL'] }, // Ordinal is still Qualitative in Grade 7 context usually
    expl: 'Tên học sinh và Cỡ áo (S, M, L) đều là dữ liệu định tính vì chúng mô tả đặc điểm, tên gọi.'
  },
  {
    title: 'Điểm kiểm tra Toán',
    col1: { header: 'STT', type: 'QUANTITATIVE', samples: [1, 2, 3, 4] },
    col2: { header: 'Điểm số', type: 'QUANTITATIVE', samples: [8.5, 9.0, 7.5, 10] },
    expl: 'STT và Điểm số đều là các con số thực hiện được phép tính hoặc đếm, nên là dữ liệu định lượng.'
  },
  {
    title: 'Màu sắc yêu thích',
    col1: { header: 'Màu', type: 'QUALITATIVE', samples: ['Xanh', 'Đỏ', 'Vàng', 'Tím'] },
    col2: { header: 'Số bạn chọn', type: 'QUANTITATIVE', samples: [12, 5, 8, 3] },
    expl: 'Màu sắc là đặc điểm (Định tính). Số lượng bạn chọn là con số đếm được (Định lượng).'
  },
  {
    title: 'Chiều cao học sinh',
    col1: { header: 'Học sinh', type: 'QUALITATIVE', samples: ['Lan', 'Mai', 'Cúc', 'Trúc'] },
    col2: { header: 'Chiều cao (cm)', type: 'QUANTITATIVE', samples: [150, 155, 148, 160] },
    expl: 'Tên là định tính. Chiều cao là số đo cụ thể nên là định lượng.'
  }
];

const PERCENTAGE_TOPICS = [
  { 
    name: 'Khả năng nấu ăn', 
    cats: ['Không đạt', 'Đạt', 'Giỏi', 'Xuất sắc'],
    weights: [20, 40, 30, 10] // approximate distribution weights
  },
  { 
    name: 'Kỹ năng bơi lội', 
    cats: ['Chưa biết bơi', 'Bơi ếch', 'Bơi sải', 'Bơi bướm'],
    weights: [30, 40, 20, 10]
  },
  { 
    name: 'Loại sách yêu thích', 
    cats: ['Truyện tranh', 'Khoa học', 'Văn học', 'Lịch sử'],
    weights: [50, 20, 20, 10]
  },
  { 
    name: 'Phương tiện đi học', 
    cats: ['Xe đạp', 'Đi bộ', 'Xe buýt', 'Bố mẹ chở'],
    weights: [30, 20, 10, 40]
  }
];

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

const DataClassificationGame: React.FC<DataClassificationGameProps> = ({ onBack }) => {
  const [mode, setMode] = useState<GameMode>('CLASSIFY');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'neutral', text: string } | null>(null);

  // --- Classify State ---
  const [classifyLevel, setClassifyLevel] = useState<ClassifyScenario | null>(null);
  const [selectedCol, setSelectedCol] = useState<1 | 2 | null>(null); // Which column user is identifying
  const [userChoice, setUserChoice] = useState<'QUALITATIVE' | 'QUANTITATIVE' | null>(null);

  // --- Percentage State ---
  const [percentLevel, setPercentLevel] = useState<PercentageScenario | null>(null);
  const [userPercentAns, setUserPercentAns] = useState('');

  // Generators
  const initClassify = () => {
    const t = CLASSIFY_SCENARIOS_TEMPLATE[Math.floor(Math.random() * CLASSIFY_SCENARIOS_TEMPLATE.length)];
    // Randomize specific values slightly if needed, for now use static samples
    const data = t.col1.samples.map((s, i) => ({
        c1: s,
        c2: t.col2.samples[i]
    }));

    setClassifyLevel({
        title: t.title,
        col1Header: t.col1.header,
        col2Header: t.col2.header,
        data,
        col1Type: t.col1.type as any,
        col2Type: t.col2.type as any,
        explanation: t.expl
    });
    
    // Randomly ask about Col 1 or Col 2
    setSelectedCol(Math.random() > 0.5 ? 1 : 2);
    setUserChoice(null);
    setFeedback({ type: 'neutral', text: 'Hãy xác định loại dữ liệu của cột được đánh dấu.' });
  };

  const initPercentage = () => {
    const t = PERCENTAGE_TOPICS[Math.floor(Math.random() * PERCENTAGE_TOPICS.length)];
    // Generate counts
    const totalTarget = Math.floor(Math.random() * 30) + 30; // Total 30-60 students
    
    // Distribute randomly but loosely based on weights
    let remaining = totalTarget;
    const cats = t.cats.map((name, i) => {
        if (i === t.cats.length - 1) return { name, count: remaining };
        const w = t.weights[i];
        const val = Math.max(1, Math.floor((w / 100) * totalTarget) + Math.floor(Math.random() * 5 - 2));
        remaining -= val;
        return { name, count: val > 0 ? val : 1 }; // Ensure positive
    });
    
    // Fix last item if negative (rare edge case)
    if (cats[cats.length-1].count <= 0) cats[cats.length-1].count = 1;

    const targetIdx = Math.floor(Math.random() * cats.length);

    setPercentLevel({
        topic: t.name,
        categories: cats,
        targetIndex: targetIdx
    });
    setUserPercentAns('');
    setFeedback({ type: 'neutral', text: 'Tính tỉ lệ phần trăm (làm tròn 1 chữ số thập phân nếu cần).' });
  };

  useEffect(() => {
    if (mode === 'CLASSIFY') initClassify();
    else initPercentage();
  }, [mode]);

  // Handlers
  const checkClassify = (choice: 'QUALITATIVE' | 'QUANTITATIVE') => {
      if (!classifyLevel || !selectedCol) return;
      const correctType = selectedCol === 1 ? classifyLevel.col1Type : classifyLevel.col2Type;
      
      if (choice === correctType) {
          setScore(s => s + 10);
          setFeedback({ type: 'success', text: 'Chính xác! ' + classifyLevel.explanation });
          setTimeout(initClassify, 2500);
      } else {
          setFeedback({ type: 'error', text: 'Chưa đúng. Dữ liệu định tính mô tả đặc điểm/tên. Dữ liệu định lượng là số liệu/số đo.' });
      }
  };

  const checkPercentage = () => {
      if (!percentLevel) return;
      const total = percentLevel.categories.reduce((a, b) => a + b.count, 0);
      const targetCount = percentLevel.categories[percentLevel.targetIndex].count;
      const correctPercent = (targetCount / total) * 100;
      
      const userVal = parseFloat(userPercentAns.replace(',', '.'));
      if (isNaN(userVal)) {
          setFeedback({ type: 'error', text: 'Vui lòng nhập số.' });
          return;
      }

      // Check within tolerance 0.1
      if (Math.abs(userVal - correctPercent) < 0.2) {
          setScore(s => s + 20);
          const formatted = correctPercent % 1 === 0 ? correctPercent : correctPercent.toFixed(1); // Clean formatting
          setFeedback({ type: 'success', text: `Tuyệt vời! $\\frac{${targetCount}}{${total}} \\cdot 100\\% \\approx ${formatted}\\%$` });
          setTimeout(initPercentage, 3000);
      } else {
          setFeedback({ type: 'error', text: 'Kết quả chưa đúng. Công thức: (Số lượng thành phần / Tổng số) x 100.' });
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
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Thống kê & Dữ liệu</h2>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
          <Trophy className="w-4 h-4"/> Điểm: {score}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow border border-teal-100 flex">
              <button 
                onClick={() => setMode('CLASSIFY')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${mode === 'CLASSIFY' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <FileText className="w-4 h-4"/> Phân loại
              </button>
              <button 
                onClick={() => setMode('PERCENTAGE')} 
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${mode === 'PERCENTAGE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Percent className="w-4 h-4"/> Tính tỉ lệ %
              </button>
          </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full flex flex-col gap-6">
          
          {/* GAME AREA */}
          <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-6 md:p-8 flex flex-col items-center min-h-[400px]">
              
              {/* === MODE: CLASSIFY === */}
              {mode === 'CLASSIFY' && classifyLevel && (
                  <div className="w-full flex flex-col items-center">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <Table className="w-6 h-6 text-teal-600"/>
                          Bảng dữ liệu: {classifyLevel.title}
                      </h3>

                      <div className="w-full overflow-hidden rounded-xl border border-slate-200 mb-8">
                          <table className="w-full text-center">
                              <thead className="bg-slate-100 text-slate-700 font-bold">
                                  <tr>
                                      <th className={`p-3 border-r border-slate-200 ${selectedCol === 1 ? 'bg-yellow-100 text-yellow-900 border-b-4 border-b-yellow-400' : ''}`}>
                                          {classifyLevel.col1Header}
                                          {selectedCol === 1 && <div className="text-xs font-normal mt-1">(Đang chọn)</div>}
                                      </th>
                                      <th className={`p-3 ${selectedCol === 2 ? 'bg-yellow-100 text-yellow-900 border-b-4 border-b-yellow-400' : ''}`}>
                                          {classifyLevel.col2Header}
                                          {selectedCol === 2 && <div className="text-xs font-normal mt-1">(Đang chọn)</div>}
                                      </th>
                                  </tr>
                              </thead>
                              <tbody className="text-slate-600">
                                  {classifyLevel.data.map((row, idx) => (
                                      <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                          <td className={`p-3 border-r border-slate-200 ${selectedCol === 1 ? 'bg-yellow-50/50 font-bold text-slate-800' : ''}`}>{row.c1}</td>
                                          <td className={`p-3 ${selectedCol === 2 ? 'bg-yellow-50/50 font-bold text-slate-800' : ''}`}>{row.c2}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      <p className="text-slate-600 mb-4 font-medium">Dữ liệu ở cột được đánh dấu là loại nào?</p>

                      <div className="flex gap-4 w-full md:w-auto">
                          <button 
                            onClick={() => checkClassify('QUALITATIVE')}
                            className="flex-1 md:flex-none px-6 py-3 bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold hover:bg-purple-200 transition-all shadow-sm active:scale-95"
                          >
                              Định tính
                              <div className="text-xs font-normal opacity-75">(Chữ, Tên, Loại)</div>
                          </button>
                          <button 
                            onClick={() => checkClassify('QUANTITATIVE')}
                            className="flex-1 md:flex-none px-6 py-3 bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold hover:bg-blue-200 transition-all shadow-sm active:scale-95"
                          >
                              Định lượng
                              <div className="text-xs font-normal opacity-75">(Số liệu, Số đo)</div>
                          </button>
                      </div>
                  </div>
              )}

              {/* === MODE: PERCENTAGE === */}
              {mode === 'PERCENTAGE' && percentLevel && (
                  <div className="w-full flex flex-col items-center">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <Calculator className="w-6 h-6 text-indigo-600"/>
                          Thống kê: {percentLevel.topic}
                      </h3>

                      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 mb-6">
                          <table className="w-full text-center">
                              <thead className="bg-indigo-50 text-indigo-900 font-bold">
                                  <tr>
                                      <th className="p-3 border-r border-indigo-100">Phân loại</th>
                                      <th className="p-3">Số lượng (Bạn)</th>
                                  </tr>
                              </thead>
                              <tbody className="text-slate-600">
                                  {percentLevel.categories.map((cat, idx) => (
                                      <tr key={idx} className={`border-b border-slate-100 last:border-0 ${idx === percentLevel.targetIndex ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                                          <td className={`p-3 border-r border-slate-200 font-medium ${idx === percentLevel.targetIndex ? 'text-yellow-900 font-bold' : ''}`}>{cat.name}</td>
                                          <td className={`p-3 ${idx === percentLevel.targetIndex ? 'text-yellow-900 font-bold' : ''}`}>{cat.count}</td>
                                      </tr>
                                  ))}
                                  {/* Total Row */}
                                  <tr className="bg-slate-50 font-bold text-slate-800">
                                      <td className="p-3 border-r border-slate-200">Tổng cộng</td>
                                      <td className="p-3">{percentLevel.categories.reduce((a,b)=>a+b.count,0)}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full max-w-md mb-6">
                          <p className="text-slate-700 font-medium mb-3">
                              Tính tỉ lệ phần trăm số bạn xếp loại <span className="font-bold text-indigo-700 bg-indigo-100 px-2 rounded">{percentLevel.categories[percentLevel.targetIndex].name}</span> so với cả nhóm?
                          </p>
                          <div className="flex gap-2 items-center">
                              <input 
                                type="text"
                                inputMode="decimal" 
                                value={userPercentAns}
                                onChange={(e) => setUserPercentAns(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && checkPercentage()}
                                placeholder="Nhập kết quả..."
                                className="flex-1 p-3 rounded-lg border-2 border-slate-300 font-bold text-lg text-center outline-none focus:border-indigo-500 bg-white"
                              />
                              <span className="text-xl font-bold text-slate-500">%</span>
                              <button 
                                onClick={checkPercentage}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md active:translate-y-0.5"
                              >
                                  Kiểm tra
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Feedback Overlay */}
              <div className="h-16 flex items-center justify-center w-full mt-auto">
                  {feedback && (
                      <div className={`px-6 py-3 rounded-xl shadow border-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                          feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                          'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                          {feedback.type === 'success' && <CheckCircle className="w-5 h-5"/>}
                          {feedback.type === 'error' && <HelpCircle className="w-5 h-5"/>}
                          <span className="font-bold"><MathMessage text={feedback.text} /></span>
                      </div>
                  )}
              </div>

          </div>

      </div>
    </div>
  );
};

export default DataClassificationGame;