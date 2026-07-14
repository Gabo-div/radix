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

Este documento presenta el macroproyecto RADIX (Red de Aprendizaje y Datos en Infraestructuras Extremas), desarrollado en la unidad curricular Sistemas Distribuidos. Se describe el problema que motiva el proyecto, el origen del mismo como integración de siete propuestas individuales, la justificación de su nombre, la solución planteada con sus objetivos, la arquitectura de hardware y software prevista, RHIZOMA (el nodo móvil robótico de la red), el flujo de datos del sistema y el estado actual del prototipo funcional que se ha construido hasta la fecha.

El proyecto integra el trabajo de dos unidades curriculares: Sistemas Distribuidos aporta la plataforma educativa y la infraestructura de red de los nodos escolares, mientras que Robótica aporta RHIZOMA, un robot todoterreno alimentado por energía solar que actúa como repetidor móvil de la red mesh.

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

La decisión de diseño más importante del sistema es asumir la partición de red como condición permanente y no como falla excepcional. De ahí se derivan el resto de las decisiones técnicas: almacenamiento local como fuente primaria de verdad, cola de transacciones pendientes de sincronización, y mecanismos de fusión de datos que toleran actualizaciones concurrentes desde nodos que estuvieron semanas sin verse.

La red de acceso, además, no es completamente estática: la propuesta incorpora RHIZOMA (sección 9), un robot todoterreno que transporta un repetidor mesh y se reposiciona de forma autónoma según las métricas de la red, cubriendo los huecos de cobertura que una topología fija no puede resolver.

## 6. Objetivos

### 6.1. Objetivo general

Desplegar una infraestructura de sistemas distribuidos tolerante a condiciones extremas para garantizar el acceso ininterrumpido a recursos educativos digitales en comunidades aisladas de la Amazonía.

### 6.2. Objetivos específicos

1. Instalar microservidores de bajo costo y alta resiliencia, energizados por sistemas fotovoltaicos, en las escuelas seleccionadas.
2. Configurar una red en malla (Mesh) local que permita la interacción simultánea de los dispositivos estudiantiles sin consumo de internet.
3. Desarrollar la plataforma educativa (LMS) que corre en cada nodo: gestión de cursos, lecciones, evaluaciones, biblioteca multimedia y seguimiento del progreso, operando de forma totalmente offline.
4. Implementar el registro de transacciones DTN que encola la actividad académica local para su sincronización oportunista con el servidor central.
5. Incorporar algoritmos de replicación de datos libres de conflicto (CRDT) para asegurar la convergencia de la información académica entre nodos cuando ocurran conexiones oportunistas.
6. Construir RHIZOMA, un robot terrestre autónomo alimentado por energía solar que transporte un nodo repetidor de la red mesh y se reposicione dinámicamente según las métricas de calidad y cobertura de la red.

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
| Telecomunicación de diagnóstico | Gateways LoRaWAN de 8 canales + antenas de fibra de vidrio de largo alcance | 2 uds. (1 por escuela) | Canal alterno de telemetría de bajo ancho de banda para alertas de diagnóstico y estado del sistema | 160.00 | 320.00 |
| Accesorios y conectividad | MicroSD clase 10, cableado estructurado, conectores y herrajes de montaje | Global | Ensamblaje, blindaje contra la humedad y despliegue físico en sitio | 150.00 | 150.00 |
| **Total** | | | | | **2,430.00** |

El presupuesto del nodo móvil RHIZOMA se detalla por separado en la sección 9.5.

### 8.2. Plataforma de software

El software que corre en cada nodo es un LMS (*Learning Management System*) offline-first desarrollado a la medida del proyecto. Se eligieron tecnologías que funcionan bien en hardware limitado como el de una Raspberry Pi:

- **Backend:** servicio REST escrito en Go, un lenguaje compilado de bajo consumo de memoria, con una base de datos SQLite/libSQL embebida en el propio nodo. No hay dependencias externas en tiempo de ejecución: el binario y la base de datos viven en el mismo equipo.
- **Frontend:** aplicación web de página única (SPA) en React, servida desde el propio nodo. Los estudiantes acceden desde cualquier dispositivo con navegador conectado al Wi-Fi de la escuela, sin instalar nada.
- **Control de acceso:** tres roles (administrador/profesor, estudiante e invitado) autenticados contra el servidor local mediante sesiones con token.
- **Sincronización:** una cola de transacciones DTN registra localmente cada evento académico relevante (lecciones completadas, calificaciones, experiencia ganada) a la espera de la próxima ventana de conectividad.

## 9. RHIZOMA: el nodo móvil de la red

### 9.1. Motivación

La red mesh perimetral descrita en la sección anterior se apoya en puntos de acceso fijos instalados en la escuela. Esta topología funciona mientras los usuarios permanecen dentro del área prevista, pero el entorno amazónico es dinámico y la cobertura fija presenta tres limitaciones concretas: la demanda es móvil (estudiantes y docentes se desplazan entre el caserío, el río y las zonas de cultivo, dejando zonas muertas que cambian según la hora), el entorno cambia (la vegetación crece, el nivel del río varía con las estaciones y las lluvias atenúan la señal, degradando enlaces que antes funcionaban) y cada punto de acceso fijo es un punto único de falla cuya reparación puede tardar semanas en llegar. Instalar más equipos fijos para cada escenario posible es costoso y no resuelve el carácter cambiante del problema: lo que se necesita es un elemento de red capaz de moverse hacia donde la red lo necesita.

### 9.2. El robot

RHIZOMA es un vehículo terrestre no tripulado (UGV) todoterreno que actúa como repetidor mesh móvil y autónomo. Lleva en su interior un punto de acceso idéntico a los fijos de la escuela, de modo que para la red es simplemente un nodo más; la diferencia es que este nodo tiene ruedas, sensores y criterio propio para decidir dónde ubicarse. El robot monitorea continuamente las métricas de la red (intensidad de señal, pérdida de paquetes, cantidad y ubicación aproximada de los clientes) y, cuando detecta una necesidad, calcula una posición mejor dentro de una zona delimitada y se desplaza hacia ella. Cuando no hay demanda de cobertura, puede cumplir un segundo papel dentro de la arquitectura DTN: trasladarse al embarcadero y actuar como mula de datos terrestre, transportando físicamente la cola de sincronización hacia una ventana de conectividad.

El nombre sigue la línea etimológica del macroproyecto: el rizoma es el tallo subterráneo que ciertas plantas extienden horizontalmente para hacer brotar raíces y tallos nuevos lejos del punto original. Mientras la raíz (*radix*) permanece fija y ancla la planta al territorio, como los nodos de las escuelas, el rizoma es la parte del sistema que se desplaza y expande la red viva hacia donde hay recursos.

### 9.3. Arquitectura del robot

El diseño se divide en cuatro subsistemas:

**Locomoción.** Chasis de seis ruedas con suspensión articulada tipo *rocker-bogie*, la configuración usada en los rovers de exploración planetaria, elegida porque permite superar obstáculos de hasta el doble del radio de la rueda manteniendo las seis ruedas en contacto con el suelo, sin resortes y con baja complejidad mecánica. Tracción por motores DC con reductora y dirección diferencial. La velocidad objetivo es baja (alrededor de 0,5 m/s): el robot no necesita rapidez sino estabilidad, bajo consumo y capacidad de cargar el equipo de red sin vibraciones dañinas.

**Comunicación.** Punto de acceso mesh para exteriores (norma IP67, la misma familia de equipos de los nodos fijos) con antena omnidireccional en un mástil corto. Este equipo es la carga útil del robot y permanece encendido incluso cuando el robot está detenido o en bajo consumo. Como canal secundario, un módulo LoRa transmite telemetría del propio robot (posición, batería, estado) hacia el gateway de diagnóstico de la escuela, de forma que el robot es localizable aun si la red mesh se cae por completo.

**Energía.** Panel solar de 50 W montado como techo del chasis, controlador de carga MPPT y batería LiFePO4 de 12 V y 20 Ah, química elegida por su tolerancia a temperaturas altas y su vida útil en ciclos. El consumo permanente (punto de acceso más controlador, unos 8 W) lo sostiene el panel usando la batería como amortiguador nocturno; los desplazamientos son eventos cortos y poco frecuentes.

**Control y navegación.** Un computador de placa única ejecuta la lógica de alto nivel (métricas de red, decisión de reubicación, planificación de ruta) y un microcontrolador dedicado maneja el tiempo real (control de motores, sensores, corte de emergencia). La navegación usa GPS, unidad inercial y sensores ultrasónicos para evasión de obstáculos. El robot opera dentro de una geocerca definida por el encargado del nodo, fuera de la cual se detiene y pide asistencia por telemetría.

### 9.4. Comportamiento adaptativo

El algoritmo de posicionamiento funciona como una máquina de estados con cuatro modos:

1. **Repetidor estático.** Estado por defecto: el robot está detenido dando servicio y registra periódicamente la señal hacia los nodos vecinos, la pérdida de paquetes y el número de clientes asociados.
2. **Evaluación.** Cuando alguna métrica cruza un umbral, el robot genera posiciones candidatas dentro de la geocerca y las puntúa con una función de costo que combina la mejora esperada de señal, la distancia a recorrer y la energía disponible. Si ninguna candidata supera con margen a la posición actual, no se mueve: la estabilidad de la red vale más que una mejora marginal.
3. **Reposicionamiento.** El robot navega a baja velocidad hacia la posición elegida, evadiendo obstáculos, con el punto de acceso encendido durante todo el trayecto (el servicio se degrada gradualmente pero nunca se corta). Al llegar verifica que la mejora prevista se haya cumplido; si no, marca esa posición como mala y reevalúa.
4. **Ahorro de energía.** Si la batería cae bajo el umbral crítico, el robot se traslada a la posición despejada más cercana con buena captación solar, desactiva la locomoción y mantiene solo el servicio de red y la telemetría hasta recuperar carga.

Este esquema evita deliberadamente técnicas complejas de planificación: umbrales, función de costo y geocerca son suficientes para el alcance del proyecto, son depurables en campo y fallan de forma predecible.

### 9.5. Presupuesto del robot

| Subsistema | Componente | Propósito | Costo (USD) |
|---|---|---|---|
| Locomoción | Chasis de 6 ruedas con suspensión rocker-bogie, motores DC con reductora y drivers | Desplazamiento sobre terreno irregular con carga útil | 220.00 |
| Comunicación | Access point mesh para exteriores (IP67) + antena omnidireccional con mástil | Nodo repetidor de la red mesh, carga útil del robot | 110.00 |
| Comunicación | Módulo LoRa + antena | Telemetría de respaldo independiente de la red mesh | 25.00 |
| Energía | Panel solar 50 W + controlador de carga MPPT | Recarga autónoma permanente | 95.00 |
| Energía | Batería LiFePO4 12 V 20 Ah | Amortiguador nocturno y reserva para desplazamientos | 105.00 |
| Control | Computador de placa única + microcontrolador de tiempo real | Lógica de decisión y control de motores | 85.00 |
| Navegación | Módulo GPS, IMU y sensores ultrasónicos | Posicionamiento, orientación y evasión de obstáculos | 55.00 |
| Estructura | Carcasa estanca, sellos, cableado, conectores y herrajes | Protección contra humedad, polvo e insectos | 80.00 |
| **Total** | | | **775.00** |

### 9.6. Riesgos y limitaciones

- **Terreno.** El robot está pensado para el perímetro escolar y senderos cercanos, no para selva cerrada: barro profundo, troncos grandes o pendientes fuertes quedan fuera de su capacidad. La geocerca debe trazarse sobre terreno ya conocido.
- **Clima.** La humedad y los insectos son la principal amenaza para la electrónica; todo va en carcasa estanca con los conectores expuestos al mínimo, y se contempla mantenimiento preventivo mensual.
- **Autonomía en temporada de lluvias.** Varios días sin sol reducen la captación; en ese escenario el robot degrada a modo repetidor estático, que es el comportamiento seguro: la red pierde adaptabilidad pero no cobertura.
- **Seguridad física.** Más que medidas antirrobo técnicas, el proyecto apuesta por la apropiación comunitaria: el robot pertenece a la escuela, la comunidad participa en su despliegue y la telemetría LoRa permite ubicarlo en todo momento.

## 10. Flujo de datos

El ciclo de sincronización de RADIX opera en cuatro pasos, diseñados para funcionar ante la desconexión total:

1. **Captura en el borde (offline).** El alumno se conecta al Wi-Fi Mesh de la escuela e interactúa con el aula digital. Todo el progreso se procesa localmente en el clúster de microservidores, sin usar internet.
2. **Persistencia inmutable (IPFS).** Las tareas y archivos se guardan en el sistema de archivos distribuido IPFS, que asigna a cada contenido un identificador único derivado del propio contenido (CID). Esto protege la información ante apagones y permite verificar su integridad.
3. **Fusión sin conflictos (CRDT).** Las notas y asistencias se empaquetan usando estructuras de datos replicadas libres de conflicto. Esto permite que los datos generados en nodos distintos se fusionen matemáticamente más tarde, sin corromperse ni chocar entre sí.
4. **Transporte oportunista (DTN).** Los datos acumulados esperan en cola hasta que pasa una lancha comunitaria (la "mula de datos") que los absorbe por Wi-Fi, o hasta que se abre una ventana satelital corta, llevando la información al servidor central de los profesores.

## 11. Estado actual del prototipo

El equipo cuenta con un prototipo funcional del nodo educativo, que implementa el primer eslabón del flujo anterior (la captura en el borde) y la cola de transporte oportunista. El prototipo simula un servidor de borde tipo Raspberry Pi y ya ofrece:

- Gestión de cursos con lecciones en formato de texto enriquecido, evaluaciones (quizzes) con calificación por curso y un foro de discusión por curso.
- Biblioteca digital local: el profesor sube archivos (video, audio, imágenes, PDF, documentos) al nodo y puede incrustarlos dentro de las lecciones mediante una sintaxis de enlaces internos.
- Sistema de progreso y gamificación: los estudiantes acumulan puntos de experiencia (XP) al completar lecciones y evaluaciones, lo que ayuda a sostener la motivación en un entorno sin supervisión constante.
- Cola de sincronización DTN: cada transacción académica queda registrada localmente, lista para transmitirse en la próxima ventana de conectividad.
- Panel de monitoreo para el administrador: uso de disco, sesiones activas, estado de la cola DTN y registro histórico de logs del servidor con búsqueda.

Todo lo anterior funciona sin ninguna conexión a internet, contra el servidor local. Quedan como trabajo de las siguientes fases la replicación entre nodos con CRDT, el almacenamiento distribuido con IPFS, el clúster redundante de tres microservidores por escuela, el canal de telemetría LoRaWAN y la construcción de RHIZOMA.

## 12. Conclusión

Frente a un ecosistema global que condiciona el acceso a la educación a la tenencia de una conexión comercial a internet, RADIX plantea lo contrario: la tecnología debe adaptarse a la geografía de las personas, y no al revés.

El proyecto se sostiene sobre tres pilares. El primero es social: inspirado en los principios de Juan Bautista de La Salle, busca priorizar a las comunidades más vulnerables, no como caridad sino como justicia, evitando que la falta de infraestructura convierta a las escuelas rurales en islas de desconexión que agraven la brecha educativa. El segundo es cultural: al tomar como símbolo las raíces de los árboles ancestrales, que sostienen la vida y comparten nutrientes de manera descentralizada bajo la tierra, el sistema reivindica la autonomía y la identidad amazónica, devolviendo el protagonismo al aula local y al estudiante. El tercero es técnico: el proyecto demuestra que es factible llevar el centro de datos al territorio, con microservidores solares que actúan como cerebro local, una red Wi-Fi propia de la escuela y un nodo robótico móvil que adapta la cobertura al territorio en lugar de esperar que el territorio se adapte a ella.

Desde el punto de vista de los sistemas distribuidos, RADIX es un ejercicio aplicado de la variante AP del Teorema CAP: el sistema sacrifica la consistencia inmediata de los datos entre nodos para asegurar una disponibilidad local inquebrantable, y recupera la coherencia global mediante sincronización oportunista y consistencia eventual. El prototipo ya construido confirma que este enfoque es realizable con hardware de bajo costo y software eficiente. Con ello, RADIX refuerza la idea de que el aislamiento geográfico en la Amazonía no tiene por qué implicar exclusión: el derecho a aprender no debe depender de un cable de red.

## 13. Referencias

- Cerf, V. et al. (2007). *Delay-Tolerant Networking Architecture*. RFC 4838, IETF.
- Gilbert, S. y Lynch, N. (2002). "Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services". *ACM SIGACT News*, 33(2).
- Shapiro, M., Preguiça, N., Baquero, C. y Zawirski, M. (2011). "Conflict-free Replicated Data Types". *Symposium on Self-Stabilizing Systems*, Springer.
- Benet, J. (2014). *IPFS - Content Addressed, Versioned, P2P File System*. arXiv:1407.3561.
- Tanenbaum, A. y Van Steen, M. (2017). *Distributed Systems: Principles and Paradigms* (3.ª ed.).
- Siegwart, R., Nourbakhsh, I. y Scaramuzza, D. (2011). *Introduction to Autonomous Mobile Robots* (2.ª ed.). MIT Press.
- Harrington, B. y Voorhees, C. (2004). "The Challenges of Designing the Rocker-Bogie Suspension for the Mars Exploration Rover". *38th Aerospace Mechanisms Symposium*, NASA.
- IEEE 802.11s. *Mesh Networking Amendment*. IEEE Standards Association.
- Isidoro de Sevilla. *Etymologiarum sive Originum*, libro XVII.
