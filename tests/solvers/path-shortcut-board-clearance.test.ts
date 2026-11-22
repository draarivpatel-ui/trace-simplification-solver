import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { SingleSimplifiedPathSolver5 } from "../../lib/solvers/SimplifiedPathSolver/SingleSimplifiedPathSolver5_Deg45"
import { minimumDistanceBetweenSegments } from "../../lib/utils/minimumDistanceBetweenSegments"
import { MultiSimplifiedPathSolver } from "../../lib/solvers/SimplifiedPathSolver/MultiSimplifiedPathSolver"
import type { HighDensityRoute } from "../../lib/types/high-density-types"

const signal: HighDensityRoute = {
  connectionName: "signal",
  traceThickness: 0.16,
  viaDiameter: 0.6,
  vias: [],
  route: [
    { x: -3, y: 0, z: 0 },
    { x: -2, y: -1, z: 0 },
    { x: 2, y: -1, z: 0 },
    { x: 3, y: 0, z: 0 },
  ],
}

test("simplifying a legal detour preserves copper-to-copper clearance", () => {
  const other: HighDensityRoute = {
    ...signal,
    connectionName: "other",
    route: [
      { x: -0.5, y: 0.28, z: 0 },
      { x: 0.5, y: 0.28, z: 0 },
    ],
  }
  const solver = new MultiSimplifiedPathSolver({
    unsimplifiedHdRoutes: [signal],
    otherHdRoutes: [other],
    obstacles: [],
    minTraceToPadEdgeClearance: 0.14,
  })
  solver.solve()
  expect(solver.solved).toBe(true)
  const points = solver.simplifiedHdRoutes[0]!.route
  const gap =
    Math.min(
      ...points
        .slice(1)
        .map((p, i) =>
          minimumDistanceBetweenSegments(
            points[i]!,
            p,
            other.route[0]!,
            other.route[1]!,
          ),
        ),
    ) -
    (signal.traceThickness + other.traceThickness) / 2
  expect(gap).toBeGreaterThanOrEqual(0.14)
})

test("shortcut lookup includes traces within the board clearance across grid cells", () => {
  const solver = new SingleSimplifiedPathSolver5({
    inputRoute: signal,
    otherHdRoutes: [
      {
        ...signal,
        connectionName: "other",
        route: [
          { x: -1, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
        ],
      },
    ],
    obstacles: [],
    connMap: new ConnectivityMap({}),
    colorMap: {},
    minTraceToPadEdgeClearance: 0.9,
  })
  expect(solver.isValidPathSegment(signal.route[0]!, signal.route[3]!)).toBe(
    false,
  )
})
