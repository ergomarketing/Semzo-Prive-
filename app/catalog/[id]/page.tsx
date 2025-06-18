import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
import BagDetail from "../../components/bag-detail"

export default function BagDetailPage({ params }: { params: { id: string } }) {
  // Base de datos de bolsos con IDs que coinciden exactamente con catalog-section.tsx
  const bagsDatabase: { [key: string]: any } = {
    "lv-pont-neuf-pm": {
      id: "lv-pont-neuf-pm",
      name: "Pont-Neuf PM",
      brand: "Louis Vuitton",
      description:
        "El bolso Pont-Neuf de Louis Vuitton es un clásico atemporal confeccionado en cuero Epi, reconocible por su textura acanalada característica. Este modelo combina elegancia y funcionalidad con su diseño estructurado, asas dobles y herrajes dorados. Su interior espacioso cuenta con múltiples compartimentos, ideal para organizar tus pertenencias diarias.",
      price: "129€/mes",
      retailPrice: "2.450€",
      images: ["/images/lv-pont-neuf-main.jpeg", "/images/lv-pont-neuf-detail.jpeg", "/images/lv-pont-neuf-side.jpeg"],
      membership: "signature" as const,
      color: "Negro",
      material: "Cuero Epi",
      dimensions: "25 x 18 x 10 cm",
      condition: "Excelente",
      year: "2018",
      availability: { status: "available" as const },
      rating: 4.8,
      reviews: 127,
      features: [
        "Diseño icónico de Louis Vuitton",
        "Cuero Epi de alta calidad con textura acanalada",
        "Herrajes dorados que no se oxidan",
        "Interior espacioso con múltiples compartimentos",
        "Asas dobles para mayor comodidad",
        "Cierre con cremallera seguro",
        "Perfecto para uso diario y ocasiones especiales",
      ],
      careInstructions: [
        "Limpiar con un paño suave y seco",
        "Evitar el contacto con agua y líquidos",
        "Guardar en su dust bag original cuando no se use",
        "Evitar la exposición directa al sol por períodos prolongados",
        "No usar productos químicos o limpiadores abrasivos",
        "Rellenar con papel de seda para mantener la forma",
      ],
    },
    "lv-epi-wallet-chain": {
      id: "lv-epi-wallet-chain",
      name: "Pochette Félicie Epi",
      brand: "Louis Vuitton",
      description:
        "Elegante cartera con cadena en cuero Epi multicolor. Diseño versátil que funciona como clutch de noche o bolso crossbody. Interior organizado con múltiples compartimentos y acabados en tonos rosa y coral.",
      price: "129€/mes",
      retailPrice: "1.450€",
      images: [
        "/images/lv-epi-wallet-front.jpeg",
        "/images/lv-epi-wallet-side.jpeg",
        "/images/lv-epi-wallet-interior.jpeg",
      ],
      membership: "signature" as const,
      color: "Rojo coral multicolor",
      material: "Cuero Epi",
      dimensions: "21 x 12 x 3 cm",
      condition: "Excelente",
      year: "2020",
      availability: { status: "available" as const },
      rating: 4.9,
      reviews: 89,
      features: [
        "Diseño versátil 2 en 1",
        "Cuero Epi multicolor exclusivo",
        "Cadena desmontable",
        "Múltiples compartimentos organizados",
        "Perfecto para día y noche",
        "Tamaño compacto y elegante",
      ],
      careInstructions: [
        "Limpiar con un paño suave y seco",
        "Evitar el contacto con agua",
        "Guardar en su dust bag original",
        "Cuidar la cadena de rayones",
      ],
    },
    "lv-reverie": {
      id: "lv-reverie",
      name: "Rêverie",
      brand: "Louis Vuitton",
      description:
        "Bolso bucket en cuero marrón con detalles dorados y correa ajustable. Diseño versátil y elegante perfecto para el día a día.",
      price: "59€/mes",
      retailPrice: "1.350€",
      images: [
        "/images/lv-reverie-front.jpeg",
        "/images/lv-reverie-closure-detail.jpeg",
        "/images/lv-reverie-main.jpeg",
      ],
      membership: "essentiel" as const,
      color: "Marrón",
      material: "Cuero",
      dimensions: "26 x 24 x 18 cm",
      condition: "Excelente",
      year: "2019",
      availability: { status: "available" as const },
      rating: 4.7,
      reviews: 156,
      features: [
        "Diseño bucket clásico",
        "Cuero de alta calidad",
        "Correa ajustable",
        "Amplio espacio interior",
        "Cierre con cordón",
        "Versatilidad día/noche",
      ],
      careInstructions: [
        "Limpiar con un paño suave",
        "Hidratar el cuero ocasionalmente",
        "Evitar la humedad excesiva",
        "Guardar relleno para mantener forma",
      ],
    },
    "marni-trunk-mini": {
      id: "marni-trunk-mini",
      name: "Trunk Mini",
      brand: "Marni",
      description:
        "Bolso crossbody en cuero rosa pálido con herrajes dorados. Diseño minimalista y sofisticado con compartimentos internos organizados.",
      price: "59€/mes",
      retailPrice: "890€",
      images: ["/images/marni-front-view.jpeg", "/images/marni-side-view.jpeg", "/images/marni-interior-detail.jpeg"],
      membership: "essentiel" as const,
      color: "Rosa pálido",
      material: "Cuero",
      dimensions: "20 x 15 x 8 cm",
      condition: "Excelente",
      year: "2021",
      availability: { status: "available" as const },
      rating: 4.6,
      reviews: 73,
      features: [
        "Diseño minimalista italiano",
        "Color rosa pálido único",
        "Herrajes dorados",
        "Tamaño perfecto para crossbody",
        "Interior organizado",
        "Estilo contemporáneo",
      ],
      careInstructions: [
        "Limpiar con paño húmedo suave",
        "Evitar roces con superficies ásperas",
        "Proteger del sol directo",
        "Guardar en lugar seco",
      ],
    },
    "patou-geometric-bag": {
      id: "patou-geometric-bag",
      name: "Le Patou Geometric",
      brand: "PATOU",
      description:
        "Bolso de diseño geométrico en cuero beige con forma semicircular distintiva. Correa ajustable y herrajes dorados.",
      price: "59€/mes",
      retailPrice: "950€",
      images: ["/images/patou-front-view.jpeg", "/images/patou-side-view.jpeg", "/images/patou-interior-detail.jpeg"],
      membership: "essentiel" as const,
      color: "Beige",
      material: "Cuero",
      dimensions: "22 x 15 x 8 cm",
      condition: "Excelente",
      year: "2022",
      availability: { status: "available" as const },
      rating: 4.8,
      reviews: 45,
      features: [
        "Diseño geométrico único",
        "Forma semicircular distintiva",
        "Cuero beige versátil",
        "Correa ajustable",
        "Estilo arquitectónico",
        "Marca francesa emergente",
      ],
      careInstructions: [
        "Limpiar con paño seco",
        "Mantener forma geométrica",
        "Evitar presión excesiva",
        "Guardar en posición correcta",
      ],
    },
    "lv-epi-yellow-handbag": {
      id: "lv-epi-yellow-handbag",
      name: "Malesherbes Epi",
      brand: "Louis Vuitton",
      description:
        "Elegante bolso Louis Vuitton en cuero Epi amarillo vibrante. Diseño clásico con asa superior y cierre plateado.",
      price: "189€/mes",
      retailPrice: "2.950€",
      images: [
        "/images/lv-epi-yellow-front.jpeg",
        "/images/lv-epi-yellow-side.jpeg",
        "/images/lv-epi-yellow-interior.jpeg",
      ],
      membership: "prive" as const,
      color: "Amarillo",
      material: "Cuero Epi",
      dimensions: "24 x 18 x 12 cm",
      condition: "Excelente",
      year: "2017",
      availability: { status: "available" as const },
      rating: 4.9,
      reviews: 34,
      features: [
        "Color amarillo vibrante exclusivo",
        "Cuero Epi texturizado",
        "Interior burgundy contrastante",
        "Herrajes plateados premium",
        "Diseño clásico atemporal",
        "Pieza de colección",
      ],
      careInstructions: [
        "Limpiar solo con paño seco",
        "Proteger del contacto con otros colores",
        "Guardar en dust bag original",
        "Evitar exposición prolongada al sol",
      ],
    },
  }

  const bagDetail = bagsDatabase[params.id]

  // Si no se encuentra el bolso, mostrar error
  if (!bagDetail) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-serif text-slate-900 mb-4">Bolso no encontrado</h1>
            <p className="text-slate-600 mb-8">El bolso que buscas no existe o ha sido removido.</p>
            <a href="/catalog" className="bg-indigo-dark text-white px-6 py-3 rounded hover:bg-indigo-dark/90">
              Volver al Catálogo
            </a>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-20">
        <BagDetail bag={bagDetail} />
      </main>
      <Footer />
    </>
  )
}
