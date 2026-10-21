/**
 * @file analyticsController.js
 * @description Analytics, estadística y Bayes.
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { ChartManager } from '../../components/chartManager.js';
import { DescriptiveStats } from './descriptiveStats.js';
import { InsightRules } from '../insights/insightRules.js';
import { formatCurrency, escapeHtml } from '../../utils/formatters.js';

export class AnalyticsController {
  constructor(app) {
    this.app = app;
  }

  render() {
    const sales = this.app.state.storage.get('sales', []);
    const products = this.app.state.storage.get('products', []);
    const amounts = sales.map(s => s.totals.total);

    const mean = DescriptiveStats.mean(amounts);
    const median = DescriptiveStats.median(amounts);
    const comparison = DescriptiveStats.compare(mean, median);

    const elMean = document.getElementById('statMeanVal');
    const elMed = document.getElementById('statMedianVal');
    const elCompType = document.getElementById('statComparisonType');
    const elCompDesc = document.getElementById('statComparisonDesc');

    if (elMean) elMean.innerText = formatCurrency(mean);
    if (elMed) elMed.innerText = formatCurrency(median);
    if (elCompType) elCompType.innerText = comparison.type;
    if (elCompDesc) elCompDesc.innerText = comparison.desc;

    // Bayes Interactivo
    const pInput = document.getElementById('bayesPriorInput');
    const lInput = document.getElementById('bayesLikelihoodInput');
    const mInput = document.getElementById('bayesMarginalInput');

    const updateBayes = () => {
      const prior = parseFloat(pInput?.value) || 0.35;
      const like = parseFloat(lInput?.value) || 0.75;
      const marg = parseFloat(mInput?.value) || 0.40;

      const res = this.app.state.api.calculateBayes(prior, like, marg);
      const resPct = document.getElementById('bayesResultPct');
      const exp = document.getElementById('bayesExplanation');
      const steps = document.getElementById('bayesStepsContainer');

      if (resPct) resPct.innerText = `${res.posteriorPct}%`;
      if (exp) exp.innerText = res.explanation;
      if (steps) {
        steps.innerHTML = res.formulaSteps.map(st => `
          <div class="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-700">${escapeHtml(st)}</div>
        `).join('');
      }
      ChartManager.renderBayesComparison('bayesChartComparison', prior, res.posterior);
    };

    [pInput, lInput, mInput].forEach(inp => {
      if (inp) inp.oninput = updateBayes;
    });
    updateBayes();

    // Variables Estadísticas y Aleatorias (RF-14, RF-15)
    this.renderRandomVariables();

    // Insights Deterministas
    const insights = InsightRules.evaluate(sales, products, { mean, median, comparison });
    const cont = document.getElementById('insightsContainer');
    if (cont) {
      if (insights.length === 0) {
        cont.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">Sin insights suficientes. Registra transacciones.</div>`;
      } else {
        cont.innerHTML = insights.map(ins => `
          <div class="p-4 rounded-xl border ${ins.type === 'WARNING' ? 'border-amber-200 bg-amber-50/50' : 'border-blue-200 bg-blue-50/50'}">
            <h5 class="font-bold text-xs ${ins.type === 'WARNING' ? 'text-amber-900' : 'text-blue-900'} mb-1">${escapeHtml(ins.title)}</h5>
            <p class="text-xs text-slate-700 mb-1"><strong>Evidencia:</strong> ${escapeHtml(ins.evidence)}</p>
            <p class="text-xs text-slate-600 bg-white/70 p-2 rounded border border-slate-100">💡 <strong>Recomendación:</strong> ${escapeHtml(ins.recommendation)}</p>
          </div>
        `).join('');
      }
    }
  }

  renderRandomVariables() {
    const varAmount = this.app.state.api.analyzeRandomVariable('amount');
    const varQty = this.app.state.api.analyzeRandomVariable('quantity');

    const amountMeanEl = document.getElementById('rvAmountMean');
    const amountMedEl = document.getElementById('rvAmountMedian');
    const qtyMeanEl = document.getElementById('rvQtyMean');
    const qtyMedEl = document.getElementById('rvQtyMedian');

    if (amountMeanEl && varAmount) amountMeanEl.innerText = formatCurrency(varAmount.mean);
    if (amountMedEl && varAmount) amountMedEl.innerText = formatCurrency(varAmount.median);
    if (qtyMeanEl && varQty) qtyMeanEl.innerText = `${varQty.mean} uds`;
    if (qtyMedEl && varQty) qtyMedEl.innerText = `${varQty.median} uds`;
  }
}