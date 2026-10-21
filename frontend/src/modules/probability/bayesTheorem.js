/**
 * @file bayesTheorem.js
 * @description Inferencia y Teorema de Bayes interactivo conforme a la Semana 07:
 * P(A|B) = [ P(B|A) * P(A) ] / P(B)
 */

export class BayesTheorem {
  static compute(priorA = 0.35, likelihoodBA = 0.75, marginalB = 0.40) {
    if (marginalB <= 0 || marginalB > 1) {
      return { valid: false, error: 'P(B) debe estar en el rango (0, 1].' };
    }
    const numerator = likelihoodBA * priorA;
    const posterior = Math.min(1.0, numerator / marginalB);

    const steps = [
      `1. Probabilidad a priori P(A) = ${(priorA * 100).toFixed(1)}%`,
      `2. Verosimilitud P(B|A) = ${(likelihoodBA * 100).toFixed(1)}%`,
      `3. Probabilidad marginal P(B) = ${(marginalB * 100).toFixed(1)}%`,
      `4. Numerador [P(B|A) × P(A)] = ${numerator.toFixed(4)}`,
      `5. Posterior P(A|B) = ${numerator.toFixed(4)} ÷ ${marginalB.toFixed(3)} = ${(posterior * 100).toFixed(2)}%`
    ];

    const explanation = `Al observar la compra técnica (Evento B), la probabilidad revisada de que el cliente pertenezca al segmento Corporativo (Evento A) asciende al ${(posterior * 100).toFixed(2)}% (frente al ${(priorA * 100).toFixed(1)}% inicial).`;

    return {
      valid: true,
      posterior: Number(posterior.toFixed(4)),
      posteriorPct: Number((posterior * 100).toFixed(2)),
      formulaSteps: steps,
      explanation
    };
  }
}
