/**
 * @file salesController.js
 * @description Terminal transaccional (POS).
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { CustomersView } from '../customers/customersView.js';
import { formatCurrency, escapeHtml } from '../../utils/formatters.js';
import { isProductActive } from '../products/productsView.js';

export class PosController {
  constructor(app) {
    this.app = app;
    this.cart = [];
  }

  render() {
    const products = this.app.state.storage.get('products', []).filter(isProductActive);
    const sellers = this.app.state.storage.get('sellers', []);
    const grid = document.getElementById('posProductGrid');
    if (!grid) return;

    CustomersView.fillSelect('posCustomerSelect', this.app.state.storage.get('customers', []));

    // Poblar selector de vendedores (RF-05)
    const sellerSelect = document.getElementById('posSellerSelect');
    if (sellerSelect && sellerSelect.children.length <= 1) {
      sellerSelect.innerHTML = sellers.map(s => `
        <option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(s.email)})</option>
      `).join('');
    }

    grid.innerHTML = products.map(p => `
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">${escapeHtml(p.sku)}</span>
            <span class="text-xs px-2 py-0.5 rounded font-semibold ${p.stock > p.minStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
              Stock: ${escapeHtml(p.stock)}
            </span>
          </div>
          <h4 class="font-semibold text-slate-800 text-sm mb-1">${escapeHtml(p.name)}</h4>
          <p class="text-xs text-slate-400 mb-3">${escapeHtml(p.categoryName || p.category)}</p>
        </div>
        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <div class="text-base font-bold text-slate-900">${formatCurrency(p.price)}</div>
          <button data-pos-add="${escapeHtml(p.id)}" ${p.stock <= 0 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg text-xs font-semibold ${p.stock > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
            ${p.stock > 0 ? '+ Agregar' : 'Agotado'}
          </button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-pos-add]').forEach(btn => {
      btn.onclick = () => {
        const prod = products.find(p => p.id === btn.getAttribute('data-pos-add'));
        if (!prod || prod.stock <= 0) return;
        const ex = this.cart.find(i => i.productId === prod.id);
        if (ex) {
          if (ex.quantity < prod.stock) ex.quantity++;
          else this.app.showToast('Límite de existencias alcanzado', 'warning');
        } else {
          this.cart.push({ productId: prod.id, name: prod.name, sku: prod.sku, price: prod.price, quantity: 1 });
        }
        this.renderCart();
      };
    });

    this.renderCart();

    const btnConfirm = document.getElementById('btnConfirmPosSale');
    if (btnConfirm) {
      btnConfirm.onclick = async () => {
        if (this.cart.length === 0) {
          this.app.showToast('El carrito está vacío.', 'warning');
          return;
        }
        const custSelect = document.getElementById('posCustomerSelect');
        const paySelect = document.getElementById('posPaymentMethodSelect');
        const sSelect = document.getElementById('posSellerSelect');

        const cmd = {
          customerId: custSelect?.value || 'CUST-001',
          customerName: custSelect?.options[custSelect.selectedIndex]?.text || 'Cliente General',
          sellerId: sSelect?.value || 'SELL-001',
          sellerName: sSelect?.options[sSelect.selectedIndex]?.text.split(' (')[0] || 'Valeria Quispe',
          paymentMethod: paySelect?.value || 'EFECTIVO',
          items: this.cart.map(it => ({ ...it }))
        };

        try {
          btnConfirm.disabled = true;
          await this.app.state.api.createSale(cmd);
          this.cart = [];
          this.renderCart();
          this.render();
        } catch (e) {
          this.app.showToast(e.message, 'error');
        } finally {
          btnConfirm.disabled = false;
        }
      };
    }
  }

  renderCart() {
    const list = document.getElementById('posCartItemsList');
    if (!list) return;

    if (this.cart.length === 0) {
      list.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">El carrito está vacío.</div>`;
    } else {
      list.innerHTML = this.cart.map((it, idx) => `
        <div class="p-3 flex items-center justify-between text-xs">
          <div class="flex-1">
            <p class="font-medium text-slate-800">${escapeHtml(it.name)}</p>
            <p class="text-slate-400 font-mono">${formatCurrency(it.price)} c/u</p>
          </div>
          <div class="flex items-center gap-2">
            <button data-cart-dec="${idx}" class="w-5 h-5 bg-slate-100 rounded text-slate-700">-</button>
            <span class="w-6 text-center font-bold">${escapeHtml(it.quantity)}</span>
            <button data-cart-inc="${idx}" class="w-5 h-5 bg-slate-100 rounded text-slate-700">+</button>
          </div>
          <div class="w-20 text-right font-bold text-slate-900">
            ${formatCurrency(it.price * it.quantity)}
          </div>
          <button data-cart-del="${idx}" class="text-slate-400 hover:text-rose-600 px-1">✕</button>
        </div>
      `).join('');

      list.querySelectorAll('[data-cart-inc]').forEach(b => {
        b.onclick = () => {
          const idx = parseInt(b.getAttribute('data-cart-inc'), 10);
          this.cart[idx].quantity++;
          this.renderCart();
        };
      });
      list.querySelectorAll('[data-cart-dec]').forEach(b => {
        b.onclick = () => {
          const idx = parseInt(b.getAttribute('data-cart-dec'), 10);
          if (this.cart[idx].quantity > 1) this.cart[idx].quantity--;
          else this.cart.splice(idx, 1);
          this.renderCart();
        };
      });
      list.querySelectorAll('[data-cart-del]').forEach(b => {
        b.onclick = () => {
          const idx = parseInt(b.getAttribute('data-cart-del'), 10);
          this.cart.splice(idx, 1);
          this.renderCart();
        };
      });
    }

    const sub = this.cart.reduce((a, b) => a + (b.price * b.quantity), 0);
    const tax = sub * 0.18;
    const tot = sub + tax;

    const elSub = document.getElementById('posSubtotal');
    const elTax = document.getElementById('posTax');
    const elTot = document.getElementById('posTotal');

    if (elSub) elSub.innerText = formatCurrency(sub);
    if (elTax) elTax.innerText = formatCurrency(tax);
    if (elTot) elTot.innerText = formatCurrency(tot);
  }
}