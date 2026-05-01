import './src/config.js'
import { db } from './src/firebase/admin.js'

async function seed() {
  console.log('Seeding data with KES prices...')
  
  // Clear existing data (optional but recommended for a clean seed)
  const storeSnap = await db.collection('stores').get()
  const productSnap = await db.collection('products').get()
  
  for (const doc of storeSnap.docs) await doc.ref.delete()
  for (const doc of productSnap.docs) await doc.ref.delete()

  const stores = [
    { name: "Woodcraft Studio", description: "Sustainable minimalist furniture crafted from reclaimed Nordic timber.", artisanId: "artisan_1", location: "Copenhagen, DK", craft: "Woodworking", rating: 5.0 },
    { name: "Earth & Fire", description: "Mastering the art of wheel-thrown functional stoneware for over 15 years.", artisanId: "artisan_2", location: "Tuscany, IT", craft: "Ceramics", rating: 4.9 },
    { name: "Blue Weaver", description: "Contemporary hand-woven textiles inspired by traditional West African patterns.", artisanId: "artisan_3", location: "Lagos, NG", craft: "Textiles", rating: 4.8 }
  ]

  const products = [
    { name: "Hand-Carved Oak Bowl", price: 12500, artisanId: "artisan_1", category: "Kitchen", description: "Beautifully carved from single block oak.", rating: 4.8 },
    { name: "Ceramic Minimalist Vase", price: 6500, artisanId: "artisan_2", category: "Home", description: "Hand-thrown stoneware vase.", rating: 4.9 },
    { name: "Indigo Linen Scarf", price: 8200, artisanId: "artisan_3", category: "Apparel", description: "100% organic linen dyed with natural indigo.", rating: 4.7 }
  ]

  for (const store of stores) {
    await db.collection('stores').add(store)
  }

  for (const product of products) {
    await db.collection('products').add(product)
  }

  console.log('KES Seed completed.')
  process.exit(0)
}

seed()
