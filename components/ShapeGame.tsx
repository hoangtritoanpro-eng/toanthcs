import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RefreshCw, CheckCircle, Eye, EyeOff, GripHorizontal, Move, RotateCcw, Target, Check } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

type ShapeType = 'SQUARE' | 'RECTANGLE' | 'RHOMBUS' | 'PARALLELOGRAM' | 'TRAPEZOID' | 'QUADRILATERAL';

const TARGETS: { type: ShapeType; label: string; hint: string }[] = [
  { type: 'SQUARE', label: 'HÌNH VUÔNG', hint: '4 cạnh bằng nhau, 4 góc vuông' },
  { type: 'RECTANGLE', label: 'HÌNH CHỮ NHẬT', hint: 'Các cặp cạnh đối song song và bằng nhau, 4 góc vuông' },
  { type: 'RHOMBUS', label: 'HÌNH THOI', hint: '4 cạnh bằng nhau' },
  { type: 'PARALLELOGRAM', label: 'HÌNH BÌNH HÀNH', hint: 'Các cặp cạnh đối song song và bằng nhau' },
  { type: 'TRAPEZOID', label: 'HÌNH THANG CÂN', hint: '2 cạnh đáy song song, 2 cạnh bên bằng nhau' }
];

interface ShapeGameProps {
  onBack: () => void;
}

const GRID_SIZE = 40;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const ShapeGame: React.FC<ShapeGameProps> = ({ onBack }) => {
  const [target, setTarget] = useState(TARGETS[0]);
  const [points, setPoints] = useState<Point[]>([
    { x: 10, y: 5 }, { x: 16, y: 5 }, { x: 16, y: 10 }, { x: 10, y: 10 }
  ].map(p => ({ x: p.x * GRID_SIZE, y: p.y * GRID_SIZE })));
  
  const [currentShapeName, setCurrentShapeName] = useState<string>("Tứ giác");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [showLabel, setShowLabel] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'neutral' }>({ text: 'Kéo thả các điểm để tạo hình đúng yêu cầu', type: 'neutral' });
  const [score, setScore] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);

  // Math Helpers
  const distSq = (p1: Point, p2: Point) => Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  const dotProduct = (v1: Point, v2: Point) => v1.x * v2.x + v1.y * v2.y;
  const crossProduct = (v1: Point, v2: Point) => v1.x * v2.y - v1.y * v2.x;

  // Real-time detection logic
  const detectShape = useCallback((currentPoints: Point[]): string => {
    const [A, B, C, D] = currentPoints;
    
    const AB = { x: B.x - A.x, y: B.y - A.y };
    const BC = { x: C.x - B.x, y: C.y - B.y };
    const CD = { x: D.x - C.x, y: D.y - C.y };
    const DA = { x: A.x - D.x, y: A.y - D.y };
    
    const lenAB = distSq(A, B);
    const lenBC = distSq(B, C);
    const lenCD = distSq(C, D);
    // const lenDA = distSq(D, A);
    const lenAC = distSq(A, C); 
    const lenBD = distSq(B, D); 

    // Tolerance (since we snap to grid, close to 0 is usually effectively 0)
    const isAB_CD_Parallel = Math.abs(crossProduct(AB, CD)) < 100;
    const isBC_DA_Parallel = Math.abs(crossProduct(BC, DA)) < 100;

    const isParallelogram = isAB_CD_Parallel && isBC_DA_Parallel;
    const isRectangular = Math.abs(dotProduct(AB, BC)) < 100; // Right angle
    const isEqualSides = Math.abs(lenAB - lenBC) < 100 && Math.abs(lenBC - lenCD) < 100;

    if (isParallelogram) {
      if (isRectangular) {
        return isEqualSides ? "HÌNH VUÔNG" : "HÌNH CHỮ NHẬT";
      }
      return isEqualSides ? "HÌNH THOI" : "HÌNH BÌNH HÀNH";
    }

    // Trapezoid check
    if ((isAB_CD_Parallel && !isBC_DA_Parallel) || (!isAB_CD_Parallel && isBC_DA_Parallel)) {
       const isIsosceles = Math.abs(lenAC - lenBD) < 100;
       return isIsosceles ? "HÌNH THANG CÂN" : "HÌNH THANG";
    }

    return "TỨ GIÁC THƯỜNG";
  }, []);

  const scramblePoints = useCallback(() => {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const offset = 80;
    
    // Create random quadrilateral
    const newPoints = [
      { x: cx - offset + (Math.random() * 60 - 30), y: cy - offset + (Math.random() * 60 - 30) },
      { x: cx + offset + (Math.random() * 60 - 30), y: cy - offset + (Math.random() * 60 - 30) },
      { x: cx + offset + (Math.random() * 60 - 30), y: cy + offset + (Math.random() * 60 - 30) },
      { x: cx - offset + (Math.random() * 60 - 30), y: cy + offset + (Math.random() * 60 - 30) }
    ].map(p => ({
       x: Math.round(p.x / GRID_SIZE) * GRID_SIZE,
       y: Math.round(p.y / GRID_SIZE) * GRID_SIZE
    }));
    
    setPoints(newPoints);
    setCurrentShapeName(detectShape(newPoints));
    setFeedback({ text: 'Kéo thả các điểm để tạo hình đúng yêu cầu', type: 'neutral' });
  }, [detectShape]);

  // Initialize a random level
  const initLevel = useCallback(() => {
    const randomTarget = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    setTarget(randomTarget);
    scramblePoints();
  }, [scramblePoints]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Handle Dragging
  const handleMouseDown = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    setDraggingIdx(index);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIdx === null || !svgRef.current) return;

    let clientX, clientY;
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    const CTM = svgRef.current.getScreenCTM();
    if (CTM) {
      const x = (clientX - CTM.e) / CTM.a;
      const y = (clientY - CTM.f) / CTM.d;

      // Snap to grid
      const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

      // Bounds checking
      const clampedX = Math.max(GRID_SIZE, Math.min(CANVAS_WIDTH - GRID_SIZE, snappedX));
      const clampedY = Math.max(GRID_SIZE, Math.min(CANVAS_HEIGHT - GRID_SIZE, snappedY));

      const newPoints = [...points];
      newPoints[draggingIdx] = { x: clampedX, y: clampedY };
      
      setPoints(newPoints);
      setCurrentShapeName(detectShape(newPoints));
    }
  };

  const handleMouseUp = () => {
    setDraggingIdx(null);
  };

  const checkShape = () => {
    const currentType = detectShape(points);
    
    if (currentType === target.label) {
      setFeedback({ text: `Chính xác! Đây là ${target.label}.`, type: 'success' });
      setScore(s => s + 10);
      setTimeout(initLevel, 2000);
    } else {
      setFeedback({ text: `Chưa đúng. Hình hiện tại là ${currentType}, không phải ${target.label}.`, type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        
        {/* Dynamic Label Display */}
        <div className="flex items-center gap-4">
           <div className={`bg-white px-6 py-2 rounded-xl shadow border-2 flex items-center gap-3 transition-colors ${
               currentShapeName === target.label ? 'border-green-400 bg-green-50' : 'border-teal-200'
           }`}>
             <button onClick={() => setShowLabel(!showLabel)} className="text-teal-500 hover:text-teal-700">
               {showLabel ? <Eye className="w-5 h-5"/> : <EyeOff className="w-5 h-5"/>}
             </button>
             <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hình hiện tại</span>
                <span className={`text-xl font-bold tracking-wider transition-opacity ${
                    currentShapeName === target.label ? 'text-green-700' : 'text-slate-800'
                } ${showLabel ? 'opacity-100' : 'opacity-0 blur-sm'}`}>
                {currentShapeName}
                </span>
             </div>
           </div>
        </div>

        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm">
          Điểm: {score}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 bg-sky-50 rounded-2xl shadow-xl border-4 border-sky-200 flex flex-col relative overflow-hidden">
        
        {/* SVG Canvas */}
        <div className="flex-1 relative cursor-crosshair overflow-hidden" 
             onMouseMove={handleMouseMove}
             onTouchMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onTouchEnd={handleMouseUp}
             onMouseLeave={handleMouseUp}
        >
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} 
            className="w-full h-full bg-white"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              </pattern>
              <pattern id="gridBold" width={GRID_SIZE*5} height={GRID_SIZE*5} patternUnits="userSpaceOnUse">
                 <rect width={GRID_SIZE*5} height={GRID_SIZE*5} fill="url(#grid)" />
                 <path d={`M ${GRID_SIZE*5} 0 L 0 0 0 ${GRID_SIZE*5}`} fill="none" stroke="#cbd5e1" strokeWidth="2"/>
              </pattern>
            </defs>

            {/* Background is always visible */}
            <rect width="100%" height="100%" fill="white" />
            
            {/* Grid overlay - Conditional */}
            {showGrid && (
              <rect width="100%" height="100%" fill="url(#gridBold)" className="pointer-events-none" />
            )}

            {/* Shape Fill */}
            <polygon 
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill={currentShapeName === target.label ? "rgba(74, 222, 128, 0.5)" : "rgba(253, 224, 71, 0.5)"}
              stroke={currentShapeName === target.label ? "#15803d" : "#ca8a04"}
              strokeWidth="4"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Vertices & Labels */}
            {points.map((p, i) => (
              <g key={i} transform={`translate(${p.x}, ${p.y})`}>
                 <circle 
                   r="14" 
                   fill={currentShapeName === target.label ? "rgba(134, 239, 172, 0.9)" : "rgba(253, 224, 71, 0.9)"}
                   stroke={currentShapeName === target.label ? "#15803d" : "#a16207"}
                   strokeWidth="2"
                   className="cursor-move hover:scale-110 transition-transform"
                   onMouseDown={(e) => handleMouseDown(i, e)}
                   onTouchStart={(e) => handleMouseDown(i, e)}
                 />
                 <text y="5" textAnchor="middle" className="pointer-events-none font-bold text-xs select-none fill-slate-800">
                    {String.fromCharCode(65 + i)}
                 </text>
              </g>
            ))}
          </svg>
          
          {/* Controls Overlay */}
          <div className="absolute right-4 top-4 flex flex-col gap-4">
             <div className="bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 w-48">
                <h3 className="font-bold text-slate-700 mb-2 border-b pb-1">Công cụ</h3>
                <div className="space-y-3">
                   
                   {/* Interactive Grid Toggle */}
                   <div 
                     onClick={() => setShowGrid(!showGrid)}
                     className="flex items-center gap-2 text-slate-600 text-sm cursor-pointer hover:text-teal-700 transition-colors select-none"
                   >
                      <div className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${
                        showGrid ? 'bg-teal-500 border-teal-500' : 'bg-white border-slate-400'
                      }`}>
                         {showGrid && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                      <span className="font-medium">Lưới ô vuông</span>
                   </div>

                   <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Move className="w-5 h-5 p-0.5 text-slate-500"/>
                      <span>Kéo thả điểm</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <div className="w-5 h-5 rounded-full bg-yellow-200 border border-yellow-600 flex items-center justify-center text-[10px] font-bold">A</div>
                      <span>Đỉnh hình</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Hint Overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-lg border border-slate-200 max-w-md">
             <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-teal-600"/>
                <span className="text-xs font-bold text-teal-600 uppercase">Mục tiêu:</span>
             </div>
             <div className="text-lg font-bold text-slate-800 mb-1">{target.label}</div>
             <div className="text-sm text-slate-500 italic border-t border-slate-100 pt-1 mt-1">{target.hint}</div>
          </div>

        </div>

        {/* Footer Controls */}
        <div className="bg-sky-100 p-4 border-t border-sky-200 flex justify-between items-center z-10">
            <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm ${
                feedback.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
                feedback.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                'bg-white text-slate-600 border border-slate-200'
            }`}>
              {feedback.type === 'success' ? <CheckCircle className="w-5 h-5"/> : null}
              {feedback.text}
            </div>

            <div className="flex gap-3">
               <button 
                 onClick={scramblePoints}
                 className="flex items-center gap-2 px-4 py-3 bg-white text-slate-600 rounded-xl hover:bg-slate-50 border border-slate-200 shadow-sm font-bold"
                 title="Reset vị trí"
               >
                 <RotateCcw className="w-5 h-5"/>
                 <span>Reset</span>
               </button>
               
               <button 
                 onClick={initLevel}
                 className="p-3 bg-white text-slate-600 rounded-xl hover:bg-slate-50 border border-slate-200 shadow-sm font-bold"
                 title="Bài mới"
               >
                 <RefreshCw className="w-5 h-5"/>
               </button>

               <button 
                 onClick={checkShape}
                 className="px-8 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-200 font-bold text-lg transition-transform active:scale-95 flex items-center gap-2"
               >
                 <span>Kiểm tra</span>
                 <CheckCircle className="w-5 h-5"/>
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShapeGame;