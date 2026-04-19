require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/models/User');
const Product = require('../server/models/Product');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
};

const products = [
  {
    name: 'Vitamin C Brightening Serum',
    shortDescription: 'Illuminating serum with 15% Vitamin C for radiant, even-toned skin',
    description: 'Our Vitamin C Brightening Serum is formulated with a stable 15% L-Ascorbic Acid complex that penetrates deep into the skin to fade dark spots, boost collagen production, and restore natural radiance. Enriched with Ferulic Acid and Vitamin E for enhanced antioxidant protection.',
    ingredients: 'Aqua, L-Ascorbic Acid (15%), Ferulic Acid, Tocopherol (Vitamin E), Niacinamide, Hyaluronic Acid, Glycerin, Panthenol, Allantoin',
    benefits: ['Fades dark spots and hyperpigmentation', 'Boosts collagen production', 'Brightens dull complexion', 'Antioxidant protection', 'Evens skin tone'],
    howToUse: 'Apply 3-4 drops on cleansed face and neck in the morning. Follow with moisturizer and SPF 30+.',
    category: 'serum',
    skinType: ['all', 'normal', 'combination', 'dry'],
    price: 1299,
    discountPrice: 899,
    images: ['/uploads/vitamin-c-serum.png'],
    stock: 150,
    weight: '30ml',
    tags: ['vitamin c', 'brightening', 'anti-aging', 'dark spots', 'serum'],
    isFeatured: true,
    isBestSeller: true,
    totalSold: 432,
    averageRating: 4.7,
    numReviews: 128,
  },
  {
    name: 'Hyaluronic Acid Deep Hydration Serum',
    shortDescription: 'Multi-molecular HA serum for 72-hour skin hydration',
    description: 'Experience unparalleled hydration with our multi-weight Hyaluronic Acid serum. Combining low, medium, and high molecular weight HA molecules, this serum hydrates at every layer of the skin, plumping fine lines and restoring a dewy, youthful appearance.',
    ingredients: 'Aqua, Sodium Hyaluronate (3 molecular weights), Panthenol, Niacinamide, Centella Asiatica Extract, Ceramides, Glycerin',
    benefits: ['Deep skin hydration', 'Plumps fine lines', 'Strengthens skin barrier', 'Suitable for sensitive skin', '72-hour moisture retention'],
    howToUse: 'Apply 3-4 drops on damp skin morning and evening. Layer under moisturizer.',
    category: 'serum',
    skinType: ['all', 'dry', 'sensitive'],
    price: 999,
    discountPrice: 749,
    images: ['/uploads/hyaluronic-acid-serum.png'],
    stock: 200,
    weight: '30ml',
    tags: ['hyaluronic acid', 'hydration', 'plumping', 'serum'],
    isFeatured: true,
    isBestSeller: true,
    totalSold: 611,
    averageRating: 4.8,
    numReviews: 203,
  },
  {
    name: 'Salicylic Acid Pore-Cleansing Face Wash',
    shortDescription: 'BHA-powered gel cleanser for acne-prone and oily skin',
    description: 'Our Salicylic Acid Face Wash combines 2% BHA with Niacinamide and Tea Tree Oil to deeply cleanse pores, control sebum production, and prevent breakouts. The gel formula lathers gently without stripping skin of essential moisture.',
    ingredients: 'Aqua, Salicylic Acid (2%), Niacinamide, Tea Tree Oil, Aloe Vera Gel, Glycerin, Zinc PCA, Panthenol',
    benefits: ['Unclogs pores', 'Controls excess oil', 'Prevents acne breakouts', 'Reduces blackheads', 'Antibacterial action'],
    howToUse: 'Wet face, apply a small amount, massage gently for 60 seconds, rinse thoroughly. Use twice daily.',
    category: 'face-wash',
    skinType: ['oily', 'combination'],
    price: 499,
    discountPrice: 349,
    images: ['/uploads/salicylic-face-wash.png'],
    stock: 300,
    weight: '100ml',
    tags: ['salicylic acid', 'acne', 'pores', 'face wash', 'oily skin'],
    isFeatured: true,
    isBestSeller: true,
    totalSold: 891,
    averageRating: 4.6,
    numReviews: 312,
  },
  {
    name: 'Ceramide Barrier Repair Moisturizer',
    shortDescription: 'Rich barrier-restoring cream with ceramides and peptides',
    description: 'Clinically formulated with a triple ceramide complex, this moisturizer rebuilds and strengthens the skin\'s natural protective barrier. Enriched with peptides, shea butter, and niacinamide, it delivers intense nourishment while reducing transepidermal water loss.',
    ingredients: 'Aqua, Ceramide NP, Ceramide AP, Ceramide EOP, Niacinamide, Shea Butter, Panthenol, Hyaluronic Acid, Peptide Complex',
    benefits: ['Restores skin barrier', 'Reduces redness', 'Long-lasting hydration', 'Improves skin texture', 'Suitable for eczema-prone skin'],
    howToUse: 'Apply generously on face and neck morning and evening after serum.',
    category: 'moisturizer',
    skinType: ['dry', 'sensitive', 'normal'],
    price: 799,
    discountPrice: 599,
    images: ['/uploads/ceramide-moisturizer.png'],
    stock: 180,
    weight: '50ml',
    tags: ['ceramide', 'moisturizer', 'barrier repair', 'dry skin'],
    isFeatured: true,
    totalSold: 267,
    averageRating: 4.5,
    numReviews: 89,
  },
  {
    name: 'Niacinamide 10% + Zinc Pore Minimizer',
    shortDescription: '10% Niacinamide serum for pores, oil control, and even tone',
    description: 'Our high-strength Niacinamide serum pairs 10% active Niacinamide with 1% Zinc PCA to minimize pore appearance, regulate sebum production, and visibly improve uneven skin tone. Lightweight and fast-absorbing, suitable for all skin types.',
    ingredients: 'Aqua, Niacinamide (10%), Zinc PCA (1%), Sodium Hyaluronate, Panthenol, Tamarind Seed Extract',
    benefits: ['Minimizes pore size', 'Reduces oiliness', 'Brightens skin tone', 'Reduces acne marks', 'Smoothes texture'],
    howToUse: 'Apply 4-5 drops after cleansing, before heavier creams. Use AM or PM.',
    category: 'serum',
    skinType: ['oily', 'combination', 'normal'],
    price: 699,
    discountPrice: 499,
    images: ['/uploads/niacinamide-serum.png'],
    stock: 220,
    weight: '30ml',
    tags: ['niacinamide', 'zinc', 'pores', 'oil control', 'serum'],
    isFeatured: true,
    isBestSeller: true,
    totalSold: 743,
    averageRating: 4.7,
    numReviews: 254,
  },
  {
    name: 'SPF 50 PA++++ Matte Sunscreen',
    shortDescription: 'Lightweight physical + chemical SPF 50 sunscreen, no white cast',
    description: 'Broad-spectrum SPF 50 PA++++ sunscreen with a hybrid physical and chemical UV filter system. Instantly absorbs into skin leaving a natural matte finish with zero white cast. Water-resistant and enriched with antioxidants for complete sun protection.',
    ingredients: 'Zinc Oxide, Octinoxate, Tinosorb S, Niacinamide, Vitamin E, Hyaluronic Acid, Aloe Vera',
    benefits: ['SPF 50 PA++++', 'Matte finish', 'No white cast', 'Water resistant 40 min', 'Antioxidant protection'],
    howToUse: 'Apply as the last step of skincare, 15 minutes before sun exposure. Reapply every 2-3 hours.',
    category: 'sunscreen',
    skinType: ['all', 'oily', 'combination'],
    price: 599,
    discountPrice: 449,
    images: ['/uploads/spf50-sunscreen.png'],
    stock: 250,
    weight: '50ml',
    tags: ['sunscreen', 'spf', 'matte', 'sun protection'],
    isFeatured: true,
    isBestSeller: true,
    totalSold: 534,
    averageRating: 4.6,
    numReviews: 178,
  },
  {
    name: 'Retinol 0.3% Overnight Renewal Serum',
    shortDescription: 'Beginner-friendly retinol for anti-aging and cell turnover',
    description: 'Formulated with 0.3% encapsulated retinol for a gentle introduction to vitamin A, this overnight serum promotes cell turnover, smoothens fine lines, and refines skin texture while minimizing irritation. Enhanced with bakuchiol and peptides.',
    ingredients: 'Aqua, Retinol (0.3% encapsulated), Bakuchiol, Peptide Complex, Squalane, Niacinamide, Ceramides',
    benefits: ['Reduces fine lines', 'Promotes cell turnover', 'Refines skin texture', 'Anti-aging', 'Gentle formula'],
    howToUse: 'Apply 2-3 drops at night, 2-3 times per week for beginners. Always follow with SPF in the morning.',
    category: 'serum',
    skinType: ['normal', 'combination', 'dry'],
    price: 1199,
    discountPrice: 849,
    images: ['/uploads/retinol-serum.png'],
    stock: 5, // Low stock
    weight: '30ml',
    tags: ['retinol', 'anti-aging', 'overnight', 'cell turnover'],
    isFeatured: false,
    totalSold: 189,
    averageRating: 4.4,
    numReviews: 67,
  },
  {
    name: 'Rose Water Hydrating Toner',
    shortDescription: 'pH-balancing toner with pure rose water and hyaluronic acid',
    description: 'Our Rose Water Toner combines steam-distilled Bulgarian rose water with Hyaluronic Acid and niacinamide to hydrate, balance skin pH, and prep skin for the next steps in your routine. Alcohol-free and gentle for sensitive skin.',
    ingredients: 'Rosa Damascena Flower Water (60%), Sodium Hyaluronate, Niacinamide, Panthenol, Aloe Vera, Glycerin',
    benefits: ['Balances skin pH', 'Hydrates and tones', 'Preps skin for serum', 'Soothes irritation', 'Alcohol-free'],
    howToUse: 'Apply on a cotton pad or spray directly on face after cleansing.',
    category: 'toner',
    skinType: ['all', 'sensitive'],
    price: 449,
    discountPrice: 349,
    images: ['/uploads/rose-water-toner.png'],
    stock: 175,
    weight: '150ml',
    tags: ['toner', 'rose water', 'hydration', 'ph balancing'],
    isFeatured: false,
    isBestSeller: true,
    totalSold: 389,
    averageRating: 4.5,
    numReviews: 142,
  },
  {
    name: 'Kaolin Clay Detox Face Mask',
    shortDescription: 'Deep cleansing clay mask with kaolin and charcoal',
    description: 'Our dual-clay detox mask combines kaolin and bentonite clays with activated charcoal to draw out impurities, absorb excess oil, and refine skin texture. Enriched with witch hazel and aloe vera to prevent over-drying.',
    ingredients: 'Kaolin Clay, Bentonite Clay, Activated Charcoal, Witch Hazel Extract, Aloe Vera Gel, Glycerin, Tea Tree Oil',
    benefits: ['Deep pore cleansing', 'Removes impurities', 'Controls oiliness', 'Refines skin texture', 'Detoxifying'],
    howToUse: 'Apply a thin layer on face, leave for 10-15 minutes until semi-dry, rinse thoroughly. Use 1-2 times per week.',
    category: 'mask',
    skinType: ['oily', 'combination'],
    price: 649,
    discountPrice: 499,
    images: ['/uploads/clay-mask.png'],
    stock: 0, // Out of stock
    weight: '75ml',
    tags: ['clay mask', 'detox', 'charcoal', 'deep cleanse'],
    isFeatured: false,
    totalSold: 234,
    averageRating: 4.3,
    numReviews: 95,
  },
  {
    name: 'Gentle Amino Acid Face Wash',
    shortDescription: 'Mild amino acid cleanser for all skin types including sensitive',
    description: 'A gentle, low-pH cleanser powered by amino acid surfactants that effectively remove makeup and impurities without stripping the skin\'s natural moisture barrier. Enriched with ceramides and panthenol to maintain healthy skin.',
    ingredients: 'Aqua, Sodium Lauroyl Glutamate, Cocamidopropyl Betaine, Ceramide NP, Panthenol, Allantoin, Hyaluronic Acid',
    benefits: ['Gentle on sensitive skin', 'Maintains moisture barrier', 'pH-balanced', 'Effective cleansing', 'Non-stripping'],
    howToUse: 'Wet face, apply a small amount, lather and massage, rinse. Use twice daily.',
    category: 'face-wash',
    skinType: ['all', 'sensitive', 'dry'],
    price: 449,
    discountPrice: 349,
    images: ['/uploads/amino-face-wash.png'],
    stock: 280,
    weight: '100ml',
    tags: ['gentle cleanser', 'amino acid', 'sensitive skin', 'face wash'],
    isFeatured: false,
    isBestSeller: false,
    totalSold: 156,
    averageRating: 4.4,
    numReviews: 61,
  },
];

const seed = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Happi Gums Admin',
      email: process.env.ADMIN_EMAIL || 'admin@baresober.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
      addresses: [{
        fullName: 'Happi Gums',
        phone: '0000000000',
        addressLine1: '26, Ganga Vihar, Opposite Sector-2',
        addressLine2: 'Kudi Bhagatasni Housing Board Colony',
        city: 'Jodhpur',
        state: 'Rajasthan',
        pincode: '342005',
        country: 'India',
      }],
    });
    console.log(`✅ Admin created: ${adminUser.email}`);

    // Create sample user
    const sampleUser = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'User@123',
      mobile: '9876543210',
      role: 'user',
      isEmailVerified: true,
      isMobileVerified: true,
    });
    console.log(`✅ Sample user created: ${sampleUser.email}`);

    // Create products one by one so pre-save hooks run (slug generation)
    let savedCount = 0;
    for (const p of products) {
      const product = new Product(p);
      await product.save();
      savedCount++;
    }
    console.log(`✅ ${savedCount} products seeded`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔑 Admin Email: ${adminUser.email}`);
    console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log(`👤 Sample User: priya@example.com / User@123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seed();
