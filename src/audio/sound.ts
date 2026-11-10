import * as THREE from 'three'
import { useStore } from '../store'

// Alle geluiden worden live gemaakt met de Web Audio API: geen bestanden om te laden.
// Browsers staan geluid pas toe na een toets of tik, dus de AudioContext start bij de eerste invoer.

export type SoundKind = 'belt' | 'steam' | 'press' | 'beep'

type Emitter = { kind: SoundKind; object: THREE.Object3D; active?: () => boolean }

const VOLUME = 0.7
const HEARING = 24 // meter waarbinnen een machine hoorbaar is
const KIND_VOLUME: Record<SoundKind, number> = { belt: 0.16, steam: 0.07, press: 1, beep: 0.05 }
// "Rechts" vanuit de vaste camera, voor links/rechts-panning.
const RIGHT = new THREE.Vector3(20, 0, -16).normalize()

const emitters = new Set<Emitter>()
export function registerEmitter(e: Emitter) {
  emitters.add(e)
  return () => {
    emitters.delete(e)
  }
}

type Graph = ReturnType<typeof build>
let ctx: AudioContext | null = null
let graph: Graph | null = null

function unlock() {
  if (!ctx) {
    ctx = new AudioContext()
    graph = build(ctx)
    applyMute()
  }
  if (ctx.state === 'suspended' && !document.hidden) void ctx.resume()
}
for (const ev of ['keydown', 'pointerdown', 'touchend']) addEventListener(ev, unlock)

document.addEventListener('visibilitychange', () => {
  if (!ctx) return
  if (document.hidden) void ctx.suspend()
  else void ctx.resume()
})

addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) useStore.getState().toggleMute()
})
useStore.subscribe((s, prev) => {
  if (s.muted !== prev.muted) applyMute()
})

function applyMute() {
  if (!ctx || !graph) return
  graph.master.gain.setTargetAtTime(useStore.getState().muted ? 0 : VOLUME, ctx.currentTime, 0.05)
}

function noiseBuffer(ac: AudioContext, brown: boolean) {
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else data[i] = white
  }
  return buf
}

function build(ac: AudioContext) {
  const out = ac.createDynamicsCompressor()
  out.connect(ac.destination)
  const master = ac.createGain()
  master.gain.value = 0
  master.connect(out)

  const white = noiseBuffer(ac, false)
  const brown = noiseBuffer(ac, true)
  const loop = (buffer: AudioBuffer) => {
    const s = ac.createBufferSource()
    s.buffer = buffer
    s.loop = true
    s.start(0, Math.random() * 2)
    return s
  }
  const osc = (type: OscillatorType, freq: number) => {
    const o = ac.createOscillator()
    o.type = type
    o.frequency.value = freq
    o.start()
    return o
  }
  const gain = (v = 0) => {
    const g = ac.createGain()
    g.gain.value = v
    return g
  }
  const filter = (type: BiquadFilterType, freq: number, Q = 1) => {
    const f = ac.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = Q
    return f
  }
  const chain = (...nodes: AudioNode[]) => {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1])
  }

  // Achtergrond: het lage gerommel van een grote hal plus netbrom.
  chain(loop(brown), filter('lowpass', 380), gain(0.05), master)
  chain(osc('sine', 50), gain(0.012), master)

  // Heftruck: een kleine verbrandingsmotor. Twee licht ontstemde zaagtanden plus een sub-octaaf
  // geven de grom; een pulserende versterker op het ontstekingsritme geeft het "pruttelen".
  // Toerental en filter lopen mee met gas en snelheid.
  const engineA = osc('sawtooth', 32)
  const engineB = osc('sawtooth', 32)
  const engineSub = osc('square', 16)
  const engineMix = gain(0.5)
  engineA.connect(engineMix)
  engineB.connect(engineMix)
  chain(engineSub, gain(0.6), engineMix)
  const engineFilter = filter('lowpass', 400, 3)
  const grit = ac.createWaveShaper()
  grit.curve = new Float32Array(Array.from({ length: 256 }, (_, i) => Math.tanh(((i / 255) * 2 - 1) * 2.5)))
  const pulse = gain(0.6)
  const firing = osc('square', 16)
  const firingDepth = gain(0.4)
  chain(firing, firingDepth)
  firingDepth.connect(pulse.gain)
  const engineGain = gain()
  chain(engineMix, grit, engineFilter, pulse, engineGain, master)
  const reverse = gain()
  chain(osc('square', 1100), filter('lowpass', 2500), reverse, master)

  // Per soort machine één geluidslus; volume en panning volgen de dichtstbijzijnde.
  const positional = (input: AudioNode) => {
    const g = gain()
    const pan = ac.createStereoPanner()
    chain(input, g, pan, master)
    return { gain: g, pan }
  }

  // Lopende band: geratel van gefilterde ruis, gehakt door een snelle LFO.
  const rattle = gain(0.6)
  chain(loop(white), filter('bandpass', 900, 0.7), rattle)
  const rattleLfo = osc('square', 13)
  const rattleDepth = gain(0.4)
  chain(rattleLfo, rattleDepth)
  rattleDepth.connect(rattle.gain)

  // Stoom: hoog gesis dat langzaam aanzwelt.
  const hiss = gain(0.7)
  chain(loop(white), filter('highpass', 2500), hiss)
  const puff = gain(0.3)
  chain(osc('sine', 0.4), puff)
  puff.connect(hiss.gain)

  // Vrachtwagen: piep-piep bij achteruitrijden (aan/uit gezet in update).
  const beepGate = gain()
  chain(osc('square', 1000), filter('lowpass', 2200), beepGate)

  // Persen: losse dreunen worden hierin gespeeld.
  const pressIn = gain(1)

  return {
    master,
    white,
    engine: [engineA, engineB, engineSub, firing],
    engineFilter,
    engineGain,
    reverse,
    beepGate,
    pressIn,
    kinds: {
      belt: positional(rattle),
      steam: positional(hiss),
      press: positional(pressIn),
      beep: positional(beepGate),
    } as Record<SoundKind, { gain: GainNode; pan: StereoPannerNode }>,
  }
}

const set = (param: AudioParam, value: number, smooth = 0.08) => param.setTargetAtTime(value, ctx!.currentTime, smooth)
const tmp = new THREE.Vector3()
const nearest = {} as Record<SoundKind, { p: number; pan: number }>
let nextPress = 0

// Elke frame aangeroepen. speed en throttle zijn genormaliseerd (-1..1).
export function updateSound(player: THREE.Vector3, speed: number, throttle: number) {
  if (!ctx || !graph || ctx.state !== 'running') return
  const t = ctx.currentTime
  const s = Math.abs(speed)

  // Toeren: stationair ~30 Hz ontstekingen, gas geven laat hem al optoeren voordat hij rijdt.
  const load = Math.min(1, Math.abs(throttle))
  const rpm = Math.min(1, 0.65 * s + 0.35 * load)
  const f = 30 + 55 * rpm
  const [a, b, sub, firing] = graph.engine
  set(a.frequency, f, 0.15)
  set(b.frequency, f * 1.012, 0.15)
  set(sub.frequency, f / 2, 0.15)
  set(firing.frequency, f / 2, 0.15)
  set(graph.engineFilter.frequency, 280 + 700 * rpm + 300 * load)
  set(graph.engineGain.gain, 0.05 + 0.04 * rpm)
  set(graph.reverse.gain, speed < -0.05 && t % 0.8 < 0.4 ? 0.035 : 0, 0.01)
  set(graph.beepGate.gain, t % 0.9 < 0.45 ? 1 : 0, 0.005)

  for (const k of Object.keys(graph.kinds) as SoundKind[]) nearest[k] = { p: 0, pan: 0 }
  for (const e of emitters) {
    if (e.active && !e.active()) continue
    e.object.getWorldPosition(tmp)
    const p = Math.max(0, 1 - tmp.distanceTo(player) / HEARING) ** 2
    if (p <= nearest[e.kind].p) continue
    nearest[e.kind] = { p, pan: THREE.MathUtils.clamp(tmp.sub(player).dot(RIGHT) / 12, -0.9, 0.9) }
  }
  for (const k of Object.keys(graph.kinds) as SoundKind[]) {
    set(graph.kinds[k].gain.gain, KIND_VOLUME[k] * nearest[k].p)
    set(graph.kinds[k].pan.pan, nearest[k].pan, 0.2)
  }

  if (nearest.press.p > 0.01 && t >= nextPress) {
    thump(graph.pressIn, 0.5)
    nextPress = t + 1.3
  }
}

// Doffe dreun: een dalende lage toon met een tikje ruis erop.
function thump(into: AudioNode, level: number) {
  const ac = ctx!
  const t = ac.currentTime
  const o = ac.createOscillator()
  o.frequency.setValueAtTime(110, t)
  o.frequency.exponentialRampToValueAtTime(45, t + 0.25)
  const g = ac.createGain()
  g.gain.setValueAtTime(level, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
  o.connect(g).connect(into)
  o.start(t)
  o.stop(t + 0.4)
  noiseHit(into, level * 0.4, 1800, 0.08)
}

function noiseHit(into: AudioNode, level: number, cutoff: number, length: number) {
  const ac = ctx!
  const t = ac.currentTime
  const src = ac.createBufferSource()
  src.buffer = graph!.white
  const f = ac.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = cutoff
  const g = ac.createGain()
  g.gain.setValueAtTime(level, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + length)
  src.connect(f).connect(g).connect(into)
  src.start(t, Math.random())
  src.stop(t + length + 0.05)
}

function tone(freq: number, start: number, length: number, level: number, type: OscillatorType = 'triangle') {
  const ac = ctx!
  const o = ac.createOscillator()
  o.type = type
  o.frequency.value = freq
  const g = ac.createGain()
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(level, start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, start + length)
  o.connect(g).connect(graph!.master)
  o.start(start)
  o.stop(start + length + 0.05)
  return g
}

const ready = () => !!ctx && !!graph && ctx.state === 'running'

// Botsing van de heftruck; strength 0..1.
export function playImpact(strength: number) {
  if (!ready()) return
  noiseHit(graph!.master, 0.35 * strength, 500 + 1500 * strength, 0.25)
  thump(graph!.master, 0.4 * strength)
}

// Belletje bij het binnenrijden van een zone; een nieuwe zone krijgt twee tonen.
export function playChime(first: boolean) {
  if (!ready()) return
  const t = ctx!.currentTime
  tone(659, t, 0.5, 0.08)
  if (first) tone(988, t + 0.12, 0.7, 0.08)
}

// Toeter van een AGV die voor je moet stoppen.
export function playHonk(at: THREE.Vector3, player: THREE.Vector3) {
  if (!ready()) return
  const p = Math.max(0, 1 - at.distanceTo(player) / HEARING) ** 2
  if (p < 0.02) return
  const t = ctx!.currentTime
  tone(440, t, 0.12, 0.08 * p, 'square')
  tone(440, t + 0.18, 0.12, 0.08 * p, 'square')
}

// Tikje van het rad tijdens de loting.
export function playTick() {
  if (!ready()) return
  tone(1200, ctx!.currentTime, 0.04, 0.03, 'square')
}

// Klein deuntje als de uitslag bekend is.
export function playFanfare() {
  if (!ready()) return
  const t = ctx!.currentTime
  ;[523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.35, 0.06))
}
