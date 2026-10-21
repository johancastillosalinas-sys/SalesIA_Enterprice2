/**
 * @file customersController.js
 * @description Gestión de clientes (RF-03).
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { CustomersView, isCustomerActive } from './customersView.js';

export class CustomersController {
  constructor(app) {
    this.app = app;
  }

  render() {
    const customers = this.app.state.storage.get('customers', []);
    CustomersView.render(customers, {
      onEdit: (id) => this.openForm(id),
      onToggle: (id) => this.toggleStatus(id)
    });

    const rerender = () => this.render();
    const search = document.getElementById('customersSearchInput');
    const inactive = document.getElementById('customersShowInactive');
    if (search) search.oninput = rerender;
    if (inactive) inactive.onchange = rerender;

    const btnNew = document.getElementById('btnNewCustomer');
    if (btnNew) btnNew.onclick = () => this.openForm(null);

    const btnCancel = document.getElementById('btnCancelCustomer');
    if (btnCancel) btnCancel.onclick = () => CustomersView.closeForm();

    const btnSave = document.getElementById('btnSaveCustomer');
    if (btnSave) btnSave.onclick = () => this.saveForm();
  }

  openForm(id) {
    const customer = id ? this.app.state.storage.get('customers', []).find(c => c.id === id) : null;
    CustomersView.openForm(customer || null);
  }

  async saveForm() {
    const btn = document.getElementById('btnSaveCustomer');
    const data = CustomersView.readForm();
    try {
      if (btn) btn.disabled = true;
      if (data.id) {
        await this.app.state.api.updateCustomer(data.id, data);
        this.app.showToast(`Cliente ${data.id} actualizado.`, 'success');
      } else {
        const created = await this.app.state.api.createCustomer(data);
        this.app.showToast(`Cliente ${created.id} creado correctamente.`, 'success');
      }
      CustomersView.closeForm();
      this.render();
    } catch (e) {
      CustomersView.setFormError(e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async toggleStatus(id) {
    const customer = this.app.state.storage.get('customers', []).find(c => c.id === id);
    if (!customer) return;
    const willDeactivate = isCustomerActive(customer);
    const question = willDeactivate
      ? `¿Desactivar a "${customer.name}"? No aparecerá en nuevas ventas ni cotizaciones, pero su historial se conserva.`
      : `¿Reactivar a "${customer.name}"?`;
    if (!confirm(question)) return;
    try {
      await this.app.state.api.setCustomerStatus(id, willDeactivate ? 'INACTIVE' : 'ACTIVE');
      this.app.showToast(`Cliente ${willDeactivate ? 'desactivado' : 'reactivado'}.`, 'info');
      this.render();
    } catch (e) {
      this.app.showToast(e.message, 'error');
    }
  }
}