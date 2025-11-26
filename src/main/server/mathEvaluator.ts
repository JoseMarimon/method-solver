/**
 * Evaluador de expresiones matemáticas mejorado
 * Maneja funciones trigonométricas, exponenciales y otras funciones matemáticas
 */

/**
 * Preprocesa una expresión matemática para hacerla evaluable
 * @param expr - La expresión matemática como string
 * @returns La expresión procesada lista para ser evaluada
 */
export function preprocessExpression(expr: string): string {
  let processed = expr;

  // PRIMERO: Manejar funciones trigonométricas elevadas a potencias (sin^2(x), cos^3(x), etc.)
  // Convertir sin^2(x) -> (sin(x))^2
  const trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'sqrt', 'abs', 'exp'];
  
  // Función auxiliar para encontrar el paréntesis de cierre
  const findClosingParen = (str: string, startIdx: number): number => {
    let depth = 0;
    for (let i = startIdx; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  };
  
  // Procesar cada función
  trigFunctions.forEach(func => {
    let changed = true;
    while (changed) {
      changed = false;
      const regex = new RegExp(`\\b${func}\\^([\\d.]+)\\s*\\(`, 'g');
      let match;
      
      while ((match = regex.exec(processed)) !== null) {
        const exponent = match[1];
        const openParenIdx = match.index + match[0].length - 1;
        const closeParenIdx = findClosingParen(processed, openParenIdx);
        
        if (closeParenIdx !== -1) {
          const args = processed.substring(openParenIdx + 1, closeParenIdx);
          const before = processed.substring(0, match.index);
          const after = processed.substring(closeParenIdx + 1);
          processed = `${before}(${func}(${args}))^${exponent}${after}`;
          changed = true;
          break; // Reiniciar el bucle con el nuevo string
        }
      }
    }
  });

  // Reemplazar ^ con ** para exponenciación
  processed = processed.replace(/\^/g, '**');
  
  // SEGUNDO: Procesar logaritmos con marcadores temporales para evitar conflictos
  // Reemplazar ln(  por _NATURAL_LOG_(  
  processed = processed.replace(/\bln\s*\(/g, '_NATURAL_LOG_(');
  // Reemplazar log(  por _LOG_BASE_10_(  
  processed = processed.replace(/\blog\s*\(/g, '_LOG_BASE_10_(');
  
  // Agregar constantes matemáticas
  processed = processed.replace(/\b(PI|pi)\b/g, 'Math.PI');
  processed = processed.replace(/\be\b(?!xp)/g, 'Math.E');
  
  // Agregar Math. a las funciones matemáticas si no lo tienen
  const mathFunctions = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    'exp', 'expm1',
    'sqrt', 'cbrt',
    'abs', 'sign',
    'ceil', 'floor', 'round', 'trunc',
    'max', 'min',
    'pow'
  ];
  
  mathFunctions.forEach(func => {
    const regex = new RegExp(`(?<!Math\\.)\\b${func}\\b`, 'g');
    processed = processed.replace(regex, `Math.${func}`);
  });
  
  // Agregar multiplicación implícita donde sea necesario
  // IMPORTANTE: Hacer esto ANTES de reemplazar los marcadores temporales para evitar conflictos
  
  // Primero: número seguido de paréntesis (no precedido por operador, punto o guion bajo)
  // 2( -> 2*(, pero no -2( ni Math.function(
  processed = processed.replace(/(\d)\s*(\()(?![.a-zA-Z_])/g, '$1*$2');
  
  // Segundo: número seguido de letra (variable x), pero NO si hay un operador entre ellos
  // 2x -> 2*x, pero no 2*x (ya tiene operador) ni Math.xxx
  processed = processed.replace(/(\d)\s+([a-zA-Z])(?![a-zA-Z0-9._*+\-/])/g, '$1*$2');
  processed = processed.replace(/(\d)([a-zA-Z])(?![a-zA-Z0-9._*+\-/])/g, '$1*$2');
  
  // Tercero: paréntesis de cierre seguido de número, letra o paréntesis de apertura
  processed = processed.replace(/(\))(\d)/g, '$1*$2');  // )2 -> )*2
  processed = processed.replace(/(\))([a-zA-Z])(?![a-zA-Z0-9._])/g, '$1*$2');  // )x -> )*x, pero no )Math
  processed = processed.replace(/(\))(\()/g, '$1*$2');  // )( -> )*(
  
  // Convertir los marcadores temporales a las funciones correctas de JavaScript
  // Hacer esto AL FINAL para evitar que las reglas de multiplicación los afecten
  processed = processed.replace(/_NATURAL_LOG_/g, 'Math.log');
  processed = processed.replace(/_LOG_BASE_10_/g, 'Math.log10');
  
  // Limpiar múltiples asteriscos consecutivos que puedan haberse generado
  processed = processed.replace(/\*{2,}/g, '**'); // Mantener ** para exponenciación
  processed = processed.replace(/\*\*\*/g, '**'); // Eliminar *** -> **
  
  console.log('[mathEvaluator] Original:', expr);
  console.log('[mathEvaluator] Procesada:', processed);
  
  return processed;
}

/**
 * Evalúa una expresión matemática para un valor dado de x
 * @param expr - La expresión matemática como string
 * @param x - El valor de x
 * @returns El resultado de la evaluación
 */
export function evaluateExpression(expr: string, x: number): number {
  try {
    const processed = preprocessExpression(expr);
    
    // Crear una función que evalúa la expresión SIN usar with(Math)
    // para evitar conflictos con las funciones Math.log10, etc.
    // eslint-disable-next-line no-new-func
    const fn = new Function('x', 'Math', `
      try {
        return ${processed};
      } catch (e) {
        console.error('[mathEvaluator] Error en evaluación:', e);
        return NaN;
      }
    `);
    
    const result = fn(x, Math);
    
    // Verificar que el resultado sea un número válido
    if (typeof result !== 'number' || !isFinite(result)) {
      console.error('[mathEvaluator] Resultado inválido:', result, 'para x =', x);
      return NaN;
    }
    
    return result;
  } catch (error) {
    console.error(`[mathEvaluator] Error evaluando expresión "${expr}" con x=${x}:`, error);
    return NaN;
  }
}

/**
 * Valida si una expresión es válida
 * @param expr - La expresión a validar
 * @returns true si la expresión es válida, false en caso contrario
 */
export function validateExpression(expr: string): boolean {
  try {
    const processed = preprocessExpression(expr);
    // Intentar crear la función sin with(Math)
    // eslint-disable-next-line no-new-func
    new Function('x', 'Math', `return ${processed};`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Crea una función evaluable a partir de una expresión
 * @param expr - La expresión matemática como string
 * @returns Una función que toma x y devuelve el resultado
 */
export function createEvaluator(expr: string): (x: number) => number {
  const processed = preprocessExpression(expr);
  
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('x', 'Math', `
      try {
        return ${processed};
      } catch (e) {
        console.error('[mathEvaluator] Error en createEvaluator:', e);
        return NaN;
      }
    `);
    
    return (x: number) => {
      try {
        const result = fn(x, Math);
        if (typeof result === 'number' && isFinite(result)) {
          return result;
        }
        return NaN;
      } catch {
        return NaN;
      }
    };
  } catch (error) {
    console.error(`[mathEvaluator] Error creando evaluador para "${expr}":`, error);
    return () => NaN;
  }
}
