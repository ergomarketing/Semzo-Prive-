"use client"

import type React from "react"

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

  // CATÁLOGO ACTUALIZADO CON IMÁGENES CORRECTAS
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
    {
      id: "celine-teen-triumph",
      name: "Teen Triumph",
      brand: "Céline",
      description:
        "Elegante bolso crossbody de Céline en cuero suave rosa nude. Diseño minimalista con el icónico logo dorado y correa ajustable. Perfecto para el día a día con un toque de sofisticación parisina.",
      price: "129€/mes",
      retailPrice: "2.100€",
      images: [
        "/images/celine-teen-triumph-front.jpeg",
        "/images/celine-teen-triumph-interior.jpeg",
        "/images/celine-teen-triumph-detail.jpeg",
      ],
      membership: "signature",
      color: "Rosa nude",
      material: "Cuero suave",
      dimensions: "19 x 14 x 4.5 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "loewe-gate",
      name: "Gate",
      brand: "Loewe",
      description:
        "El icónico bolso Gate de Loewe en cuero granulado marrón. Diseño arquitectónico con correas entrelazadas que crean la característica 'puerta'. Artesanía española excepcional con forro en ante suave.",
      price: "129€/mes",
      retailPrice: "2.200€",
      images: ["/images/loewe-gate-front.jpeg", "/images/loewe-gate-texture.jpeg", "/images/loewe-gate-interior.jpeg"],
      membership: "signature",
      color: "Marrón",
      material: "Cuero granulado",
      dimensions: "24 x 20 x 10 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "gucci-jackie",
      name: "Jackie",
      brand: "Gucci",
      description:
        "El legendario bolso Jackie de Gucci en canvas GG Supreme con detalles en cuero marrón. Incluye la icónica banda Web verde y roja, y el característico cierre tipo gancho dorado. Un clásico reinventado.",
      price: "129€/mes",
      retailPrice: "2.500€",
      images: [
        "/images/gucci-jackie-front.jpeg",
        "/images/gucci-jackie-interior.jpeg",
        "/images/gucci-jackie-label.jpeg",
      ],
      membership: "signature",
      color: "GG Supreme con marrón",
      material: "Canvas GG Supreme",
      dimensions: "30 x 22 x 11 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "prada-hobo",
      name: "Hobo Bag",
      brand: "Prada",
      description:
        "Elegante bolso hobo de Prada en cuero marrón cognac con forma de media luna. Diseño sofisticado con el icónico triángulo dorado y correa ajustable. Artesanía italiana excepcional con forro negro de lujo.",
      price: "129€/mes",
      retailPrice: "2.200€",
      images: [
        "/images/prada-hobo-front.jpeg",
        "/images/prada-hobo-interior-1.jpeg",
        "/images/prada-hobo-interior-2.jpeg",
      ],
      membership: "signature",
      color: "Marrón cognac",
      material: "Cuero",
      dimensions: "22 x 13.5 x 6 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "prada-bucket-saffiano",
      name: "Bucket Saffiano",
      brand: "Prada",
      description:
        "Bolso bucket de Prada en el icónico cuero Saffiano verde. Diseño funcional con cordón de cierre, compartimento principal espacioso y el distintivo triángulo dorado. Una pieza versátil para el día a día.",
      price: "129€/mes",
      retailPrice: "2.000€",
      images: [
        "/images/prada-bucket-saffiano-front.jpeg",
        "/images/prada-bucket-saffiano-logo.jpeg",
        "/images/prada-bucket-saffiano-interior.jpeg",
      ],
      membership: "signature",
      color: "Verde Saffiano",
      material: "Cuero Saffiano",
      dimensions: "22 x 22 x 13.5 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "fendi-ff-logo-pouch",
      name: "FF Logo Pouch",
      brand: "Fendi",
      description:
        "Elegante pouch de Fendi en cuero negro suave con el icónico logo FF dorado prominente. Diseño contemporáneo con textura fruncida y cadena dorada ajustable. Perfecto como clutch o crossbody.",
      price: "129€/mes",
      retailPrice: "2.300€",
      images: [
        "/images/fendi-ff-logo-front.jpeg",
        "/images/fendi-ff-logo-side.jpeg",
        "/images/fendi-ff-logo-detail.jpeg",
      ],
      membership: "signature",
      color: "Negro con logo dorado",
      material: "Cuero suave",
      dimensions: "31.5 x 21 x 10 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "fendi-saddle",
      name: "Saddle Bag",
      brand: "Fendi",
      description:
        "El icónico bolso Saddle de Fendi en cuero rosa con el distintivo logo FF dorado. Diseño revolucionario que redefinió la moda de bolsos con su forma única de silla de montar. Una pieza de colección contemporánea.",
      price: "129€/mes",
      retailPrice: "2.500€",
      images: [
        "/images/fendi-saddle-front.jpeg",
        "/images/fendi-saddle-interior.jpeg",
        "/images/fendi-saddle-back.jpeg",
      ],
      membership: "signature",
      color: "Rosa",
      material: "Cuero",
      dimensions: "19 x 15 x 5 cm",
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
      images: [
        "/images/patou-front-view-real.jpeg",
        "/images/patou-interior-detail-real.jpeg",
        "/images/patou-logo-detail.jpeg",
      ],
      membership: "essentiel",
      color: "Beige",
      material: "Cuero",
      dimensions: "22 x 15 x 8 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "loewe-gate-mini",
      name: "Gate Mini",
      brand: "Loewe",
      description:
        "La versión compacta del icónico Gate de Loewe en cuero beige. Mantiene el diseño distintivo de correas entrelazadas en un tamaño perfecto para ocasiones especiales. Correa con logo tejido incluida.",
      price: "59€/mes",
      retailPrice: "1.500€",
      images: [
        "/images/loewe-gate-mini-front.jpeg",
        "/images/loewe-gate-mini-interior.jpeg",
        "/images/loewe-gate-mini-logo.jpeg",
      ],
      membership: "essentiel",
      color: "Beige",
      material: "Cuero suave",
      dimensions: "20 x 13 x 8 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "prada-structured-bag",
      name: "Structured Bag",
      brand: "Prada",
      description:
        "Bolso estructurado de Prada en cuero negro con diseño minimalista y sofisticado. El icónico triángulo dorado centra el diseño, mientras que su forma compacta lo hace perfecto para ocasiones especiales.",
      price: "59€/mes",
      retailPrice: "1.600€",
      images: [
        "/images/prada-structured-front.jpeg",
        "/images/prada-structured-interior.jpeg",
        "/images/prada-structured-logo.jpeg",
      ],
      membership: "essentiel",
      color: "Negro",
      material: "Cuero",
      dimensions: "28.5 x 13.5 x 6.5 cm",
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
        "/images/lv-epi-yellow-front-real.jpeg",
        "/images/lv-epi-yellow-interior-real.jpeg",
        "/images/lv-epi-yellow-logo-detail.jpeg",
      ],
      membership: "prive",
      color: "Amarillo",
      material: "Cuero Epi",
      dimensions: "24 x 18 x 12 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "lady-dior",
      name: "Lady Dior",
      brand: "Dior",
      description:
        "El icónico bolso Lady Dior en cuero cannage negro con forro rojo vibrante. Incluye los característicos charms dorados 'D-I-O-R' y asas estructuradas. Una pieza de alta costura francesa que simboliza elegancia atemporal.",
      price: "189€/mes",
      retailPrice: "4.200€",
      images: ["/images/lady-dior-front.jpeg", "/images/lady-dior-interior.jpeg", "/images/lady-dior-charm.jpeg"],
      membership: "prive",
      color: "Negro con forro rojo",
      material: "Cuero Cannage",
      dimensions: "24 x 20 x 11 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "fendi-peekaboo",
      name: "Peekaboo",
      brand: "Fendi",
      description:
        "El legendario bolso Peekaboo de Fendi en cuero camel con forro FF signature. Diseño arquitectónico con el característico cierre metálico dorado y compartimentos internos. Una obra maestra de la artesanía italiana.",
      price: "189€/mes",
      retailPrice: "4.000€",
      images: [
        "/images/fendi-peekaboo-front.jpeg",
        "/images/fendi-peekaboo-side.jpeg",
        "/images/fendi-peekaboo-interior.jpeg",
      ],
      membership: "prive",
      color: "Camel",
      material: "Cuero",
      dimensions: "31.5 x 21 x 10 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "fendi-croissant",
      name: "Croissant",
      brand: "Fendi",
      description:
        "El emblemático bolso Croissant de Fendi en cuero blanco con el logo FENDI en relieve dorado. Diseño icónico de los 2000s que ha regresado como símbolo de estatus. Forma de media luna distintiva con asa superior y correa ajustable.",
      price: "189€/mes",
      retailPrice: "3.000€",
      images: [
        "/images/fendi-croissant-front.jpeg",
        "/images/fendi-croissant-handle.jpeg",
        "/images/fendi-croissant-interior.jpeg",
      ],
      membership: "prive",
      color: "Blanco",
      material: "Cuero",
      dimensions: "28 x 16.5 x 9 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "dior-saddle",
      name: "Saddle Bag",
      brand: "Dior",
      description:
        "El revolucionario bolso Saddle de Dior en cuero beige, diseñado por John Galliano. Una pieza que redefinió la moda de bolsos con su forma única inspirada en las sillas de montar. Símbolo de la alta costura francesa contemporánea.",
      price: "189€/mes",
      retailPrice: "3.600€",
      images: ["/images/dior-saddle-front.jpeg", "/images/dior-saddle-label.jpeg", "/images/dior-saddle-side.jpeg"],
      membership: "prive",
      color: "Beige",
      material: "Cuero",
      dimensions: "24 x 18 x 7 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "dior-vanity-case",
      name: "Vanity Case",
      brand: "Dior",
      description:
        "Elegante neceser Vanity Case de Dior en cuero cannage beige con logo Christian Dior en relieve. Diseño funcional y sofisticado con compartimentos organizados y cremallera dorada. Perfecto para viajes o como bolso de noche.",
      price: "189€/mes",
      retailPrice: "3.300€",
      images: ["/images/dior-vanity-front.jpeg", "/images/dior-vanity-label.jpeg", "/images/dior-vanity-interior.jpeg"],
      membership: "prive",
      color: "Beige cannage",
      material: "Cuero Cannage",
      dimensions: "18.5 x 13 x 10 cm",
      condition: "Excelente",
      availability: true,
    },
    {
      id: "chanel-classic-flap",
      name: "Classic Flap",
      brand: "Chanel",
      description:
        "El legendario bolso Classic Flap de Chanel en cuero negro acolchado con forro rojo burgundy. La pieza más icónica de la maison con su cadena dorada entrelazada y el distintivo cierre CC. Una inversión atemporal en elegancia francesa.",
      price: "189€/mes",
      retailPrice: "5.500€",
      images: [
        "/images/chanel-classic-flap-front.jpeg",
        "/images/chanel-classic-flap-back.jpeg",
        "/images/chanel-classic-flap-interior.jpeg",
      ],
      membership: "prive",
      color: "Negro con forro rojo",
      material: "Cuero acolchado",
      dimensions: "22 x 17.5 x 6 cm",
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
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                <Link href="/signup?plan=essentiel">Suscribirse a L'Essentiel</Link>
              </Button>
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
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                <Link href="/signup?plan=signature">Suscribirse a Signature</Link>
              </Button>
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
              <Button className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                <Link href="/signup?plan=prive">Suscribirse a Privé</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

// COMPONENTE BAGCARD COMPLETAMENTE REESCRITO PARA ARREGLAR LA NAVEGACIÓN
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

  const membershipToCheckoutPlan = {
    essentiel: "essentiel",
    signature: "signature",
    prive: "prive",
  }

  // FUNCIÓN MEJORADA PARA CAMBIAR IMÁGENES
  const handleImageChange = (index: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    console.log(`🔄 Cambiando imagen de ${bag.name} a índice:`, index)
    console.log(`📸 Nueva imagen:`, bag.images[index])
    setCurrentImageIndex(index)
  }

  // FUNCIÓN PARA MANEJAR ERRORES DE IMAGEN
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    console.log(`❌ Error cargando imagen:`, bag.images[currentImageIndex])
    event.currentTarget.src = "/placeholder.svg"
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md relative group">
      {/* Etiqueta de membresía */}
      <div className="absolute top-3 left-3 z-20">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${membershipColors[bag.membership]}`}>
          {membershipNames[bag.membership]}
        </span>
      </div>

      {/* Botón de wishlist */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleWishlist(bag.id)
          }}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart className={`h-5 w-5 ${inWishlist ? "fill-rose-500 text-rose-500" : "text-slate-600"}`} />
        </button>
      </div>

      {/* Contenedor de imagen */}
      <div className="relative aspect-square bg-gray-50">
        <Image
          src={bag.images[currentImageIndex] || bag.images[0] || "/placeholder.svg"}
          alt={`${bag.brand} ${bag.name} - Vista ${currentImageIndex + 1}`}
          width={500}
          height={500}
          className="object-contain w-full h-full p-4 transition-opacity duration-300"
          onError={handleImageError}
          priority={currentImageIndex === 0}
        />

        {/* Puntos de navegación - MEJORADOS */}
        {bag.images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-10">
            {bag.images.map((_, index) => (
              <button
                key={`${bag.id}-dot-${index}`}
                onClick={(e) => handleImageChange(index, e)}
                className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-indigo-dark focus:ring-offset-1 ${
                  currentImageIndex === index ? "bg-indigo-dark shadow-lg" : "bg-white/70 hover:bg-white/90 shadow-md"
                }`}
                aria-label={`Ver imagen ${index + 1} de ${bag.name}`}
                type="button"
              />
            ))}
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-4">
        <p className="text-sm text-slate-500">{bag.brand}</p>
        <h3 className="font-serif text-xl text-indigo-dark mb-2">{bag.name}</h3>
        <div className="mb-4">
          <p className="text-lg font-medium text-indigo-dark">{bag.price}</p>
          <p className="text-sm text-slate-500">Valor: {bag.retailPrice}</p>
        </div>

        {/* Botones */}
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/catalog/${bag.id}`} className="block">
            <Button
              variant="outline"
              className="w-full border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white transition-colors bg-transparent"
            >
              <Info className="h-4 w-4 mr-2" />
              Detalles
            </Button>
          </Link>
          <Link href={`/signup?plan=${membershipToCheckoutPlan[bag.membership]}&bag=${bag.id}`} className="block">
            <Button className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90 transition-colors">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Reservar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
