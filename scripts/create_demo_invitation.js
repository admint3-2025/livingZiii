const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const db = new Database('data/ziii_living_dev.sqlite');
const id = randomUUID();
const now = new Date();
const from = new Date(now.getTime() + 10 * 60 * 1000);
const until = new Date(now.getTime() + 4 * 60 * 60 * 1000);

const fmt = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
const qr = `ZIILIVING-DEMO-QR-${id}`;

const sql = `
  INSERT INTO visit_invitations (
    id,
    propertyId,
    unitId,
    visitorName,
    visitorPhone,
    visitorEmail,
    purpose,
    validFrom,
    validUntil,
    status,
    createdBy,
    approvedBy,
    approvedAt,
    accessControlPassId,
    qrCode,
    pinCode,
    metadata,
    createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

db.prepare(sql).run(
  id,
  '6f3e2af9-1b7e-4e44-bd63-3d86c4ab1001',
  '6f3e2af9-1b7e-4e44-bd63-3d86c4ab2001',
  'Demo QR ZIII Living',
  '5550001122',
  'demo.visita@ziiiliving.local',
  'Prueba visual de pase movil',
  fmt(from),
  fmt(until),
  'approved',
  'e1d66f08-fccf-4d2e-8397-7910679bcb1a',
  'e1d66f08-fccf-4d2e-8397-7910679bcb1a',
  fmt(now),
  `demo-pass-${id.slice(0, 8)}`,
  qr,
  '4821',
  JSON.stringify({
    comment: 'Demo visual generada por Codex',
    allowedDoors: ['Puerta principal', 'Lobby', 'Estacionamiento'],
    maxEntries: 1,
    unitLabel: 'Torre A - Depto 301',
  }),
  fmt(now),
);

console.log(id);
