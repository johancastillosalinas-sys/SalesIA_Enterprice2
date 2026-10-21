/**
 * @file customersView.js
 * @description Vista y gestión del catálogo de clientes conforme a RF-03:
 * listado con búsqueda, alta, edición y desactivación (baja lógica).
 */

import { escapeHtml } from '../../utils/formatters.js';

export function isCustomerActive(customer) {
  // Los clientes del seed inicial no tienen "status": se consideran activos.
  return (customer.status || 'ACTIVE') === 'ACTIVE';
}

export class CustomersView {
  /**
   * @param {Array} customers Lista completa de clientes
   * @param {{onEdit?:Function,onToggle?:Function}} handlers Acciones por fila
   */
  static render(customers = [], handlers = {}, tbodyId = 'customersTableTbody') {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const text = (document.getElementById('customersSearchInput')?.value || '').trim().toLowerCase();
    const showInactive = !!document.getElementById('customersShowInactive')?.checked;

    const visible = customers.filter(c => {
      if (!showInactive && !isCustomerActive(c)) return false;
      if (!text) return true;
      return [c.id, c.name, c.docNumber, c.email, c.segment]
        .some(v => String(v || '').toLowerCase().includes(text));
    });

    const counter = document.getElementById('customersCounter');
    if (counter) {
      const activos = customers.filter(isCustomerActive).length;
      counter.innerText = `${visible.length} mostrados · ${activos} activos de ${customers.length}`;
    }

    if (visible.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400">${
        customers.length === 0 ? 'Sin clientes registrados.' : 'Ningún cliente coincide con el filtro.'
      }</td></tr>`;
      return;
    }

    tbody.innerHTML = visible.map(c => {
      const active = isCustomerActive(c);
      return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs ${active ? '' : 'opacity-60'}">
        <td class="px-4 py-3 font-mono font-bold text-blue-600">${escapeHtml(c.id)}</td>
        <td class="px-4 py-3 font-medium text-slate-800">${escapeHtml(c.name)}</td>
        <td class="px-4 py-3 font-mono text-slate-600">${escapeHtml(c.docType)}: ${escapeHtml(c.docNumber)}</td>
        <td class="px-4 py-3 text-slate-500">${escapeHtml(c.segment)}</td>
        <td class="px-4 py-3 text-slate-500">${escapeHtml(c.email)}</td>
        <td class="px-4 py-3 text-right font-mono font-bold text-slate-900">S/ ${(Number(c.creditLimit) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
        <td class="px-4 py-3 text-center">
          <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
            ${active ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td class="px-4 py-3 text-center whitespace-nowrap">
          <button data-cust-edit="${escapeHtml(c.id)}" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold">Editar</button>
          <button data-cust-toggle="${escapeHtml(c.id)}" class="px-2.5 py-1 rounded font-semibold ${active ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}">
            ${active ? 'Desactivar' : 'Reactivar'}
          </button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-cust-edit]').forEach(b => {
      b.onclick = () => handlers.onEdit?.(b.getAttribute('data-cust-edit'));
    });
    tbody.querySelectorAll('[data-cust-toggle]').forEach(b => {
      b.onclick = () => handlers.onToggle?.(b.getAttribute('data-cust-toggle'));
    });
  }

    /** Llena un <select> con los clientes activos (conserva la selección actual). */
  static fillSelect(selectId, customers = []) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const prev = select.value;
    const active = customers.filter(isCustomerActive);
    select.innerHTML = active.map(c =>
      `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} (${escapeHtml(c.docType)} ${escapeHtml(c.docNumber)})</option>`
    ).join('');
    if (active.some(c => c.id === prev)) select.value = prev;
  }

  /** Abre el modal en modo "nuevo" (customer = null) o "editar". */
  static openForm(customer = null) {
    const modal = document.getElementById('customerModal');
    if (!modal) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };

    set('customerFormId', customer?.id || '');
    set('customerFormDocType', customer?.docType || 'RUC');
    set('customerFormDocNumber', customer?.docNumber);
    set('customerFormName', customer?.name);
    set('customerFormSegment', customer?.segment || 'Pyme');
    set('customerFormEmail', customer?.email);
    set('customerFormPhone', customer?.phone);
    set('customerFormCredit', customer?.creditLimit ?? 10000);

    const title = document.getElementById('customerModalTitle');
    if (title) title.innerText = customer ? `Editar cliente ${customer.id}` : 'Nuevo cliente';
    CustomersView.setFormError('');
    modal.classList.remove('hidden');
    document.getElementById('customerFormName')?.focus();
  }

  static closeForm() {
    document.getElementById('customerModal')?.classList.add('hidden');
  }

  static setFormError(message) {
    const el = document.getElementById('customerFormError');
    if (!el) return;
    el.innerText = message || '';
    el.classList.toggle('hidden', !message);
  }

  static readForm() {
    const val = id => document.getElementById(id)?.value ?? '';
    return {
      id: val('customerFormId'),
      docType: val('customerFormDocType'),
      docNumber: val('customerFormDocNumber'),
      name: val('customerFormName'),
      segment: val('customerFormSegment'),
      email: val('customerFormEmail'),
      phone: val('customerFormPhone'),
      creditLimit: val('customerFormCredit')
    };
  }
}