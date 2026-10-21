/**
 * @file quotesController.js
 * @description Cotizador independiente.
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { CustomersView } from '../customers/customersView.js';
import { QuoteEngine } from './quoteEngine.js';
import { formatCurrency, formatDate, escapeHtml } from '../../utils/formatters.js';
import { isProductActive } from '../products/productsView.js';

export class QuotesController {
  constructor(app) {
    this.app = app;
    this.cart = [];
  }

  render() {
    const quotes = this.app.state.quoteEngine.getQuotes();
    const tbody = document.getElementById('quotesTableTbody');
    if (tbody) {
      if (quotes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Sin cotizaciones registradas en Sandbox.</td></tr>`;
      } else {
        tbody.innerHTML = quotes.map(q => `
          <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
            <td class="px-4 py-3 font-semibold text-cyan-600 font-mono">${escapeHtml(q.id)}</td>
            <td class="px-4 py-3 text-slate-800 font-medium">${escapeHtml(q.customerName)}</td>
            <td class="px-4 py-3 text-slate-500">${formatDate(q.createdAt)}</td>
            <td class="px-4 py-3 text-center">${q.items.length} ítems</td>
            <td class="px-4 py-3 text-right font-bold font-mono text-slate-900">${formatCurrency(q.totals.total)}</td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${q.status === 'CONVERTIDA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}">
                ${escapeHtml(q.status)}
              </span>
              ${q.convertedToSaleId ? `<span class="block text-[10px] text-emerald-600 font-mono">${escapeHtml(q.convertedToSaleId)}</span>` : ''}
            </td>
            <td class="px-4 py-3 text-center">
              ${q.status !== 'CONVERTIDA' ? `
                <button data-convert-quote="${escapeHtml(q.id)}" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
                  Convertir a Venta
                </button>
              ` : `<span class="text-slate-400">Consolidada</span>`}
            </td>
          </tr>
        `).join('');

        tbody.querySelectorAll('[data-convert-quote]').forEach(btn => {
          btn.onclick = async () => {
            const qId = btn.getAttribute('data-convert-quote');
            if (confirm(`¿Convertir cotización ${qId} a venta correlativa?`)) {
              try {
                const { saleCommand } = this.app.state.quoteEngine.prepareConversionToSale(qId, 'TRANSFERENCIA');
                btn.disabled = true;
                const sale = await this.app.state.api.createSale(saleCommand);
                this.app.state.quoteEngine.markAsConverted(qId, sale.id);
                this.render();
              } catch (err) {
                btn.disabled = false;
                this.app.showToast(`Error: ${err.message}`, 'error');
              }
            }
          };
        });
      }
    }

    CustomersView.fillSelect('quoteCustomerSelect', this.app.state.storage.get('customers', []));

    const products = this.app.state.storage.get('products', []).filter(isProductActive);
    const selectProd = document.getElementById('quoteSelectProduct');
    if (selectProd) {
      selectProd.innerHTML = products.map(p => `
        <option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} - ${formatCurrency(p.price)}</option>
      `).join('');
    }

    const btnAddItem = document.getElementById('btnAddQuoteItem');
    if (btnAddItem) {
      btnAddItem.onclick = () => {
        const prod = products.find(p => p.id === selectProd.value);
        const qty = parseInt(document.getElementById('quoteItemQty')?.value, 10) || 1;
        const disc = parseFloat(document.getElementById('quoteItemDisc')?.value) || 0;
        if (!prod) return;

        this.cart.push({
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: prod.price,
          quantity: qty,
          discountPct: disc
        });

        this.renderCart();
      };
    }

    const btnSaveQuote = document.getElementById('btnSaveQuote');
    if (btnSaveQuote) {
      btnSaveQuote.onclick = () => {
        if (this.cart.length === 0) {
          this.app.showToast('Agrega productos al borrador de cotización.', 'warning');
          return;
        }
        const custSelect = document.getElementById('quoteCustomerSelect');
        const globalDisc = parseFloat(document.getElementById('quoteGlobalDisc')?.value) || 0;
        const notes = document.getElementById('quoteNotes')?.value || '';

        try {
          const q = this.app.state.quoteEngine.createQuote({
            customerId: custSelect?.value || 'CUST-001',
            customerName: custSelect?.options[custSelect.selectedIndex]?.text || 'Cliente General',
            items: this.cart,
            discountPct: globalDisc,
            notes
          });
          this.cart = [];
          this.renderCart();
          this.render();
          this.app.showToast(`Cotización ${q.id} guardada en Sandbox.`, 'success');
        } catch (e) {
          this.app.showToast(e.message, 'error');
        }
      };
    }

    this.renderCart();
  }

  renderCart() {
    const list = document.getElementById('quoteItemsTbody');
    if (!list) return;

    if (this.cart.length === 0) {
      list.innerHTML = `<tr><td colspan="6" class="px-3 py-4 text-center text-slate-400 text-xs">Sin ítems en borrador.</td></tr>`;
    } else {
      list.innerHTML = this.cart.map((it, idx) => {
        const line = (it.price * it.quantity) * (1 - (it.discountPct / 100));
        return `
          <tr class="border-b border-slate-100 text-xs">
            <td class="px-3 py-2 font-medium">${escapeHtml(it.name)}</td>
            <td class="px-3 py-2 text-center">${escapeHtml(it.quantity)}</td>
            <td class="px-3 py-2 text-right">${formatCurrency(it.price)}</td>
            <td class="px-3 py-2 text-center text-amber-600">${escapeHtml(it.discountPct)}%</td>
            <td class="px-3 py-2 text-right font-bold">${formatCurrency(line)}</td>
            <td class="px-3 py-2 text-center">
              <button data-del-quote-item="${idx}" class="text-rose-500">✕</button>
            </td>
          </tr>
        `;
      }).join('');

      list.querySelectorAll('[data-del-quote-item]').forEach(b => {
        b.onclick = () => {
          this.cart.splice(parseInt(b.getAttribute('data-del-quote-item'), 10), 1);
          this.renderCart();
        };
      });
    }

    const totals = QuoteEngine.calculateTotals(this.cart, 0);
    const sub = document.getElementById('quotePreviewSubtotal');
    const tot = document.getElementById('quotePreviewTotal');
    if (sub) sub.innerText = formatCurrency(totals.subtotal);
    if (tot) tot.innerText = formatCurrency(totals.total);
  }
}