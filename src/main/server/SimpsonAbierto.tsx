import { evaluateExpression, preprocessExpression } from './mathEvaluator';

interface SimpsonAbiertoInput {
    funcStr: string; // La función como texto
    a: string | number;       // Límite inferior de integración (puede ser expresión)
    b: string | number;       // Límite superior de integración (puede ser expresión)
    n: number;       // Número de subintervalos (debe ser múltiplo de 3)
}

// Define la estructura de cada punto de iteración
export interface SimpsonAbiertoIteration {
    x: number;
    y: number;
}

// Define la nueva estructura del valor de retorno
export interface SimpsonAbiertoOutput {
    integral: number;
    iterations: SimpsonAbiertoIteration[];
}

const calculateSimpsonAbierto = ({ funcStr, a, b, n }: SimpsonAbiertoInput): SimpsonAbiertoOutput => {
    if (n <= 0 || n % 2 !== 0) {
        throw new Error("El número de subintervalos (n) debe ser un número par positivo.");
    }

    // Evaluar a y b si son expresiones
    const aVal = typeof a === 'string' ? evaluateExpression(preprocessExpression(a), 0) : a;
    const bVal = typeof b === 'string' ? evaluateExpression(preprocessExpression(b), 0) : b;
    
    if (isNaN(aVal) || isNaN(bVal)) {
        throw new Error(`Límites inválidos: a=${a} -> ${aVal}, b=${b} -> ${bVal}`);
    }

    const h = (bVal - aVal) / n;
    const iterations: SimpsonAbiertoIteration[] = [];
    let sum = 0;

    // Función para evaluar f(x) en un punto dado
    const f = (x: number): number => {
        return evaluateExpression(funcStr, x);
    };

    // El bucle va de 1 a n-1, ya que las fórmulas abiertas no usan los puntos finales a y b.
    for (let i = 1; i < n; i++) {
        const x_i = aVal + i * h;
        const y_i = f(x_i);
        iterations.push({ x: x_i, y: y_i });

        if (i % 2 !== 0) {
            sum += 4 * y_i; // Coeficiente 4 para los términos impares
        } else {
            sum += 2 * y_i; // Coeficiente 2 para los términos pares
        }
    }

    const integral = (h / 3) * sum;
    
    // Retorna el objeto con la integral y el array de iteraciones
    return { integral, iterations };
};

export { calculateSimpsonAbierto, SimpsonAbiertoInput };