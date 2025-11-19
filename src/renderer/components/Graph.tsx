import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { createEvaluator } from '../../main/server/mathEvaluator';

interface Iteration {
  x: number;
  y: number;
}

interface Props {
  funcStr: string;
  funcLatex?: string;
  a: number;
  b: number;
  iterations: Iteration[];
  method: string;
}

const Graph: React.FC<Props> = ({ funcStr, funcLatex, a, b, iterations, method }) => {
  // Trigger MathJax typesetting when content changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax) {
      (window as any).MathJax.typesetPromise?.().catch((err: any) => console.log('MathJax error:', err));
    }
  }, [funcStr, funcLatex]);

  const { chartData, yDomain } = useMemo(() => {
    const f = createEvaluator(funcStr);
    const SAMPLE = 200;
    const functionData: Array<{ x: number; fx: number; approx?: number }> = [];
    
    let minY = Infinity;
    let maxY = -Infinity;

    // Generate smooth function curve
    for (let i = 0; i <= SAMPLE; i++) {
      const t = i / SAMPLE;
      const x = a + (b - a) * t;
      const fx = f(x);
      const fxValue = Number(fx.toFixed(6));
      
      if (isFinite(fxValue)) {
        minY = Math.min(minY, fxValue);
        maxY = Math.max(maxY, fxValue);
      }
      
      functionData.push({ x: Number(x.toFixed(6)), fx: fxValue });
    }

    // Add ALL iteration points to the data
    if (iterations.length > 0) {
      // Create a map of existing x values to avoid duplicates
      const existingX = new Set(functionData.map(p => p.x));
      
      iterations.forEach(it => {
        const x = Number(it.x.toFixed(6));
        const y = Number(it.y.toFixed(6));
        
        if (isFinite(y)) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        
        if (existingX.has(x)) {
          // If point exists in function data, add approx value
          const point = functionData.find(p => p.x === x);
          if (point) point.approx = y;
        } else {
          // If point doesn't exist, add it with both fx and approx
          functionData.push({ x, fx: y, approx: y });
        }
      });
      
      // Sort by x to maintain order
      functionData.sort((a, b) => a.x - b.x);
    }

    // Calculate Y domain with padding
    const yRange = maxY - minY;
    const yPadding = yRange * 0.1; // 10% padding
    const calculatedYDomain = [
      minY - yPadding,
      maxY + yPadding
    ];

    return { chartData: functionData, yDomain: calculatedYDomain };
  }, [funcStr, a, b, iterations]);

  const methodColors: Record<string, string> = {
    trapezoidal: '#3b82f6',
    boole: '#f59e0b',
    simpson: '#8b5cf6',
    simpson13: '#06b6d4',
    simpsonAbierto: '#10b981',
  };

  const methodNames: Record<string, string> = {
    trapezoidal: 'Trapezoidal',
    boole: 'Boole',
    simpson: 'Simpson 3/8',
    simpson13: 'Simpson 1/3',
    simpsonAbierto: 'Simpson Abierto',
  };

  const primaryColor = methodColors[method] || '#ef4444';

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h3>Visualización: {methodNames[method]}</h3>
        <p className="graph-subtitle">
          {funcLatex ? (
            <>
              f(x) = <span className="latex-inline">{`\\(${funcLatex}\\)`}</span> en [{a.toFixed(2)}, {b.toFixed(2)}]
            </>
          ) : (
            <>
              f(x) = <code>{funcStr}</code> en [{a.toFixed(2)}, {b.toFixed(2)}]
            </>
          )}
        </p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id={`gradient-${method}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={primaryColor} stopOpacity={0.05} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            stroke="rgba(148, 163, 184, 0.3)"
            label={{ value: 'x', position: 'insideBottom', offset: -10, style: { fill: '#cbd5e1', fontWeight: 600 } }}
            allowDataOverflow={false}
          />
          <YAxis
            type="number"
            domain={yDomain}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            stroke="rgba(148, 163, 184, 0.3)"
            label={{ value: 'f(x)', angle: -90, position: 'insideLeft', style: { fill: '#cbd5e1', fontWeight: 600 } }}
            allowDataOverflow={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              padding: '12px 16px',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '8px' }}
            itemStyle={{ color: '#cbd5e1', padding: '4px 0' }}
            formatter={(value: any) => {
              if (typeof value === 'number' && isFinite(value)) {
                return [value.toFixed(6), ''];
              }
              return [value, ''];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '24px' }}
            iconType="line"
            formatter={(value) => <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{value}</span>}
          />
          {/* Eje Y (línea vertical en x=0) - solo si 0 está en el rango */}
          {a <= 0 && b >= 0 && (
            <ReferenceLine x={0} stroke="rgba(203, 213, 225, 0.3)" strokeWidth={1.5} />
          )}
          {/* Eje X (línea horizontal en y=0) - siempre visible */}
          <ReferenceLine y={0} stroke="rgba(203, 213, 225, 0.3)" strokeWidth={1.5} />
          
          {/* Area under curve with gradient */}
          <Area
            type="monotone"
            dataKey="fx"
            fill={`url(#gradient-${method})`}
            stroke="none"
            name="Área"
            isAnimationActive={true}
            animationDuration={1000}
          />
          
          {/* Function curve with glow */}
          <Line
            type="monotone"
            dataKey="fx"
            stroke={primaryColor}
            strokeWidth={3}
            dot={false}
            name="f(x)"
            isAnimationActive={true}
            animationDuration={1000}
            filter="url(#glow)"
          />
          
          {/* Approximation line - only render when we have calculated points */}
          {iterations.length > 0 && (
            <Line
              type="linear"
              dataKey="approx"
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ fill: '#ec4899', r: 6, strokeWidth: 2, stroke: '#1e293b' }}
              name="Aproximación"
              isAnimationActive={true}
              animationDuration={1200}
              connectNulls={false}
              filter="url(#glow)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Graph;
