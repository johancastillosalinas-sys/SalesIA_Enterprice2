/**
 * @file permissions.js
 * @description Matriz de acceso por rol a los módulos del sistema (RF-01).
 * Un solo lugar para cambiar qué puede ver cada rol.
 *
 * NOTA: es control de interfaz sobre un sistema simulado en LocalStorage.
 * La seguridad real requiere validar los permisos también en el backend.
 */

// Orden de los módulos en el menú. El primero permitido es la pantalla de inicio de cada rol.
export const ROUTE_ORDER = [
  'dashboard', 'pos', 'quotes', 'customers', 'products',
  'analytics', 'inventory', 'reports', 'audit', 'history'
];

export const ROLE_ROUTES = {
  ADMINISTRADOR: [...ROUTE_ORDER],
  GERENTE: ['dashboard', 'analytics', 'reports', 'history'],
  VENDEDOR: ['pos', 'quotes', 'customers', 'history'],
  ANALISTA: ['analytics', 'reports'],
  ALMACEN: ['products', 'inventory']
};

export function canAccess(role, route) {
  // Rol desconocido => sin acceso (opción segura por defecto)
  return (ROLE_ROUTES[role] || []).includes(route);
}

export function firstAllowedRoute(role) {
  return ROUTE_ORDER.find(route => canAccess(role, route)) || null;
}