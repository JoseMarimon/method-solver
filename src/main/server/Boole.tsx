import { evaluateExpression, preprocessExpression } from './mathEvaluator';

interface BooleInput {
    funcStr: string; // La función como texto
    a: string | number;       // Límite inferior de integración (puede ser expresión)
    b: string | number;       // Límite superior de integración (puede ser expresión)
    n: number;       // Número de subintervalos (debe ser múltiplo de 4)
}

// Define la estructura de cada punto de iteración
export interface BooleIteration {
    x: number;
    y: number;
}

// Define la nueva estructura del valor de retorno
export interface BooleOutput {
    integral: number;
    iterations: BooleIteration[];
}

const calculateBoole = ({ funcStr, a, b, n }: BooleInput): BooleOutput => {
    if (n <= 0 || n % 4 !== 0) {
        throw new Error("El número de subintervalos (n) debe ser un múltiplo de 4 positivo.");
    }

    // Evaluar a y b si son expresiones
    const aVal = typeof a === 'string' ? evaluateExpression(preprocessExpression(a), 0) : a;
    const bVal = typeof b === 'string' ? evaluateExpression(preprocessExpression(b), 0) : b;
    
    if (isNaN(aVal) || isNaN(bVal)) {
        throw new Error(`Límites inválidos: a=${a} -> ${aVal}, b=${b} -> ${bVal}`);
    }

    const h = (bVal - aVal) / n;
    const iterations: BooleIteration[] = [];
    let sum = 0;

    // Función para evaluar f(x) en un punto dado
    const f = (x: number): number => {
        return evaluateExpression(funcStr, x);
    };

    // Regla compuesta extendida
    for (let i = 0; i <= n; i++) {
        const x_i = aVal + i * h;
        const y_i = f(x_i);
        iterations.push({ x: x_i, y: y_i });

        if (i === 0 || i === n) {
            sum += 7 * y_i; // Extremos
        } else if (i % 4 === 2) {
            sum += 12 * y_i; // Términos f(x_2), f(x_6), ...
        } else if (i % 4 === 0) {
            sum += 14 * y_i; // Puntos de unión f(x_4), f(x_8), ...
        } else {
            sum += 32 * y_i; // Resto de términos
        }
    }

    const integral = ((2 * h) / 45) * sum;
    
    return { integral, iterations };
};

export { calculateBoole, BooleInput };