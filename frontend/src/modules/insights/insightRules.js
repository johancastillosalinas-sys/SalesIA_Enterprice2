/**
 * @file insightRules.js
 * @description Generador de observaciones e insights explicables basados en reglas deterministas (Fase 11).
 */

export class InsightRules {
  static evaluate(sales = [], products = [], stats = {}) {
    const list = [];

    // Regla 1: Comportamiento de muestra unitaria vs representativa
    if (sales.length === 1) {
      list.push({
        id: 'INS-01',
        type: 'INFO',
        title: 'Muestra Unitaria Activa (1 Registro O(1))',
        evidence: `Sistema operando con exactamente 1 transacción por S/ ${stats.mean || 0}.`,
        recommendation: 'El cálculo responde en O(1). Conforme ingresen más operaciones se activará la convergencia muestral.'
      });
    } else if (sales.length >= 10) {
      list.push({
        id: 'INS-01B',
        type: 'SUCCESS',
        title: 'Muestra Estadísticamente Confiable',
        evidence: `Se registran ${sales.length} transacciones consecutivas procesadas en tiempo real.`,
        recommendation: 'Los estimadores de tendencia central son robustos para la toma de decisiones gerenciales.'
      });
    }

    // Regla 2: Detección de asimetría o valores atípicos
    if (stats.comparison && stats.comparison.pctDiff > 12) {
      list.push({
        id: 'INS-02',
        type: 'WARNING',
        title: 'Alerta de Asimetría por Ventas Atípicas',
        evidence: `La media difiere en un ${stats.comparison.pctDiff}% respecto a la mediana.`,
        recommendation: 'Utilizar la MEDIANA para presupuestar metas de ventas y evitar distorsiones por compras excepcionales.'
      });
    }

    // Regla 3: Monitoreo de stock crítico
    const lowStock = products.filter(p => p.stock <= p.minStock);
    if (lowStock.length > 0) {
      list.push({
        id: 'INS-03',
        type: 'WARNING',
        title: `Inventario Crítico: ${lowStock.length} Producto(s) en Nivel Mínimo`,
        evidence: `El producto "${lowStock[0].name}" tiene solo ${lowStock[0].stock} unidades disponibles.`,
        recommendation: 'Generar orden de compra a almacén antes de que se bloqueen pedidos en la cola transaccional.'
      });
    }

    return list;
  }
}
