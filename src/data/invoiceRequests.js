export const invoiceRequests = [
  {
    id: 'inv-req-501',
    reservationId: 'res-3001', // Alexander Sterling GLE
    clientId: 'cust-9428',
    amount: '$68,000',
    notes: 'Escrow wiring details verified. Hold converted to invoicing log.',
    status: 'Approved', // Pending Admin Approval / Approved / Rejected
    createdDate: '2026-06-26T09:15:00Z',
    vehicleModel: 'Mercedes-Benz GLE',
    chassisVin: 'WDC1671591A928371'
  },
  {
    id: 'inv-req-502',
    reservationId: 'res-3002', // Tony Stark Porsche
    clientId: 'cust-002',
    amount: '$112,000',
    notes: 'Invoice generated immediately upon customer deposit confirm.',
    status: 'Pending Admin Approval',
    createdDate: '2026-07-02T11:00:00Z',
    vehicleModel: 'Porsche 911 GT3',
    chassisVin: 'WP0AC2A98PS298114'
  },
  {
    id: 'inv-req-503',
    reservationId: 'res-3004', // Bruce Wayne Land Cruiser
    clientId: 'cust-001',
    amount: '$82,000',
    notes: 'Invoicing request filed on hold. Hold subsequently expired.',
    status: 'Rejected',
    createdDate: '2026-06-18T14:20:00Z',
    vehicleModel: 'Toyota Land Cruiser 300',
    chassisVin: 'JTMHX01J8N4029112'
  }
];

export const mockAgentDocuments = [
  {
    id: 'adoc-01',
    clientId: 'cust-9428',
    vehicleModel: 'Mercedes-Benz GLE',
    chassisVin: 'WDC1671591A928371',
    type: 'Invoice',
    fileName: 'Commercial_Invoice_GLE_WDC1671591.pdf',
    uploadDate: '2026-06-25T14:40:00Z',
    status: 'Approved'
  },
  {
    id: 'adoc-02',
    clientId: 'cust-002',
    vehicleModel: 'Porsche 911 GT3',
    chassisVin: 'WP0AC2A98PS298114',
    type: 'Payment Proof',
    fileName: 'Escrow_Wire_Receipt_Porsche_911.pdf',
    uploadDate: '2026-07-02T10:45:00Z',
    status: 'Pending Review'
  },
  {
    id: 'adoc-03',
    clientId: 'cust-001',
    vehicleModel: 'BMW M4 Competition',
    chassisVin: 'WBA43AY08PFP19823',
    type: 'Bill of Lading',
    fileName: 'Carrier_Bill_Of_Lading_M4_WBA43AY.pdf',
    uploadDate: '2026-07-01T11:00:00Z',
    status: 'Approved'
  },
  {
    id: 'adoc-04',
    clientId: 'cust-9428',
    vehicleModel: 'Mercedes-Benz GLE',
    chassisVin: 'WDC1671591A928371',
    type: 'Inspection',
    fileName: '150_Point_Mechanical_Inspection_GLE.pdf',
    uploadDate: '2026-06-26T09:15:00Z',
    status: 'Approved'
  },
  {
    id: 'adoc-05',
    clientId: 'cust-001',
    vehicleModel: 'Toyota Land Cruiser 300',
    chassisVin: 'JTMHX01J8N4029112',
    type: 'Customs Duty',
    fileName: 'Customs_Clearance_C78_JTMHX01J.pdf',
    uploadDate: '2026-06-20T16:00:00Z',
    status: 'Approved'
  }
];
