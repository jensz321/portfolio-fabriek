import * as THREE from 'three'

// Vloertextures, getekend op een canvas zodat er geen afbeeldingen geladen hoeven te worden.
// Eén texture = 8×8 m: vier tegels van 4 m met naden, lichte kleurvariatie en een randje licht.

const STYLES = {
  hall: { base: [212, 210, 226], spread: 6, seam: '#b3b1c9', highlight: 'rgba(255,255,255,0.35)', speckle: 0.04 },
  yard: { base: [150, 149, 170], spread: 5, seam: '#7f7e98', highlight: 'rgba(255,255,255,0.12)', speckle: 0.12 },
}

export function floorTexture(kind: keyof typeof STYLES, repeatX: number, repeatY: number) {
  const s = STYLES[kind]
  const size = 512
  const tile = size / 2
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  // vaste "random" zodat de vloer bij elke refresh hetzelfde is
  let seed = kind === 'hall' ? 7 : 13
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const d = (rand() - 0.5) * 2 * s.spread
      const [r, g, b] = s.base.map((c) => Math.round(c + d))
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(tx * tile, ty * tile, tile, tile)
      // zachte lichtrand linksboven, zoals de afgeschuinde kit-tegels
      ctx.fillStyle = s.highlight
      ctx.fillRect(tx * tile + 3, ty * tile + 3, tile - 6, 3)
      ctx.fillRect(tx * tile + 3, ty * tile + 3, 3, tile - 6)
    }
  }

  // korrel: kleine lichte en donkere spikkels
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    if (rand() < s.speckle) {
      const k = (rand() - 0.5) * 18
      img.data[i] += k
      img.data[i + 1] += k
      img.data[i + 2] += k
    }
  }
  ctx.putImageData(img, 0, 0)

  // naden tussen de tegels
  ctx.strokeStyle = s.seam
  ctx.lineWidth = 3
  for (let i = 0; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(i * tile, 0)
    ctx.lineTo(i * tile, size)
    ctx.moveTo(0, i * tile)
    ctx.lineTo(size, i * tile)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeatX, repeatY)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}
