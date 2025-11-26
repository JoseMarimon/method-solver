import { evaluateExpression, preprocessExpression } from './mathEvaluator';

interface SimpsonInput {
    funcStr: string; // La función como texto
    a: string | number;       // Límite inferior de integración (puede ser expresión)
    b: string | number;       // Límite superior de integración (puede ser expresión)
    n: number;       // Número de subintervalos (debe ser múltiplo de 3)
}

// Define la estructura de cada punto de iteración
export interface SimpsonIteration {
    x: number;
    y: number;
}

// Define la nueva estructura del valor de retorno
export interface SimpsonOutput {
    integral: number;
    iterations: SimpsonIteration[];
}

const calculateSimpson = ({ funcStr, a, b, n }: SimpsonInput): SimpsonOutput => {
    if (n <= 0 || n % 3 !== 0) {
        throw new Error("El número de subintervalos (n) debe ser un múltiplo de 3 positivo.");
    }

    // Evaluar a y b si son expresiones
    const aVal = typeof a === 'string' ? evaluateExpression(preprocessExpression(a), 0) : a;
    const bVal = typeof b === 'string' ? evaluateExpression(preprocessExpression(b), 0) : b;
    
    if (isNaN(aVal) || isNaN(bVal)) {
        throw new Error(`Límites inválidos: a=${a} -> ${aVal}, b=${b} -> ${bVal}`);
    }

    const h = (bVal - aVal) / n;
    const iterations: SimpsonIteration[] = [];
    let sum = 0;

    // Función para evaluar f(x) en un punto dado
    const f = (x: number): number => {
        return evaluateExpression(funcStr, x);
    };

    for (let i = 0; i <= n; i++) {
        const x_i = aVal + i * h;
        const y_i = f(x_i);
        iterations.push({ x: x_i, y: y_i });

        // Aplicar coeficientes de Simpson 3/8
        if (i === 0 || i === n) {
            sum += y_i; // Coeficiente 1 para los extremos
        } else if (i % 3 === 0) {
            sum += 2 * y_i; // Coeficiente 2 para los múltiplos de 3
        } else {
            sum += 3 * y_i; // Coeficiente 3 para los demás
        }
    }

    const integral = ((3 * h) / 8) * sum;
    
    return { integral, iterations };
};

export { calculateSimpson, SimpsonInput };