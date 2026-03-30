export const INITIAL_TRAMITES = [
  {
    "nombre": "Afiliacion Hijo Discapacitado",
    "categoria": "Afiliaciones y expedientes",
    "descripcion": "Llenar el formulario: pagina de inicio atencion personas afiliadas// afiliaciones/ formulario editable (ultimo) descargar/rellenar y firmar escribir los datos. ///// IFGRA con formulario + Documentacion + CERTIFICADO DE DISCAPACIDAD// Caratula GDE EXPEDIENTE - EXTERNO 00207 a nombre del afiliado titular // Agregar ifgra al EE y enviar a CM FERRONI",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Afiliacion Union Convivencial",
    "categoria": "Afiliaciones y expedientes",
    "descripcion": "Certifiado de Union Convicencial menos de un año y se hace expediente Caratula GDE EXPEDIENTE - EXTERNO 00207 a nombre del afiliado titular// Agregar toda la data de negativas y demas cosas que se piden habitualmente para afiliacion de esposa/o y se envia a Afiliaciones",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Afiliación Provisoria",
    "categoria": "Afiliaciones y expedientes",
    "descripcion": "Se coloca el numero 99 por delante después se suma si es 0 jubilación, si es pensión 5. luego se coloca el numero de documento del afiliado y los numero faltantes para sumar un total de 12 digitos se colocan 0 despues del tercer digito. Ejemplo: me quiero afiliar provisoriamente y mi numero de dni es 30923058 y soy jubilada: 990030923058/00 (99+0+0 como digito faltante+dni)",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Expedientes",
    "categoria": "Afiliaciones y expedientes",
    "descripcion": "VE-(vía de excepción) NOMBRE Y APELLIDO - DNI - INSUMO\nRV-(riesgo de vida) NOMBRE Y APELLIDO - DNI - INSUMO \nREINTEGRO -NOMBRE Y APELLIDO - DNI -INSUMO",
    "fuente": "Excel PAMI 2023"
  },
  {
    "nombre": "Reintegros",
    "categoria": "Afiliaciones y expedientes",
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
    "categoria": "Medicamentos especiales",
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
    "categoria": "Insumos y ayudas técnicas",
    "descripcion": "Hasta 4 de flujo de oxígeno. Se carga por sistema de Insumos y se envía por expediente electrónico (GENE00003).",
    "fuente": "PDF Guía"
  },
  {
    "nombre": "OXIGENOTERAPIA V/E (VÍA EXCEPCIÓN)",
    "categoria": "Insumos y ayudas técnicas",
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
    "nombre": "Hospital Italiano de La Plata",
    "especialidades": ["ONCOLOGIA - TRATAMIENTOS", "VIDEOENDOSCOPICAS GASTROINTESTINALES", "HEMATOLOGIA", "INFECTOLOGIA", "REUMATOLOGIA", "ENDOCRINOLOGIA", "FLEBOLOGIA", "OTORRINOLARINGOLOGIA", "DERMATOLOGIA", "NEUROLOGIA", "CARDIOLOGIA", "CIRUGIA GENERAL AMBULATORIA", "UROLOGIA", "NEUMONOLOGIA", "NEFROLOGIA", "HEPATOLOGIA", "GINECOLOGIA Y OBSTETRICIA", "GASTROENTEROLOGIA", "NUTRICION"],
    "imagenes": []
  },
  {
    "nombre": "Htal Zonal Ricardo Gutierrez",
    "especialidades": ["ONCOLOGIA - TRATAMIENTOS", "HEMATOLOGIA", "INFECTOLOGIA", "PEDIATRIA", "REUMATOLOGIA", "FLEBOLOGIA", "OTORRINOLARINGOLOGIA", "DERMATOLOGIA", "ANATOMIA PATOLOGICA", "CARDIOLOGIA", "CIRUGIA GENERAL AMBULATORIA", "UROLOGIA", "TRAUMATOLOGIA", "GINECOLOGIA Y OBSTETRICIA", "GASTROENTEROLOGIA", "FONOAUDIOLOGIA", "NUTRICION"],
    "imagenes": ["RX", "ECO", "ECODOPPLER", "TAC"]
  }
];
