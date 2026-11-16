import { expect, test } from "bun:test"
import { ConnectivityMap } from "circuit-json-to-connectivity-map"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { TraceSimplificationSolver } from "../../index"
import inputRoute from "../fixtures/orangecrab-start-via.json"
import pads from "../fixtures/orangecrab-start-via-pads.json"

test("preserves the start via from OrangeCrab phase 1", async (): Promise<void> => {
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
  expect(result!.vias).toHaveLength(1)
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
  ).toMatchSvgSnapshot(import.meta.path, { svgName: "focused" })
  // Original pads surrounding this routed escape, in board-world mm (+Y up).
  // They provide visual context; the solver reduction above stays unchanged.
  graphics.rects = pads
    .filter((pad) => pad.shape !== "circle")
    .map((pad) => ({
      center: pad.center,
      width: pad.width,
      height: pad.height,
      fill: "rgba(148, 163, 184, 0.3)",
    }))
  graphics.circles = [
    ...pads
      .filter((pad) => pad.shape === "circle")
      .map((pad) => ({
        center: pad.center,
        radius: pad.width / 2,
        fill: "rgba(148, 163, 184, 0.3)",
      })),
    ...(graphics.circles ?? []),
  ]
  graphics.texts = [
    {
      x: -2.5,
      y: 7.3,
      text: "OrangeCrab GND escape / simplification output",
      fontSize: 0.13,
      anchorSide: "center_left",
    },
    {
      x: -2.5,
      y: 7.1,
      text: `Start via: ${result!.vias.length} / 1; top red, bottom blue`,
      fontSize: 0.13,
      anchorSide: "center_left",
    },
  ]
  await expect(
    getSvgFromGraphicsObject(graphics, {
      backgroundColor: "white",
      includeTextLabels: false,
      svgWidth: 800,
      svgHeight: 600,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
