import type { AppConfig, EntitySchema, FieldSchema, SectorPreset, WidgetConfig } from '../types'
import { slug, pluralize } from '../lib/utils'

const f = (key: string, label: string, type: FieldSchema['type'], extra: Partial<FieldSchema> = {}): FieldSchema => ({
  key,
  label,
  type,
  ...extra,
})

const ent = (
  id: string,
  name: string,
  icon: string,
  fields: FieldSchema[],
  isPosCatalog = false,
): EntitySchema => ({
  id,
  name,
  pluralName: pluralize(name),
  icon,
  fields,
  isPosCatalog,
})

const statusBadge = (options: string[], tones: FieldSchema['statuses'] = []) => ({
  type: 'status-badge' as const,
  options,
  statuses: tones,
})

const categoriesEntity = (): EntitySchema =>
  ent('categories', 'Category', 'tag', [
    f('name', 'Name', 'text', { required: true }),
    f('description', 'Description', 'textarea'),
    f('color', 'Color', 'text', { placeholder: '#6366f1' }),
    { key: 'active', label: 'Active', type: 'checkbox' },
  ])

export const APP_SECTORS: Record<string, SectorPreset> = {
  supermarket: {
    id: 'supermarket',
    label: 'Supermarket & Grocery',
    icon: 'cart',
    description: 'Products, inventory, suppliers, rapid POS.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos'],
    posEntityId: 'products',
    entities: [
      ent('products', 'Product', 'box', [
        f('name', 'Name', 'text', { required: true }),
        f('sku', 'SKU', 'text'),
        f('category', 'Category', 'select', { entityRef: 'categories' }),
        f('price', 'Price', 'number', { required: true }),
        f('stock', 'Stock', 'number', { required: true }),
        f('active', 'Active', 'checkbox'),
      ], true),
      categoriesEntity(),
      ent('suppliers', 'Supplier', 'truck', [
        f('name', 'Name', 'text', { required: true }),
        f('contact', 'Contact', 'text'),
        f('email', 'Email', 'email'),
      ]),
      ent('customers', 'Customer', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('email', 'Email', 'email'),
        f('phone', 'Phone', 'text'),
        f('address', 'Address', 'text'),
        f('customerType', 'Customer Type', 'select', { options: ['Regular', 'VIP', 'Wholesale'] }),
        f('loyaltyPoints', 'Loyalty Points', 'number'),
        f('notes', 'Notes', 'textarea'),
      ]),
      ent('sales', 'Sale', 'receipt', [
        f('customer', 'Customer', 'text', { required: true }),
        f('total', 'Total', 'number', { required: true }),
        f('date', 'Date', 'date', { required: true }),
        f('payment', 'Payment', 'select', { options: ['Cash', 'Card', 'Credit'] }),
      ]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Total Products', metric: 'count:products' },
      { id: 'w2', kind: 'alert', title: 'Low Stock', metric: 'countWhere:products.stock.lt.10' },
      { id: 'w3', kind: 'stats', title: 'Total Sales', metric: 'sum:sales.total' },
      { id: 'w4', kind: 'chart', title: 'Sales (7d)', metric: 'series7:sales.date' },
      { id: 'w5', kind: 'list', title: 'Recent Sales', metric: 'recent:sales.5' },
    ],
  },

  grocery: {
    id: 'grocery',
    label: 'Grocery Store',
    icon: 'cart',
    description: 'Bakery, produce, simple inventory and fast checkout.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos'],
    posEntityId: 'products',
    entities: [
      ent('products', 'Product', 'box', [
        f('name', 'Name', 'text', { required: true }),
        f('category', 'Category', 'select', { entityRef: 'categories' }),
        f('price', 'Price', 'number', { required: true }),
        f('stock', 'Stock', 'number', { required: true }),
        f('active', 'Active', 'checkbox'),
      ], true),
      categoriesEntity(),
      ent('suppliers', 'Supplier', 'truck', [f('name', 'Name', 'text', { required: true }), f('contact', 'Contact', 'text'), f('email', 'Email', 'email')]),
      ent('customers', 'Customer', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('phone', 'Phone', 'text'),
        f('email', 'Email', 'email'),
        f('customerType', 'Customer Type', 'select', { options: ['Regular', 'VIP', 'Wholesale'] }),
        f('loyaltyPoints', 'Loyalty Points', 'number'),
        f('notes', 'Notes', 'textarea'),
      ]),
      ent('sales', 'Sale', 'receipt', [
        f('customer', 'Customer', 'text'),
        f('total', 'Total', 'number', { required: true }),
        f('date', 'Date', 'date', { required: true }),
        f('payment', 'Payment', 'select', { options: ['Cash', 'Card', 'Wallet'] }),
      ]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Products', metric: 'count:products' },
      { id: 'w2', kind: 'alert', title: 'Low Stock', metric: 'countWhere:products.stock.lt.10' },
      { id: 'w3', kind: 'stats', title: 'Sales', metric: 'sum:sales.total' },
      { id: 'w4', kind: 'list', title: 'Recent Sales', metric: 'recent:sales.5' },
    ],
  },

  pharmacy: {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: 'pill',
    description: 'Batch numbers, expiry, classifications, prescriptions.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos'],
    posEntityId: 'products',
    entities: [
      ent('products', 'Medicine', 'pill', [
        f('name', 'Name', 'text', { required: true }),
        f('batch', 'Batch No.', 'text'),
        f('expiry', 'Expiry Date', 'date'),
        f('classification', 'Class', 'select', { options: ['OTC', 'Prescription', 'Controlled'] }),
        f('price', 'Price', 'number', { required: true }),
        f('stock', 'Stock', 'number', { required: true }),
      ], true),
      ent('suppliers', 'Supplier', 'truck', [f('name', 'Name', 'text', { required: true }), f('email', 'Email', 'email')]),
      ent('prescriptions', 'Prescription', 'file', [
        f('patient', 'Patient', 'text', { required: true }),
        f('doctor', 'Doctor', 'text'),
        f('medication', 'Medication', 'text'),
        f('date', 'Date', 'date'),
        f('attachment', 'Attachment', 'file-upload'),
      ]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Medicines', metric: 'count:products' },
      { id: 'w2', kind: 'alert', title: 'Low Stock', metric: 'countWhere:products.stock.lt.10' },
      { id: 'w3', kind: 'list', title: 'Recent Prescriptions', metric: 'recent:prescriptions.5' },
    ],
  },

  apparel: {
    id: 'apparel',
    label: 'Apparel & Fashion',
    icon: 'shirt',
    description: 'Item variations (size/color), matrix inventory.',
    features: { auth: true, reports: true, pos: true, rbac: false },
    views: ['pos'],
    posEntityId: 'products',
    entities: [
      ent('products', 'Product', 'shirt', [
        f('name', 'Name', 'text', { required: true }),
        f('variants', 'Variants', 'variants', { variantKeys: ['Size', 'Color'] }),
        f('brand', 'Brand', 'text'),
        f('season', 'Season', 'select', { options: ['Spring', 'Summer', 'Autumn', 'Winter'] }),
        f('price', 'Price', 'number', { required: true }),
        f('stock', 'Stock', 'number', { required: true }),
      ], true),
      ent('customers', 'Customer', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('email', 'Email', 'email'),
        f('phone', 'Phone', 'text'),
        f('size', 'Preferred Size', 'text'),
        f('customerType', 'Customer Type', 'select', { options: ['Regular', 'VIP', 'Wholesale'] }),
        f('notes', 'Notes', 'textarea'),
      ]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Products', metric: 'count:products' },
      { id: 'w2', kind: 'list', title: 'Recent Products', metric: 'recent:products.5' },
      { id: 'w3', kind: 'chart', title: 'By Season', metric: 'seriesBy:products.season' },
    ],
  },

  restaurant: {
    id: 'restaurant',
    label: 'Restaurants & Cafes',
    icon: 'utensils',
    description: 'Table map, fast-touch POS, KDS, split billing.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos', 'tablemap'],
    posEntityId: 'menu',
    tableMap: { count: 12, label: 'Table' },
    entities: [
      ent('menu', 'Menu Item', 'utensils', [
        f('name', 'Name', 'text', { required: true }),
        f('price', 'Price', 'number', { required: true }),
        f('category', 'Category', 'select', { entityRef: 'categories' }),
        f('description', 'Description', 'textarea'),
      ], true),
      categoriesEntity(),
      ent('orders', 'Order', 'receipt', [
        f('table', 'Table', 'text'),
        f('items', 'Items', 'textarea', { required: true }),
        f('total', 'Total', 'number', { required: true }),
        f('status', 'Status', 'status-badge', statusBadge(['Open', 'Preparing', 'Served', 'Paid'], [
          { value: 'Open', label: 'Open', tone: 'amber' },
          { value: 'Preparing', label: 'Preparing', tone: 'indigo' },
          { value: 'Served', label: 'Served', tone: 'green' },
          { value: 'Paid', label: 'Paid', tone: 'slate' },
        ])),
        f('date', 'Date', 'date'),
      ]),
      ent('customers', 'Customer', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('phone', 'Phone', 'text'),
        f('email', 'Email', 'email'),
        f('customerType', 'Customer Type', 'select', { options: ['Regular', 'VIP', 'Wholesale'] }),
        f('notes', 'Notes', 'textarea'),
      ]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Open Orders', metric: 'countWhere:orders.status.eq.Open' },
      { id: 'w2', kind: 'stats', title: 'Revenue', metric: 'sum:orders.total' },
      { id: 'w3', kind: 'chart', title: 'Orders (7d)', metric: 'series7:orders.date' },
      { id: 'w4', kind: 'list', title: 'Recent Orders', metric: 'recent:orders.5' },
    ],
  },

  hotel: {
    id: 'hotel',
    label: 'Hotels & Hospitality',
    icon: 'bed',
    description: 'Room grid, check-in/out, guest folios.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos', 'tablemap', 'calendar'],
    posEntityId: 'services',
    tableMap: { count: 14, label: 'Room' },
    calendarEntityId: 'bookings',
    entities: [
      ent('rooms', 'Room', 'bed', [
        f('number', 'Number', 'text', { required: true }),
        f('type', 'Type', 'select', { options: ['Single', 'Double', 'Suite'] }),
        f('rate', 'Rate', 'number', { required: true }),
        f('status', 'Status', 'status-badge', statusBadge(['Available', 'Occupied', 'Maintenance'], [
          { value: 'Available', label: 'Available', tone: 'green' },
          { value: 'Occupied', label: 'Occupied', tone: 'red' },
          { value: 'Maintenance', label: 'Maintenance', tone: 'amber' },
        ])),
      ]),
      ent('guests', 'Guest', 'users', [f('name', 'Name', 'text', { required: true }), f('email', 'Email', 'email'), f('phone', 'Phone', 'text')]),
      ent('bookings', 'Booking', 'calendar', [
        f('guest', 'Guest', 'text', { required: true }),
        f('room', 'Room', 'text'),
        f('checkin', 'Check-in', 'date', { required: true }),
        f('checkout', 'Check-out', 'date'),
        f('status', 'Status', 'select', { options: ['Confirmed', 'Checked-in', 'Checked-out'] }),
      ]),
      ent('services', 'Service', 'sparkles', [
        f('name', 'Name', 'text', { required: true }),
        f('price', 'Price', 'number', { required: true }),
      ], true),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Guests', metric: 'count:guests' },
      { id: 'w2', kind: 'stats', title: 'Bookings', metric: 'count:bookings' },
      { id: 'w3', kind: 'list', title: 'Recent Bookings', metric: 'recent:bookings.5' },
      { id: 'w4', kind: 'chart', title: 'By Room Type', metric: 'seriesBy:rooms.type' },
    ],
  },

  repair: {
    id: 'repair',
    label: 'Repair & Maintenance',
    icon: 'wrench',
    description: 'Ticket lifecycle, technician assignment, spare parts.',
    features: { auth: true, reports: true, pos: false, rbac: true },
    views: ['kanban'],
    kanbanEntityId: 'repairTickets',
    entities: [
      ent('customers', 'Customer', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('email', 'Email', 'email'),
        f('phone', 'Phone', 'text'),
        f('bornOn', 'Date of Birth', 'date'),
        f('customerType', 'Customer Type', 'select', { options: ['Regular', 'VIP', 'Wholesale'] }),
        f('visits', 'Visits', 'number'),
        f('notes', 'Notes', 'textarea'),
      ]),
      ent('devices', 'Device', 'cpu', [f('customer', 'Customer', 'text'), f('type', 'Type', 'select', { options: ['Phone', 'Laptop', 'Tablet'] }), f('brand', 'Brand', 'text')]),
      ent('repairTickets', 'Repair Ticket', 'wrench', [
        f('device', 'Device', 'text', { required: true }),
        f('issue', 'Issue', 'textarea', { required: true }),
        f('status', 'Status', 'status-badge', statusBadge(['Open', 'In Progress', 'Done', 'Cancelled'], [
          { value: 'Open', label: 'Open', tone: 'amber' },
          { value: 'In Progress', label: 'In Progress', tone: 'indigo' },
          { value: 'Done', label: 'Done', tone: 'green' },
          { value: 'Cancelled', label: 'Cancelled', tone: 'slate' },
        ])),
        f('cost', 'Cost', 'number'),
        f('tech', 'Technician', 'text'),
        f('date', 'Date', 'date'),
      ]),
      ent('technicians', 'Technician', 'users', [f('name', 'Name', 'text', { required: true }), f('specialty', 'Specialty', 'select', { options: ['Phones', 'Laptops'] }), f('available', 'Available', 'checkbox')]),
      ent('payments', 'Payment', 'credit-card', [f('ticket', 'Ticket', 'text'), f('amount', 'Amount', 'number', { required: true }), f('date', 'Date', 'date')]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Active Tickets', metric: 'countWhere:repairTickets.status.eq.Open' },
      { id: 'w2', kind: 'stats', title: 'Revenue', metric: 'sum:payments.amount' },
      { id: 'w3', kind: 'chart', title: 'Payments (7d)', metric: 'series7:payments.date' },
      { id: 'w4', kind: 'table', title: 'Open Tickets', metric: 'countWhere:repairTickets.status.eq.Open' },
    ],
  },

  salon: {
    id: 'salon',
    label: 'Salons & Spa',
    icon: 'scissors',
    description: 'Staff schedules, booking slots, service packages.',
    features: { auth: true, reports: true, pos: true, rbac: false },
    views: ['pos', 'calendar'],
    posEntityId: 'services',
    calendarEntityId: 'appointments',
    entities: [
      ent('services', 'Service', 'sparkles', [
        f('name', 'Name', 'text', { required: true }),
        f('price', 'Price', 'number', { required: true }),
        f('duration', 'Duration (min)', 'number'),
        f('category', 'Category', 'select', { entityRef: 'categories' }),
      ], true),
      categoriesEntity(),
      ent('staff', 'Staff', 'users', [f('name', 'Name', 'text', { required: true }), f('schedule', 'Schedule', 'text')]),
      ent('appointments', 'Appointment', 'calendar', [
        f('customer', 'Customer', 'text', { required: true }),
        f('service', 'Service', 'text'),
        f('datetime', 'When', 'datetime-local', { required: true }),
        f('staff', 'Staff', 'text'),
        f('status', 'Status', 'select', { options: ['Booked', 'Completed', 'Cancelled'] }),
      ]),
      ent('customers', 'Customer', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('phone', 'Phone', 'text'),
        f('email', 'Email', 'email'),
        f('bornOn', 'Date of Birth', 'date'),
        f('customerType', 'Customer Type', 'select', { options: ['Regular', 'VIP', 'Wholesale'] }),
        f('visits', 'Visits', 'number'),
        f('notes', 'Notes', 'textarea'),
      ]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Appointments', metric: 'count:appointments' },
      { id: 'w2', kind: 'chart', title: 'By Service', metric: 'seriesBy:appointments.service' },
      { id: 'w3', kind: 'list', title: 'Recent Appointments', metric: 'recent:appointments.5' },
    ],
  },

  barbershop: {
    id: 'barbershop',
    label: 'Barbershop & Grooming',
    icon: 'scissors',
    description: 'Haircuts, shaves, barber rota, appointments.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos', 'calendar'],
    posEntityId: 'services',
    calendarEntityId: 'appointments',
    entities: [
      ent('services', 'Service', 'sparkles', [
        f('name', 'Name', 'text', { required: true }),
        f('price', 'Price', 'number', { required: true }),
        f('duration', 'Duration (min)', 'number'),
        f('category', 'Category', 'select', { entityRef: 'categories' }),
      ], true),
      categoriesEntity(),
      ent('barbers', 'Barber', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('phone', 'Phone', 'text'),
        f('specialty', 'Specialty', 'select', { options: ['Haircut', 'Beard', 'Color', 'All'] }),
        f('available', 'Available', 'checkbox'),
      ]),
      ent('appointments', 'Appointment', 'calendar', [
        f('barber', 'Barber', 'text', { required: true }),
        f('service', 'Service', 'text'),
        f('datetime', 'When', 'datetime-local', { required: true }),
        f('status', 'Status', 'select', { options: ['Booked', 'In Progress', 'Completed', 'Cancelled'] }),
      ]),
      ent('customers', 'Customer', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('phone', 'Phone', 'text'),
        f('email', 'Email', 'email'),
        f('bornOn', 'Date of Birth', 'date'),
        f('preferredBarber', 'Preferred Barber', 'text'),
        f('visits', 'Visits', 'number'),
        f('notes', 'Notes', 'textarea'),
      ]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Appointments', metric: 'count:appointments' },
      { id: 'w2', kind: 'stats', title: 'Barbers', metric: 'count:barbers' },
      { id: 'w3', kind: 'chart', title: 'Appointments (7d)', metric: 'series7:appointments.datetime' },
      { id: 'w4', kind: 'list', title: 'Recent Appointments', metric: 'recent:appointments.5' },
    ],
  },

  gaming: {
    id: 'gaming',
    label: 'Gaming Lounge',
    icon: 'gamepad',
    description: 'Session timers, device metering, snack POS.',
    features: { auth: true, reports: true, pos: true, rbac: false },
    views: ['pos', 'tablemap'],
    posEntityId: 'snacks',
    tableMap: { count: 10, label: 'Station' },
    entities: [
      ent('devices', 'Device', 'gamepad', [
        f('name', 'Name', 'text', { required: true }),
        f('ratePerHour', 'Rate/Hr', 'number', { required: true }),
        f('type', 'Type', 'select', { options: ['Console', 'PC', 'VR'] }),
      ]),
      ent('sessions', 'Session', 'timer', [
        f('device', 'Device', 'text', { required: true }),
        f('player', 'Player', 'text'),
        f('start', 'Start', 'datetime-local'),
        f('elapsed', 'Elapsed (min)', 'timer', { ratePerHour: 5 }),
        f('status', 'Status', 'status-badge', statusBadge(['Active', 'Closed'], [
          { value: 'Active', label: 'Active', tone: 'green' },
          { value: 'Closed', label: 'Closed', tone: 'slate' },
        ])),
      ]),
      ent('snacks', 'Snack', 'box', [
        f('name', 'Name', 'text', { required: true }),
        f('price', 'Price', 'number', { required: true }),
      ], true),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Devices', metric: 'count:devices' },
      { id: 'w2', kind: 'stats', title: 'Active Sessions', metric: 'countWhere:sessions.status.eq.Active' },
      { id: 'w3', kind: 'list', title: 'Recent Sessions', metric: 'recent:sessions.5' },
    ],
  },

  gym: {
    id: 'gym',
    label: 'Gyms & Fitness',
    icon: 'dumbbell',
    description: 'Membership plans, renewals, check-ins.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos'],
    posEntityId: 'plans',
    entities: [
      ent('plans', 'Plan', 'dumbbell', [
        f('name', 'Name', 'text', { required: true }),
        f('price', 'Price', 'number', { required: true }),
        f('period', 'Period', 'select', { options: ['Monthly', 'Quarterly', 'Yearly'] }),
      ], true),
      ent('members', 'Member', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('email', 'Email', 'email'),
        f('phone', 'Phone', 'text'),
        f('plan', 'Plan', 'select', { entityRef: 'plans' }),
        f('renewal', 'Renewal', 'date'),
        f('memberType', 'Member Type', 'select', { options: ['Regular', 'Premium', 'Annual'] }),
        f('notes', 'Notes', 'textarea'),
      ]),
      ent('checkins', 'Check-in', 'clock', [f('member', 'Member', 'text', { required: true }), f('date', 'Date', 'date'), f('time', 'Time', 'time')]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Members', metric: 'count:members' },
      { id: 'w2', kind: 'chart', title: 'Check-ins (7d)', metric: 'series7:checkins.date' },
      { id: 'w3', kind: 'list', title: 'Recent Members', metric: 'recent:members.5' },
    ],
  },

  clinic: {
    id: 'clinic',
    label: 'Clinics & Healthcare',
    icon: 'stethoscope',
    description: 'Doctors, records, scheduling, prescriptions.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos', 'calendar'],
    posEntityId: 'services',
    calendarEntityId: 'appointments',
    entities: [
      ent('doctors', 'Doctor', 'stethoscope', [f('name', 'Name', 'text', { required: true }), f('specialty', 'Specialty', 'text')]),
      ent('patients', 'Patient', 'users', [
        f('name', 'Name', 'text', { required: true }),
        f('email', 'Email', 'email'),
        f('phone', 'Phone', 'text'),
        f('bornOn', 'Date of Birth', 'date'),
        f('bloodType', 'Blood Type', 'select', { options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] }),
        f('allergies', 'Allergies', 'textarea'),
        f('medicalHistory', 'Medical History', 'textarea'),
      ]),
      ent('appointments', 'Appointment', 'calendar', [
        f('patient', 'Patient', 'text', { required: true }),
        f('doctor', 'Doctor', 'text'),
        f('datetime', 'When', 'datetime-local', { required: true }),
        f('status', 'Status', 'select', { options: ['Scheduled', 'Done', 'Cancelled'] }),
      ]),
      ent('prescriptions', 'Prescription', 'file', [f('patient', 'Patient', 'text'), f('medication', 'Medication', 'text'), f('date', 'Date', 'date'), f('attachment', 'Attachment', 'file-upload')]),
      ent('services', 'Service', 'sparkles', [f('name', 'Name', 'text', { required: true }), f('price', 'Price', 'number', { required: true })]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Patients', metric: 'count:patients' },
      { id: 'w2', kind: 'chart', title: 'By Doctor', metric: 'seriesBy:appointments.doctor' },
      { id: 'w3', kind: 'list', title: 'Recent Appointments', metric: 'recent:appointments.5' },
    ],
  },

  education: {
    id: 'education',
    label: 'Education & Academies',
    icon: 'graduation-cap',
    description: 'Courses, enrollments, attendance, batch invoicing.',
    features: { auth: true, reports: true, pos: true, rbac: true },
    views: ['pos'],
    posEntityId: 'fees',
    entities: [
      ent('courses', 'Course', 'book', [f('title', 'Title', 'text', { required: true }), f('code', 'Code', 'text'), f('teacher', 'Teacher', 'text')]),
      ent('students', 'Student', 'users', [f('name', 'Name', 'text', { required: true }), f('email', 'Email', 'email'), f('grade', 'Grade', 'number')]),
      ent('instructors', 'Instructor', 'users', [f('name', 'Name', 'text', { required: true }), f('subject', 'Subject', 'text')]),
      ent('enrollments', 'Enrollment', 'book', [f('student', 'Student', 'text', { required: true }), f('course', 'Course', 'text'), f('date', 'Date', 'date')]),
      ent('fees', 'Fee', 'receipt', [f('name', 'Name', 'text', { required: true }), f('amount', 'Amount', 'number', { required: true })]),
    ],
    dashboard: [
      { id: 'w1', kind: 'stats', title: 'Students', metric: 'count:students' },
      { id: 'w2', kind: 'stats', title: 'Revenue', metric: 'sum:fees.amount' },
      { id: 'w3', kind: 'chart', title: 'Fees (7d)', metric: 'series7:fees.date' },
      { id: 'w4', kind: 'list', title: 'Recent Enrollments', metric: 'recent:enrollments.5' },
    ],
  },

  custom: {
    id: 'custom',
    label: 'Custom Application',
    icon: 'layers',
    description: 'Start empty and define your own entities.',
    features: { auth: true, reports: true, pos: false, rbac: false },
    views: [],
    entities: [],
    dashboard: [],
  },
}

export const SECTOR_LIST = Object.values(APP_SECTORS)

export function buildConfig(opts: {
  appName: string
  sector: string
  entityIds: string[]
  customEntities: EntitySchema[]
  features: { auth: boolean; reports: boolean; pos: boolean; rbac: boolean }
}): AppConfig {
  const base = APP_SECTORS[opts.sector] || APP_SECTORS.custom
  let entities = opts.sector === 'custom' ? [] : base.entities.filter((e) => opts.entityIds.includes(e.id))
  entities = entities.concat(opts.customEntities)

  let dashboard = base.dashboard
  if (opts.sector === 'custom') {
    dashboard = entities.flatMap((e) => [
      { id: 's-' + e.id, kind: 'stats' as const, title: 'Total ' + e.pluralName, metric: 'count:' + e.id },
      { id: 'l-' + e.id, kind: 'list' as const, title: 'Recent ' + e.pluralName, metric: 'recent:' + e.id + '.5' },
    ])
  }

  return {
    appName: opts.appName,
    sector: opts.sector,
    entities,
    features: opts.features,
    views: base.views,
    dashboard,
    posEntityId: base.posEntityId,
    tableMap: base.tableMap,
    calendarEntityId: base.calendarEntityId,
    kanbanEntityId: base.kanbanEntityId,
    createdAt: new Date().toISOString(),
  }
}

export function customEntity(name: string): EntitySchema {
  const id = slug(name) || 'entity-' + Date.now()
  return {
    id,
    name,
    pluralName: pluralize(name),
    icon: 'tag',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  }
}

/** Entities injected on top of a sector preset based on the user's feature flags. */
export function featureEntities(flags: Partial<AppConfig['featureFlags']> = {}): EntitySchema[] {
  const out: EntitySchema[] = []

  const branches = flags.branches
  if (branches && branches !== 'none') {
    out.push(
      ent('branches', 'Branch', 'warehouse', [
        f('name', 'Name', 'text', { required: true }),
        f('address', 'Address', 'text'),
        f('phone', 'Phone', 'text'),
        f('manager', 'Manager', 'text'),
        f('active', 'Active', 'checkbox'),
      ]),
    )
  }

  const purchasing = flags.purchasing
  if (purchasing && purchasing !== 'none') {
    out.push(
      ent('purchaseOrders', 'Purchase Order', 'truck', [
        f('supplier', 'Supplier', 'text', { required: true }),
        f('total', 'Total', 'number', { required: true }),
        f('date', 'Date', 'date', { required: true }),
        f('status', 'Status', 'status-badge', statusBadge(['Draft', 'Pending', 'Approved', 'Received', 'Rejected'], [
          { value: 'Draft', label: 'Draft', tone: 'slate' },
          { value: 'Pending', label: 'Pending', tone: 'amber' },
          { value: 'Approved', label: 'Approved', tone: 'green' },
          { value: 'Received', label: 'Received', tone: 'green' },
          { value: 'Rejected', label: 'Rejected', tone: 'red' },
        ])),
      ]),
    )
  }

  const inventory = flags.inventory
  if (inventory === 'advanced') {
    out.push(
      ent('warehouses', 'Warehouse', 'box', [
        f('name', 'Name', 'text', { required: true }),
        f('location', 'Location', 'text'),
      ]),
      ent('stockMovements', 'Stock Movement', 'box', [
        f('product', 'Product', 'text', { required: true }),
        f('type', 'Type', 'select', { options: ['In', 'Out', 'Adjust'] }),
        f('qty', 'Quantity', 'number', { required: true }),
        f('date', 'Date', 'date', { required: true }),
        f('note', 'Note', 'text'),
      ]),
    )
  }

  return out
}

/** Merge feature entities into an existing entity list (dedup by id, keep catalog flag). */
export function mergeFeatureEntities(entities: EntitySchema[], flags: Partial<AppConfig['featureFlags']> = {}): EntitySchema[] {
  const extras = featureEntities(flags).filter((e) => !entities.some((x) => x.id === e.id))
  return [...entities, ...extras]
}
