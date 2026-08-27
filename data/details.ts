export type Detail = {
  image: string;
  alt: string;
  short: string;
  facts: [string, string][];
  sections: { title: string; body: string }[];
  credit: string;
  license: string;
  commons: string;
  sources: { label: string; url: string }[];
};

export const details: Record<string, Detail> = {
  toledo: {
    image:'images/places/old-town.jpg', alt:'Vista del casco histórico de Toledo y sus principales monumentos',
    short:'Una ciudad construida en capas: romana, visigoda, andalusí, judía, cristiana e imperial.',
    facts:[['Población','88.356 habitantes en el padrón municipal de 2025'],['Patrimonio Mundial','Desde 1986'],['Río','Tajo']],
    sections:[
      {title:'Una posición estratégica',body:'Toledo ocupa un promontorio protegido por el gran meandro del Tajo. Esa posición explica su valor defensivo y político desde la Antigüedad. La romana Toletum fue municipio y nudo de comunicaciones; siglos después, la ciudad se convirtió en capital del reino visigodo y sede de sus concilios.'},
      {title:'De al-Ándalus a la ciudad imperial',body:'Tras la conquista islámica, Tulaytula fue una ciudad destacada de al-Ándalus y llegó a encabezar un reino taifa. Alfonso VI la incorporó a la Corona de Castilla en 1085. La convivencia, el contacto y también los conflictos entre comunidades cristianas, judías y musulmanas dejaron una herencia excepcional. Con Carlos V adquirió una fuerte dimensión imperial, antes del traslado estable de la corte a Madrid.'},
      {title:'Calles para orientarse',body:'Zocodover es la gran plaza de encuentro. La calle Comercio conduce hacia la Catedral; Santo Tomé y la calle de los Reyes Católicos articulan la antigua judería; el Alcázar domina el extremo oriental. El casco histórico combina adoquines, pendientes, callejones y cambios de nivel: conviene caminar sin prisa y mirar también hacia patios, cobertizos y torres.'}
    ],
    credit:'rheins', license:'CC BY 3.0', commons:'https://commons.wikimedia.org/wiki/File:Old_Town_of_Toledo_-_2013.07_-_panoramio.jpg',
    sources:[{label:'Turismo oficial de Toledo',url:'https://turismo.toledo.es/toledo.html'},{label:'UNESCO · Ciudad histórica de Toledo',url:'https://whc.unesco.org/en/list/379/'},{label:'Ayuntamiento · padrón 2025',url:'https://www.toledo.es/toledo-aumenta-el-padron-municipal-hasta-los-88-356-habitantes-en-2025/'},{label:'Wikipedia · Toledo',url:'https://es.wikipedia.org/wiki/Toledo'}]
  },
  orgaz: {
    image:'images/places/orgaz.jpg', alt:'El entierro del señor de Orgaz, obra de El Greco',
    short:'La obra maestra de El Greco permanece en el lugar para el que fue concebida.',
    facts:[['Autor','Doménikos Theotokópoulos, El Greco'],['Fecha','1586–1588'],['Lugar','Iglesia de Santo Tomé']],
    sections:[
      {title:'El encargo',body:'La parroquia de Santo Tomé encargó el lienzo para recordar a Gonzalo Ruiz de Toledo, señor de Orgaz y benefactor del templo. Aunque es conocido popularmente como conde de Orgaz, el personaje histórico no ostentó ese título. La obra debía hacer visible el milagro que, según la tradición, acompañó su entierro en 1323.'},
      {title:'Dos mundos en una misma escena',body:'En la zona inferior, san Esteban y san Agustín depositan el cuerpo del señor de Orgaz ante un grupo de caballeros y clérigos retratados con extraordinaria individualidad. En la parte superior, el espacio se abre hacia una visión celestial presidida por Cristo, la Virgen y san Juan Bautista. La figura del ángel enlaza ambas zonas llevando el alma del difunto.'},
      {title:'Qué observar',body:'Fíjate en el contraste entre la quietud ceremonial de la franja terrenal y el movimiento de la gloria; en las manos, las miradas y los rostros de la sociedad toledana; y en el niño del primer plano, probablemente Jorge Manuel, hijo del pintor. La luz, las figuras alargadas y el color anticipan la madurez del estilo de El Greco.'}
    ],
    credit:'El Greco', license:'Dominio público', commons:'https://commons.wikimedia.org/wiki/File:El_Greco_-_The_Burial_of_the_Count_of_Orgaz.JPG',
    sources:[{label:'Santo Tomé · información oficial',url:'https://toledomonumental.com/iglesia-de-santo-tome/'},{label:'Turismo de Toledo',url:'https://turismo.toledo.es/recursos/id2020-iglesia-de-santo-tome--entierro-del-senor-de-orgaz.html'},{label:'Wikipedia · la obra',url:'https://es.wikipedia.org/wiki/El_entierro_del_conde_de_Orgaz'}]
  },
  'santa-maria-la-blanca': {
    image:'images/places/synagogue.jpg', alt:'Interior blanco con arcos de herradura de Santa María la Blanca',
    short:'Una antigua sinagoga con formas de tradición islámica construida en un reino cristiano.',
    facts:[['Origen','Finales del siglo XII o comienzos del XIII'],['Estructura','Cinco naves'],['Uso actual','Monumento y espacio cultural']],
    sections:[
      {title:'Un edificio singular',body:'Santa María la Blanca fue levantada como sinagoga. La datación exacta es objeto de debate: una inscripción relaciona el edificio con el año 1180, aunque buena parte de la fábrica conservada suele situarse en el siglo XIII. Su aspecto actual es el resultado de varias transformaciones.'},
      {title:'Arquitectura',body:'El espacio se organiza en cinco naves separadas por pilares octogonales y arcos de herradura. Los capiteles de estuco incorporan piñas, volutas y motivos vegetales; sobre ellos, frisos geométricos recorren un interior de marcada blancura. La madera de la cubierta y la repetición de los arcos crean una perspectiva serena y rítmica.'},
      {title:'Las tres culturas, con matices',body:'El edificio resume la circulación de técnicas y lenguajes artísticos: formas vinculadas a la tradición islámica, una comunidad promotora judía y un contexto político cristiano. Fue transformado en iglesia a comienzos del siglo XV y tuvo después usos religiosos, asistenciales y militares. Es un símbolo útil para explicar contactos culturales sin ocultar los periodos de conflicto e intolerancia.'}
    ],
    credit:'Acediscovery', license:'CC BY 4.0', commons:'https://commons.wikimedia.org/wiki/File:Interior-Santa_Mar%C3%ADa-La-Blanca-synagogue-Toledo-1.jpg',
    sources:[{label:'Web oficial del monumento',url:'https://toledomonumental.com/sinagoga-de-santa-maria-la-blanca/'},{label:'Turismo de Toledo',url:'https://turismo.toledo.es/recursos/museos-y-monumentos/id606-sinagoga-de-santa-maria-la-blanca.html'},{label:'Wikipedia · Santa María la Blanca',url:'https://es.wikipedia.org/wiki/Santa_Mar%C3%ADa_la_Blanca_%28Toledo%29'}]
  },
  catedral: {
    image:'images/places/cathedral.jpg', alt:'Fachada principal y torre de la Catedral Primada de Toledo',
    short:'Una de las grandes catedrales góticas europeas y sede histórica de la Iglesia primada española.',
    facts:[['Inicio de las obras','1226'],['Estilo principal','Gótico'],['Elemento singular','El Transparente']],
    sections:[
      {title:'Una construcción de siglos',body:'La construcción de la Catedral de Santa María comenzó en 1226, durante el reinado de Fernando III y el arzobispado de Rodrigo Jiménez de Rada. El edificio avanzó durante más de dos siglos, incorporando soluciones y lenguajes de diferentes momentos sin perder la gran estructura gótica de cinco naves.'},
      {title:'Espacios esenciales',body:'La nave central conduce hacia la Capilla Mayor y el coro, cuyos sitiales muestran un excepcional trabajo escultórico. La torre domina el perfil urbano. En la girola se abre el Transparente, obra barroca de Narciso Tomé que combina arquitectura, escultura, pintura y luz. La sacristía conserva una importante pinacoteca con obras de El Greco y otros maestros.'},
      {title:'Qué observar',body:'Mira la escala de los pilares, las bóvedas y las vidrieras; la riqueza de la custodia de Enrique de Arfe, vinculada a la celebración del Corpus Christi; y la superposición de elementos góticos, renacentistas y barrocos. El templo continúa siendo un espacio de culto: la visita debe respetar las indicaciones, zonas reservadas y celebraciones.'}
    ],
    credit:'Travelphotographcenter', license:'CC0', commons:'https://commons.wikimedia.org/wiki/File:Toledo_Cathedral,_Spain.jpg',
    sources:[{label:'Web oficial de la Catedral',url:'https://www.catedralprimada.es/'},{label:'Historia oficial',url:'https://www.catedralprimada.es/es/info/catedral/historia'},{label:'Turismo de Toledo',url:'https://turismo.toledo.es/recursos/id1450-santa-iglesia-catedral-primada-de-toledo.html'},{label:'Wikipedia · Catedral de Toledo',url:'https://es.wikipedia.org/wiki/Catedral_de_Toledo'}]
  },
  alcazar: {
    image:'images/places/alcazar.jpg', alt:'Alcázar de Toledo visto desde el valle del Tajo',
    short:'Fortaleza, palacio imperial, escenario histórico y sede actual del Museo del Ejército.',
    facts:[['Emplazamiento','Cota dominante del casco histórico'],['Reconstrucción principal','Siglo XVI'],['Museo del Ejército','Desde 2010']],
    sections:[
      {title:'El poder sobre la colina',body:'La posición del Alcázar ha estado asociada al poder político y militar desde época romana. El recinto fue transformado por visigodos, musulmanes y monarcas cristianos. En el siglo XVI, Carlos V impulsó su conversión en un gran palacio renacentista de planta cuadrangular y cuatro fachadas diferenciadas.'},
      {title:'Destrucciones y reconstrucciones',body:'El edificio sufrió varios incendios y cambios de uso. Fue sede de la Academia de Infantería y de la primera etapa de la Academia General Militar. Durante el asedio de 1936 quedó prácticamente destruido; su reconstrucción posterior forma parte de la compleja memoria contemporánea del lugar.'},
      {title:'Museo del Ejército',body:'Desde 2010 alberga el Museo del Ejército. El recorrido combina una exposición histórica cronológica con salas temáticas dedicadas a colecciones, símbolos, uniformidad, armamento y patrimonio militar. También integra restos arqueológicos y elementos del propio edificio. Los horarios, recorridos y normas vigentes serán siempre los publicados por el Museo.'}
    ],
    credit:'Rafa Esteve', license:'CC BY-SA 4.0', commons:'https://commons.wikimedia.org/wiki/File:Alcazar_Toledo_Mirador_Valle.jpg',
    sources:[{label:'Museo del Ejército · web oficial',url:'https://ejercito.defensa.gob.es/museo/'},{label:'Historia del Museo y del Alcázar',url:'https://ejercito.defensa.gob.es/museo/museo/informacion_general/historia/'},{label:'Wikipedia · Alcázar de Toledo',url:'https://es.wikipedia.org/wiki/Alc%C3%A1zar_de_Toledo'}]
  },
  'academia-infanteria': {
    image:'images/places/academy.jpg', alt:'Vista panorámica de la Academia de Infantería de Toledo',
    short:'Centro de enseñanza militar unido a Toledo desde 1850 y depositario de la tradición del Arma de Infantería.',
    facts:[['Primer Colegio de Infantería','1850'],['Sede actual','Desde 1948'],['Visita prevista','Edificio Noble']],
    sections:[
      {title:'Una institución vinculada a Toledo',body:'El primer Colegio de Infantería se creó en Toledo en 1850. Tras diferentes etapas y emplazamientos, regresó a la ciudad en 1875 y se instaló en el Alcázar. La destrucción de aquella sede durante la Guerra Civil llevó a construir el conjunto actual al otro lado del Tajo, frente al perfil histórico de la ciudad.'},
      {title:'Formación y valores',body:'La Academia completa la formación de los futuros oficiales y suboficiales del Arma de Infantería. Junto a los conocimientos profesionales, conserva y transmite valores, símbolos, recompensas, memoria de las unidades y tradiciones desarrolladas a lo largo de su historia.'},
      {title:'Visita institucional prevista',body:'El programa contempla el Edificio Noble, la Sala de Laureados, la Sala de la Medalla Militar Individual y el comedor. Este contenido es orientativo: el itinerario interior, la identificación requerida, las restricciones de fotografía y las normas de circulación serán exclusivamente las que comunique la Academia para la actividad.'}
    ],
    credit:'Victor Gleim', license:'CC BY-SA 4.0', commons:'https://commons.wikimedia.org/wiki/File:Toledo_Infantry_Academy_-_Panoramic.jpg',
    sources:[{label:'Academia de Infantería · web oficial',url:'https://ejercito.defensa.gob.es/unidades/Toledo/acinf/'},{label:'Historial oficial',url:'https://ejercito.defensa.gob.es/unidades/Toledo/acinf/Historial/index.html'},{label:'Wikipedia · Academia de Infantería',url:'https://es.wikipedia.org/wiki/Academia_de_Infanter%C3%ADa_de_Toledo'}]
  },
  'gastronomia-recuerdos': {
    image:'images/places/gastronomy.jpg', alt:'Piezas tradicionales de mazapán de Toledo',
    short:'Mazapán, cocina castellana y artesanía del damasquinado como recuerdos con identidad local.',
    facts:[['Dulce emblemático','Mazapán de Toledo'],['Plato local','Carcamusas'],['Artesanía','Damasquinado']],
    sections:[
      {title:'Sabores de Toledo',body:'El mazapán, elaborado principalmente con almendra y azúcar, es el producto más reconocido. Las carcamusas —guiso de carne de cerdo con tomate y verduras—, la perdiz a la toledana y los platos de caza reflejan una cocina castellana de sabores intensos. Quesos, aceites y vinos amplían la mirada hacia el conjunto de Castilla-La Mancha.'},
      {title:'Recuerdos tradicionales',body:'El damasquinado decora superficies de hierro o acero mediante la incrustación de hilos y láminas de metales nobles, normalmente oro o plata. También son habituales la cerámica, la forja, las espadas decorativas y los dulces. Conviene preguntar por el lugar de fabricación y distinguir la artesanía local de los productos industriales.'},
      {title:'Compra y consumo responsables',body:'Si existe una alergia o restricción alimentaria, confirma siempre los ingredientes con el establecimiento: el mazapán contiene frutos secos y otros dulces pueden incorporar huevo o gluten. Las compras deben realizarse sin retrasar el horario del grupo y respetando las indicaciones del guía y la organización.'}
    ],
    credit:'Tamorlan', license:'CC BY-SA 3.0', commons:'https://commons.wikimedia.org/wiki/File:Mazap%C3%A1n-_Toledo.jpg',
    sources:[{label:'Turismo oficial de Toledo',url:'https://turismo.toledo.es/'},{label:'Wikipedia · gastronomía de Toledo',url:'https://es.wikipedia.org/wiki/Gastronom%C3%ADa_de_la_provincia_de_Toledo'},{label:'Wikipedia · damasquinado',url:'https://es.wikipedia.org/wiki/Damasquinado'}]
  }
};

export const mapAttribution = {
  credit:'OpenStreetMap.org y Qirille', license:'CC0',
  commons:'https://commons.wikimedia.org/wiki/File:Map_of_Toledo,_Spain.png'
};
