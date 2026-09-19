import { it } from "bun:test"
import npmLooksSame from "looks-same"
import looksSame from "../lib/looks-same"
import { createCircuitPng } from "./fixtures/create-circuit-png"
import { decode } from "fast-png"

it("debug pixel divergence", async () => {
  const img1 = await createCircuitPng(<board width="10mm" height="10mm"><resistor name="R1" footprint="0603" resistance="1k" /></board>)
  const img2 = await createCircuitPng(<board width="10mm" height="10mm"><resistor name="R1" pcbX="0.2" footprint="0603" resistance="1k" /></board>)
  const d1 = decode(img1), d2 = decode(img2)
  let minA = 255, alphaOnly = 0, alphaDiffs = 0
  const alphaInfo: string[] = []
  for (let p = 0; p < d1.width * d1.height; p++) {
    const i = p * 4
    const a1 = d1.data[i + 3]!, a2 = d2.data[i + 3]!
    minA = Math.min(minA, a1, a2)
    if (a1 !== a2) {
      alphaDiffs++
      const rgbSame = d1.data[i] === d2.data[i] && d1.data[i+1] === d2.data[i+1] && d1.data[i+2] === d2.data[i+2]
      if (rgbSame) {
        alphaOnly++
        if (alphaInfo.length < 15) alphaInfo.push(`p${p} (x=${p % d1.width},y=${(p / d1.width) | 0}): rgb=(${d1.data[i]},${d1.data[i+1]},${d1.data[i+2]}) a=${a1}->${a2}`)
      }
    }
  }
  console.log("MIN_ALPHA", minA, "ALPHA_DIFF_PX", alphaDiffs, "ALPHA_ONLY", alphaOnly)
  console.log(alphaInfo.join("\n"))
  const l = await looksSame(img1, img2, { tolerance: 2 })
  const n = await npmLooksSame(img1, img2, { tolerance: 2 })
  console.log("LOCAL_DIFFS", l.differentPixels, "NPM_DIFFS", n.differentPixels)
})
