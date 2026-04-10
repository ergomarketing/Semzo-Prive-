import { list } from "@vercel/blob";

const { blobs } = await list({ prefix: "bag", limit: 200 });

console.log("=== IMAGENES DE BOLSOS EN BLOB ===");
for (const blob of blobs) {
  console.log(blob.pathname, "->", blob.url);
}
console.log("Total:", blobs.length);

// Tambien buscar sin prefix para ver todo
const { blobs: all } = await list({ limit: 500 });
console.log("\n=== TODOS LOS ARCHIVOS EN BLOB ===");
for (const blob of all) {
  if (!blob.pathname.startsWith("blog-")) {
    console.log(blob.pathname, "->", blob.url);
  }
}
