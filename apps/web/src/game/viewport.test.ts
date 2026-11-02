import { describe, expect, test } from 'vitest'
import { nearestNode } from './viewport.ts'

/* Arrow keys move the board selection (15 "Accessibility"). */

const nodes = [
  { id: 'users', x: 0, y: 100 },
  { id: 'server', x: 200, y: 100 },
  { id: 'database', x: 400, y: 100 },
  { id: 'analytics', x: 200, y: 300 },
  { id: 'far', x: 260, y: 0 },
]

describe('nearestNode', () => {
  test('moves to the closest Node ahead', () => {
    expect(nearestNode(nodes, 'users', 'right')).toBe('server')
    expect(nearestNode(nodes, 'server', 'right')).toBe('database')
    expect(nearestNode(nodes, 'server', 'down')).toBe('analytics')
    expect(nearestNode(nodes, 'server', 'up')).toBe('far')
    expect(nearestNode(nodes, 'database', 'left')).toBe('server')
  })

  test('stays put at the edge, and starts at the top left with nothing selected', () => {
    expect(nearestNode(nodes, 'users', 'left')).toBeNull()
    expect(nearestNode(nodes, null, 'right')).toBe('users')
    expect(nearestNode([], null, 'up')).toBeNull()
  })
})
