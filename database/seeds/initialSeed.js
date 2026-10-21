/**
 * @file initialSeed.js
 * @description Datos semilla completos conforme a las entidades de la Sección 12 del Plan de Desarrollo:
 * users, roles, companies, customers, products, categories, employees/sellers, audit_logs.
 */

export const INITIAL_COMPANY = {
  id: 'COMP-001',
  ruc: '20608899112',
  name: 'SalesIA Enterprise S.A.C.',
  commercialName: 'SalesIA Solutions',
  address: 'Av. Faustino Sánchez Carrión 465, Magdalena del Mar, Lima',
  phone: '+51 (01) 480-9900',
  currency: 'PEN',
  taxRate: 0.18
};

export const INITIAL_ROLES = [
  { id: 'ROL-001', name: 'ADMINISTRADOR', permissions: ['ALL'] },
  { id: 'ROL-002', name: 'GERENTE', permissions: ['DASHBOARD', 'ANALYTICS', 'REPORTS'] },
  { id: 'ROL-003', name: 'VENDEDOR', permissions: ['POS', 'QUOTES', 'CUSTOMERS'] },
  { id: 'ROL-004', name: 'ANALISTA', permissions: ['ANALYTICS', 'PROBABILITY', 'INSIGHTS', 'REPORTS'] },
  { id: 'ROL-005', name: 'ALMACEN', permissions: ['INVENTORY', 'PRODUCTS'] }
];

export const INITIAL_USERS = [
  { id: 'USR-001', username: 'admin', name: 'Ing. Johan Silva', role: 'ADMINISTRADOR', email: 'admin@salesia.pe' },
  { id: 'USR-002', username: 'gerente', name: 'Lic. Carlos Mendoza', role: 'GERENTE', email: 'gerente@salesia.pe' },
  { id: 'USR-003', username: 'vendedor', name: 'Valeria Quispe', role: 'VENDEDOR', email: 'ventas@salesia.pe' },
  { id: 'USR-004', username: 'analista', name: 'Diego Torres', role: 'ANALISTA', email: 'analitica@salesia.pe' },
  { id: 'USR-005', username: 'almacen', name: 'Marco Ramos', role: 'ALMACEN', email: 'almacen@salesia.pe' }
];

export const INITIAL_SELLERS = [
  { id: 'SELL-001', name: 'Valeria Quispe', email: 'vquispe@salesia.pe', targetMonthly: 60000, commissionRate: 0.03 },
  { id: 'SELL-002', name: 'Renato Cárdenas', email: 'rcardenas@salesia.pe', targetMonthly: 50000, commissionRate: 0.03 },
  { id: 'SELL-003', name: 'Lucía Fernández', email: 'lfernandez@salesia.pe', targetMonthly: 70000, commissionRate: 0.035 },
  { id: 'SELL-004', name: 'Jorge Benítez', email: 'jbenitez@salesia.pe', targetMonthly: 45000, commissionRate: 0.025 }
];

export const INITIAL_CATEGORIES = [
  { id: 'CAT-001', name: 'Cómputo & Laptops', description: 'Equipos portátiles corporativos de alto desempeño' },
  { id: 'CAT-002', name: 'Monitores & Pantallas', description: 'Displays profesionales alta resolución 4K/UHD' },
  { id: 'CAT-003', name: 'Servidores & Redes', description: 'Infraestructura de red, servidores y switches administrables' },
  { id: 'CAT-004', name: 'Periféricos & Accesorios', description: 'Teclados mecánicos, ratones ergonómicos y hubs' },
  { id: 'CAT-005', name: 'Impresión & Escaneo', description: 'Equipos multifuncionales y consumibles eco-tank' },
  { id: 'CAT-006', name: 'Energía & Protección', description: 'Sistemas UPS interactivos y acondicionadores de línea' }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'PROD-001',
    sku: 'LAP-DELL-XPS13',
    name: 'Dell XPS 13 Ultrabook Core i7 16GB 512GB SSD',
    categoryId: 'CAT-001',
    categoryName: 'Cómputo & Laptops',
    price: 4850.00,
    cost: 3900.00,
    stock: 24,
    minStock: 5,
    unit: 'UND',
    status: 'ACTIVE'
  },
  {
    id: 'PROD-002',
    sku: 'MON-LG-274K',
    name: 'Monitor LG UltraFine 27" 4K UHD IPS HDR400',
    categoryId: 'CAT-002',
    categoryName: 'Monitores & Pantallas',
    price: 1650.00,
    cost: 1250.00,
    stock: 35,
    minStock: 8,
    unit: 'UND',
    status: 'ACTIVE'
  },
  {
    id: 'PROD-003',
    sku: 'SER-SRV-LENOVO',
    name: 'Servidor Lenovo ThinkSystem ST50 Xeon 32GB',
    categoryId: 'CAT-003',
    categoryName: 'Servidores & Redes',
    price: 6900.00,
    cost: 5500.00,
    stock: 12,
    minStock: 3,
    unit: 'UND',
    status: 'ACTIVE'
  },
  {
    id: 'PROD-004',
    sku: 'ACC-LOGI-MXM3',
    name: 'Mouse Inalámbrico Logitech MX Master 3S',
    categoryId: 'CAT-004',
    categoryName: 'Periféricos & Accesorios',
    price: 420.00,
    cost: 290.00,
    stock: 60,
    minStock: 15,
    unit: 'UND',
    status: 'ACTIVE'
  },
  {
    id: 'PROD-005',
    sku: 'ACC-LOGI-MXKEY',
    name: 'Teclado Mecánico Logitech MX Mechanical Wireless',
    categoryId: 'CAT-004',
    categoryName: 'Periféricos & Accesorios',
    price: 580.00,
    cost: 410.00,
    stock: 45,
    minStock: 10,
    unit: 'UND',
    status: 'ACTIVE'
  },
  {
    id: 'PROD-006',
    sku: 'NET-CISCO-SW24',
    name: 'Switch Administrable Cisco Gigabit 24 Puertos PoE',
    categoryId: 'CAT-003',
    categoryName: 'Servidores & Redes',
    price: 2450.00,
    cost: 1950.00,
    stock: 18,
    minStock: 4,
    unit: 'UND',
    status: 'ACTIVE'
  },
  {
    id: 'PROD-007',
    sku: 'IMP-EPSON-L6270',
    name: 'Impresora Multifuncional Epson EcoTank L6270 Wi-Fi',
    categoryId: 'CAT-005',
    categoryName: 'Impresión & Escaneo',
    price: 1390.00,
    cost: 1050.00,
    stock: 22,
    minStock: 6,
    unit: 'UND',
    status: 'ACTIVE'
  },
  {
    id: 'PROD-008',
    sku: 'UPS-APC-1500VA',
    name: 'Sistema UPS APC Smart-UPS 1500VA LCD 230V',
    categoryId: 'CAT-006',
    categoryName: 'Energía & Protección',
    price: 1850.00,
    cost: 1420.00,
    stock: 16,
    minStock: 4,
    unit: 'UND',
    status: 'ACTIVE'
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: 'CUST-001',
    docType: 'RUC',
    docNumber: '20601234567',
    name: 'Tech Solutions Global S.A.C.',
    segment: 'Corporativo',
    email: 'contacto@techsolutions.pe',
    phone: '+51 987 654 321',
    creditLimit: 50000.00,
    registeredAt: '2026-01-10T08:30:00.000Z'
  },
  {
    id: 'CUST-002',
    docType: 'RUC',
    docNumber: '20559876543',
    name: 'Inversiones y Servicios del Pacífico E.I.R.L.',
    segment: 'Pyme',
    email: 'compras@inversionespacifico.pe',
    phone: '+51 971 123 456',
    creditLimit: 25000.00,
    registeredAt: '2026-02-14T10:15:00.000Z'
  },
  {
    id: 'CUST-003',
    docType: 'DNI',
    docNumber: '46781290',
    name: 'Dr. Alejandro Morales Benavides',
    segment: 'Profesional',
    email: 'alejandro.morales@clinica.pe',
    phone: '+51 955 887 766',
    creditLimit: 10000.00,
    registeredAt: '2026-03-01T14:45:00.000Z'
  },
  {
    id: 'CUST-004',
    docType: 'RUC',
    docNumber: '20498877661',
    name: 'Constructora & Logística Andina S.A.',
    segment: 'Corporativo',
    email: 'logistica@constructoraandina.com',
    phone: '+51 944 332 211',
    creditLimit: 80000.00,
    registeredAt: '2026-03-18T11:20:00.000Z'
  }
];
