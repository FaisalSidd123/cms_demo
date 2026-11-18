export const purchaseHistory = [
  {
    id: 'ord-3029',
    vehicleId: 2,
    vehicleName: 'Mercedes-Benz GLE',
    vin: 'WDC1671591A928371',
    status: 'In Transit',
    statusBadge: 'In Escrow • Shipped',
    statusCategory: 'active', // active | delivered
    currentStage: 'Shipped',
    vehicleDetails: {
      make: 'Mercedes-Benz',
      model: 'Mercedes-Benz GLE',
      year: 2023,
      price: '$68,000',
      type: 'SUV',
      color: 'Obsidian Black',
      image: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=80'
    },
    purchaseDate: '2026-06-25T14:32:00Z',
    finalPrice: '$68,000',
    deliveryDate: '2026-07-08T16:00:00Z',
    etaNotice: 'Estimated Port Arrival: 4 Days',
    agent: {
      name: 'Sarah Connor',
      contact: 'sarah.connor@kisacoauto.com'
    },
    financialSummary: {
      total: '$68,000',
      cleared: '$68,000',
      escrowLocked: '$68,000',
      balanceDue: '$0'
    },
    stageHistory: [
      { stage: 'Reserved', date: '2026-06-25T14:32:00Z', note: 'Vehicle secured. VIN record locked for buyer allocation.' },
      { stage: 'Invoiced', date: '2026-06-26T09:15:00Z', note: 'Commercial invoice & wire instructions verified.' },
      { stage: 'Paid', date: '2026-06-27T11:40:00Z', note: 'Escrow wire received and locked in secure trust account.' },
      { stage: 'Shipped', date: '2026-06-29T08:30:00Z', note: 'Enclosed transport carrier assigned. Carrier Bill of Lading BL-49102.' },
      { stage: 'Delivered', date: 'Pending ETA July 08', note: 'Scheduled handover at 742 Ocean Drive, Miami FL.' }
    ]
  },
  {
    id: 'ord-4190',
    vehicleId: 7,
    vehicleName: 'Range Rover Sport',
    vin: 'SALWR2V48NA771920',
    status: 'Reserved',
    statusBadge: 'Reserved • Wire Pending',
    statusCategory: 'active',
    currentStage: 'Reserved',
    vehicleDetails: {
      make: 'Land Rover',
      model: 'Range Rover Sport',
      year: 2022,
      price: '$54,000',
      type: 'SUV',
      color: 'Santorini Black',
      image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80'
    },
    purchaseDate: '2026-07-01T10:05:00Z',
    finalPrice: '$54,000',
    deliveryDate: '2026-07-22T12:00:00Z',
    etaNotice: 'Awaiting Escrow Settlement',
    agent: {
      name: 'Thomas Miller',
      contact: 'thomas.miller@kisacoauto.com'
    },
    financialSummary: {
      total: '$54,000',
      cleared: '$5,000 (Hold Deposit)',
      escrowLocked: '$5,000',
      balanceDue: '$49,000'
    },
    stageHistory: [
      { stage: 'Reserved', date: '2026-07-01T10:05:00Z', note: 'Hold deposit received. VIN locked for 7 business days.' },
      { stage: 'Invoiced', date: '2026-07-01T14:30:00Z', note: 'Pro-forma wire instructions sent to buyer.' },
      { stage: 'Paid', date: 'Pending Wire', note: 'Awaiting remaining balance transfer into escrow.' },
      { stage: 'Shipped', date: 'Queued', note: 'Logistics booking queued upon full escrow lock.' },
      { stage: 'Delivered', date: 'Queued', note: 'Handover scheduling queued.' }
    ]
  },
  {
    id: 'pur-8420',
    vehicleId: 6,
    vehicleName: 'Tesla Model S',
    vin: '5YJSA1E28PF992810',
    status: 'Delivered',
    statusBadge: 'Delivered & Settled',
    statusCategory: 'delivered',
    currentStage: 'Delivered',
    vehicleDetails: {
      make: 'Tesla',
      model: 'Tesla Model S',
      year: 2023,
      price: '$89,000',
      type: 'Sedan',
      color: 'Pearl White',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80'
    },
    purchaseDate: '2026-02-10T11:20:00Z',
    finalPrice: '$89,000',
    deliveryDate: '2026-02-15T15:30:00Z',
    etaNotice: 'Completed & Closed',
    agent: {
      name: 'Sarah Connor',
      contact: 'sarah.connor@kisacoauto.com'
    },
    financialSummary: {
      total: '$89,000',
      cleared: '$89,000',
      escrowLocked: '$0 (Disbursed)',
      balanceDue: '$0'
    },
    stageHistory: [
      { stage: 'Reserved', date: '2026-02-10T11:20:00Z', note: 'Vehicle reserved and locked.' },
      { stage: 'Invoiced', date: '2026-02-11T09:00:00Z', note: 'Commercial invoice issued.' },
      { stage: 'Paid', date: '2026-02-12T10:15:00Z', note: 'Full purchase price cleared.' },
      { stage: 'Shipped', date: '2026-02-13T14:00:00Z', note: 'Enclosed delivery dispatched from depot.' },
      { stage: 'Delivered', date: '2026-02-15T15:30:00Z', note: 'Vehicle safely delivered to buyer residence.' }
    ]
  },
  {
    id: 'pur-1904',
    vehicleId: 8,
    vehicleName: 'Honda Civic',
    vin: '1HGCR2F83HA029311',
    status: 'Delivered',
    statusBadge: 'Delivered & Settled',
    statusCategory: 'delivered',
    currentStage: 'Delivered',
    vehicleDetails: {
      make: 'Honda',
      model: 'Honda Civic',
      year: 2023,
      price: '$28,000',
      type: 'Sedan',
      color: 'Lunar Silver',
      image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=800&q=80'
    },
    purchaseDate: '2025-08-04T15:45:00Z',
    finalPrice: '$27,500',
    deliveryDate: '2025-08-09T12:00:00Z',
    etaNotice: 'Completed & Closed',
    agent: {
      name: 'Thomas Miller',
      contact: 'thomas.miller@kisacoauto.com'
    },
    financialSummary: {
      total: '$27,500',
      cleared: '$27,500',
      escrowLocked: '$0 (Disbursed)',
      balanceDue: '$0'
    },
    stageHistory: [
      { stage: 'Reserved', date: '2025-08-04T15:45:00Z', note: 'Vehicle reserved.' },
      { stage: 'Invoiced', date: '2025-08-05T09:30:00Z', note: 'Invoice issued.' },
      { stage: 'Paid', date: '2025-08-05T14:50:00Z', note: 'Wire payment settled.' },
      { stage: 'Shipped', date: '2025-08-07T08:00:00Z', note: 'Vehicle loaded on carrier.' },
      { stage: 'Delivered', date: '2025-08-09T12:00:00Z', note: 'Key handover confirmed.' }
    ]
  }
];
