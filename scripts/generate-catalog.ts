import fs from "node:fs"
import path from "node:path"

import { catalogKinds, type CatalogKind, type CatalogRecord } from "../lib/catalog-types"

process.env.REBUILD_CATALOG = "1"

const { getCatalogRecords } = await import("../lib/catalog")
const output = {} as Record<CatalogKind, CatalogRecord[]>

for (const kind of catalogKinds) {
  output[kind] = getCatalogRecords(kind)
  console.log(`${kind}: ${output[kind].length} mục`)
}

const outputPath = path.join(process.cwd(), "data", "catalog.generated.json")
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(output))
console.log(`Đã ghi ${outputPath}`)
