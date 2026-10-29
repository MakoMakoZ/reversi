// アプリアイコン・スプラッシュ画面・favicon を生成する。
// デザインはこのファイルの SVG が正本。変えたら `npm run icons` で作り直す。

import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const RES = 'android/app/src/main/res'
const GREEN = '#2f7a4f'
const LINE = '#1f5636'

// 1024 四方の座標系。盤のマス目は 240px で、中央の 4 マスに初期配置の石を置く
const CELL = 240
const C = 512
const R = 104

const defs = `
  <defs>
    <radialGradient id="black" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#5a5a5a"/>
      <stop offset="0.7" stop-color="#111"/>
    </radialGradient>
    <radialGradient id="white" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="0.7" stop-color="#d6d6d6"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>`

function background() {
  const lines = []
  for (let k = -2; k <= 2; k++) {
    const p = C + k * CELL
    lines.push(`<line x1="${p}" y1="-200" x2="${p}" y2="1224"/>`, `<line x1="-200" y1="${p}" x2="1224" y2="${p}"/>`)
  }
  return `<rect x="-200" y="-200" width="1424" height="1424" fill="${GREEN}"/>
  <g stroke="${LINE}" stroke-width="10">${lines.join('')}</g>`
}

function stones() {
  const d = CELL / 2
  const stone = (x, y, color) => `<circle cx="${x}" cy="${y}" r="${R}" fill="url(#${color})" filter="url(#shadow)"/>`
  return [
    stone(C - d, C - d, 'white'),
    stone(C + d, C - d, 'black'),
    stone(C - d, C + d, 'black'),
    stone(C + d, C + d, 'white'),
  ].join('')
}

/** scale: 中心を基準にした拡大率。clip: 'none' | 'rounded' | 'circle' */
function svg({ withBackground = true, withStones = true, scale = 1, clip = 'none' } = {}) {
  const clipPath =
    clip === 'rounded'
      ? '<clipPath id="clip"><rect width="1024" height="1024" rx="180"/></clipPath>'
      : clip === 'circle'
        ? '<clipPath id="clip"><circle cx="512" cy="512" r="512"/></clipPath>'
        : ''
  const body = `${withBackground ? background() : ''}${withStones ? stones() : ''}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs}${clipPath}
  <g${clip === 'none' ? '' : ' clip-path="url(#clip)"'}>
    <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${body}</g>
  </g>
</svg>
`
}

const png = (svgText, size) => sharp(Buffer.from(svgText)).resize(size, size).png().toBuffer()

async function save(path, buffer) {
  await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  await writeFile(path, buffer)
  console.log('[OK]', path)
}

// ランチャーアイコン。ic_launcher は dp 48、アダプティブアイコンの各層は dp 108
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
for (const [name, k] of Object.entries(DENSITIES)) {
  const dir = `${RES}/mipmap-${name}`
  // アダプティブ非対応の端末向け。マスクされないので石を大きめに見せる
  await save(`${dir}/ic_launcher.png`, await png(svg({ scale: 1.25, clip: 'rounded' }), 48 * k))
  await save(`${dir}/ic_launcher_round.png`, await png(svg({ scale: 1.25, clip: 'circle' }), 48 * k))
  // アダプティブアイコン。石は中央の安全領域（直径 66dp / 108dp）に収まる大きさ
  await save(`${dir}/ic_launcher_foreground.png`, await png(svg({ withBackground: false }), 108 * k))
  await save(`${dir}/ic_launcher_background.png`, await png(svg({ withStones: false }), 108 * k))
}

// スプラッシュ画面。既存ファイルと同じ大きさで、緑の地の中央に石を置く
const SPLASH = {
  drawable: [480, 320],
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
}
for (const [dir, [w, h]] of Object.entries(SPLASH)) {
  const logo = Math.round(Math.min(w, h) * 0.8)
  const buffer = await sharp({ create: { width: w, height: h, channels: 4, background: GREEN } })
    .composite([{ input: await png(svg({ withBackground: false }), logo), gravity: 'center' }])
    .png()
    .toBuffer()
  await save(`${RES}/${dir}/splash.png`, buffer)
}

// ブラウザのタブ用
await save('public/favicon.svg', Buffer.from(svg({ scale: 1.25, clip: 'rounded' })))
