import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import './AppLayout.css';
import { useState, useEffect, useRef } from 'react';
import Graph from './components/Graph';
import { calculateTrapezoidal, TrapezoidalOutput } from '../main/server/Trapezoidal';
import { calculateBoole, BooleOutput } from '../main/server/Boole';
import { calculateSimpson, SimpsonOutput } from '../main/server/Simpson';
import { calculateSimpson13, Simpson13Output } from '../main/server/Simpson13';
import { calculateSimpsonAbierto, SimpsonAbiertoOutput } from '../main/server/SimpsonAbierto';
import { evaluateExpression, preprocessExpression } from '../main/server/mathEvaluator';

// Interfaz genérica para una iteración, ya que todas son iguales
interface Iteration {
  x: number;
  y: number;
}

// Convertir expresión matemática simple a LaTeX
function toLatex(expr: string): string {
  let latex = expr;
  
  // Remover Math. antes de las funciones
  latex = latex.replace(/Math\./g, '');
  
  // Funciones trigonométricas y matemáticas -> LaTeX
  const mathFuncs = [
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh',
    'log', 'ln', 'exp', 'sqrt'
  ];
  
  mathFuncs.forEach(func => {
    const regex = new RegExp(`\\b${func}\\b`, 'g');
    latex = latex.replace(regex, `\\${func}`);
  });
  
  // Exponenciación: x^2 -> x^{2}, x^(a+b) -> x^{a+b}
  latex = latex.replace(/\^(\d+)/g, '^{$1}');
  latex = latex.replace(/\^(\([^)]+\))/g, '^{$1}');
  latex = latex.replace(/\^([a-zA-Z])/g, '^{$1}');
  
  // Multiplicación: * -> \cdot (pero no en operaciones implícitas)
  latex = latex.replace(/\s*\*\s*/g, ' \\cdot ');
  
  return latex;
}

function Calculator() {
  const [funcStr, setFuncStr] = useState('sin(x)');
  const [a, setA] = useState('0');
  const [b, setB] = useState('3.14159');
  const [n, setN] = useState('12');
  const [method, setMethod] = useState('simpson13');
  
  const [result, setResult] = useState<number | null>(null);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [error, setError] = useState<string | null>(null);

  const graphRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Limpiar resultados cuando cambien los parámetros
  useEffect(() => {
    setResult(null);
    setIterations([]);
    setError(null);
  }, [funcStr, a, b, n, method]);

  const parseValue = (value: string): number => {
    if (!value) return NaN;
    
    let processedValue = value.trim().toLowerCase();
    
    // Replace 'pi' with Math.PI value
    processedValue = processedValue.replace(/\bpi\b/g, 'Math.PI');
    processedValue = processedValue.replace(/\be\b/g, 'Math.E');
    
    // Add Math. prefix to mathematical functions
    const mathFunctions = ['sqrt', 'cbrt', 'abs', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
                          'sinh', 'cosh', 'tanh', 'exp', 'log', 'log10', 'pow', 'ceil', 'floor', 'round'];
    
    mathFunctions.forEach(func => {
      const regex = new RegExp(`(?<!Math\\.)\\b${func}\\b`, 'g');
      processedValue = processedValue.replace(regex, `Math.${func}`);
    });
    
    // Handle log as log10
    processedValue = processedValue.replace(/\bMath\.log\b(?!\d)/g, 'Math.log10');
    
    // Evaluate expressions like '2*pi', 'pi/2', 'sqrt(3)', etc.
    try {
      // Allow numbers, operators, parentheses, dots, letters (for Math functions), and whitespace
      if (/[^0-9+\-*/().a-zA-Z\s]/g.test(processedValue)) {
        return NaN;
      }
      // Additional security: ensure it only contains Math. prefixed functions
      if (!/^[\d+\-*/().\s]*$/.test(processedValue) && !/Math\./i.test(processedValue)) {
        return NaN;
      }
      // Use Function constructor to safely evaluate mathematical expressions
      return Function(`'use strict'; return (${processedValue})`)();
    } catch {
      return NaN;
    }
  };

  const handleCalculate = () => {
    setResult(null);
    setIterations([]);
    setError(null);

    try {
      const numN = parseInt(n, 10);
      const numA = parseValue(a);
      const numB = parseValue(b);


      if (isNaN(numN) || isNaN(numA) || isNaN(numB)) {
        setError('Por favor, introduce un valor numérico válido para n.');
        return;
      }
      let output: TrapezoidalOutput | BooleOutput | SimpsonOutput | Simpson13Output | SimpsonAbiertoOutput;

      const input = {
        funcStr,
        a: numA,  // Enviar como string
        b: numB,  // Enviar como string
        n: numN,
      };

      switch (method) {
        case 'trapezoidal':
          output = calculateTrapezoidal(input);
          break;
        case 'boole':
          output = calculateBoole(input);
          break;
        case 'simpson':
          output = calculateSimpson(input);
          break;
        case 'simpson13':
          output = calculateSimpson13(input);
          break;
        case 'simpsonAbierto':
          output = calculateSimpsonAbierto(input);
          break;
        default:
          throw new Error('Método de integración no reconocido.');
      }

      setResult(output.integral);
      setIterations(output.iterations);

      // Auto-scroll to graph after a short delay
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);

    } catch (e: any) {
      setError(e.message);
    }
  };

  // Evaluar a y b como expresiones matemáticas
  const getNumericValue = (expr: string): number => {
    try {
      // Intentar convertir directamente a número
      const num = parseFloat(expr);
      if (!isNaN(num)) return num;
      
      // Si no es un número, evaluar como expresión
      const processed = preprocessExpression(expr);
      console.log(`[App] Evaluando límite: "${expr}" -> procesado: "${processed}"`);
      const result = evaluateExpression(processed, 0);
      console.log(`[App] Resultado: ${result}`);
      return result;
    } catch (e) {
      console.error('[App] Error al evaluar:', e);
      return NaN;
    }
  };

  const parsedA = getNumericValue(a);
  const parsedB = getNumericValue(b);

  return (
    <div className="app-layout">
      <div className="app-container">
        <div className="app-header">
          <div className="app-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#logo-gradient)"/>
              <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 18H21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <defs>
                <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="app-title">
              <h1>Method Solver</h1>
              <span className="app-subtitle">Métodos de Aproximación Numérica</span>
            </div>
          </div>
        </div>

        <div className="calculator-card">
          <h2 className="card-title">Configuración del Problema</h2>
          
          <div className='control'>
            <label>
              Método de Integración
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="trapezoidal">🔷 Trapezoidal</option>
                <option value="boole">🟠 Boole</option>
                <option value="simpson">🟣 Simpson 3/8</option>
                <option value="simpson13">🔵 Simpson 1/3</option>
                <option value="simpsonAbierto">🟢 Simpson Abierto</option>
              </select>
            </label>
          </div>

          <div className='control'>
            <label>
              Función f(x)
              <input
                type="text"
                placeholder="Ej: sin(x), x^2, cos(x)*x, tan(x)"
                value={funcStr}
                onChange={(e) => setFuncStr(e.target.value)}
              />
            </label>
          </div>

          <div className='control-inline'>
            <label>
              Límite inferior (a)
              <input 
                type="text" 
                placeholder="Ej: 0, pi, sqrt(2)" 
                value={a} 
                onChange={(e) => setA(e.target.value)} 
              />
            </label>
            <label>
              Límite superior (b)
              <input 
                type="text" 
                placeholder="Ej: 1, 2*pi, e" 
                value={b} 
                onChange={(e) => setB(e.target.value)} 
              />
            </label>
          </div>

          <div className='control'>
            <label>
              Número de subintervalos (n)
              <input type="number" value={n} onChange={(e) => setN(e.target.value)} />
            </label>
          </div>

          <div className='control'>
            <button className='btn-primary' onClick={handleCalculate}>
              <span className="btn-icon">∫</span>
              Calcular Integral
            </button>
          </div>

          {result !== null && (
            <div className='result'>
              <div className="result-label">Resultado de la Integral:</div>
              <div className="result-value">{result.toFixed(10)}</div>
            </div>
          )}
          
          {error && <div className='error'>⚠️ Error: {error}</div>}
        </div>

        {iterations.length > 0 && (
          <>
            <div className="graph-section" ref={graphRef}>
              <Graph 
                funcStr={funcStr} 
                funcLatex={toLatex(funcStr)}
                a={isNaN(parsedA) ? 0 : parsedA} 
                b={isNaN(parsedB) ? 1 : parsedB} 
                iterations={iterations} 
                method={method} 
              />
            </div>

            <div className='iterations-section' ref={tableRef}>
              <h3>Tabla de Iteraciones</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Índice</th>
                      <th>x</th>
                      <th>f(x)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iterations.map((iter, index) => (
                      <tr key={index}>
                        <td>{index}</td>
                        <td>{iter.x.toFixed(10)}</td>
                        <td>{iter.y.toFixed(10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Calculator />} />
      </Routes>
    </Router>
  );
}
