import * as THREE from 'three'

// Positie van de heftruck van de speler, elke frame bijgewerkt door Forklift.
// Bewust geen React-state: NPC-voertuigen lezen dit 60× per seconde.
export const playerPos = new THREE.Vector3()
// Rijrichting in radialen (0 = naar +z), voor de pijl op de minikaart.
export const playerHeading = { yaw: 0 }

// Optionele vaste camera voor screenshots: ?cam=x,y,z,tx,ty,tz
const camParam = new URLSearchParams(location.search).get('cam')
export const debugCam = camParam ? camParam.split(',').map(Number) : null
