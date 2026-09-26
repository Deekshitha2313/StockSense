import { PrismaClient, Role, DocStatus, DocType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense realistic database seed...');

  await prisma.stockLedger.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.deliveryOrderItem.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.internalTransferItem.deleteMany();
  await prisma.internalTransfer.deleteMany();
  await prisma.stockAdjustmentItem.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const manager = await prisma.user.create({
    data: {
      name: 'Marcus Vance (Manager)',
      email: 'manager@stocksense.com',
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins (Logistics Staff)',
      email: 'staff@stocksense.com',
      passwordHash,
      role: Role.STAFF,
    },
  });

  console.log('✓ Seeded users: manager@stocksense.com and staff@stocksense.com');

  const catElectronics = await prisma.category.create({
    data: {
      name: 'Electronics & Components',
      description: 'Microcontrollers, sensors, power modules, and precision wiring',
    },
  });

  const catHardware = await prisma.category.create({
    data: {
      name: 'Industrial Hardware',
      description: 'Fasteners, valves, actuators, pneumatic fittings, and bearings',
    },
  });

  const catPackaging = await prisma.category.create({
    data: {
      name: 'Packaging & Logistics',
      description: 'Corrugated cartons, bubble liners, stretch film, and pallets',
    },
  });

  const catFacility = await prisma.category.create({
    data: {
      name: 'Office & Facility Supplies',
      description: 'Barcode labels, packing tape, thermal print heads, and markers',
    },
  });

  console.log('✓ Seeded 4 categories');

  const whMain = await prisma.warehouse.create({
    data: {
      name: 'Main Distribution Center',
      code: 'WH-MAIN',
      address: '100 Logistics Blvd, Chicago, IL 60601',
      locations: {
        create: [
          { name: 'Zone A - High Density Rack 01', code: 'LOC-A1', type: 'STORAGE' },
          { name: 'Zone A - High Density Rack 02', code: 'LOC-A2', type: 'STORAGE' },
          { name: 'Receiving Bay 01', code: 'LOC-REC1', type: 'RECEIVING' },
          { name: 'Shipping Staging 01', code: 'LOC-SHIP1', type: 'SHIPPING' },
        ],
      },
    },
    include: { locations: true },
  });

  const whWest = await prisma.warehouse.create({
    data: {
      name: 'West Coast Regional Hub',
      code: 'WH-WEST',
      address: '450 Pacific Terminal Way, Oakland, CA 94607',
      locations: {
        create: [
          { name: 'Aisle 1 - Bulk Storage', code: 'LOC-W1', type: 'STORAGE' },
          { name: 'Aisle 2 - Picking Shelf', code: 'LOC-W2', type: 'STORAGE' },
          { name: 'Inbound Staging Bay', code: 'LOC-WREC', type: 'RECEIVING' },
        ],
      },
    },
    include: { locations: true },
  });

  const locA1 = whMain.locations.find((l) => l.code === 'LOC-A1')!;
  const locA2 = whMain.locations.find((l) => l.code === 'LOC-A2')!;
  const locRec1 = whMain.locations.find((l) => l.code === 'LOC-REC1')!;
  const locW1 = whWest.locations.find((l) => l.code === 'LOC-W1')!;
  const locW2 = whWest.locations.find((l) => l.code === 'LOC-W2')!;

  console.log('✓ Seeded 2 warehouses and 7 locations');

  const p1 = await prisma.product.create({
    data: {
      sku: 'PRD-ELEC-001',
      name: 'Industrial Microcontroller PCB Rev-4',
      description: '32-bit ARM Cortex dual-core embedded control board with CAN-bus interface',
      categoryId: catElectronics.id,
      unitOfMeasure: 'pcs',
      price: 185.0,
      cost: 95.0,
      minStockThreshold: 50,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      sku: 'PRD-ELEC-002',
      name: 'Brushless Servo Motor 24V 3000RPM',
      description: 'High-torque precision robotic servo motor with integrated magnetic encoder',
      categoryId: catElectronics.id,
      unitOfMeasure: 'pcs',
      price: 320.0,
      cost: 175.0,
      minStockThreshold: 30,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      sku: 'PRD-HARD-001',
      name: 'Stainless Steel Hex Bolts M8 (Box of 500)',
      description: 'Marine-grade 316 stainless steel corrosion-resistant machine fasteners',
      categoryId: catHardware.id,
      unitOfMeasure: 'box',
      price: 45.0,
      cost: 22.0,
      minStockThreshold: 60,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      sku: 'PRD-HARD-002',
      name: 'Heavy Duty Pneumatic Cylinder 50mm Bore',
      description: 'Double-acting aluminum alloy air cylinder with magnetic cushion stroke',
      categoryId: catHardware.id,
      unitOfMeasure: 'pcs',
      price: 210.0,
      cost: 120.0,
      minStockThreshold: 20,
    },
  });

  const p5 = await prisma.product.create({
    data: {
      sku: 'PRD-PACK-001',
      name: 'Corrugated Shipping Box Heavy-Duty (Pack of 25)',
      description: 'ECT-44 heavy-duty double wall corrugated carton 18x14x12 inches',
      categoryId: catPackaging.id,
      unitOfMeasure: 'bundle',
      price: 65.0,
      cost: 32.0,
      minStockThreshold: 40,
    },
  });

  const p6 = await prisma.product.create({
    data: {
      sku: 'PRD-OFFC-001',
      name: 'Thermal Barcode Labels 4x6 (1000/roll)',
      description: 'Direct thermal permanent adhesive roll labels for industrial barcode printers',
      categoryId: catFacility.id,
      unitOfMeasure: 'roll',
      price: 18.5,
      cost: 8.5,
      minStockThreshold: 50,
    },
  });

  const p7 = await prisma.product.create({
    data: {
      sku: 'PRD-ELEC-003',
      name: 'Optical Time-of-Flight Distance Sensor',
      description: 'Millimeter-accuracy LiDAR sensor with I2C/UART output',
      categoryId: catElectronics.id,
      unitOfMeasure: 'pcs',
      price: 145.0,
      cost: 72.0,
      minStockThreshold: 35,
    },
  });

  console.log('✓ Seeded 7 products');

  const initialReceipt = await prisma.receipt.create({
    data: {
      receiptNumber: 'REC-202609-0001',
      supplierName: 'Apex Precision Technologies Corp.',
      supplierInvoice: 'INV-APEX-88912',
      status: DocStatus.DONE,
      destinationLocationId: locA1.id,
      notes: 'Initial inventory intake for Q3 production lines',
      createdById: manager.id,
      validatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: p1.id, quantityExpected: 120, quantityReceived: 120, locationId: locA1.id, unitPrice: 95.0 },
          { productId: p2.id, quantityExpected: 60, quantityReceived: 60, locationId: locA1.id, unitPrice: 175.0 },
          { productId: p3.id, quantityExpected: 150, quantityReceived: 150, locationId: locA1.id, unitPrice: 22.0 },
        ],
      },
    },
  });

  await prisma.stockLedger.createMany({
    data: [
      {
        productId: p1.id,
        locationId: locA1.id,
        quantityDelta: 120,
        balanceAfter: 120,
        referenceDocType: DocType.RECEIPT,
        referenceDocId: initialReceipt.id,
        referenceDocNumber: initialReceipt.receiptNumber,
        notes: 'Inbound receipt validation from Apex Precision',
        createdById: manager.id,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p2.id,
        locationId: locA1.id,
        quantityDelta: 60,
        balanceAfter: 60,
        referenceDocType: DocType.RECEIPT,
        referenceDocId: initialReceipt.id,
        referenceDocNumber: initialReceipt.receiptNumber,
        notes: 'Inbound receipt validation from Apex Precision',
        createdById: manager.id,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p3.id,
        locationId: locA1.id,
        quantityDelta: 150,
        balanceAfter: 150,
        referenceDocType: DocType.RECEIPT,
        referenceDocId: initialReceipt.id,
        referenceDocNumber: initialReceipt.receiptNumber,
        notes: 'Inbound receipt validation from Apex Precision',
        createdById: manager.id,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const westReceipt = await prisma.receipt.create({
    data: {
      receiptNumber: 'REC-202609-0002',
      supplierName: 'Global Packaging & Hardware Ltd',
      supplierInvoice: 'GPH-90021-US',
      status: DocStatus.DONE,
      destinationLocationId: locW1.id,
      notes: 'West coast baseline packaging and low stock item delivery',
      createdById: staff.id,
      validatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: p4.id, quantityExpected: 45, quantityReceived: 45, locationId: locW1.id, unitPrice: 120.0 },
          { productId: p5.id, quantityExpected: 100, quantityReceived: 100, locationId: locW1.id, unitPrice: 32.0 },
          { productId: p6.id, quantityExpected: 80, quantityReceived: 80, locationId: locW1.id, unitPrice: 8.5 },
          { productId: p7.id, quantityExpected: 12, quantityReceived: 12, locationId: locW1.id, unitPrice: 72.0 },
        ],
      },
    },
  });

  await prisma.stockLedger.createMany({
    data: [
      {
        productId: p4.id,
        locationId: locW1.id,
        quantityDelta: 45,
        balanceAfter: 45,
        referenceDocType: DocType.RECEIPT,
        referenceDocId: westReceipt.id,
        referenceDocNumber: westReceipt.receiptNumber,
        notes: 'Inbound receipt validation from Global Packaging',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p5.id,
        locationId: locW1.id,
        quantityDelta: 100,
        balanceAfter: 100,
        referenceDocType: DocType.RECEIPT,
        referenceDocId: westReceipt.id,
        referenceDocNumber: westReceipt.receiptNumber,
        notes: 'Inbound receipt validation from Global Packaging',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p6.id,
        locationId: locW1.id,
        quantityDelta: 80,
        balanceAfter: 80,
        referenceDocType: DocType.RECEIPT,
        referenceDocId: westReceipt.id,
        referenceDocNumber: westReceipt.receiptNumber,
        notes: 'Inbound receipt validation from Global Packaging',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p7.id,
        locationId: locW1.id,
        quantityDelta: 12,
        balanceAfter: 12,
        referenceDocType: DocType.RECEIPT,
        referenceDocId: westReceipt.id,
        referenceDocNumber: westReceipt.receiptNumber,
        notes: 'Low stock threshold item intake (12 units vs 35 min threshold)',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const transfer = await prisma.internalTransfer.create({
    data: {
      transferNumber: 'TRF-202609-0001',
      sourceLocationId: locA1.id,
      destinationLocationId: locA2.id,
      status: DocStatus.DONE,
      notes: 'Relocating microcontrollers and servo motors to picking rack 02',
      createdById: staff.id,
      executedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: p1.id, quantity: 30 },
          { productId: p2.id, quantity: 15 },
        ],
      },
    },
  });

  await prisma.stockLedger.createMany({
    data: [
      {
        productId: p1.id,
        locationId: locA1.id,
        quantityDelta: -30,
        balanceAfter: 90,
        referenceDocType: DocType.TRANSFER,
        referenceDocId: transfer.id,
        referenceDocNumber: transfer.transferNumber,
        notes: 'Transfer dispatch to LOC-A2',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p1.id,
        locationId: locA2.id,
        quantityDelta: 30,
        balanceAfter: 30,
        referenceDocType: DocType.TRANSFER,
        referenceDocId: transfer.id,
        referenceDocNumber: transfer.transferNumber,
        notes: 'Transfer receipt from LOC-A1',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p2.id,
        locationId: locA1.id,
        quantityDelta: -15,
        balanceAfter: 45,
        referenceDocType: DocType.TRANSFER,
        referenceDocId: transfer.id,
        referenceDocNumber: transfer.transferNumber,
        notes: 'Transfer dispatch to LOC-A2',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p2.id,
        locationId: locA2.id,
        quantityDelta: 15,
        balanceAfter: 15,
        referenceDocType: DocType.TRANSFER,
        referenceDocId: transfer.id,
        referenceDocNumber: transfer.transferNumber,
        notes: 'Transfer receipt from LOC-A1',
        createdById: staff.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const delivery = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'DEL-202609-0001',
      customerName: 'RoboTech Automations Inc.',
      customerAddress: '780 Industrial Highway, Detroit, MI 48202',
      status: DocStatus.DONE,
      sourceLocationId: locA2.id,
      notes: 'Urgent fulfillment for Line 3 assembly plant',
      createdById: manager.id,
      shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: p1.id, quantityOrdered: 10, quantityShipped: 10, locationId: locA2.id, unitPrice: 185.0 },
          { productId: p2.id, quantityOrdered: 5, quantityShipped: 5, locationId: locA2.id, unitPrice: 320.0 },
        ],
      },
    },
  });

  await prisma.stockLedger.createMany({
    data: [
      {
        productId: p1.id,
        locationId: locA2.id,
        quantityDelta: -10,
        balanceAfter: 20,
        referenceDocType: DocType.DELIVERY,
        referenceDocId: delivery.id,
        referenceDocNumber: delivery.deliveryNumber,
        notes: 'Fulfillment dispatched to RoboTech Automations',
        createdById: manager.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        productId: p2.id,
        locationId: locA2.id,
        quantityDelta: -5,
        balanceAfter: 10,
        referenceDocType: DocType.DELIVERY,
        referenceDocId: delivery.id,
        referenceDocNumber: delivery.deliveryNumber,
        notes: 'Fulfillment dispatched to RoboTech Automations',
        createdById: manager.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const adjustment = await prisma.stockAdjustment.create({
    data: {
      adjustmentNumber: 'ADJ-202609-0001',
      reason: 'Periodic cycle count reconciliation - 2 damaged boxes discarded',
      status: DocStatus.DONE,
      createdById: manager.id,
      appliedAt: new Date(),
      items: {
        create: [
          {
            productId: p3.id,
            locationId: locA1.id,
            recordedQuantity: 150,
            countedQuantity: 148,
            variance: -2,
          },
        ],
      },
    },
  });

  await prisma.stockLedger.create({
    data: {
      productId: p3.id,
      locationId: locA1.id,
      quantityDelta: -2,
      balanceAfter: 148,
      referenceDocType: DocType.ADJUSTMENT,
      referenceDocId: adjustment.id,
      referenceDocNumber: adjustment.adjustmentNumber,
      notes: 'Cycle count variance adjustment (-2 units)',
      createdById: manager.id,
      createdAt: new Date(),
    },
  });

  await prisma.receipt.create({
    data: {
      receiptNumber: 'REC-202609-0003',
      supplierName: 'Omron Automation Supply',
      supplierInvoice: 'OMR-4421',
      status: DocStatus.READY,
      destinationLocationId: locRec1.id,
      notes: 'Scheduled for afternoon receiving bay inspection',
      createdById: staff.id,
      items: {
        create: [
          { productId: p7.id, quantityExpected: 50, quantityReceived: 0, locationId: locRec1.id, unitPrice: 72.0 },
        ],
      },
    },
  });

  await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'DEL-202609-0002',
      customerName: 'Nextera Energy Systems',
      customerAddress: '1200 Solar Way, Austin, TX 78701',
      status: DocStatus.READY,
      sourceLocationId: locA1.id,
      notes: 'Awaiting shipping manifest sign-off',
      createdById: staff.id,
      items: {
        create: [
          { productId: p1.id, quantityOrdered: 15, quantityShipped: 0, locationId: locA1.id, unitPrice: 185.0 },
          { productId: p3.id, quantityOrdered: 20, quantityShipped: 0, locationId: locA1.id, unitPrice: 45.0 },
        ],
      },
    },
  });

  await prisma.internalTransfer.create({
    data: {
      transferNumber: 'TRF-202609-0002',
      sourceLocationId: locW1.id,
      destinationLocationId: locW2.id,
      status: DocStatus.DRAFT,
      notes: 'Replenishing picking shelf from bulk storage',
      createdById: staff.id,
      items: {
        create: [
          { productId: p5.id, quantity: 20 },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully with realistic multi-warehouse ledger data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
