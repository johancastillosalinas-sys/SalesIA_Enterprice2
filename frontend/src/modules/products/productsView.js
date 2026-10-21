/**
 * @file productsView.js
 * @description Vista del catálogo de productos y categorías conforme a RF-04:
 * listado con búsqueda y filtro por categoría, alta, edición y desactivación (baja lógica).
 */

import { escapeHtml } from '../../utils/formatters.js';

export function isProductActive(product) {
  // Los productos del seed inicial ya traen status 'ACTIVE'; si falta, se considera activo.
  return (product.status || 'ACTIVE') === 'ACTIVE';
}

export class ProductsView {
  /**
   * @param {Array} products Lista completa de productos
   * @param {{onEdit?:Function,onToggle?:Function}} handlers Acciones por fila
   */
  static render(products = [], handlers = {}, tbodyId = 'productsTableTbody') {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const text = (document.getElementById('productsSearchInput')?.value || '').trim().toLowerCase();
    const category = document.getElementById('productsCategoryFilter')?.value || '';
    const showInactive = !!document.getElementById('productsShowInactive')?.checked;

    const visible = products.filter(p => {
      if (!showInactive && !isProductActive(p)) return false;
      if (category && p.categoryId !== category) return false;
      if (!text) return true;
      return [p.id, p.sku, p.name, p.categoryName]
        .some(v => String(v || '').toLowerCase().includes(text));
    });

    const counter = document.getElementById('productsCounter');
    if (counter) {
      const activos = products.filter(isProductActive).length;
      counter.innerText = `${visible.length} mostrados · ${activos} activos de ${products.length}`;
    }

    if (visible.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400">${
        products.length === 0 ? 'Sin productos en catálogo.' : 'Ningún producto coincide con el filtro.'
      }</td></tr>`;
      return;
    }

    tbody.innerHTML = visible.map(p => {
      const active = isProductActive(p);
      const lowStock = p.stock <= p.minStock;
      return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs ${active ? '' : 'opacity-60'}">
        <td class="px-4 py-3 font-mono font-bold text-cyan-700">${escapeHtml(p.sku)}</td>
        <td class="px-4 py-3 font-medium text-slate-800">${escapeHtml(p.name)}</td>
        <td class="px-4 py-3 text-slate-500">${escapeHtml(p.categoryName || p.category)}</td>
        <td class="px-4 py-3 text-right font-mono font-bold text-slate-900">S/ ${(Number(p.price) || 0).toFixed(2)}</td>
        <td class="px-4 py-3 text-center">
          <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${lowStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
            ${escapeHtml(p.stock)} ${escapeHtml(p.unit)}
          </span>
        </td>
        <td class="px-4 py-3 text-center text-slate-400 font-mono">${escapeHtml(p.minStock)}</td>
        <td class="px-4 py-3 text-center">
          <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button data-prod-edit="${escapeHtml(p.id)}" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Editar</button>
          <button data-prod-toggle="${escapeHtml(p.id)}" class="px-2.5 py-1 rounded font-semibold ${active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}">
            ${active ? 'Desactivar' : 'Reactivar'}
          </button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-prod-edit]').forEach(b => {
      b.onclick = () => handlers.onEdit?.(b.getAttribute('data-prod-edit'));
    });
    tbody.querySelectorAll('[data-prod-toggle]').forEach(b => {
      b.onclick = () => handlers.onToggle?.(b.getAttribute('data-prod-toggle'));
    });
  }

  /** Llena el filtro de categorías (conserva la selección actual). */
  static fillCategoryFilter(categories = []) {
    const sel = document.getElementById('productsCategoryFilter');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="">Todas las categorías</option>` +
      categories.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
    if (categories.some(c => c.id === prev)) sel.value = prev;
  }

  /** Abre el modal en modo "nuevo" (product = null) o "editar". */
  static openForm(product = null, categories = []) {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };

    const catSel = document.getElementById('productFormCategory');
    if (catSel) {
      catSel.innerHTML = categories.map(c =>
        `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`
      ).join('');
    }

    set('productFormId', product?.id || '');
    set('productFormSku', product?.sku);
    set('productFormName', product?.name);
    set('productFormCategory', product?.categoryId || categories[0]?.id || '');
    set('productFormPrice', product?.price);
    set('productFormCost', product?.cost ?? 0);
    set('productFormStock', product ? product.stock : 0);
    set('productFormMinStock', product?.minStock ?? 5);
    set('productFormUnit', product?.unit || 'UND');

    // En edición el stock no se modifica aquí: solo desde Inventario y Ventas.
    const stockInput = document.getElementById('productFormStock');
    const stockNote = document.getElementById('productFormStockNote');
    if (stockInput) stockInput.disabled = !!product;
    if (stockNote) {
      stockNote.innerText = product
        ? 'El stock se modifica desde Inventario.'
        : 'Stock inicial del producto.';
    }

    const title = document.getElementById('productModalTitle');
    if (title) title.innerText = product ? `Editar producto ${product.id}` : 'Nuevo producto';
    ProductsView.setFormError('');
    modal.classList.remove('hidden');
    document.getElementById('productFormSku')?.focus();
  }

  static closeForm() {
    document.getElementById('productModal')?.classList.add('hidden');
  }

  static setFormError(message) {
    const el = document.getElementById('productFormError');
    if (!el) return;
    el.innerText = message || '';
    el.classList.toggle('hidden', !message);
  }

  static readForm() {
    const val = id => document.getElementById(id)?.value ?? '';
    return {
      id: val('productFormId'),
      sku: val('productFormSku'),
      name: val('productFormName'),
      categoryId: val('productFormCategory'),
      price: val('productFormPrice'),
      cost: val('productFormCost'),
      stock: val('productFormStock'),
      minStock: val('productFormMinStock'),
      unit: val('productFormUnit')
    };
  }
}