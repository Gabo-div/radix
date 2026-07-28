"""Contenido educativo del seed de RADIX (ver build_seed_backup.py).

Todo el texto se escribe aquí; el builder solo resuelve medios, calcula
relaciones y arma el zip. Convenciones:

- Los ids son estables y legibles (`c-*` curso, `les-*` lección, `qz-*`
  cuestionario, `ex-*` examen final, `lib-*` archivo, `fp-*` post del foro).
  Solo letras, números y guiones: es lo que acepta la sintaxis `[[id]]`.
- `[[lib-...]]` dentro del contenido incrusta el archivo; `[[les-...]]`
  enlaza otra lección. El builder deriva lesson_links/quiz_links/forum_links
  de esas referencias, igual que hace el backend al guardar.
- `{video}` en el cuerpo de una lección se reemplaza por el enlace de YouTube
  resuelto a partir de `video` (la consulta de búsqueda).
- Las preguntas son tuplas `(enunciado, [opciones], índice_correcto)`.
"""

# --- personas ---------------------------------------------------------------

TEACHER = {
    "id": "doc-vasquez",
    "name": "Prof. Elena Vásquez",
    "email": "elena.vasquez@radix.edu",
    "role": "admin",
}

STUDENTS = [
    {"id": "est-01", "name": "Rosa Yumbo", "email": "rosa.yumbo@radix.edu", "role": "student"},
    {"id": "est-02", "name": "Diego Shiguango", "email": "diego.shiguango@radix.edu", "role": "student"},
    {"id": "est-03", "name": "Camila Andrade", "email": "camila.andrade@radix.edu", "role": "student"},
    {"id": "est-04", "name": "Jairo Tanguila", "email": "jairo.tanguila@radix.edu", "role": "student"},
    {"id": "est-05", "name": "Lucía Grefa", "email": "lucia.grefa@radix.edu", "role": "student"},
    {"id": "est-06", "name": "Marco Cerda", "email": "marco.cerda@radix.edu", "role": "student"},
    {"id": "est-07", "name": "Valeria Chimbo", "email": "valeria.chimbo@radix.edu", "role": "student"},
    {"id": "est-08", "name": "Andrés Calapucha", "email": "andres.calapucha@radix.edu", "role": "student"},
    {"id": "est-09", "name": "Noelia Aguinda", "email": "noelia.aguinda@radix.edu", "role": "student"},
    {"id": "est-10", "name": "Iván Licuy", "email": "ivan.licuy@radix.edu", "role": "student"},
    {"id": "est-11", "name": "Paola Alvarado", "email": "paola.alvarado@radix.edu", "role": "student"},
    {"id": "est-12", "name": "Bruno Salazar", "email": "bruno.salazar@radix.edu", "role": "student"},
]

# --- biblioteca -------------------------------------------------------------
# kind=image|video|pdf -> se resuelve en Wikimedia Commons con `search`
# (`filemime` afina el tipo de archivo). kind=text -> el `body` se escribe tal
# cual como archivo y se sube como material de lectura. `type` es opcional y
# pisa el tipo que detect_type deduciría de la extensión: así un .html se
# registra como videojuego (game) en vez de documento.

MEDIA = [
    # Sistemas Distribuidos
    {"id": "lib-sd-arquitectura", "title": "Esquema cliente-servidor", "category": "Sistemas Distribuidos",
     "kind": "image", "filemime": "image/png", "search": "client server model diagram"},
    {"id": "lib-sd-relojes", "title": "Diagrama de relojes de Lamport", "category": "Sistemas Distribuidos",
     "kind": "image", "filemime": "image/png", "search": "Lamport timestamps diagram distributed"},
    {"id": "lib-sd-p2p", "title": "Red entre pares (P2P)", "category": "Sistemas Distribuidos",
     "kind": "image", "filemime": "image/png", "search": "peer to peer network topology diagram"},

    # Robótica
    {"id": "lib-rb-brazo", "title": "Brazo robótico industrial", "category": "Robótica",
     "kind": "image", "filemime": "image/jpeg", "search": "industrial robot arm manipulator"},
    {"id": "lib-rb-servo", "title": "Servomotor de modelismo", "category": "Robótica",
     "kind": "image", "filemime": "image/jpeg", "search": "hobby servo motor"},
    {"id": "lib-rb-sensor", "title": "Sensor ultrasónico HC-SR04", "category": "Robótica",
     "kind": "image", "filemime": "image/jpeg", "search": "ultrasonic sensor HC-SR04"},
    {"id": "lib-rb-video", "title": "Robot en movimiento (video)", "category": "Robótica",
     "kind": "video", "search": "robot arm moving"},

    # Redes
    {"id": "lib-rd-osi", "title": "Capas del modelo OSI", "category": "Redes",
     "kind": "image", "filemime": "image/png", "search": "OSI model layers diagram"},
    {"id": "lib-rd-rj45", "title": "Conector RJ45 y par trenzado", "category": "Redes",
     "kind": "image", "filemime": "image/jpeg", "search": "RJ45 connector twisted pair cable"},
    {"id": "lib-rd-antena", "title": "Antena para enlace inalámbrico rural", "category": "Redes",
     "kind": "image", "filemime": "image/jpeg", "search": "wireless antenna mast rural"},

    # Bases de Datos
    {"id": "lib-bd-er", "title": "Diagrama entidad-relación", "category": "Bases de Datos",
     "kind": "image", "filemime": "image/png", "search": "entity relationship diagram database"},
    {"id": "lib-bd-servidor", "title": "Servidor de base de datos", "category": "Bases de Datos",
     "kind": "image", "filemime": "image/jpeg", "search": "database server rack"},

    # Matemática Discreta
    {"id": "lib-mt-grafo", "title": "Grafo no dirigido de ejemplo", "category": "Matemática",
     "kind": "image", "filemime": "image/png", "search": "undirected graph example graph theory"},
    {"id": "lib-mt-venn", "title": "Diagrama de Venn de tres conjuntos", "category": "Matemática",
     "kind": "image", "filemime": "image/png", "search": "Venn diagram three sets"},
    {"id": "lib-mt-puentes", "title": "Los siete puentes de Königsberg", "category": "Matemática",
     "kind": "image", "filemime": "image/png", "search": "Seven Bridges of Konigsberg graph"},

    # Física
    {"id": "lib-fs-newton", "title": "Retrato de Isaac Newton", "category": "Física",
     "kind": "image", "filemime": "image/jpeg", "search": "Isaac Newton portrait painting"},
    {"id": "lib-fs-circuito", "title": "Circuito eléctrico elemental", "category": "Física",
     "kind": "image", "filemime": "image/png", "search": "simple electric circuit diagram resistor"},
    {"id": "lib-fs-pendulo", "title": "Péndulo oscilando (video)", "category": "Física",
     "kind": "video", "search": "pendulum oscillation"},

    # Biología Amazónica
    {"id": "lib-bio-anaconda", "title": "Anaconda verde (Eunectes murinus)", "category": "Biología",
     "kind": "image", "filemime": "image/jpeg", "search": "Eunectes murinus green anaconda"},
    {"id": "lib-bio-rio", "title": "Río Amazonas desde el aire", "category": "Biología",
     "kind": "image", "filemime": "image/jpeg", "search": "Amazon river aerial meander"},
    {"id": "lib-bio-varzea", "title": "Bosque inundable de várzea", "category": "Biología",
     "kind": "image", "filemime": "image/jpeg", "search": "varzea flooded forest Amazon"},
    {"id": "lib-bio-guacamayo", "title": "Guacamayo escarlata (Ara macao)", "category": "Biología",
     "kind": "image", "filemime": "image/jpeg", "search": "Ara macao scarlet macaw"},
    {"id": "lib-bio-victoria", "title": "Victoria amazonica en el agua", "category": "Biología",
     "kind": "image", "filemime": "image/jpeg", "search": "Victoria amazonica giant water lily"},

    # Programación
    {"id": "lib-go-gopher", "title": "Mascota del lenguaje Go", "category": "Programación",
     "kind": "image", "filemime": "image/png", "search": "Go gopher mascot"},

    # Teología
    {"id": "lib-tg-codice", "title": "Folio del Códice Sinaítico", "category": "Teología",
     "kind": "image", "filemime": "image/jpeg", "search": "Codex Sinaiticus folio manuscript"},
    {"id": "lib-tg-concilio", "title": "Representación del Concilio de Nicea", "category": "Teología",
     "kind": "image", "filemime": "image/jpeg", "search": "First Council of Nicaea icon"},
    {"id": "lib-tg-aquino", "title": "Retrato de Tomás de Aquino", "category": "Teología",
     "kind": "image", "filemime": "image/jpeg", "search": "Thomas Aquinas painting"},
    {"id": "lib-tg-mision", "title": "Ruinas de una misión jesuítica", "category": "Teología",
     "kind": "image", "filemime": "image/jpeg", "search": "iglesia mision jesuitica Amazonas"},

    # Lecturas escritas para el curso
    {"id": "lib-sd-guia", "title": "Guía de laboratorio: sincronización oportunista", "category": "Sistemas Distribuidos",
     "kind": "text", "filename": "guia-laboratorio-dtn.md", "body": """
# Guía de laboratorio: sincronización oportunista

## Objetivo

Medir cuántas transacciones alcanza a transferir un nodo de borde cuando la
ventana de conectividad es corta e impredecible, que es el caso real de la
Amazonía cuando el enlace satelital solo está disponible unas horas al día.

## Materiales

- Un servidor de borde (Raspberry Pi 4 o equivalente) con RADIX instalado.
- Un portátil que actúe como servidor central.
- Un router configurado para cortar el enlace a voluntad.

## Procedimiento

1. Generar actividad en el nodo de borde sin conectividad: subir tres archivos
   a la biblioteca, crear una lección y resolver dos cuestionarios.
2. Revisar la cola DTN en el Monitor del servidor. Anotar el número de
   transacciones pendientes.
3. Habilitar el enlace durante 30 segundos y forzar la sincronización.
4. Cortar el enlace de nuevo a mitad de la transferencia.
5. Repetir los pasos 3 y 4 tres veces, anotando cuántas transacciones quedan
   pendientes después de cada ventana.

## Cuestiones para el informe

- ¿La cola disminuye de forma lineal con el tiempo de conexión disponible?
- ¿Qué ocurre si el corte sucede justo después de enviar una transacción pero
  antes de recibir la confirmación? ¿Se pierde o se duplica?
- Proponer una política de orden de envío distinta a FIFO y justificarla con
  los datos medidos.

## Entrega

Un informe de dos páginas con la tabla de mediciones y las conclusiones.
"""},
    {"id": "lib-rd-subneteo", "title": "Chuleta de subneteo IPv4", "category": "Redes",
     "kind": "text", "filename": "chuleta-subneteo-ipv4.md", "body": """
# Chuleta de subneteo IPv4

## Máscaras más usadas

| Prefijo | Máscara | Hosts útiles | Uso típico |
|---|---|---|---|
| /24 | 255.255.255.0 | 254 | Laboratorio o aula completa |
| /25 | 255.255.255.128 | 126 | Media aula |
| /26 | 255.255.255.192 | 62 | Sala de servidores |
| /27 | 255.255.255.224 | 30 | Grupo de equipos de red |
| /28 | 255.255.255.240 | 14 | Enlace entre edificios |
| /30 | 255.255.255.252 | 2 | Enlace punto a punto |

## Fórmulas

- Hosts útiles = 2^(32 - prefijo) - 2 (se descuentan red y broadcast).
- Subredes obtenidas al pedir prestados n bits = 2^n.
- Salto entre subredes = 256 - último octeto de la máscara.

## Ejemplo resuelto

Dada la red 192.168.10.0/24, se necesitan cuatro subredes del mismo tamaño.

1. Se piden prestados 2 bits: 2^2 = 4 subredes. Nuevo prefijo: /26.
2. Salto = 256 - 192 = 64.
3. Subredes: 192.168.10.0, .64, .128 y .192, todas con máscara /26.
4. Rango útil de la segunda: 192.168.10.65 a 192.168.10.126,
   broadcast 192.168.10.127.

## Error frecuente

Asignar la dirección de red o la de broadcast a un equipo. La primera y la
última dirección de cada subred no se usan para hosts.
"""},
    {"id": "lib-bd-sql", "title": "Repertorio de consultas SQL", "category": "Bases de Datos",
     "kind": "text", "filename": "repertorio-consultas-sql.md", "body": """
# Repertorio de consultas SQL

Esquema de referencia: `estudiante`, `curso`, `matricula`, `nota`.

```sql
-- 1. Selección con filtro y orden
SELECT nombre, correo
FROM estudiante
WHERE activo = 1
ORDER BY nombre;

-- 2. Conteo agrupado: cuántos matriculados tiene cada curso
SELECT c.titulo, COUNT(m.estudiante_id) AS matriculados
FROM curso c
LEFT JOIN matricula m ON m.curso_id = c.id
GROUP BY c.id, c.titulo
ORDER BY matriculados DESC;

-- 3. Promedio por estudiante, mostrando solo los aprobados
SELECT e.nombre, AVG(n.valor) AS promedio
FROM estudiante e
JOIN nota n ON n.estudiante_id = e.id
GROUP BY e.id, e.nombre
HAVING AVG(n.valor) >= 14
ORDER BY promedio DESC;

-- 4. Subconsulta: estudiantes sin ninguna nota registrada
SELECT nombre
FROM estudiante
WHERE id NOT IN (SELECT DISTINCT estudiante_id FROM nota);

-- 5. Transacción: mover una matrícula de un curso a otro sin dejar
-- estados intermedios visibles
BEGIN;
DELETE FROM matricula WHERE estudiante_id = 'e1' AND curso_id = 'c1';
INSERT INTO matricula (estudiante_id, curso_id) VALUES ('e1', 'c2');
COMMIT;
```
"""},
    {"id": "lib-mt-verdad", "title": "Tablas de verdad y equivalencias", "category": "Matemática",
     "kind": "text", "filename": "tablas-de-verdad.md", "body": """
# Tablas de verdad y equivalencias lógicas

## Conectivos básicos

| p | q | ¬p | p ∧ q | p ∨ q | p → q | p ↔ q |
|---|---|---|---|---|---|---|
| V | V | F | V | V | V | V |
| V | F | F | F | V | F | F |
| F | V | V | F | V | V | F |
| F | F | V | F | F | V | V |

La fila que más confunde es la tercera: si el antecedente es falso, la
implicación es verdadera sin importar el consecuente.

## Equivalencias que conviene memorizar

- Doble negación: ¬(¬p) ≡ p
- De Morgan: ¬(p ∧ q) ≡ ¬p ∨ ¬q y ¬(p ∨ q) ≡ ¬p ∧ ¬q
- Implicación como disyunción: p → q ≡ ¬p ∨ q
- Contrapositiva: p → q ≡ ¬q → ¬p
- Distributiva: p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r)

## Ejercicio guiado

Demostrar que ¬(p → q) ≡ p ∧ ¬q.

1. p → q ≡ ¬p ∨ q (implicación como disyunción).
2. ¬(¬p ∨ q) ≡ ¬(¬p) ∧ ¬q (De Morgan).
3. ¬(¬p) ∧ ¬q ≡ p ∧ ¬q (doble negación).
"""},
    {"id": "lib-go-chuleta", "title": "Chuleta de Go para el servidor RADIX", "category": "Programación",
     "kind": "text", "filename": "chuleta-go.md", "body": """
# Chuleta de Go

## Declaraciones

```go
var contador int           // valor cero: 0
nombre := "RADIX"          // tipo inferido: string
const MaxIntentos = 3
```

## Structs y métodos

```go
type Leccion struct {
    ID     string
    Titulo string
}

func (l Leccion) Resumen() string {
    return l.ID + ": " + l.Titulo
}
```

El receptor por valor copia la estructura; si el método debe modificarla, se
declara con receptor por puntero `func (l *Leccion) ...`.

## Errores

```go
contenido, err := os.ReadFile(ruta)
if err != nil {
    return fmt.Errorf("leer %s: %w", ruta, err)
}
```

Go no tiene excepciones: el error es un valor de retorno más y se revisa
inmediatamente. `%w` conserva el error original para poder consultarlo
después con `errors.Is`.

## Concurrencia

```go
resultados := make(chan int)

go func() {
    resultados <- calcular()   // se ejecuta en otra goroutine
}()

valor := <-resultados          // bloquea hasta que haya dato
```

Regla práctica: el canal se cierra donde se escribe, nunca donde se lee.

## Pruebas

```go
func TestResumen(t *testing.T) {
    l := Leccion{ID: "les-01", Titulo: "Intro"}
    if got := l.Resumen(); got != "les-01: Intro" {
        t.Fatalf("resumen inesperado: %s", got)
    }
}
```
"""},
    {"id": "lib-tg-glosario", "title": "Glosario de términos teológicos", "category": "Teología",
     "kind": "text", "filename": "glosario-teologico.md", "body": """
# Glosario de términos teológicos

Términos que aparecen a lo largo de la asignatura. Se dan en el sentido técnico
que tienen en teología académica, que a veces no coincide con el uso corriente.

**Apologética.** Disciplina que expone razones a favor de una posición
religiosa frente a objeciones. No es lo mismo que teología: la apologética
argumenta hacia afuera, la teología examina hacia adentro.

**Canon.** Lista de libros que una comunidad reconoce como Escritura. El canon
hebreo, el católico y el protestante no coinciden exactamente, y las
diferencias tienen historia documentada.

**Dogma.** Enunciado que una tradición declara vinculante para su fe. En
sentido académico interesa cómo se formuló y en qué contexto, no solo su
contenido.

**Escatología.** Tratado sobre las realidades últimas: muerte, juicio,
esperanza final.

**Exégesis.** Análisis de un texto para establecer qué dice y qué quiso decir
su autor en su contexto. Se distingue de la **hermenéutica**, que estudia los
principios de interpretación en general.

**Hermenéutica.** Teoría de la interpretación. Se ocupa de la distancia entre
el mundo del texto y el del lector.

**Kerigma.** El anuncio central y breve de la predicación cristiana primitiva,
anterior a cualquier sistematización doctrinal.

**Magisterio.** En la tradición católica, la función de enseñanza autorizada.
Otras tradiciones resuelven la autoridad doctrinal de otra manera: por
confesiones de fe, por sínodos o por consenso de la comunidad.

**Patrística.** Estudio de los autores cristianos de los primeros siglos, los
llamados Padres de la Iglesia.

**Revelación.** Categoría con la que una tradición describe el darse a conocer
de Dios. Las tradiciones difieren en si se concibe sobre todo como comunicación
de verdades o como acontecimiento histórico interpretado.

**Sincretismo.** Fusión de elementos de tradiciones religiosas distintas. El
término se usa a veces de forma peyorativa; en estudios de religión se emplea
descriptivamente y conviene aclarar en qué sentido se usa.

**Soteriología.** Tratado sobre la salvación.

**Teodicea.** Discusión del problema del mal: cómo se sostiene la afirmación de
un Dios bueno y poderoso frente al sufrimiento observable.

**Teología natural.** Aquello que se pretende alcanzar sobre Dios por la sola
razón, sin apelar a la revelación. Su alcance es discutido dentro de las
propias tradiciones.
"""},

    # Los videojuegos HTML se descubren automáticamente de seeds/games/
    # al construir el zip — la lección les-go-04 referencia [[lib-game-la-culebrita]].
]

# --- asignaturas ------------------------------------------------------------

COURSES = [
    {
        "id": "c-sisdis",
        "title": "Sistemas Distribuidos",
        "category": "Sistemas",
        "description": "Cómo varias computadoras que no comparten memoria ni reloj logran comportarse como un solo sistema. El curso usa el propio servidor de borde de RADIX como caso de estudio permanente.",
        "lessons": [
            {
                "id": "les-sd-01",
                "title": "Qué es un sistema distribuido",
                "video": "qué es un sistema distribuido explicación",
                "content": """
## De un programa a muchos

Un sistema distribuido es un conjunto de computadoras independientes que se
presentan ante el usuario como una sola máquina. La definición parece
inofensiva, pero esconde el problema central del curso: esas computadoras no
comparten memoria, no comparten reloj y se comunican por una red que puede
perder mensajes o retrasarlos sin avisar.

[[lib-sd-arquitectura]]

## Por qué distribuir

- **Compartir recursos.** Un solo servidor guarda los materiales y muchos
  estudiantes los consultan.
- **Tolerancia a fallos.** Si una máquina se apaga, otras siguen atendiendo.
- **Escalabilidad.** Se agregan nodos en lugar de comprar una máquina enorme.
- **Cercanía geográfica.** Es lo que hace RADIX: el servidor está en la
  comunidad, no a mil kilómetros.

## Las transparencias

Un buen diseño distribuido oculta detalles al usuario. Las que más se citan:

| Transparencia | Qué esconde |
|---|---|
| Acceso | Diferencias de representación de datos entre máquinas |
| Ubicación | Dónde está físicamente el recurso |
| Replicación | Que existen varias copias del mismo dato |
| Fallos | Que un componente se cayó y se reintentó la operación |

Ninguna es gratis: cuanta más transparencia se ofrece, más coordinación hace
falta por debajo.

## Arquitecturas frecuentes

El modelo cliente-servidor concentra la lógica en un nodo que atiende
peticiones. El modelo entre pares reparte el trabajo entre nodos equivalentes.
RADIX es cliente-servidor dentro de la comunidad y algo parecido a un par
frente al servidor central: sincroniza cuando puede, no cuando le ordenan.

{video}

## Actividad

Describir la red de la institución y clasificar cada elemento según el modelo
que sigue. Indicar qué transparencias se cumplen y cuáles no.
""",
                "quiz": {
                    "id": "qz-sd-01", "title": "Control: sistemas distribuidos", "value": 20,
                    "description": "Tres preguntas sobre la lección [[les-sd-01]] y el esquema [[lib-sd-arquitectura]].",
                    "questions": [
                        ("¿Cuál de estas características define a un sistema distribuido?",
                         ["Los nodos comparten la misma memoria física",
                          "Los nodos son independientes y se coordinan por red",
                          "Todos los nodos ejecutan el mismo proceso a la vez",
                          "Existe un reloj físico común a todos los nodos"], 1),
                        ("La transparencia de ubicación consiste en:",
                         ["Cifrar la comunicación entre nodos",
                          "Ocultar al usuario en qué máquina está el recurso",
                          "Mostrar siempre la dirección IP del servidor",
                          "Guardar copias del recurso en todos los nodos"], 1),
                        ("¿Por qué el modelo cliente-servidor resulta adecuado para el servidor de borde de RADIX?",
                         ["Porque elimina la necesidad de red",
                          "Porque concentra el contenido en un nodo cercano que atiende a los estudiantes",
                          "Porque garantiza que nunca habrá fallos",
                          "Porque obliga a mantener el enlace a internet siempre activo"], 1),
                    ],
                },
            },
            {
                "id": "les-sd-02",
                "title": "Comunicación entre procesos: mensajes y RPC",
                "video": "llamada a procedimiento remoto RPC explicación",
                "content": """
## El único recurso compartido es la red

Dos procesos en máquinas distintas solo pueden coordinarse enviándose
mensajes. Todo lo demás (llamadas remotas, colas, APIs REST) se construye
encima de esa primitiva.

## Paso de mensajes

La forma más básica distingue dos operaciones: `send` y `receive`. Las
variantes importan:

- **Síncrono:** quien envía espera a que el otro reciba. Simple de razonar,
  fácil de bloquear.
- **Asíncrono:** quien envía continúa; el mensaje queda en camino o en una
  cola intermedia. Es lo que necesita un enlace intermitente.
- **Persistente:** el mensaje sobrevive aunque el destinatario esté apagado.
  La cola DTN de RADIX es exactamente esto.

## Llamada a procedimiento remoto

La RPC hace que invocar código en otra máquina se parezca a llamar una
función local. El cliente llama a un *stub* que serializa los argumentos
(*marshalling*), envía la petición, espera y devuelve el resultado.

La ilusión se rompe en tres puntos concretos, y conviene tenerlos presentes:

1. **Fallos parciales.** Si no llega respuesta, no se sabe si la operación se
   ejecutó o no. Una función local nunca tiene esa duda.
2. **Latencia.** Una llamada local cuesta nanosegundos; una remota, decenas de
   milisegundos o segundos.
3. **Punteros.** No se pueden pasar referencias a memoria que la otra máquina
   no ve.

## Semánticas de entrega

| Semántica | Garantía | Cuándo se usa |
|---|---|---|
| Al menos una vez | Puede repetir la operación | Operaciones idempotentes |
| A lo más una vez | Nunca repite, puede perderse | Cuando repetir es peor que fallar |
| Exactamente una vez | Ideal, costosa | Requiere identificadores y registro de lo aplicado |

La API de RADIX es REST sobre HTTP, o sea paso de mensajes con petición y
respuesta. Repasa el modelo general en [[les-sd-01]] antes de seguir.

{video}

## Actividad

Elegir tres operaciones de la API del servidor y decidir qué semántica de
entrega necesita cada una. Justificar en dos líneas por operación.
""",
                "quiz": {
                    "id": "qz-sd-02", "title": "Control: comunicación y RPC", "value": 20,
                    "description": "Preguntas sobre la lección [[les-sd-02]].",
                    "questions": [
                        ("¿Qué hace el stub del cliente en una llamada RPC?",
                         ["Ejecuta el procedimiento localmente",
                          "Serializa los argumentos y envía la petición al servidor",
                          "Cifra el disco del cliente",
                          "Sincroniza los relojes de ambas máquinas"], 1),
                        ("Un fallo parcial en RPC ocurre cuando:",
                         ["El cliente pasa un argumento de tipo incorrecto",
                          "No llega respuesta y no se sabe si la operación se ejecutó",
                          "El servidor devuelve un error de validación",
                          "La función remota tarda menos de lo esperado"], 1),
                        ("Para un enlace que solo está disponible unas horas al día, la comunicación adecuada es:",
                         ["Síncrona y sin colas",
                          "Asíncrona y persistente",
                          "Síncrona con reintento inmediato",
                          "Sin mensajes, usando memoria compartida"], 1),
                    ],
                },
            },
            {
                "id": "les-sd-03",
                "title": "Tiempo y orden: relojes lógicos",
                "video": "relojes lógicos de Lamport ejemplo",
                "content": """
## El problema del reloj

Cada máquina tiene su propio reloj y todos derivan. Dos nodos pueden fechar
dos eventos con marcas que contradicen el orden real en que ocurrieron. En un
sistema distribuido casi nunca hace falta saber la hora exacta: lo que hace
falta es saber **qué pasó antes que qué**.

[[lib-sd-relojes]]

## La relación "ocurre antes"

Se escribe `a → b` y se cumple en tres casos:

1. `a` y `b` son del mismo proceso y `a` sucede primero.
2. `a` es el envío de un mensaje y `b` su recepción.
3. Por transitividad: si `a → b` y `b → c`, entonces `a → c`.

Si no se cumple ni `a → b` ni `b → a`, los eventos son **concurrentes**. No es
un error: significa que ningún orden entre ellos es observable, y por lo tanto
cualquiera de los dos órdenes es válido.

## Relojes de Lamport

Cada proceso mantiene un contador `C`:

- Antes de un evento local: `C = C + 1`.
- Al enviar un mensaje, se adjunta `C`.
- Al recibir con marca `T`: `C = max(C, T) + 1`.

Se cumple que si `a → b` entonces `C(a) < C(b)`. Lo inverso no vale: una marca
menor no demuestra precedencia. Para eso hacen falta relojes vectoriales, que
guardan un contador por proceso y sí permiten detectar concurrencia.

## Por qué importa aquí

Cuando dos nodos de borde sincronizan con el servidor central, hay que decidir
qué versión de un dato gana. Ordenar por hora del reloj de pared es frágil:
basta un reloj mal ajustado para descartar el trabajo más reciente. Con
relojes lógicos el criterio no depende de la hora.

{video}

## Actividad

Dados tres procesos y seis eventos con dos mensajes cruzados, calcular las
marcas de Lamport y señalar qué pares de eventos son concurrentes. La guía
[[lib-sd-guia]] incluye un caso resuelto parecido.
""",
                "quiz": {
                    "id": "qz-sd-03", "title": "Control: relojes lógicos", "value": 20,
                    "description": "Preguntas sobre la lección [[les-sd-03]] y el diagrama [[lib-sd-relojes]].",
                    "questions": [
                        ("Al recibir un mensaje con marca T, un reloj de Lamport se actualiza como:",
                         ["C = T", "C = C + T", "C = max(C, T) + 1", "C = min(C, T)"], 2),
                        ("Si C(a) < C(b) con relojes de Lamport, entonces:",
                         ["Necesariamente a ocurrió antes que b",
                          "No se puede concluir que a ocurrió antes que b",
                          "a y b son siempre concurrentes",
                          "b ocurrió antes que a"], 1),
                        ("Dos eventos son concurrentes cuando:",
                         ["Ocurren exactamente en el mismo milisegundo",
                          "No existe relación de precedencia entre ellos en ninguno de los dos sentidos",
                          "Pertenecen al mismo proceso",
                          "Tienen la misma marca de reloj físico"], 1),
                    ],
                },
            },
            {
                "id": "les-sd-04",
                "title": "Redes tolerantes a retardos y sincronización oportunista",
                "video": "delay tolerant network DTN store and forward",
                "content": """
## Cuando la conexión es la excepción

Internet supone que existe un camino completo entre origen y destino en el
momento del envío. En la Amazonía esa suposición no se cumple: el enlace
aparece unas horas, con latencia alta y cortes frecuentes. Las **redes
tolerantes a retardos** (DTN) se diseñaron para ese escenario.

[[lib-sd-p2p]]

## Almacenar, llevar y reenviar

La idea central es `store, carry and forward`: cada nodo guarda el mensaje en
almacenamiento persistente y lo retiene hasta que aparece una oportunidad de
entrega. El mensaje puede esperar horas. No hay conexión extremo a extremo,
solo saltos que se completan cuando se puede.

Consecuencias de diseño:

- El nodo necesita **disco**, no solo memoria: si se apaga, la cola sobrevive.
- Hace falta **custodia**: quien recibe confirma antes de que el emisor borre.
- El orden de envío es una **política**, no un detalle: con ventanas cortas se
  transmite primero lo más valioso.

## La cola de RADIX

El servidor de borde registra cada transacción local (una subida a la
biblioteca, un cuestionario resuelto) en una cola que se ve en el Monitor.
Cuando hay enlace, se drena; si el corte llega a mitad de camino, lo pendiente
sigue pendiente y se reintenta. El estudiante nunca espera por la red: trabaja
sin conexión y la sincronización pasa después, en segundo plano.

## Conflictos

Si dos nodos modifican el mismo dato sin verse, al sincronizar hay conflicto.
Las estrategias habituales son última escritura gana (con el riesgo de reloj
que vimos en [[les-sd-03]]), fusión automática con estructuras diseñadas para
converger, o resolución manual. Elegir mal aquí se paga con datos perdidos y
sin rastro.

{video}

## Actividad

Realizar el laboratorio de [[lib-sd-guia]] y responder si la cola disminuye de
forma lineal con el tiempo de conexión disponible.
""",
                "quiz": {
                    "id": "qz-sd-04", "title": "Control: DTN", "value": 20,
                    "description": "Preguntas sobre la lección [[les-sd-04]] y la guía [[lib-sd-guia]].",
                    "questions": [
                        ("El principio de operación de una red tolerante a retardos es:",
                         ["Descartar el mensaje si no hay ruta disponible",
                          "Almacenar, llevar y reenviar cuando aparezca la oportunidad",
                          "Mantener siempre una conexión extremo a extremo",
                          "Enviar el mensaje por todos los caminos a la vez"], 1),
                        ("¿Por qué la cola de sincronización debe guardarse en disco y no solo en memoria?",
                         ["Para que ocupe menos espacio",
                          "Para que las transacciones pendientes sobrevivan a un apagón o reinicio",
                          "Porque el disco es más rápido que la memoria",
                          "Para poder cifrarla con menos costo"], 1),
                        ("Un conflicto de sincronización aparece cuando:",
                         ["Dos nodos leen el mismo dato al mismo tiempo",
                          "Dos nodos modifican el mismo dato mientras están incomunicados",
                          "El enlace tiene latencia alta",
                          "La cola está vacía al momento de sincronizar"], 1),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-sisdis", "title": "Examen final: Sistemas Distribuidos", "value": 100,
            "description": "Evaluación integradora de las cuatro lecciones. Material permitido: [[lib-sd-guia]].",
            "questions": [
                ("¿Cuál es la diferencia esencial entre un sistema distribuido y un sistema paralelo con memoria compartida?",
                 ["El número de procesadores",
                  "La ausencia de memoria y reloj comunes, que obliga a coordinar por mensajes",
                  "El lenguaje de programación utilizado",
                  "La velocidad del disco"], 1),
                ("Una operación idempotente permite usar la semántica:",
                 ["A lo más una vez", "Al menos una vez, porque repetirla no cambia el resultado",
                  "Ninguna semántica de entrega", "Solo exactamente una vez"], 1),
                ("Los relojes vectoriales aportan sobre los de Lamport la capacidad de:",
                 ["Sincronizar la hora real de los nodos",
                  "Detectar si dos eventos son concurrentes",
                  "Reducir el tamaño de los mensajes",
                  "Eliminar los fallos parciales"], 1),
                ("En una ventana de conectividad de 30 segundos, ¿qué política de cola conviene más?",
                 ["FIFO estricto siempre",
                  "Enviar primero las transacciones más valiosas o pequeñas para aprovechar la ventana",
                  "Enviar primero los archivos más grandes",
                  "Esperar a que la ventana sea más larga"], 1),
                ("Resolver conflictos con 'la última escritura gana' basándose en el reloj de pared es riesgoso porque:",
                 ["Consume demasiada CPU",
                  "Un reloj desajustado puede descartar el cambio realmente más reciente",
                  "No funciona con bases de datos relacionales",
                  "Obliga a usar RPC síncrono"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-sd-1", "author": "est-02", "created": "2026-03-18T15:12:00Z",
                "title": "¿La cola DTN puede duplicar una transacción?",
                "body": """
Estuve haciendo el laboratorio de [[lib-sd-guia]] y me quedó una duda. Si el
enlace se corta justo después de que el nodo envía una transacción pero antes
de recibir la confirmación, cuando vuelve la conexión la reenvía. ¿No se
aplicaría dos veces en el servidor central?
""",
                "likes": ["est-01", "est-05", "est-09"],
                "replies": [
                    {
                        "id": "fp-sd-1r1", "author": "doc-vasquez", "created": "2026-03-18T18:40:00Z",
                        "body": """
Muy buena observación, es justo el punto donde la semántica de entrega deja de
ser teoría. Con "al menos una vez" el reenvío ocurre, sí. La duplicación se
evita del otro lado: si la operación es idempotente (por ejemplo fijar una
nota a un valor concreto) aplicarla dos veces da el mismo resultado. Si no lo
es (sumar puntos), hace falta un identificador de transacción y un registro de
lo ya aplicado. Repasen la tabla de [[les-sd-02]].
""",
                        "likes": ["est-02", "est-03", "est-07", "est-11"],
                    },
                    {
                        "id": "fp-sd-1r2", "author": "est-05", "created": "2026-03-19T09:05:00Z",
                        "body": """
Lo probé cortando el cable a mitad de la sincronización tres veces seguidas.
La cola bajó de 7 a 4 y a 2, y ninguna transacción apareció repetida en el
listado. Igual voy a anotar en el informe que no pude comprobar qué pasa si el
corte cae exactamente entre el envío y la confirmación, porque no logré
reproducir ese instante.
""",
                        "likes": ["doc-vasquez", "est-02"],
                    },
                ],
            },
            {
                "id": "fp-sd-2", "author": "doc-vasquez", "created": "2026-04-06T11:00:00Z",
                "title": "Entrega del informe de relojes lógicos",
                "body": """
Recordatorio: el ejercicio de marcas de Lamport se entrega el viernes. Deben
incluir el diagrama con los seis eventos y señalar explícitamente los pares
concurrentes. El cuestionario [[qz-sd-03]] les sirve de autoevaluación previa.

Un error que vi repetido el semestre pasado: concluir que si una marca es
menor entonces el evento ocurrió antes. Eso no se sostiene, revisen por qué.
""",
                "likes": ["est-01", "est-04", "est-06", "est-08", "est-12"],
                "replies": [
                    {
                        "id": "fp-sd-2r1", "author": "est-08", "created": "2026-04-06T20:22:00Z",
                        "body": """
Profesora, ¿el diagrama puede ir escaneado a mano? No tengo herramienta para
dibujarlo en la máquina del laboratorio y prefiero no perder tiempo peleando
con eso.
""",
                        "likes": ["est-10"],
                    },
                    {
                        "id": "fp-sd-2r2", "author": "doc-vasquez", "created": "2026-04-07T07:15:00Z",
                        "body": """
Sí, a mano está bien siempre que se lea con claridad. Lo que evalúo es el
razonamiento, no la prolijidad del dibujo.
""",
                        "likes": ["est-08", "est-10", "est-03"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-robotica",
        "title": "Robótica",
        "category": "Robótica",
        "description": "Del actuador al comportamiento: cinemática, sensores, control de motores y percepción básica, con prácticas sobre hardware de bajo costo alimentado por el servidor de borde.",
        "lessons": [
            {
                "id": "les-rb-01",
                "title": "Anatomía de un robot y cinemática directa",
                "video": "cinemática directa brazo robótico explicación",
                "content": """
## Qué cuenta como robot

Un robot combina tres cosas: **sensores** que miden el entorno, **actuadores**
que lo modifican y un **controlador** que decide. Si falta el sensor, es una
máquina automática; si falta el actuador, es un instrumento de medición.

[[lib-rb-brazo]]

## Grados de libertad

Cada articulación aporta un grado de libertad. Un brazo con tres
articulaciones rotacionales tiene tres grados y puede alcanzar posiciones
dentro de un volumen llamado espacio de trabajo. Para ubicar y orientar
libremente un objeto en el espacio hacen falta seis.

| Articulación | Movimiento | Ejemplo |
|---|---|---|
| Rotacional | Giro sobre un eje | Codo, hombro |
| Prismática | Desplazamiento lineal | Riel de una impresora 3D |
| Esférica | Giro en varios ejes | Muñeca compuesta |

## Cinemática directa

Consiste en calcular dónde queda el extremo del brazo dados los ángulos de las
articulaciones. Para un brazo plano de dos eslabones de longitudes `L1` y `L2`
con ángulos `θ1` y `θ2`:

```
x = L1·cos(θ1) + L2·cos(θ1 + θ2)
y = L1·sin(θ1) + L2·sin(θ1 + θ2)
```

Tiene solución única: unos ángulos dados producen exactamente una posición. El
problema inverso (qué ángulos hacen falta para llegar a un punto) puede tener
dos soluciones, infinitas o ninguna, y es bastante más difícil.

{video}

## Actividad

Con `L1 = 12 cm` y `L2 = 9 cm`, calcular la posición del extremo para
(θ1, θ2) = (30°, 45°) y luego para (75°, -20°). Dibujar el espacio de trabajo
aproximado.
""",
                "quiz": {
                    "id": "qz-rb-01", "title": "Control: cinemática directa", "value": 20,
                    "description": "Preguntas sobre la lección [[les-rb-01]].",
                    "questions": [
                        ("La cinemática directa calcula:",
                         ["Los ángulos necesarios para alcanzar un punto",
                          "La posición del extremo a partir de los ángulos de las articulaciones",
                          "La fuerza que ejerce cada motor",
                          "El consumo eléctrico del robot"], 1),
                        ("¿Cuántos grados de libertad hacen falta para posicionar y orientar libremente un objeto en el espacio?",
                         ["Tres", "Cuatro", "Seis", "Ocho"], 2),
                        ("Una articulación prismática produce:",
                         ["Un giro sobre un eje", "Un desplazamiento lineal",
                          "Un giro en varios ejes simultáneos", "Una vibración controlada"], 1),
                    ],
                },
            },
            {
                "id": "les-rb-02",
                "title": "Sensores: medir el mundo con error",
                "video": "sensor ultrasónico HC-SR04 funcionamiento",
                "content": """
## Ningún sensor dice la verdad

Todo sensor entrega un valor con error. El trabajo no es conseguir la medida
perfecta, es saber cuánto se le puede creer. Tres conceptos que no conviene
confundir:

- **Exactitud:** qué tan cerca está la medida del valor real.
- **Precisión:** qué tan repetible es la medida.
- **Resolución:** el cambio más pequeño que el sensor distingue.

Un sensor puede ser muy preciso y muy inexacto a la vez: repite siempre el
mismo valor equivocado. Eso se corrige con **calibración**.

[[lib-rb-sensor]]

## Sensor ultrasónico

Emite un pulso de sonido y mide el tiempo hasta el eco. Con la velocidad del
sonido en aire (aproximadamente 343 m/s a 20 °C):

```
distancia = (tiempo_de_vuelo × 343) / 2
```

Se divide entre dos porque el sonido va y vuelve. Falla con superficies
blandas (absorben el eco) y con superficies inclinadas (lo desvían). Y la
velocidad del sonido depende de la temperatura, así que en la selva a 32 °C la
medición se corre si se usa el valor de tabla sin corregir.

## Filtrar el ruido

La lectura cruda oscila. Dos filtros baratos y suficientes en la mayoría de
prácticas:

1. **Media móvil:** promediar las últimas N lecturas. Suaviza, pero retrasa la
   respuesta.
2. **Mediana:** ordenar las últimas N y tomar la del medio. Elimina los picos
   sueltos mucho mejor que el promedio.

## Actividad

Medir diez veces la misma distancia con el sensor y calcular media y
desviación. Repetir apuntando a una tela y comparar los resultados.
""",
                "quiz": {
                    "id": "qz-rb-02", "title": "Control: sensores", "value": 20,
                    "description": "Preguntas sobre la lección [[les-rb-02]] y el sensor de [[lib-rb-sensor]].",
                    "questions": [
                        ("Un sensor que siempre devuelve el mismo valor equivocado es:",
                         ["Exacto pero impreciso", "Preciso pero inexacto",
                          "Exacto y preciso", "De baja resolución"], 1),
                        ("En el cálculo de distancia por ultrasonido se divide entre dos porque:",
                         ["El sensor usa dos transductores",
                          "El sonido recorre el camino de ida y de vuelta",
                          "La velocidad del sonido se mide en medias unidades",
                          "Se descartan la mitad de las lecturas"], 1),
                        ("Para eliminar picos aislados en una lectura ruidosa conviene:",
                         ["Un filtro de media móvil", "Un filtro de mediana",
                          "Aumentar la frecuencia de muestreo", "Bajar la resolución del sensor"], 1),
                    ],
                },
            },
            {
                "id": "les-rb-03",
                "title": "Actuadores y control por PWM",
                "video": "PWM servomotor control ancho de pulso",
                "content": """
## Modulación por ancho de pulso

Un microcontrolador solo puede poner una salida en alto o en bajo. Para
entregar "medio voltaje" se conmuta rápido entre ambos estados y se varía la
proporción de tiempo en alto: eso es PWM. El **ciclo de trabajo** es ese
porcentaje.

En un motor de corriente continua, más ciclo de trabajo significa más
velocidad. La ventaja frente a bajar el voltaje con una resistencia es que el
transistor conmuta casi sin disipar calor.

[[lib-rb-servo]]

## Servomotores

Un servo de modelismo no interpreta el ciclo de trabajo como velocidad, sino
el **ancho del pulso** como posición angular. La convención habitual, con una
señal de 50 Hz (periodo de 20 ms):

| Ancho del pulso | Ángulo aproximado |
|---|---|
| 1,0 ms | 0° |
| 1,5 ms | 90° (centro) |
| 2,0 ms | 180° |

El servo compara la posición ordenada con la que mide su potenciómetro interno
y corrige solo. Es un lazo cerrado dentro del propio actuador.

## Varios servos a la vez

Generar seis o doce señales PWM estables desde el programa principal es
incómodo y consume tiempo de CPU. Se resuelve con un controlador dedicado como
el PCA9685, que recibe órdenes por I2C y mantiene los pulsos por hardware.

Una advertencia práctica: estos módulos rara vez trabajan exactamente a la
frecuencia nominal. Conviene medir la señal real y ajustar el factor de
corrección, porque un 4 % de error en la frecuencia mueve todos los ángulos.
Y la alimentación de los servos va aparte de la del controlador: el pico de
corriente al arrancar reinicia la placa.

{video}

## Actividad

Programar un barrido de 0° a 180° en pasos de 15° con una espera de 300 ms,
medir el ángulo real con un transportador y anotar la diferencia. Ver también
[[les-rb-01]] para relacionar ángulo con posición del extremo.
""",
                "quiz": {
                    "id": "qz-rb-03", "title": "Control: PWM y servos", "value": 20,
                    "description": "Preguntas sobre la lección [[les-rb-03]] y la imagen [[lib-rb-servo]].",
                    "questions": [
                        ("En un servo de modelismo, la posición angular se determina por:",
                         ["El voltaje de alimentación", "El ancho del pulso de la señal",
                          "La frecuencia de la señal", "La corriente consumida"], 1),
                        ("Un ciclo de trabajo del 25 % en un motor de corriente continua significa:",
                         ["Que la señal está en alto una cuarta parte del periodo",
                          "Que el motor gira a un cuarto de vuelta",
                          "Que se usa un cuarto de los pines disponibles",
                          "Que el voltaje se reduce con una resistencia"], 0),
                        ("¿Por qué se alimenta el banco de servos con una fuente separada del controlador?",
                         ["Para reducir el costo del montaje",
                          "Porque el pico de corriente de los servos puede reiniciar el controlador",
                          "Porque los servos requieren corriente alterna",
                          "Para poder usar cables más delgados"], 1),
                    ],
                },
            },
            {
                "id": "les-rb-04",
                "title": "Percepción visual básica",
                "video": "visión artificial umbralización detección de color OpenCV",
                "content": """
## Una imagen es una matriz

Una imagen digital es una matriz de píxeles. En escala de grises cada valor va
de 0 a 255; en color hay tres canales. El primer paso de casi cualquier
tratamiento es reducir la información hasta quedarse solo con lo que importa.

[[lib-rb-video]]

## Umbralización

Convertir a blanco y negro con un umbral `T`: si el valor del píxel supera `T`
se marca como objeto, si no como fondo. Simple y sorprendentemente útil cuando
la iluminación es estable. Cuando no lo es, un umbral fijo falla y hay que
calcularlo por regiones o con un método automático como el de Otsu.

## Detección por color

Para seguir un objeto de color conviene pasar de RGB a HSV, porque separa el
tono de la intensidad. Así una sombra sobre el objeto cambia el valor pero no
el tono, y el rango de detección sigue funcionando. En RGB, en cambio, la
sombra mueve los tres canales a la vez y el filtro se rompe.

## Del pixel a la decisión

Una vez aislada la región de interés se calculan descriptores: área,
centroide, relación de aspecto. Con el centroide ya se puede cerrar un lazo de
control, por ejemplo girar la cámara hasta que el objeto quede centrado. Ese
es el puente entre visión y los actuadores de [[les-rb-03]].

## Límites que hay que asumir

Con poca luz sube el ruido; con contraluz el objeto se vuelve silueta; y todo
procesamiento consume tiempo, así que hay que decidir cuántos fotogramas por
segundo se necesitan de verdad. Bajar la resolución antes de procesar suele
ser la optimización más rentable.

{video}

## Actividad

Tomar tres fotografías del mismo objeto con iluminación distinta y encontrar
un único rango HSV que funcione en las tres. Documentar dónde falla.
""",
                "quiz": {
                    "id": "qz-rb-04", "title": "Control: visión básica", "value": 20,
                    "description": "Preguntas sobre la lección [[les-rb-04]].",
                    "questions": [
                        ("¿Por qué se prefiere HSV sobre RGB para detectar un color?",
                         ["Porque ocupa menos memoria",
                          "Porque separa el tono de la intensidad y tolera mejor los cambios de luz",
                          "Porque tiene más canales",
                          "Porque no requiere umbralización"], 1),
                        ("La umbralización consiste en:",
                         ["Aumentar el contraste de la imagen",
                          "Separar objeto y fondo comparando cada píxel con un valor",
                          "Reducir la resolución de la imagen",
                          "Convertir la imagen a color"], 1),
                        ("Para reducir el tiempo de procesamiento por fotograma, la medida más efectiva es:",
                         ["Bajar la resolución antes de procesar",
                          "Guardar cada fotograma en disco",
                          "Aumentar el umbral", "Usar más canales de color"], 0),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-robotica", "title": "Examen final: Robótica", "value": 100,
            "description": "Evaluación integradora. Se permite consultar [[lib-rb-servo]] y [[lib-rb-sensor]].",
            "questions": [
                ("Un brazo plano de dos eslabones con ángulos dados tiene, en cinemática directa:",
                 ["Ninguna solución", "Una única solución", "Dos soluciones", "Infinitas soluciones"], 1),
                ("La calibración de un sensor corrige principalmente su:",
                 ["Resolución", "Exactitud", "Frecuencia de muestreo", "Consumo"], 1),
                ("Con una señal PWM de 50 Hz, un pulso de 1,5 ms lleva al servo a:",
                 ["0°", "45°", "90°", "180°"], 2),
                ("El PCA9685 se usa para:",
                 ["Medir la corriente de los motores",
                  "Generar varias señales PWM estables por hardware liberando la CPU",
                  "Convertir señales analógicas a digitales",
                  "Filtrar el ruido de los sensores"], 1),
                ("Al cerrar un lazo de control visual, el dato que normalmente alimenta al actuador es:",
                 ["El histograma completo de la imagen",
                  "El centroide de la región detectada",
                  "La resolución del sensor de la cámara",
                  "El número de fotogramas descartados"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-rb-1", "author": "est-04", "created": "2026-03-25T16:45:00Z",
                "title": "Los servos tiemblan en la posición final",
                "body": """
Armé el barrido de [[les-rb-03]] y funciona, pero al llegar al ángulo pedido
el servo no se queda quieto: vibra un poco todo el tiempo. ¿Es normal o lo
estoy alimentando mal?
""",
                "likes": ["est-06", "est-07"],
                "replies": [
                    {
                        "id": "fp-rb-1r1", "author": "est-07", "created": "2026-03-25T19:30:00Z",
                        "body": """
A mí me pasaba lo mismo y era la fuente. Estaba alimentando cuatro servos
desde el pin de 5 V de la placa. Con una fuente aparte de 2 A dejó de vibrar
casi por completo.
""",
                        "likes": ["est-04", "doc-vasquez"],
                    },
                    {
                        "id": "fp-rb-1r2", "author": "doc-vasquez", "created": "2026-03-26T08:10:00Z",
                        "body": """
Las dos cosas se suman. Parte del temblor es el propio lazo interno del servo
corrigiendo alrededor de la posición, sobre todo si el pulso no es estable, y
parte es caída de tensión cuando comparten alimentación. Prueben también medir
la frecuencia real del módulo: si no está en 50 Hz exactos, el ancho efectivo
del pulso se corre y el servo nunca se asienta.
""",
                        "likes": ["est-04", "est-07", "est-02", "est-11"],
                    },
                ],
            },
            {
                "id": "fp-rb-2", "author": "est-11", "created": "2026-05-11T14:20:00Z",
                "title": "Rango HSV que aguante el contraluz",
                "body": """
Para la actividad de [[les-rb-04]] conseguí un rango HSV que detecta el objeto
en dos de las tres fotos, pero en la del contraluz el objeto queda casi negro
y ningún rango de tono lo separa del fondo. ¿Se puede resolver o hay que
aceptar que ahí falla?
""",
                "likes": ["est-03", "est-12"],
                "replies": [
                    {
                        "id": "fp-rb-2r1", "author": "doc-vasquez", "created": "2026-05-11T21:05:00Z",
                        "body": """
Con contraluz fuerte el tono deja de existir como información: el sensor
satura hacia abajo y no hay color que recuperar. Documentar ese límite es
parte del ejercicio, no un fracaso. Si les interesa ir más allá, la salida no
es un mejor rango sino cambiar la escena: reubicar la cámara o añadir
iluminación frontal.
""",
                        "likes": ["est-11", "est-03", "est-09"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-redes",
        "title": "Redes de Computadoras",
        "category": "Redes",
        "description": "Del cable al protocolo: capas, direccionamiento, medios físicos y enlaces de largo alcance, con énfasis en lo que funciona cuando la infraestructura es escasa.",
        "lessons": [
            {
                "id": "les-rd-01",
                "title": "Capas: modelo OSI y pila TCP/IP",
                "video": "modelo OSI capas explicación",
                "content": """
## Por qué capas

Nadie diseña una red como un solo bloque. Se divide en capas donde cada una
resuelve un problema y ofrece un servicio a la de arriba, sin que esta sepa
cómo lo hace. Cambiar el cable por radio no debería obligar a reescribir el
navegador, y con capas no lo hace.

[[lib-rd-osi]]

## Las siete capas de OSI

| Nº | Capa | Responsabilidad | Ejemplo |
|---|---|---|---|
| 7 | Aplicación | Servicio al usuario | HTTP |
| 6 | Presentación | Formato y codificación | TLS, JPEG |
| 5 | Sesión | Diálogo entre extremos | RPC |
| 4 | Transporte | Entrega extremo a extremo | TCP, UDP |
| 3 | Red | Direccionamiento y ruta | IP |
| 2 | Enlace | Trama en el medio local | Ethernet, Wi-Fi |
| 1 | Física | Bits como señales | Par trenzado, fibra |

## Lo que se usa de verdad

La pila real de internet tiene cuatro capas: aplicación, transporte, internet y
acceso a red. OSI se sigue enseñando porque su vocabulario ordena el
diagnóstico: decir "el problema es de capa 1" comunica mucho más rápido que
describir el síntoma.

## Encapsulación

Cada capa envuelve los datos de la superior con su propia cabecera. Al bajar
se agrega cabecera, al subir se retira. Un dato de aplicación viaja dentro de
un segmento, que viaja dentro de un paquete, que viaja dentro de una trama.
Ese anidamiento explica por qué el rendimiento útil siempre es menor que la
velocidad nominal del enlace: parte del ancho de banda lleva cabeceras.

## TCP frente a UDP

TCP ofrece conexión, orden y retransmisión; paga con retardo. UDP no ofrece
nada de eso y por eso es más rápido. Para transferir una lección completa
conviene TCP; para telemetría periódica donde perder una muestra no importa,
UDP es la elección razonable.

{video}

## Actividad

Diagnosticar tres fallas descritas por el docente e indicar en qué capa está
cada una, justificando con el síntoma observado.
""",
                "quiz": {
                    "id": "qz-rd-01", "title": "Control: capas y encapsulación", "value": 20,
                    "description": "Preguntas sobre la lección [[les-rd-01]] y el esquema [[lib-rd-osi]].",
                    "questions": [
                        ("El direccionamiento IP corresponde a la capa:",
                         ["Enlace", "Red", "Transporte", "Aplicación"], 1),
                        ("La encapsulación implica que:",
                         ["Cada capa comprime los datos de la anterior",
                          "Cada capa agrega su cabecera a los datos de la capa superior",
                          "Los datos se cifran en cada capa",
                          "Se elimina información redundante en cada salto"], 1),
                        ("Para enviar telemetría periódica donde perder una muestra es tolerable conviene:",
                         ["TCP, por su control de flujo", "UDP, por su menor sobrecarga",
                          "TCP con retransmisión desactivada", "Un protocolo de capa física"], 1),
                    ],
                },
            },
            {
                "id": "les-rd-02",
                "title": "Direccionamiento IP y subredes",
                "video": "subneteo IPv4 ejercicio resuelto",
                "content": """
## La dirección tiene dos partes

Una dirección IPv4 son 32 bits escritos en cuatro octetos. La máscara indica
qué bits identifican a la **red** y qué bits al **host**. En 192.168.10.37/24
los primeros 24 bits son red: todos los equipos 192.168.10.x están en el mismo
segmento y se hablan sin router.

[[lib-rd-subneteo]]

## Por qué subnetear

Un /24 con 254 hosts en un solo dominio de difusión funciona, pero todo el
tráfico de difusión llega a todos. Dividir en subredes aísla el tráfico,
permite aplicar reglas distintas por grupo y usa mejor el espacio de
direcciones cuando hay muchos enlaces pequeños.

## Procedimiento

1. Contar cuántos hosts necesita la subred más grande.
2. Buscar el prefijo más pequeño que los aloje, recordando que se descuentan
   dos direcciones (red y difusión).
3. Calcular el salto: 256 menos el último octeto de la máscara.
4. Listar las subredes sumando el salto.
5. Verificar que ninguna se solapa.

## Direcciones que no se asignan

- La primera de cada subred: identifica la red.
- La última: dirección de difusión.
- 127.0.0.0/8: bucle local.
- 169.254.0.0/16: autoconfiguración cuando falla DHCP; si un equipo tiene una
  dirección así, casi siempre significa que no encontró servidor DHCP.

## Privadas y NAT

Los rangos 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16 no se enrutan en
internet. Un router traduce esas direcciones a una pública (NAT), lo que
ahorra direcciones pero rompe la conectividad entrante directa. Para el
servidor de borde eso no es un problema: los estudiantes están dentro de la
misma red privada.

{video}

## Actividad

Dividir 172.16.4.0/22 en subredes para cuatro aulas de 60 equipos y dos
enlaces punto a punto. Entregar la tabla completa con rangos útiles.
""",
                "quiz": {
                    "id": "qz-rd-02", "title": "Control: subredes", "value": 20,
                    "description": "Ejercicios de la lección [[les-rd-02]]. Se permite la chuleta [[lib-rd-subneteo]].",
                    "questions": [
                        ("¿Cuántos hosts útiles admite una subred /26?",
                         ["30", "62", "64", "126"], 1),
                        ("Un equipo con dirección 169.254.13.8 indica normalmente que:",
                         ["Está en una red pública",
                          "No obtuvo respuesta del servidor DHCP y se autoconfiguró",
                          "Tiene la máscara mal escrita",
                          "Está usando IPv6"], 1),
                        ("Al dividir 192.168.10.0/24 en cuatro subredes iguales, el salto entre subredes es:",
                         ["32", "64", "128", "192"], 1),
                    ],
                },
            },
            {
                "id": "les-rd-03",
                "title": "Medios físicos y cableado estructurado",
                "video": "cableado estructurado par trenzado categorías",
                "content": """
## El medio impone el límite

Antes de discutir protocolos conviene saber qué aguanta el medio. Tres
propiedades mandan: ancho de banda, atenuación con la distancia e inmunidad al
ruido eléctrico.

[[lib-rd-rj45]]

## Par trenzado

El trenzado no es decorativo: dos conductores trenzados reciben la
interferencia de forma casi idéntica y el receptor, que mide la diferencia
entre ambos, la cancela. Más vueltas por metro, más rechazo al ruido.

| Categoría | Ancho de banda | Uso típico | Distancia |
|---|---|---|---|
| Cat 5e | 100 MHz | 1 Gbit/s | 100 m |
| Cat 6 | 250 MHz | 1–10 Gbit/s | 100 m / 55 m |
| Cat 6a | 500 MHz | 10 Gbit/s | 100 m |

Los 100 metros no son un capricho: es la distancia a la que la atenuación deja
la señal por debajo de lo que el receptor distingue con seguridad.

## Fibra óptica

Transmite luz en un núcleo de vidrio. No le afecta la interferencia
electromagnética y llega mucho más lejos, lo que la hace la opción correcta
para unir edificios o cruzar zonas con tormentas eléctricas frecuentes, muy
común en la región. Es más frágil al manipularla y el equipamiento cuesta más.

## Errores frecuentes en la práctica

- Destrenzar más de 13 mm al ponchar un conector: se pierde el rechazo al ruido
  justo en el extremo.
- Mezclar la norma T568A en un extremo y T568B en el otro sin querer: queda un
  cable cruzado que no era el objetivo.
- Tender datos junto a cables de energía en el mismo ducto.
- Superar el radio de curvatura mínimo, sobre todo en fibra.

## Actividad

Armar un cable directo y comprobarlo con el probador. Documentar la norma
usada y el resultado par por par. Relacionar con las capas de [[les-rd-01]].
""",
                "quiz": {
                    "id": "qz-rd-03", "title": "Control: medios físicos", "value": 20,
                    "description": "Preguntas sobre la lección [[les-rd-03]] y la herramienta de [[lib-rd-rj45]].",
                    "questions": [
                        ("El trenzado de los pares sirve para:",
                         ["Aumentar la velocidad de propagación",
                          "Cancelar la interferencia que afecta por igual a ambos conductores",
                          "Reducir el costo del cable",
                          "Permitir mayor voltaje"], 1),
                        ("El límite de 100 m en par trenzado se debe principalmente a:",
                         ["La norma de colores",
                          "La atenuación de la señal con la distancia",
                          "El número de pares del cable",
                          "La velocidad de la luz en el cobre"], 1),
                        ("Para unir dos edificios en una zona con tormentas eléctricas frecuentes conviene:",
                         ["Par trenzado Cat 6", "Fibra óptica, inmune a la interferencia electromagnética",
                          "Cable coaxial", "Par trenzado con dos conectores por extremo"], 1),
                    ],
                },
            },
            {
                "id": "les-rd-04",
                "title": "Enlaces inalámbricos de largo alcance",
                "video": "presupuesto de enlace radioenlace zona de Fresnel clase",
                "content": """
## Conectar lo disperso

Cuando tender cable es imposible por distancia o por selva de por medio, queda
el radioenlace. El diseño se apoya en tres conceptos: potencia, ganancia de
antena y línea de vista.

[[lib-rd-antena]]

## Presupuesto de enlace

La cuenta básica, en decibelios:

```
Potencia recibida = Potencia transmitida
                  + Ganancia antena Tx
                  + Ganancia antena Rx
                  - Pérdidas en espacio libre
                  - Pérdidas en cables y conectores
```

El resultado debe quedar con margen sobre la sensibilidad del receptor. Un
enlace que apenas alcanza en día seco deja de funcionar con lluvia intensa,
que es la condición normal buena parte del año en la Amazonía.

## Línea de vista

No basta ver la otra antena: la señal ocupa un volumen alrededor de la recta
(la zona de Fresnel) que debe estar libre de obstáculos. Los árboles altos son
el obstáculo real y además crecen, así que el margen de despeje debe pensarse
a varios años, no para el día de la instalación.

## Alternativas de bajo consumo

Para telemetría hay tecnologías que sacrifican velocidad para ganar alcance y
autonomía. LoRa transmite unos pocos kilobits por segundo pero llega a varios
kilómetros con muy poca energía. No sirve para distribuir video, sí para
enviar el estado de la cola de sincronización o los datos de un sensor.

| Tecnología | Alcance típico | Velocidad | Consumo |
|---|---|---|---|
| Wi-Fi 2,4 GHz | 100 m (interior) | Decenas de Mbit/s | Alto |
| Enlace punto a punto 5 GHz | 5–30 km | Decenas de Mbit/s | Medio |
| LoRa | 2–15 km | Pocos kbit/s | Muy bajo |

Esto conecta con el curso de sistemas distribuidos: un enlace intermitente no
se arregla con más potencia, se asume en el diseño del software.

{video}

## Actividad

Calcular el presupuesto de enlace para 8 km con antenas de 16 dBi y 20 dBm de
transmisión, y decidir si el margen es suficiente en época de lluvias.
""",
                "quiz": {
                    "id": "qz-rd-04", "title": "Control: enlaces inalámbricos", "value": 20,
                    "description": "Preguntas sobre la lección [[les-rd-04]].",
                    "questions": [
                        ("La zona de Fresnel exige que:",
                         ["Las antenas tengan la misma altura",
                          "El volumen alrededor de la línea recta entre antenas esté libre de obstáculos",
                          "El enlace no supere 5 km",
                          "Se use la banda de 2,4 GHz"], 1),
                        ("LoRa resulta adecuado para:",
                         ["Distribuir video en alta definición",
                          "Enviar pocos datos a varios kilómetros con muy bajo consumo",
                          "Sustituir la fibra óptica entre edificios",
                          "Conectar equipos dentro de la misma sala a 1 Gbit/s"], 1),
                        ("Un enlace calculado sin margen sobre la sensibilidad del receptor:",
                         ["Funciona igual en cualquier condición",
                          "Puede caer con lluvia intensa o crecimiento de vegetación",
                          "Mejora al aumentar la longitud del cable",
                          "No necesita línea de vista"], 1),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-redes", "title": "Examen final: Redes de Computadoras", "value": 100,
            "description": "Evaluación integradora. Material permitido: [[lib-rd-subneteo]].",
            "questions": [
                ("El rendimiento útil de un enlace es menor que su velocidad nominal porque:",
                 ["El medio se desgasta",
                  "Parte del ancho de banda transporta las cabeceras de cada capa",
                  "Los routers descartan tramas por norma",
                  "La señal viaja más lento en cobre"], 1),
                ("¿Cuál de estas direcciones no puede asignarse a un host de la red 10.1.2.0/24?",
                 ["10.1.2.1", "10.1.2.129", "10.1.2.255", "10.1.2.200"], 2),
                ("La NAT permite ahorrar direcciones públicas pero dificulta:",
                 ["La navegación web saliente",
                  "Las conexiones entrantes iniciadas desde internet",
                  "El uso de DHCP",
                  "La resolución de nombres"], 1),
                ("Al ponchar un conector se recomienda no destrenzar más de 13 mm porque:",
                 ["El conector no cierra",
                  "Se pierde el rechazo al ruido justo en el extremo del cable",
                  "Aumenta la resistencia del cobre",
                  "Se invierte la norma de colores"], 1),
                ("En el presupuesto de un radioenlace, la ganancia de las antenas:",
                 ["Se resta de la potencia transmitida",
                  "Se suma, compensando parte de las pérdidas del trayecto",
                  "No influye si hay línea de vista",
                  "Solo importa en la antena receptora"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-rd-1", "author": "est-06", "created": "2026-04-14T10:35:00Z",
                "title": "¿Por qué mi subred de 60 hosts no entra en un /26?",
                "body": """
En el ejercicio de [[les-rd-02]] puse /26 para las aulas de 60 equipos porque
2^6 = 64 y me alcanzaba. El profesor me marcó que revise. Ya vi la chuleta
[[lib-rd-subneteo]] y creo que entiendo, pero quiero confirmarlo: ¿es por las
dos direcciones que no se asignan?
""",
                "likes": ["est-08", "est-01"],
                "replies": [
                    {
                        "id": "fp-rd-1r1", "author": "est-01", "created": "2026-04-14T12:02:00Z",
                        "body": """
Sí. Con /26 tienes 64 direcciones pero solo 62 útiles, porque la primera es la
de red y la última la de difusión. Para 60 equipos alcanza justo, pero si
después agregan la impresora y dos puntos de acceso te quedas sin espacio. Yo
usé /25 por eso.
""",
                        "likes": ["est-06", "est-04", "doc-vasquez"],
                    },
                    {
                        "id": "fp-rd-1r2", "author": "doc-vasquez", "created": "2026-04-14T17:48:00Z",
                        "body": """
Exacto, y el criterio que quiero que apliquen es ese: dimensionar con margen
razonable, no al límite. En el examen [[ex-redes]] la respuesta correcta parte
siempre de descontar las dos direcciones.
""",
                        "likes": ["est-06", "est-01", "est-08", "est-12"],
                    },
                ],
            },
            {
                "id": "fp-rd-2", "author": "est-12", "created": "2026-06-02T08:50:00Z",
                "title": "El enlace de 8 km se cae cuando llueve fuerte",
                "body": """
Hicimos el cálculo de [[les-rd-04]] y en seco el enlace anda bien, pero con
lluvia fuerte se corta. El margen que nos quedó era de unos 3 dB. ¿Conviene
subir potencia o cambiar las antenas?
""",
                "likes": ["est-05", "est-07", "est-10"],
                "replies": [
                    {
                        "id": "fp-rd-2r1", "author": "doc-vasquez", "created": "2026-06-02T13:15:00Z",
                        "body": """
Con 3 dB de margen cualquier lluvia se lo come. Subir potencia da poco y suele
chocar con el límite legal de la banda; ganar en antena rinde más porque
mejora transmisión y recepción a la vez, aunque exige apuntar mejor. Antes de
comprar nada, revisen el despeje: si un árbol creció dentro de la zona de
Fresnel, ninguna de las dos cosas va a arreglarlo.
""",
                        "likes": ["est-12", "est-05", "est-02"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-basedatos",
        "title": "Bases de Datos",
        "category": "Datos",
        "description": "Diseño relacional, consultas SQL, normalización y transacciones, usando como ejemplo el propio esquema con el que RADIX guarda cursos, lecciones y notas.",
        "lessons": [
            {
                "id": "les-bd-01",
                "title": "Modelo relacional y diagramas entidad-relación",
                "video": "modelo entidad relación explicación base de datos",
                "content": """
## Tablas, filas y claves

El modelo relacional guarda la información en tablas. Cada fila es un hecho y
cada columna un atributo de ese hecho. Dos reglas sostienen todo lo demás:

- **Clave primaria:** identifica una fila de forma única y no puede ser nula.
- **Clave foránea:** una columna que apunta a la clave primaria de otra tabla.
  La base de datos rechaza el valor si la fila referenciada no existe.

[[lib-bd-er]]

## Del enunciado al diagrama

El diagrama entidad-relación es el paso intermedio entre lo que pide el
usuario y las tablas. Se identifican entidades (sustantivos que importan),
atributos y relaciones (verbos que las unen).

La cardinalidad decide el diseño:

| Relación | Cómo se implementa |
|---|---|
| Uno a uno | Clave foránea en cualquiera de las dos tablas, con restricción única |
| Uno a muchos | Clave foránea en el lado "muchos" |
| Muchos a muchos | Tabla intermedia con las dos claves foráneas |

## El ejemplo del curso

En RADIX un curso tiene muchas lecciones: la lección guarda `course_id`. Un
estudiante cursa muchas asignaturas y una asignatura tiene muchos estudiantes:
esa es una relación muchos a muchos y se resuelve con una tabla de matrícula
cuya clave primaria son las dos columnas juntas. Así la base de datos impide
por sí sola matricular dos veces al mismo estudiante en el mismo curso.

## Integridad referencial

Si se intenta borrar un curso que tiene lecciones, la base de datos se niega,
y eso es deseable: prefiere fallar antes que dejar lecciones apuntando a un
curso inexistente. Cuando el borrado en cascada sí tiene sentido (una respuesta
del foro no sobrevive a su publicación) se declara explícitamente.

{video}

## Actividad

Modelar en un diagrama la biblioteca de archivos: entidades, atributos,
cardinalidades y claves. Señalar dónde hace falta tabla intermedia.
""",
                "quiz": {
                    "id": "qz-bd-01", "title": "Control: modelo relacional", "value": 20,
                    "description": "Preguntas sobre la lección [[les-bd-01]] y el diagrama [[lib-bd-er]].",
                    "questions": [
                        ("Una relación muchos a muchos se implementa con:",
                         ["Una clave foránea en cada tabla",
                          "Una tabla intermedia con las dos claves foráneas",
                          "Una columna con valores separados por comas",
                          "Dos claves primarias en la misma tabla"], 1),
                        ("La integridad referencial garantiza que:",
                         ["Ninguna columna sea nula",
                          "Una clave foránea apunte siempre a una fila existente",
                          "Las tablas estén normalizadas",
                          "Las consultas se ejecuten más rápido"], 1),
                        ("En una relación uno a muchos, la clave foránea se coloca:",
                         ["En el lado 'uno'", "En el lado 'muchos'",
                          "En una tabla intermedia", "En ambas tablas"], 1),
                    ],
                },
            },
            {
                "id": "les-bd-02",
                "title": "Consultas SQL: filtrar, unir y agrupar",
                "video": "SQL JOIN GROUP BY tutorial español",
                "content": """
## El orden lógico de una consulta

Se escribe `SELECT` primero, pero el motor evalúa en otro orden, y entender
eso resuelve la mayoría de las dudas:

```
FROM  -> JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT
```

De ahí sale la regla que más se pregunta en clase: `WHERE` filtra filas antes
de agrupar y `HAVING` filtra grupos después. Por eso no se puede usar un
`AVG()` dentro de `WHERE`.

[[lib-bd-sql]]

## Uniones

- `INNER JOIN`: solo las filas con coincidencia en ambos lados.
- `LEFT JOIN`: todas las de la izquierda; las que no tienen pareja quedan con
  nulos.

La confusión clásica: contar con `COUNT(*)` sobre un `LEFT JOIN` cuenta también
las filas sin pareja, porque la fila existe aunque venga con nulos. Si se
quiere contar solo las coincidencias hay que contar una columna del lado
derecho, `COUNT(m.estudiante_id)`.

## Agrupar

`GROUP BY` colapsa filas en grupos y las funciones de agregación resumen cada
grupo: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. Toda columna del `SELECT` que no
esté agregada debe aparecer en el `GROUP BY`.

## Nulos

`NULL` no significa cero ni cadena vacía: significa "no se sabe". Cualquier
comparación con `NULL` da desconocido, así que `= NULL` nunca es verdadero; se
usa `IS NULL`. Y las funciones de agregación ignoran los nulos, lo que a veces
explica un promedio que no cuadra con lo que se esperaba.

{video}

## Actividad

Escribir cinco consultas sobre el esquema del curso: promedio por estudiante,
cursos sin matriculados, la lección más referenciada, estudiantes sin notas y
el ranking por curso. Comparar con [[lib-bd-sql]].
""",
                "quiz": {
                    "id": "qz-bd-02", "title": "Control: consultas SQL", "value": 20,
                    "description": "Ejercicios de la lección [[les-bd-02]]. Material: [[lib-bd-sql]].",
                    "questions": [
                        ("La diferencia entre WHERE y HAVING es que:",
                         ["WHERE se aplica a grupos y HAVING a filas",
                          "WHERE filtra filas antes de agrupar y HAVING filtra grupos después",
                          "HAVING solo funciona con ORDER BY",
                          "Son sinónimos"], 1),
                        ("Para listar todos los cursos incluso los que no tienen matriculados se usa:",
                         ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "Una subconsulta con IN"], 1),
                        ("¿Qué devuelve la comparación `nota = NULL`?",
                         ["Verdadero si la nota es nula", "Falso siempre",
                          "Desconocido, por eso se usa IS NULL", "Un error de sintaxis"], 2),
                    ],
                },
            },
            {
                "id": "les-bd-03",
                "title": "Normalización y sus límites",
                "video": "normalización base de datos primera segunda tercera forma normal",
                "content": """
## El problema que resuelve

Guardar el mismo dato en varios lugares provoca tres males concretos:
**redundancia** (ocupa espacio), **inconsistencia** (una copia se actualiza y
otra no) y **anomalías** al insertar o borrar. La normalización reorganiza las
tablas para que cada hecho se guarde una sola vez.

## Las tres primeras formas normales

1. **1FN.** Cada celda contiene un valor atómico. Nada de listas separadas por
   comas en una columna.
2. **2FN.** Estando en 1FN, todo atributo no clave depende de la clave
   completa, no de una parte de ella. Relevante solo con claves compuestas.
3. **3FN.** Estando en 2FN, ningún atributo no clave depende de otro atributo
   no clave. Si el nombre del curso depende del código del curso, ese par va en
   su propia tabla.

## Ejemplo

Una tabla `matricula(estudiante_id, curso_id, nombre_curso, categoria_curso)`
está en 1FN pero no en 3FN: el nombre y la categoría dependen de `curso_id`, no
de la matrícula. Si un curso cambia de nombre habría que actualizar todas sus
filas de matrícula y basta olvidar una para quedar con datos contradictorios.
La solución es sacar esos atributos a la tabla `curso`.

## Cuándo no normalizar

Normalizar reparte los datos en más tablas, y recomponerlos exige uniones. Si
una consulta muy frecuente exige seis uniones y el rendimiento no alcanza, se
puede duplicar deliberadamente un dato. Eso se llama desnormalizar y solo es
defendible con dos condiciones: que haya una medición que lo justifique y que
quede documentado quién mantiene la copia sincronizada.

## Actividad

Tomar la tabla desnormalizada que entrega el docente, señalar las
dependencias funcionales y llevarla a 3FN explicando cada paso. Repasar
[[les-bd-01]] para las claves.
""",
                "quiz": {
                    "id": "qz-bd-03", "title": "Control: normalización", "value": 20,
                    "description": "Preguntas sobre la lección [[les-bd-03]].",
                    "questions": [
                        ("Una columna que guarda 'matemática, física, química' viola:",
                         ["La primera forma normal", "La segunda forma normal",
                          "La tercera forma normal", "Ninguna"], 0),
                        ("La tercera forma normal exige que:",
                         ["No haya claves compuestas",
                          "Ningún atributo no clave dependa de otro atributo no clave",
                          "Todas las tablas tengan clave foránea",
                          "No existan valores nulos"], 1),
                        ("Desnormalizar es aceptable cuando:",
                         ["Se quiere escribir menos SQL",
                          "Hay una medición de rendimiento que lo justifica y se documenta quién sincroniza la copia",
                          "La tabla tiene más de cinco columnas",
                          "Nunca es aceptable"], 1),
                    ],
                },
            },
            {
                "id": "les-bd-04",
                "title": "Transacciones y propiedades ACID",
                "video": "transacciones ACID base de datos explicación",
                "content": """
## Una unidad indivisible

Una transacción agrupa varias operaciones para que se apliquen todas o
ninguna. El ejemplo canónico es mover una matrícula: borrar de un curso e
insertar en otro. Si el proceso se corta en medio sin transacción, el
estudiante queda sin ninguna de las dos.

[[lib-bd-servidor]]

## ACID

| Propiedad | Qué garantiza |
|---|---|
| Atomicidad | Se aplica todo o nada |
| Consistencia | Se respetan las restricciones declaradas |
| Aislamiento | Una transacción no ve los estados intermedios de otra |
| Durabilidad | Lo confirmado sobrevive a un corte de energía |

En SQL: `BEGIN` abre, `COMMIT` confirma, `ROLLBACK` descarta.

## Aislamiento y sus fallos

Cuando dos transacciones corren a la vez pueden aparecer anomalías con nombre
propio:

- **Lectura sucia:** leer un dato que otra transacción todavía no confirmó.
- **Lectura no repetible:** leer dos veces el mismo dato y obtener valores
  distintos.
- **Lectura fantasma:** repetir una consulta y encontrar filas nuevas.

Subir el nivel de aislamiento evita más anomalías y reduce la concurrencia. El
nivel serializable es el más seguro y el más lento.

## En un servidor de borde

Aquí importa el caso del cliente que se desconecta a mitad de una escritura.
Si la transacción quedó abierta, la conexión puede quedar bloqueada y el
siguiente pedido se queda esperando. Por eso conviene que las transacciones
sean cortas y que la operación no dependa de que el cliente siga escuchando la
respuesta.

{video}

## Actividad

Ejecutar dos sesiones simultáneas contra la misma tabla, provocar una lectura
no repetible y luego evitarla subiendo el nivel de aislamiento. Anotar qué se
pierde en concurrencia.
""",
                "quiz": {
                    "id": "qz-bd-04", "title": "Control: transacciones", "value": 20,
                    "description": "Preguntas sobre la lección [[les-bd-04]].",
                    "questions": [
                        ("La atomicidad de una transacción significa que:",
                         ["Las operaciones se ejecutan en paralelo",
                          "Se aplican todas las operaciones o ninguna",
                          "Los datos se guardan comprimidos",
                          "Cada operación se confirma por separado"], 1),
                        ("Leer un dato que otra transacción aún no confirmó se llama:",
                         ["Lectura fantasma", "Lectura sucia",
                          "Lectura no repetible", "Bloqueo mutuo"], 1),
                        ("Subir el nivel de aislamiento a serializable:",
                         ["Aumenta la concurrencia", "Reduce la concurrencia y evita más anomalías",
                          "No afecta el rendimiento", "Elimina la necesidad de COMMIT"], 1),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-basedatos", "title": "Examen final: Bases de Datos", "value": 100,
            "description": "Evaluación integradora. Material permitido: [[lib-bd-sql]] y el diagrama [[lib-bd-er]].",
            "questions": [
                ("La clave primaria de una tabla de matrícula formada por (estudiante_id, curso_id) impide:",
                 ["Que un estudiante curse dos asignaturas",
                  "Matricular dos veces al mismo estudiante en el mismo curso",
                  "Borrar una matrícula",
                  "Usar claves foráneas"], 1),
                ("En un LEFT JOIN, COUNT(*) sobre el resultado cuenta:",
                 ["Solo las filas con coincidencia",
                  "También las filas sin pareja, porque la fila existe con nulos",
                  "Solo las filas de la tabla derecha",
                  "Nada, devuelve NULL"], 1),
                ("Una tabla matricula(estudiante_id, curso_id, nombre_curso) incumple 3FN porque:",
                 ["Tiene tres columnas",
                  "nombre_curso depende de curso_id y no de la clave de la matrícula",
                  "No tiene clave primaria",
                  "Contiene valores nulos"], 1),
                ("Si una transacción falla a mitad de camino, la operación correcta es:",
                 ["COMMIT parcial", "ROLLBACK, dejando la base como estaba",
                  "Reintentar sin cerrar la transacción", "Borrar la tabla afectada"], 1),
                ("Las transacciones cortas son preferibles en un servidor de borde porque:",
                 ["Ocupan menos disco",
                  "Reducen el tiempo en que la conexión queda bloqueada esperando",
                  "No requieren COMMIT",
                  "Permiten desnormalizar"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-bd-1", "author": "est-03", "created": "2026-04-22T19:05:00Z",
                "title": "Mi promedio con AVG no coincide con el cálculo a mano",
                "body": """
Calculé el promedio por estudiante como en [[lib-bd-sql]] y para dos casos me
da más alto que si lo saco a mano con la lista de notas. Revisé la consulta
tres veces y el JOIN parece correcto. ¿Qué se me puede estar escapando?
""",
                "likes": ["est-09"],
                "replies": [
                    {
                        "id": "fp-bd-1r1", "author": "est-09", "created": "2026-04-22T20:41:00Z",
                        "body": """
¿No tienes notas en NULL? AVG las ignora, así que divide entre menos valores.
A mano probablemente estás contando esas filas como cero y por eso te sale más
bajo. Fíjate en la parte de nulos de [[les-bd-02]].
""",
                        "likes": ["est-03", "doc-vasquez", "est-05"],
                    },
                    {
                        "id": "fp-bd-1r2", "author": "doc-vasquez", "created": "2026-04-23T09:12:00Z",
                        "body": """
Es eso, y vale la pena que quede claro para el examen: primero hay que decidir
qué significa una nota ausente en el modelo. Si ausente equivale a cero, se
usa COALESCE y se documenta; si significa "no rindió", el promedio debe
ignorarla y el informe debe decir sobre cuántas evaluaciones se calculó.
""",
                        "likes": ["est-03", "est-09", "est-07", "est-01"],
                    },
                ],
            },
            {
                "id": "fp-bd-2", "author": "est-10", "created": "2026-05-28T15:30:00Z",
                "title": "¿Hasta dónde normalizar el esquema del proyecto?",
                "body": """
En el proyecto llegamos a 3FN pero la consulta del listado principal ya
necesita cinco uniones y se nota lenta en la Raspberry. ¿Rompemos la
normalización o dejamos así? El cuestionario [[qz-bd-03]] dice que
desnormalizar necesita justificación y no sé si esto cuenta.
""",
                "likes": ["est-02", "est-06", "est-11"],
                "replies": [
                    {
                        "id": "fp-bd-2r1", "author": "doc-vasquez", "created": "2026-05-28T18:20:00Z",
                        "body": """
"Se nota lenta" no es una medición. Midan primero el tiempo de la consulta y
revisen si falta un índice en las columnas por las que unen: nueve de cada
diez veces el problema es eso y no la normalización. Si con índices sigue sin
alcanzar, entonces sí discutimos qué duplicar y quién lo mantiene al día.
""",
                        "likes": ["est-10", "est-02", "est-06", "est-04"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-matdis",
        "title": "Matemática Discreta",
        "category": "Matemática",
        "description": "Lógica, conjuntos, grafos y conteo: las herramientas con las que se demuestra que un algoritmo o un protocolo hace lo que se afirma.",
        "lessons": [
            {
                "id": "les-mt-01",
                "title": "Lógica proposicional",
                "video": "lógica proposicional tablas de verdad ejercicios",
                "content": """
## Proposiciones

Una proposición es un enunciado que es verdadero o falso, no las dos cosas.
"El servidor está encendido" lo es; "¿está encendido?" no. A partir de
proposiciones simples se construyen compuestas con conectivos.

[[lib-mt-verdad]]

## Conectivos

- Negación `¬p`: invierte el valor.
- Conjunción `p ∧ q`: verdadera solo si ambas lo son.
- Disyunción `p ∨ q`: falsa solo si ambas son falsas.
- Implicación `p → q`: falsa únicamente cuando `p` es verdadera y `q` falsa.
- Bicondicional `p ↔ q`: verdadera cuando ambas coinciden.

La implicación es la que cuesta. Si el antecedente es falso, la implicación es
verdadera: "si el enlace está disponible, sincroniza" no se incumple cuando no
hay enlace, porque no se prometió nada para ese caso.

## Tautologías y contradicciones

Una fórmula es **tautología** si es verdadera para toda asignación, y
**contradicción** si es falsa para todas. Dos fórmulas son **equivalentes**
cuando su bicondicional es tautología, y ahí está la utilidad práctica: permite
reescribir una condición enredada por otra equivalente y más legible.

## Reglas de inferencia

| Regla | Forma |
|---|---|
| Modus ponens | De `p → q` y `p`, se concluye `q` |
| Modus tollens | De `p → q` y `¬q`, se concluye `¬p` |
| Silogismo hipotético | De `p → q` y `q → r`, se concluye `p → r` |

Un error frecuente es afirmar el consecuente: de `p → q` y `q` **no** se
concluye `p`. Sirve de ejemplo la lección [[les-sd-03]]: de una marca de reloj
menor no se sigue la precedencia.

{video}

## Actividad

Construir la tabla de verdad de `(p → q) ∧ (q → r) → (p → r)` y decidir si es
tautología. Reescribir después `¬(p ∨ ¬q)` sin usar el símbolo de negación
sobre paréntesis.
""",
                "quiz": {
                    "id": "qz-mt-01", "title": "Control: lógica proposicional", "value": 20,
                    "description": "Preguntas sobre la lección [[les-mt-01]]. Material: [[lib-mt-verdad]].",
                    "questions": [
                        ("La implicación p → q es falsa solamente cuando:",
                         ["p es falsa y q verdadera", "p es verdadera y q falsa",
                          "ambas son falsas", "ambas son verdaderas"], 1),
                        ("De p → q y ¬q se concluye:",
                         ["q", "p", "¬p", "Nada"], 2),
                        ("¬(p ∧ q) es equivalente a:",
                         ["¬p ∧ ¬q", "¬p ∨ ¬q", "p ∨ q", "p → q"], 1),
                    ],
                },
            },
            {
                "id": "les-mt-02",
                "title": "Conjuntos y operaciones",
                "video": "teoría de conjuntos operaciones diagramas de Venn",
                "content": """
## Pertenencia y contención

Un conjunto es una colección sin orden ni repeticiones. Hay que distinguir dos
relaciones que se confunden todo el tiempo: `x ∈ A` dice que `x` es un elemento
de `A`; `B ⊆ A` dice que todo elemento de `B` también está en `A`.

[[lib-mt-venn]]

## Operaciones

- Unión `A ∪ B`: lo que está en alguno de los dos.
- Intersección `A ∩ B`: lo que está en ambos.
- Diferencia `A \\ B`: lo de `A` que no está en `B`.
- Complemento `Aᶜ`: lo que no está en `A`, respecto de un universo declarado.
- Producto cartesiano `A × B`: todos los pares ordenados.

El complemento exige decir cuál es el universo. Sin universo declarado, el
complemento no significa nada.

## Cardinalidad y el principio de inclusión-exclusión

Para dos conjuntos finitos:

```
|A ∪ B| = |A| + |B| - |A ∩ B|
```

Se resta la intersección porque al sumar se contó dos veces. Con tres
conjuntos hay que sumar de nuevo la intersección triple, y ahí es donde el
diagrama de Venn deja de ser un adorno y se vuelve la forma más segura de no
equivocarse.

## Relación con las tablas

Las operaciones de conjuntos son las de una base de datos: `UNION`,
`INTERSECT` y `EXCEPT` hacen exactamente esto sobre filas, y el producto
cartesiano es lo que devuelve un `JOIN` sin condición. Ver [[les-bd-02]].

{video}

## Actividad

En un grupo de 40 estudiantes, 24 llevan Redes, 18 Bases de Datos y 9 ambas.
Calcular cuántos no llevan ninguna de las dos y representarlo en un diagrama.
""",
                "quiz": {
                    "id": "qz-mt-02", "title": "Control: conjuntos", "value": 20,
                    "description": "Preguntas sobre la lección [[les-mt-02]] y el diagrama [[lib-mt-venn]].",
                    "questions": [
                        ("En |A ∪ B| = |A| + |B| - |A ∩ B|, se resta la intersección porque:",
                         ["La intersección no pertenece a la unión",
                          "Sus elementos se contaron dos veces al sumar",
                          "La unión siempre es menor que la suma",
                          "La fórmula solo vale para conjuntos disjuntos"], 1),
                        ("La expresión x ∈ A significa:",
                         ["A está contenido en x", "x es un elemento de A",
                          "x es un subconjunto de A", "A y x son iguales"], 1),
                        ("Para hablar del complemento de un conjunto es imprescindible:",
                         ["Que sea finito", "Declarar el conjunto universo",
                          "Que tenga al menos dos elementos", "Que no tenga intersección con otro"], 1),
                    ],
                },
            },
            {
                "id": "les-mt-03",
                "title": "Grafos: caminos, recorridos y árboles",
                "video": "teoría de grafos camino euleriano puentes de Konigsberg",
                "content": """
## Vértices y aristas

Un grafo `G = (V, E)` son vértices y aristas que los unen. Modelar como grafo
sirve para cualquier cosa con relaciones: una red de computadoras, las
dependencias de un proyecto, o las lecciones enlazadas entre sí en RADIX.

[[lib-mt-grafo]]

## Vocabulario mínimo

- **Grado** de un vértice: número de aristas que inciden en él.
- **Camino:** secuencia de vértices unidos por aristas.
- **Ciclo:** camino que vuelve al inicio sin repetir aristas.
- **Conexo:** existe camino entre cualquier par de vértices.
- **Árbol:** grafo conexo sin ciclos; con `n` vértices tiene exactamente `n-1`
  aristas.

## Los puentes de Königsberg

El problema que dio origen a la teoría: recorrer los siete puentes de la ciudad
pasando por cada uno exactamente una vez. Euler demostró que era imposible, y
el argumento es elegante: en un recorrido que use cada arista una vez, cada
vértice intermedio necesita grado par (se entra y se sale). Königsberg tenía
cuatro vértices de grado impar, así que ni siquiera empezando en el lugar
adecuado alcanzaba.

[[lib-mt-puentes]]

Un grafo conexo admite recorrido euleriano si tiene cero o dos vértices de
grado impar. Con dos, el recorrido empieza en uno y termina en el otro.

## Recorridos

En anchura se visita por niveles usando una cola, lo que da el camino más
corto en número de aristas. En profundidad se avanza hasta el fondo con una
pila y sirve para detectar ciclos o componentes. Es la misma estructura con la
que el servidor resuelve qué lecciones enlazan a un archivo.

{video}

## Actividad

Dibujar el grafo de enlaces internos entre tres lecciones y dos archivos,
calcular grados y decidir si admite recorrido euleriano.
""",
                "quiz": {
                    "id": "qz-mt-03", "title": "Control: grafos", "value": 20,
                    "description": "Preguntas sobre la lección [[les-mt-03]], con [[lib-mt-puentes]] como referencia.",
                    "questions": [
                        ("Un grafo conexo admite recorrido euleriano cuando tiene:",
                         ["Todos los vértices de grado par o exactamente dos de grado impar",
                          "Al menos un ciclo", "Todos los vértices del mismo grado",
                          "Un número par de aristas"], 0),
                        ("Un árbol con 12 vértices tiene:",
                         ["11 aristas", "12 aristas", "13 aristas", "24 aristas"], 0),
                        ("El recorrido en anchura sobre un grafo no ponderado entrega:",
                         ["El camino de menor número de aristas",
                          "Todos los ciclos del grafo",
                          "El árbol de expansión de menor peso",
                          "Los vértices ordenados por grado"], 0),
                    ],
                },
            },
            {
                "id": "les-mt-04",
                "title": "Combinatoria y conteo",
                "video": "permutaciones y combinaciones ejercicios resueltos",
                "content": """
## Contar sin enumerar

La combinatoria responde "cuántos hay" sin listarlos. Dos principios sostienen
casi todo:

- **Producto:** si una tarea se hace en etapas independientes con `m` y `n`
  opciones, hay `m · n` resultados.
- **Suma:** si las alternativas son excluyentes, se suman.

## Permutaciones y combinaciones

La pregunta clave es siempre si el orden importa.

| Situación | Fórmula |
|---|---|
| Ordenar n elementos | `n!` |
| Elegir k de n con orden | `n! / (n-k)!` |
| Elegir k de n sin orden | `n! / (k!·(n-k)!)` |

Elegir tres estudiantes para tres cargos distintos no es lo mismo que elegir
tres para un comité: en el primer caso el orden distingue, en el segundo no.

## El principio del palomar

Si hay más objetos que cajas, alguna caja recibe al menos dos. Parece trivial y
sirve para demostraciones fuertes: entre 13 personas, dos cumplen años el mismo
mes, sin saber nada de ellas. Aparece en informática al razonar sobre
colisiones: si el espacio de valores es menor que el de entradas, alguna
colisión es inevitable.

## Aplicación al curso

Un cuestionario con cuatro preguntas de cuatro opciones tiene `4^4 = 256`
formas de responderse, de las cuales una sola es correcta. Ese número explica
por qué adivinar sistemáticamente no funciona, y también por qué conviene
mezclar el orden de las opciones entre estudiantes.

{video}

## Actividad

Calcular cuántos cuestionarios distintos se pueden armar eligiendo 4 preguntas
de un banco de 15, y cuántos si además importa el orden en que se presentan.
""",
                "quiz": {
                    "id": "qz-mt-04", "title": "Control: combinatoria", "value": 20,
                    "description": "Preguntas sobre la lección [[les-mt-04]].",
                    "questions": [
                        ("Elegir 3 estudiantes de 10 para un comité (sin cargos) se cuenta con:",
                         ["10!", "10! / 7!", "10! / (3!·7!)", "3^10"], 2),
                        ("El principio del palomar garantiza que:",
                         ["Toda caja recibe al menos un objeto",
                          "Si hay más objetos que cajas, alguna caja recibe al menos dos",
                          "Los objetos se reparten por igual",
                          "El número de cajas debe ser par"], 1),
                        ("¿Cuántas formas hay de responder un cuestionario de 4 preguntas con 4 opciones cada una?",
                         ["16", "24", "64", "256"], 3),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-matdis", "title": "Examen final: Matemática Discreta", "value": 100,
            "description": "Evaluación integradora. Material permitido: [[lib-mt-verdad]].",
            "questions": [
                ("Afirmar el consecuente (de p → q y q concluir p) es:",
                 ["Una regla válida", "Una falacia: no se puede concluir p",
                  "Equivalente a modus tollens", "Válido solo si p es verdadera"], 1),
                ("En un grupo de 40 estudiantes, 24 llevan Redes, 18 Bases de Datos y 9 ambas. ¿Cuántos no llevan ninguna?",
                 ["5", "7", "9", "13"], 1),
                ("Los cuatro vértices de grado impar de Königsberg implican que:",
                 ["Existe un recorrido euleriano cerrado",
                  "No existe ningún recorrido que use cada puente exactamente una vez",
                  "El grafo no es conexo",
                  "Hay exactamente cuatro caminos posibles"], 1),
                ("Un árbol de expansión de un grafo conexo con n vértices tiene:",
                 ["n aristas", "n-1 aristas", "n+1 aristas", "2n aristas"], 1),
                ("Si el espacio de valores de una función es menor que el de entradas, entonces:",
                 ["La función es inyectiva",
                  "Necesariamente hay colisiones, por el principio del palomar",
                  "La función no está definida",
                  "Depende del orden de las entradas"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-mt-1", "author": "est-07", "created": "2026-03-30T21:15:00Z",
                "title": "No me entra que la implicación sea verdadera con antecedente falso",
                "body": """
Leí [[les-mt-01]] y la tabla de [[lib-mt-verdad]] varias veces. Entiendo el
mecanismo pero no le encuentro sentido: si no hay enlace, ¿por qué digo que
"si hay enlace entonces sincroniza" es verdadera?
""",
                "likes": ["est-04", "est-08", "est-10", "est-12"],
                "replies": [
                    {
                        "id": "fp-mt-1r1", "author": "doc-vasquez", "created": "2026-03-31T07:30:00Z",
                        "body": """
Piénselo como una promesa, no como una causa. Usted promete que cuando haya
enlace, sincroniza. Si nunca hubo enlace, ¿rompió la promesa? No. Y una
promesa que no se rompió cuenta como cumplida. La implicación es falsa solo
cuando se daba la condición y no se cumplió lo prometido.
""",
                        "likes": ["est-07", "est-04", "est-01", "est-05", "est-09"],
                    },
                    {
                        "id": "fp-mt-1r2", "author": "est-04", "created": "2026-03-31T10:05:00Z",
                        "body": """
A mí me ayudó verlo con la equivalencia p → q ≡ ¬p ∨ q. Si p es falsa, ¬p es
verdadera y la disyunción ya es verdadera sin mirar q. Es la misma cosa dicha
sin hablar de promesas.
""",
                        "likes": ["est-07", "est-11"],
                    },
                ],
            },
            {
                "id": "fp-mt-2", "author": "est-05", "created": "2026-05-19T17:40:00Z",
                "title": "Grafo de enlaces entre lecciones: ¿dirigido o no?",
                "body": """
Para la actividad de [[les-mt-03]] armé el grafo de los enlaces internos entre
lecciones. Pero un enlace apunta en un sentido: la lección A cita a B y B no
necesariamente cita a A. ¿Lo modelo como grafo dirigido entonces?
""",
                "likes": ["est-02", "est-06"],
                "replies": [
                    {
                        "id": "fp-mt-2r1", "author": "doc-vasquez", "created": "2026-05-19T20:10:00Z",
                        "body": """
Buena pregunta, y la respuesta correcta es dirigido. Lo que hace interesante el
caso es que el grado se parte en dos: cuántas lecciones cita una (grado de
salida) y cuántas la citan (grado de entrada). Para el criterio de Euler que
vimos hay que trabajar con la versión no dirigida; si usan la dirigida, la
condición cambia y conviene decirlo explícitamente en el informe.
""",
                        "likes": ["est-05", "est-02", "est-06", "est-03"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-fisica",
        "title": "Física General",
        "category": "Física",
        "description": "Mecánica y electricidad básica con mediciones hechas en el laboratorio de la institución: cinemática, leyes de Newton, energía y circuitos de corriente continua.",
        "lessons": [
            {
                "id": "les-fs-01",
                "title": "Cinemática del movimiento rectilíneo",
                "video": "movimiento rectilíneo uniformemente acelerado ejercicios",
                "content": """
## Describir antes de explicar

La cinemática describe el movimiento sin preguntarse por sus causas. Tres
magnitudes bastan: posición, velocidad y aceleración, todas respecto de un
sistema de referencia que hay que declarar antes de escribir cualquier número.

## Movimiento uniforme y acelerado

Con velocidad constante:

```
x = x₀ + v·t
```

Con aceleración constante:

```
v = v₀ + a·t
x = x₀ + v₀·t + ½·a·t²
v² = v₀² + 2·a·(x - x₀)
```

La tercera es la que ahorra tiempo cuando el enunciado no menciona el tiempo.

## Signos

El error más común no es de fórmula, es de signo. Si se toma hacia arriba como
positivo, la aceleración de la gravedad vale `-9,8 m/s²` y hay que mantener ese
criterio durante todo el problema. Cambiarlo a mitad del desarrollo produce
resultados que parecen razonables y no lo son.

## Interpretar gráficas

| Gráfica | La pendiente representa | El área bajo la curva representa |
|---|---|---|
| Posición vs. tiempo | Velocidad | — |
| Velocidad vs. tiempo | Aceleración | Desplazamiento |

Leer bien estas dos gráficas resuelve más problemas que memorizar fórmulas.

## Caída libre

Sin resistencia del aire todos los cuerpos caen con la misma aceleración,
independientemente de la masa. Con aire ya no: una hoja y una piedra caen
distinto por el arrastre, no porque la gravedad las trate diferente. Conviene
decir siempre qué se está despreciando.

{video}

## Actividad

Medir con cronómetro el tiempo de caída de un objeto desde tres alturas
distintas, cinco repeticiones cada una. Calcular `g` y comparar con el valor
aceptado, discutiendo el error de reacción al cronometrar.
""",
                "quiz": {
                    "id": "qz-fs-01", "title": "Control: cinemática", "value": 20,
                    "description": "Preguntas sobre la lección [[les-fs-01]].",
                    "questions": [
                        ("En una gráfica de velocidad frente al tiempo, el área bajo la curva representa:",
                         ["La aceleración", "El desplazamiento",
                          "La velocidad media", "La fuerza aplicada"], 1),
                        ("Un cuerpo parte del reposo con a = 2 m/s². ¿Qué distancia recorre en 3 s?",
                         ["3 m", "6 m", "9 m", "18 m"], 2),
                        ("En caída libre sin resistencia del aire, la masa del cuerpo:",
                         ["Aumenta la aceleración", "Disminuye la aceleración",
                          "No influye en la aceleración", "Cambia el signo de la aceleración"], 2),
                    ],
                },
            },
            {
                "id": "les-fs-02",
                "title": "Leyes de Newton",
                "video": "leyes de Newton explicación ejemplos",
                "content": """
## Las tres leyes

[[lib-fs-newton]]

1. **Inercia.** Un cuerpo mantiene su velocidad mientras la fuerza neta sea
   nula. Estar en reposo y moverse con velocidad constante son, dinámicamente,
   la misma situación.
2. **Fuerza y aceleración.** `F = m·a`, con `F` la suma vectorial de todas las
   fuerzas. La aceleración va en la dirección de la fuerza neta.
3. **Acción y reacción.** Las fuerzas aparecen en pares sobre cuerpos
   distintos, con igual módulo y sentido opuesto.

## El diagrama de cuerpo libre

Es el paso que no se puede saltar. Se aísla el cuerpo, se dibuja cada fuerza
que actúa **sobre él** y solo esas. Dos errores típicos: dibujar la fuerza que
el cuerpo ejerce sobre otro (esa va en el otro diagrama) e inventar una "fuerza
de movimiento" en la dirección del avance, que no existe.

## Peso y normal

El peso es `m·g` y apunta al centro de la Tierra. La normal es la reacción de
la superficie, perpendicular a ella. Son iguales en módulo solo en el caso
particular de una superficie horizontal sin aceleración vertical: en un plano
inclinado la normal vale `m·g·cos(θ)`.

## Rozamiento

La fuerza de rozamiento se opone al movimiento relativo y vale
`f = μ·N`. El coeficiente estático es mayor que el dinámico, y de ahí sale algo
que se comprueba a diario: cuesta más iniciar el movimiento de una caja que
mantenerla deslizando.

{video}

## Actividad

Determinar experimentalmente el coeficiente de rozamiento estático inclinando
un plano hasta que el bloque comience a deslizar, y comparar con el valor
dinámico medido al mantener velocidad constante. Repasar signos en
[[les-fs-01]].
""",
                "quiz": {
                    "id": "qz-fs-02", "title": "Control: leyes de Newton", "value": 20,
                    "description": "Preguntas sobre la lección [[les-fs-02]] y el retrato de [[lib-fs-newton]].",
                    "questions": [
                        ("En un diagrama de cuerpo libre se dibujan:",
                         ["Todas las fuerzas del sistema",
                          "Solo las fuerzas que actúan sobre el cuerpo aislado",
                          "Las fuerzas que el cuerpo ejerce sobre otros",
                          "Las velocidades y aceleraciones"], 1),
                        ("Sobre un plano inclinado un ángulo θ, la fuerza normal vale:",
                         ["m·g", "m·g·sen(θ)", "m·g·cos(θ)", "m·g·tan(θ)"], 2),
                        ("Cuesta más iniciar el deslizamiento de una caja que mantenerla en movimiento porque:",
                         ["El peso aumenta al moverse",
                          "El coeficiente de rozamiento estático es mayor que el dinámico",
                          "La normal disminuye con el movimiento",
                          "La inercia desaparece al moverse"], 1),
                    ],
                },
            },
            {
                "id": "les-fs-03",
                "title": "Trabajo, energía y conservación",
                "video": "conservación de la energía mecánica péndulo",
                "content": """
## Trabajo

El trabajo de una fuerza constante es `W = F·d·cos(θ)`, donde `θ` es el ángulo
entre fuerza y desplazamiento. Consecuencias que sorprenden al principio: una
fuerza perpendicular al movimiento no hace trabajo, y sostener un peso sin
moverlo tampoco, aunque el brazo se cansa.

## Energía mecánica

- Cinética: `Ec = ½·m·v²`
- Potencial gravitatoria: `Ep = m·g·h`, con la altura medida desde un nivel de
  referencia que se elige libremente.

La suma es la energía mecánica. Si solo actúan fuerzas conservativas, se
conserva: lo que se pierde de potencial aparece como cinética.

[[lib-fs-pendulo]]

## El péndulo

En el punto más alto la velocidad es nula y la energía es toda potencial. En el
punto más bajo es toda cinética. En cualquier punto intermedio la suma es la
misma. Esa igualdad permite calcular la velocidad máxima sin resolver ninguna
ecuación de movimiento:

```
v_max = √(2·g·h)
```

## Cuando no se conserva

Con rozamiento la energía mecánica disminuye, pero no desaparece: se transforma
en calor. Un péndulo real reduce su amplitud hasta detenerse. Medir esa pérdida
por ciclo es una forma directa de cuantificar la disipación.

{video}

## Actividad

Soltar un péndulo desde 20 cm de altura, medir la velocidad en el punto bajo
con dos sensores y comparar con el valor teórico. Estimar el porcentaje de
energía disipado en el primer ciclo.
""",
                "quiz": {
                    "id": "qz-fs-03", "title": "Control: trabajo y energía", "value": 20,
                    "description": "Preguntas sobre la lección [[les-fs-03]] y el video [[lib-fs-pendulo]].",
                    "questions": [
                        ("Una fuerza perpendicular al desplazamiento realiza un trabajo:",
                         ["Máximo", "Nulo", "Negativo", "Igual a F·d"], 1),
                        ("En el punto más bajo de un péndulo ideal, la energía es:",
                         ["Toda potencial", "Toda cinética",
                          "Mitad y mitad", "Nula"], 1),
                        ("En un péndulo real la amplitud disminuye porque:",
                         ["La energía desaparece",
                          "Parte de la energía mecánica se transforma en calor por rozamiento",
                          "La gravedad cambia con la altura",
                          "La masa disminuye"], 1),
                    ],
                },
            },
            {
                "id": "les-fs-04",
                "title": "Circuitos de corriente continua",
                "video": "ley de Ohm circuitos serie paralelo ejercicios",
                "content": """
## Las tres magnitudes

La corriente es carga por unidad de tiempo (amperios), la tensión es la
diferencia de potencial que la impulsa (voltios) y la resistencia opone paso
(ohmios). La ley de Ohm las relaciona:

```
V = I · R
```

[[lib-fs-circuito]]

## Serie y paralelo

| Conexión | Resistencia equivalente | Qué se comparte |
|---|---|---|
| Serie | `R = R₁ + R₂ + …` | La misma corriente |
| Paralelo | `1/R = 1/R₁ + 1/R₂ + …` | La misma tensión |

En paralelo la resistencia equivalente siempre es menor que la más pequeña de
las ramas. Si el resultado sale mayor, hay un error de cálculo.

## Leyes de Kirchhoff

1. **Nodos:** la suma de corrientes que entran a un nodo iguala la que sale.
2. **Mallas:** la suma de diferencias de potencial en un lazo cerrado es cero.

Con esas dos se resuelve cualquier circuito resistivo, aunque no se reduzca a
combinaciones simples de serie y paralelo.

## Potencia

`P = V·I`, y sustituyendo con la ley de Ohm, `P = I²·R`. Esa forma explica algo
práctico para el servidor de borde: la pérdida en un cable crece con el
**cuadrado** de la corriente, así que un cable delgado alimentando varios
servos se calienta mucho más de lo que uno esperaría, y la tensión que llega al
extremo cae.

{video}

## Actividad

Armar un divisor de tensión con dos resistencias, medir con el multímetro y
comparar con el cálculo. Repetir con una carga conectada a la salida y explicar
la diferencia observada.
""",
                "quiz": {
                    "id": "qz-fs-04", "title": "Control: circuitos", "value": 20,
                    "description": "Preguntas sobre la lección [[les-fs-04]] y el esquema [[lib-fs-circuito]].",
                    "questions": [
                        ("Dos resistencias de 10 Ω en paralelo equivalen a:",
                         ["20 Ω", "10 Ω", "5 Ω", "2,5 Ω"], 2),
                        ("La ley de nodos de Kirchhoff establece que:",
                         ["La tensión es igual en todas las ramas",
                          "La corriente que entra a un nodo iguala la que sale",
                          "La suma de resistencias en un lazo es cero",
                          "La potencia se conserva en cada rama"], 1),
                        ("Duplicar la corriente en un cable multiplica su pérdida de potencia por:",
                         ["2", "3", "4", "8"], 2),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-fisica", "title": "Examen final: Física General", "value": 100,
            "description": "Evaluación integradora de mecánica y electricidad.",
            "questions": [
                ("Un móvil con v₀ = 5 m/s y a = 2 m/s² alcanza los 15 m/s en:",
                 ["2 s", "5 s", "7,5 s", "10 s"], 1),
                ("La tercera ley de Newton implica que las fuerzas de un par acción-reacción:",
                 ["Se aplican al mismo cuerpo y se cancelan",
                  "Se aplican a cuerpos distintos, con igual módulo y sentido opuesto",
                  "Tienen módulos distintos según la masa",
                  "Solo existen en el reposo"], 1),
                ("Un cuerpo cae desde 1,8 m. Su velocidad al llegar al suelo (sin rozamiento) es aproximadamente:",
                 ["3 m/s", "6 m/s", "9,8 m/s", "18 m/s"], 1),
                ("Tres resistencias iguales de 6 Ω en serie equivalen a:",
                 ["2 Ω", "6 Ω", "12 Ω", "18 Ω"], 3),
                ("Sostener una caja inmóvil a un metro del suelo implica un trabajo mecánico:",
                 ["Igual al peso por la altura", "Nulo, porque no hay desplazamiento",
                  "Negativo", "Igual a la energía cinética"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-fs-1", "author": "est-09", "created": "2026-04-08T13:25:00Z",
                "title": "Me da g = 11,2 m/s² en la práctica de caída",
                "body": """
Hice la actividad de [[les-fs-01]] con tres alturas y cinco repeticiones. Me
sale g = 11,2 m/s², bastante arriba del valor aceptado. Las alturas las medí
con cinta métrica y el tiempo con el cronómetro del teléfono. ¿Repito todo?
""",
                "likes": ["est-01", "est-03"],
                "replies": [
                    {
                        "id": "fp-fs-1r1", "author": "doc-vasquez", "created": "2026-04-08T16:50:00Z",
                        "body": """
No hace falta repetir todo, hace falta explicar la desviación. Con cronómetro
manual el tiempo de reacción es de unas décimas y en caídas cortas eso pesa
muchísimo: si el tiempo medido resulta menor que el real, g sale mayor. Suban
la altura para que el tiempo total crezca y el error relativo baje. Y anoten la
desviación de las cinco repeticiones, no solo el promedio.
""",
                        "likes": ["est-09", "est-03", "est-06", "est-11"],
                    },
                    {
                        "id": "fp-fs-1r2", "author": "est-03", "created": "2026-04-09T08:15:00Z",
                        "body": """
Confirmo lo de la altura. Repetí desde 2,5 m en lugar de 1 m y me pasó de
11,5 a 10,1 m/s² sin cambiar nada más del procedimiento.
""",
                        "likes": ["est-09", "doc-vasquez"],
                    },
                ],
            },
            {
                "id": "fp-fs-2", "author": "est-02", "created": "2026-06-15T11:10:00Z",
                "title": "El divisor de tensión cambia al conectar la carga",
                "body": """
En la práctica de [[les-fs-04]] el divisor medía justo lo calculado, pero al
conectar el módulo de servos la salida se cayó bastante. ¿El cálculo estaba
mal?
""",
                "likes": ["est-07"],
                "replies": [
                    {
                        "id": "fp-fs-2r1", "author": "est-07", "created": "2026-06-15T14:35:00Z",
                        "body": """
El cálculo está bien para el divisor solo. Al conectar la carga, esa carga
queda en paralelo con la resistencia de abajo, y como en paralelo la
equivalente baja, la tensión de salida baja también. Es el mismo asunto de la
tabla de serie y paralelo.
""",
                        "likes": ["est-02", "doc-vasquez", "est-05"],
                    },
                    {
                        "id": "fp-fs-2r2", "author": "doc-vasquez", "created": "2026-06-16T07:40:00Z",
                        "body": """
Correcto. Y de ahí la conclusión práctica: un divisor resistivo no sirve como
fuente de alimentación, solo como referencia de tensión para algo que consuma
muy poca corriente. Para alimentar los servos de [[les-rb-03]] hace falta una
fuente regulada, no un divisor.
""",
                        "likes": ["est-02", "est-07", "est-04", "est-12"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-bioamazonia",
        "title": "Biología Amazónica",
        "category": "Biología",
        "description": "Biodiversidad, dinámica fluvial y conservación del bioma amazónico, articulando el trabajo de campo con el conocimiento de las comunidades locales.",
        "lessons": [
            {
                "id": "les-bio-01",
                "title": "Biodiversidad del bioma amazónico",
                "video": "biodiversidad amazonía documental especies",
                "content": """
## Una escala difícil de imaginar

La cuenca amazónica cubre más de seis millones de kilómetros cuadrados y
alberga una fracción enorme de las especies conocidas de plantas vasculares,
aves, peces de agua dulce y anfibios. La cifra exacta cambia según la fuente y
el año, porque cada campaña de campo describe especies nuevas.

[[lib-bio-guacamayo]]

## Por qué tanta diversidad

- **Estabilidad climática prolongada**, que permitió acumulación de linajes.
- **Heterogeneidad de hábitats:** tierra firme, várzea, igapó, aguajales.
- **Los ríos como barreras**, que separan poblaciones y favorecen la
  diferenciación.
- **Estratificación vertical del bosque:** el dosel, el subdosel y el suelo son
  ambientes distintos con faunas distintas.

## Estratos del bosque

| Estrato | Altura aproximada | Fauna característica |
|---|---|---|
| Emergentes | 40–60 m | Águila harpía, guacamayos |
| Dosel | 20–40 m | Monos, perezosos, epífitas |
| Subdosel | 5–20 m | Aves insectívoras, serpientes arborícolas |
| Suelo | 0–5 m | Roedores, hormigas, hojarasca |

## Un depredador del agua

[[lib-bio-anaconda]]

La anaconda verde es el ejemplo habitual de adaptación al medio acuático:
narinas y ojos en posición dorsal para acechar apenas asomada, constricción en
lugar de veneno y dependencia de cuerpos de agua permanentes. Su presencia
suele indicar un humedal en buen estado, así que sirve como especie indicadora.

## El suelo, un mito frecuente

Se supone que un bosque tan exuberante crece sobre suelo riquísimo. Es al
contrario: buena parte de los suelos son pobres y los nutrientes están en la
biomasa viva, reciclados con rapidez por hongos y descomponedores. Al retirar
la cobertura, la fertilidad se agota en pocas cosechas. Eso explica por qué el
desmonte para agricultura rinde poco tiempo.

{video}

## Actividad

Realizar un transecto de 50 m en el bosque cercano, registrar todas las
especies vegetales identificables por estrato y elaborar la tabla comparativa.
""",
                "quiz": {
                    "id": "qz-bio-01", "title": "Control: biodiversidad", "value": 20,
                    "description": "Preguntas sobre la lección [[les-bio-01]] y las imágenes [[lib-bio-guacamayo]] y [[lib-bio-anaconda]].",
                    "questions": [
                        ("Los suelos de gran parte de la Amazonía son:",
                         ["Muy fértiles, lo que explica la exuberancia del bosque",
                          "Pobres: los nutrientes están sobre todo en la biomasa viva",
                          "Ricos en arcilla y sin materia orgánica",
                          "Iguales a los de zonas templadas"], 1),
                        ("Los grandes ríos favorecen la diversificación porque:",
                         ["Aportan nutrientes al dosel",
                          "Actúan como barreras que separan poblaciones",
                          "Reducen la humedad ambiental",
                          "Impiden la estratificación vertical"], 1),
                        ("Una adaptación de la anaconda al medio acuático es:",
                         ["El veneno neurotóxico",
                          "La posición dorsal de ojos y narinas",
                          "Las escamas quilladas para trepar",
                          "La incubación de huevos en el nido"], 1),
                    ],
                },
            },
            {
                "id": "les-bio-02",
                "title": "El río: pulso de inundación y ciclo del agua",
                "video": "río Amazonas ciclo del agua pulso de inundación",
                "content": """
## El río manda

En la Amazonía el calendario ecológico no lo marca la temperatura sino el nivel
del agua. La creciente y la bajante estructuran la reproducción de los peces,
la fructificación de muchos árboles y las actividades humanas.

[[lib-bio-rio]]

## Tres tipos de agua

| Tipo | Color | Origen | Ejemplo |
|---|---|---|---|
| Blanca | Turbio claro | Sedimentos andinos | Amazonas, Ucayali |
| Negra | Té oscuro | Ácidos húmicos de suelos arenosos | Río Negro |
| Clara | Transparente verdoso | Escudos antiguos erosionados | Tapajós |

Las aguas blancas son las más productivas por su carga de sedimentos; las
negras son ácidas y pobres en nutrientes, con menos mosquitos y una fauna
particular adaptada a esas condiciones.

## Los ríos volantes

La selva no solo recibe lluvia: la produce. Una parte importante de la
precipitación proviene de la evapotranspiración del propio bosque, que devuelve
humedad a la atmósfera y la traslada hacia el sur del continente. Esto convierte
la deforestación en un problema climático regional y no solo local.

## El pulso de inundación

Durante la creciente el agua entra al bosque varios metros y los peces se
dispersan entre los árboles alimentándose de frutos y semillas. Muchas especies
vegetales dependen de ellos para dispersar sus semillas: es una relación de
mutualismo que solo funciona si el pulso mantiene su régimen. Alterar el nivel
del río con obras hidráulicas rompe ese acople.

{video}

## Actividad

Con la serie de niveles del río que entrega el docente, graficar el pulso anual,
identificar creciente y bajante y relacionarlas con dos actividades productivas
de la comunidad.
""",
                "quiz": {
                    "id": "qz-bio-02", "title": "Control: dinámica fluvial", "value": 20,
                    "description": "Preguntas sobre la lección [[les-bio-02]] y la imagen [[lib-bio-rio]].",
                    "questions": [
                        ("Las aguas blancas se caracterizan por:",
                         ["Ser ácidas y pobres en nutrientes",
                          "Transportar sedimentos de origen andino y ser muy productivas",
                          "Tener color oscuro por ácidos húmicos",
                          "Ser transparentes y de escudos antiguos"], 1),
                        ("Los llamados ríos volantes se refieren a:",
                         ["Los afluentes de curso rápido",
                          "El transporte atmosférico de humedad generada por el propio bosque",
                          "Los canales artificiales de riego",
                          "Los ríos que cambian de cauce cada año"], 1),
                        ("Durante el pulso de inundación, muchos peces cumplen la función de:",
                         ["Reducir la turbidez del agua",
                          "Dispersar semillas de árboles del bosque inundado",
                          "Fijar nitrógeno en el suelo",
                          "Polinizar las flores del dosel"], 1),
                    ],
                },
            },
            {
                "id": "les-bio-03",
                "title": "Bosques inundables: várzea e igapó",
                "video": "bosques inundables varzea igapo ecologia amazonica clase",
                "content": """
## Dos bosques bajo el agua

Los bosques inundables se clasifican según el tipo de agua que los inunda, y la
diferencia no es un detalle taxonómico: determina la fertilidad, la fauna y el
uso humano posible.

[[lib-bio-varzea]]

- **Várzea:** inundada por aguas blancas, ricas en sedimentos. Suelos fértiles
  renovados cada año, alta productividad, buena para agricultura de ciclo corto
  aprovechando la bajante.
- **Igapó:** inundada por aguas negras, ácidas y pobres. Crecimiento más lento,
  menor productividad, especies con adaptaciones a la falta de nutrientes.

## Sobrevivir sumergido

Estar semanas o meses con las raíces bajo el agua exige adaptaciones concretas:
raíces adventicias que buscan oxígeno, lenticelas en el tronco, tolerancia a
la anoxia y sincronización de la floración con la bajante.

[[lib-bio-victoria]]

La *Victoria amazonica* es el caso más citado de adaptación a aguas quietas:
hojas flotantes de hasta tres metros con nervaduras que funcionan como
estructura y espinas en el envés que la protegen de los peces herbívoros.

## Servicios y presiones

Estos bosques regulan la crecida absorbiendo agua, retienen sedimentos y
sostienen la pesca de la que viven muchas comunidades. Las presiones más
frecuentes son la ganadería en la várzea durante la bajante, la extracción
selectiva de madera y la alteración del régimen del río, que ya vimos en
[[les-bio-02]].

{video}

## Actividad

Comparar dos parcelas, una de várzea y otra de tierra firme, midiendo altura
del dosel, diámetro de los árboles y número de especies. Discutir a qué se
deben las diferencias.
""",
                "quiz": {
                    "id": "qz-bio-03", "title": "Control: bosques inundables", "value": 20,
                    "description": "Preguntas sobre la lección [[les-bio-03]], con [[lib-bio-varzea]] y [[lib-bio-victoria]].",
                    "questions": [
                        ("La diferencia esencial entre várzea e igapó es:",
                         ["La altura del dosel",
                          "El tipo de agua que los inunda y por tanto su fertilidad",
                          "La duración de la inundación",
                          "La latitud en que se encuentran"], 1),
                        ("Las lenticelas y raíces adventicias son adaptaciones para:",
                         ["Captar más luz", "Obtener oxígeno cuando el suelo está inundado",
                          "Resistir el fuego", "Dispersar semillas"], 1),
                        ("Las espinas del envés de las hojas de Victoria amazonica cumplen la función de:",
                         ["Aumentar la flotación", "Protegerla de peces herbívoros",
                          "Captar humedad del aire", "Anclarla al fondo"], 1),
                    ],
                },
            },
            {
                "id": "les-bio-04",
                "title": "Conservación y monitoreo comunitario",
                "video": "monitoreo comunitario conservación amazonía",
                "content": """
## Las presiones reales

La pérdida de bosque no responde a una sola causa. Las principales son la
expansión agrícola y ganadera, la apertura de vías que abre acceso a zonas
antes remotas, la minería aluvial (que además libera mercurio en los ríos) y
la extracción selectiva de madera, que degrada sin llegar a deforestar y por
eso pasa desapercibida en las estadísticas.

## Áreas protegidas no bastan

Un área declarada sin presupuesto ni presencia en el territorio es un dibujo en
un mapa. Lo que funciona sostenidamente combina tres cosas: reconocimiento de
los territorios indígenas, actividades productivas compatibles con el bosque en
pie y vigilancia hecha por quienes viven ahí.

## Monitoreo con datos locales

El monitoreo comunitario registra variables sencillas y sostenibles en el
tiempo: nivel del río, capturas de pesca por jornada, avistamientos de fauna,
fenología de especies clave. Su valor está en la continuidad y en la resolución
local, cosas que ninguna imagen satelital aporta.

Aquí es donde encaja el servidor de borde: el registro se hace sin conexión,
queda guardado localmente y se sincroniza cuando aparece enlace, tal como se
describe en [[les-sd-04]]. La comunidad conserva sus propios datos en lugar de
depender de que alguien externo los lleve y los devuelva.

## Saberes locales

Los calendarios de pesca, los nombres de las especies y las señales de creciente
que manejan las comunidades son conocimiento acumulado por generaciones de
observación. Integrarlos no es un gesto simbólico: mejora la calidad del dato y
evita repetir mediciones que ya existían.

{video}

## Actividad

Diseñar una ficha de monitoreo de máximo diez campos que un pescador pueda
llenar en dos minutos. Justificar cada campo y qué decisión permite tomar.
""",
                "quiz": {
                    "id": "qz-bio-04", "title": "Control: conservación", "value": 20,
                    "description": "Preguntas sobre la lección [[les-bio-04]].",
                    "questions": [
                        ("La extracción selectiva de madera es problemática porque:",
                         ["Deforesta grandes superficies de una vez",
                          "Degrada el bosque sin aparecer claramente en las estadísticas de deforestación",
                          "Solo afecta especies sin valor comercial",
                          "Aumenta la fertilidad del suelo"], 1),
                        ("El principal valor del monitoreo comunitario está en:",
                         ["Sustituir a las imágenes satelitales",
                          "Su continuidad en el tiempo y su resolución local",
                          "Su bajo costo únicamente",
                          "Requerir conexión permanente a internet"], 1),
                        ("Un servidor de borde aporta al monitoreo comunitario porque:",
                         ["Permite registrar sin conexión y sincronizar cuando haya enlace",
                          "Reemplaza la ficha de campo en papel por obligación",
                          "Envía los datos en tiempo real siempre",
                          "Elimina la necesidad de validar los datos"], 0),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-bioamazonia", "title": "Examen final: Biología Amazónica", "value": 100,
            "description": "Evaluación integradora del bioma, su dinámica y su conservación.",
            "questions": [
                ("Al retirar la cobertura vegetal, la fertilidad del suelo amazónico se agota rápido porque:",
                 ["El suelo es arcilloso",
                  "Los nutrientes estaban en la biomasa viva y su reciclaje se interrumpe",
                  "Aumenta la acidez por la lluvia",
                  "Desaparecen los ríos volantes"], 1),
                ("Un río de aguas negras se caracteriza por:",
                 ["Alta carga de sedimentos andinos",
                  "Ser ácido y pobre en nutrientes, con color oscuro por ácidos húmicos",
                  "Transparencia total y fondo rocoso",
                  "Nivel constante todo el año"], 1),
                ("La várzea es más apta que el igapó para agricultura de ciclo corto porque:",
                 ["Se inunda menos tiempo",
                  "Sus suelos se renuevan cada año con sedimentos de aguas blancas",
                  "Tiene menos especies arbóreas",
                  "El agua es más profunda"], 1),
                ("La deforestación amazónica tiene efectos climáticos más allá de la zona talada porque:",
                 ["Aumenta la temperatura global de inmediato",
                  "El bosque genera y transporta humedad atmosférica hacia otras regiones",
                  "Modifica la órbita de los vientos alisios",
                  "Reduce el caudal de los ríos andinos"], 1),
                ("Una ficha de monitoreo comunitario bien diseñada debe:",
                 ["Registrar el máximo número de variables posible",
                  "Ser breve y sostenible en el tiempo, con campos que permitan decidir algo",
                  "Requerir un técnico externo para llenarse",
                  "Enviarse por internet en el momento"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-bio-1", "author": "est-01", "created": "2026-04-30T09:40:00Z",
                "title": "En mi comunidad el pulso del río se corrió casi un mes",
                "body": """
Mi abuelo dice que antes la creciente empezaba a mediados de febrero y ahora
llega casi en marzo. En [[les-bio-02]] vimos que muchas especies dependen del
régimen del pulso. ¿Ese corrimiento alcanza para afectar la reproducción de los
peces o es variación normal entre años?
""",
                "likes": ["est-05", "est-08", "est-09", "doc-vasquez"],
                "replies": [
                    {
                        "id": "fp-bio-1r1", "author": "doc-vasquez", "created": "2026-04-30T15:20:00Z",
                        "body": """
La variación entre años siempre existió, así que un año corrido no prueba nada.
Lo que hay que mirar es la tendencia en una serie larga, y ahí es donde el
registro de su abuelo vale tanto como el instrumental: son décadas de
observación. Sería un excelente trabajo comparar lo que él recuerda con la
serie de niveles que tenemos desde 2004.
""",
                        "likes": ["est-01", "est-05", "est-11", "est-03"],
                    },
                    {
                        "id": "fp-bio-1r2", "author": "est-05", "created": "2026-05-01T11:05:00Z",
                        "body": """
Si lo hacen, cuenten conmigo. Mi familia pesca en el mismo brazo del río y
tenemos anotadas las jornadas buenas y malas de los últimos cuatro años en un
cuaderno. Se podría cargar como archivo en la biblioteca y trabajarlo con la
ficha de [[les-bio-04]].
""",
                        "likes": ["est-01", "doc-vasquez", "est-09"],
                    },
                ],
            },
            {
                "id": "fp-bio-2", "author": "est-08", "created": "2026-06-22T18:00:00Z",
                "title": "Dudas con el transecto: ¿qué hago con lo que no puedo identificar?",
                "body": """
Hice el transecto de [[les-bio-01]] y de 34 individuos registrados solo pude
identificar 19 hasta especie. El resto los tengo por familia o directamente sin
identificar. ¿Los descarto de la tabla?
""",
                "likes": ["est-12"],
                "replies": [
                    {
                        "id": "fp-bio-2r1", "author": "doc-vasquez", "created": "2026-06-22T20:45:00Z",
                        "body": """
No se descarta nada. Se registra al nivel taxonómico que se pudo alcanzar y se
anota como indeterminado lo demás, con una foto y la descripción de la hoja y
la corteza. Descartar lo no identificado sesga el conteo hacia las especies
fáciles de reconocer, que suelen ser las comunes, y el resultado diría que hay
menos diversidad de la que hay.
""",
                        "likes": ["est-08", "est-12", "est-02", "est-06"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-go",
        "title": "Programación en Go",
        "category": "Programación",
        "description": "El lenguaje con el que está escrito el servidor de RADIX: tipos, structs, concurrencia con goroutines y canales, manejo de errores y pruebas.",
        "lessons": [
            {
                "id": "les-go-01",
                "title": "Tipos, variables y control de flujo",
                "video": "curso Go golang variables tipos básico",
                "content": """
## Un lenguaje deliberadamente pequeño

Go tiene pocas construcciones y casi ninguna forma alternativa de hacer lo
mismo. Eso hace el lenguaje aburrido de aprender y fácil de leer meses después,
que es exactamente lo que se busca en un servidor que hay que mantener.

[[lib-go-gopher]]

## Declaraciones y valor cero

```go
var intentos int          // 0
var nombre string         // ""
var listo bool            // false
puerto := 1323            // tipo inferido
```

Toda variable declarada sin valor recibe el **valor cero** de su tipo. No hay
memoria sin inicializar, y por eso no hace falta comprobar si una variable
"tiene basura". El compilador además rechaza variables locales declaradas y no
usadas: es un error, no una advertencia.

## Tipado estricto

No hay conversiones implícitas entre tipos numéricos. Sumar un `int` y un
`int64` no compila hasta convertir explícitamente. Resulta molesto al principio
y evita una categoría entera de errores silenciosos.

## Control de flujo

Un solo bucle, `for`, en tres presentaciones:

```go
for i := 0; i < 10; i++ { }        // clásico
for indice, valor := range lista { }  // recorrido
for { break }                       // infinito
```

El `switch` no necesita `break` y admite condiciones en lugar de valores:

```go
switch {
case nota >= 18:
    return "sobresaliente"
case nota >= 14:
    return "aprobado"
default:
    return "reprobado"
}
```

## Slices y mapas

Un slice es una vista sobre un arreglo, con longitud y capacidad. Un mapa es
una tabla asociativa cuyo recorrido tiene **orden aleatorio a propósito**, para
que nadie escriba código que dependa de un orden que no está garantizado. Si se
necesita orden, se ordenan las claves explícitamente.

{video}

## Actividad

Escribir una función que reciba un slice de notas y devuelva promedio, máximo y
mínimo, respetando el caso del slice vacío. Ver también [[lib-go-chuleta]].
""",
                "quiz": {
                    "id": "qz-go-01", "title": "Control: tipos y control de flujo", "value": 20,
                    "description": "Preguntas sobre la lección [[les-go-01]]. Material: [[lib-go-chuleta]].",
                    "questions": [
                        ("En Go, una variable local declarada y no utilizada produce:",
                         ["Una advertencia del compilador", "Un error de compilación",
                          "Un fallo en tiempo de ejecución", "Nada, se ignora"], 1),
                        ("El recorrido de un mapa en Go tiene orden:",
                         ["De inserción", "Alfabético por clave",
                          "Aleatorio a propósito", "Inverso al de inserción"], 2),
                        ("Sumar un int y un int64 sin conversión explícita:",
                         ["Compila y convierte automáticamente",
                          "No compila, porque Go no hace conversiones implícitas",
                          "Compila con advertencia",
                          "Provoca un error en ejecución"], 1),
                    ],
                },
            },
            {
                "id": "les-go-02",
                "title": "Structs, métodos e interfaces",
                "video": "Go structs métodos interfaces explicación",
                "content": """
## Composición en lugar de herencia

Go no tiene clases ni herencia. Se declaran estructuras de datos y funciones
asociadas a ellas, y para reutilizar se **compone**: una estructura contiene
otra en lugar de heredarla.

```go
type Leccion struct {
    ID       string
    Titulo   string
    Contenido string
}

func (l Leccion) Resumen() string {
    return l.ID + ": " + l.Titulo
}
```

## Receptor por valor o por puntero

El receptor por valor recibe una copia: cualquier modificación se pierde al
salir. Para modificar el original se usa puntero:

```go
func (l *Leccion) Renombrar(nuevo string) {
    l.Titulo = nuevo
}
```

Regla práctica: si algún método necesita puntero, conviene que todos lo usen,
por coherencia y para evitar confusiones al leer.

## Interfaces implícitas

Una interfaz declara métodos; cualquier tipo que los tenga la satisface, sin
declararlo en ninguna parte:

```go
type Almacen interface {
    GetLeccion(id string) (*Leccion, error)
}
```

Esto invierte lo habitual: la interfaz la define **quien consume**, con los
métodos que realmente usa, no quien implementa. Por eso en el servidor de RADIX
cada paquete declara su propia interfaz pequeña en lugar de compartir una
enorme: así cada uno depende solo de lo que le hace falta.

## Interfaces pequeñas

Una interfaz de un método es fácil de implementar y de simular en pruebas. Una
de veinte obliga a implementar diecinueve métodos vacíos para probar uno. La
convención de la comunidad es clara: cuanto más chica, mejor.

{video}

## Actividad

Definir una interfaz con los dos métodos que necesita una función de reporte,
implementarla con una estructura real y con otra falsa para pruebas.
""",
                "quiz": {
                    "id": "qz-go-02", "title": "Control: structs e interfaces", "value": 20,
                    "description": "Preguntas sobre la lección [[les-go-02]].",
                    "questions": [
                        ("Para que un método modifique la estructura receptora hace falta:",
                         ["Declarar la estructura como pública",
                          "Usar un receptor por puntero",
                          "Devolver la estructura modificada obligatoriamente",
                          "Usar una interfaz"], 1),
                        ("En Go, un tipo satisface una interfaz cuando:",
                         ["Lo declara explícitamente con implements",
                          "Tiene todos los métodos que la interfaz exige",
                          "Hereda del tipo base",
                          "Está en el mismo paquete que la interfaz"], 1),
                        ("Conviene que las interfaces sean pequeñas porque:",
                         ["Compilan más rápido",
                          "Son fáciles de implementar y de simular en pruebas",
                          "Permiten herencia múltiple",
                          "Evitan usar punteros"], 1),
                    ],
                },
            },
            {
                "id": "les-go-03",
                "title": "Concurrencia: goroutines y canales",
                "video": "goroutines canales Go concurrencia tutorial",
                "content": """
## Concurrencia no es paralelismo

Concurrencia es estructurar un programa como tareas independientes;
paralelismo es ejecutarlas al mismo tiempo en varios núcleos. Un programa
concurrente puede correr en un solo núcleo, y aun así el diseño concurrente
sirve: mientras una tarea espera la red, otra avanza.

## Goroutines

Una goroutine se lanza con `go` delante de una llamada. Arranca con unos pocos
kilobytes de pila que crecen según haga falta, así que miles de goroutines son
normales donde miles de hilos del sistema no lo serían.

```go
go persistirLogs()   // no bloquea al que la lanza
```

Cuidado: si `main` termina, el programa termina y las goroutines pendientes
mueren sin ejecutar nada más. Hace falta esperarlas explícitamente.

## Canales

El canal es la forma idiomática de comunicar goroutines: en lugar de compartir
memoria y protegerla con candados, se pasa el dato por el canal.

```go
resultados := make(chan int)   // sin buffer: send espera al receive
go func() { resultados <- calcular() }()
valor := <-resultados
```

Un canal sin buffer sincroniza a las dos partes. Con buffer, el emisor solo se
bloquea cuando el buffer está lleno, que es justo el patrón de la cola de logs
del servidor: encolar nunca debe frenar a quien registra un mensaje.

## select

`select` espera en varios canales a la vez, y con `default` no bloquea:

```go
select {
case entrada := <-cola:
    procesar(entrada)
default:
    // nada pendiente, seguir
}
```

## Errores clásicos

- Escribir en un canal que nadie lee: bloqueo permanente.
- Cerrar un canal desde el lado que lee: cierra quien escribe, siempre.
- Compartir un mapa entre goroutines sin protección: Go lo detecta con
  `go test -race` y aborta, porque es un error real y no una rareza teórica.

{video}

## Actividad

Escribir un programa que lance cinco goroutines, cada una calculando el
promedio de un curso, y reúna los resultados por un canal con buffer. Ejecutar
con `-race` y comprobar que no reporta nada.
""",
                "quiz": {
                    "id": "qz-go-03", "title": "Control: concurrencia", "value": 20,
                    "description": "Preguntas sobre la lección [[les-go-03]].",
                    "questions": [
                        ("Un canal sin buffer hace que el envío:",
                         ["Nunca se bloquee",
                          "Espere hasta que otra goroutine reciba el dato",
                          "Se descarte si nadie escucha",
                          "Se guarde en disco"], 1),
                        ("Si la función main termina mientras hay goroutines en ejecución:",
                         ["El programa espera a que terminen",
                          "El programa termina y las goroutines mueren",
                          "Se produce un error de compilación",
                          "Las goroutines siguen en segundo plano"], 1),
                        ("Un canal debe cerrarse:",
                         ["Desde el lado que lee", "Desde el lado que escribe",
                          "Desde main siempre", "Nunca"], 1),
                    ],
                },
            },
            {
                "id": "les-go-04",
                "title": "Errores, envoltura y pruebas",
                "video": "manejo de errores Go testing tutorial",
                "content": """
## El error es un valor

Go no tiene excepciones. Una función que puede fallar devuelve un `error` como
último valor de retorno y quien la llama lo revisa de inmediato:

```go
contenido, err := os.ReadFile(ruta)
if err != nil {
    return fmt.Errorf("leer %s: %w", ruta, err)
}
```

El costo es visible: hay muchos `if err != nil`. La ventaja también: leyendo el
código se ve exactamente dónde puede fallar, sin buscar qué captura una
excepción tres niveles más arriba.

## Envolver con contexto

`%w` construye un error nuevo que conserva el original. Así el mensaje acumula
contexto de cada capa ("leer archivo: permiso denegado") y aun así se puede
preguntar por la causa concreta con `errors.Is`. Sin `%w` el contexto se gana y
la causa se pierde.

## Errores centinela

```go
var ErrNoEncontrado = errors.New("no encontrado")
```

Quien llama compara con `errors.Is(err, ErrNoEncontrado)` y decide. Esto es lo
que permite que la capa web traduzca "no encontrado" a un 404 sin conocer nada
de la base de datos.

## Pruebas

Un archivo `_test.go` junto al código, funciones `TestXxx(t *testing.T)`. Sin
framework externo.

```go
func TestPromedio(t *testing.T) {
    casos := []struct {
        nombre string
        notas  []int
        quiero float64
    }{
        {"vacío", nil, 0},
        {"una nota", []int{18}, 18},
        {"varias", []int{12, 18}, 15},
    }
    for _, c := range casos {
        if got := Promedio(c.notas); got != c.quiero {
            t.Errorf("%s: obtuve %v, quiero %v", c.nombre, got, c.quiero)
        }
    }
}
```

Esa forma de tabla es la convención en Go: agregar un caso es agregar una
línea. `t.Errorf` sigue con los demás casos, `t.Fatalf` corta ahí mismo.

## Qué probar

No todo merece prueba. Sí la merece lo que tiene ramas, lo que calcula algo y
lo que ya falló una vez. Un ejemplo real de este proyecto: el respaldo de la
base de datos tiene una única prueba que exporta, vuelve a importar y compara
fila por fila, porque si eso se rompe se pierden datos.

## Para despejarse

Programar también es jugar: [[lib-game-la-culebrita]] es el clásico juego de la
culebrita, escrito en un solo archivo HTML con un `<canvas>` y un bucle de
`setInterval`. Ábrelo con el botón Jugar y piensa cómo sería la misma lógica
en Go: el estado sería un slice de posiciones y cada paso del juego, una
función que devuelve error cuando la culebrita choca.

{video}

## Actividad

Escribir la función `Promedio` con su prueba de tabla, incluyendo el caso del
slice vacío, y ejecutar `go test ./...`. Repasar [[les-go-01]] para el valor
cero.
""",
                "quiz": {
                    "id": "qz-go-04", "title": "Control: errores y pruebas", "value": 20,
                    "description": "Preguntas sobre la lección [[les-go-04]].",
                    "questions": [
                        ("El verbo %w en fmt.Errorf sirve para:",
                         ["Formatear el error en mayúsculas",
                          "Envolver el error original conservando la causa consultable",
                          "Escribir el error en el registro",
                          "Convertir el error en cadena"], 1),
                        ("La diferencia entre t.Errorf y t.Fatalf es que:",
                         ["Errorf continúa con los demás casos y Fatalf detiene la prueba",
                          "Fatalf solo imprime una advertencia",
                          "Errorf solo funciona con subpruebas",
                          "No hay diferencia"], 0),
                        ("Un error centinela como ErrNoEncontrado permite que:",
                         ["El error se ignore automáticamente",
                          "Quien llama distinga ese caso concreto con errors.Is y reaccione",
                          "El programa termine con código 1",
                          "Se eviten los punteros nulos"], 1),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-go", "title": "Examen final: Programación en Go", "value": 100,
            "description": "Evaluación integradora. Material permitido: [[lib-go-chuleta]].",
            "questions": [
                ("El valor cero de una variable string declarada con var es:",
                 ["nil", "La cadena vacía", "Un espacio", "Indefinido"], 1),
                ("Que la interfaz la declare quien consume, y no quien implementa, permite:",
                 ["Reducir el tamaño del binario",
                  "Que cada paquete dependa solo de los métodos que realmente usa",
                  "Heredar de varios tipos",
                  "Evitar escribir pruebas"], 1),
                ("Un canal con buffer resulta apropiado cuando:",
                 ["Se quiere sincronizar exactamente dos goroutines",
                  "Quien envía no debe bloquearse mientras haya espacio disponible",
                  "El dato debe persistir en disco",
                  "Solo hay una goroutine"], 1),
                ("Si se omite %w al envolver un error:",
                 ["Se gana contexto pero se pierde la causa consultable con errors.Is",
                  "El error deja de propagarse",
                  "El programa entra en pánico",
                  "No cambia nada"], 0),
                ("La prueba de tabla es la convención en Go porque:",
                 ["Es la única forma soportada por el paquete testing",
                  "Agregar un caso nuevo es agregar una línea",
                  "Evita usar t.Errorf",
                  "Permite pruebas sin función Test"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-go-1", "author": "est-06", "created": "2026-05-05T20:30:00Z",
                "title": "Mi programa termina sin imprimir nada de las goroutines",
                "body": """
Siguiendo [[les-go-03]] lancé tres goroutines que imprimen resultados, y el
programa termina de inmediato sin mostrar nada. Si le pongo un `time.Sleep` al
final funciona, pero eso se ve horrible. ¿Cuál es la forma correcta?
""",
                "likes": ["est-02", "est-10", "est-11"],
                "replies": [
                    {
                        "id": "fp-go-1r1", "author": "est-11", "created": "2026-05-05T21:50:00Z",
                        "body": """
El Sleep funciona por casualidad: estás adivinando cuánto tardan. Usa un
`sync.WaitGroup` con `Add(1)` antes de lanzar cada una, `defer wg.Done()`
dentro y `wg.Wait()` al final. O si cada goroutine produce un resultado, lee
los tres del canal, que también te obliga a esperarlas.
""",
                        "likes": ["est-06", "doc-vasquez", "est-02"],
                    },
                    {
                        "id": "fp-go-1r2", "author": "doc-vasquez", "created": "2026-05-06T08:25:00Z",
                        "body": """
Bien contestado. Y aprovechen para ejecutarlo con `go test -race`: la mayoría
de las veces que alguien "arregla" esto con Sleep, además hay un acceso
concurrente sin proteger que el detector encuentra en segundo.
""",
                        "likes": ["est-06", "est-11", "est-04", "est-08"],
                    },
                ],
            },
            {
                "id": "fp-go-2", "author": "est-10", "created": "2026-06-29T16:15:00Z",
                "title": "¿Cuántas pruebas se esperan en el proyecto?",
                "body": """
En [[les-go-04]] se dice que no todo merece prueba, pero en el proyecto no
tengo claro el criterio. ¿Se evalúa cobertura o cantidad? El cuestionario
[[qz-go-04]] insiste en el caso vacío, así que supongo que van por ahí.
""",
                "likes": ["est-03", "est-07"],
                "replies": [
                    {
                        "id": "fp-go-2r1", "author": "doc-vasquez", "created": "2026-06-29T19:05:00Z",
                        "body": """
No evalúo cobertura ni cantidad: evalúo si las pruebas que hay fallarían al
romper algo importante. Una sola prueba sobre la lógica que calcula notas vale
más que veinte que comprueban getters. Y sí, los casos límite (vacío, cero,
valor duplicado) son donde aparecen los errores de verdad.
""",
                        "likes": ["est-10", "est-03", "est-07", "est-01", "est-05"],
                    },
                ],
            },
        ],
    },
    {
        "id": "c-teologia",
        "title": "Teología",
        "category": "Humanidades",
        "description": "Introducción académica al estudio de la fe cristiana: método teológico, Escritura y su interpretación, desarrollo histórico de la doctrina, y ética aplicada al cuidado de la casa común.",
        "lessons": [
            {
                "id": "les-tg-01",
                "title": "Qué es la teología: fe, razón y método",
                "video": "qué es la teología fe y razón introducción",
                "content": """
## Una definición de trabajo

La formulación clásica de Anselmo de Canterbury, *fides quaerens
intellectum*, "la fe que busca entender", sigue siendo el punto de partida más
útil. La teología no crea la fe ni la sustituye: parte de una tradición
creyente y la examina con las herramientas del pensamiento riguroso.

De ahí una distinción que conviene fijar desde el principio:

- **Teología:** discurso que razona desde dentro de una tradición de fe.
- **Ciencias de la religión:** estudian los fenómenos religiosos desde fuera,
  sin presuponer la verdad de lo estudiado.
- **Apologética:** argumenta hacia afuera, defendiendo posiciones frente a
  objeciones.
- **Catequesis:** transmite el contenido de la fe con fines formativos.

Las cuatro son legítimas y responden a preguntas distintas. Esta asignatura es
del primer tipo, con método académico: se argumenta, se cita, se distingue lo
que una tradición sostiene de lo que el investigador concluye.

[[lib-tg-aquino]]

## Fuentes del trabajo teológico

| Fuente | Aporta |
|---|---|
| Escritura | El texto normativo de la tradición |
| Tradición | La recepción e interpretación a lo largo del tiempo |
| Razón | Coherencia interna, análisis conceptual, diálogo con otros saberes |
| Experiencia | La vida de la comunidad creyente y su práctica |

Las tradiciones cristianas pesan estas fuentes de manera distinta, y buena
parte de sus desacuerdos históricos se explican por ese peso relativo más que
por diferencias en el contenido de cada fuente.

## Fe y razón

Tomás de Aquino distinguió lo que la razón puede alcanzar por sí sola de lo
que solo se conoce por revelación, sosteniendo que no pueden contradecirse
porque tienen el mismo origen. Frente a esa posición conviven otras: quienes
subrayan la insuficiencia de la razón para llegar a Dios (línea que suele
asociarse a Tertuliano y que reaparece en la Reforma), y quienes reducen la
religión a lo que la razón puede validar.

Ninguna de las tres es "la" respuesta cristiana. Reconocer que la pregunta
sigue abierta es parte de estudiarla en serio.

## Las ramas

Teología fundamental (qué es la revelación y cómo se conoce), bíblica
(interpretación de los textos), dogmática o sistemática (articulación del
contenido: Dios, cristología, escatología), moral (la acción), histórica
(desarrollo en el tiempo) y práctica o pastoral.

{video}

## Actividad

Elegir una afirmación de fe cualquiera y clasificar, en dos columnas, qué parte
de su justificación depende de la Escritura y qué parte de argumentos
racionales. Consultar los términos en [[lib-tg-glosario]].
""",
                "quiz": {
                    "id": "qz-tg-01", "title": "Control: método teológico", "value": 20,
                    "description": "Preguntas sobre la lección [[les-tg-01]]. Material: [[lib-tg-glosario]].",
                    "questions": [
                        ("La fórmula *fides quaerens intellectum* significa que la teología:",
                         ["Reemplaza la fe por el razonamiento",
                          "Parte de la fe y busca comprenderla con rigor intelectual",
                          "Demuestra la fe mediante experimentos",
                          "Renuncia a todo argumento racional"], 1),
                        ("La diferencia entre teología y ciencias de la religión es que estas últimas:",
                         ["Estudian solo el cristianismo",
                          "Estudian los fenómenos religiosos sin presuponer la verdad de lo estudiado",
                          "Son anteriores históricamente",
                          "No admiten método comparativo"], 1),
                        ("Según la posición de Tomás de Aquino sobre fe y razón:",
                         ["La razón contradice necesariamente a la fe",
                          "No pueden contradecirse porque comparten el mismo origen",
                          "La fe solo vale si la razón la demuestra por completo",
                          "La razón no aporta nada al trabajo teológico"], 1),
                    ],
                },
            },
            {
                "id": "les-tg-02",
                "title": "Sagrada Escritura: canon, géneros y hermenéutica",
                "video": "canon bíblico géneros literarios hermenéutica explicación",
                "content": """
## Cómo se formó el canon

El canon no se decretó de una vez. Se fue reconociendo a lo largo de siglos,
por el uso que las comunidades hacían de los textos en la liturgia y la
enseñanza. Los criterios que operaron fueron básicamente el origen apostólico
atribuido, el uso extendido y la coherencia con la fe que la comunidad ya
profesaba.

[[lib-tg-codice]]

De ahí que los canones no coincidan:

| Tradición | Antiguo Testamento | Nuevo Testamento |
|---|---|---|
| Judía (Tanaj) | 24 libros | — |
| Protestante | 39 libros | 27 |
| Católica | 46 libros (incluye los deuterocanónicos) | 27 |
| Ortodoxa | Varía según la iglesia particular | 27 |

La diferencia en el Antiguo Testamento viene de qué colección se tomó como
base: la hebrea o la griega de los Setenta. No es un detalle de erudición, es
la raíz de discusiones doctrinales posteriores.

## Los géneros literarios

Leer un texto sin identificar su género produce errores garantizados. En la
Biblia conviven relato histórico, poesía, ley, profecía, sapiencial, apocalipsis
y carta. Preguntarle a un poema por la precisión cronológica es un error de
método, no de fe.

El caso más discutido son los primeros capítulos del Génesis: el reconocimiento
de su género como relato de orígenes con lenguaje simbólico permitió dejar de
tratarlos como crónica y evitar el falso conflicto con las ciencias naturales.

## Exégesis y hermenéutica

La **exégesis** establece qué dice el texto y qué quiso decir en su contexto:
lengua original, situación histórica, destinatarios. La **hermenéutica** se
ocupa del paso siguiente, la distancia entre ese mundo y el del lector actual.

Los métodos habituales:

- **Histórico-crítico:** reconstruye el proceso de formación del texto.
- **Narrativo:** analiza el relato como obra literaria acabada.
- **Canónico:** lee cada libro dentro del conjunto.
- **Contextual:** lee desde una situación concreta, como han hecho las lecturas
  latinoamericanas desde las comunidades de base.

## El riesgo del proof text

Extraer un versículo aislado para respaldar una posición previa es la falla más
común. El texto termina diciendo lo que el lector ya pensaba. Antídoto: leer la
unidad completa, revisar quién habla y a quién, y comprobar si el resto del
libro sostiene esa lectura.

{video}

## Actividad

Tomar un mismo pasaje y analizarlo con el método histórico-crítico y con el
narrativo. Señalar qué muestra cada uno que el otro no.
""",
                "quiz": {
                    "id": "qz-tg-02", "title": "Control: Escritura y hermenéutica", "value": 20,
                    "description": "Preguntas sobre la lección [[les-tg-02]] y el manuscrito de [[lib-tg-codice]].",
                    "questions": [
                        ("La diferencia entre el canon católico y el protestante en el Antiguo Testamento se origina en:",
                         ["Un concilio del siglo XX",
                          "Qué colección se tomó como base, la hebrea o la griega de los Setenta",
                          "La traducción al latín de Jerónimo",
                          "El número de evangelios reconocidos"], 1),
                        ("Identificar el género literario de un pasaje sirve para:",
                         ["Determinar su antigüedad exacta",
                          "Saber qué tipo de pregunta se le puede hacer legítimamente al texto",
                          "Decidir si pertenece al canon",
                          "Traducirlo sin diccionario"], 1),
                        ("El uso de un versículo aislado para respaldar una posición ya adoptada se critica porque:",
                         ["Los versículos no tienen sentido propio",
                          "El texto termina confirmando lo que el lector ya pensaba, sin control del contexto",
                          "Está prohibido citar la Escritura",
                          "Solo vale en la liturgia"], 1),
                    ],
                },
            },
            {
                "id": "les-tg-03",
                "title": "Concilios y desarrollo de la doctrina",
                "video": "concilios ecuménicos historia de la Iglesia Nicea",
                "content": """
## La doctrina tiene historia

Las formulaciones doctrinales no aparecieron completas: se precisaron cuando
surgió una controversia que obligó a decir con exactitud lo que antes se decía
de forma amplia. Estudiar teología incluye estudiar ese proceso, porque el
enunciado se entiende mejor conociendo la pregunta que respondía.

[[lib-tg-concilio]]

## Los primeros concilios

| Concilio | Año | Cuestión discutida | Formulación resultante |
|---|---|---|---|
| Nicea I | 325 | ¿El Hijo es criatura? | Consustancial al Padre |
| Constantinopla I | 381 | El Espíritu Santo | Completa el credo trinitario |
| Éfeso | 431 | ¿Cómo se une lo divino y lo humano en Cristo? | Unidad de la persona |
| Calcedonia | 451 | Precisión de esa unión | Dos naturalezas en una persona, sin confusión ni separación |

El vocabulario que se usó (persona, naturaleza, sustancia) es filosófico
griego, y ese préstamo es en sí mismo un tema de estudio: obligó a la
tradición a expresarse en categorías que no eran las de sus textos
fundacionales.

## Rupturas

El cisma de 1054 separó a Oriente y Occidente por una acumulación de factores
—la cláusula *Filioque* en el credo, la autoridad del obispo de Roma,
diferencias culturales y políticas— y no por un único desencuentro. La Reforma
del siglo XVI puso en el centro la autoridad de la Escritura frente a la
tradición y la cuestión de la justificación. Trento (1545-1563) fue la
respuesta católica; el Vaticano II (1962-1965) reformuló buena parte de esa
relación y abrió el camino al diálogo ecuménico.

## ¿Desarrollo o cambio?

Aquí está la pregunta interesante. John Henry Newman propuso criterios para
distinguir un desarrollo legítimo de una corrupción: continuidad del principio,
capacidad de asimilar sin perder identidad, consecuencia lógica. Otros autores
sostienen que la distinción no es tan nítida y que hubo rupturas reales
presentadas como continuidad. Sostener una u otra posición exige argumentar con
los documentos, que es exactamente el ejercicio de esta unidad.

## Lo que aporta el enfoque histórico

Evita dos errores simétricos: creer que todo se dijo siempre igual, y creer que
nada tiene continuidad. Ambos se disuelven leyendo las actas.

{video}

## Actividad

Comparar el credo de Nicea con el de Constantinopla, señalar las diferencias
literales y explicar qué controversia motivó cada añadido. Repasar los términos
en [[lib-tg-glosario]] y el método de [[les-tg-01]].
""",
                "quiz": {
                    "id": "qz-tg-03", "title": "Control: concilios y doctrina", "value": 20,
                    "description": "Preguntas sobre la lección [[les-tg-03]] y la imagen [[lib-tg-concilio]].",
                    "questions": [
                        ("El Concilio de Nicea (325) se convocó principalmente para resolver:",
                         ["El canon de la Escritura",
                          "La cuestión de si el Hijo era una criatura o consustancial al Padre",
                          "La fecha de la Pascua únicamente",
                          "La autoridad del obispo de Roma"], 1),
                        ("Calcedonia (451) formuló que en Cristo hay:",
                         ["Una sola naturaleza divina",
                          "Dos naturalezas en una persona, sin confusión ni separación",
                          "Dos personas distintas",
                          "Una naturaleza humana asumida temporalmente"], 1),
                        ("El cisma de 1054 se explica mejor como:",
                         ["El resultado de una única disputa doctrinal",
                          "La acumulación de factores doctrinales, de autoridad y políticos",
                          "Una consecuencia directa de la Reforma",
                          "Un desacuerdo sobre el canon bíblico"], 1),
                    ],
                },
            },
            {
                "id": "les-tg-04",
                "title": "Teología moral y cuidado de la casa común",
                "video": "doctrina social de la Iglesia ecología integral Laudato si",
                "content": """
## De la doctrina a la acción

La teología moral pregunta cómo debe obrarse a la luz de la fe. No se reduce a
una lista de prohibiciones: discute criterios, examina casos y admite que la
aplicación a una situación concreta requiere prudencia y conocimiento de los
hechos.

## Criterios de la doctrina social

Cuatro principios se repiten en los documentos y funcionan como criterios de
juicio antes que como recetas:

- **Dignidad de la persona:** la persona no es medio para otro fin.
- **Bien común:** el conjunto de condiciones que permiten a todos desarrollarse.
- **Subsidiariedad:** las decisiones se toman en el nivel más cercano capaz de
  resolverlas; la instancia mayor apoya, no absorbe.
- **Solidaridad:** responsabilidad recíproca, no asistencia ocasional.

El destino universal de los bienes y la opción preferencial por los pobres
completan el marco y son los que más discusión generan al aplicarse a
conflictos concretos por la tierra o el agua.

## Ecología integral

La encíclica *Laudato si'* (2015) articuló una tesis que interesa
particularmente aquí: la crisis ambiental y la crisis social no son dos
problemas separados. No se puede proteger un bosque desatendiendo a quienes
viven en él, ni mejorar las condiciones de vida destruyendo el sistema que las
sostiene. El documento habla de "casa común" para nombrar esa unidad.

Esa perspectiva enlaza directamente con lo estudiado en [[les-bio-04]]: la
conservación que funciona reconoce a las comunidades como sujetos y no como
obstáculos. La coincidencia entre un argumento teológico y uno ecológico no es
casual, ambos parten de mirar el sistema completo.

## Misión, cultura y una historia difícil

[[lib-tg-mision]]

La presencia de las misiones en la Amazonía dejó un legado ambivalente que la
teología académica no puede presentar en blanco y negro: hubo defensa de
poblaciones frente a la explotación y también imposición cultural y
destrucción de prácticas propias. La discusión posterior sobre inculturación
—hasta dónde una expresión de fe puede tomar formas de la cultura local sin
dejar de ser lo que es— nace precisamente de revisar esa experiencia.

Aquí se distingue el uso descriptivo de **sincretismo** del peyorativo, según
lo visto en [[lib-tg-glosario]]: describir una fusión de elementos no es
condenarla.

## El problema del mal

Ninguna teología moral seria esquiva la teodicea. Frente al sufrimiento
observable, las respuestas ensayadas —el mal como privación, el valor de la
libertad, la limitación del conocimiento humano, la respuesta desde la cruz— se
estudian como intentos, no como soluciones cerradas. Reconocer que la pregunta
queda abierta es más honesto que forzar una respuesta.

{video}

## Actividad

Analizar un conflicto real por el uso de un recurso natural en la región
aplicando los cuatro principios de la doctrina social. Señalar dónde entran en
tensión entre sí y cómo se resolvería esa tensión.
""",
                "quiz": {
                    "id": "qz-tg-04", "title": "Control: teología moral", "value": 20,
                    "description": "Preguntas sobre la lección [[les-tg-04]] y la imagen [[lib-tg-mision]].",
                    "questions": [
                        ("El principio de subsidiariedad sostiene que:",
                         ["Toda decisión corresponde a la autoridad mayor",
                          "Las decisiones se toman en el nivel más cercano capaz de resolverlas",
                          "Los bienes tienen un solo dueño legítimo",
                          "La solidaridad reemplaza a la justicia"], 1),
                        ("La noción de ecología integral afirma que:",
                         ["Lo ambiental debe atenderse antes que lo social",
                          "La crisis ambiental y la social son dos caras del mismo problema",
                          "El cuidado del ambiente es ajeno a la teología",
                          "Solo los expertos pueden opinar sobre el ambiente"], 1),
                        ("La teodicea se ocupa de:",
                         ["El orden de los libros del canon",
                          "Cómo sostener la afirmación de un Dios bueno frente al sufrimiento observable",
                          "La organización de las diócesis",
                          "La traducción de los textos originales"], 1),
                    ],
                },
            },
        ],
        "exam": {
            "id": "ex-teologia", "title": "Examen final: Teología", "value": 100,
            "description": "Evaluación integradora de las cuatro unidades. Material permitido: [[lib-tg-glosario]].",
            "questions": [
                ("La apologética se distingue de la teología en que:",
                 ["Usa exclusivamente la Escritura",
                  "Argumenta hacia afuera frente a objeciones, mientras la teología examina hacia adentro",
                  "Es anterior a los concilios",
                  "No admite el uso de la razón"], 1),
                ("Reconocer el género literario de los primeros capítulos del Génesis permitió:",
                 ["Excluirlos del canon",
                  "Dejar de leerlos como crónica y evitar un falso conflicto con las ciencias naturales",
                  "Fecharlos con precisión",
                  "Atribuirlos a un único autor"], 1),
                ("El vocabulario de persona, naturaleza y sustancia usado en Calcedonia proviene de:",
                 ["El hebreo bíblico",
                  "La filosofía griega, tomada en préstamo por la tradición",
                  "El derecho romano exclusivamente",
                  "La escolástica del siglo XIII"], 1),
                ("Los criterios de Newman sobre el desarrollo doctrinal buscan distinguir:",
                 ["Los libros canónicos de los apócrifos",
                  "Un desarrollo legítimo de una corrupción de la doctrina",
                  "La teología moral de la dogmática",
                  "El texto original de sus traducciones"], 1),
                ("Aplicar los principios de la doctrina social a un conflicto concreto exige:",
                 ["Deducir la solución solo de los principios",
                  "Conocer los hechos y admitir que los principios pueden entrar en tensión entre sí",
                  "Consultar únicamente el derecho vigente",
                  "Evitar toda referencia a la situación local"], 1),
            ],
        },
        "forum": [
            {
                "id": "fp-tg-1", "author": "est-05", "created": "2026-04-17T19:20:00Z",
                "title": "Si los canones no coinciden, ¿cuál es el correcto?",
                "body": """
Leyendo [[les-tg-02]] me quedó la duda de fondo. Si la lista de libros cambia
según la tradición, alguna tiene que estar equivocada. ¿O la pregunta está mal
planteada? No sé si se puede responder eso en una clase de teología o si cada
uno se queda con lo suyo.
""",
                "likes": ["est-01", "est-08", "est-11", "est-12"],
                "replies": [
                    {
                        "id": "fp-tg-1r1", "author": "doc-vasquez", "created": "2026-04-18T09:10:00Z",
                        "body": """
La pregunta está bien planteada, y la respuesta académica honesta es que aquí
no se resuelve. Lo que sí se puede hacer, y es lo que pido en el curso, es
reconstruir con documentos cómo llegó cada tradición a su lista y con qué
criterios. Eso es verificable. Decidir cuál lista es la verdadera supone ya
haber aceptado la autoridad de una tradición, y eso pertenece a la fe de cada
quien, no al examen.
""",
                        "likes": ["est-05", "est-01", "est-03", "est-09", "est-11"],
                    },
                    {
                        "id": "fp-tg-1r2", "author": "est-08", "created": "2026-04-18T14:35:00Z",
                        "body": """
A mí me ayudó ver que los criterios que se usaron (uso en las comunidades,
origen apostólico atribuido, coherencia con lo que ya se creía) son criterios
históricos y se pueden estudiar. Uno puede analizar si se aplicaron bien sin
tener que zanjar el fondo.
""",
                        "likes": ["est-05", "doc-vasquez"],
                    },
                ],
            },
            {
                "id": "fp-tg-2", "author": "est-09", "created": "2026-06-08T17:05:00Z",
                "title": "Los cuatro principios se contradicen en mi caso",
                "body": """
Para la actividad de [[les-tg-04]] tomé el conflicto por la concesión minera
del río. Cuando aplico los principios me choco: el bien común parecería apoyar
la obra porque genera trabajo para la zona, pero la dignidad de las personas
desplazadas y la opción por los pobres apuntan al revés. ¿Cómo se resuelve sin
elegir el principio que me conviene?
""",
                "likes": ["est-01", "est-05", "est-06", "doc-vasquez"],
                "replies": [
                    {
                        "id": "fp-tg-2r1", "author": "doc-vasquez", "created": "2026-06-08T21:40:00Z",
                        "body": """
Que choquen no es un defecto de su análisis, es la parte más valiosa del
trabajo. Dos cosas para avanzar. Primero, revise si "genera trabajo" es un dato
o un supuesto: cuántos puestos, por cuánto tiempo, para quién. Muchos
conflictos se aclaran cuando el supuesto se mide. Segundo, los principios no
tienen el mismo peso en toda situación: la dignidad de la persona funciona como
límite y no se compensa con beneficios agregados. Argumente eso explícitamente
en lugar de resolverlo por descarte.
""",
                        "likes": ["est-09", "est-01", "est-05", "est-11", "est-02"],
                    },
                    {
                        "id": "fp-tg-2r2", "author": "est-01", "created": "2026-06-09T10:15:00Z",
                        "body": """
En mi comunidad pasó algo parecido con una concesión de madera. Prometieron
cuarenta empleos y terminaron siendo doce, casi todos de gente traída de
afuera. Lo que dice la profesora de medir el supuesto es exactamente donde se
cayó el argumento.
""",
                        "likes": ["est-09", "doc-vasquez", "est-05", "est-06"],
                    },
                ],
            },
        ],
    },
]
