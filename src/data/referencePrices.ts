/**
 * Reference prices in Vietnam Dong (VND), stored in THOUSANDS.
 * E.g. 30 means 30,000 VND.
 * 
 * These prices can be updated from supplier sources in the future.
 * Key = ingredient ID, value = price per unit in thousands VND.
 */

export interface PriceEntry {
  /** Price in thousands VND (e.g. 30 = 30,000₫) */
  priceK: number;
  /** Optional: last updated timestamp */
  updatedAt?: string;
  /** Optional: source of the price */
  source?: string;
}

export const referencePrices: Record<string, PriceEntry> = {
  // Vegetables - Root
  v1:  { priceK: 25, source: 'market' },   // Carrot /kg
  v2:  { priceK: 20, source: 'market' },   // Potato /kg
  v3:  { priceK: 18, source: 'market' },   // Onion /kg
  v4:  { priceK: 80, source: 'market' },   // Garlic /kg
  v20: { priceK: 120, source: 'market' },  // Ginger /kg
  v21: { priceK: 35, source: 'market' },   // Beetroot /kg
  v22: { priceK: 40, source: 'market' },   // Radish /kg
  v23: { priceK: 30, source: 'market' },   // Turnip /kg
  v24: { priceK: 35, source: 'market' },   // Sweet Potato /kg
  v25: { priceK: 50, source: 'market' },   // Taro /kg

  // Vegetables - Leaf 1
  v6:  { priceK: 15, source: 'market' },   // Lettuce /pc
  v10: { priceK: 40, source: 'market' },   // Spinach /bag
  v16: { priceK: 25, source: 'market' },   // Cabbage /pc
  v26: { priceK: 30, source: 'market' },   // Bok Choy /kg
  v27: { priceK: 50, source: 'market' },   // Kale /bag
  v28: { priceK: 45, source: 'market' },   // Swiss Chard /bag
  v29: { priceK: 50, source: 'market' },   // Arugula /bag
  v30: { priceK: 55, source: 'market' },   // Watercress /bag

  // Vegetables - Leaf 2
  v13: { priceK: 25, source: 'market' },   // Celery /pc
  v31: { priceK: 30, source: 'market' },   // Spring Onion /kg
  v32: { priceK: 20, source: 'market' },   // Cilantro /bag
  v33: { priceK: 30, source: 'market' },   // Mint /bag
  v34: { priceK: 40, source: 'market' },   // Basil /bag
  v35: { priceK: 30, source: 'market' },   // Dill /bag
  v36: { priceK: 20, source: 'market' },   // Parsley /bag
  v37: { priceK: 50, source: 'market' },   // Lemongrass /kg
  v38: { priceK: 30, source: 'market' },   // Chives /bag
  v39: { priceK: 20, source: 'market' },   // Morning Glory /kg

  // Vegetables - Others
  v5:  { priceK: 40, source: 'market' },   // Tomato /kg
  v7:  { priceK: 12, source: 'market' },   // Cucumber /pc
  v8:  { priceK: 25, source: 'market' },   // Bell Pepper /pc
  v9:  { priceK: 35, source: 'market' },   // Broccoli /pc
  v11: { priceK: 50, source: 'market' },   // Mushroom /pack
  v12: { priceK: 8, source: 'market' },    // Corn /pc
  v14: { priceK: 20, source: 'market' },   // Zucchini /pc
  v15: { priceK: 30, source: 'market' },   // Eggplant /pc
  v17: { priceK: 60, source: 'market' },   // Green Beans /kg
  v18: { priceK: 55, source: 'market' },   // Peas /kg
  v19: { priceK: 100, source: 'market' },  // Chili /kg
  v40: { priceK: 40, source: 'market' },   // Cauliflower /pc
  v41: { priceK: 35, source: 'market' },   // Bamboo Shoots /can
  v42: { priceK: 25, source: 'market' },   // Bean Sprouts /kg

  // Sauces
  s1:  { priceK: 30, source: 'market' },   // Soy Sauce /btl
  s2:  { priceK: 45, source: 'market' },   // Oyster Sauce /btl
  s3:  { priceK: 35, source: 'market' },   // Fish Sauce /btl
  s4:  { priceK: 25, source: 'market' },   // Tomato Sauce /can
  s5:  { priceK: 40, source: 'market' },   // Chili Sauce /btl
  s6:  { priceK: 20, source: 'market' },   // Vinegar /btl
  s7:  { priceK: 35, source: 'market' },   // Mustard /btl
  s8:  { priceK: 45, source: 'market' },   // Mayonnaise /btl
  s9:  { priceK: 30, source: 'market' },   // Ketchup /btl
  s10: { priceK: 55, source: 'market' },   // BBQ Sauce /btl
  s11: { priceK: 60, source: 'market' },   // Teriyaki /btl
  s12: { priceK: 45, source: 'market' },   // Hoisin /btl
  s13: { priceK: 50, source: 'market' },   // Sriracha /btl
  s14: { priceK: 70, source: 'market' },   // Tahini /btl
  s15: { priceK: 65, source: 'market' },   // Pesto /btl
  s16: { priceK: 40, source: 'market' },   // Salsa /btl
  s17: { priceK: 40, source: 'market' },   // Hot Sauce /btl
  s18: { priceK: 50, source: 'market' },   // Ranch /btl
  s19: { priceK: 45, source: 'market' },   // Worcestershire /btl
  s20: { priceK: 30, source: 'market' },   // Coconut Cream /can

  // Spices
  sp1:  { priceK: 12, source: 'market' },  // Salt /kg
  sp2:  { priceK: 40, source: 'market' },  // Black Pepper /pack
  sp3:  { priceK: 35, source: 'market' },  // Cumin /pack
  sp4:  { priceK: 40, source: 'market' },  // Paprika /pack
  sp5:  { priceK: 45, source: 'market' },  // Turmeric /pack
  sp6:  { priceK: 55, source: 'market' },  // Cinnamon /pack
  sp7:  { priceK: 35, source: 'market' },  // Oregano /pack
  sp8:  { priceK: 35, source: 'market' },  // Basil /pack
  sp9:  { priceK: 35, source: 'market' },  // Thyme /pack
  sp10: { priceK: 35, source: 'market' },  // Rosemary /pack
  sp11: { priceK: 25, source: 'market' },  // Bay Leaves /pack
  sp12: { priceK: 30, source: 'market' },  // Coriander /pack
  sp13: { priceK: 70, source: 'market' },  // Nutmeg /pack
  sp14: { priceK: 120, source: 'market' }, // Cardamom /pack
  sp15: { priceK: 55, source: 'market' },  // Cloves /pack
  sp16: { priceK: 60, source: 'market' },  // Star Anise /pack
  sp17: { priceK: 40, source: 'market' },  // Chili Flakes /pack
  sp18: { priceK: 45, source: 'market' },  // Garlic Powder /pack
  sp19: { priceK: 35, source: 'market' },  // Onion Powder /pack
  sp20: { priceK: 25, source: 'market' },  // MSG /pack

  // Grains
  g1:  { priceK: 22, source: 'market' },   // Rice /kg
  g2:  { priceK: 30, source: 'market' },   // Pasta /pack
  g3:  { priceK: 18, source: 'market' },   // Flour /kg
  g4:  { priceK: 35, source: 'market' },   // Bread /pc
  g5:  { priceK: 20, source: 'market' },   // Noodles /pack
  g6:  { priceK: 45, source: 'market' },   // Oats /kg
  g7:  { priceK: 100, source: 'market' },  // Quinoa /kg
  g8:  { priceK: 40, source: 'market' },   // Couscous /pack
  g9:  { priceK: 30, source: 'market' },   // Breadcrumbs /pack
  g10: { priceK: 45, source: 'market' },   // Tortilla /pack
  g11: { priceK: 40, source: 'market' },   // Pita /pack
  g12: { priceK: 25, source: 'market' },   // Rice Noodles /pack
  g13: { priceK: 35, source: 'market' },   // Udon /pack
  g14: { priceK: 20, source: 'market' },   // Cornstarch /pack
  g15: { priceK: 22, source: 'market' },   // Sugar /kg

  // Oils
  o1:  { priceK: 150, source: 'market' },  // Olive Oil /btl
  o2:  { priceK: 50, source: 'market' },   // Vegetable Oil /btl
  o3:  { priceK: 80, source: 'market' },   // Coconut Oil /btl
  o4:  { priceK: 75, source: 'market' },   // Sesame Oil /btl
  o5:  { priceK: 55, source: 'market' },   // Canola Oil /btl
  o6:  { priceK: 50, source: 'market' },   // Butter /pack
  o7:  { priceK: 90, source: 'market' },   // Ghee /btl
  o8:  { priceK: 250, source: 'market' },  // Truffle Oil /btl
  o9:  { priceK: 60, source: 'market' },   // Chili Oil /btl
  o10: { priceK: 120, source: 'market' },  // Avocado Oil /btl

  // Proteins
  p1:  { priceK: 90, source: 'market' },   // Chicken /kg
  p2:  { priceK: 250, source: 'market' },  // Beef /kg
  p3:  { priceK: 120, source: 'market' },  // Pork /kg
  p4:  { priceK: 350, source: 'market' },  // Salmon /kg
  p5:  { priceK: 300, source: 'market' },  // Shrimp /kg
  p6:  { priceK: 45, source: 'market' },   // Eggs /dozen
  p7:  { priceK: 25, source: 'market' },   // Tofu /pack
  p8:  { priceK: 130, source: 'market' },  // Ground Meat /kg
  p9:  { priceK: 60, source: 'market' },   // Sausage /pack
  p10: { priceK: 80, source: 'market' },   // Bacon /pack

  // Dairy
  d1:  { priceK: 35, source: 'market' },   // Milk /L
  d2:  { priceK: 70, source: 'market' },   // Cheese /pack
  d3:  { priceK: 55, source: 'market' },   // Cream /L
  d4:  { priceK: 30, source: 'market' },   // Yogurt /pack
  d5:  { priceK: 60, source: 'market' },   // Mozzarella /pack
  d6:  { priceK: 100, source: 'market' },  // Parmesan /pack
  d7:  { priceK: 40, source: 'market' },   // Sour Cream /pack
  d8:  { priceK: 50, source: 'market' },   // Whipped Cream /can

  // Gas
  ga1: { priceK: 450, source: 'market' },  // LPG Tank
  ga2: { priceK: 50, source: 'market' },   // Butane /can
  ga3: { priceK: 120, source: 'market' },  // Charcoal /bag
  ga4: { priceK: 60, source: 'market' },   // Lighter Fluid /btl
  ga5: { priceK: 500, source: 'market' },  // Propane /tank

  // Equipment
  e1:  { priceK: 120, source: 'market' },  // Gloves /box
  e2:  { priceK: 180, source: 'market' },  // Apron /pc
  e3:  { priceK: 60, source: 'market' },   // Foil /roll
  e4:  { priceK: 45, source: 'market' },   // Cling Wrap /roll
  e5:  { priceK: 55, source: 'market' },   // Parchment Paper /roll
  e6:  { priceK: 45, source: 'market' },   // Ziplock Bags /box
  e7:  { priceK: 80, source: 'market' },   // Containers /pack
  e8:  { priceK: 30, source: 'market' },   // Labels /roll
  e9:  { priceK: 40, source: 'market' },   // Trash Bags /roll
  e10: { priceK: 60, source: 'market' },   // Paper Towels /pack

  // Tissue & Cleaning
  t1:  { priceK: 45, source: 'market' },   // Tissue Paper /pack
  t2:  { priceK: 30, source: 'market' },   // Napkins /pack
  t3:  { priceK: 40, source: 'market' },   // Wet Wipes /pack
  t4:  { priceK: 60, source: 'market' },   // Sanitizer /btl
  t5:  { priceK: 35, source: 'market' },   // Dish Soap /btl
  t6:  { priceK: 55, source: 'market' },   // Surface Cleaner /btl
  t7:  { priceK: 40, source: 'market' },   // Bleach /btl
  t8:  { priceK: 25, source: 'market' },   // Scrub Brush /pc
  t9:  { priceK: 30, source: 'market' },   // Sponge /pack
  t10: { priceK: 70, source: 'market' },   // Mop Refill /pc
};

/**
 * Get price in thousands VND for an ingredient.
 * Returns undefined if no price is set.
 */
export function getPriceK(ingredientId: string): number | undefined {
  return referencePrices[ingredientId]?.priceK;
}

/**
 * Format price for display: "25k" means 25,000₫
 */
export function formatPriceK(priceK: number): string {
  return `${priceK}k`;
}

/**
 * Calculate estimated cost for a quantity.
 * Returns value in thousands VND.
 */
export function estimateCostK(ingredientId: string, quantity: number): number | undefined {
  const priceK = getPriceK(ingredientId);
  if (priceK === undefined) return undefined;
  return Math.round(priceK * quantity * 10) / 10;
}
