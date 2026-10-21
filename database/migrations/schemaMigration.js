/**
 * @file schemaMigration.js
 * @description Gestor de migraciones e inicialización de esquemas en LocalStorage.
 * Asegura que todas las entidades de la Sección 12 estén creadas y listas para operar.
 */

import {
  INITIAL_COMPANY,
  INITIAL_ROLES,
  INITIAL_USERS,
  INITIAL_SELLERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS
} from '../seeds/initialSeed.js';

export const CURRENT_SCHEMA_VERSION = 3;

export class SchemaMigration {
  static runMigrations(storage) {
    // Verificación defensiva: garantizar que TODAS las colecciones existan con datos válidos
    if (!storage.get('company')) storage.set('company', INITIAL_COMPANY);
    if (!storage.get('roles') || !Array.isArray(storage.get('roles'))) storage.set('roles', INITIAL_ROLES);
    if (!storage.get('users') || !Array.isArray(storage.get('users'))) storage.set('users', INITIAL_USERS);
    if (!storage.get('sellers') || !Array.isArray(storage.get('sellers')) || storage.get('sellers').length === 0) {
      storage.set('sellers', INITIAL_SELLERS);
    }
    if (!storage.get('categories') || !Array.isArray(storage.get('categories')) || storage.get('categories').length === 0) {
      storage.set('categories', INITIAL_CATEGORIES);
    }
    if (!storage.get('products') || !Array.isArray(storage.get('products')) || storage.get('products').length === 0) {
      storage.set('products', INITIAL_PRODUCTS);
    }
    if (!storage.get('customers') || !Array.isArray(storage.get('customers')) || storage.get('customers').length === 0) {
      storage.set('customers', INITIAL_CUSTOMERS);
    }
    if (!storage.get('sales')) storage.set('sales', []);
    if (!storage.get('quotes')) storage.set('quotes', []);
    if (!storage.get('inventory_movements')) storage.set('inventory_movements', []);
    if (!storage.get('statistical_analyses')) storage.set('statistical_analyses', []);
    if (!storage.get('bayes_analyses')) storage.set('bayes_analyses', []);
    if (!storage.get('audit_logs')) storage.set('audit_logs', []);
    if (!storage.get('currentUser')) storage.set('currentUser', INITIAL_USERS[0]);

    localStorage.setItem('salesia:meta:version', String(CURRENT_SCHEMA_VERSION));
  }

  static resetDatabase(storage) {
    storage.clearSystemData();
    localStorage.setItem('salesia:meta:version', String(CURRENT_SCHEMA_VERSION));
    storage.set('company', INITIAL_COMPANY);
    storage.set('roles', INITIAL_ROLES);
    storage.set('users', INITIAL_USERS);
    storage.set('sellers', INITIAL_SELLERS);
    storage.set('categories', INITIAL_CATEGORIES);
    storage.set('products', INITIAL_PRODUCTS);
    storage.set('customers', INITIAL_CUSTOMERS);
    storage.set('sales', []);
    storage.set('quotes', []);
    storage.set('inventory_movements', []);
    storage.set('statistical_analyses', []);
    storage.set('bayes_analyses', []);
    storage.set('audit_logs', []);
    storage.set('currentUser', INITIAL_USERS[0]);
    localStorage.setItem('salesia:seq:transactions', '0');
    localStorage.setItem('salesia:seq:quotes', '0');
  }
}
