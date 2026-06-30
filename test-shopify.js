const fs = require('fs')

// Charger .env manuellement
const envContent = fs.readFileSync('/root/scaleyourshop/.env', 'utf8')
for (const line of envContent.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const idx = t.indexOf('=')
  if (idx === -1) continue
  let v = t.slice(idx + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  process.env[t.slice(0, idx).trim()] = v
}

const SHOP_URL = process.argv[2]
const CLIENT_ID = process.argv[3]
const CLIENT_SECRET = process.argv[4]

async function main() {
  // 1. Obtenir un jeton
  const tokenRes = await fetch(`${SHOP_URL}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials' }).toString(),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    console.error('Échec récupération token:', tokenData)
    process.exit(1)
  }
  const token = tokenData.access_token
  console.log('✓ Token obtenu')

  // 2. Créer un produit avec 2 variantes
  const createRes = await fetch(`${SHOP_URL}/admin/api/2024-10/products.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({
      product: {
        title: 'Test ScaleYourShop — Montre',
        body_html: '<p>Description de test</p>',
        status: 'draft',
        variants: [
          { option1: 'Rouge', price: '19.99' },
          { option1: 'Bleu', price: '24.99' },
        ],
        options: [{ name: 'Couleur' }],
      },
    }),
  })
  const createData = await createRes.json()
  if (!createRes.ok) {
    console.error('✗ Échec création produit:', createRes.status, JSON.stringify(createData))
    process.exit(1)
  }
  console.log('✓ Produit créé — ID:', createData.product.id)
  console.log('✓ Variantes créées:', createData.product.variants.map(v => `${v.option1} (id:${v.id})`).join(', '))

  // 3. Tester l'assignation d'une image à la 1ère variante
  const productId = createData.product.id
  const variantId = createData.product.variants[0].id
  const imgRes = await fetch(`${SHOP_URL}/admin/api/2024-10/products/${productId}/images.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({
      image: {
        src: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg',
        variant_ids: [variantId],
      },
    }),
  })
  const imgData = await imgRes.json()
  if (!imgRes.ok) {
    console.error('✗ Échec assignation image variante:', imgRes.status, JSON.stringify(imgData))
  } else {
    console.log('✓ Image variante assignée — image ID:', imgData.image.id, '— variant_ids:', imgData.image.variant_ids)
  }
}

main().catch(err => { console.error('Erreur:', err); process.exit(1) })
