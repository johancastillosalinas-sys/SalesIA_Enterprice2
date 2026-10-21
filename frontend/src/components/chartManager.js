/**
 * @file chartManager.js
 * @description Gestión de visualización gráfica analítica en la capa de componentes.
 */

export class ChartManager {
  static #charts = {};

  static renderMeanMedianChart(canvasId, mean, median) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (this.#charts[canvasId]) {
      this.#charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    this.#charts[canvasId] = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Media Aritmética (μ)', 'Mediana (M)'],
        datasets: [{
          data: [mean, median],
          backgroundColor: ['rgba(37, 99, 235, 0.85)', 'rgba(6, 182, 212, 0.85)'],
          borderColor: ['#1d4ed8', '#0891b2'],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => `S/ ${v}` },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  static renderCategoryChart(canvasId, categoryData = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (this.#charts[canvasId]) {
      this.#charts[canvasId].destroy();
    }

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    const ctx = canvas.getContext('2d');
    this.#charts[canvasId] = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sin ventas'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: data.length > 0 ? colors.slice(0, labels.length) : ['#cbd5e1'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        cutout: '65%'
      }
    });
  }

  static renderBayesComparison(canvasId, prior, posterior) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (this.#charts[canvasId]) {
      this.#charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    this.#charts[canvasId] = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['P(A) A Priori', 'P(A|B) A Posteriori'],
        datasets: [{
          data: [Number((prior * 100).toFixed(1)), Number((posterior * 100).toFixed(1))],
          backgroundColor: ['rgba(148, 163, 184, 0.8)', 'rgba(16, 185, 129, 0.85)'],
          borderColor: ['#94a3b8', '#059669'],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, max: 100, ticks: { callback: v => `${v}%` } }
        }
      }
    });
  }
  
  static renderTrendChart(canvasId, labels = [], values = []) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (this.#charts[canvasId]) {
      this.#charts[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');
    this.#charts[canvasId] = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.25,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => `S/ ${v}` },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  static renderSellerChart(canvasId, sellerData = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof window.Chart === 'undefined') return;

    if (this.#charts[canvasId]) {
      this.#charts[canvasId].destroy();
    }

    const labels = Object.keys(sellerData);
    const data = Object.values(sellerData);

    const ctx = canvas.getContext('2d');
    this.#charts[canvasId] = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Sin ventas'],
        datasets: [{
          data: data.length > 0 ? data : [0],
          backgroundColor: 'rgba(6, 182, 212, 0.85)',
          borderColor: '#0891b2',
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { callback: v => `S/ ${v}` } }
        }
      }
    });
  }
}
