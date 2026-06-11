import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, RotateCcw, PieChart, History, Hand } from 'lucide-react';

interface CoinGameProps {
  onBack: () => void;
}

type CoinResult = 'S' | 'N';

const CoinGame: React.FC<CoinGameProps> = ({ onBack }) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<CoinResult>('S');
  const [history, setHistory] = useState<CoinResult[]>([]);
  const [flipCount, setFlipCount] = useState(0);

  // Stats
  const sCount = history.filter(r => r === 'S').length;
  const nCount = history.filter(r => r === 'N').length;
  const sPercent = flipCount > 0 ? Math.round((sCount / flipCount) * 100) : 0;
  const nPercent = flipCount > 0 ? 100 - sPercent : 0;

  const handleFlip = (count: number = 1) => {
    if (isFlipping) return;

    if (count === 1) {
      // Single flip with animation
      setIsFlipping(true);
      const newResult = Math.random() > 0.5 ? 'S' : 'N';
      
      // The animation duration is 1s defined in CSS
      setTimeout(() => {
        setResult(newResult);
        setHistory(prev => [...prev, newResult]);
        setFlipCount(prev => prev + 1);
        setIsFlipping(false);
      }, 1000);
    } else {
      // Instant multiple flips (Batch)
      const newResults: CoinResult[] = [];
      for (let i = 0; i < count; i++) {
        newResults.push(Math.random() > 0.5 ? 'S' : 'N');
      }
      setHistory(prev => [...prev, ...newResults]);
      setFlipCount(prev => prev + count);
      // Set the visual result to the last one
      setResult(newResults[newResults.length - 1]);
    }
  };

  const handleReset = () => {
    setHistory([]);
    setFlipCount(0);
    setResult('S');
    setIsFlipping(false);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Xác suất thực nghiệm</h2>
        <button 
             onClick={handleReset}
             className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold transition-colors border border-slate-200 text-sm"
           >
             <RotateCcw className="w-4 h-4"/> Làm lại
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Stage - Coin */}
        <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 flex flex-col items-center justify-center p-8 relative min-h-[400px]">
           
           <div className="coin-container w-64 h-64 mb-10">
              <div className={`coin ${isFlipping ? (Math.random() > 0.5 ? 'flipping-heads' : 'flipping-tails') : (result === 'S' ? 'heads' : 'tails')}`}>
                  {/* Front: Sấp (S) - Gold */}
                  <div className="side bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 flex items-center justify-center border-4 border-yellow-700">
                      <div className="w-[90%] h-[90%] rounded-full border-2 border-yellow-200/50 flex items-center justify-center shadow-inner">
                         <span className="text-9xl font-serif font-bold text-yellow-100 drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]">S</span>
                      </div>
                      {/* Shine effect */}
                      <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50 pointer-events-none"></div>
                  </div>

                  {/* Back: Ngửa (N) - Silver */}
                  <div className="side side-back bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 flex items-center justify-center border-4 border-slate-600">
                      <div className="w-[90%] h-[90%] rounded-full border-2 border-slate-100/50 flex items-center justify-center shadow-inner">
                         <span className="text-9xl font-serif font-bold text-slate-100 drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]">N</span>
                      </div>
                      <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50 pointer-events-none"></div>
                  </div>
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={() => handleFlip(1)}
                disabled={isFlipping}
                className="bg-teal-500 hover:bg-teal-600 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg shadow-teal-500/30 transition-all flex items-center gap-2"
              >
                <Hand className="w-6 h-6"/> Tung 1 lần
              </button>
              
              <button 
                onClick={() => handleFlip(10)}
                disabled={isFlipping}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-full shadow border border-slate-200 transition-colors"
              >
                Tung 10 lần
              </button>
           </div>
           
           <div className="mt-8 text-slate-400 text-sm">
             Kết quả hiện tại: <span className="text-white font-bold text-xl ml-2">{isFlipping ? '...' : (result === 'S' ? 'Mặt Sấp (S)' : 'Mặt Ngửa (N)')}</span>
           </div>

        </div>

        {/* Info & Stats */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
            
            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-lg border border-teal-100 overflow-hidden">
               <div className="bg-teal-50 p-4 border-b border-teal-100 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-teal-700"/>
                  <h3 className="font-bold text-teal-900">Thống kê</h3>
               </div>
               
               <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                     <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-xs text-slate-500 uppercase font-bold">Số lần tung</div>
                        <div className="text-2xl font-bold text-slate-800">{flipCount}</div>
                     </div>
                     <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        <div className="text-xs text-yellow-700 uppercase font-bold">Sấp (S)</div>
                        <div className="text-2xl font-bold text-yellow-600">{sCount}</div>
                     </div>
                     <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-600 uppercase font-bold">Ngửa (N)</div>
                        <div className="text-2xl font-bold text-slate-700">{nCount}</div>
                     </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between text-sm mb-1 font-bold">
                           <span className="text-yellow-700">Tỉ lệ Sấp</span>
                           <span className="text-slate-600">{sPercent}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${sPercent}%` }}></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-sm mb-1 font-bold">
                           <span className="text-slate-600">Tỉ lệ Ngửa</span>
                           <span className="text-slate-600">{nPercent}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-slate-400 transition-all duration-500" style={{ width: `${nPercent}%` }}></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* History Log */}
            <div className="bg-white rounded-xl shadow-lg border border-teal-100 flex-1 flex flex-col overflow-hidden min-h-[200px] max-h-[400px]">
               <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <History className="w-5 h-5 text-slate-500"/>
                     <h3 className="font-bold text-slate-700">Lịch sử kết quả</h3>
                  </div>
                  <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border">Mới nhất trước</span>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
                  <div className="flex flex-wrap gap-2 content-start">
                     {[...history].reverse().map((res, idx) => (
                        <div 
                           key={history.length - 1 - idx} 
                           className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm text-sm border-2 animate-in zoom-in duration-300 ${
                              res === 'S' 
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                              : 'bg-white text-slate-600 border-slate-300'
                           }`}
                        >
                           {res}
                        </div>
                     ))}
                     {history.length === 0 && (
                        <div className="w-full text-center py-8 text-slate-400 italic">
                           Chưa có dữ liệu. Hãy tung đồng xu!
                        </div>
                     )}
                  </div>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CoinGame;