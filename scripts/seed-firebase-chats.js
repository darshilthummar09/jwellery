// Seed script to populate rich order-wise dummy chats into Firebase Realtime Database

const FIREBASE_DB_URL = 'https://dream-jeweles-default-rtdb.firebaseio.com';

const richOrderThreads = [
  {
    id: 'order-ORD-101',
    orderId: 'ORD-101',
    orderName: 'Custom Solitaire Diamond Ring',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Your 3D CAD renders are ready! The 1.25ct oval diamond in 18K Yellow Gold is moving to casting.',
    lastTime: 'Aug 23, 03:30 PM',
    messages: [
      {
        id: 101001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Custom Solitaire Diamond Ring\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Rings\n⚙️  Metal      : Yellow Gold (18 KT)\n📏 Size       : No. 14\n⚖️  Weight     : 4.2g\n💰 Budget     : ₹85,000\n📅 Target Date: Aug 28, 2026\n📝 Notes      : 1.25ct oval cut center diamond, 4-prong setting with cathedral shoulders.\n──────────────────────────\n🔖 Status     : Approved (75% Progress)`,
        time: 'Aug 23, 10:00 AM',
      },
      {
        id: 101002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hi team! Could you confirm if the oval center diamond is eye-clean with excellent symmetry?',
        time: 'Aug 23, 10:30 AM',
      },
      {
        id: 101003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Hello Priya! Yes, our gemologist hand-selected an eye-clean VS1 oval diamond with ideal proportions to maximize brilliance and fire. Prongs are being micro-claw set in 18K Yellow Gold.',
        time: 'Aug 23, 11:15 AM',
      },
      {
        id: 101004,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Wonderful! Can I get an update on the delivery schedule for Mumbai?',
        time: 'Aug 23, 02:45 PM',
      },
      {
        id: 101005,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Your 3D CAD renders are ready! The 1.25ct oval diamond in 18K Yellow Gold is moving to casting. Estimated dispatch by Aug 28 with tamper-evident insured delivery.',
        time: 'Aug 23, 03:30 PM',
      },
    ],
  },
  {
    id: 'order-ORD-102',
    orderId: 'ORD-102',
    orderName: 'Emerald & Gold Royal Choker',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 1,
    customerUnread: 0,
    lastMessage: 'Can we adjust the necklace length by 0.5 inches?',
    lastTime: 'Aug 23, 12:40 PM',
    messages: [
      {
        id: 102001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Emerald & Gold Royal Choker\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Necklaces\n⚙️  Metal      : Yellow Gold (22 KT)\n⚖️  Weight     : 48g\n💰 Budget     : ₹3,20,000\n📅 Target Date: Sep 05, 2026\n📝 Notes      : Traditional bridal choker with genuine Zambian emerald drops and uncut polki diamonds.\n──────────────────────────\n🔖 Status     : Pending Approval`,
        time: 'Aug 23, 11:00 AM',
      },
      {
        id: 102002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hello! I submitted this order for my sister wedding in September. Can we adjust the necklace length by 0.5 inches?',
        time: 'Aug 23, 12:40 PM',
      },
    ],
  },
  {
    id: 'order-ORD-103',
    orderId: 'ORD-103',
    orderName: 'Diamond Tennis Bracelet',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'The double safety clasp with hidden security tongue is being hand-fitted right now.',
    lastTime: 'Aug 22, 05:00 PM',
    messages: [
      {
        id: 103001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Diamond Tennis Bracelet\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Bracelets\n⚙️  Metal      : White Gold (18 KT)\n📏 Size       : 7 inches\n⚖️  Weight     : 12.4g\n💰 Budget     : ₹1,50,000\n📅 Target Date: Sep 12, 2026\n📝 Notes      : 3.5 TCW round brilliant diamonds, four-prong basket setting with double safety lock.\n──────────────────────────\n🔖 Status     : Approved (60% Progress)`,
        time: 'Aug 22, 02:00 PM',
      },
      {
        id: 103002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Please confirm that all diamonds are uniform in size and color.',
        time: 'Aug 22, 03:15 PM',
      },
      {
        id: 103003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'The double safety clasp with hidden security tongue is being hand-fitted right now. All 48 diamonds are calibrated to 2.4mm each with GH color & VS clarity.',
        time: 'Aug 22, 05:00 PM',
      },
    ],
  },
  {
    id: 'order-ORD-104',
    orderId: 'ORD-104',
    orderName: 'Pear-Cut Sapphire Drop Earrings',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Both Ceylon sapphires have been set into the Platinum 950 bezels.',
    lastTime: 'Aug 21, 04:30 PM',
    messages: [
      {
        id: 104001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Pear-Cut Sapphire Drop Earrings\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Earrings\n⚙️  Metal      : Platinum (950 Platinum)\n⚖️  Weight     : 8.2g\n💰 Budget     : ₹1,10,000\n📅 Target Date: Aug 28, 2026\n📝 Notes      : Deep Ceylon blue sapphires surrounded by micro-halo diamonds with secure leverback clasp.\n──────────────────────────\n🔖 Status     : In Progress (50% Progress)`,
        time: 'Aug 21, 11:30 AM',
      },
      {
        id: 104002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hello! I love the Ceylon sapphire color tone. Could you confirm the earrings have secure leverbacks?',
        time: 'Aug 21, 01:20 PM',
      },
      {
        id: 104003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Both Ceylon sapphires have been set into the Platinum 950 bezels with handcrafted leverback clasps for maximum comfort and security.',
        time: 'Aug 21, 04:30 PM',
      },
    ],
  },
  {
    id: 'order-ORD-105',
    orderId: 'ORD-105',
    orderName: 'Custom Nameplate Gold Pendant',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Vector lettering proof approved. High-gloss diamond-cut beveling underway.',
    lastTime: 'Aug 20, 06:15 PM',
    messages: [
      {
        id: 105001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Custom Nameplate Gold Pendant\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Pendants\n⚙️  Metal      : Yellow Gold (18 KT)\n⚖️  Weight     : 5.1g\n💰 Budget     : ₹45,000\n📅 Target Date: Aug 30, 2026\n📝 Notes      : Script typography with diamond accent on the dot of the letter i.\n──────────────────────────\n🔖 Status     : Review (85% Progress)`,
        time: 'Aug 20, 02:00 PM',
      },
      {
        id: 105002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'The script font layout looks stunning! Please ensure the chain loop accommodates a 2mm chain.',
        time: 'Aug 20, 04:10 PM',
      },
      {
        id: 105003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Vector lettering proof approved. High-gloss diamond-cut beveling underway with a 3mm hidden bail.',
        time: 'Aug 20, 06:15 PM',
      },
    ],
  },
  {
    id: 'order-ORD-106',
    orderId: 'ORD-106',
    orderName: 'Vintage Filigree Bridal Kada Bangle',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Order completed and ready for pickup / delivery with 100% BIS hallmark certification.',
    lastTime: 'Aug 15, 01:00 PM',
    messages: [
      {
        id: 106001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Vintage Filigree Bridal Kada Bangle\n──────────────────────────\n👤 Customer   : Priya Patel\n💍 Category   : Bangles\n⚙️  Metal      : Yellow Gold (22 KT)\n📏 Size       : 2.6\n⚖️  Weight     : 32.5g\n💰 Budget     : ₹1,95,000\n📅 Target Date: Aug 15, 2026\n📝 Notes      : Antique matte finish with intricate jaali filigree work and screw hinge.\n──────────────────────────\n🔖 Status     : Completed (100% Progress)`,
        time: 'Aug 10, 10:00 AM',
      },
      {
        id: 106002,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Order completed and ready for pickup / delivery with 100% BIS hallmark certification.',
        time: 'Aug 15, 01:00 PM',
      },
    ],
  },
  {
    id: 'order-ORD-107',
    orderId: 'ORD-107',
    orderName: "Men's Matte Onyx Signet Ring",
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    participantRole: 'customer',
    unread: 1,
    customerUnread: 0,
    lastMessage: 'Can we engrave my initials AS on the inside shank?',
    lastTime: 'Aug 23, 01:10 PM',
    messages: [
      {
        id: 107001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Men's Matte Onyx Signet Ring\n──────────────────────────\n👤 Customer   : Aarav Shah\n💍 Category   : Rings\n⚙️  Metal      : Yellow Gold (18 KT)\n📏 Size       : 22\n⚖️  Weight     : 10.2g\n💰 Budget     : ₹62,000\n📅 Target Date: Sep 02, 2026\n📝 Notes      : Hexagonal flat-top natural black onyx stone with brushed satin gold finish.\n──────────────────────────\n🔖 Status     : Pending Approval`,
        time: 'Aug 23, 11:30 AM',
      },
      {
        id: 107002,
        from: 'customer',
        senderName: 'Aarav Shah',
        text: 'Hi, can we engrave my initials AS in Roman serif font on the inside shank?',
        time: 'Aug 23, 01:10 PM',
      },
    ],
  },
  {
    id: 'order-ORD-108',
    orderId: 'ORD-108',
    orderName: 'Cuban Link Gold Chain',
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Solid 6mm hand-assembled links passing through final diamond-cutting lathe.',
    lastTime: 'Aug 22, 06:20 PM',
    messages: [
      {
        id: 108001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: `📋 ORDER DETAILS — Cuban Link Gold Chain\n──────────────────────────\n👤 Customer   : Aarav Shah\n💍 Category   : Chains\n⚙️  Metal      : Yellow Gold (22 KT)\n📏 Size       : 22 inches\n⚖️  Weight     : 42g\n💰 Budget     : ₹2,10,000\n📅 Target Date: Sep 10, 2026\n📝 Notes      : Solid 6mm flat diamond-cut cuban links with custom box clasp.\n──────────────────────────\n🔖 Status     : In Progress (40% Progress)`,
        time: 'Aug 22, 10:15 AM',
      },
      {
        id: 108002,
        from: 'customer',
        senderName: 'Aarav Shah',
        text: 'Please ensure the box clasp has double side safety latches.',
        time: 'Aug 22, 02:30 PM',
      },
      {
        id: 108003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'Solid 6mm hand-assembled links passing through final diamond-cutting lathe with custom double-latch box clasp.',
        time: 'Aug 22, 06:20 PM',
      },
    ],
  },
  {
    id: 'customer-usr_customer_001',
    customerId: 'usr_customer_001',
    customerName: 'Priya Patel',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'We would love to help craft bespoke pieces for your bridal trousseau!',
    lastTime: 'Aug 19, 11:00 AM',
    messages: [
      {
        id: 100001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: '👋 Welcome to Dream Jewels, Priya! How can our master jewelers assist you today?',
        time: 'Aug 19, 10:00 AM',
      },
      {
        id: 100002,
        from: 'customer',
        senderName: 'Priya Patel',
        text: 'Hello! I am planning a bridal jewellery suite for December and had a few questions.',
        time: 'Aug 19, 10:15 AM',
      },
      {
        id: 100003,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: 'We would love to help craft bespoke pieces for your bridal trousseau! You can discuss specific orders directly under each order or chat here anytime.',
        time: 'Aug 19, 11:00 AM',
      },
    ],
  },
  {
    id: 'customer-usr_customer_002',
    customerId: 'usr_customer_002',
    customerName: 'Aarav Shah',
    participantRole: 'customer',
    unread: 0,
    customerUnread: 0,
    lastMessage: 'Welcome to Dream Jewels concierge! Let us know if you need assistance with custom men jewellery.',
    lastTime: 'Aug 18, 02:00 PM',
    messages: [
      {
        id: 200001,
        from: 'admin',
        senderName: 'Dream Jewels Support',
        text: '👋 Welcome to Dream Jewels concierge! Let us know if you need assistance with custom men jewellery.',
        time: 'Aug 18, 02:00 PM',
      },
    ],
  },
];

async function seedFirebase() {
  console.log('Seeding order-wise threads into Firebase Realtime Database...');
  
  // 1. Write to /chatState/threads
  const threadsRes = await fetch(`${FIREBASE_DB_URL}/chatState/threads.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(richOrderThreads),
  });

  if (!threadsRes.ok) {
    throw new Error(`Failed to write threads: ${threadsRes.statusText}`);
  }

  // 2. Fetch current chatState
  const chatStateRes = await fetch(`${FIREBASE_DB_URL}/chatState.json`);
  const chatState = (await chatStateRes.json()) || {};

  chatState.threads = richOrderThreads;

  const updateStateRes = await fetch(`${FIREBASE_DB_URL}/chatState.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatState),
  });

  if (!updateStateRes.ok) {
    throw new Error(`Failed to update chatState: ${updateStateRes.statusText}`);
  }

  console.log(`✅ Successfully seeded ${richOrderThreads.length} order-wise chat threads to Firebase Realtime Database!`);
}

seedFirebase().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
