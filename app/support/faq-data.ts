// Datos FAQ extraidos para poder ser importados desde server (layout.tsx
// para JSON-LD FAQPage schema) y desde client (page.tsx para render).
// Tipos sin "icon" para ser puro JSON serializable.
//
// IMPORTANTE: el contenido NO ha sido modificado - solo se ha extraido aqui.
// Unica correccion: el caracter corrupto "est��" reemplazado por "esta".

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategoryData {
  title: string
  description: string
  articles: number
  iconName:
    | "Users"
    | "Package"
    | "Truck"
    | "Shield"
    | "CreditCard"
    | "Settings"
  faqs: FaqItem[]
}

export const faqCategoriesData: FaqCategoryData[] = [
  {
    title: "Modos Descubre y Colecciona",
    iconName: "Package",
    description: "Cómo funcionan los dos modos de disfrutar tu membresía: rotar bolsos o hacer uno tuyo",
    articles: 6,
    faqs: [
      {
        question: "¿Puedo cambiar de bolso cuando quiera?",
        answer:
          "Sí, en Modo Descubre puedes solicitar el cambio cuando quieras dentro de los límites de tu membresía. En Modo Colecciona el bolso es tuyo desde el día uno, así que se queda contigo hasta que decidas hacerlo definitivamente tuyo o renunciar a él.",
      },
      {
        question: "¿Cuánto tarda un bolso en ser mío?",
        answer:
          "Cada bolso tiene un precio de compra fijado. Tu cuota mensual suma hacia ese precio hasta completarlo. También puedes adelantar la compra en cualquier momento pagando la diferencia pendiente desde tu panel de socia.",
      },
      {
        question: "¿Qué pasa si cancelo la membresía estando en Modo Colecciona?",
        answer:
          "Conservas el acceso completo hasta el final del ciclo facturado. Si estabas en Modo Colecciona, el crédito acumulado se pierde al cancelar — por eso recomendamos hacerlo solo cuando estés segura de no continuar.",
      },
      {
        question: "¿Hay seguro o cobertura del bolso?",
        answer:
          "Modo Descubre: incluido en tu cuota mensual. Cubre el desgaste por uso normal (pequeños arañazos, suciedad superficial, etc.). No cubre negligencia, pérdida, robo no denunciado ni daños graves causados por mal uso. Modo Colecciona: la responsabilidad sobre el bolso es tuya mientras lo tienes en proceso de compra, igual que ocurre con cualquier compra a plazos. Si decides abandonar la compra, pierdes el crédito acumulado hasta ese momento.",
      },
      {
        question: "¿Puedo pasar de un modo al otro?",
        answer:
          "Sí. Si estás en Modo Descubre y te enamoras del bolso que llevas, puedes convertirlo en Modo Colecciona desde tu panel: el crédito empieza a acumular desde ese momento. Si estás en Modo Colecciona y prefieres cambiar de bolso, puedes renunciar y volver a Modo Descubre (pierdes el crédito acumulado en ese bolso).",
      },
      {
        question: "¿El certificado de autenticidad es real?",
        answer:
          "Sí. Todos nuestros bolsos pasan por verificación profesional (Entrupy y partners equivalentes). Las socias en Modo Colecciona pueden ver y descargar el certificado desde su panel desde el primer día.",
      },
    ],
  },
  {
    title: "Membresías y Suscripciones",
    iconName: "Users",
    description: "Información sobre planes de membresía y suscripciones a bolsos de lujo",
    articles: 10,
    faqs: [
      {
        question: "¿Qué es la membresía de SEMZO PRIVE?",
        answer:
          "SEMZO es un servicio de suscripción de membresía para bolsos de lujo. La membresía desbloquea el acceso a la colección SEMZO, con bolsos que se adaptan a cada estilo, ocasión y personalidad; entregado directamente en tu puerta. Los miembros pueden experimentar un nuevo bolso cada mes, y comprar los estilos que desean conservar para siempre. Es una forma más inteligente y circular de disfrutar de la variedad y la novedad.",
      },
      {
        question: "¿Puedo recomendar a mi amigo a SEMZO PRIVE?",
        answer:
          "¡Sí tu puedes! Con el programa RECOMENDAR A MI AMIGA de SEMZO PRIVE, puedes recomendar a tantos amigos como desees. Cuando tu amigo se registre con tu código de referencia (envía un correo electrónico a nuestro equipo de membresía), recibirá 50€ en crédito SEMZO PRIVE por su primer cargo de cualquier membresía de tiempo completo. Una vez que completen el plazo mínimo de 60 días, también ganarás 50€ en crédito SEMZO PRIVE. Los créditos solo son válidos para membresías.",
      },
      {
        question: "¿Cómo funciona la membresía de bolsos de lujo Semzo Privé?",
        answer:
          "Nuestra membresía te permite acceder a una colección exclusiva de bolsos de diseñador por una tarifa mensual. Puedes reservar 1 bolso por mes, disfrutarlo durante todo el mes y cambiarlo por otro modelo al siguiente ciclo.",
      },
      {
        question: "¿Puedo cambiar mi plan de membresía en cualquier momento?",
        answer:
          "Sí, puedes actualizar o cambiar tu plan de membresía desde tu dashboard personal. Los cambios se aplicarán en tu próximo ciclo de facturación y tendrás acceso inmediato a los beneficios del nuevo plan.",
      },
    ],
  },
  {
    title: "Proceso de Reserva",
    iconName: "Package",
    description: "Todo sobre cómo reservar y gestionar tus bolsos de diseñador",
    articles: 6,
    faqs: [
      {
        question: "¿Cómo reservo un bolso de diseñador?",
        answer:
          "Desde tu dashboard, navega por nuestra colección de bolsos de marcas como Chanel, Louis Vuitton, Hermès y más. Selecciona el bolso que desees, elige las fechas y confirma tu reserva. El bolso será preparado y enviado en 24-48 horas.",
      },
      {
        question: "¿Cuántos bolsos puedo tener al mismo tiempo?",
        answer:
          "Todas nuestras membresías incluyen un bolso de lujo a la vez. El precio de tu membresía mensual se ajusta automáticamente según el valor del bolso que selecciones, permitiéndote acceder a piezas exclusivas de Chanel, Hermès, Louis Vuitton y otras marcas de lujo con total flexibilidad.",
      },
    ],
  },
  {
    title: "Entrega y Devoluciones",
    iconName: "Truck",
    description: "Información sobre envíos, entregas y proceso de devolución",
    articles: 7,
    faqs: [
      {
        question: "¿Cómo funciona la entrega de bolsos a domicilio?",
        answer:
          "Realizamos entregas gratuitas en 24-48 horas en Marbella y Málaga. Para otras ciudades de España, el tiempo de entrega es de 2-3 días laborables. Todos los envíos incluyen seguro completo y seguimiento en tiempo real.",
      },
      {
        question: "¿Cómo devuelvo un bolso cuando termine de usarlo?",
        answer:
          "La devolución se realiza automáticamente al finalizar tu mes de membresía. Debes devolver el bolso con todos los elementos originales (dust bag, tarjetas de autenticidad, etc.) usando la etiqueta de envío prepagada que recibiste junto al bolso. Una vez enviado, recibirás confirmación de recepción en 24-48 horas.",
      },
      {
        question: "¿Cómo sé que mi bolso ha sido devuelto con éxito?",
        answer:
          "Una vez que hemos recibido el bolso en nuestro almacén, se somete a una inspección física y luego se procesa para su devolución. Recibirás un correo electrónico para confirmar que tu pedido ha sido devuelto. Si tu pedido ha sido devuelto con daños que no estaban allí cuando se te envió el bolso, te enviaremos un correo electrónico por separado con respecto al daño y describiendo los próximos pasos.",
      },
      {
        question: "¿Qué pasa si no puedo devolver mis bolsos dentro del tiempo especificado?",
        answer:
          "Como miembro de Semzo Privé, es tu responsabilidad asegurarte de poder devolver el pedido de bolsos dentro del plazo asignado de un mes. Independientemente de dónde te encuentres, tus requisitos de membresía aún se aplican y a los miembros que no puedan devolver sus bolsos a tiempo se les pueden cobrar cargos por demora o se les puede pedir que compren el bolso en lugar de devolverlo. Si no devuelves un bolso en la fecha requerida, serás responsable de un recargo por retraso de 15€ por día hábil hasta que se devuelva el bolso. Cualquier bolso que no se devuelva después de 4 semanas se considerará no devuelto, y el miembro será responsable de pagar el valor total de venta del bolso.",
      },
    ],
  },
  {
    title: "Condición y autenticidad",
    iconName: "Shield",
    description: "Información sobre la autenticidad y estado de nuestros bolsos de lujo",
    articles: 2,
    faqs: [
      {
        question: "¿Cómo sé que los bolsos de su colección son auténticos?",
        answer:
          "Todas nuestras bolsas se obtienen directamente de marcas, vendedores autorizados o proveedores externos de segunda mano de buena reputación. Todos nuestros artículos han pasado por un riguroso proceso de autenticación de varias capas, realizado de forma independiente por nuestro equipo de expertos internos, así como por autenticadores de terceros, antes de estar disponibles. Podemos proporcionar un Certificado de Autenticidad de Entrupy para ciertos estilos de la colección a pedido. Si compra un artículo y un autenticador verificado demuestra que no es auténtico, SEMZO PRIVE le proporcionará un reembolso completo al devolver la bolsa. Si por cualquier motivo, no esta satisfecho con una bolsa que ha comprado en SEMZO PRIVE, puede devolverla de acuerdo con nuestra política de devoluciones. Comuníquese con nuestro equipo de membresía si tiene alguna pregunta sobre una bolsa que haya pedido con su membresía SEMZO PRIVE o comprado en SEMZO PRIVE. Tenga en cuenta que SEMZO PRIVE no es un vendedor autorizado de las marcas que enumera en su sitio web. Las marcas cuyos artículos se ofrecen no son responsables de ningún producto comprado a SEMZO PRIVE y no garantizan la autenticidad de los artículos.",
      },
      {
        question: "¿En qué estado están las bolsas?",
        answer:
          "Todos nuestros bolsos son nuevos o estilos usados en perfectas condiciones. Nuestros artículos vintage han vivido una vida anterior, por lo que, por supuesto, pueden mostrar algunos signos de edad. Algunos también pueden haber requerido reparaciones (que siempre se realizan con los más altos estándares), pero todo esto es parte del encanto de la bolsa. Si recibimos una bolsa que tiene un desgaste normal, tomaremos una decisión sobre si queremos mantenerla en la colección para que nuestros miembros la disfruten. Cuando las bolsas necesitan un poco de cariño, se reparan para prolongar su vida útil. Cuando ya no son una buena opción para la colección, encontramos un dueño amoroso para que continúen empoderando y elevando.",
      },
    ],
  },
  {
    title: "Facturación y Pagos",
    iconName: "CreditCard",
    description: "Gestión de pagos, facturación y métodos de pago aceptados",
    articles: 4,
    faqs: [
      {
        question: "¿Qué métodos de pago aceptan para la membresía?",
        answer:
          "Aceptamos todas las tarjetas de crédito principales (Visa, Mastercard, American Express), PayPal y transferencia bancaria. Los pagos se procesan de forma segura y automática cada mes.",
      },
      {
        question: "¿Puedo pausar mi membresía temporalmente?",
        answer:
          "Sí, puedes pausar tu membresía hasta por 3 meses al año sin penalizaciones. Durante la pausa no se realizarán cobros y podrás reactivarla cuando desees desde tu cuenta.",
      },
    ],
  },
  {
    title: "Cuidado y Mantenimiento",
    iconName: "Shield",
    description: "Consejos para el cuidado de bolsos de lujo y política de daños",
    articles: 7,
    faqs: [
      {
        question: "¿Qué ocurre si el bolso se daña o mancha?",
        answer:
          "Depende del modo en el que tengas el bolso. En Modo Descubre tu cuota incluye cobertura por uso normal: pequeñas manchas, roces o arañazos los gestiona nuestro equipo (limpieza profesional o reparación). Para daños graves causados por negligencia se aplica una política justa basada en el valor del bolso. En Modo Colecciona la responsabilidad es tuya mientras lo tienes en proceso de compra, igual que en cualquier compra a plazos. Queremos que disfrutes con libertad, no con miedo.",
      },
      {
        question: "¿Cómo debo cuidar los bolsos de cuero durante mi uso?",
        answer:
          "Incluimos una guía de cuidado con cada bolso. Recomendamos evitar la exposición directa al sol, usar productos de limpieza específicos para cuero de lujo, y guardar el bolso en su dust bag cuando no lo uses.",
      },
    ],
  },
  {
    title: "Cuenta y Perfil",
    iconName: "Settings",
    description: "Gestión de tu cuenta, perfil personal y configuraciones",
    articles: 3,
    faqs: [
      {
        question: "¿Cómo actualizo mi información de perfil y dirección?",
        answer:
          "Accede a tu dashboard y ve a la sección 'Mi Perfil'. Allí puedes actualizar tu información personal, direcciones de entrega, métodos de pago y preferencias de comunicación en tiempo real.",
      },
      {
        question: "¿Puedo tener múltiples direcciones de entrega?",
        answer:
          "Sí, puedes agregar hasta 3 direcciones de entrega diferentes (casa, oficina, etc.) y seleccionar cuál usar para cada reserva. Esto te da flexibilidad total para recibir tus bolsos donde más te convenga.",
      },
    ],
  },
]
