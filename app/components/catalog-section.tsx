"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, Info } from "lucide-react"

interface BagItem {
  id: string
  name: string
  brand: string
  description: string
  price: string
  retailPrice: string
  images: string[]
  membership: "essentiel" | "signature" | "prive"
  color: string
  material: string
  dimensions: string
  condition: string
  availability: boolean
}

export default function CatalogSection() {
  const [wishlist, setWishlist] = useState<string[]>([])

  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((itemId) => itemId !== id))
    } else {
      setWishlist([...wishlist, id])
    }
  }

  // CATÁLOGO COMPLETO CON TODAS LAS IMÁGENES
  const bags: BagItem[] = [
    // SIGNATURE BAGS (129€/mes)
    {
      id: "lv-pont-neuf-pm",
      name: "Pont-Neuf PM",
      brand: "Louis Vuitton",
      description:
        "El bolso Pont-Neuf de Louis Vuitton es un clásico atemporal confeccionado en cuero Epi, reconocible por su textura acanalada característica. Este modelo combina elegancia y funcionalidad con su diseño estructurado, asas dobles y herrajes dorados.",
      price: "129€/mes",
      retailPrice: "2.450€",
      images: ["/images/lv-pont-neuf-main.jpeg", "/images/lv-pont-neuf-detail.jpeg", "/images/lv-pont-neuf-side.jpeg"],
      membership: "signature",
      color: "Negro",
      material: "Cuero Epi",
      dimensions: "25 x 18 x 10 cm",
      condition: "Excelente",
      availability: true,
    },
    {
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
      membership: "signature",
      color: "Rojo coral multicolor",
      material: "Cuero Epi",
      dimensions: "21 x 12 x 3 cm",
      condition: "Excelente",
      availability: true,
    },
    // L'ESSENTIEL BAGS (59€/mes)
    {
      id: "lv-reverie",
      name: "Rêverie",
      brand: "Louis Vuitton",
      description: "Bolso bucket en cuero marrón con detalles dorados y correa ajustable. Diseño versátil y elegante.",
      price: "59€/mes",
      retailPrice: "1.350€",
      images: [
        "/images/lv-reverie-front.jpeg",
        "/images/lv-reverie-closure-detail.jpeg",
        "/images/lv-reverie-main.jpeg",
      ],
      membership: "essentiel",
      color: "Marrón",
      material: "Cuero",
      dimensions: "26 x 24 x 18 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "marni-trunk-mini",
      name: "Trunk Mini",
      brand: "Marni",
      description:
        "Bolso crossbody en cuero rosa pálido con herrajes dorados. Diseño minimalista y sofisticado con compartimentos internos organizados.",
      price: "59€/mes",
      retailPrice: "890€",
      images: ["/images/marni-front-view.jpeg", "/images/marni-side-view.jpeg", "/images/marni-interior-detail.jpeg"],
      membership: "essentiel",
      color: "Rosa pálido",
      material: "Cuero",
      dimensions: "20 x 15 x 8 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "patou-geometric-bag",
      name: "Le Patou Geometric",
      brand: "PATOU",
      description:
        "Bolso de diseño geométrico en cuero beige con forma semicircular distintiva. Correa ajustable y herrajes dorados. Marca francesa de lujo contemporáneo.",
      price: "59€/mes",
      retailPrice: "950€",
      images: ["/images/patou-front-view.png", "/images/patou-side-view.png", "/images/patou-interior-detail.png"],
      membership: "essentiel",
      color: "Beige",
      material: "Cuero",
      dimensions: "22 x 15 x 8 cm",
      condition: "Excelente",
      availability: true,
    },
    // PRIVÉ BAGS (189€/mes)
    {
      id: "lv-epi-yellow-handbag",
      name: "Malesherbes Epi",
      brand: "Louis Vuitton",
      description:
        "Elegante bolso Louis Vuitton en cuero Epi amarillo vibrante. Diseño clásico con asa superior y cierre plateado. Interior en cuero burgundy con acabados impecables.",
      price: "189€/mes",
      retailPrice: "2.950€",
      images: [
        "/images/lv-epi-yellow-front.png",
        "/images/lv-epi-yellow-side.png",
        "/images/lv-epi-yellow-interior.png",
      ],
      membership: "prive",
      color: "Amarillo",
      material: "Cuero Epi",
      dimensions: "24 x 18 x 12 cm",
      condition: "Excelente",
      availability: true,
    },
  ]

  // Filtrar bolsos por membresía
  const essentielBags = bags.filter((bag) => bag.membership === "essentiel")
  const signatureBags = bags.filter((bag) => bag.membership === "signature")
  const priveBags = bags.filter((bag) => bag.membership === "prive")

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-light text-slate-900 mb-4">Nuestra Colección</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Descubre nuestra selección de bolsos de lujo disponibles para cada nivel de membresía. Todos los bolsos son
            auténticos y han sido cuidadosamente seleccionados por nuestros expertos.
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all" className="text-sm">
                Todos los bolsos
              </TabsTrigger>
              <TabsTrigger value="essentiel" className="text-sm">
                L'Essentiel
              </TabsTrigger>
              <TabsTrigger value="signature" className="text-sm">
                Signature
              </TabsTrigger>
              <TabsTrigger value="prive" className="text-sm">
                Privé
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="essentiel">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {essentielBags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
            <div className="mt-12 p-6 bg-rose-nude/10 rounded-lg">
              <h3 className="font-serif text-xl text-slate-900 mb-4">Membresía L'Essentiel</h3>
              <p className="text-slate-700 mb-4">
                Con nuestra membresía L'Essentiel por solo 59€/mes, puedes disfrutar de estos elegantes bolsos y muchos
                más. La introducción perfecta al mundo de los bolsos de lujo.
              </p>
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">Suscribirse a L'Essentiel</Button>
            </div>
          </TabsContent>

          <TabsContent value="signature">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {signatureBags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
            <div className="mt-12 p-6 bg-rose-pastel/20 rounded-lg">
              <h3 className="font-serif text-xl text-slate-900 mb-4">Membresía Signature</h3>
              <p className="text-slate-700 mb-4">
                Nuestra membresía Signature por 129€/mes te da acceso a bolsos de mayor valor y exclusividad. La
                experiencia preferida por nuestras clientas más exigentes.
              </p>
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">Suscribirse a Signature</Button>
            </div>
          </TabsContent>

          <TabsContent value="prive">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {priveBags.map((bag) => (
                <BagCard
                  key={bag.id}
                  bag={bag}
                  inWishlist={wishlist.includes(bag.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
            <div className="mt-12 p-6 bg-indigo-dark/10 rounded-lg">
              <h3 className="font-serif text-xl text-slate-900 mb-4">Membresía Privé</h3>
              <p className="text-slate-700 mb-4">
                La membresía Privé por 189€/mes ofrece acceso a nuestros bolsos más exclusivos y codiciados. La
                experiencia definitiva para verdaderas conocedoras.
              </p>
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">Suscribirse a Privé</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function BagCard({
  bag,
  inWishlist,
  onToggleWishlist,
}: {
  bag: BagItem
  inWishlist: boolean
  onToggleWishlist: (id: string) => void
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const membershipColors = {
    essentiel: "bg-rose-nude text-slate-900",
    signature: "bg-rose-pastel/50 text-slate-900",
    prive: "bg-indigo-dark text-white",
  }

  const membershipNames = {
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md relative">
      {/* Etiqueta de membresía */}
      <div className="absolute top-3 left-3 z-10">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${membershipColors[bag.membership]}`}>
          {membershipNames[bag.membership]}
        </span>
      </div>

      {/* Botón de wishlist */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => onToggleWishlist(bag.id)}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart className={`h-5 w-5 ${inWishlist ? "fill-rose-500 text-rose-500" : "text-slate-600"}`} />
        </button>
      </div>

      {/* Contenedor de imagen */}
      <div className="relative aspect-square">
        <Image
          src={bag.images[currentImageIndex] || "/placeholder.svg"}
          alt={`${bag.brand} ${bag.name}`}
          width={500}
          height={500}
          className="object-contain w-full h-full p-4"
        />

        {/* Puntos de navegación */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
          {bag.images.map((_, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                currentImageIndex === index ? "bg-indigo-dark" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Información del producto */}
      <div className="p-4">
        <p className="text-sm text-slate-500">{bag.brand}</p>
        <h3 className="font-serif text-xl text-slate-900">{bag.name}</h3>
        <div className="mt-2">
          <p className="text-lg font-medium text-slate-900">{bag.price}</p>
          <p className="text-sm text-slate-500">Valor: {bag.retailPrice}</p>
        </div>

        {/* Botones */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/catalog/${bag.id}`}>
            <Button
              variant="outline"
              className="w-full border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
            >
              <Info className="h-4 w-4 mr-2" />
              Detalles
            </Button>
          </Link>
          <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Reservar
          </Button>
        </div>
      </div>
    </div>
  )
}
