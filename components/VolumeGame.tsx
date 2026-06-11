import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, CheckCircle, Calculator, Cuboid, HelpCircle, ArrowUpFromLine, LayoutTemplate, Box, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface VolumeGameProps {
  onBack: () => void;
}

type MissingVar = 'volume' | 'area_lateral' | 'area_total' | 'length' | 'width' | 'height' | 'none';

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
        } catch (e) {
          console.warn("MathJax formatting warning", e);
        }
      }
    };
    renderMath();
  }, [text]);

  return <span ref={containerRef} className={className} style={{ display: 'inline-block' }} />;
};

// --- Visual Component: Isometric Cubes (3D View) ---
const CubeStack: React.FC<{ length: number; width: number; height: number; showGrid?: boolean; zoom: number }> = ({ 
  length, width, height, showGrid = true, zoom
}) => {
  const cubeSize = 34; 
  const centerX = 300;
  const centerY = 380; 

  const cubes = [];

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < length; x++) {
      for (let y = 0; y < width; y++) {
        cubes.push({ x, y, z });
      }
    }
  }

  // Sorting for Painter's Algorithm
  cubes.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z; 
    return (a.x + a.y) - (b.x + b.y); 
  });

  // Calculate transform for zoom centered at the middle
  const scale = zoom;
  const tx = centerX * (1 - scale);
  const ty = centerY * (1 - scale); // Approximate center

  return (
    <svg viewBox="0 0 600 450" className="w-full h-full drop-shadow-2xl transition-transform duration-300 ease-out">
      <g transform={`translate(${tx}, ${ty - 100}) scale(${scale})`}> 
      {cubes.map((cube) => {
        const dx = (cube.x - cube.y) * cubeSize * 0.866; 
        const dy = (cube.x + cube.y) * cubeSize * 0.5 - (cube.z * cubeSize); 
        
        const px = centerX + dx;
        const py = centerY + dy;

        const topColor = "#fcd34d"; // Amber 300
        const topStroke = "#d97706"; // Amber 600
        const leftColor = "#fbbf24"; // Amber 400
        const leftStroke = "#d97706";
        const rightColor = "#f59e0b"; // Amber 500
        const rightStroke = "#d97706";
        
        const w = cubeSize * 0.866;
        const h = cubeSize * 0.5;
        
        const topPath = `M ${px},${py - cubeSize} L ${px + w},${py - cubeSize - h} L ${px},${py - cubeSize - 2*h} L ${px - w},${py - cubeSize - h} Z`;
        const rightPath = `M ${px},${py - cubeSize} L ${px + w},${py - cubeSize - h} L ${px + w},${py - h} L ${px},${py} Z`;
        const leftPath = `M ${px},${py - cubeSize} L ${px - w},${py - cubeSize - h} L ${px - w},${py - h} L ${px},${py} Z`;

        return (
          <g key={`${cube.x}-${cube.y}-${cube.z}`} className="hover:opacity-90">
             <path d={topPath} fill={topColor} stroke={showGrid ? topStroke : topColor} strokeWidth="1" />
             <path d={leftPath} fill={leftColor} stroke={showGrid ? leftStroke : leftColor} strokeWidth="1" />
             <path d={rightPath} fill={rightColor} stroke={showGrid ? rightStroke : rightColor} strokeWidth="1" />
          </g>
        );
      })}
      
      {/* 3D Labels */}
      <text x={centerX - 150} y={centerY + 40} className="text-xl font-bold fill-slate-500">Dài: {length}</text>
      <text x={centerX + 150} y={centerY + 40} className="text-xl font-bold fill-slate-500">Rộng: {width}</text>
      <text x={centerX + 200} y={centerY - height*cubeSize/2} className="text-xl font-bold fill-slate-500">Cao: {height}</text>
      </g>
    </svg>
  );
};

// --- Visual Component: 2D Net Unfolding ---
const NetVisual: React.FC<{ length: number; width: number; height: number; zoom: number }> = ({ length, width, height, zoom }) => {
    // Dynamic Scaling Logic
    // We want the net to fit reasonably well within the 600x450 viewbox
    // The net structure is:
    // Strip width = w + l + w + l = 2(w+l)
    // Strip height = h
    // Flaps height = w (top) + w (bottom) -> Total Height = h + 2w
    
    const unitScale = 40 * zoom; 
    const padding = 60;
    
    // Calculate bounding box in units
    const totalUnitsW = 2 * (width + length);
    const totalUnitsH = height + 2 * width;

    // Colors
    const faceColor = "fill-cyan-300";
    const faceStroke = "stroke-cyan-800";
    const flapColor = "fill-cyan-100"; 
    
    const NetRect = ({ x, y, w, h, valW, valH, label, color = faceColor }: any) => (
        <g>
            <rect x={x} y={y} width={w} height={h} className={`${color} ${faceStroke} stroke-2`} />
            <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-slate-800 pointer-events-none" style={{textShadow: '0px 0px 4px white'}}>
                {valW}x{valH}
            </text>
        </g>
    );

    // Dynamic ViewBox Calculation to keep it centered
    const vbW = totalUnitsW * unitScale + padding * 2;
    const vbH = totalUnitsH * unitScale + padding * 2;
    
    // Strip positions
    const wPx = width * unitScale;
    const lPx = length * unitScale;
    const hPx = height * unitScale;

    // Ensure svg viewBox encompasses the whole shape
    // Structure: Side1(w) - Front(l) - Side2(w) - Back(l)
    return (
        <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-full animate-in fade-in duration-500">
            <g transform={`translate(${padding}, ${padding + wPx})`}>
                
                {/* 1. Left Side (Width x Height) */}
                <NetRect x={0} y={0} w={wPx} h={hPx} valW={width} valH={height} label="Side" />
                
                {/* 2. Front Face (Length x Height) */}
                <NetRect x={wPx} y={0} w={lPx} h={hPx} valW={length} valH={height} label="Front" />
                
                {/* 3. Right Side (Width x Height) */}
                <NetRect x={wPx + lPx} y={0} w={wPx} h={hPx} valW={width} valH={height} label="Side" />
                
                {/* 4. Back Face (Length x Height) */}
                <NetRect x={wPx + lPx + wPx} y={0} w={lPx} h={hPx} valW={length} valH={height} label="Back" />

                {/* Top Flap (Length x Width) - Attached to Front */}
                <NetRect x={wPx} y={-wPx} w={lPx} h={wPx} valW={length} valH={width} label="Top" color={flapColor} />

                {/* Bottom Flap (Length x Width) - Attached to Front */}
                <NetRect x={wPx} y={hPx} w={lPx} h={wPx} valW={length} valH={width} label="Bottom" color={flapColor} />

            </g>
        </svg>
    );
}

const VolumeGame: React.FC<VolumeGameProps> = ({ onBack }) => {
  const [dims, setDims] = useState({ l: 8, w: 5, h: 4 }); // Default per user image
  const [mode, setMode] = useState<'explore' | 'exercise'>('explore');
  const [isUnfolded, setIsUnfolded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [missingVar, setMissingVar] = useState<MissingVar>('none');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' }>({ 
    text: 'Điều chỉnh kích thước để xem hình hộp thay đổi thế nào.', 
    type: 'neutral' 
  });
  const [score, setScore] = useState(0);

  const MIN_DIM = 2;
  const MAX_DIM = 10; 

  const startExercise = useCallback(() => {
    setMode('exercise');
    const newL = Math.floor(Math.random() * 5) + 3; 
    const newW = Math.floor(Math.random() * 4) + 2; 
    const newH = Math.floor(Math.random() * 4) + 2; 
    setDims({ l: newL, w: newW, h: newH });

    const vars: MissingVar[] = ['volume', 'area_lateral', 'area_total'];
    const missing = vars[Math.floor(Math.random() * vars.length)];
    
    setMissingVar(missing);
    setUserAnswer('');
    
    if (missing === 'area_lateral' || missing === 'area_total') setIsUnfolded(true);
    else setIsUnfolded(false);

    if (missing === 'volume') {
      setFeedback({ text: 'Hãy tính **Thể tích ($V$)** của hình hộp chữ nhật.', type: 'neutral' });
    } else if (missing === 'area_lateral') {
      setFeedback({ text: 'Hãy tính **Diện tích xung quanh ($S_{xq}$)**.', type: 'neutral' });
    } else if (missing === 'area_total') {
      setFeedback({ text: 'Hãy tính **Diện tích toàn phần ($S_{tp}$)**.', type: 'neutral' });
    }
  }, []);

  const startExplore = () => {
    setMode('explore');
    setMissingVar('none');
    setDims({ l: 8, w: 5, h: 4 });
    setFeedback({ text: 'Chế độ khám phá: Quan sát hình và công thức.', type: 'neutral' });
  };

  const checkAnswer = () => {
    const volume = dims.l * dims.w * dims.h;
    const perimeterBase = 2 * (dims.l + dims.w);
    const areaLateral = perimeterBase * dims.h;
    const areaBase = dims.l * dims.w;
    const areaTotal = areaLateral + 2 * areaBase;

    let correctAnswer = 0;
    let stepByStep = "";

    switch (missingVar) {
      case 'volume': 
          correctAnswer = volume; 
          stepByStep = `$$V = l \\cdot w \\cdot h = ${dims.l} \\cdot ${dims.w} \\cdot ${dims.h} = ${volume}$$`;
          break;
      case 'area_lateral': 
          correctAnswer = areaLateral;
          stepByStep = `$$S_{xq} = 2h(l+w) = 2 \\cdot ${dims.h}(${dims.l} + ${dims.w}) = ${areaLateral}$$`;
          break;
      case 'area_total': 
          correctAnswer = areaTotal; 
          stepByStep = `$$S_{tp} = S_{xq} + 2S_{đáy} = ${areaLateral} + 2(${dims.l} \\cdot ${dims.w}) = ${areaTotal}$$`;
          break;
      default: break;
    }

    if (parseInt(userAnswer) === correctAnswer) {
       setFeedback({ text: `Chính xác! ${stepByStep}`, type: 'success' });
       setScore(s => s + 10);
       setTimeout(startExercise, 5000);
    } else {
       setFeedback({ text: `Sai rồi. Hãy thử lại công thức: ${stepByStep.split('=')[0]}`, type: 'error' });
    }
  };

  const handleDimChange = (dim: 'l' | 'w' | 'h', val: number) => {
    if (mode === 'exercise') return; 
    setDims(prev => ({ ...prev, [dim]: val }));
  };

  // Formula Display Logic
  const renderFormulaCard = () => {
     return (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm md:text-base">
            <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4"/> Công thức
            </h3>
            <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-blue-200 pb-1">
                    <span className="text-slate-600 font-bold">Thể tích:</span>
                    <MathMessage text={`$V = l \\cdot w \\cdot h$`} className="font-bold text-blue-900" />
                </div>
                <div className="flex justify-between items-center border-b border-blue-200 pb-1">
                    <span className="text-slate-600 font-bold">DT Xung quanh:</span>
                    <MathMessage text={`$S_{xq} = 2h(l+w)$`} className="font-bold text-blue-900" />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-bold">DT Toàn phần:</span>
                    <MathMessage text={`$S_{tp} = S_{xq} + 2lw$`} className="font-bold text-blue-900" />
                </div>
            </div>
        </div>
     );
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        
        <div className="flex bg-white rounded-full p-1 shadow-md border border-teal-100">
          <button 
            onClick={startExplore}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2 ${mode === 'explore' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            <Cuboid className="w-4 h-4" /> Khám phá
          </button>
          <button 
            onClick={startExercise}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2 ${mode === 'exercise' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-teal-50'}`}
          >
            <Calculator className="w-4 h-4" /> Bài tập
          </button>
        </div>

        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm">
          Điểm: {score}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
         
         {/* Visual Area */}
         <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 flex flex-col relative min-h-[500px] overflow-hidden">
            
            {/* Toolbar Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
               <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-lg border border-slate-200 text-slate-800 text-sm font-bold shadow-sm pointer-events-auto">
                  {mode === 'explore' ? 'Chế độ Khám phá' : 'Chế độ Bài tập'}
               </div>
               
               <div className="flex gap-2 pointer-events-auto">
                  <div className="bg-white/90 backdrop-blur rounded-lg border border-slate-200 shadow-sm flex">
                      <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-slate-100 rounded-l-lg text-slate-600" title="Thu nhỏ"><ZoomOut className="w-4 h-4"/></button>
                      <button onClick={() => setZoomLevel(1)} className="p-2 hover:bg-slate-100 border-x border-slate-200 text-slate-600" title="Mặc định"><Maximize className="w-4 h-4"/></button>
                      <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-100 rounded-r-lg text-slate-600" title="Phóng to"><ZoomIn className="w-4 h-4"/></button>
                  </div>
                  <button 
                     onClick={() => setIsUnfolded(!isUnfolded)}
                     className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md font-bold text-sm transition-colors"
                  >
                     {isUnfolded ? <Box className="w-4 h-4"/> : <LayoutTemplate className="w-4 h-4"/>}
                     {isUnfolded ? 'Xem khối 3D' : 'Trải phẳng'}
                  </button>
               </div>
            </div>
            
            {/* The Canvas */}
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
               {isUnfolded ? (
                   <NetVisual length={dims.l} width={dims.w} height={dims.h} zoom={zoomLevel} />
               ) : (
                   <CubeStack length={dims.l} width={dims.w} height={dims.h} zoom={zoomLevel} />
               )}
            </div>

            {/* Dimension Readout */}
            <div className="absolute bottom-4 left-4 flex gap-4 z-10 pointer-events-none">
               <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-amber-200 text-amber-900 font-mono font-bold text-sm">
                  {`L=${dims.l}, W=${dims.w}, H=${dims.h}`}
               </div>
            </div>
         </div>

         {/* Controls Area */}
         <div className="w-full lg:w-96 flex flex-col gap-4">
            
            {renderFormulaCard()}

            {/* Sliders */}
            <div className="bg-white p-5 rounded-xl border border-teal-100 shadow-sm flex flex-col gap-4">
               {['l', 'w', 'h'].map((d) => {
                  const label = d === 'l' ? 'Chiều Dài (l)' : d === 'w' ? 'Chiều Rộng (w)' : 'Chiều Cao (h)';
                  const val = dims[d as keyof typeof dims];
                  const color = d === 'l' ? 'text-amber-600' : d === 'w' ? 'text-amber-500' : 'text-amber-700';
                  
                  return (
                   <div key={d}>
                      <div className="flex justify-between mb-1">
                         <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <ArrowUpFromLine className={`w-3 h-3 ${d === 'l' ? 'rotate-90' : d === 'w' ? '-rotate-45' : ''}`}/> {label}
                         </label>
                         <span className={`font-bold ${color}`}>{val} cm</span>
                      </div>
                      <input 
                        type="range" min={MIN_DIM} max={MAX_DIM} 
                        value={val} 
                        onChange={(e) => handleDimChange(d as any, parseInt(e.target.value))}
                        disabled={mode === 'exercise'}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${mode === 'exercise' ? 'bg-slate-100' : 'bg-slate-200 accent-teal-600'}`}
                      />
                   </div>
                  );
               })}
            </div>

            {/* Answer Section */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
               feedback.type === 'success' ? 'bg-green-50 border-green-200' : 
               feedback.type === 'error' ? 'bg-red-50 border-red-200' : 
               'bg-slate-50 border-slate-200'
            }`}>
               <div className="text-sm font-medium text-slate-700 min-h-[3rem] flex items-center">
                 <MathMessage text={feedback.text} />
               </div>

               {mode === 'explore' ? (
                 <div className="grid grid-cols-1 gap-2">
                     <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center px-4">
                        <div className="text-xs text-slate-500 font-bold uppercase">Thể tích ($V$)</div>
                        <MathMessage text={`$${dims.l * dims.w * dims.h}$`} className="text-lg font-bold text-teal-600"/>
                     </div>
                     <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center px-4">
                        <div className="text-xs text-slate-500 font-bold uppercase">{'DT Xung quanh ($S_{xq}$)'}</div>
                        <MathMessage text={`$${2 * dims.h * (dims.l + dims.w)}$`} className="text-lg font-bold text-indigo-600"/>
                     </div>
                     <div className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center px-4">
                        <div className="text-xs text-slate-500 font-bold uppercase">{'DT Toàn phần ($S_{tp}$)'}</div>
                        <MathMessage text={`$${2 * dims.h * (dims.l + dims.w) + 2 * dims.l * dims.w}$`} className="text-lg font-bold text-purple-600"/>
                     </div>
                 </div>
               ) : (
                 <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Nhập số..."
                      onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                      className="flex-1 p-3 rounded-lg border-2 border-slate-200 bg-white text-slate-900 font-bold text-lg outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 placeholder:text-slate-400 transition-all text-center"
                    />
                    <button 
                      onClick={checkAnswer}
                      className="bg-teal-600 text-white px-5 rounded-lg font-bold hover:bg-teal-700 shadow-sm active:translate-y-0.5 whitespace-nowrap"
                    >
                      Kiểm tra
                    </button>
                 </div>
               )}
            </div>

         </div>
      </div>
    </div>
  );
};

export default VolumeGame;