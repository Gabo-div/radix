## Integrantes

**Docente:** Livia Borjas

**Unidades curriculares:** Sistemas Distribuidos y Robótica

| Integrante | C.I. | Asignatura |
|---|---|---|
| Bravo, Yonkeiner | 30.994.057 | Sistemas Distribuidos |
| Coro, Anyelis | 30.366.262 | Robótica |
| Hernández, Gabriel | 30.831.045 | Sistemas Distribuidos |
| Maita, Jhoanny | 30.694.732 | Sistemas Distribuidos |
| Moreno, Roxana | 31.248.475 | Sistemas Distribuidos |
| Mundarain, Adrián | 30.932.660 | Sistemas Distribuidos |
| Nuñez, Miguel | 30.932.227 | Sistemas Distribuidos y Robótica |
| Rodríguez, Sebastián | 30.366.364 | Sistemas Distribuidos |
| Rojas, Tairon | 31.182.204 | Sistemas Distribuidos y Robótica |
| Suárez, Julio | 31.074.002 | Sistemas Distribuidos |

## 1. Introducción

Este documento presenta el macroproyecto RADIX (Red de Aprendizaje y Datos en Infraestructuras Extremas), desarrollado en la unidad curricular Sistemas Distribuidos. Se describe el problema que motiva el proyecto, el origen del mismo como integración de siete propuestas individuales, la justificación de su nombre, la solución planteada con sus objetivos, la arquitectura de hardware y software prevista, el flujo de datos del sistema y el estado actual del prototipo funcional que se ha construido hasta la fecha.

La idea central del proyecto puede resumirse en una frase: llevar el centro de datos a la escuela, en lugar de exigir que la escuela busque una conexión que no existe.

## 2. Planteamiento del problema

Las comunidades indígenas amazónicas enfrentan un aislamiento geográfico y tecnológico estructural. El modelo educativo contemporáneo asume la conectividad a internet como un requisito obligatorio para el acceso al conocimiento; sin embargo, en la selva profunda la infraestructura de telecomunicaciones tradicional es económicamente inviable y técnicamente insostenible. Tender fibra óptica o mantener enlaces satelitales permanentes en estas zonas tiene costos que ninguna escuela rural puede asumir, y las condiciones del entorno (humedad, distancia, falta de red eléctrica estable) hacen que cualquier despliegue convencional se degrade rápido.

El resultado es que las plataformas educativas actuales, centralizadas en la nube, excluyen de forma automática a quien no cuenta con la infraestructura necesaria. Sin acceso a material actualizado, herramientas multimedia o plataformas de seguimiento del progreso académico, las escuelas locales quedan reducidas a islas de desconexión informativa, lo que amplía cada año la brecha social y educativa entre la juventud rural y la urbana.

El problema, visto desde la ingeniería, no es la falta de internet en sí, sino que el software educativo se diseñó asumiendo que internet siempre está. RADIX parte de la premisa contraria: la desconexión es el estado normal del sistema, y la conectividad es un evento ocasional que hay que aprovechar cuando ocurre.

## 3. Origen del macroproyecto

RADIX nace como una respuesta de convergencia ante la necesidad de garantizar la continuidad educativa en las regiones más aisladas del territorio venezolano y de la cuenca amazónica. No es una propuesta aislada: es el resultado de integrar siete iniciativas de software e infraestructura distribuida que los integrantes del equipo desarrollaron de forma independiente, y que aportaron los bloques fundacionales para resolver distintas aristas del mismo problema:

| Alumno | Proyecto | Descripción |
|---|---|---|
| Adrián Mundarain | Sistema Distribuido de Continuidad Educativa (SIDICE) | Sistema para proteger y garantizar el derecho a la educación y la salud de comunidades indígenas con alta movilidad geográfica (como las etnias Warao y Eñepá) en el Delta del Orinoco. |
| Gabriel Hernández | La Llave del Conocimiento: Sistema Académico para el Amazonas | Microservidores de bajo costo alimentados por paneles solares en las escuelas de la selva, que actúan como biblioteca digital y "cerebro local". Los estudiantes se conectan al Wi-Fi propio de la escuela, sin internet, y el sistema aprovecha el paso de una lancha o ventanas cortas de señal satelital para enviar el progreso a los profesores. |
| Jhoanny Maita | Red Educativa Distribuida ARR | Red educativa descentralizada y offline que permite estudiar en zonas rurales aisladas sin depender de internet. |
| Miguel Nuñez | Sistema Educativo Ubicuo | Un servidor web local en cada aldea para almacenar videos, audios y texto, con replicación asíncrona de la información hacia el resto de las aldeas. |
| Roxana Moreno | Saberes de la Selva | Plataforma de gestión de datos educativos para comunidades de la selva. |
| Tairon Rojas | Cunawar: La Amazonía Conectada | Red social orientada a la información y el aprendizaje, basada en un modelo de publicación/suscripción (Pub/Sub). |
| Yonkeiner Bravo | Ecosistema Conectado | Sistema que aborda la educación rural y remota transformando las limitaciones de conectividad de la selva en una oportunidad de aprendizaje autónomo. |

RADIX unifica estas perspectivas en una infraestructura única y de alta resiliencia: el despliegue de nodos autónomos, compuestos por clústeres de microservidores embebidos, ubicados directamente en los centros educativos rurales. Cada nodo opera como un centro de datos local e independiente que genera su propia cobertura de red inalámbrica perimetral (Wi-Fi Mesh escolar).

Los dispositivos de alumnos y docentes interactúan de forma completamente offline dentro del área de cobertura de la escuela. La persistencia y el intercambio de información a mayor escala se gestionan mediante una red tolerante al retraso (DTN, Delay-Tolerant Networking): la información académica, las evaluaciones y las actualizaciones del repositorio no dependen de un canal de comunicación continuo, sino que se propagan de manera oportunista, aprovechando tanto el tránsito físico de embarcaciones fluviales (lanchas que actúan como "mulas de datos") como las ventanas temporales e intermitentes de conectividad satelital en el borde de la red.

## 4. Justificación del nombre

El nombre del proyecto se fundamenta en una triple convergencia (lingüística, cultural y tecnológica) inspirada en la metodología de Isidoro de Sevilla, quien afirmaba que comprender la raíz (*radix*) de las palabras permite descubrir la verdadera fuerza y esencia de las cosas:

> *"Radix dicta quod vincta sit terrae, vel quod infra ramos quasi radii emittantur."*
> (La raíz se llama así porque está unida a la tierra, o porque hacia abajo se emiten ramas como si fueran rayos.)
> — Isidoro de Sevilla, *Etymologiarum*, XVII, 6, 1.

### 4.1. Fundamento filosófico y etimológico

Siguiendo el principio isidoriano, el término *radix* exige desviar la mirada del centralismo tecnológico actual, que obliga a depender de la nube urbana, para devolver el foco al origen del problema: el aula local y el estudiante aislado.

### 4.2. Resonancia cultural amazónica

Para las comunidades indígenas, las raíces de los árboles ancestrales representan el pilar invisible que sostiene la vida, la memoria y el territorio. Bajo el suelo de la selva, estas raíces se comunican y comparten nutrientes de forma descentralizada. El proyecto adopta este símbolo como modelo de autonomía, firmeza y respeto a la identidad de los pueblos originarios.

### 4.3. Paralelismo técnico

En redes de computadoras, el nodo raíz (*root*) es la base desde donde se ramifica una topología. La analogía se cumple además físicamente en la infraestructura diseñada: el microservidor local actúa como la raíz anclada al territorio, mientras que las antenas inalámbricas emiten ondas en forma de rayos (*radii*) para enlazar los dispositivos de los alumnos en el borde de la red.

## 5. La solución

RADIX rompe con la dependencia de la nube mediante una arquitectura de computación de borde (*edge computing*) con consistencia eventual. En lugar de un servidor central del que todos dependen, el proyecto descentraliza la información desplegando nodos físicos autónomos en cada escuela.

Dentro del área de cobertura escolar, toda la actividad (clases, evaluaciones, consulta de material multimedia, seguimiento del progreso) funciona de forma 100% offline contra el servidor local. Cuando aparece una oportunidad de comunicación con el exterior, sea una lancha que pasa o una ventana satelital corta, el sistema sincroniza lo acumulado. Con esto se garantiza que el derecho a aprender no dependa de un cable de red ni de un satélite.

La decisión de diseño más importante del sistema es asumir la partición de red como condición permanente y no como falla excepcional. De ahí se derivan el resto de las decisiones técnicas: almacenamiento local como fuente primaria de verdad, registro de operaciones reproducibles con versionado por reloj lógico híbrido (HLC) para fusión determinista de datos, y extracción oportunista por HTTP donde cada nodo pide solo lo que le falta.

## 6. Objetivos

### 6.1. Objetivo general

Desplegar una infraestructura de sistemas distribuidos tolerante a condiciones extremas para garantizar el acceso ininterrumpido a recursos educativos digitales en comunidades aisladas de la Amazonía.

### 6.2. Objetivos específicos

1. Instalar microservidores de bajo costo y alta resiliencia, energizados por sistemas fotovoltaicos, en las escuelas seleccionadas.
2. Configurar una red en malla (Mesh) local que permita la interacción simultánea de los dispositivos estudiantiles sin consumo de internet.
3. Desarrollar la plataforma educativa (LMS) que corre en cada nodo: gestión de cursos, lecciones, evaluaciones, biblioteca multimedia y seguimiento del progreso, operando de forma totalmente offline.
4. Implementar el registro de transacciones DTN que encola la actividad académica local para su sincronización oportunista con el servidor central.
5. Incorporar un sistema de versionado de filas con reloj lógico híbrido (HLC) y un registro de operaciones reproducibles para asegurar la convergencia determinista de la información académica entre nodos cuando ocurran conexiones oportunistas, en sustitución del enfoque original de CRDT, que resultó de mayor complejidad de la que el patrón de escritura del sistema requiere.

## 7. Justificación

La justificación del proyecto puede dividirse en dos aspectos:

**Técnica.** RADIX demuestra la viabilidad del Teorema CAP en su variante AP (disponibilidad y tolerancia a particiones) en un escenario real. Ante una partición de red, que en este contexto es el estado normal, el sistema elige seguir disponible y sacrifica la consistencia inmediata entre nodos, recuperándola después mediante consistencia eventual. Es un caso de estudio de cómo la ingeniería de software puede resolver problemas humanos críticos eligiendo con criterio qué garantías sacrificar.

**Social y ética.** Sigue el mandato de Juan Bautista de La Salle de volcar el mayor cuidado hacia los más vulnerables. No se trata de caridad tecnológica: es un acto de justicia dotar a estas comunidades de las mismas herramientas que poseen las grandes urbes, respetando su autonomía y su territorio.

## 8. Arquitectura y tecnologías

### 8.1. Infraestructura de hardware

Para soportar las demandas del entorno, el hardware de RADIX se organiza en capas de alta resiliencia. El presupuesto estimado corresponde a un despliegue piloto en dos aldeas:

| Capa | Componente seleccionado | Cantidad (2 aldeas) | Propósito | Costo unit. (USD) | Costo total (USD) |
|---|---|---|---|---|---|
| Infraestructura de borde | Raspberry Pi 4 (8 GB RAM) en gabinete de disipación pasiva de aluminio | 6 uds. (clúster de 3 por escuela) | Procesamiento local redundante de los servicios web y tolerancia a fallos de hardware | 90.00 | 540.00 |
| Infraestructura energética | Sistema fotovoltaico autónomo (panel solar 150 W + regulador PWM + batería de ciclo profundo GEL 12 V 100 Ah) | 2 kits (1 por escuela) | Alimentación eléctrica ininterrumpida las 24 horas, sin depender de la red eléctrica pública | 380.00 | 760.00 |
| Almacenamiento | SSD 512 GB USB 3.0 de alta resistencia (high-endurance) | 4 uds. (2 por escuela) | Almacenamiento persistente del repositorio multimedia y las bases de datos locales | 55.00 | 220.00 |
| Telecomunicación local | Access points para exteriores de alta ganancia (norma IP67) | 4 uds. (2 por escuela) | Red Mesh Wi-Fi perimetral del área escolar para conexión concurrente de alumnos sin internet | 110.00 | 440.00 |
| Telemetría | Puerta de enlace LoRa de 8 canales con antena de largo alcance, para latido de presencia y alertas de estado | 2 uds. (1 por escuela) | Canal alterno de telemetría de bajo ancho de banda cuando el enlace principal está caído | 160.00 | 320.00 |
| Enlace entre comunidades | Radios direccionales para exterior en 2,4 GHz con antena integrada de ganancia superior a 20 dBi | 2 pares | Backbone punto a punto entre escuelas para sincronización de datos | 90.00 | 180.00 |
| Estructura de soporte | Mástil arriostrado para elevar la antena sobre el dosel de la selva, con puesta a tierra y protección contra descargas atmosféricas | 2 uds. | Despeje de la zona de Fresnel para enlaces de largo alcance | 260.00 | 520.00 |
| Accesorios y conectividad | MicroSD clase 10, cableado estructurado, conectores y herrajes de montaje | Global | Ensamblaje, blindaje contra la humedad y despliegue físico en sitio | 150.00 | 150.00 |
| **Total** | | | | | **3,130.00** |

### 8.2. Plataforma de software

El software que corre en cada nodo es un LMS (*Learning Management System*) offline-first desarrollado a la medida del proyecto. Se eligieron tecnologías que funcionan bien en hardware limitado como el de una Raspberry Pi:

- **Backend:** servicio REST escrito en Go, un lenguaje compilado de bajo consumo de memoria, con una base de datos SQLite/libSQL embebida en el propio nodo. No hay dependencias externas en tiempo de ejecución: el binario y la base de datos viven en el mismo equipo.
- **Frontend:** aplicación web de página única (SPA) en React, servida desde el propio nodo. Los estudiantes acceden desde cualquier dispositivo con navegador conectado al Wi-Fi de la escuela, sin instalar nada.
- **Control de acceso:** tres roles (administrador/profesor, estudiante e invitado) autenticados contra el servidor local mediante sesiones con token.
- **Sincronización:** un registro de operaciones reproducibles anota cada escritura como una operación atómica (tabla, clave, tipo de cambio, versión y fila completa). Los nodos vecinos extraen por HTTP solo las operaciones que les faltan, usando cursores locales. Cada operación es idempotente: su identidad combina nodo de origen, tabla, clave y versión. Los conflictos entre ediciones concurrentes se resuelven por versión de fila, estampada con un reloj lógico híbrido (HLC) que garantiza monotonicidad incluso si el reloj de pared del servidor se atrasa, como ocurre en un equipo sin RTC ni NTP.
- **Enlace entre comunidades:** inicialmente planteado con radios LoRa para el transporte de datos, el análisis de ancho de banda, tamaño de trama y ciclo de trabajo demostró que LoRa no es viable para el volumen de datos del LMS. Se sustituyó por un backbone de WiFi direccional en 2,4 GHz con antenas de alta ganancia, que ofrece tasas del orden de decenas de Mbps. LoRa se conserva como canal de telemetría para latido de presencia y alertas de estado. El cambio de medio no requirió modificar el código de la aplicación, porque la sincronización ya opera sobre HTTP y es agnóstica al medio físico.

## 9. Flujo de datos

El ciclo de sincronización de RADIX opera en cuatro pasos, diseñados para funcionar ante la desconexión total:

1. **Captura en el borde (offline).** El alumno se conecta a la red Mesh de la escuela e interactúa con el aula digital. Todo el progreso se procesa localmente en el servidor de borde, sin usar internet.

2. **Persistencia local.** Los datos se guardan en la base de datos SQLite/libSQL del nodo y los archivos subidos se almacenan en disco. Una escritura en la base de datos y el registro de su operación correspondiente ocurren en la misma transacción, de modo que un cambio nunca existe sin su operación ni una operación sin su cambio. Cada fila nueva se estampa con un reloj lógico híbrido (HLC) que avanza de forma monótona incluso si el reloj de pared se atrasa, una condición esperable en hardware sin RTC ni acceso a NTP.

3. **Resolución de conflictos por versión.** Cuando dos nodos editaron la misma fila, el sistema compara el par `(hlc, origin_node)`. Gana el de versión mayor; el identificador del nodo solo rompe empates. Esto produce un resultado idéntico en todos los nodos sin importar el orden en que se fusionen. Las tablas de pertenencia (inscripciones, lecciones completadas, *me gusta*), cuyo único conflicto es inserción contra eliminación, se resuelven mediante el registro de operaciones en lugar de versionado de fila.

4. **Transporte oportunista (DTN).** Cada nodo mantiene un registro de operaciones del que los nodos vecinos extraen únicamente lo que les falta, mediante una ruta HTTP de solo lectura autenticada con un secreto compartido. Las operaciones recibidas se almacenan conservando su origen, lo que permite el reenvío en cadena: un nodo intermedio puede pasar a un tercero lo que aprendió del primero, sin que los extremos se comuniquen nunca directamente. Cuando no hay enlace de red, el respaldo completo exportable como archivo comprimido puede transportarse físicamente (sneakernet) en una unidad USB.

## 10. Estado actual del prototipo

El equipo cuenta con un prototipo funcional del nodo educativo que implementa el LMS offline completo y la replicación entre nodos. El prototipo simula un servidor de borde tipo Raspberry Pi y ya ofrece:

- Gestión de cursos con lecciones en formato de texto enriquecido, evaluaciones (quizzes) con calificación por curso y un foro de discusión por curso.
- Biblioteca digital local: el profesor sube archivos (video, audio, imágenes, PDF, documentos, videojuegos HTML) al nodo y puede incrustarlos dentro de las lecciones mediante una sintaxis de enlaces internos `[[id]]`.
- Sistema de progreso y gamificación: los estudiantes acumulan puntos de experiencia (XP) al completar lecciones y evaluaciones, lo que ayuda a sostener la motivación en un entorno sin supervisión constante.
- Sincronización entre nodos: cada escritura se anota como una operación reproducible con versión HLC; los nodos pares extraen solo las operaciones que les faltan, los conflictos se resuelven por versión de fila y los archivos se descargan por separado. La sincronización se ha validado en una red de prueba de tres nodos en contenedores (A → B → C), confirmando que las operaciones se reenvían en cadena.
- Panel de monitoreo con métricas en tiempo real (disco, sesiones activas, estado de la cola de sincronización) y registro histórico de logs del servidor con búsqueda de texto completo.

Todo lo anterior funciona sin ninguna conexión a internet, contra el servidor local. Quedan como trabajo de las siguientes fases: el clúster redundante de tres microservidores por escuela, el canal de telemetría LoRaWAN, y el estudio y despliegue del enlace WiFi direccional entre comunidades, cuya viabilidad técnica se ha analizado pero no se ha instalado físicamente. El sistema de logros (medallas) se encuentra en una versión preliminar con umbrales fijos calculados en el cliente, pendiente de un subsistema con respaldo en el servidor.

## 11. Conclusión

Frente a un ecosistema global que condiciona el acceso a la educación a la tenencia de una conexión comercial a internet, RADIX plantea lo contrario: la tecnología debe adaptarse a la geografía de las personas, y no al revés.

El proyecto se sostiene sobre tres pilares. El primero es social: inspirado en los principios de Juan Bautista de La Salle, busca priorizar a las comunidades más vulnerables, no como caridad sino como justicia, evitando que la falta de infraestructura convierta a las escuelas rurales en islas de desconexión que agraven la brecha educativa. El segundo es cultural: al tomar como símbolo las raíces de los árboles ancestrales, que sostienen la vida y comparten nutrientes de manera descentralizada bajo la tierra, el sistema reivindica la autonomía y la identidad amazónica, devolviendo el protagonismo al aula local y al estudiante. El tercero es técnico: el proyecto demuestra que es factible llevar el centro de datos al territorio, con microservidores solares que actúan como cerebro local y una red Wi-Fi propia de la escuela.

Desde el punto de vista de los sistemas distribuidos, RADIX es un ejercicio aplicado de la variante AP del Teorema CAP: el sistema sacrifica la consistencia inmediata de los datos entre nodos para asegurar una disponibilidad local inquebrantable, y recupera la coherencia global mediante sincronización oportunista y consistencia eventual. El prototipo ya construido confirma que este enfoque es realizable con hardware de bajo costo y software eficiente. Con ello, RADIX refuerza la idea de que el aislamiento geográfico en la Amazonía no tiene por qué implicar exclusión: el derecho a aprender no debe depender de un cable de red.

## 12. Referencias

- Tanenbaum, A. y Van Steen, M. (2017). *Distributed Systems: Principles and Paradigms* (3.ª ed.).
- Coulouris, G., Dollimore, J., Kindberg, T. y Blair, G. (2011). *Distributed Systems: Concepts and Design* (5.ª ed.). Addison-Wesley.
- Cerf, V. et al. (2007). *Delay-Tolerant Networking Architecture*. RFC 4838, IETF.
- Fall, K. (2003). "A delay-tolerant network architecture for challenged internets". *Proc. ACM SIGCOMM*, pp. 27-34.
- Gilbert, S. y Lynch, N. (2002). "Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services". *ACM SIGACT News*, 33(2).
- Brewer, E. (2012). "CAP twelve years later: How the rules have changed". *Computer*, 45(2), pp. 23-29.
- Kulkarni, S. S., Demirbas, M., Madappa, D., Avva, B. y Leone, M. (2014). "Logical physical clocks and consistent snapshots in globally distributed databases". Informe técnico, State University of New York at Buffalo.
- Shapiro, M., Preguiça, N., Baquero, C. y Zawirski, M. (2011). "Conflict-free Replicated Data Types". *Symposium on Self-Stabilizing Systems*, Springer.
- Benet, J. (2014). *IPFS - Content Addressed, Versioned, P2P File System*. arXiv:1407.3561.
- Lamport, L. (1978). "Time, clocks, and the ordering of events in a distributed system". *Communications of the ACM*, 21(7), pp. 558-565.
- IEEE Std 830-1998. *Recommended Practice for Software Requirements Specifications*. IEEE Standards Association.
- IEEE 802.11s. *Mesh Networking Amendment*. IEEE Standards Association.
- Semtech Corporation (2015). "LoRa Modulation Basics". Nota de aplicación AN1200.22, rev. 2.
- Isidoro de Sevilla. *Etymologiarum sive Originum*, libro XVII.
