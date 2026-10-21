/**
 * @file dashboardController.js
 * @description Dashboard y monitor en vivo.
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { ChartManager } from '../../components/chartManager.js';
import { DescriptiveStats } from '../analytics/descriptiveStats.js';
import { formatCurrency, escapeHtml } from '../../utils/formatters.js';

export class DashboardController {
  constructor(app) {
    this.app = app;
  }

  render() {
    const sales = this.app.state.storage.get('sales', []);
    const products = this.app.state.storage.get('products', []);
    const amounts = sales.map(s => s.totals.total);

    const mean = DescriptiveStats.mean(amounts);
    const median = DescriptiveStats.median(amounts);
    const totalRev = amounts.reduce((a, b) => a + b, 0);
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

    const kpiSales = document.getElementById('kpiTotalSales');
    const kpiRev = document.getElementById('kpiTotalRevenue');
    const kpiMean = document.getElementById('kpiMean');
    const kpiMed = document.getElementById('kpiMedian');
    const kpiStock = document.getElementById('kpiTotalStock');

    if (kpiSales) kpiSales.innerText = sales.length;
    if (kpiRev) kpiRev.innerText = formatCurrency(totalRev);
    if (kpiMean) kpiMean.innerText = formatCurrency(mean);
    if (kpiMed) kpiMed.innerText = formatCurrency(median);
    if (kpiStock) kpiStock.innerText = `${totalStock} uds.`;

    ChartManager.renderMeanMedianChart('dashboardChartMeanMedian', mean, median);

    const catTotals = {};
    for (const s of sales) {
      for (const it of s.items || []) {
        const prod = products.find(p => p.id === it.productId);
        const cat = prod?.categoryName || 'General';
        catTotals[cat] = (catTotals[cat] || 0) + (it.price * it.quantity);
      }
    }
    ChartManager.renderCategoryChart('dashboardChartCategories', catTotals);

    const tbody = document.getElementById('dashboardRecentSalesTbody');
    if (tbody) {
      if (sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Sin transacciones registradas.</td></tr>`;
      } else {
        tbody.innerHTML = sales.slice(0, 5).map(s => `
          <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
            <td class="px-4 py-3 font-semibold text-blue-600 font-mono">${escapeHtml(s.id)}</td>
            <td class="px-4 py-3 text-slate-700">${escapeHtml(s.customerName)}</td>
            <td class="px-4 py-3 text-slate-500">${escapeHtml(s.dateFormatted)}</td>
            <td class="px-4 py-3 text-right font-medium text-slate-900">${formatCurrency(s.totals.total)}</td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ${escapeHtml(s.status)}
              </span>
            </td>
          </tr>
        `).join('');
      }
    }
  }
}