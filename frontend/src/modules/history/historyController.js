/**
 * @file historyController.js
 * @description Historial consecutivo y comprobantes.
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { formatCurrency, escapeHtml } from '../../utils/formatters.js';

export class HistoryController {
  constructor(app) {
    this.app = app;
  }

  render() {
    const sales = this.app.state.storage.get('sales', []);
    const tbody = document.getElementById('historyTableTbody');
    if (!tbody) return;

    if (sales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Sin historial registrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = sales.map(s => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
        <td class="px-4 py-3 font-mono font-bold text-blue-600">${escapeHtml(s.id)}</td>
        <td class="px-4 py-3 font-mono text-slate-400">#${escapeHtml(String(s.sequenceNumber).padStart(4, '0'))}</td>
        <td class="px-4 py-3 text-slate-800">${escapeHtml(s.customerName)}</td>
        <td class="px-4 py-3 text-slate-500">${escapeHtml(s.dateFormatted)}</td>
        <td class="px-4 py-3 text-slate-600">${escapeHtml(s.paymentMethod)}</td>
        <td class="px-4 py-3 text-right font-bold text-slate-900">${formatCurrency(s.totals.total)}</td>
        <td class="px-4 py-3 text-center">
          <button data-receipt="${escapeHtml(s.id)}" class="text-blue-600 hover:underline font-semibold">
            Ver Comprobante
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-receipt]').forEach(b => {
      b.onclick = () => {
        const sale = sales.find(s => s.id === b.getAttribute('data-receipt'));
        if (sale) this.openReceiptModal(sale);
      };
    });
  }

  openReceiptModal(sale) {
    const modal = document.getElementById('receiptModal');
    const content = document.getElementById('receiptModalContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="border-b border-slate-200 pb-3 mb-3">
        <h3 class="text-base font-bold text-slate-900">SALESIA ENTERPRISE S.A.C.</h3>
        <p class="text-xs text-slate-500">RUC: 20608899112 - Av. Faustino Sánchez Carrión 465</p>
        <span class="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-800 font-mono font-bold text-sm rounded">
          ${escapeHtml(sale.id)} (#${escapeHtml(sale.sequenceNumber)})
        </span>
      </div>
      <div class="text-xs space-y-1 mb-3">
        <p><strong>Cliente:</strong> ${escapeHtml(sale.customerName)}</p>
        <p><strong>Vendedor:</strong> ${escapeHtml(sale.sellerName || 'Valeria Quispe')}</p>
        <p><strong>Fecha:</strong> ${escapeHtml(sale.dateFormatted)}</p>
        <p><strong>Método de Pago:</strong> ${escapeHtml(sale.paymentMethod)}</p>
        ${sale.originQuoteId ? `<p class="text-emerald-700 font-semibold">Origen: Cotización ${escapeHtml(sale.originQuoteId)}</p>` : ''}
      </div>
      <table class="w-full text-xs mb-3">
        <thead>
          <tr class="border-b border-slate-200 text-slate-500 font-semibold">
            <th class="py-1 text-left">Ítem</th>
            <th class="py-1 text-center">Cant.</th>
            <th class="py-1 text-right">P. Unit</th>
            <th class="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map(it => `
            <tr class="border-b border-slate-100">
              <td class="py-1.5">${escapeHtml(it.name || it.productName)}</td>
              <td class="py-1.5 text-center">${escapeHtml(it.quantity)}</td>
              <td class="py-1.5 text-right">${formatCurrency(it.price)}</td>
              <td class="py-1.5 text-right font-medium">${formatCurrency(it.price * it.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="text-right text-xs pt-2 border-t border-slate-200 space-y-1">
        <p>Subtotal: <strong>${formatCurrency(sale.totals.subtotal)}</strong></p>
        <p>IGV (18%): <strong>${formatCurrency(sale.totals.taxAmount)}</strong></p>
        <p class="text-sm font-bold text-slate-900">TOTAL: <strong>${formatCurrency(sale.totals.total)}</strong></p>
      </div>
    `;

    modal.classList.remove('hidden');
    document.getElementById('closeReceiptModalBtn').onclick = () => modal.classList.add('hidden');
  }
}