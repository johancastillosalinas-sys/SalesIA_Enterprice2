/**
 * @file productsController.js
 * @description Catálogo de productos (RF-04).
 * Recibe la aplicación (`app`) para usar su estado, API y avisos.
 */

import { ProductsView, isProductActive } from './productsView.js';

export class ProductsController {
  constructor(app) {
    this.app = app;
  }

  render() {
    const products = this.app.state.storage.get('products', []);
    ProductsView.fillCategoryFilter(this.app.state.storage.get('categories', []));
    ProductsView.render(products, {
      onEdit: (id) => this.openForm(id),
      onToggle: (id) => this.toggleStatus(id)
    });

    const rerender = () => this.render();
    const search = document.getElementById('productsSearchInput');
    const category = document.getElementById('productsCategoryFilter');
    const inactive = document.getElementById('productsShowInactive');
    if (search) search.oninput = rerender;
    if (category) category.onchange = rerender;
    if (inactive) inactive.onchange = rerender;

    const btnNew = document.getElementById('btnNewProduct');
    if (btnNew) btnNew.onclick = () => this.openForm(null);

    const btnCancel = document.getElementById('btnCancelProduct');
    if (btnCancel) btnCancel.onclick = () => ProductsView.closeForm();

    const btnSave = document.getElementById('btnSaveProduct');
    if (btnSave) btnSave.onclick = () => this.saveForm();
  }

  openForm(id) {
    const product = id ? this.app.state.storage.get('products', []).find(p => p.id === id) : null;
    ProductsView.openForm(product || null, this.app.state.storage.get('categories', []));
  }

  async saveForm() {
    const btn = document.getElementById('btnSaveProduct');
    const data = ProductsView.readForm();
    try {
      if (btn) btn.disabled = true;
      if (data.id) {
        await this.app.state.api.updateProduct(data.id, data);
        this.app.showToast(`Producto ${data.id} actualizado.`, 'success');
      } else {
        const created = await this.app.state.api.createProduct(data);
        this.app.showToast(`Producto ${created.id} creado correctamente.`, 'success');
      }
      ProductsView.closeForm();
      this.render();
    } catch (e) {
      ProductsView.setFormError(e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async toggleStatus(id) {
    const product = this.app.state.storage.get('products', []).find(p => p.id === id);
    if (!product) return;
    const willDeactivate = isProductActive(product);
    const question = willDeactivate
      ? `¿Desactivar "${product.name}"? No aparecerá en nuevas ventas ni cotizaciones, pero su historial se conserva.`
      : `¿Reactivar "${product.name}"?`;
    if (!confirm(question)) return;
    try {
      await this.app.state.api.setProductStatus(id, willDeactivate ? 'INACTIVE' : 'ACTIVE');
      this.app.showToast(`Producto ${willDeactivate ? 'desactivado' : 'reactivado'}.`, 'info');
      this.render();
    } catch (e) {
      this.app.showToast(e.message, 'error');
    }
  }
}