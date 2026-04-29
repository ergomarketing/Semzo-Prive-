-- =============================================================
-- FASE 2C: Descripciones GEO-friendly para los 10 bolsos top.
-- =============================================================
-- Objetivo: que ChatGPT, Perplexity y Claude puedan citar el
-- contenido de Semzo Prive cuando alguien pregunte por estos
-- bolsos. Para ello las descripciones incluyen:
--   - Datos historicos verificables (anos, disenadores)
--   - Especificaciones concretas (modelo, dimensiones, material)
--   - Comparativa numerica alquiler vs venta
--   - Casos de uso especificos
--
-- Tambien se corrigen los colores de los dos Saint Laurent que
-- estaban mal asignados:
--   - Saint Laurent College -> MAGENTA
--   - Yves Saint Laurent Cassandre Envelope -> NEGRO
--
-- Idempotente: usa WHERE estricto. Si algun nombre no coincide
-- exactamente con BD, ese UPDATE no afecta filas (0 rows).
-- =============================================================

-- 1) CORRECCIONES DE COLOR (solapamos con descripcion del paso 2)

-- Saint Laurent College -> MAGENTA
UPDATE bags
SET color = 'Magenta',
    updated_at = NOW()
WHERE (brand ILIKE 'Saint Laurent' OR brand ILIKE 'Yves Saint Laurent')
  AND name ILIKE '%College%';

-- Yves Saint Laurent Cassandre Envelope -> NEGRO
UPDATE bags
SET color = 'Negro',
    updated_at = NOW()
WHERE (brand ILIKE 'Saint Laurent' OR brand ILIKE 'Yves Saint Laurent')
  AND name ILIKE '%Cassandre%Envelope%';


-- 2) DESCRIPCIONES GEO-FRIENDLY (10 bolsos top)

-- ---------- 1. Chanel 2.55 Reissue Rojo ----------
UPDATE bags
SET description = 'El Chanel 2.55, creado por Coco Chanel en febrero de 1955 (de ahi su nombre), es uno de los bolsos mas iconicos del siglo XX. Esta version Reissue conserva el cierre original "Mademoiselle" rectangular en tono plateado y la cadena entrelazada con piel, fieles al diseno de los anos 50, antes de que Karl Lagerfeld introdujera el cierre con doble C en 1983 (un modelo distinto: el Classic Flap).

Modelo: 2.55 Reissue 226 (medium)
Material: Piel envejecida (aged calfskin)
Dimensiones: 28 x 16 x 8 cm
Cierre: Mademoiselle rectangular plateado
Cadena: Entrelazada con piel, ajustable
Color: Rojo borgona con acabado vintage

Disponible en Semzo Prive desde 279€/mes (Membresia Prive). Precio de venta estimado: 3.800€. La membresia mensual equivale aprox. al 7% del precio de compra.

Ideal para eventos formales, cenas de gala, alfombras rojas y editoriales de moda. Por su tamano medium tambien funciona como bolso de dia sofisticado para reuniones o cocteles.',
    updated_at = NOW()
WHERE brand ILIKE 'Chanel'
  AND name ILIKE '%2.55%Reissue%'
  AND color ILIKE 'Rojo';


-- ---------- 2. Chanel Classic Flap Negro ----------
UPDATE bags
SET description = 'El Chanel Classic Flap (referencia 11.12 en tamano medium) fue redisenado por Karl Lagerfeld en 1983 a partir del 2.55 original de Coco Chanel, introduciendo el iconico cierre con doble C entrelazada que se ha convertido en el simbolo de Chanel. Es considerado uno de los bolsos mas codiciados del mundo y su precio de venta ha subido mas de un 70% en la ultima decada.

Modelo: Classic Flap Medium (referencia 11.12)
Material: Piel caviar (textura granulada) o cordero matelasse
Dimensiones: 25,5 x 15,5 x 6,5 cm
Cierre: Doble C entrelazada con giro
Cadena: Cadena dorada/plateada entrelazada con piel
Color: Negro intenso con herraje plateado

Disponible en Semzo Prive desde 279€/mes (Membresia Prive). Precio de venta estimado: 10.500€. La membresia mensual equivale aprox. al 2,7% del precio de compra, una de las mejores ratios alquiler/venta del mercado de lujo.

Ideal para cualquier ocasion: oficina, citas, eventos, viajes. El Classic Flap negro es considerado el bolso mas versatil del lujo.',
    updated_at = NOW()
WHERE brand ILIKE 'Chanel'
  AND name ILIKE '%Classic%Flap%'
  AND name NOT ILIKE '%Mini%'
  AND color ILIKE 'Negro';


-- ---------- 3. Chanel Mini Flap Matelasse Menta ----------
UPDATE bags
SET description = 'El Chanel Mini Flap es la version reducida del iconico Classic Flap, lanzada para una clientela mas joven y para uso de tarde-noche. La version "Square Mini" (cuadrada) se introdujo a finales de los 2010 y se convirtio rapidamente en el modelo mas codiciado de las nuevas colecciones, con precios que se duplican en el mercado de reventa.

Modelo: Mini Flap Matelasse (Square Mini)
Material: Piel de cordero (lambskin) matelasse
Dimensiones: 20 x 13 x 7 cm
Cierre: Doble C entrelazada
Cadena: Cadena dorada con piel entrelazada, ajustable
Color: Verde menta - color de edicion estacional, raro de encontrar

Disponible en Semzo Prive desde 279€/mes (Membresia Prive). Precio de venta estimado: 5.500€. Los colores menta y pastel de Chanel son ediciones limitadas que se agotan en horas tras su lanzamiento.

Ideal para eventos de tarde, cocteles, bodas de dia y looks editoriales. Por su tamano mini funciona como statement piece mas que como bolso utilitario.',
    updated_at = NOW()
WHERE brand ILIKE 'Chanel'
  AND name ILIKE '%Mini%Flap%Matelasse%';


-- ---------- 4. Saint Laurent College Magenta ----------
UPDATE bags
SET description = 'El Saint Laurent College fue disenado bajo la direccion creativa de Anthony Vaccarello (director artistico de Saint Laurent desde 2016) y se inspira en la estetica preppy/college americana de los anos 90. Su diseno matelasse en chevron y el logo YSL en metal lo han convertido en uno de los bolsos mas vendidos de la maison en la ultima decada.

Modelo: College Medium
Material: Piel matelasse en chevron
Dimensiones: 24 x 17 x 6 cm
Cierre: Solapa con logo YSL metalico
Cadena: Cadena dorada y piel intercalada, convertible cruzado u hombro
Color: Magenta intenso (rosa fucsia)

Disponible en Semzo Prive desde 149€/mes (Membresia Signature). Precio de venta estimado: 2.500€. La membresia mensual equivale aprox. al 6% del precio de compra.

Ideal para looks atrevidos, eventos creativos, photoshoots y para anadir un punto de color a outfits monocromaticos. El magenta es una de las apuestas cromaticas mas fotografiadas en street style.',
    updated_at = NOW()
WHERE (brand ILIKE 'Saint Laurent' OR brand ILIKE 'Yves Saint Laurent')
  AND name ILIKE '%College%';


-- ---------- 5. Yves Saint Laurent Cassandre Envelope Negro ----------
UPDATE bags
SET description = 'El bolso Cassandre Envelope debe su nombre al monograma "YSL" entrelazado, disenado por el cartelista frances A.M. Cassandre (Adolphe Mouron) en 1961 para Yves Saint Laurent. La forma "envelope" (sobre) se inspira en los clutches sofisticados de los anos 50 y se relanzo como uno de los bolsos insignia de la maison bajo la direccion de Anthony Vaccarello.

Modelo: Cassandre Envelope Medium
Material: Piel granulada con monograma matelasse
Dimensiones: 24 x 17,5 x 6 cm
Cierre: Solapa magnetica con logo YSL en metal
Cadena: Cadena dorada con asa, convertible clutch u hombro
Color: Negro absoluto con herraje dorado

Disponible en Semzo Prive desde 149€/mes (Membresia Signature). Precio de venta estimado: 2.300€. La membresia mensual equivale aprox. al 6,5% del precio de compra.

Ideal para cenas, cocteles, galas y eventos de noche. La combinacion negro + oro lo convierte en el bolso de fiesta mas versatil del segmento premium.',
    updated_at = NOW()
WHERE (brand ILIKE 'Saint Laurent' OR brand ILIKE 'Yves Saint Laurent')
  AND name ILIKE '%Cassandre%Envelope%';


-- ---------- 6. Louis Vuitton Malesherbes Epi Amarillo ----------
UPDATE bags
SET description = 'El Louis Vuitton Malesherbes es un modelo vintage de los anos 90, descontinuado de la produccion actual. Fue uno de los primeros bolsos de mano estructurados de Louis Vuitton fabricado en piel Epi (cuero granulado patentado por LV en 1985), un material conocido por su resistencia y su acabado texturizado en relieve.

Modelo: Malesherbes (vintage, descontinuado)
Material: Piel Epi (cuero granulado)
Dimensiones: aprox. 26 x 19 x 13 cm
Cierre: Solapa con cierre metalico dorado
Asas: Asa superior corta de piel
Color: Amarillo Tassil (conocido tambien como "Citron"), color de archivo dificil de encontrar

Disponible en Semzo Prive desde 149€/mes (Membresia Signature). Precio de venta estimado en el mercado vintage: 2.000-2.800€ segun condicion. Las piezas vintage de LV en colores raros se han revalorizado un 40% en los ultimos 5 anos.

Ideal para looks vintage, editoriales, fans del archivo Louis Vuitton y para quienes buscan una pieza unica que no se ve en cada esquina.',
    updated_at = NOW()
WHERE brand ILIKE 'Louis Vuitton'
  AND name ILIKE '%Malesherbes%';


-- ---------- 7. Fendi Baguette Cereza ----------
UPDATE bags
SET description = 'El Fendi Baguette fue creado en 1997 por Silvia Venturini Fendi y su nombre viene de la forma de llevarlo: bajo el brazo, como una baguette francesa. Salto a la fama mundial cuando Carrie Bradshaw (Sarah Jessica Parker) lo lucio en Sex and the City, llamandolo "It is not a bag, it is a Baguette". Es considerado el primer "It bag" de la historia de la moda contemporanea.

Modelo: Baguette Medium
Material: Piel napa
Dimensiones: 27 x 15 x 6 cm
Cierre: Hebilla con logo FF doble Fendi metalico
Asa: Asa corta de piel, llevable bajo el brazo
Color: Cereza (rojo brillante)

Disponible en Semzo Prive desde 149€/mes (Membresia Signature). Precio de venta estimado: 2.700€. La membresia mensual equivale aprox. al 5,5% del precio de compra.

Ideal para looks cocktail, eventos, cenas y outfits que celebren los 90/2000. Su tamano compacto lo hace perfecto para llevarlo bajo el brazo, fiel a su uso original.',
    updated_at = NOW()
WHERE brand ILIKE 'Fendi'
  AND name ILIKE '%Baguette%'
  AND name NOT ILIKE '%Peekaboo%';


-- ---------- 8. Fendi Mini Peekaboo Rojo ----------
UPDATE bags
SET description = 'El Fendi Peekaboo fue creado en 2009 por Silvia Venturini Fendi y debe su nombre a su doble compartimento: cuando se abre, "asoma" (peeks) el interior, generalmente en un color contrastante. Es el modelo flagship de Fendi y se fabrica artesanalmente en el atelier de Roma con la tecnica Selleria (costura sillera a mano), heredada del trabajo en arneses ecuestres.

Modelo: Mini Peekaboo
Material: Piel Selleria con costura sillera artesanal
Dimensiones: 23 x 18 x 10 cm
Cierre: Doble cierre giratorio en metal
Asa: Asa superior y bandolera ajustable extraible
Color: Rojo intenso con interior contrastado

Disponible en Semzo Prive desde 279€/mes (Membresia Prive). Precio de venta estimado: 3.500€. La membresia mensual equivale aprox. al 8% del precio de compra.

Ideal para uso diario sofisticado, oficina, viajes cortos y eventos de tarde. Su construccion dual permite llevarlo cerrado (formal) o abierto (casual chic).',
    updated_at = NOW()
WHERE brand ILIKE 'Fendi'
  AND name ILIKE '%Peekaboo%';


-- ---------- 9. Gucci Bamboo 1947 Medium Camel ----------
UPDATE bags
SET description = 'El Gucci Bamboo, creado en 1947, es uno de los primeros "It bag" de la historia y nacio de la escasez de materiales en la posguerra italiana. Los artesanos de Gucci, sin acceso a metales y pieles convencionales, recurrieron al bambu importado de Japon, calentandolo con fuego para curvarlo y crear el iconico mango. La reedicion actual se llama "Gucci Bamboo 1947".

Modelo: Bamboo 1947 Small/Medium
Material: Piel granulada con asa de bambu natural
Dimensiones: 21 x 17 x 9 cm
Cierre: Hebilla giratoria de bambu
Asa: Asa de bambu lacado (cada pieza es unica por la veta natural)
Color: Camel (tan calido)

Disponible en Semzo Prive desde 149€/mes (Membresia Signature). Precio de venta estimado: 3.200€. La membresia mensual equivale aprox. al 4,7% del precio de compra.

Ideal para looks day-to-night, oficinas creativas, eventos de moda y como pieza statement vintage. El Bamboo esta considerado uno de los bolsos mas coleccionables de Gucci.',
    updated_at = NOW()
WHERE brand ILIKE 'Gucci'
  AND name ILIKE '%Bamboo%';


-- ---------- 10. Gucci Jackie Burdeos ----------
UPDATE bags
SET description = 'El Gucci Jackie fue disenado en 1961 (originalmente llamado "Constance") y debe su nombre actual a Jackie Kennedy Onassis, que lo convirtio en su bolso favorito y fue fotografiada con el docenas de veces durante los anos 60-70. Alessandro Michele (entonces director creativo de Gucci) lo relanzo en 2020 como "Jackie 1961", manteniendo el cierre tipo piston original.

Modelo: Jackie 1961 Medium
Material: Piel granulada
Dimensiones: 28 x 19 x 8 cm
Cierre: Cierre de piston metalico (signature)
Asa: Asa superior de piel ajustable
Color: Burdeos profundo

Disponible en Semzo Prive desde 149€/mes (Membresia Signature). Precio de venta estimado: 2.800€. La membresia mensual equivale aprox. al 5,3% del precio de compra.

Ideal para uso diario elegante, oficina, viajes y eventos discretos. Su forma hobo relajada y su tamano medium lo hacen uno de los bolsos mas comodos del lujo.',
    updated_at = NOW()
WHERE brand ILIKE 'Gucci'
  AND name ILIKE '%Jackie%';


-- =============================================================
-- VERIFICACION (devuelve los 10 bolsos actualizados)
-- =============================================================
SELECT
  brand,
  name,
  color,
  LEFT(description, 100) || '...' AS description_preview,
  LENGTH(description) AS description_chars,
  updated_at
FROM bags
WHERE
  (brand ILIKE 'Chanel'        AND name ILIKE '%2.55%Reissue%' AND color ILIKE 'Rojo')
  OR (brand ILIKE 'Chanel'     AND name ILIKE '%Classic%Flap%' AND name NOT ILIKE '%Mini%' AND color ILIKE 'Negro')
  OR (brand ILIKE 'Chanel'     AND name ILIKE '%Mini%Flap%Matelasse%')
  OR ((brand ILIKE 'Saint Laurent' OR brand ILIKE 'Yves Saint Laurent') AND name ILIKE '%College%')
  OR ((brand ILIKE 'Saint Laurent' OR brand ILIKE 'Yves Saint Laurent') AND name ILIKE '%Cassandre%Envelope%')
  OR (brand ILIKE 'Louis Vuitton' AND name ILIKE '%Malesherbes%')
  OR (brand ILIKE 'Fendi'      AND name ILIKE '%Baguette%' AND name NOT ILIKE '%Peekaboo%')
  OR (brand ILIKE 'Fendi'      AND name ILIKE '%Peekaboo%')
  OR (brand ILIKE 'Gucci'      AND name ILIKE '%Bamboo%')
  OR (brand ILIKE 'Gucci'      AND name ILIKE '%Jackie%')
ORDER BY brand, name;
