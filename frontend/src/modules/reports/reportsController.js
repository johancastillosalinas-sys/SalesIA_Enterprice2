/**
 * @file reportsController.js
 * @description Reportes comerciales (RF-20).
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { ChartManager } from '../../components/chartManager.js';
import { DescriptiveStats } from '../analytics/descriptiveStats.js';
import { escapeHtml, formatCurrency } from '../../utils/formatters.js';

export class ReportsController {
  constructor(app) {
    this.app = app;
  }

  fillFilterSelect(id, label, values) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="">${label}</option>` +
      values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    if (values.includes(prev)) sel.value = prev;
  }

  async render() {
    const data = await this.app.state.api.getReportsData();
    const cont = document.getElementById('reportsSummaryContainer');
    if (!cont) return;

    // --- Filtros ---
    const sellerNames = [...new Set([
      ...data.sellers.map(s => s.name),
      ...data.sales.map(s => s.sellerName || 'Valeria Quispe')
    ])].sort();
    const payments = [...new Set(data.sales.map(s => s.paymentMethod).filter(Boolean))].sort();
    this.fillFilterSelect('reportsSellerFilter', 'Todos los vendedores', sellerNames);
    this.fillFilterSelect('reportsPaymentFilter', 'Todos los métodos', payments);

    const sellerF = document.getElementById('reportsSellerFilter')?.value || '';
    const payF = document.getElementById('reportsPaymentFilter')?.value || '';
    const fromVal = document.getElementById('reportsDateFrom')?.value || '';
    const toVal = document.getElementById('reportsDateTo')?.value || '';
    const from = fromVal ? new Date(`${fromVal}T00:00:00`).getTime() : null;
    const to = toVal ? new Date(`${toVal}T23:59:59.999`).getTime() : null;

    const sales = data.sales.filter(s => {
      if (sellerF && (s.sellerName || 'Valeria Quispe') !== sellerF) return false;
      if (payF && s.paymentMethod !== payF) return false;
      if (from !== null && !(s.timestamp >= from)) return false;
      if (to !== null && !(s.timestamp <= to)) return false;
      return true;
    });

    const rerender = () => this.render();
    ['reportsDateFrom', 'reportsDateTo', 'reportsSellerFilter', 'reportsPaymentFilter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.onchange = rerender;
    });
    const btnClear = document.getElementById('btnReportsClear');
    if (btnClear) {
      btnClear.onclick = () => {
        ['reportsDateFrom', 'reportsDateTo', 'reportsSellerFilter', 'reportsPaymentFilter'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        rerender();
      };
    }
    const counter = document.getElementById('reportsCounter');
    if (counter) counter.innerText = `${sales.length} de ${data.sales.length} ventas`;

    // --- Cálculos sobre las ventas filtradas ---
    const amounts = sales.map(s => s.totals.total);
    const mean = DescriptiveStats.mean(amounts);
    const median = DescriptiveStats.median(amounts);
    const comp = DescriptiveStats.compare(mean, median);
    const totalRevenue = amounts.reduce((a, b) => a + b, 0);

    const salesBySeller = {};
    const salesByCategory = {};
    const salesByDay = {};
    const pad = n => String(n).padStart(2, '0');
    for (const s of sales) {
      const sName = s.sellerName || 'Valeria Quispe';
      salesBySeller[sName] = (salesBySeller[sName] || 0) + s.totals.total;

      for (const it of s.items || []) {
        const prod = data.products.find(p => p.id === it.productId);
        const cat = prod?.categoryName || 'General';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + (it.price * it.quantity);
      }

      const d = new Date(s.timestamp);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      salesByDay[key] = (salesByDay[key] || 0) + s.totals.total;
    }

        // --- Período evaluado: define contra cuánta meta se compara lo facturado ---
    // Si falta "Desde" o "Hasta", se usa la primera o la última venta registrada.
    const DAY_MS = 24 * 60 * 60 * 1000;
    const allTimes = data.sales.map(s => s.timestamp).filter(Number.isFinite);
    const periodStart = from ?? (allTimes.length ? Math.min(...allTimes) : null);
    const periodEnd = to ?? (allTimes.length ? Math.max(...allTimes) : null);
    const periodDays = (periodStart !== null && periodEnd !== null && periodEnd >= periodStart)
      ? Math.floor((periodEnd - periodStart) / DAY_MS) + 1
      : 1;
    // Nunca menos de 1 mes: un rango corto se mide contra la meta mensual; uno largo la escala.
    const goalMonths = Math.max(1, periodDays / 30);
    const dayKeys = Object.keys(salesByDay).sort();
    const trendLabels = dayKeys.map(k => `${k.slice(8, 10)}/${k.slice(5, 7)}`);
    const trendValues = dayKeys.map(k => Number(salesByDay[k].toFixed(2)));

    cont.innerHTML = `
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 class="font-bold text-slate-900 text-base">Módulo de Reportes Ejecutivos & Auditoría (RF-20)</h4>
            <p class="text-xs text-slate-400">Consolidado de operaciones comerciales según los filtros seleccionados</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btnExportCsv" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5">
              <span>📥 Exportar CSV</span>
            </button>
            <button onclick="window.print()" class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5">
              <span>🖨️ Imprimir Reporte</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-slate-400 block mb-1">Volumen Transaccional</span>
            <span class="text-xl font-bold font-mono text-slate-900">${sales.length} ventas</span>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-slate-400 block mb-1">Total Facturado</span>
            <span class="text-xl font-bold font-mono text-slate-900">${formatCurrency(totalRevenue)}</span>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-slate-400 block mb-1">Media Aritmética (μ)</span>
            <span class="text-xl font-bold font-mono text-blue-600">${formatCurrency(mean)}</span>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-slate-400 block mb-1">Mediana de Venta (M)</span>
            <span class="text-xl font-bold font-mono text-cyan-600">${formatCurrency(median)}</span>
          </div>
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-slate-400 block mb-1">Diagnóstico Dispersión</span>
            <span class="text-xs font-bold text-slate-800">${escapeHtml(comp.type)}</span>
          </div>
        </div>

        ${sales.length === 0 ? `
          <div class="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No hay ventas que coincidan con los filtros seleccionados.
          </div>
        ` : ''}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 p-4 border border-slate-200 rounded-xl">
            <h5 class="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3">Evolución de ventas por día</h5>
            <div class="h-56"><canvas id="reportsChartTrend"></canvas></div>
          </div>
          <div class="p-4 border border-slate-200 rounded-xl">
            <h5 class="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3">Ventas por categoría</h5>
            <div class="h-56"><canvas id="reportsChartCategories"></canvas></div>
          </div>
          <div class="lg:col-span-3 p-4 border border-slate-200 rounded-xl">
            <h5 class="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3">Facturación por vendedor</h5>
            <div class="h-48"><canvas id="reportsChartSellers"></canvas></div>
          </div>
        </div>

        <div class="space-y-3">
          <h5 class="font-bold text-xs text-slate-700 uppercase tracking-wider">Rendimiento por Vendedor (Fase 10 / RF-05)</h5>
          <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2.5">Vendedor</th>
                  <th class="px-4 py-2.5">Meta del período</th>
                  <th class="px-4 py-2.5 text-right">Total Facturado</th>
                  <th class="px-4 py-2.5 text-center">Cumplimiento Meta</th>
                </tr>
              </thead>
              <tbody>
                ${data.sellers.map(sel => {
                  const sold = salesBySeller[sel.name] || 0;
                  const periodGoal = sel.targetMonthly * goalMonths;
                  const pct = Math.min(100, Math.round((sold / periodGoal) * 100));
                  return `
                    <tr class="border-b border-slate-100 text-xs">
                      <td class="px-4 py-2.5 font-medium text-slate-800">${escapeHtml(sel.name)}</td>
                      <td class="px-4 py-2.5 font-mono text-slate-500">${formatCurrency(periodGoal)}</td>
                      <td class="px-4 py-2.5 text-right font-mono font-bold text-slate-900">${formatCurrency(sold)}</td>
                      <td class="px-4 py-2.5 text-center">
                        <span class="px-2 py-0.5 rounded text-[11px] font-bold ${pct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700'}">
                          ${pct}%
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-slate-400">
            ${goalMonths > 1
              ? `Período de ${periodDays} días: la meta mensual se escala ×${goalMonths.toFixed(2)}.`
              : `Período de ${periodDays} ${periodDays === 1 ? 'día' : 'días'}: se compara contra la meta de un mes.`}
          </p>
        </div>
      </div>
    `;

    ChartManager.renderTrendChart('reportsChartTrend', trendLabels, trendValues);
    ChartManager.renderCategoryChart('reportsChartCategories', salesByCategory);
    ChartManager.renderSellerChart('reportsChartSellers', salesBySeller);

    // --- Exportar CSV (solo las ventas filtradas) ---
    const btnCsv = document.getElementById('btnExportCsv');
    if (btnCsv) {
      btnCsv.onclick = () => {
        if (sales.length === 0) {
          this.app.showToast('No hay ventas para exportar con estos filtros.', 'warning');
          return;
        }
        // Escapa comillas y neutraliza fórmulas (=, +, -, @) para que Excel no las ejecute
        const cell = v => {
          let s = String(v ?? '');
          if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
          return `"${s.replace(/"/g, '""')}"`;
        };
        let csv = 'Folio,Cliente,Vendedor,Fecha,MetodoPago,Total\n';
        sales.forEach(s => {
          csv += [
            cell(s.id),
            cell(s.customerName),
            cell(s.sellerName || 'Valeria Quispe'),
            cell(s.dateFormatted),
            cell(s.paymentMethod),
            Number(s.totals.total).toFixed(2)
          ].join(',') + '\n';
        });
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_ventas_${Date.now()}.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.app.showToast(`Reporte exportado: ${sales.length} ventas.`, 'success');
      };
    }
  }
}