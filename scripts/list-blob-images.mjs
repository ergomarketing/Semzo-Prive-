import { list } from "@vercel/blob";

const { blobs } = await list({ prefix: "", limit: 1000 });

console.log(`Total archivos en Blob: ${blobs.length}`);
console.log("\n--- TODOS LOS ARCHIVOS ---");
blobs.forEach((b) => {
  console.log(`${b.pathname} | ${b.url}`);
});
