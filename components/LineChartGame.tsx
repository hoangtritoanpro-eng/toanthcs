import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, RefreshCw, CheckCircle, TrendingUp, Table, HelpCircle, Calculator } from 'lucide-react';

interface LineChartGameProps {
  onBack: () => void;
}

interface DataPoint {
  label: string;
  value: number;
}

interface Theme {
  title: string;
  unit: string;
  labels: string[]; // e.g., ["Mon", "Tue"...] or ["Jan", "Feb"...]
  minVal: number;
  maxVal: number;
  trend: 'random' | 'increasing' | 'decreasing';
}

const THEMES: Theme[] = [
  {
    title: 'Nhiệt độ trung bình tuần qua',
    unit: '°C',
    labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
    minVal: 20,
    maxVal: 35,
    trend: 'random'
  },
  {
    title: 'Chiều cao cây đậu sau khi trồng',
    unit: 'cm',
    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'],
    minVal: 2,
    maxVal: 25,
    trend: 'increasing'
  },
  {
    title: 'Lượng mưa 6 tháng đầu năm',
    unit: 'mm',
    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
    minVal: 10,
    maxVal: 100,
    trend: 'random'
  },
  {
    title: 'Số lượng xe bán ra trong 5 năm',
    unit: 'xe',
    labels: ['2019', '2020', '2021', '2022', '2023'],
    minVal: 100,
    maxVal: 500,
    trend: 'random'
  },
  {
    title: 'Thời gian tự học ở nhà',
    unit: 'phút',
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    minVal: 30,
    maxVal: 120,
    trend: 'random'
  }
];

const LineChartGame: React.FC<LineChartGameProps> = ({ onBack }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [targetPoint, setTargetPoint] = useState<DataPoint | null>(null);
  const [questionType, setQuestionType] = useState<'VALUE_AT' | 'MAX' | 'MIN'>('VALUE_AT');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' }>({ 
    text: 'Quan sát bảng số liệu và biểu đồ để trả lời câu hỏi.', 
    type: 'neutral' 
  });
  const [score, setScore] = useState(0);
  const [showTable, setShowTable] = useState(true);

  // Chart Dimensions
  const WIDTH = 600;
  const HEIGHT = 350;
  const PADDING = 60;
  const GRAPH_WIDTH = WIDTH - PADDING * 2;
  const GRAPH_HEIGHT = HEIGHT - PADDING * 2;

  const initGame = () => {
    // 1. Pick Theme
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setCurrentTheme(theme);

    // 2. Generate Data
    let generatedData: DataPoint[] = [];
    let currentVal = theme.minVal + Math.random() * (theme.maxVal - theme.minVal);

    generatedData = theme.labels.map(label => {
      let val;
      if (theme.trend === 'increasing') {
        currentVal += Math.random() * ((theme.maxVal - theme.minVal) / theme.labels.length);
        val = Math.min(theme.maxVal, Math.max(theme.minVal, currentVal));
      } else {
        val = Math.floor(Math.random() * (theme.maxVal - theme.minVal + 1)) + theme.minVal;
      }
      return { label, value: Math.round(val) };
    });
    
    setData(generatedData);

    // 3. Generate Question
    const qTypes: ('VALUE_AT' | 'MAX' | 'MIN')[] = ['VALUE_AT', 'MAX', 'MIN'];
    const qType = qTypes[Math.floor(Math.random() * qTypes.length)];
    setQuestionType(qType);

    if (qType === 'VALUE_AT') {
       const randomIdx = Math.floor(Math.random() * generatedData.length);
       setTargetPoint(generatedData[randomIdx]);
    } else if (qType === 'MAX') {
       const max = generatedData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
       setTargetPoint(max);
    } else {
       const min = generatedData.reduce((prev, current) => (prev.value < current.value) ? prev : current);
       setTargetPoint(min);
    }

    setUserAnswer('');
    setFeedback({ text: 'Quan sát bảng số liệu và biểu đồ để trả lời câu hỏi.', type: 'neutral' });
  };

  useEffect(() => {
    initGame();
  }, []);

  // Calculate Chart Scales
  const yMax = useMemo(() => {
     if (data.length === 0) return 100;
     const maxData = Math.max(...data.map(d => d.value));
     // Round up to nice number
     return Math.ceil(maxData / 10) * 10 + 10; 
  }, [data]);

  const getX = (index: number) => PADDING + (index * (GRAPH_WIDTH / (data.length - 1)));
  const getY = (value: number) => HEIGHT - PADDING - ((value / yMax) * GRAPH_HEIGHT);

  const checkAnswer = () => {
    if (!targetPoint) return;
    
    let isCorrect = false;
    let correctVal: string | number = '';

    if (questionType === 'VALUE_AT') {
        // Answer is the numeric value
        if (parseInt(userAnswer) === targetPoint.value) isCorrect = true;
        correctVal = targetPoint.value;
    } else {
        // Answer is the label (Which month? Which day?)
        // Normalize strings for comparison
        if (userAnswer.trim().toLowerCase() === targetPoint.label.toLowerCase()) isCorrect = true;
        correctVal = targetPoint.label;
    }

    if (isCorrect) {
      setFeedback({ text: `Chính xác! Đáp án là ${correctVal}.`, type: 'success' });
      setScore(s => s + 10);
      setTimeout(initGame, 3000);
    } else {
      setFeedback({ text: `Chưa đúng. Hãy nhìn kỹ vào các điểm trên biểu đồ hoặc bảng số liệu.`, type: 'error' });
    }
  };

  const renderGrid = () => {
     const lines = [];
     const steps = 5; 
     for (let i = 0; i <= steps; i++) {
        const val = Math.round((yMax / steps) * i);
        const y = getY(val);
        lines.push(
            <g key={i}>
                <line x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={PADDING - 10} y={y + 4} textAnchor="end" className="text-xs fill-slate-400 font-bold">{val}</text>
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
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Biểu đồ đoạn thẳng</h2>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm">
          Điểm: {score}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Chart Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 flex flex-col relative overflow-hidden">
            <div className="p-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
               <h3 className="font-bold text-teal-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5"/> {currentTheme.title}
               </h3>
               <button 
                  onClick={() => setShowTable(!showTable)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${showTable ? 'bg-teal-600 text-white border-teal-700' : 'bg-white text-slate-600 border-slate-300'}`}
               >
                 <Table className="w-4 h-4"/> {showTable ? 'Ẩn bảng số liệu' : 'Hiện bảng số liệu'}
               </button>
            </div>

            <div className="flex flex-col md:flex-row h-full">
                
                {/* Data Table (Collapsible) */}
                {showTable && (
                    <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-slate-100 p-4 bg-slate-50 overflow-y-auto max-h-[200px] md:max-h-none">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 text-slate-500 font-bold">Thời gian</th>
                                    <th className="text-right py-2 text-slate-500 font-bold">{currentTheme.unit}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((d, i) => (
                                    <tr key={i} className="border-b border-slate-100 hover:bg-white transition-colors">
                                        <td className="py-2 text-slate-700 font-medium">{d.label}</td>
                                        <td className="py-2 text-right text-teal-700 font-bold">{d.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SVG Chart */}
                <div className="flex-1 p-2 md:p-4 flex items-center justify-center overflow-x-auto">
                    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-[700px] h-auto" style={{ minWidth: '400px' }}>
                        
                        {/* Grid & Axis */}
                        {renderGrid()}
                        
                        {/* Axes Lines */}
                        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING + 20} y2={HEIGHT - PADDING} stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" /> {/* X Axis */}
                        <line x1={PADDING} y1={HEIGHT - PADDING} x2={PADDING} y2={20} stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" /> {/* Y Axis */}
                        
                        {/* Arrow Marker Def */}
                        <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
                            </marker>
                        </defs>

                        {/* Axis Labels */}
                        <text x={WIDTH - PADDING + 10} y={HEIGHT - PADDING - 10} className="text-xs font-bold fill-slate-500" textAnchor="end">Thời gian</text>
                        <text x={PADDING + 10} y={15} className="text-xs font-bold fill-slate-500">{currentTheme.unit}</text>

                        {/* Chart Line */}
                        <polyline 
                            points={data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points & Labels */}
                        {data.map((d, i) => (
                            <g key={i} className="group">
                                {/* X-axis Label */}
                                <text x={getX(i)} y={HEIGHT - PADDING + 20} textAnchor="middle" className="text-xs font-bold fill-slate-600">{d.label}</text>
                                
                                {/* Vertical Dashed Line (Guide) */}
                                <line x1={getX(i)} y1={HEIGHT - PADDING} x2={getX(i)} y2={getY(d.value)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,4" className="opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* The Point */}
                                <circle cx={getX(i)} cy={getY(d.value)} r="5" fill="#ef4444" stroke="white" strokeWidth="2" className="cursor-pointer hover:scale-150 transition-transform shadow-sm"/>
                                
                                {/* Value Label (Above Point) */}
                                <rect x={getX(i)-14} y={getY(d.value)-30} width="28" height="20" rx="4" fill="white" stroke="#f59e0b" className="opacity-90"/>
                                <text x={getX(i)} y={getY(d.value)-16} textAnchor="middle" className="text-xs font-bold fill-slate-800 pointer-events-none">{d.value}</text>
                            </g>
                        ))}

                    </svg>
                </div>
            </div>
        </div>

        {/* Controls / Question Area */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-teal-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-teal-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                
                <div className="flex items-center gap-2 mb-4">
                   <HelpCircle className="w-6 h-6 text-teal-600"/>
                   <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Câu hỏi phân tích</span>
                </div>

                <div className="mb-6 font-medium text-slate-800 text-lg">
                    {questionType === 'VALUE_AT' && (
                        <>Tại thời điểm <span className="text-teal-600 font-bold">{targetPoint?.label}</span>, giá trị là bao nhiêu?</>
                    )}
                    {questionType === 'MAX' && (
                        <>Thời điểm nào có giá trị <span className="text-red-500 font-bold">cao nhất</span>?</>
                    )}
                    {questionType === 'MIN' && (
                        <>Thời điểm nào có giá trị <span className="text-blue-500 font-bold">thấp nhất</span>?</>
                    )}
                </div>

                <div className="flex gap-2">
                    <input 
                       type={questionType === 'VALUE_AT' ? "number" : "text"}
                       value={userAnswer}
                       onChange={(e) => setUserAnswer(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                       placeholder={questionType === 'VALUE_AT' ? "Nhập số..." : "Nhập thời gian..."}
                       className="flex-1 p-3 bg-slate-50 rounded-xl border-2 border-slate-200 outline-none focus:border-teal-500 font-bold text-slate-700 text-center"
                    />
                    <button 
                       onClick={checkAnswer}
                       className="bg-teal-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg active:translate-y-0.5 transition-all"
                    >
                      <CheckCircle className="w-6 h-6"/>
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

            <button 
               onClick={initGame}
               className="flex items-center justify-center gap-2 p-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 border border-slate-200 font-bold transition-colors"
             >
               <RefreshCw className="w-5 h-5"/> Bài tập khác
             </button>

             <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-900">
                <p className="font-bold mb-1">💡 Mẹo:</p>
                <p>Biểu đồ đoạn thẳng giúp ta dễ dàng nhìn thấy <b>xu hướng tăng/giảm</b> của dữ liệu theo thời gian. Mỗi điểm trên biểu đồ ứng với một cặp giá trị trong bảng số liệu.</p>
             </div>

        </div>
      </div>
    </div>
  );
};

export default LineChartGame;