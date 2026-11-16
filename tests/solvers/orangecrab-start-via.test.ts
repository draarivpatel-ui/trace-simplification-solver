import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { TraceSimplificationSolver } from "../../index"
import inputRoute from "../fixtures/orangecrab-start-via.json"

test("reproduces the lost start via from OrangeCrab phase 1", async (): Promise<void> => {
  const original = structuredClone(inputRoute)
  const solver = new TraceSimplificationSolver({
    hdRoutes: [structuredClone(inputRoute)],
    obstacles: [],
    connMap: new ConnectivityMap({
      GND: [inputRoute.connectionName, inputRoute.rootConnectionName],
    }),
    netByConnectionName: new Map([[inputRoute.connectionName, "GND"]]),
    colorMap: {},
    defaultViaDiameter: 0.28,
    layerCount: 6,
    preserveRouteEndpoints: true,
    enableCrossingViaReduction: true,
  })
  solver.solve()
  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  const [result] = solver.simplifiedHdRoutes
  expect(result!.route[0]).toEqual(inputRoute.route[0])
  expect(result!.route.at(-1)).toEqual(inputRoute.route.at(-1))
  expect(result!.route.some((point) => point.z === 0)).toBe(true)
  expect(result!.route.some((point) => point.z === 5)).toBe(true)
  expect(result!.vias).toHaveLength(0)
  expect(inputRoute).toEqual(original)
  const graphics = solver.visualize()
  graphics.title = `OrangeCrab GND escape: ${result!.vias.length} vias; top red, bottom blue`
  await expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
      includeTextLabels: false,
      svgWidth: 800,
      svgHeight: 600,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
