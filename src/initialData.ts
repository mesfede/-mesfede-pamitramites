export const INITIAL_TRAMITES = [
  {
    "nombre": "Afiliacion Hijo Discapacitado",
    "categoria": "Afiliaciones",
    "descripcion": "Llenar el formulario: pagina de inicio atencion personas afiliadas// afiliaciones/ formulario editable (ultimo) descargar/rellenar y firmar escribir los datos. ///// IFGRA con formulario + Documentacion + CERTIFICADO DE DISCAPACIDAD// Caratula GDE EXPEDIENTE - EXTERNO 00207 a nombre del afiliado titular // Agregar ifgra al EE y enviar a CM FERRONI",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Afiliacion Union Convivencial",
    "categoria": "Afiliaciones",
    "descripcion": "Certifiado de Union Convicencial menos de un año y se hace expediente Caratula GDE EXPEDIENTE - EXTERNO 00207 a nombre del afiliado titular// Agregar toda la data de negativas y demas cosas que se piden habitualmente para afiliacion de esposa/o y se envia a Afiliaciones",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Afiliación Provisoria",
    "categoria": "Afiliaciones",
    "descripcion": "Se coloca el numero 99 por delante después se suma si es 0 jubilación, si es pensión 5. luego se coloca el numero de documento del afiliado y los numero faltantes para sumar un total de 12 digitos se colocan 0 despues del tercer digito. Ejemplo: me quiero afiliar provisoriamente y mi numero de dni es 30923058 y soy jubilada: 990030923058/00 (99+0+0 como digito faltante+dni)",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Expediente GDE",
    "categoria": "Expediente GDE",
    "descripcion": "VE-(vía de excepción) NOMBRE Y APELLIDO - DNI - INSUMO\nRV-(riesgo de vida) NOMBRE Y APELLIDO - DNI - INSUMO \nREINTEGRO -NOMBRE Y APELLIDO - DNI -INSUMO",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Reintegros",
    "categoria": "Reintegros",
    "descripcion": "A partir del día lunes 11/07 los expedientes de reintegro que se realizaban en papel pasan a realizarse por GDE. Se tiene que realizar la carátula correspondiente con el código PAMI00234 (EXTERNO). Luego se confecciona un IFGRA con toda la documentación correspondiente escaneada (Formulario de reintegro / la facturas nombre del afiliado / DNI y recibo de cobro / tienen que ser escaneadas las originales junto con las planillas y documentación respaldatoria) Si es necesario planilla de atutorizacion de cobro a otra persona) y una vez que se confecciona todo se envía al usuario MLGARCIAD.",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Salud Mental",
    "categoria": "Salud mental",
    "descripcion": "Directamente lo solicita al prestador de Salud Mental asignado a cada afiliado según la necesidad. No hay que realizar trámite previo en la agencia (Diciembre 2023).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Amparo Judicial - Carga de Medicamento",
    "categoria": "Medicamentos especiales",
    "descripcion": "Se genera en el sistema CUP MSC un RTF de AMPARO, se debe completar la vigencia de 12 meses, el juzgado interviniente y la carátula del amparo.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Ayuda Externa - Ortopedia",
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "Se debe pedir el ítem al mail ayudastecnicas@pami.org.ar (debe adjuntarse al mail la orden médica manual y el resumen de historia clínica).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Biopsia Pulmonar Guiada Bajo TAC",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "San Juan de Dios: de Lun a Vie de 8 a 12hs se lleva Imágenes de estudios previos para que la médica evalúe. Se ingresa por 70 e/ 27 y 28.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Bolsas que no son via",
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "Se ingresa por 70 e/ 27 y 28.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Bolsa Colostomia VE",
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "1- Enviar CRM a Referente Nacional Ostomía solicitando ítem para cargar elemento.\n2- Hacer EXPEDIENTE ELECTRÓNICO de COMPULSA ABREVIADA (GENE00003).\n3- Con el ítem que envían por CRM, cargar en el Sistema Sii el elemento. Poner en Observaciones marca y modelo.\n4- Enviar el Expediente Electrónico con la documentación, el CRM y constancia de carga en el Sii a UGLVII.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Bomba Alimentacion / Sondas Nasogastrica / Guias",
    "categoria": "Nutrición",
    "descripcion": "Ver en el apartado Formularios Bomba de Alimentación como es la carga.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Boton Gastrico",
    "categoria": "Nutrición",
    "descripcion": "Pedir ITEM a mnazar@proyectos.pami.org.ar jblosada@proyectos.pami.org.ar cirugia@pami.org.ar. Se carga formulario apaisado, Resumen Historia clínica // EE / interno GENE 00003 /compra/ se entrega en hospital.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Calibracion de Implante Coclear",
    "categoria": "Prácticas quirúrgicas y de alta complejidad",
    "descripcion": "Hacer EE GDE Externo Practiva por VE poner en el asunto (PAMI00245) adjuntar ifgra con documentacion (calibracion//presupuesto//informe de la calibracion anterior) se envia a la gerencia de prestaciones medicas.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Angioresonancia",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Lo hacen en Vacarini (Althea) va a necesitar la OME + Otra OME interconsulta con UROLOGO.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Angiotomografia",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Lo hacen en Vacarini, Primero necesita interconsulta.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Aponia Kinesiologia",
    "categoria": "Kinesiología y rehabilitación",
    "descripcion": "Se realiza en Cien de Ensenada.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Arteriografia",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Se realiza en Hospital Rossi (HTL. GUTIERREZ).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Elevador Hidráulico para Pacientes",
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "Se envía un mail a ayudas técnicas solicitando ítem para la carga en el SII – se hace un EE con GENE0003 (hidráulico). Credencial, DNI. Recibo. Tel de contacto. Se envía a prótesis.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Electromiografia",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Hospital Rossi/ Vaccarini /Instituto Médico Platense // IAMA S.A. - CENTRO DE DIAGNOSTICO DE ALTA COMPLEJIDAD.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Endocrinologo",
    "categoria": "Consultas con especialistas",
    "descripcion": "Consultar en San Martin / Gutierrez.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Ergometria (cardiologia)",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Se realiza en Instituto del diagnóstico Cardiovascular.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Espesan",
    "categoria": "Nutrición",
    "descripcion": "Se pide ítem con pedido + RHC.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Espinograma",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "OME en Cien de Ensenada // GUTIERREZ // LOPARDO REPETTO (Flores CABA).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Histeroscopia",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "OME de interconsulta con Ginecología.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Internacion Domiciliaria",
    "categoria": "Internación y cuidados especiales",
    "descripcion": "INICIO: se hacen dos IFGRAs uno con los datos personales y otro con los formularios. Poner IDI Nombre y Apellido. Expediente (Externo) código de tramite PAMI00225.\nRENOVACION: Se corrobora que tenga Expediente Electronico, se hace un IFGRA con toda la documentacion.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Internacion Geriatrica",
    "categoria": "Internación y cuidados especiales",
    "descripcion": "Documentación a solicitar: RHC, orden médica (manual), escala FIM y Barthel, planilla de internación institucional, credencial y recibo de cobro. Expediente con Código PMI00224.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Kinesiologia a Domicilio",
    "categoria": "Kinesiología y rehabilitación",
    "descripcion": "OME por el Medico de Cabecera y con la justificación de por qué necesita a domicilio. Se HACE una OP desde coordinación médica. COD 240121 PRÁCTICA CON AUTORIZACIÓN.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Óptica - Lentes de Stock",
    "categoria": "Óptica y oftalmología",
    "descripcion": "Para lentes de stock (de lejos y cerca de menos de 4 dioptrías), está funcionando Óptica 7ma avenida en 7 e/ 50 y 51. Hacer CRM y derivar a División Óptica.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Óptica - Visión Subnormal",
    "categoria": "Óptica y oftalmología",
    "descripcion": "Si el código es 300017 se encuentra normatizado dentro de la Res. N 808-2022. Necesita el afiliado tener antes cargada la consulta de visión subnormal.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "PET",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Práctica con autorización OP para CIENCIA Y TECNOLOGIA / CIMED. Códigos: 260261 (coord. oncología), 260264 (coord. médico), 260265 (depto. oncología).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Polisomnografia",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "El afiliado debe presentarse en Avellaneda con orden médica y orden de prestación. Se anotará en planilla para posterior llamado.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Audifono: Reclamo//solicitud",
    "categoria": "Audífonos e implantes auditivos",
    "descripcion": "RECLAMO: mandar mail a programas_audifonos@pami.org.ar // SOLICITUD: Se indica al afiliado el lugar de cápita (Mutualidada Argentina de Hipoacusticos) tiene que ir con la OME que indica el pedido de audífonos y los estudios",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Audífono: Recalibración",
    "categoria": "Audífonos e implantes auditivos",
    "descripcion": "Solicitar turno por mail laboral a karinaf@audisonicsa.com.ar",
    "fuente": "Excel PAMI 2023",
    "pasos": ["Solicitar turno por mail laboral a karinaf@audisonicsa.com.ar"]
  },
  {
    "nombre": "Angiografia",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "OP 156 Motivo de emesion (solicitud de alta complejidad) Instituto medico platense // Modalidad internacion Practica 210003",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Dapaglifozina",
    "categoria": "Medicamentos especiales",
    "descripcion": "Desde Nivel Central estan pidiendo: Formulario RIESGO CARDIOVASCULAR firmado por diabetólogo, endocrinólogo o médico nutricionista. Documentar eventos cardiovasculares previos, o ICC (insuficiencia Cardíaca) o microalbuminuria positiva o enfermedad renal crónica. Se autoriza a menores de 75 años",
    "fuente": "Excel PAMI 2023",
    "pasos": [
      "Presentar formulario de RIESGO CARDIOVASCULAR firmado por diabetólogo, endocrinólogo o médico nutricionista.",
      "Documentar eventos cardiovasculares previos, ICC, microalbuminuria positiva o enfermedad renal crónica.",
      "Presentar padrón de diabéticos actualizado.",
      "Adjuntar laboratorios completos: hemoglobina glicosilada, glucemia, clearance de creatinina, microalbuminuria, HbA1c.",
      "Adjuntar receta electrónica de PAMI.",
      "Adjuntar resumen de Historia Clínica."
    ],
    "nota": "Se autoriza a menores de 75 años."
  },
  {
    "nombre": "Oxigenoterapia",
    "categoria": "Oxigenoterapia",
    "descripcion": "Formulario NUEVO solicitud de oxigenoterapia (SIMAP) /Acta compromiso / Espirometria / - gasometría basal, estudio excluyente para la autorización de la prestación / Enviar la documentación requerida en sobre cerrado (cuando el expediente esta alla) al área PRESTACIONES ESPECIALES. Mariela Floch /",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Subsidio Celiaquia",
    "categoria": "Medicamentos especiales",
    "descripcion": "Pami GDE Externo PAMI00226 se hace un ifgra con toda la documentacion (ES FUNDAMENTAL la toma de biopsia en caso de diagnósticos más antiguos y los análisis de sangre con los marcadores de celiaquía) y un RHC de gastronterólogo. Se envía a Prestaciones Especiales.",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Obesidad Morbida",
    "categoria": "Nutrición",
    "descripcion": "los tratamientos de OBESIDAD Mórbida, entre ellos los tratamientos en Clínica del Dr. Cormillot (SAP N° 98421) Se deberá tramitar por el Sistema Informático Interactivo (SII).",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Implante Coclear",
    "categoria": "Prácticas quirúrgicas y de alta complejidad",
    "descripcion": "Orden x el MC interconsulta con otorrino y se llama por telefono para solicitar un turno (Milstein sector otorrino 1149220879 // 1149220630// mail: mmazalannes@pami.org.ar).",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "SPECT GATILLADO (PERFUSION MIOCARDICA)",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Va con OME directamente (más dos OMEs más cod. 342110/342101). Prestador en BS AS: Fundación Centro Diagnóstico Nuclear (Av. Nazca 3449) o Diagnóstico Mediter S.A (Sanatorio Mendez).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "RESONANCIA MULTIPARAMETRICA DE PERFUSION Y DIFUSION",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Va con OME directamente. Prestador en BS AS: Fundación Centro Diagnóstico Nuclear.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "SPECT CELEBRAL",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Va con OME directamente. Prestador en BS AS: Fundación Centro Diagnóstico Nuclear.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "RESONANCIA MAGNETICA NUCLEAR (CARDIACA)",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Emitir la OP con código 260260 y el prestador es Imax (SAP 112775) en calle 34 n.º 785 e/ 10 y 11. Teléfono 0221-483-0171.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "CAMARAGAMA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Medicina Nuclear. OME en Cien de Ensenada // GUTIERREZ // LOPARDO REPETTO (Flores CABA).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "CAPSULA ENDOSCOPICA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Via Excepcion (GDE) (estudios HC) lo hace GEDYT en juncal 2345. TEL DE CONTACTO 011-5272-7483/7484.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "CENTELLOGRAMA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Medicina Nuclear. OME en Cien de Ensenada // GUTIERREZ // LOPARDO REPETTO (Flores CABA).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "CINECORONOGRAFIA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Idytac (español primer subsuelo hemodinamia) sin 156 con la orden directamente sin OME y los estudios.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "COLONOSCOPIA VIRTUAL",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Investigaciones Medicas Turnos: 11 4127-2800 Whatsapp: 11 4403 0238. CIMED codigo de orden medica electrónica 341430.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "ECOCARDIOGRAMA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Instituto del diagnostico Cardiovascular / Si es TOTAL la OME la hace el Medico auditor.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "ECODOPPLER TRANSESOFAGICO",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Instituto del diagnostico Cardiovascular.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "ECOENDOSCOPÍA DIGESTIVA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Hospital San Roque Gonnet con OME de gastro. Hospital Rossi con OME.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "ELECTROENCEFALOGRAMA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Rossi // S.Martin // Italiano // Gutierrez 4830171/75 (int 317 turnos).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "DIABETES – MEDIDOR DE GLUCOSA CON ASISTENCIA AUDIBLE",
    "categoria": "Medicamentos especiales",
    "descripcion": "Doc a presentar: DNI, credencial, OME por médico de cabecera, Análisis de laboratorio (HbA1c, glucemia). Resumen de HC oftalmológica. Realiza una Op 'GLUCOMETRO AUDIBLE' con los códigos 3060001 (medidor) y 3061001 (tiras).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "DIABETES - MEDICAMENTOS EN PADRON DE DIABETICOS DIRECTO POR FARMACIA",
    "categoria": "Medicamentos especiales",
    "descripcion": "Hiperglucemiante oral: glibenclamida, gliclazida, glimperide, glipizida, metformina, vildagliptin, etc. Insulina: aspartato, detemir, lispro, glulisina, humana.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "DIABETES- INSULINAS POR VIA DE EXCEPCIÓN",
    "categoria": "Medicamentos especiales",
    "descripcion": "GLARGINA Y DECLUDEC con formulario y laboratorio.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "DIETOTERAPICOS",
    "categoria": "Nutrición",
    "descripcion": "Receta / Formulario / laboratorio (proteinograma). Para vía oral se dispone de suplementos en polvo. En caso de afiliados diabéticos: Diasip o Purísima Avant DBT.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "GASAS ESTÉRILES Y VENDAS (MSC – V/E)",
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "Se pueden cargar los siguientes elementos: PLATSUL-A, GASAS apósitos x10, NITRUFURAZONA DENVER FARMA. Como cualquier pedido de MSC se realiza más rápido porque obviamos el EE.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "GASAS Y VENDAS (INSUMOS POR EE)",
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "Se envía la planilla específica de Gasas y Vendas. Debe contener la medida de cada insumo solicitada de manera mensual. Se adjuntan fotografías con la medida. Se hace un Expediente Electrónico (GENE00003 caratulación INTERNA).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "IMPLANTE COCLEAR – PILAS",
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "Solicitar ítem por mail a programas_audifonos@pami.org.ar, adjuntando toda la documentación. Cargar en sistema de Insumos del Sii y enviar por expediente electrónico (GENE00003).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "INTERNACIÓN CON EL FIN DE REHABILITACIÓN",
    "categoria": "Internación y cuidados especiales",
    "descripcion": "Fundación Quarello. Se requiere sólo la OME con los códigos 250101 (x10) y 250102 (x10). Al ser respiratoria, orden con la indicación específica.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "MAPA // PRESUROMETRIA",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Rossi, que hable con Lorena y lleve todos los estudios y le dan un turno. Gonnet también lo hacen.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "MEDICAMENTOS SIN CARGO/CARGA DE RTF",
    "categoria": "Medicamentos especiales",
    "descripcion": "Se debe caratular si el RTF es nuevo con los siguientes códigos: PAMI00205 (vía externa) y PAMI00240 (cobertura 100% interna).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "ÓPTICA - LENTES DE CONTACTO",
    "categoria": "Óptica y oftalmología",
    "descripcion": "Se cargan por sistema de Óptica. Si es por pérdida o robo antes del año, se requiere exposición civil o denuncia policial.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "OXIGENOTERAPIA (ELEMENTOS LICITADOS)",
    "categoria": "Oxigenoterapia",
    "descripcion": "Hasta 4 de flujo de oxígeno. Se carga por sistema de Insumos y se envía por expediente electrónico (GENE00003).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "OXIGENOTERAPIA V/E (VÍA EXCEPCIÓN)",
    "categoria": "Oxigenoterapia",
    "descripcion": "Para flujos mayores a 4. Se requiere OME, resumen de HC, gasometría arterial y espirometría. Caratular por GDE.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "PUNCION BIOPSIA (PRÓSTATA, MAMA, HÍGADO, PULMÓN)",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Se realizan en Hospitales Públicos (Rossi, San Martín, San Roque) con OME. En el caso de Próstata, bajo ecografía.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "RADIOTERAPIA SBRT",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Se carga por sistema de Oncología. Requiere OME, resumen de HC y estudios previos.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "REHABILITACIÓN (CARDIOVASCULAR, RESPIRATORIA, VESTIBULAR)",
    "categoria": "Internación y cuidados especiales",
    "descripcion": "Se requiere OME con códigos específicos de rehabilitación. Prestadores: Fundación Quarello, Hospital Rossi.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "TOMOGRAFIA (64 PISTAS / OBESIDAD MÓRBIDA)",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "CIMED (calle 13 n.º 532). Para personas con obesidad mórbida, consultar disponibilidad de equipo.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "TRASLADO (+ DE 30KM)",
    "categoria": "Traslados",
    "descripcion": "Se requiere OME de traslado, resumen de HC que justifique la derivación y turno del prestador de destino. Caratular por GDE.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "URODINAMICO ESTUDIO",
    "categoria": "Estudios diagnósticos e imágenes",
    "descripcion": "Hospital Rossi o San Martín con OME de urología.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "SENSOR DE FREE STYLE Y PARCHES",
    "categoria": "Medicamentos especiales",
    "descripcion": "Para pacientes diabéticos tipo 1. Requiere formulario específico, resumen de HC y últimos laboratorios. Caratular por GDE.",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "Oftalmologia",
    "categoria": "Óptica y oftalmología",
    "descripcion": "OP 156 // Campo visual Campimetria OCT 300209 /// NO ESTAMOS DANDO LENTES DE CONTACTO (DICIEMBRE 2023)",
    "fuente": "Excel PAMI 2023"
  }
];

export const INITIAL_PRESTADORES = [
  {
    "nombre": "ALTHEA (EX VACCARINI)",
    "especialidades": [
      "ONCOLOGIA - TRATAMIENTOS",
      "VIDEOENDOSCOPICAS GASTROINTESTINALES",
      "HEMATOLOGIA",
      "INFECTOLOGIA",
      "REUMATOLOGIA",
      "ENDOCRINOLOGIA",
      "FLEBOLOGIA",
      "OTORRINOLARINGOLOGIA",
      "DERMATOLOGIA",
      "ALERGIA E INMUNOLOGIA",
      "NEUROLOGIA",
      "ANATOMIA PATOLOGICA",
      "CARDIOLOGIA",
      "CIRUGIA GENERAL AMBULATORIA",
      "UROLOGIA",
      "TRAUMATOLOGIA",
      "NEUMONOLOGIA",
      "NEFROLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "GASTROENTEROLOGIA",
      "FONOAUDIOLOGIA"
    ],
    "direccion": "80 Nº 570 e/ 6 y 7",
    "telefono": "221 453-3765",
    "practicas": []
  },
  {
    "nombre": "APONIA",
    "especialidades": ["FISIOKINESIO"],
    "direccion": "6 Nº 1429 e/ 47 y 48 (V.E)",
    "telefono": "221 487-0620"
  },
  {
    "nombre": "BENGOA, Daniela",
    "especialidades": ["DIABETOLOGIA"],
    "direccion": "35 Nº 318 e/ 1 y 2",
    "telefono": "221 482-5420"
  },
  {
    "nombre": "BRUNO, Azucena",
    "especialidades": ["TRAUMATOLOGIA"],
    "direccion": "81 Nº 386 e/ 2 y 2bis",
    "telefono": "11 416-06041"
  },
  {
    "nombre": "CEMDDE",
    "especialidades": ["FISIOKINESIO"],
    "direccion": "50 Nº 1565e/ 26 y 27",
    "telefono": "221 457-2687"
  },
  {
    "nombre": "CLINICA DE EXCELENCIA MEDICA",
    "especialidades": ["MAMOGRAFIA"],
    "direccion": "4 Nº 1074 e/ 54 y 55",
    "telefono": "221 423-6431"
  },
  {
    "nombre": "CENTRO MEDICO BERISSO",
    "especialidades": [],
    "direccion": "122 e/ 68 y 69",
    "telefono": "221 423-1976 / 591-4343"
  },
  {
    "nombre": "CLINICA DE LA COM. DE ENSE.",
    "especialidades": [],
    "direccion": "La Merced 383",
    "telefono": "221 460-2400"
  },
  {
    "nombre": "CLINICA DE NIÑOS",
    "especialidades": [],
    "direccion": "63 N.º 763",
    "telefono": "221 453-4940"
  },
  {
    "nombre": "CLINICA MOSCONI DE BERISSO",
    "especialidades": ["ENDOCRINOLOGIA", "GINECOLOGIA Y OBSTETRICIA"],
    "direccion": "8 Nº 3419",
    "telefono": "221 461-1898",
    "whatsapp": "6790114"
  },
  {
    "nombre": "CLINICA SITE",
    "especialidades": ["ONCOLOGIA"],
    "direccion": "7 Nº 505",
    "telefono": "221 427-0118 / 489-4822"
  },
  {
    "nombre": "CORPUS",
    "especialidades": ["CARDIO", "FONO", "PSICO", "KINESIO"],
    "direccion": "56 Nº 1469 e/ 24 y 25",
    "telefono": "221 417-6701"
  },
  {
    "nombre": "ELIZALDE, Daniel",
    "especialidades": ["NEUMONOLOGIA"],
    "direccion": "41 Nº 347 e/ 1 y 2",
    "telefono": "221 690-1662"
  },
  {
    "nombre": "FUNDACION QUARELLO",
    "especialidades": ["FLEBOLOGIA", "NEUROLOGIA"],
    "direccion": "14a e/ 467 y 471",
    "telefono": "221 472-4040 / 11 3317-8480",
    "practicas": ["INTERNACIÓN CON EL FIN DE REHABILITACIÓN"]
  },
  {
    "nombre": "GUENAGA, Pablo",
    "especialidades": ["CARDIO", "ECODOPPLER"],
    "direccion": "60 Nº 2024 e/ 135 y 136",
    "telefono": "221 364-9032"
  },
  {
    "nombre": "HTAL. DE AGUDOS LARRAIN",
    "especialidades": [],
    "direccion": "Londres Nº 4435",
    "telefono": "221 461-1101"
  },
  {
    "nombre": "HTAL. GUTIERREZ",
    "especialidades": [
      "ONCOLOGIA - TRATAMIENTOS",
      "HEMATOLOGIA",
      "INFECTOLOGIA",
      "PEDIATRIA",
      "REUMATOLOGIA",
      "FLEBOLOGIA",
      "OTORRINOLARINGOLOGIA",
      "DERMATOLOGIA",
      "ALERGIA E INMUNOLOGIA",
      "ANATOMIA PATOLOGICA",
      "CARDIOLOGIA",
      "CIRUGIA GENERAL AMBULATORIA",
      "UROLOGIA",
      "TRAUMATOLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "GASTROENTEROLOGIA",
      "NUTRICION"
    ],
    "direccion": "Diag. 114 e/ 39 y 40 s/n",
    "telefono": "221 483-0171",
    "notas": "Con OME directamente a Rayos de 8 a 12hs para sacar turno."
  },
  {
    "nombre": "HTAL. ITALIANO CITY BELL",
    "especialidades": ["CARDIO", "GINECO", "GASTRO", "REUMA", "HEPATO"],
    "direccion": "13B e/ Cantilo y 472",
    "telefono": "221 472-2626"
  },
  {
    "nombre": "HTAL. ITALIANO DE LA PLATA",
    "especialidades": [
      "ONCOLOGIA - TRATAMIENTOS",
      "VIDEOENDOSCOPICAS GASTROINTESTINALES",
      "HEMATOLOGIA",
      "INFECTOLOGIA",
      "REUMATOLOGIA",
      "ENDOCRINOLOGIA",
      "FLEBOLOGIA",
      "OTORRINOLARINGOLOGIA",
      "DERMATOLOGIA",
      "ALERGIA E INMUNOLOGIA",
      "ANATOMIA PATOLOGICA",
      "CARDIOLOGIA",
      "CIRUGIA GENERAL AMBULATORIA",
      "UROLOGIA",
      "NEUMONOLOGIA",
      "NEFROLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "GASTROENTEROLOGIA",
      "NUTRICION",
      "ELECTROFISIOLOGIA"
    ],
    "direccion": "51 Nº 1725 e/ 30 y 29",
    "telefono": "221 512-9500 / 457-3001"
  },
  {
    "nombre": "HTAL. PRIVADO SUDAMERICANO",
    "especialidades": ["UROLOGIA", "FISIATRIA - CONSULTAS"],
    "direccion": "2 Nº 432 e/ 40 y 41",
    "telefono": "221 445-2121"
  },
  {
    "nombre": "HTAL. ROSSI",
    "especialidades": [
      "OTORRINOLARINGOLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "GASTROENTEROLOGIA",
      "FONOAUDIOLOGIA",
      "PALIATIVOS Y DOLOR"
    ],
    "direccion": "116 Nº 228 e/ 36 y 37",
    "whatsapp": "221 556-7674",
    "notas": "8 a 11hs: Órdenes, estudios, credencial y DNI - 1° Piso. Tiene un equipo de cirujanos de cabeza y cuello."
  },
  {
    "nombre": "HTAL. SAN JUAN DE DIOS",
    "especialidades": ["INFECTOLOGIA", "HEPATOLOGIA"],
    "direccion": "27 y Calle 70 s/n",
    "telefono": "221 453-2476 / 451-0320",
    "notas": "Llevar imágenes previas lunes, jueves y viernes para que la médica evalúe. Otros tels: 457-7659 / 5800/02/04/06/08"
  },
  {
    "nombre": "HTAL. SAN MARTIN",
    "especialidades": [
      "HEPATOLOGIA",
      "GASTROENTEROLOGIA",
      "FONOAUDIOLOGIA",
      "DIABETOLOGIA",
      "PALIATIVOS Y DOLOR",
      "ELECTROFISIOLOGIA"
    ],
    "direccion": "1 esq. 70 s/n",
    "telefono": "483-3292 / 6588 / 5759",
    "email": "hsanmartin@ms.gba.gov.ar",
    "notas": "Turnos todos los días por orden de llegada"
  },
  {
    "nombre": "HTAL. SAN ROQUE",
    "especialidades": [
      "OTORRINOLARINGOLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "GASTROENTEROLOGIA",
      "FONOAUDIOLOGIA",
      "NUTRICION"
    ],
    "direccion": "508 e/ 18 y 19",
    "whatsapp": "221 364-2272",
    "notas": "Atención L a V 7 a 16 hs"
  },
  {
    "nombre": "INST MEDICO ARG. DE BERISSO",
    "especialidades": [],
    "direccion": "Punta Arenas 4299",
    "telefono": "221 464-3113"
  },
  {
    "nombre": "INST. DIAG. CARDIOVASCULAR",
    "especialidades": [
      "HEMATOLOGIA",
      "ENDOCRINOLOGIA",
      "DERMATOLOGIA",
      "CARDIOLOGIA",
      "NUTRICION"
    ],
    "direccion": "13 Nº 525",
    "telefono": "221 621-4354"
  },
  {
    "nombre": "INST. DEL DIAGNOSTICO",
    "especialidades": ["ONCOLOGIA - TRATAMIENTOS"],
    "direccion": "62 Nº 370",
    "telefono": "221 425-9700"
  },
  {
    "nombre": "INST. MEDICO PLATENSE",
    "especialidades": [
      "ONCOLOGIA - TRATAMIENTOS",
      "HEMATOLOGIA",
      "CARDIOLOGIA",
      "CIRUGIA GENERAL AMBULATORIA",
      "UROLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "ELECTROFISIOLOGIA"
    ],
    "direccion": "51 Nº 315",
    "telefono": "221 425-8390",
    "notas": "Llamar de 13 a 16hs al 221-412925"
  },
  {
    "nombre": "IPENSA",
    "especialidades": [
      "HEMATOLOGIA",
      "INFECTOLOGIA",
      "DERMATOLOGIA",
      "ALERGIA E INMUNOLOGIA",
      "NEUROLOGIA",
      "CARDIOLOGIA",
      "CIRUGIA GENERAL AMBULATORIA",
      "UROLOGIA",
      "NEUMONOLOGIA",
      "NEFROLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "GASTROENTEROLOGIA",
      "DIABETOLOGIA",
      "HEMODINAMIA",
      "COLOCACION DE MARCAPASOS",
      "CIRUGIA CARDIOVASCULAR CENTRAL Y PERIFERICA",
      "ELECTROFISIOLOGIA"
    ],
    "direccion": "59 Nº 434",
    "localidad": "La Plata",
    "telefono": "221 427-1190",
    "email": "nefrologia-dialisis@ipensa.com"
  },
  {
    "nombre": "LOVARI, Juan",
    "especialidades": ["DERMATOLOGIA"],
    "direccion": "60 Nº 2270 e/ 140 y 141",
    "whatsapp": "221 363-5770"
  },
  {
    "nombre": "PARRA, Natali",
    "especialidades": ["ENDOCRINOLOGIA"],
    "direccion": "18 Nº 252 e/ 37 y 38",
    "telefono": "221 423-7547"
  },
  {
    "nombre": "SANATORIO MEDICO LOS TILOS",
    "especialidades": [
      "NEUROLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "ELECTROFISIOLOGIA"
    ],
    "direccion": "41 Nº 347 e/ 1 y 2",
    "telefono": "221 616-5296 / 358-4558"
  },
  {
    "nombre": "SALIM, María Mercedes",
    "especialidades": ["NEFROLOGIA"],
    "direccion": "488 Nº 2681 e/ 20 y 22",
    "telefono": "221 471-3181"
  },
  {
    "nombre": "WRNICKE, Verónica",
    "especialidades": ["REUMATOLOGIA"],
    "direccion": "18 Nº 252 e/ 37 y 38",
    "telefono": "221 423-7547"
  },
  {
    "nombre": "JAURE, Cecilia",
    "especialidades": ["NUTRICIONISTA"],
    "direccion": "4 Nº 304 (Ex Piria - V.E)",
    "telefono": "221 599-3682"
  },
  {
    "nombre": "VISIONAIRE",
    "especialidades": ["OTORRINO / FONOAUDIO"],
    "direccion": "53 esq. 8",
    "whatsapp": "2214959953"
  },
  {
    "nombre": "C.R.M",
    "especialidades": ["RX - ECODIAG. / ECO DOPPLER"],
    "direccion": "8 Nº 620",
    "telefono": "221 421-5524",
    "whatsapp": "220-3495"
  },
  {
    "nombre": "CIEN DE ENSENADA",
    "especialidades": ["DSM OSEA"],
    "direccion": "Sidotti Nº 281",
    "telefono": "221 469-2002"
  },
  {
    "nombre": "CIENCIA Y TECNOLOGIA",
    "especialidades": [],
    "direccion": "8 Nº 607",
    "telefono": "221 421-1067"
  },
  {
    "nombre": "CIMED",
    "especialidades": ["TAC DE 64 O + / MAMOTONNE / PET"],
    "direccion": "5 Nº 416 e/ 40 y 41",
    "telefono": "221 439-1111"
  },
  {
    "nombre": "IDYTAC",
    "especialidades": ["ECO DOPPLER"],
    "direccion": "8 Nº 140",
    "telefono": "221 482-8965"
  },
  {
    "nombre": "INST. DE CARDIO. LP",
    "especialidades": ["ECO DOPP. / ECODIAG."],
    "direccion": "6 Nº 212",
    "telefono": "221 427-1000"
  },
  {
    "nombre": "MED IMAGE",
    "especialidades": ["ECOGRAFIA"],
    "direccion": "45 Nº 915",
    "telefono": "221 489-1222"
  },
  {
    "nombre": "CLINICA DE EX. MEDICA",
    "especialidades": ["MAMOGRAFIA"],
    "direccion": "4 Nº 1074 e/ 54 y 55",
    "telefono": "221 423-6431"
  },
  {
    "nombre": "OPEN IMAGE (Tolosa)",
    "especialidades": ["ECODIAGNOSTICO - RMN"],
    "direccion": "4 Bis Nº 329",
    "telefono": "221 422-0639",
    "whatsapp": "319-7336"
  },
  {
    "nombre": "OPEN IMAGE (V.E)",
    "especialidades": ["RX - TAC"],
    "direccion": "55 Nº 801 e/ 8 y 9",
    "telefono": "221 422-0639",
    "whatsapp": "319-7336"
  },
  {
    "nombre": "RESONANCIA HI",
    "especialidades": [],
    "direccion": "50 Nº 1728",
    "telefono": "221 451-1528"
  },
  {
    "nombre": "SANATORIO ARGENTINO",
    "especialidades": ["TAC - RMN"],
    "direccion": "56 Nº 874",
    "telefono": "221 412-9500",
    "whatsapp": "220-4280"
  },
  {
    "nombre": "CTRO. DE LA VISIÓN LP",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "2 Nº 731 e/ 46 y 47",
    "telefono": "221 427-1452",
    "whatsapp": "590-3504"
  },
  {
    "nombre": "CLÍNICA MERONI",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "63 Nº 782 e/ 10 y 11",
    "telefono": "221 452-5551"
  },
  {
    "nombre": "COB",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "6 Nº 459 e/ 41 y 42",
    "telefono": "221 4405079"
  },
  {
    "nombre": "COB Berisso",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "12 Nº 4348 e/ 165 y 166",
    "telefono": "221 4645315 / 6796013"
  },
  {
    "nombre": "HANSEN ARIEL EDUARDO",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "42 Nº 763",
    "telefono": "221 482-1669"
  },
  {
    "nombre": "HTAL DR. A. KORN",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "520 S/N e/173 y 178",
    "telefono": "0-800 333433",
    "whatsapp": "5675-3580"
  },
  {
    "nombre": "INST. OFTAL. PRIETO DIAZ",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "53 Nº 693",
    "telefono": "221 425-7523 / 423-8178"
  },
  {
    "nombre": "INST. OFTAL. PLATENSE",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "2 Nº 609 e/ 44 y 45",
    "telefono": "221 483-1503 / 526-2112"
  },
  {
    "nombre": "SANTA LUCIA",
    "especialidades": ["OFTALMOLOGIA"],
    "direccion": "56 e/ 7 y 8 Nº 625",
    "telefono": "221 422-1617 / 445-2099"
  },
  {
    "nombre": "AGOSTINI City Bell",
    "especialidades": ["OPTICA"],
    "direccion": "Cno. Cente y diag.92",
    "telefono": "221 472-2573"
  },
  {
    "nombre": "ARMONIA VISUAL",
    "especialidades": ["OPTICA"],
    "direccion": "35 Nº 912"
  },
  {
    "nombre": "NUEVA VISTA Villa Elisa",
    "especialidades": ["OPTICA"],
    "direccion": "6 e/ 42 y 43",
    "telefono": "221 548-8458"
  },
  {
    "nombre": "DANIEL BERMUDEZ",
    "especialidades": ["OPTICA"],
    "direccion": "43 esq. 5",
    "telefono": "221 489-4316"
  },
  {
    "nombre": "BERMUDEZ S.A",
    "especialidades": ["OPTICA"],
    "direccion": "7 e/ 54 y 55",
    "telefono": "221 423-3950"
  },
  {
    "nombre": "POLERO",
    "especialidades": ["OPTICA"],
    "direccion": "137 e/ 63 y 62",
    "telefono": "221 450-8041"
  },
  {
    "nombre": "VISIÓN",
    "especialidades": ["OPTICA"],
    "direccion": "Pza Italia Nº 1498",
    "telefono": "221 424-2312"
  },
  {
    "nombre": "VEO",
    "especialidades": ["OPTICA"],
    "direccion": "5 esq. 520",
    "telefono": "221 527-1216"
  },
  {
    "nombre": "MERONI",
    "especialidades": ["OPTICA"],
    "direccion": "11 e/ 64 y 63",
    "telefono": "221 452-4568"
  },
  {
    "nombre": "MILENIO",
    "especialidades": ["OPTICA"],
    "direccion": "10 e/ 50 y 51",
    "telefono": "221 595-7028"
  },
  {
    "nombre": "OPTIMA VISION",
    "especialidades": ["OPTICA"],
    "direccion": "48 e/ 15 y diag.73",
    "telefono": "221 423-3256"
  },
  {
    "nombre": "POLERO Berisso",
    "especialidades": ["OPTICA"],
    "direccion": "Montevideo e/ 8 y 9",
    "telefono": "221 461-4327"
  },
  {
    "nombre": "TOLABA",
    "especialidades": ["OPTICA"],
    "direccion": "2 e/ 44 y 45",
    "telefono": "221 421-5774"
  },
  {
    "nombre": "RENO",
    "especialidades": ["OPTICA"],
    "direccion": "Diag. 79 e/ 2 y 3",
    "telefono": "221 482-5544"
  },
  {
    "nombre": "CLUB",
    "especialidades": ["OPTICA"],
    "direccion": "11 esq. 43",
    "telefono": "221 595-7028"
  },
  {
    "nombre": "SICARDI",
    "especialidades": ["OPTICA"],
    "direccion": "7 e/ 650 y 651",
    "telefono": "221 540-2867"
  },
  {
    "nombre": "FERRERI",
    "especialidades": ["OPTICA"],
    "direccion": "7 e/62 y 63",
    "telefono": "221 424-0137"
  },
  {
    "nombre": "VIA OPTICA Berisso",
    "especialidades": ["OPTICA"],
    "direccion": "Montevideo esq. 16",
    "telefono": "221 564-3376"
  },
  {
    "nombre": "Clinica Belgrano",
    "especialidades": [
      "ONCOLOGIA - TRATAMIENTOS",
      "VIDEOENDOSCOPICAS GASTROINTESTINALES",
      "HEMATOLOGIA",
      "DERMATOLOGIA",
      "ALERGIA E INMUNOLOGIA",
      "TRAUMATOLOGIA",
      "NEFROLOGIA",
      "GINECOLOGIA Y OBSTETRICIA",
      "GASTROENTEROLOGIA"
    ],
    "direccion": "Cno Gral Belgrano 960",
    "localidad": "Quilmes Oeste",
    "telefono": "4365-0200",
    "whatsapp": "15-6700-1440",
    "email": "conmutador@clinicabelgrano.com"
  },
  {
    "nombre": "POLICLINICA PRIVADA S.A. SITE",
    "especialidades": [
      "ONCOLOGIA - TRATAMIENTOS"
    ]
  },
  {
    "nombre": "Hospital El Cruce",
    "especialidades": [],
    "direccion": "Av. Calchaquí Nº 5401",
    "localidad": "Florencio Varela",
    "telefono": "(011) 4210 9000",
    "email": "informeshospitalelcruce@gmail.com",
    "notas": "Turnos Videoendocapsula: gestiondepacientes@hospitalelcruce.org"
  },
  {
    "nombre": "Investigaciones Medicas S.A.",
    "especialidades": [],
    "direccion": "Pichincha 69",
    "localidad": "Capital Federal",
    "telefono": "4127-2800",
    "whatsapp": "11 4403 0238",
    "practicas": ["COLONOSCOPIA VIRTUAL"]
  },
  {
    "nombre": "Cofyb (Rapela Laboratorio Biomedico)",
    "especialidades": [],
    "direccion": "Ramon L Falcon 2534, PB",
    "localidad": "Capital Federal",
    "telefono": "4610-9900 Int 1",
    "whatsapp": "011-5890-9864",
    "email": "informes@rapela.com.ar"
  },
  {
    "nombre": "Diagnostico Maipu",
    "especialidades": [],
    "direccion": "Avenida Maipu 1668, PB",
    "localidad": "Vicente Lopez",
    "telefono": "4837-7777"
  },
  {
    "nombre": "Clinica Modelo de Lanus",
    "especialidades": [],
    "direccion": "Quintana 67",
    "localidad": "Lanus",
    "telefono": "4229-6000 (Op 1)",
    "email": "turnos@clinicamodelolanus.com",
    "notas": "Turnos personalmente de Lunes a Viernes de 8:30 a 13hs."
  },
  {
    "nombre": "Fundacion Centro de Diagnostico Nuclear",
    "especialidades": [],
    "direccion": "Nazca 3449",
    "localidad": "CABA",
    "telefono": "11-6419-5046 / 011 7078-7870",
    "practicas": ["SPECT GATILLADO", "RESONANCIA MULTIPARAMETRICA", "SPECT CEREBRAL"]
  },
  {
    "nombre": "Sanatorio Mendez - Diagnostico Mediter",
    "especialidades": [],
    "direccion": "Avellaneda 551",
    "localidad": "CABA",
    "telefono": "011 6842-7777",
    "whatsapp": "11-6674-4150",
    "email": "info@imagenesmendez.com"
  },
  {
    "nombre": "Centro de Diagnostico Bioimagenes",
    "especialidades": [],
    "direccion": "Yrigoyen 3502",
    "localidad": "Lanus",
    "telefono": "5263-3220",
    "whatsapp": "1555886524"
  },
  {
    "nombre": "IAMA",
    "especialidades": [],
    "direccion": "Viamonte 2560",
    "localidad": "CABA",
    "telefono": "011 4965-3600",
    "whatsapp": "11-61953865"
  }
];

export const INITIAL_FOLLETOS = [
  {
    "nombre": "Cartilla Prestadores 2026",
    "url": "https://drive.google.com/file/d/1XbpUIsXnMYNNxaqbHnlUIPBrViZMuuK1/view?usp=drive_link"
  }
];
