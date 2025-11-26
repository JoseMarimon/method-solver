import { evaluateExpression, preprocessExpression } from './mathEvaluator';

interface Simpson13Input {
    funcStr: string; // La función como texto
    a: string | number;       // Límite inferior de integración (puede ser expresión)
    b: string | number;       // Límite superior de integración (puede ser expresión)
    n: number;       // Número de subintervalos (debe ser par)
}

// Define la estructura de cada punto de iteración
export interface Simpson13Iteration {
    x: number;
    y: number;
}

// Define la nueva estructura del valor de retorno
export interface Simpson13Output {
    integral: number;
    iterations: Simpson13Iteration[];
}

const calculateSimpson13 = ({ funcStr, a, b, n }: Simpson13Input): Simpson13Output => {
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
    const iterations: Simpson13Iteration[] = [];
    let sum = 0;

    // Función para evaluar f(x) en un punto dado
    const f = (x: number): number => {
        const result = evaluateExpression(funcStr, x);
        if (isNaN(result)) {
            console.error(`⚠️ NaN detectado en Simpson13: x=${x}, función="${funcStr}"`);
        }
        return result;
    };

    console.log(`🔢 Simpson13: Calculando integral de "${funcStr}" desde ${aVal} hasta ${bVal} con ${n} subintervalos`);
    console.log(`📏 h (tamaño del paso) = ${h}`);

    // Bucle de 0 a n para incluir los límites inferior y superior
    for (let i = 0; i <= n; i++) {
        const x_i = aVal + i * h;
        const y_i = f(x_i);
        iterations.push({ x: x_i, y: y_i });

        // Aplicar coeficientes de Simpson 1/3
        if (i === 0 || i === n) {
            sum += y_i; // Coeficiente 1 para los extremos
        } else if (i % 2 !== 0) {
            sum += 4 * y_i; // Coeficiente 4 para los términos impares
        } else {
            sum += 2 * y_i; // Coeficiente 2 para los términos pares
        }
    }

    const integral = (h / 3) * sum;

    // Retorna el objeto con la integral y el array de iteraciones
    return { integral, iterations };
};

export { calculateSimpson13, Simpson13Input };