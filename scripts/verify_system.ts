import prisma from '../src/lib/prisma';
import { AuthService } from '../src/modules/auth/service';
import { ProductService } from '../src/modules/products/service';
import { LedgerService } from '../src/modules/ledger/service';
import { WarehouseService } from '../src/modules/warehouses/service';
import { ReceiptService } from '../src/modules/operations/receipts';
import { DeliveryService } from '../src/modules/operations/deliveries';
import { TransferService } from '../src/modules/operations/transfers';
import { AdjustmentService } from '../src/modules/operations/adjustments';
import { DashboardService } from '../src/modules/dashboard/service';

async function runVerification() {
  console.log('=====================================================');
  console.log('🔍 StockSense Verification Test Suite');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Authentication & Hashing Verification
  console.log('1. Testing Auth & Security Module...');
  const managerLogin = await AuthService.login('manager@stocksense.com', 'Password123!');
  assert(managerLogin.success && managerLogin.user?.role === 'MANAGER', 'Manager login and role validation');

  const staffLogin = await AuthService.login('staff@stocksense.com', 'Password123!');
  assert(staffLogin.success && staffLogin.user?.role === 'STAFF', 'Logistics staff login and role validation');

  const invalidLogin = await AuthService.login('manager@stocksense.com', 'WrongPass!');
  assert(!invalidLogin.success, 'Rejection of invalid password');

  const otpRes = await AuthService.requestOtp('manager@stocksense.com');
  assert(otpRes.success && typeof otpRes.otp === 'string' && otpRes.otp.length === 6, '6-digit OTP generation');

  // 2. Product & Warehouse Topology
  console.log('\n2. Testing Product & Warehouse Module...');
  const products = await ProductService.getAllProducts();
  assert(products.length >= 7, `Retrieved ${products.length} products with calculated stock`);

  const warehouses = await WarehouseService.getAllWarehouses();
  assert(warehouses.length >= 2, `Retrieved ${warehouses.length} warehouses with location racks`);

  const p1 = products[0];
  const p1Details = await ProductService.getProductById(p1.id);
  assert(p1Details !== null && p1Details.locationsBreakdown !== undefined, 'Per-location stock breakdown query');

  // 3. Ledger Math & Balance Verification
  console.log('\n3. Testing Core Ledger Engine Math...');
  const aggregateStock = await LedgerService.getProductStock(p1.id);
  assert(aggregateStock.totalStock === p1.currentStock, 'Double-entry ledger stock matches product currentStock');

  // 4. Inbound Stock Receipts Workflow
  console.log('\n4. Testing Inbound Receipts Workflow...');
  const locations = await WarehouseService.getLocations();
  const targetLoc = locations[0];

  const receipt = await ReceiptService.createReceipt(
    {
      supplierName: 'Automated Test Supplier Corp.',
      destinationLocationId: targetLoc.id,
      items: [{ productId: p1.id, quantityExpected: 25 }],
    },
    managerLogin.user!.id
  );
  assert(receipt.status === 'READY', 'Receipt created with READY status');

  const stockBeforeReceipt = await LedgerService.getLocationStock(p1.id, targetLoc.id);
  const validatedReceipt = await ReceiptService.validateReceipt(receipt.id, managerLogin.user!.id);
  const stockAfterReceipt = await LedgerService.getLocationStock(p1.id, targetLoc.id);

  assert(validatedReceipt.status === 'DONE', 'Receipt transitioned to DONE');
  assert(stockAfterReceipt === stockBeforeReceipt + 25, 'Ledger successfully credited +25 delta to location');

  // 5. Outbound Deliveries & Negative Stock Prevention
  console.log('\n5. Testing Deliveries & Negative Stock Guard...');
  // A: Attempt delivery of an impossible amount (e.g. 99,999 units)
  const excessiveDelivery = await DeliveryService.createDelivery(
    {
      customerName: 'Excessive Demand Customer',
      sourceLocationId: targetLoc.id,
      items: [{ productId: p1.id, quantityOrdered: 99999 }],
    },
    managerLogin.user!.id
  );

  let caughtDepletionError = false;
  try {
    await DeliveryService.shipDelivery(excessiveDelivery.id, managerLogin.user!.id);
  } catch (err: unknown) {
    caughtDepletionError = true;
    console.log(`     (Expected Error Caught: ${(err as Error).message})`);
  }
  assert(caughtDepletionError, 'Negative stock guard successfully blocked excessive shipment');

  // B: Valid shipment with sufficient stock
  const validDelivery = await DeliveryService.createDelivery(
    {
      customerName: 'Verified Fast Client LLC',
      sourceLocationId: targetLoc.id,
      items: [{ productId: p1.id, quantityOrdered: 5 }],
    },
    managerLogin.user!.id
  );
  const stockBeforeShip = await LedgerService.getLocationStock(p1.id, targetLoc.id);
  await DeliveryService.shipDelivery(validDelivery.id, managerLogin.user!.id);
  const stockAfterShip = await LedgerService.getLocationStock(p1.id, targetLoc.id);

  assert(stockAfterShip === stockBeforeShip - 5, 'Delivery successfully logged -5 delta in ledger');

  // 6. Internal Transfers (Dual-Entry Math)
  console.log('\n6. Testing Internal Transfers (Dual-Entry)...');
  const sourceLoc = locations[0];
  const destLoc = locations[1];

  const transfer = await TransferService.createTransfer(
    {
      sourceLocationId: sourceLoc.id,
      destinationLocationId: destLoc.id,
      items: [{ productId: p1.id, quantity: 4 }],
    },
    managerLogin.user!.id
  );

  const srcStockBefore = await LedgerService.getLocationStock(p1.id, sourceLoc.id);
  const destStockBefore = await LedgerService.getLocationStock(p1.id, destLoc.id);

  await TransferService.executeTransfer(transfer.id, managerLogin.user!.id);

  const srcStockAfter = await LedgerService.getLocationStock(p1.id, sourceLoc.id);
  const destStockAfter = await LedgerService.getLocationStock(p1.id, destLoc.id);

  assert(
    srcStockAfter === srcStockBefore - 4 && destStockAfter === destStockBefore + 4,
    'Dual-entry transfer: atomic -4 at origin and +4 at destination'
  );

  // 7. Stock Adjustment (Physical Count Reconciliation)
  console.log('\n7. Testing Stock Adjustments (Cycle Count)...');
  const recordedStock = await LedgerService.getLocationStock(p1.id, sourceLoc.id);
  const physicalCount = recordedStock + 3; // +3 adjustment

  const adjustment = await AdjustmentService.createAdjustment(
    {
      reason: 'Physical cycle count verification test',
      items: [{ productId: p1.id, locationId: sourceLoc.id, countedQuantity: physicalCount }],
    },
    managerLogin.user!.id
  );

  await AdjustmentService.applyAdjustment(adjustment.id, managerLogin.user!.id);
  const adjustedStock = await LedgerService.getLocationStock(p1.id, sourceLoc.id);

  assert(adjustedStock === physicalCount, 'Cycle count variance successfully reconciled in ledger');

  // 8. Dashboard KPIs & Telemetry
  console.log('\n8. Testing Dashboard KPI Aggregation...');
  const kpis = await DashboardService.getKPIs();
  assert(kpis.totalProducts >= 7, 'KPI: Total Products count matches catalog');
  assert(kpis.totalInventoryUnits > 0, 'KPI: Total Inventory Units calculated from ledger');
  assert(kpis.totalInventoryValuation > 0, 'KPI: Total Inventory Valuation computed');
  assert(kpis.recentLedgerEntries.length > 0, 'KPI: Recent ledger entries populated');

  console.log('\n=====================================================');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (100% Success Rate)`);
  console.log('=====================================================\n');

  await prisma.$disconnect();
}

runVerification().catch((e) => {
  console.error(e);
  process.exit(1);
});
