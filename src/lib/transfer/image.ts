import sharp from 'sharp'
import crypto from 'crypto'
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'

const MEDIA_DIR = path.join(process.cwd(), 'public', 'uploads')
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true })

export function cleanImageUrl(url: string): string {
  return url
    .replace(/\.(jpe?g|png|webp)_\d+x\d+[-\d]*\.(jpe?g|png|webp)$/i, '.$1')
    .replace(/_\d+x\d+[-\d]*\.(jpe?g|png|webp)$/i, '.$1')
    .replace(/-\d+x\d+\.(jpe?g|png|webp)$/i, '.$1')
    .replace(/\?.*$/, '')
}

export function filterImageUrls(urls: string[]): string[] {
  return [...new Set(
    urls.filter(url => {
      const f = decodeURIComponent(url.split('/').pop() || '')
      return !f.match(/_\d+x\d+/) && !f.includes('.jpg_') && !f.includes('.jpeg_')
    }).map(cleanImageUrl)
  )]
}

export function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': new URL(url).origin + '/',
      },
    }
    proto.get(url, options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

export async function processImage(
  url: string,
  slug: string,
  lang: string,
  index: number
): Promise<{ filename: string; hash: string; filepath: string } | null> {
  try {
    const buffer = await downloadBuffer(url)
    const hash = crypto.createHash('sha256').update(buffer).digest('hex')
    // Nommage stable et traçable (slug produit + langue + index) — pas de
    // suffixe aléatoire : faciliter la maintenance et permettre un re-transfert
    // idempotent (même produit → même nom de fichier → mise à jour propre).
    const filename = `${slug.slice(0, 40)}-${lang}-${index}.webp`
    const filepath = path.join(MEDIA_DIR, filename)

    await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath)

    return { filename, hash, filepath }
  } catch (err) {
    console.error(`Image processing error for ${url}:`, err)
    return null
  }
}
