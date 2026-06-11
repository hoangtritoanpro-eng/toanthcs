import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, RefreshCw, CheckCircle, BarChart3, Calculator, HelpCircle, Columns } from 'lucide-react';

interface BarChartGameProps {
  onBack: () => void;
}

interface DataItem {
  label: string;
  v1: number;       // Value for series 1 (used in Single & Double)
  v2?: number;      // Value for series 2 (used in Double only)
}

interface Theme {
  title: string;
  series1Name: string;
  series2Name?: string; // Optional for double chart
  labels: string[];
  unit: string;
  color1: string;
  color2?: string;
}

const THEMES: Theme[] = [
  {
    title: 'Xếp loại học lực lớp 6A',
    series1Name: 'Học kỳ 1',
    series2Name: 'Học kỳ 2',
    labels: ['Giỏi', 'Khá', 'TB', 'Yếu'],
    unit: 'Học sinh',
    color1: '#3b82f6', // Blue
    color2: '#ef4444'  // Red
  },
  {
    title: 'Số cây trồng được của các tổ',
    series1Name: 'Đợt 1',
    series2Name: 'Đợt 2',
    labels: ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'],
    unit: 'Cây',
    color1: '#22c55e', // Green
    color2: '#eab308'  // Yellow
  },
  {
    title: 'Số sách đọc được trong hè',
    series1Name: 'Tháng 6',
    series2Name: 'Tháng 7',
    labels: ['Lan', 'Hùng', 'Mai', 'Tuấn', 'Yến'],
    unit: 'Cuốn',
    color1: '#8b5cf6', // Purple
    color2: '#06b6d4'  // Cyan
  },
  {
    title: 'Lượng mưa trung bình',
    series1Name: 'Năm 2022',
    series2Name: 'Năm 2023',
    labels: ['Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    unit: 'mm',
    color1: '#0ea5e9', // Sky
    color2: '#64748b'  // Slate
  }
];

const BarChartGame: React.FC<BarChartGameProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [data, setData] = useState<DataItem[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  
  // Question State
  const [questionText, setQuestionText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' }>({ 
    text: 'Quan sát biểu đồ và trả lời câu hỏi.', 
    type: 'neutral' 
  });
  const [score, setScore] = useState(0);

  // SVG Constants
  const WIDTH = 600;
  const HEIGHT = 350;
  const PADDING_LEFT = 60;
  const PADDING_BOTTOM = 40;
  const PADDING_TOP = 40;
  const PADDING_RIGHT = 20;
  const GRAPH_WIDTH = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const GRAPH_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const initGame = (selectedMode: 'SINGLE' | 'DOUBLE') => {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setCurrentTheme(theme);
    setMode(selectedMode);

    // Generate Data
    const generatedData: DataItem[] = theme.labels.map(label => {
        // Random values between 5 and 30 (scaled visually later)
        const v1 = Math.floor(Math.random() * 25) + 5;
        const v2 = Math.floor(Math.random() * 25) + 5;
        return { label, v1, v2 };
    });
    setData(generatedData);

    // Generate Question
    generateQuestion(selectedMode, generatedData, theme);
    setUserAnswer('');
    setFeedback({ text: 'Quan sát biểu đồ và trả lời câu hỏi.', type: 'neutral' });
  };

  const generateQuestion = (mode: 'SINGLE' | 'DOUBLE', data: DataItem[], theme: Theme) => {
    const type = Math.random();
    let qText = '';
    let ans = 0;

    // Pick a random target index
    const idx = Math.floor(Math.random() * data.length);
    const target = data[idx];

    if (mode === 'SINGLE') {
        if (type < 0.4) {
            // Type 1: Direct lookup
            qText = `${theme.title} đối với nhóm "${target.label}" là bao nhiêu?`;
            ans = target.v1;
        } else if (type < 0.7) {
            // Type 2: Sum all
            qText = `Tổng số ${theme.unit.toLowerCase()} của tất cả các nhóm là bao nhiêu?`;
            ans = data.reduce((acc, curr) => acc + curr.v1, 0);
        } else {
             // Type 3: Find Max
             const maxVal = Math.max(...data.map(d => d.v1));
             const maxItem = data.find(d => d.v1 === maxVal);
             qText = `Giá trị cao nhất trong biểu đồ là bao nhiêu?`;
             ans = maxVal;
        }
    } else {
        // DOUBLE CHART QUESTIONS
        if (type < 0.4) {
            // Type 1: Direct lookup specific series
            const askSeries1 = Math.random() > 0.5;
            const sName = askSeries1 ? theme.series1Name : theme.series2Name;
            const val = askSeries1 ? target.v1 : (target.v2 || 0);
            qText = `Tại nhóm "${target.label}", số liệu của "${sName}" là bao nhiêu?`;
            ans = val;
        } else if (type < 0.7) {
            // Type 2: Difference
            qText = `Tại nhóm "${target.label}", chênh lệch giữa hai đợt là bao nhiêu?`;
            ans = Math.abs(target.v1 - (target.v2 || 0));
        } else {
            // Type 3: Sum of a specific group
            qText = `Tổng số liệu cả hai đợt của nhóm "${target.label}" là bao nhiêu?`;
            ans = target.v1 + (target.v2 || 0);
        }
    }

    setQuestionText(qText);
    setCorrectAnswer(ans);
  };

  useEffect(() => {
    initGame('SINGLE');
  }, []);

  // Calculate Scale
  const maxValue = useMemo(() => {
      let max = 0;
      data.forEach(d => {
          max = Math.max(max, d.v1);
          if (mode === 'DOUBLE') max = Math.max(max, d.v2 || 0);
      });
      return Math.ceil(max / 5) * 5 + 5; // Round up to nearest 5, add padding
  }, [data, mode]);

  const getY = (val: number) => {
      return (val / maxValue) * GRAPH_HEIGHT;
  };

  const checkAnswer = () => {
      const userVal = parseInt(userAnswer);
      if (isNaN(userVal)) return;

      if (userVal === correctAnswer) {
          setFeedback({ text: `Chính xác! Đáp án là ${correctAnswer} ${currentTheme.unit}.`, type: 'success' });
          setScore(s => s + 10);
          setTimeout(() => {
              // Keep current mode for next question usually, but re-init game logic
              const newData = [...data]; // or regen? Let's regen to keep it fresh
              initGame(mode); 
          }, 3000);
      } else {
          setFeedback({ text: 'Chưa đúng. Hãy nhìn kỹ cột tương ứng và gióng sang trục tung nhé.', type: 'error' });
      }
  };

  // Rendering logic
  const renderGridLines = () => {
      const lines = [];
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
          const val = Math.round((maxValue / steps) * i);
          const y = HEIGHT - PADDING_BOTTOM - getY(val);
          lines.push(
              <g key={i}>
                  <line x1={PADDING_LEFT} y1={y} x2={WIDTH - PADDING_RIGHT} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                  <text x={PADDING_LEFT - 10} y={y + 4} textAnchor="end" className="text-xs fill-slate-400 font-bold">{val}</text>
              </g>
          );
      }
      return lines;
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Biểu đồ Cột & Cột Kép</h2>
        
        {/* Mode Toggle */}
        <div className="flex bg-white rounded-lg p-1 border border-teal-100 shadow-sm">
            <button 
                onClick={() => initGame('SINGLE')}
                className={`px-3 py-1 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'SINGLE' ? 'bg-teal-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <BarChart3 className="w-4 h-4"/> Cột đơn
            </button>
            <button 
                onClick={() => initGame('DOUBLE')}
                className={`px-3 py-1 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'DOUBLE' ? 'bg-teal-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Columns className="w-4 h-4"/> Cột kép
            </button>
        </div>

        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm">
          Điểm: {score}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
          
          {/* CHART AREA */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 p-4 flex flex-col items-center">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{currentTheme.title}</h3>
              
              {/* Legend (Only needed for Double, but useful to show color for Single too) */}
              <div className="flex gap-6 mb-4">
                  <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-sm" style={{backgroundColor: currentTheme.color1}}></div>
                      <span className="text-sm font-bold text-slate-600">{currentTheme.series1Name}</span>
                  </div>
                  {mode === 'DOUBLE' && (
                      <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-sm" style={{backgroundColor: currentTheme.color2}}></div>
                          <span className="text-sm font-bold text-slate-600">{currentTheme.series2Name}</span>
                      </div>
                  )}
              </div>

              <div className="w-full overflow-x-auto flex justify-center">
                  <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-[700px] h-auto select-none" style={{minWidth: '450px'}}>
                      {/* Grid */}
                      {renderGridLines()}

                      {/* Axes */}
                      <line x1={PADDING_LEFT} y1={HEIGHT - PADDING_BOTTOM} x2={WIDTH - PADDING_RIGHT} y2={HEIGHT - PADDING_BOTTOM} stroke="#64748b" strokeWidth="2" />
                      <line x1={PADDING_LEFT} y1={HEIGHT - PADDING_BOTTOM} x2={PADDING_LEFT} y2={PADDING_TOP} stroke="#64748b" strokeWidth="2" />
                      
                      {/* Axis Labels */}
                      <text x={PADDING_LEFT + 10} y={PADDING_TOP} className="text-xs font-bold fill-slate-500">{currentTheme.unit}</text>

                      {/* Bars */}
                      {data.map((item, idx) => {
                          const groupWidth = GRAPH_WIDTH / data.length;
                          const barWidth = mode === 'SINGLE' ? groupWidth * 0.5 : groupWidth * 0.35;
                          const gap = mode === 'SINGLE' ? 0 : 4; // Gap between double bars
                          
                          // X Coordinates
                          const xCenter = PADDING_LEFT + (idx * groupWidth) + (groupWidth / 2);
                          const x1 = mode === 'SINGLE' ? xCenter - barWidth/2 : xCenter - barWidth - gap/2;
                          const x2 = xCenter + gap/2;

                          // Heights
                          const h1 = getY(item.v1);
                          const h2 = mode === 'DOUBLE' && item.v2 ? getY(item.v2) : 0;
                          
                          const y1 = HEIGHT - PADDING_BOTTOM - h1;
                          const y2 = HEIGHT - PADDING_BOTTOM - h2;

                          return (
                              <g key={idx}>
                                  {/* Series 1 Bar */}
                                  <rect 
                                    x={x1} y={y1} width={barWidth} height={h1} 
                                    fill={currentTheme.color1} 
                                    rx="2"
                                    className="hover:opacity-80 transition-all duration-500 ease-out origin-bottom scale-y-100" // Simple animation class placeholder
                                  >
                                    <title>{item.v1}</title>
                                  </rect>
                                  {/* Value Label 1 */}
                                  <text x={x1 + barWidth/2} y={y1 - 5} textAnchor="middle" className="text-xs font-bold fill-slate-600">{item.v1}</text>

                                  {/* Series 2 Bar (If Double) */}
                                  {mode === 'DOUBLE' && item.v2 !== undefined && (
                                    <>
                                        <rect 
                                            x={x2} y={y2} width={barWidth} height={h2} 
                                            fill={currentTheme.color2} 
                                            rx="2"
                                            className="hover:opacity-80 transition-all duration-500 ease-out"
                                        >
                                            <title>{item.v2}</title>
                                        </rect>
                                        <text x={x2 + barWidth/2} y={y2 - 5} textAnchor="middle" className="text-xs font-bold fill-slate-600">{item.v2}</text>
                                    </>
                                  )}

                                  {/* X Axis Label */}
                                  <text x={xCenter} y={HEIGHT - PADDING_BOTTOM + 20} textAnchor="middle" className="text-xs font-bold fill-slate-700">
                                      {item.label}
                                  </text>
                              </g>
                          )
                      })}
                  </svg>
              </div>
          </div>

          {/* CONTROLS */}
          <div className="w-full lg:w-96 flex flex-col gap-6">
              
              <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="w-6 h-6 text-teal-600"/>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Câu hỏi</span>
                </div>
                <p className="text-lg text-slate-800 font-medium leading-relaxed mb-4">
                    {questionText}
                </p>

                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                        placeholder="..."
                        className="flex-1 p-3 bg-white rounded-xl border-2 border-teal-200 text-center font-bold text-xl outline-none focus:border-teal-500 text-slate-700"
                    />
                    <button 
                        onClick={checkAnswer}
                        className="bg-teal-600 text-white px-6 rounded-xl font-bold hover:bg-teal-700 shadow-lg active:translate-y-0.5 transition-all"
                    >
                        Kiểm tra
                    </button>
                </div>
              </div>

              {/* Feedback */}
              <div className={`p-4 rounded-xl border-2 flex items-start gap-3 transition-colors ${
                feedback.type === 'success' ? 'bg-green-50 border-green-200' : 
                feedback.type === 'error' ? 'bg-red-50 border-red-200' : 
                'bg-white border-slate-200'
              }`}>
                <div className="mt-1">
                    {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600"/> : <Calculator className="w-5 h-5 text-slate-400"/>}
                </div>
                <div className={`text-sm font-medium ${
                    feedback.type === 'success' ? 'text-green-800' : 
                    feedback.type === 'error' ? 'text-red-800' : 
                    'text-slate-600'
                }`}>
                    {feedback.text}
                </div>
              </div>

              <div className="flex gap-3">
                  <button 
                    onClick={() => initGame(mode)}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 border border-slate-200 font-bold transition-colors"
                    >
                    <RefreshCw className="w-4 h-4"/> Đổi đề bài
                  </button>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                  <p className="font-bold mb-1">💡 Ghi nhớ:</p>
                  <ul className="list-disc pl-4 space-y-1">
                      <li><b>Biểu đồ cột đơn</b>: Dùng để so sánh dữ liệu giữa các đối tượng.</li>
                      <li><b>Biểu đồ cột kép</b>: Dùng để so sánh hai luồng dữ liệu của cùng các đối tượng (ví dụ: so sánh 2 học kỳ, 2 năm...).</li>
                  </ul>
              </div>

          </div>

      </div>
    </div>
  );
};

export default BarChartGame;