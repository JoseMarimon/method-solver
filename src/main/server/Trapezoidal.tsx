import { evaluateExpression, preprocessExpression } from './mathEvaluator';

interface TrapezoidalInput {
    funcStr: string; // La función como texto
    a: string | number;       // Límite inferior de integración (puede ser expresión)
    b: string | number;       // Límite superior de integración (puede ser expresión)
    n: number;       // Número de subintervalos
}

// Define la estructura de cada punto de iteración
export interface TrapezoidalIteration {
    x: number;
    y: number;
}

// Define la nueva estructura del valor de retorno
export interface TrapezoidalOutput {
    integral: number;
    iterations: TrapezoidalIteration[];
}

const calculateTrapezoidal = ({ funcStr, a, b, n }: TrapezoidalInput): TrapezoidalOutput => {

    if (n <= 0) {
        throw new Error("El número de trapecios (n) debe ser un entero positivo.");
    }

    // Evaluar a y b si son expresiones
    const aVal = typeof a === 'string' ? evaluateExpression(preprocessExpression(a), 0) : a;
    const bVal = typeof b === 'string' ? evaluateExpression(preprocessExpression(b), 0) : b;
    
    if (isNaN(aVal) || isNaN(bVal)) {
        throw new Error(`Límites inválidos: a=${a} -> ${aVal}, b=${b} -> ${bVal}`);
    }

    const h = (bVal - aVal) / n;
    const iterations: TrapezoidalIteration[] = [];
    let sum = 0;

    // Función para evaluar f(x) en un punto dado
    const f = (x: number): number => {
        return evaluateExpression(funcStr, x);
    };

    for (let i = 0; i <= n; i++) {
        const x_i = aVal + i * h;
        const y_i = f(x_i);
        iterations.push({ x: x_i, y: y_i });

        if (i === 0 || i === n) {
            sum += y_i; // Coeficiente 1 para los extremos
        } else {
            sum += 2 * y_i; // Coeficiente 2 para los puntos intermedios
        }
    }

    const integral = (h / 2) * sum;
    
    return { integral, iterations };
};

export { calculateTrapezoidal, TrapezoidalInput };