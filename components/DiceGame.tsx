import React, { useState, useEffect } from 'react';
import { ChevronLeft, RotateCcw, BarChart3, Dices, Layers } from 'lucide-react';

interface DiceGameProps {
  onBack: () => void;
}

interface RollResult {
  d1: number;
  d2?: number;
  sum: number;
}

const DiceGame: React.FC<DiceGameProps> = ({ onBack }) => {
  const [numDice, setNumDice] = useState<1 | 2>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [currentVal, setCurrentVal] = useState<{d1: number, d2: number}>({d1: 1, d2: 1});
  const [history, setHistory] = useState<RollResult[]>([]);
  
  // Audio ref (optional, simple placeholder)
  // const rollSound = new Audio('/roll.mp3');

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    
    // Simulate audio if needed
    
    // Determine random outcome
    const nextD1 = Math.floor(Math.random() * 6) + 1;
    const nextD2 = Math.floor(Math.random() * 6) + 1;
    
    // Wait for animation
    setTimeout(() => {
        setCurrentVal({ d1: nextD1, d2: nextD2 });
        setIsRolling(false);
        setHistory(prev => [...prev, {
            d1: nextD1,
            d2: numDice === 2 ? nextD2 : undefined,
            sum: numDice === 2 ? nextD1 + nextD2 : nextD1
        }]);
    }, 1000); // 1s matches animation duration
  };

  const handleReset = () => {
    setHistory([]);
    setCurrentVal({d1: 1, d2: 1});
  };

  const toggleDiceCount = () => {
    if (isRolling) return;
    setNumDice(prev => prev === 1 ? 2 : 1);
    handleReset();
  };

  // --- Statistics Logic ---
  const getFrequency = () => {
    const counts: Record<number, number> = {};
    const total = history.length;
    
    if (total === 0) return [];

    if (numDice === 1) {
        // Count 1-6
        for(let i=1; i<=6; i++) counts[i] = 0;
        history.forEach(h => counts[h.sum] = (counts[h.sum] || 0) + 1);
    } else {
        // Count sums 2-12
        for(let i=2; i<=12; i++) counts[i] = 0;
        history.forEach(h => counts[h.sum] = (counts[h.sum] || 0) + 1);
    }

    return Object.entries(counts).map(([key, count]) => ({
        val: parseInt(key),
        count,
        percent: total > 0 ? Math.round((count/total)*100) : 0
    }));
  };

  const stats = getFrequency();

  // --- 3D Cube Component ---
  const Die = ({ value, rolling }: { value: number, rolling: boolean }) => {
     // Transform map to show the correct face
     const getTransform = (val: number) => {
        switch(val) {
            case 1: return 'rotateX(0deg) rotateY(0deg)';
            case 6: return 'rotateX(0deg) rotateY(180deg)';
            case 2: return 'rotateX(-90deg) rotateY(0deg)';
            case 5: return 'rotateX(90deg) rotateY(0deg)';
            case 3: return 'rotateY(-90deg)';
            case 4: return 'rotateY(90deg)';
            default: return 'rotateX(0deg)';
        }
     };

     return (
        <div className="dice-scene" style={{ width: '100px', height: '100px' }}>
            <div 
              className={`cube ${rolling ? 'rolling' : ''}`} 
              style={{ transform: rolling ? undefined : getTransform(value) }}
            >
                {/* Face 1 */}
                <div className="cube-face cube-face-1"><div className="dot"></div></div>
                
                {/* Face 2 */}
                <div className="cube-face cube-face-2">
                    <div className="face-content" style={{transform: 'rotate(90deg)'}}>
                       <div className="dot" style={{gridArea: '1/3'}}></div>
                       <div className="dot" style={{gridArea: '3/1'}}></div>
                    </div>
                </div>
                
                {/* Face 3 */}
                <div className="cube-face cube-face-3">
                    <div className="face-content">
                       <div className="dot" style={{gridArea: '1/1'}}></div>
                       <div className="dot" style={{gridArea: '2/2'}}></div>
                       <div className="dot" style={{gridArea: '3/3'}}></div>
                    </div>
                </div>

                {/* Face 4 */}
                <div className="cube-face cube-face-4">
                    <div className="face-content">
                       <div className="dot" style={{gridArea: '1/1'}}></div>
                       <div className="dot" style={{gridArea: '1/3'}}></div>
                       <div className="dot" style={{gridArea: '3/1'}}></div>
                       <div className="dot" style={{gridArea: '3/3'}}></div>
                    </div>
                </div>

                {/* Face 5 */}
                <div className="cube-face cube-face-5">
                    <div className="face-content">
                       <div className="dot" style={{gridArea: '1/1'}}></div>
                       <div className="dot" style={{gridArea: '1/3'}}></div>
                       <div className="dot" style={{gridArea: '2/2'}}></div>
                       <div className="dot" style={{gridArea: '3/1'}}></div>
                       <div className="dot" style={{gridArea: '3/3'}}></div>
                    </div>
                </div>

                {/* Face 6 */}
                <div className="cube-face cube-face-6">
                    <div className="face-content" style={{transform: 'rotate(90deg)'}}>
                       <div className="dot" style={{gridArea: '1/1'}}></div>
                       <div className="dot" style={{gridArea: '1/2'}}></div>
                       <div className="dot" style={{gridArea: '1/3'}}></div>
                       <div className="dot" style={{gridArea: '3/1'}}></div>
                       <div className="dot" style={{gridArea: '3/2'}}></div>
                       <div className="dot" style={{gridArea: '3/3'}}></div>
                    </div>
                </div>
            </div>
        </div>
     );
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Gieo Xúc Xắc</h2>
        <div className="flex gap-2">
            <button 
                onClick={toggleDiceCount}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 font-bold transition-colors text-sm"
            >
                <Layers className="w-4 h-4"/> 
                {numDice === 1 ? 'Chuyển sang 2 viên' : 'Chuyển sang 1 viên'}
            </button>
            <button 
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold transition-colors border border-slate-200 text-sm"
            >
                <RotateCcw className="w-4 h-4"/> Làm lại
            </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Stage */}
        <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 flex flex-col items-center justify-center p-8 relative min-h-[400px]">
           
           <div className="flex gap-12 mb-12 items-center justify-center h-48">
              <Die value={currentVal.d1} rolling={isRolling} />
              {numDice === 2 && <Die value={currentVal.d2} rolling={isRolling} />}
           </div>

           <button 
                onClick={handleRoll}
                disabled={isRolling}
                className="bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg shadow-red-500/30 transition-all flex items-center gap-3 border-b-4 border-red-700"
              >
                <Dices className="w-8 h-8"/> Gieo ngay
           </button>
           
           <div className="mt-8 text-slate-300 font-medium">
             {history.length === 0 ? 'Hãy gieo viên xúc xắc đầu tiên!' : (
                 isRolling ? 'Đang gieo...' : (
                    <span className="text-2xl text-white font-bold">
                        Kết quả: {numDice === 2 ? `${currentVal.d1} + ${currentVal.d2} = ${currentVal.d1 + currentVal.d2}` : currentVal.d1}
                    </span>
                 )
             )}
           </div>
        </div>

        {/* Stats Panel */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-lg border border-teal-100 p-4 flex justify-between items-center">
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">Tổng số lần gieo</div>
                    <div className="text-3xl font-bold text-slate-800">{history.length}</div>
                </div>
                <div className="bg-teal-50 p-3 rounded-full text-teal-600">
                    <BarChart3 className="w-8 h-8"/>
                </div>
            </div>

            {/* Frequency Chart */}
            <div className="bg-white rounded-xl shadow-lg border border-teal-100 flex-1 flex flex-col overflow-hidden">
               <div className="bg-slate-50 p-4 border-b border-slate-100 font-bold text-slate-700">
                  Tần số xuất hiện
               </div>
               
               <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-white">
                  {history.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                          Chưa có dữ liệu thống kê
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {stats.map((stat) => (
                              <div key={stat.val} className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                      numDice === 1 ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'
                                  }`}>
                                      {stat.val}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between text-xs mb-1 text-slate-500 font-bold">
                                          <span>{stat.count} lần</span>
                                          <span>{stat.percent}%</span>
                                      </div>
                                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full transition-all duration-500 ${numDice === 1 ? 'bg-red-400' : 'bg-indigo-400'}`} 
                                            style={{ width: `${stat.percent}%` }}
                                          ></div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
               </div>
            </div>

             {/* Recent History (Mini) */}
             <div className="bg-slate-800 rounded-xl p-4 shadow-inner">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Lịch sử gần đây</div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {[...history].reverse().slice(0, 10).map((h, idx) => (
                        <div key={idx} className="flex-shrink-0 w-10 h-10 bg-slate-700 rounded text-white font-bold flex items-center justify-center border border-slate-600 text-sm">
                            {h.sum}
                        </div>
                    ))}
                </div>
             </div>

        </div>
      </div>
    </div>
  );
};

export default DiceGame;