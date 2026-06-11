import React, { useMemo } from 'react';

interface FractionVisualProps {
  numerator: number;
  denominator: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onPartClick?: (index: number) => void;
  selectedParts?: number; // Visual override for simple highlighting
}

const FractionVisual: React.FC<FractionVisualProps> = ({
  numerator,
  denominator,
  size = 200,
  color = "fill-teal-500",
  interactive = false,
  onPartClick,
  selectedParts
}) => {
  const center = size / 2;
  const radius = (size / 2) - 5; // Padding

  // Helper to calculate coordinates
  const getCoordinatesForPercent = (percent: number) => {
    const x = center + radius * Math.cos(2 * Math.PI * percent);
    const y = center + radius * Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = useMemo(() => {
    const sliceArray = [];
    const validDenominator = Math.max(1, denominator);
    
    // For single whole circle (denominator 1)
    if (validDenominator === 1) {
       return [{
         path: `M ${center}, ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} L ${center} ${center} Z`,
         filled: numerator >= 1,
         index: 0
       }];
    }

    for (let i = 0; i < validDenominator; i++) {
      const startPercent = i / validDenominator;
      const endPercent = (i + 1) / validDenominator;

      // Rotate -90deg (start at 12 o'clock)
      const startX = center + radius * Math.cos(2 * Math.PI * startPercent - Math.PI / 2);
      const startY = center + radius * Math.sin(2 * Math.PI * startPercent - Math.PI / 2);
      const endX = center + radius * Math.cos(2 * Math.PI * endPercent - Math.PI / 2);
      const endY = center + radius * Math.sin(2 * Math.PI * endPercent - Math.PI / 2);

      const largeArcFlag = 1 / validDenominator > 0.5 ? 1 : 0;

      const pathData = [
        `M ${center} ${center}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `Z`
      ].join(' ');

      // Determined if this slice should be filled
      // If interactive, use selectedParts logic if simpler, or just raw index check
      // Here: if denominator is 4 and numerator is 3, fill indices 0, 1, 2.
      const isFilled = i < (selectedParts ?? numerator);

      sliceArray.push({ path: pathData, filled: isFilled, index: i });
    }
    return sliceArray;
  }, [numerator, denominator, center, radius, selectedParts]);

  return (
    <svg width={size} height={size} className="drop-shadow-md transition-all duration-300">
      <circle cx={center} cy={center} r={radius} fill="white" stroke="#cbd5e1" strokeWidth="2" />
      {slices.map((slice, idx) => (
        <path
          key={idx}
          d={slice.path}
          className={`
            stroke-white stroke-[2px] transition-all duration-300
            ${slice.filled ? color : 'fill-transparent hover:fill-teal-100'}
            ${interactive ? 'cursor-pointer' : ''}
          `}
          onClick={() => interactive && onPartClick && onPartClick(idx)}
        />
      ))}
      {/* Label in center (optional, maybe distracting) */}
      {/* <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-xl font-bold fill-slate-700 pointer-events-none">
        {numerator}/{denominator}
      </text> */}
    </svg>
  );
};

export default FractionVisual;