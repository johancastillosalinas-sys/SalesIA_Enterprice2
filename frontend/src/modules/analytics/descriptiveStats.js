/**
 * @file descriptiveStats.js
 * @description Motor Estadístico de la Semana 07:
 * Media aritmética, Mediana, y Comparación de Asimetría (Skewness).
 * Optimizado para la regla 1 vs 100 con cortocircuitos O(1).
 */

export class DescriptiveStats {
  static mean(values = []) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    if (values.length === 1) return Number(values[0].toFixed(2));
    const sum = values.reduce((acc, v) => acc + (Number(v) || 0), 0);
    return Number((sum / values.length).toFixed(2));
  }

  static median(values = []) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    if (values.length === 1) return Number(values[0].toFixed(2));
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2))
      : Number(sorted[mid].toFixed(2));
  }

  static compare(meanVal, medianVal) {
    if (meanVal === 0 && medianVal === 0) {
      return { difference: 0, pctDiff: 0, type: 'Sin datos', desc: 'No hay transacciones suficientes.' };
    }
    const diff = Number((meanVal - medianVal).toFixed(2));
    const base = medianVal > 0 ? medianVal : meanVal;
    const pctDiff = Number(((Math.abs(diff) / base) * 100).toFixed(2));

    let type = 'Aproximadamente Simétrica';
    let desc = 'Las ventas tienen un comportamiento homogéneo sin compras atípicas desmedidas.';

    if (pctDiff > 10) {
      if (meanVal > medianVal) {
        type = 'Sesgo Positivo (Asimetría Derecha)';
        desc = `La media (S/ ${meanVal}) supera a la mediana (S/ ${medianVal}) debido a tickets corporativos de alto valor (outliers).`;
      } else {
        type = 'Sesgo Negativo (Asimetría Izquierda)';
        desc = `La media (S/ ${meanVal}) es menor que la mediana (S/ ${medianVal}) por una concentración de ventas grandes y pocas compras menores.`;
      }
    }

    return { difference: diff, pctDiff, type, desc };
  }
}
