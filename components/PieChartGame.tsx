import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle, RefreshCw, PieChart as PieIcon, Calculator, HelpCircle } from 'lucide-react';

interface PieChartGameProps {
  onBack: () => void;
}

interface DataItem {
  label: string;
  percent: number;
  color: string;
  value?: number; // Calculated value (number of students)
}

const COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#06b6d4', // Cyan
];

// Define various themes for the chart
const THEMES = [
  {
    title: 'Môn thể thao yêu thích',
    items: ['Bóng đá', 'Cầu lông', 'Bơi lội', 'Bóng rổ', 'Đá cầu', 'Bóng chuyền']
  },
  {
    title: 'Loại trái cây ưa thích',
    items: ['Xoài', 'Dưa hấu', 'Nho', 'Táo', 'Cam', 'Sầu riêng', 'Dâu tây']
  },
  {
    title: 'Phương tiện đến trường',
    items: ['Xe đạp', 'Đi bộ', 'Xe buýt', 'Xe máy', 'Xe điện']
  },
  {
    title: 'Vật nuôi yêu thích',
    items: ['Chó', 'Mèo', 'Thỏ', 'Hamster', 'Cá cảnh', 'Vẹt']
  },
  {
    title: 'Môn học yêu thích',
    items: ['Toán', 'Văn', 'Anh', 'Lý', 'Sinh', 'Sử', 'Địa']
  },
  {
    title: 'Kem yêu thích',
    items: ['Sô-cô-la', 'Vani', 'Dâu', 'Khoai môn', 'Sầu riêng', 'Dừa']
  }
];

// Helper to calculate coordinates on a circle
// Angle is in degrees. 0 degrees is 12 o'clock.
const getCoordinatesForPercent = (percent: number) => {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const PieChartGame: React.FC<PieChartGameProps> = ({ onBack }) => {
  const [totalStudents, setTotalStudents] = useState(200);
  const [chartTitle, setChartTitle] = useState('');
  const [data, setData] = useState<DataItem[]>([]);
  const [targetItem, setTargetItem] = useState<DataItem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' }>({ 
    text: 'Quan sát biểu đồ và trả lời câu hỏi bên dưới.', 
    type: 'neutral' 
  });

  // Generate random data
  const initGame = () => {
    // 1. Random total students (multiples of 10 or 100 for easier calculation initially)
    const totals = [100, 120, 150, 200, 250, 300, 400, 500];
    const newTotal = totals[Math.floor(Math.random() * totals.length)];
    setTotalStudents(newTotal);

    // 2. Select a Random Theme
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setChartTitle(randomTheme.title);

    // 3. Select 4 random items from that theme
    // Shuffle array and take first 4
    const shuffledItems = [...randomTheme.items].sort(() => 0.5 - Math.random()).slice(0, 4);

    // 4. Generate random percentages that sum to 100
    let remaining = 100;
    const newData: DataItem[] = [];
    
    // Generate first 3 randomly
    for (let i = 0; i < 3; i++) {
        // Ensure somewhat decent slices (min 10%, max leaving room for others)
        const max = remaining - (3 - i) * 10; 
        const min = 10;
        // Make sure it's a multiple of 5 for easier mental math
        let p = Math.floor(Math.random() * ((max - min) / 5 + 1)) * 5 + min;
        
        newData.push({
            label: shuffledItems[i],
            percent: p,
            color: COLORS[i % COLORS.length],
            value: (newTotal * p) / 100
        });
        remaining -= p;
    }
    // Last one gets the rest
    newData.push({
        label: shuffledItems[3],
        percent: remaining,
        color: COLORS[3 % COLORS.length],
        value: (newTotal * remaining) / 100
    });

    setData(newData);
    
    // 5. Pick a random question target
    const target = newData[Math.floor(Math.random() * newData.length)];
    setTargetItem(target);
    setUserAnswer('');
    setFeedback({ text: 'Quan sát biểu đồ và trả lời câu hỏi bên dưới.', type: 'neutral' });
  };

  useEffect(() => {
    initGame();
  }, []);

  const checkAnswer = () => {
    if (!targetItem) return;
    const val = parseInt(userAnswer);
    
    if (isNaN(val)) {
        setFeedback({ text: 'Vui lòng nhập một con số.', type: 'error' });
        return;
    }

    if (val === targetItem.value) {
        setFeedback({ text: `Chính xác! ${targetItem.percent}% của ${totalStudents} là ${(totalStudents * targetItem.percent) / 100}.`, type: 'success' });
        setScore(s => s + 10);
        setTimeout(initGame, 3000);
    } else {
        setFeedback({ 
            text: `Chưa đúng. Cách tính: lấy Tổng số học sinh nhân với số phần trăm rồi chia 100.`, 
            type: 'error' 
        });
    }
  };

  // --- Rendering SVG Pie Chart ---
  let cumulativePercent = 0;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Biểu đồ Hình quạt tròn</h2>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm">
          Điểm: {score}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Chart Area */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-xl border border-teal-100 p-6 flex flex-col items-center">
           <h3 className="text-lg font-bold text-slate-700 mb-4 text-center">
              Thống kê {chartTitle} <br/> của {totalStudents} học sinh khối 7
           </h3>

           <div className="relative w-64 h-64 md:w-80 md:h-80">
              <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90 drop-shadow-lg">
                 {data.map((slice, idx) => {
                    const startPercent = cumulativePercent;
                    const slicePercent = slice.percent / 100;
                    const endPercent = startPercent + slicePercent;
                    
                    // Coordinates
                    const startX = Math.cos(2 * Math.PI * startPercent);
                    const startY = Math.sin(2 * Math.PI * startPercent);
                    const endX = Math.cos(2 * Math.PI * endPercent);
                    const endY = Math.sin(2 * Math.PI * endPercent);

                    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                    const pathData = [
                        `M 0 0`,
                        `L ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `Z`
                    ].join(' ');

                    // Label position (mid-angle)
                    const midAngle = 2 * Math.PI * (startPercent + slicePercent/2);
                    // Adjust radius for label placement (0.6 means 60% from center)
                    const labelX = Math.cos(midAngle) * 0.7; 
                    const labelY = Math.sin(midAngle) * 0.7;

                    cumulativePercent += slicePercent;

                    return (
                        <g key={idx}>
                            <path d={pathData} fill={slice.color} stroke="white" strokeWidth="0.02" className="hover:opacity-90 transition-opacity" />
                            {/* Percentage Text */}
                            <text 
                                x={labelX} 
                                y={labelY} 
                                fill="white" 
                                fontSize="0.12" 
                                fontWeight="bold" 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                transform={`rotate(90 ${labelX} ${labelY})`} // Cancel out the SVG rotation for text
                                style={{textShadow: '0px 1px 2px rgba(0,0,0,0.3)'}}
                            >
                                {slice.percent}%
                            </text>
                        </g>
                    );
                 })}
              </svg>
           </div>
           
           {/* Legend */}
           <div className="flex flex-wrap gap-4 mt-8 justify-center">
              {data.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-bold text-slate-600">{item.label}</span>
                  </div>
              ))}
           </div>
        </div>

        {/* Question & Controls Area */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            
            {/* Question Card */}
            <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-6 h-6 text-teal-600"/>
                      <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Câu hỏi</span>
                   </div>
                   
                   <p className="text-lg text-slate-800 font-medium leading-relaxed mb-4">
                       Biết tổng số học sinh khối 7 là <span className="font-bold text-teal-700 text-xl">{totalStudents}</span> bạn.
                       <br/>
                       Hỏi có bao nhiêu bạn chọn <span className="font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: targetItem?.color }}>{targetItem?.label}</span>?
                   </p>

                   <div className="flex gap-2">
                       <input 
                          type="number" 
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                          placeholder="..."
                          className="flex-1 p-3 bg-white rounded-xl border-2 border-teal-200 text-center font-bold text-xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-700 shadow-inner"
                       />
                       <button 
                         onClick={checkAnswer}
                         className="bg-teal-600 text-white px-6 rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200 active:translate-y-0.5 transition-all"
                       >
                         Kiểm tra
                       </button>
                   </div>
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
               className="flex items-center justify-center gap-2 p-3 bg-white text-slate-600 rounded-xl hover:bg-slate-50 border border-slate-200 font-bold transition-colors shadow-sm"
             >
               <RefreshCw className="w-4 h-4"/> Bài tập khác
             </button>

             {/* Hint Box */}
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500">
                <p className="font-bold mb-1">💡 Ghi nhớ:</p>
                <p>Biểu đồ hình quạt tròn dùng để so sánh các phần trong toàn bộ dữ liệu. Tổng các thành phần luôn là 100% (tương ứng với một hình tròn hoàn chỉnh).</p>
                <p className="mt-2 text-slate-400 italic">Công thức: Giá trị = Tổng số $\times$ (Phần trăm $\div$ 100)</p>
             </div>

        </div>

      </div>
    </div>
  );
};

export default PieChartGame;