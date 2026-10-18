import type { DocBlock } from "./colecciona-legal"

export function buildSimplePdf(blocks: DocBlock[], options?: { title?: string; footer?: string }): Uint8Array
