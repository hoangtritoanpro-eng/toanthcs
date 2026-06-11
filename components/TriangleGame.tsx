import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Info, MousePointer2, Move, Spline, Circle, Triangle, Check, RefreshCw } from 'lucide-react';

interface TriangleGameProps {
  onBack: () => void;
}

interface Point {
  x: number;
  y: number;
}

type TabType = 'MEDIAN' | 'BISECTOR' | 'ALTITUDE' | 'PERPENDICULAR';

// --- Math Helpers ---
const distance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

const midpoint = (p1: Point, p2: Point): Point => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2
});

// Project point P onto line segment AB (extended)
const projectPointToLine = (p: Point, a: Point, b: Point): Point => {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: p.x - a.x, y: p.y - a.y };
  const t = (ap.x * ab.x + ap.y * ab.y) / (ab.x * ab.x + ab.y * ab.y);
  return { x: a.x + t * ab.x, y: a.y + t * ab.y };
};

// Calculate Incenter (Tâm nội tiếp)
const getIncenter = (A: Point, B: Point, C: Point) => {
  const a = distance(B, C);
  const b = distance(A, C);
  const c = distance(A, B);
  const p = a + b + c;
  return {
    x: (a * A.x + b * B.x + c * C.x) / p,
    y: (a * A.y + b * B.y + c * C.y) / p
  };
};

// Calculate Circumcenter (Tâm ngoại tiếp)
const getCircumcenter = (A: Point, B: Point, C: Point) => {
  const D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const Ux = (1 / D) * ((A.x * A.x + A.y * A.y) * (B.y - C.y) + (B.x * B.x + B.y * B.y) * (C.y - A.y) + (C.x * C.x + C.y * C.y) * (A.y - B.y));
  const Uy = (1 / D) * ((A.x * A.x + A.y * A.y) * (C.x - B.x) + (B.x * B.x + B.y * B.y) * (A.x - C.x) + (C.x * C.x + C.y * C.y) * (B.x - A.x));
  return { x: Ux, y: Uy };
};

// Intersection of two lines
const getIntersection = (A: Point, B: Point, C: Point, D: Point): Point | null => {
  const a1 = B.y - A.y;
  const b1 = A.x - B.x;
  const c1 = a1 * A.x + b1 * A.y;

  const a2 = D.y - C.y;
  const b2 = C.x - D.x;
  const c2 = a2 * C.x + b2 * C.y;

  const det = a1 * b2 - a2 * b1;
  if (det === 0) return null; // Parallel

  return {
    x: (b2 * c1 - b1 * c2) / det,
    y: (a1 * c2 - a2 * c1) / det
  };
};

// MathJax Component
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

const TriangleGame: React.FC<TriangleGameProps> = ({ onBack }) => {
  const [points, setPoints] = useState<{A: Point, B: Point, C: Point}>({
    A: { x: 400, y: 100 },
    B: { x: 200, y: 400 },
    C: { x: 600, y: 400 }
  });
  const [activeTab, setActiveTab] = useState<TabType>('MEDIAN');
  const [draggingPoint, setDraggingPoint] = useState<keyof typeof points | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // --- Geometry Calculations ---
  const { A, B, C } = points;
  
  // Midpoints
  const M_bc = midpoint(B, C);
  const M_ac = midpoint(A, C);
  const M_ab = midpoint(A, B);

  // Centroid (G)
  const G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };

  // Incenter (I)
  const I = getIncenter(A, B, C);
  // Radius of Incircle (Area / semi-perimeter)
  const aLen = distance(B, C);
  const bLen = distance(A, C);
  const cLen = distance(A, B);
  const s = (aLen + bLen + cLen) / 2;
  const area = Math.sqrt(s * (s - aLen) * (s - bLen) * (s - cLen));
  const rIn = area / s;

  // Feet of Altitudes
  const H_a = projectPointToLine(A, B, C);
  const H_b = projectPointToLine(B, A, C);
  const H_c = projectPointToLine(C, A, B);
  
  // Orthocenter (H) - Intersection of two altitudes
  const H = getIntersection(A, H_a, B, H_b) || {x:0, y:0};

  // Circumcenter (O)
  const O = getCircumcenter(A, B, C);
  const ROut = distance(O, A);

  // --- Interaction Handlers ---
  const handleMouseDown = (key: keyof typeof points, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDraggingPoint(key);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingPoint || !svgRef.current) return;

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
      
      // Simple bounds checking (keep within SVG)
      const padding = 20;
      const newX = Math.max(padding, Math.min(800 - padding, x));
      const newY = Math.max(padding, Math.min(500 - padding, y));

      setPoints(prev => ({ ...prev, [draggingPoint]: { x: newX, y: newY } }));
    }
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
  };

  const resetTriangle = () => {
    setPoints({
        A: { x: 400, y: 100 },
        B: { x: 200, y: 400 },
        C: { x: 600, y: 400 }
    });
  };

  // --- Rendering Helpers ---
  const renderPoint = (p: Point, label: string, color: string = "#0f766e", showDot = true) => (
    <g>
      {showDot && <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="2" />}
      <text x={p.x + 8} y={p.y - 8} className="text-sm font-bold fill-slate-700 pointer-events-none" style={{textShadow: '0px 0px 4px white'}}>{label}</text>
    </g>
  );

  const renderDraggable = (p: Point, label: string, pKey: keyof typeof points) => (
     <g 
       className="cursor-move hover:opacity-80 transition-opacity"
       onMouseDown={(e) => handleMouseDown(pKey, e)}
       onTouchStart={(e) => handleMouseDown(pKey, e)}
     >
       <circle cx={p.x} cy={p.y} r="20" fill="transparent" /> {/* Hit area */}
       <circle cx={p.x} cy={p.y} r="8" fill="#14b8a6" stroke="white" strokeWidth="2" className="drop-shadow-md" />
       <text x={p.x} y={p.y - 15} textAnchor="middle" className="text-lg font-bold fill-teal-900 pointer-events-none" style={{textShadow: '0px 0px 4px white'}}>{label}</text>
     </g>
  );

  // Content for Info Panel
  const getTabInfo = () => {
    switch (activeTab) {
        case 'MEDIAN': return {
            title: 'Đường Trung Tuyến',
            icon: <Spline className="w-5 h-5"/>,
            desc: "Đường trung tuyến xuất phát từ đỉnh và đi qua trung điểm cạnh đối diện.",
            math: `Ba đường trung tuyến cắt nhau tại **Trọng tâm (G)**. \\( GA = \\frac{2}{3}AM_a \\).`,
            color: "stroke-blue-500"
        };
        case 'BISECTOR': return {
            title: 'Đường Phân Giác',
            icon: <Circle className="w-5 h-5"/>,
            desc: "Đường phân giác chia góc ở đỉnh thành 2 góc bằng nhau.",
            math: `Ba đường phân giác cắt nhau tại **Tâm đường tròn nội tiếp (I)**. $I$ cách đều 3 cạnh.`,
            color: "stroke-amber-500"
        };
        case 'ALTITUDE': return {
            title: 'Đường Cao',
            icon: <Triangle className="w-5 h-5"/>,
            desc: "Đường cao xuất phát từ đỉnh và vuông góc với cạnh đối diện.",
            math: `Ba đường cao cắt nhau tại **Trực tâm (H)**.`,
            color: "stroke-red-500"
        };
        case 'PERPENDICULAR': return {
            title: 'Đường Trung Trực',
            icon: <Move className="w-5 h-5"/>,
            desc: "Đường trung trực vuông góc với cạnh tại trung điểm.",
            math: `Ba đường trung trực cắt nhau tại **Tâm đường tròn ngoại tiếp (O)**. $OA=OB=OC$.`,
            color: "stroke-purple-500"
        };
    }
  };
  const info = getTabInfo();

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 animate-fade-in select-none">
       {/* Header */}
       <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="flex items-center text-teal-700 hover:text-teal-900 font-bold px-3 py-2 rounded-lg hover:bg-teal-50">
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span>Quay lại</span>
        </button>
        <h2 className="text-xl font-bold text-slate-800 hidden md:block">Các đường đồng quy trong tam giác</h2>
        <button onClick={resetTriangle} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-bold">
            <RefreshCw className="w-4 h-4"/> Reset hình
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* SVG Canvas Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-teal-100 relative overflow-hidden" style={{ minHeight: '500px' }}>
           {/* Tab selector overlay */}
           <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 justify-center z-10 pointer-events-none">
              {(['MEDIAN', 'BISECTOR', 'ALTITUDE', 'PERPENDICULAR'] as TabType[]).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pointer-events-auto px-3 py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm transition-all border ${
                        activeTab === tab 
                        ? 'bg-teal-600 text-white border-teal-700 scale-105' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'MEDIAN' && 'Trung tuyến'}
                    {tab === 'BISECTOR' && 'Phân giác'}
                    {tab === 'ALTITUDE' && 'Đường cao'}
                    {tab === 'PERPENDICULAR' && 'Trung trực'}
                  </button>
              ))}
           </div>

           <svg 
             ref={svgRef}
             viewBox="0 0 800 500" 
             className="w-full h-full bg-slate-50 cursor-crosshair touch-none"
             onMouseMove={handleMouseMove}
             onTouchMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onTouchEnd={handleMouseUp}
             onMouseLeave={handleMouseUp}
           >
              {/* Grid Background */}
              <defs>
                 <pattern id="gridTri" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                 </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridTri)" />

              {/* Special Lines Layer */}
              <g className="opacity-80">
                 {activeTab === 'MEDIAN' && (
                     <>
                        <line x1={A.x} y1={A.y} x2={M_bc.x} y2={M_bc.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5"/>
                        <line x1={B.x} y1={B.y} x2={M_ac.x} y2={M_ac.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5"/>
                        <line x1={C.x} y1={C.y} x2={M_ab.x} y2={M_ab.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5"/>
                        {renderPoint(M_bc, "M_a", "#94a3b8", true)}
                        {renderPoint(M_ac, "M_b", "#94a3b8", true)}
                        {renderPoint(M_ab, "M_c", "#94a3b8", true)}
                        {renderPoint(G, "G (Trọng tâm)", "#2563eb")}
                     </>
                 )}

                {activeTab === 'BISECTOR' && (
                     <>
                        {/* Draw rays from vertices to Incenter and slightly beyond - Simplified just draw to edge intersection for now or simpler visual: Vertex to Incenter */}
                        {/* Better: Vertex to Intersection on opposite side */}
                        {/* Calculating actual intersection point on BC for bisector A */}
                        {/* Using vector A -> I extended. Let's just draw A->I, B->I, C->I extended */}
                         <line x1={A.x} y1={A.y} x2={I.x + (I.x-A.x)*10} y2={I.y + (I.y-A.y)*10} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" clipPath="url(#triClip)"/>
                         <line x1={B.x} y1={B.y} x2={I.x + (I.x-B.x)*10} y2={I.y + (I.y-B.y)*10} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" clipPath="url(#triClip)"/>
                         <line x1={C.x} y1={C.y} x2={I.x + (I.x-C.x)*10} y2={I.y + (I.y-C.y)*10} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,4" clipPath="url(#triClip)"/>
                         
                         {/* Clip path definition for lines to stay inside triangle? No, bisectors go to edge. */}
                         {/* Let's simplify: Draw circle first */}
                         <circle cx={I.x} cy={I.y} r={rIn} fill="rgba(251, 191, 36, 0.2)" stroke="#d97706" strokeWidth="2" />
                         {renderPoint(I, "I (Nội tiếp)", "#d97706")}
                     </>
                 )}

                 {activeTab === 'ALTITUDE' && (
                     <>
                        <line x1={A.x} y1={A.y} x2={H_a.x} y2={H_a.y} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5"/>
                        <line x1={B.x} y1={B.y} x2={H_b.x} y2={H_b.y} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5"/>
                        <line x1={C.x} y1={C.y} x2={H_c.x} y2={H_c.y} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5"/>
                        {/* Extensions for obtuse triangles */}
                        <line x1={H_a.x} y1={H_a.y} x2={H.x} y2={H.y} stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"/>
                        <line x1={H_b.x} y1={H_b.y} x2={H.x} y2={H.y} stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"/>
                        <line x1={H_c.x} y1={H_c.y} x2={H.x} y2={H.y} stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"/>
                        
                        {renderPoint(H, "H (Trực tâm)", "#dc2626")}
                     </>
                 )}

                 {activeTab === 'PERPENDICULAR' && (
                     <>
                        {/* Perpendicular Bisectors */}
                        {/* Draw line from Midpoint to Circumcenter O */}
                        <line x1={M_bc.x} y1={M_bc.y} x2={O.x} y2={O.y} stroke="#a855f7" strokeWidth="2" />
                        <line x1={M_ac.x} y1={M_ac.y} x2={O.x} y2={O.y} stroke="#a855f7" strokeWidth="2" />
                        <line x1={M_ab.x} y1={M_ab.y} x2={O.x} y2={O.y} stroke="#a855f7" strokeWidth="2" />
                        
                        <circle cx={O.x} cy={O.y} r={ROut} fill="none" stroke="#9333ea" strokeWidth="2" strokeDasharray="8,4" opacity="0.6"/>
                        {renderPoint(O, "O (Ngoại tiếp)", "#7e22ce")}
                        {renderPoint(M_bc, "", "#a855f7", true)}
                        {renderPoint(M_ac, "", "#a855f7", true)}
                        {renderPoint(M_ab, "", "#a855f7", true)}
                     </>
                 )}
              </g>

              {/* Triangle Main Shape */}
              <polygon 
                points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} 
                fill="none" 
                stroke="#0f766e" 
                strokeWidth="3" 
                strokeLinejoin="round"
              />

              {/* Vertices (Draggable) */}
              {renderDraggable(A, "A", "A")}
              {renderDraggable(B, "B", "B")}
              {renderDraggable(C, "C", "C")}

           </svg>
           
           <div className="absolute bottom-2 right-2 text-xs text-slate-400 pointer-events-none">
              Kéo thả các đỉnh để thay đổi hình
           </div>
        </div>

        {/* Info Sidebar */}
        <div className="lg:w-80 flex flex-col gap-4">
            <div className={`bg-white p-5 rounded-xl shadow-lg border-l-4 transition-colors ${
                activeTab === 'MEDIAN' ? 'border-blue-500' :
                activeTab === 'BISECTOR' ? 'border-amber-500' :
                activeTab === 'ALTITUDE' ? 'border-red-500' :
                'border-purple-500'
            }`}>
               <div className="flex items-center gap-2 mb-3">
                   <div className={`p-2 rounded-lg bg-slate-100 ${
                       activeTab === 'MEDIAN' ? 'text-blue-600' :
                       activeTab === 'BISECTOR' ? 'text-amber-600' :
                       activeTab === 'ALTITUDE' ? 'text-red-600' :
                       'text-purple-600'
                   }`}>
                       {info.icon}
                   </div>
                   <h3 className="text-lg font-bold text-slate-800">{info.title}</h3>
               </div>
               
               <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                   {info.desc}
               </p>

               <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <div className="text-xs font-bold text-slate-500 uppercase mb-1">Tính chất</div>
                   <div className="text-sm font-bold text-slate-800">
                       <MathMessage text={info.math} />
                   </div>
               </div>
            </div>

            {/* Quick Check / Quiz Placeholder (Optional for future) */}
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
               <div className="flex items-center gap-2 text-teal-800 font-bold mb-2">
                  <Info className="w-4 h-4"/>
                  <span>Ghi nhớ</span>
               </div>
               <ul className="text-sm text-teal-700 space-y-2 list-disc pl-4">
                  {activeTab === 'MEDIAN' && <li>Trọng tâm luôn nằm trong tam giác.</li>}
                  {activeTab === 'ALTITUDE' && <li>Trực tâm có thể nằm ngoài tam giác (nếu tam giác tù).</li>}
                  {activeTab === 'PERPENDICULAR' && <li>Tâm ngoại tiếp nằm trên cạnh huyền nếu là tam giác vuông.</li>}
                  {activeTab === 'BISECTOR' && <li>Tâm nội tiếp luôn cách đều 3 cạnh của tam giác.</li>}
               </ul>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TriangleGame;