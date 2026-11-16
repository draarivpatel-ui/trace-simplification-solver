import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { SingleSimplifiedPathSolver5, type HighDensityRoute } from "../../index"

test("preserves start vias with coincident or nearly coincident anchors", (): void => {
  for (const offset of [0, -100, 100]) {
    for (const gap of [0, 1e-9, 1e-6]) {
      for (const [fromLayer, toLayer] of [
        [0, 5],
        [5, 0],
      ]) {
        for (const viaOnly of [false, true]) {
          const inputRoute: HighDensityRoute = {
            connectionName: "escape",
            traceThickness: 0.089,
            viaDiameter: 0.28,
            route: [
              { x: offset, y: offset + gap, z: fromLayer! },
              { x: offset, y: offset, z: toLayer! },
              ...(viaOnly
                ? []
                : [{ x: offset + 1, y: offset + 1, z: toLayer! }]),
            ],
            vias: [{ x: offset, y: offset }],
          }
          const original = structuredClone(inputRoute)
          const solver = new SingleSimplifiedPathSolver5({
            inputRoute,
            otherHdRoutes: [],
            obstacles: [],
            connMap: new ConnectivityMap({ GND: ["escape"] }),
            colorMap: {},
          })
          solver.solve()
          expect(solver.failed).toBe(false)
          expect(solver.solved).toBe(true)
          const result = solver.simplifiedRoute
          expect(result.vias).toEqual([{ x: offset, y: offset }])
          expect(result.route[0]).toEqual(inputRoute.route[0])
          expect(result.route.at(-1)).toEqual(inputRoute.route.at(-1))
          for (let i = 1; i < result.route.length; i++) {
            const before = result.route[i - 1]!
            const after = result.route[i]!
            expect(Number.isFinite(after.x) && Number.isFinite(after.y)).toBe(
              true,
            )
            if (before.z === after.z) continue
            expect({ x: before.x, y: before.y }).toEqual({
              x: after.x,
              y: after.y,
            })
            expect(result.vias).toContainEqual({ x: after.x, y: after.y })
          }
          expect(inputRoute).toEqual(original)
        }
      }
    }
  }
})
