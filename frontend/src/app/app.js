/**
 * @file app.js
 * @description Orquestador integral de SalesIA Enterprise conforme a todas las fases y especificaciones del Plan de Desarrollo:
 * Simulación 100% en LocalStorage, Secuencia Consecutiva y Cotizador Sandbox Desacoplado.
 */

import { AppState } from './state.js';
import { AppRouter } from './router.js';
import { canAccess, firstAllowedRoute } from './permissions.js';
import { DashboardController } from '../modules/dashboard/dashboardController.js';
import { PosController } from '../modules/sales/salesController.js';
import { QuotesController } from '../modules/quotes/quotesController.js';
import { AnalyticsController } from '../modules/analytics/analyticsController.js';
import { InventoryController } from '../modules/inventory/inventoryController.js';
import { CustomersController } from '../modules/customers/customersController.js';
import { ProductsController } from '../modules/products/productsController.js';
import { ReportsController } from '../modules/reports/reportsController.js';
import { AuditController } from '../modules/audit/auditController.js';
import { HistoryController } from '../modules/history/historyController.js';
import { StressTestRunner } from '../hooks/useStressTest.js';
import { formatCurrency } from '../utils/formatters.js';


class Application {
  constructor() {
    this.state = new AppState();
    this.router = new AppRouter();
    this.audit = new AuditController(this);
    this.history = new HistoryController(this);
    this.reports = new ReportsController(this);
    this.customers = new CustomersController(this);
    this.products = new ProductsController(this);
    this.inventory = new InventoryController(this);
    this.dashboard = new DashboardController(this);
    this.analytics = new AnalyticsController(this);
    this.quotes = new QuotesController(this);
    this.pos = new PosController(this);

    window.__SALESIA_APP__ = this;
  }

  init() {
    this.router.onRouteChange((route) => this.renderRoute(route));
        this.router.setGuard((route) => {
      const allowed = canAccess(this.getCurrentRole(), route);
      if (!allowed) this.showToast('Tu rol no tiene acceso a este módulo.', 'warning');
      return allowed;
    });
    this.bindGlobalEvents();
    this.subscribeToDomainEvents();
        this.initUserRoleSelector();
    this.updateRolePermissionsUI(this.getCurrentRole());
    this.render();
  }

    getCurrentRole() {
    return this.state.storage.get('currentUser', { role: 'ADMINISTRADOR' }).role;
  }

  initUserRoleSelector() {
    const roleSelect = document.getElementById('topbarUserRoleSelect');
    if (roleSelect) {
      roleSelect.value = this.getCurrentRole();

      roleSelect.onchange = async (e) => {
        const newRole = e.target.value;
        // Se busca el usuario de ese rol: login() prioriza el nombre de usuario sobre el rol
        const target = this.state.storage.get('users', []).find(u => u.role === newRole);
        const res = await this.state.api.login(target?.username, newRole);
        if (!res.success) {
          this.showToast(`No se pudo cambiar al rol ${newRole}.`, 'error');
          roleSelect.value = this.getCurrentRole();
          return;
        }
        this.showToast(`Rol activo cambiado a: ${newRole}`, 'info');
        this.updateRolePermissionsUI(newRole);
      };
    }
  }

  updateRolePermissionsUI(role) {
    const roleBadge = document.getElementById('currentUserBadge');
    if (roleBadge) roleBadge.innerText = role;

    // Mostrar solo los módulos permitidos para el rol
    document.querySelectorAll('[data-nav-target]').forEach(el => {
      el.classList.toggle('hidden', !canAccess(role, el.getAttribute('data-nav-target')));
    });

    // Ocultar los títulos de grupo que se quedaron sin ningún módulo visible
    document.querySelectorAll('aside nav > div').forEach(heading => {
      let next = heading.nextElementSibling;
      let anyVisible = false;
      while (next && next.hasAttribute('data-nav-target')) {
        if (!next.classList.contains('hidden')) anyVisible = true;
        next = next.nextElementSibling;
      }
      heading.classList.toggle('hidden', !anyVisible);
    });

    // Si el módulo actual no está permitido para este rol, ir al primero que sí lo esté
    if (!canAccess(role, this.router.getCurrentRoute())) {
      const target = firstAllowedRoute(role);
      if (target) this.router.navigate(target);
    }
  }

  subscribeToDomainEvents() {
    this.state.eventBus.subscribe('transaction:enqueued', (d) => {
      this.showToast(`Transacción encolada en FIFO (En espera: ${d.queueSize})`, 'info');
      this.updateStatusBadges();
    });

    this.state.eventBus.subscribe('transaction:committed', (d) => {
      const s = d.result;
      this.showToast(`Ticket ${s.id} emitido en ${d.elapsed.toFixed(1)} ms. Total: ${formatCurrency(s.totals.total)}`, 'success');
      this.updateStatusBadges();
      this.render();
    });

    this.state.eventBus.subscribe('transaction:rejected', (d) => {
      this.showToast(`Error en transacción: ${d.error}`, 'error');
      this.updateStatusBadges();
    });
  }

  bindGlobalEvents() {
    // Prueba 1 Registro O(1)
    const btnTest1 = document.getElementById('btnTestSingleRecord');
    if (btnTest1) {
      btnTest1.onclick = async () => {
        try {
          btnTest1.disabled = true;
          const { result, timeMs } = await StressTestRunner.runSingle(this.state.api);
          this.showToast(`Prueba 1 Registro O(1) completada en ${timeMs} ms (${result.id})`, 'success');
        } catch (e) {
          this.showToast(`Error: ${e.message}`, 'error');
        } finally {
          btnTest1.disabled = false;
        }
      };
    }

    // Prueba 100 Registros
    const btnTest100 = document.getElementById('btnTestStress100');
    const progressBar = document.getElementById('stressProgressBar');
    const progressText = document.getElementById('stressProgressText');
    if (btnTest100) {
      btnTest100.onclick = async () => {
        try {
          btnTest100.disabled = true;
          if (progressText) progressText.innerText = 'Ejecutando 100 transacciones consecutivas...';
          const res = await StressTestRunner.run100(this.state.api, (curr, tot) => {
            const pct = Math.round((curr / tot) * 100);
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (progressText) progressText.innerText = `Procesando #${curr}/100 (${pct}%)...`;
          });
          this.showToast(`¡100 Registros procesados con éxito en ${res.totalTimeMs} ms!`, 'success');
        } catch (e) {
          this.showToast(`Error en prueba de estrés: ${e.message}`, 'error');
        } finally {
          btnTest100.disabled = false;
        }
      };
    }

    // Reinicio de Sistema
    const btnReset = document.getElementById('btnSystemReset');
    if (btnReset) {
      btnReset.onclick = () => {
        if (confirm('¿Deseas reiniciar LocalStorage y restablecer los datos de fábrica?')) {
          this.state.storage.clearSystemData();
          location.reload();
        }
      };
    }

    // Latencia de cola FIFO
    const delaySelect = document.getElementById('fifoDelaySelect');
    if (delaySelect) {
      delaySelect.onchange = (e) => {
        this.state.queue.setDelay(parseInt(e.target.value, 10) || 0);
      };
    }
  }

  updateStatusBadges() {
    const metrics = this.state.queue.getMetrics();
    const storageUsage = this.state.storage.getStorageUsage();

    const qBadge = document.getElementById('queueLengthBadge');
    const qText = document.getElementById('queueStatusText');
    const sBadge = document.getElementById('localStorageUsageBadge');

    if (qBadge) qBadge.innerText = metrics.queueLength;
    if (qText) qText.innerText = metrics.isBusy ? 'PROCESANDO' : 'OCIOSO';
    if (sBadge) sBadge.innerText = `${storageUsage.kbUsed} KB (${storageUsage.percentage}%)`;
  }

  render() {
    this.updateStatusBadges();
    this.renderRoute(this.router.getCurrentRoute());
  }

  renderRoute(route) {
    switch (route) {
      case 'dashboard':
        this.dashboard.render();
        break;
      case 'pos':
        this.pos.render();
        break;
      case 'quotes':
        this.quotes.render();
        break;
      case 'analytics':
        this.analytics.render();
        break;
      case 'inventory':
        this.inventory.render();
        break;
      case 'customers':
        this.customers.render();
        break;
      case 'products':
        this.products.render();
        break;
      case 'reports':
        this.reports.render();
        break;
      case 'audit':
        this.audit.render();
        break;
      case 'history':
        this.history.render();
        break;
    }
  }

  renderDashboard() {
    const sales = this.state.storage.get('sales', []);
    const products = this.state.storage.get('products', []);
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
            <td class="px-4 py-3 font-semibold text-blue-600 font-mono">${s.id}</td>
            <td class="px-4 py-3 text-slate-700">${s.customerName}</td>
            <td class="px-4 py-3 text-slate-500">${s.dateFormatted}</td>
            <td class="px-4 py-3 text-right font-medium text-slate-900">${formatCurrency(s.totals.total)}</td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ${s.status}
              </span>
            </td>
          </tr>
        `).join('');
      }
    }
  }

  renderInventory() {
    const products = this.state.storage.get('products', []);
    const movements = this.state.storage.get('inventory_movements', []);
    const tbody = document.getElementById('inventoryTableTbody');
    const movTbody = document.getElementById('inventoryMovementsTbody');

    if (tbody) {
      tbody.innerHTML = products.map(p => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
          <td class="px-4 py-3 font-mono font-semibold text-cyan-700">${p.sku}</td>
          <td class="px-4 py-3 font-medium text-slate-800">${p.name}</td>
          <td class="px-4 py-3 text-slate-500">${p.categoryName || p.category}</td>
          <td class="px-4 py-3 text-right font-mono font-bold">${formatCurrency(p.price)}</td>
          <td class="px-4 py-3 text-center">
            <span class="inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${p.stock <= p.minStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
              ${p.stock} ${p.unit}
            </span>
          </td>
          <td class="px-4 py-3 text-center text-slate-400 font-mono">${p.minStock}</td>
          <td class="px-4 py-3 text-center">
            <button data-restock="${p.id}" class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700">
              +10 Uds.
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('[data-restock]').forEach(b => {
        b.onclick = () => {
          const prod = products.find(p => p.id === b.getAttribute('data-restock'));
          if (prod) {
            prod.stock += 10;
            this.state.storage.set('products', products);

            // Registrar movimiento de entrada
            const movs = this.state.storage.get('inventory_movements', []);
            movs.unshift({
              id: `MOV-${Date.now()}`,
              productId: prod.id,
              sku: prod.sku,
              productName: prod.name,
              type: 'ENTRADA_REABASTECIMIENTO',
              quantity: 10,
              previousStock: prod.stock - 10,
              newStock: prod.stock,
              referenceId: 'MANUAL',
              dateFormatted: new Date().toLocaleString('es-PE')
            });
            this.state.storage.set('inventory_movements', movs.slice(0, 200));

            this.renderInventory();
            this.showToast(`Stock de "${prod.name}" incrementado en 10 uds.`, 'info');
          }
        };
      });
    }

    if (movTbody) {
      if (movements.length === 0) {
        movTbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-slate-400 text-xs">Sin movimientos de almacén.</td></tr>`;
      } else {
        movTbody.innerHTML = movements.slice(0, 10).map(m => `
          <tr class="border-b border-slate-100 text-xs">
            <td class="px-3 py-2 font-mono text-slate-400">${m.dateFormatted}</td>
            <td class="px-3 py-2 font-mono text-cyan-700 font-bold">${m.sku}</td>
            <td class="px-3 py-2 font-medium">${m.productName}</td>
            <td class="px-3 py-2 text-center">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.type.includes('SALIDA') ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}">
                ${m.type}
              </span>
            </td>
            <td class="px-3 py-2 text-center font-bold">${m.quantity}</td>
            <td class="px-3 py-2 font-mono text-slate-500">${m.referenceId}</td>
          </tr>
        `).join('');
      }
    }
  }

  showToast(message, type = 'info') {
    const cont = document.getElementById('toastContainer');
    if (!cont) return;

    const t = document.createElement('div');
    const bg = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-blue-600 text-white'
    }[type] || 'bg-blue-600 text-white';

    t.className = `px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center justify-between gap-3 ${bg}`;
    t.innerHTML = `<span>${message}</span><button class="opacity-70 hover:opacity-100">✕</button>`;

    cont.appendChild(t);
    t.querySelector('button').onclick = () => t.remove();
    setTimeout(() => t.remove(), 4000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.init();
});
