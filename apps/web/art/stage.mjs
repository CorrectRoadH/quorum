// One camera for every figure, so a server and a database drawn side by side keep
// the same scale. The box is a 100 x 100 footprint centred on the origin, from the
// feet 8 below the plate top to 50 above it. A part near the centre (a mast, a stack)
// may rise to about 100 before it leaves the frame, since the box's far top corner
// sets the top edge.

import * as k from './kit/iso-kit.mjs'

export const WIDTH = 240
export const HEIGHT = 200
export const FOOTPRINT = { x: -50, y: -50, w: 100, d: 100, r: 0 }
export const FLOOR = -8
export const CEILING = 50

export const P = k.fitProjection(k.boxCorners(FOOTPRINT, FLOOR, CEILING), WIDTH, HEIGHT, {
  pad: 10,
  azimuth: 45,
  elevation: 30,
})
