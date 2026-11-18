# Definición de una aplicación web para transferir secretos de forma segura

## 1. Objetivo del proyecto

Queremos crear una aplicación web sencilla para transferir información sensible entre dos personas, por ejemplo un archivo `.env`, una clave de API, un certificado o unas credenciales temporales.

Este tipo de información no debe subirse a GitHub ni enviarse mediante correo electrónico, Slack, Teams u otros canales que conserven un historial. Aunque posteriormente se borre el mensaje, pueden quedar copias en notificaciones, copias de seguridad, registros o dispositivos sincronizados.

La aplicación permitirá que dos personas se conecten durante unos minutos y transfieran el secreto directamente. El contenido se cifrará y descifrará en sus navegadores. El servidor se limitará a ponerlos en contacto y transportar información que no puede descifrar.

La solución debe cumplir estos objetivos:

- Ser fácil de usar y no requerir la instalación de programas.
- Permitir compartir texto o un archivo pequeño, especialmente archivos `.env`.
- Cifrar el contenido de extremo a extremo.
- Evitar que el servidor conozca las claves de cifrado o el contenido original.
- No almacenar el secreto, ni siquiera cifrado, una vez terminada la transferencia.
- Utilizar enlaces de sesión aleatorios, temporales y de un solo uso.
- Permitir que los participantes verifiquen que están conectados entre sí.
- Utilizar exclusivamente las API estándar del navegador, sin dependencias de ejecución en el cliente.

## 2. Alcance inicial

La primera versión estará pensada para transferencias síncronas: las dos personas deberán estar conectadas al mismo tiempo. El emisor puede compartir el enlace durante una llamada de Google Meet y ambos pueden comprobar visualmente un código de seguridad antes de enviar el contenido.

La primera versión no pretende ser:

- Un gestor permanente de secretos.
- Un almacén de archivos cifrados.
- Un sustituto de servicios como 1Password, Bitwarden o un vault corporativo.
- Un sistema asíncrono en el que el destinatario recoge el secreto varias horas después.
- Una plataforma de identidad que determine quién es cada usuario.

## 3. Principios de funcionamiento

La seguridad se apoyará en cuatro mecanismos principales:

1. **ECDH efímero**, para que ambos navegadores calculen el mismo secreto sin transmitirlo.
2. **HKDF con SHA-256**, para convertir ese secreto en claves adecuadas para la sesión.
3. **AES-256-GCM**, para cifrar el contenido y detectar cualquier modificación.
4. **Un código de verificación**, para comprobar por un canal independiente que nadie se ha interpuesto en la conexión.

### 3.1 Clave privada y clave pública

Cada navegador genera un par de claves al entrar en una sesión:

- La **clave privada** permanece en el navegador y nunca se transmite.
- La **clave pública** se envía al otro participante a través del servidor.

Ambas claves están relacionadas matemáticamente, pero no es viable obtener la clave privada a partir de la pública.

Las claves serán efímeras: se crearán para una única sesión y se eliminarán al cerrar la pestaña, finalizar la transferencia o caducar la sesión. No se guardarán en `localStorage`, `sessionStorage`, cookies ni IndexedDB.

### 3.2 ECDH efímero

ECDH significa *Elliptic Curve Diffie Hellman*. Permite que dos navegadores calculen el mismo secreto compartido intercambiando únicamente sus claves públicas.

El navegador A calcula:

```text
clave privada A + clave pública B = secreto compartido
```

El navegador B calcula:

```text
clave privada B + clave pública A = el mismo secreto compartido
```

El secreto compartido no se envía, ni siquiera cifrado. Cada navegador lo calcula localmente. El servidor ve las claves públicas, pero no dispone de ninguna clave privada y, por tanto, no puede calcularlo.

La primera versión utilizará ECDH con la curva `P-256`, disponible en la Web Crypto API de los navegadores modernos.

### 3.3 HKDF y la sal

El resultado de ECDH es material criptográfico compartido, pero no conviene utilizarlo directamente como clave de cifrado. HKDF lo transforma en una clave con el tamaño y la finalidad adecuados.

Los dos navegadores ejecutan la misma operación:

```text
HKDF(secreto compartido, sal, contexto) = clave de sesión AES
```

Para obtener el mismo resultado, ambos conocen:

- El mismo secreto ECDH, calculado localmente.
- La misma sal, generada aleatoriamente para la sesión y transmitida públicamente.
- El mismo contexto, definido por el protocolo, por ejemplo `secret-transfer/encryption/v1`.

La sal no es una contraseña ni necesita permanecer oculta. Su función es separar unas sesiones de otras y evitar que la reutilización accidental del mismo material produzca la misma clave final.

El contexto permite obtener claves distintas para finalidades diferentes. Por ejemplo:

```text
secret-transfer/encryption/v1   → clave para cifrar el contenido
secret-transfer/verification/v1 → material para verificar la conexión
```

La clave de sesión resultante tampoco se transmite. Cada navegador la genera localmente y la mantiene únicamente en memoria.

### 3.4 AES-256-GCM

AES-GCM será el algoritmo encargado de cifrar el `.env` o el contenido enviado.

AES es un algoritmo simétrico: la misma clave sirve para cifrar y descifrar. Ambos navegadores poseen esa clave porque la han derivado a partir del mismo secreto ECDH.

GCM añade autenticidad e integridad. Si alguien modifica el contenido cifrado durante el transporte, el navegador receptor detectará la alteración y rechazará el mensaje.

Cada operación de cifrado utilizará un IV aleatorio de 12 bytes. El IV no es secreto y se enviará junto al contenido cifrado. Nunca se reutilizará el mismo IV con la misma clave.

### 3.5 Código de verificación

El cifrado por sí solo no demuestra que el otro extremo sea la persona esperada. Un servidor malicioso podría intentar sustituir las claves públicas y establecer una conexión independiente con cada usuario.

Para detectar este ataque, los navegadores calcularán un código corto a partir del intercambio completo, incluyendo las dos claves públicas, la sal, el identificador de la sala y la versión del protocolo.

Por ejemplo:

```text
LIMÓN  BOSQUE  4728
```

Ambos usuarios deberán ver el mismo código y compararlo verbalmente o compartiendo pantalla durante la llamada. El botón para enviar el secreto permanecerá desactivado hasta que ambos confirmen que el código coincide.

El código no es la clave de cifrado y no permite reconstruirla.

## 4. Componentes de la solución

### 4.1 Cliente web sin dependencias

La interfaz se desarrollará con HTML, CSS y JavaScript nativo mediante módulos ES. No se utilizarán React, otros frameworks de interfaz ni librerías de terceros en el código que ejecuta el navegador.

La aplicación utilizará directamente la Web Crypto API para las operaciones criptográficas y la API WebSocket para la comunicación. Sus responsabilidades serán:

- Crear y abrir sesiones.
- Generar las claves ECDH efímeras.
- Exportar e intercambiar únicamente las claves públicas.
- Calcular el secreto compartido.
- Derivar las claves con HKDF.
- Mostrar el código de verificación.
- Cifrar y descifrar el contenido con AES-GCM.
- Mantener el contenido y las claves únicamente en memoria.
- Limpiar la información al terminar o cerrar la sesión.
- Mostrar una cuenta atrás con el tiempo restante de la sesión.
- Impedir desde la interfaz cualquier acción incompatible con el estado actual de la sala.

El objetivo es que el cliente entregado al navegador tenga cero dependencias externas. Si durante el desarrollo se utiliza TypeScript, un empaquetador o herramientas de pruebas, serán dependencias exclusivas de desarrollo y no formarán parte del cliente en producción. La aplicación deberá poder ejecutarse con archivos estáticos propios y sin cargar código desde CDN ni desde dominios de terceros.

### 4.2 Servidor de señalización y transporte

El servidor mantendrá conexiones WebSocket seguras mediante `wss://`. Sus responsabilidades serán:

- Crear una sala temporal.
- Admitir como máximo a dos participantes y rechazar cualquier conexión adicional.
- Intercambiar las claves públicas y los mensajes del protocolo.
- Transportar el contenido ya cifrado.
- Aplicar la caducidad y el uso único de la sesión.
- Cerrar y eliminar la sala cuando termine la transferencia.

El servidor podrá ver metadatos como la hora, el tamaño aproximado del mensaje, las claves públicas, la sal y las direcciones IP. No podrá ver las claves privadas, el secreto ECDH, la clave AES ni el contenido original.

### 4.3 Estado mínimo de la sesión

Controlar el uso único o el número de participantes exclusivamente desde el cliente no es suficiente. Un usuario puede modificar el JavaScript, repetir peticiones o abrir el mismo enlace en otro navegador. El cliente aplicará estas restricciones para ofrecer una interfaz coherente, pero el servidor será siempre la autoridad y volverá a validarlas en cada operación.

La recomendación es utilizar un almacén temporal con TTL, por ejemplo Redis, y guardar únicamente:

```json
{
  "roomIdHash": "hash-del-identificador",
  "status": "waiting",
  "expiresAt": "fecha-de-caducidad"
}
```

Los estados previstos serán:

```text
waiting → connected → verified → consumed
```

El registro se eliminará al consumirse la sesión o vencer el TTL. No contendrá el secreto del enlace, claves privadas, claves de sesión ni el contenido transferido.

En un prototipo ejecutado en una sola instancia podría utilizarse memoria del servidor. Redis será más fiable en producción porque conserva el control de uso único cuando hay varias instancias o se reinicia una de ellas.

La sala caducará exactamente cinco minutos después de su creación. El servidor guardará el instante de caducidad y será la fuente de tiempo autoritativa. El cliente recibirá ese instante, mostrará una cuenta atrás y actualizará la interfaz cada segundo. Cuando el contador llegue a cero, el cliente bloqueará la transferencia; el servidor también rechazará cualquier mensaje posterior, cerrará las conexiones y eliminará el estado temporal.

## 5. Enlace de sesión

El creador recibirá un enlace similar a este:

```text
https://secrets.example/s/ROOM_ID#LINK_SECRET
```

El enlace contiene dos elementos:

- `ROOM_ID` identifica la sala y sí llega al servidor.
- `LINK_SECRET` contiene entropía aleatoria y se coloca después de `#`.

Los navegadores no incluyen el fragmento situado después de `#` en las peticiones HTTP. El servidor conoce la sala, pero no recibe automáticamente `LINK_SECRET`.

El secreto del enlace puede utilizarse para autenticar los mensajes iniciales del protocolo y reforzar la protección frente a la sustitución de claves. No sustituye al código de verificación: cualquiera que obtenga el enlace completo podrá intentar entrar en la sesión, por lo que el uso único, la caducidad breve y la comparación por Meet siguen siendo necesarios.

El enlace deberá generarse con suficiente entropía mediante `crypto.getRandomValues()`. No se utilizarán identificadores incrementales, fechas, UUID débiles ni valores generados con `Math.random()`.

## 6. Flujo completo de uso

### 6.1 Creación de la sesión

1. El emisor pulsa **Crear transferencia**.
2. Su navegador genera `ROOM_ID` y `LINK_SECRET` con un generador criptográficamente seguro.
3. El servidor registra el hash del identificador de sala con una caducidad exacta de cinco minutos.
4. El navegador muestra el enlace completo para compartirlo con el receptor.
5. El navegador muestra una cuenta atrás con los cinco minutos disponibles.
6. El navegador del emisor genera su par ECDH efímero y mantiene la clave privada en memoria.

### 6.2 Entrada del receptor

1. El receptor abre el enlace.
2. Su navegador obtiene `ROOM_ID` de la ruta y `LINK_SECRET` del fragmento local.
3. Se conecta por WebSocket a la sala.
4. El servidor comprueba que la sala existe, no ha caducado y todavía admite al segundo participante. Si ya hay dos conexiones, rechaza la nueva conexión aunque su cliente intente forzarla.
5. El servidor comunica al receptor el instante de caducidad y su navegador muestra el mismo tiempo restante.
6. El navegador del receptor genera su propio par ECDH efímero.

### 6.3 Negociación de claves

1. Los navegadores intercambian sus claves públicas a través del WebSocket.
2. El creador genera una sal aleatoria y la envía junto a los datos públicos del protocolo.
3. Cada navegador combina su clave privada con la clave pública del otro.
4. Ambos calculan, sin transmitirlo, el mismo secreto ECDH.
5. Ambos aplican HKDF con la misma sal y el mismo contexto.
6. Ambos obtienen la misma clave AES-256 de sesión.
7. Las claves públicas, la sal y el resto de datos se ordenan de forma canónica para que ambos calculen el mismo resumen de la negociación.

### 6.4 Verificación de los participantes

1. Cada navegador calcula el código de verificación.
2. Ambos usuarios lo comparan mediante Google Meet.
3. Cada usuario pulsa **El código coincide**.
4. El servidor solo habilita la fase de transferencia cuando los dos clientes han confirmado.
5. Si los códigos son diferentes, la sesión se cancela y no se envía ningún secreto.

### 6.5 Transferencia del secreto

1. El emisor pega el contenido o selecciona el archivo `.env`.
2. El navegador valida el tamaño máximo permitido.
3. Genera un IV aleatorio de 12 bytes.
4. Cifra el contenido con AES-256-GCM y la clave de sesión.
5. Envía al servidor únicamente el IV, los metadatos mínimos y el contenido cifrado.
6. El servidor reenvía esos datos al receptor sin almacenarlos.
7. El navegador receptor descifra el contenido en memoria.
8. El receptor copia el contenido o descarga el archivo localmente.
9. El receptor confirma la recepción.

### 6.6 Cierre y destrucción

1. El servidor marca la sala como consumida y rechaza nuevas conexiones. Si se alcanzan los cinco minutos antes de terminar, marca la sala como caducada y aplica el mismo cierre.
2. Cierra los WebSocket y elimina el estado temporal.
3. Los navegadores eliminan sus referencias a claves, contenido e información de sesión.
4. El historial del navegador no debe incluir el contenido transferido.
5. Recargar la página no permitirá recuperar la transferencia.

## 7. Información que ve cada parte

| Información | Emisor | Receptor | Servidor |
| --- | :---: | :---: | :---: |
| Clave privada del emisor | Sí | No | No |
| Clave privada del receptor | No | Sí | No |
| Claves públicas | Sí | Sí | Sí |
| Sal de HKDF | Sí | Sí | Sí |
| Secreto compartido ECDH | Sí | Sí | No |
| Clave AES de sesión | Sí | Sí | No |
| Contenido original | Sí | Sí | No |
| Contenido cifrado | Sí | Sí | Sí, solo durante el tránsito |
| IP y metadatos de conexión | Parcial | Parcial | Sí |

## 8. Justificación de seguridad

### 8.1 El secreto compartido nunca se transmite

Los navegadores intercambian claves públicas, pero calculan localmente el secreto ECDH. El servidor no dispone de las claves privadas necesarias para reproducir ese cálculo.

### 8.2 La clave de sesión tampoco se transmite

Cada navegador deriva la clave AES mediante HKDF. La red y el servidor solo transportan los ingredientes públicos, no la clave final.

### 8.3 El contenido sale cifrado del navegador

El `.env` se cifra antes de enviarse. El servidor recibe bytes cifrados y no posee la clave necesaria para interpretarlos.

### 8.4 Las modificaciones se detectan

AES-GCM autentica el mensaje. Si el contenido cifrado, el IV o los datos autenticados se modifican, el descifrado falla y el cliente rechaza la transferencia.

### 8.5 Las claves son temporales

Cada sesión genera claves ECDH nuevas. La exposición de una sesión futura no permite descifrar transferencias anteriores, siempre que las claves privadas efímeras se hayan eliminado correctamente.

### 8.6 La identidad se comprueba por otro canal

El código de verificación permite detectar la sustitución de claves. Compararlo por Meet crea un canal de comprobación independiente del servidor de transferencia.

### 8.7 El enlace caduca y solo puede consumirse una vez

El servidor mantiene un estado mínimo con TTL y rechaza la reutilización. Esto limita la ventana disponible para probar enlaces robados o repetidos.

### 8.8 El servidor no conserva el contenido

El contenido cifrado se reenvía por WebSocket y no se escribe en una base de datos, archivo, cola persistente ni sistema de logs. El estado temporal solo contiene el identificador hash de la sala, su estado y su caducidad.

## 9. Límites y riesgos que permanecen

La aplicación reduce el riesgo del transporte, pero no puede resolver todos los escenarios.

### 9.1 Dispositivo comprometido

Si uno de los equipos tiene malware, una extensión maliciosa o un navegador comprometido, el atacante puede leer el contenido antes de cifrarlo o después de descifrarlo.

### 9.2 Enlace completo robado

Quien obtenga el enlace completo puede intentar entrar antes que el destinatario. La caducidad, el límite de dos participantes y la comprobación por Meet reducen este riesgo, pero no sustituyen una gestión cuidadosa del enlace.

### 9.3 Código JavaScript malicioso

El servidor que distribuye la aplicación podría entregar JavaScript modificado que copie el secreto antes de cifrarlo. El cifrado de extremo a extremo no protege frente al proveedor de la aplicación si este puede cambiar el cliente que ejecuta el usuario.

Para reducir este riesgo se deberán aplicar controles de despliegue, revisión de código, CSP estricta, ausencia de scripts de terceros y versiones reproducibles. Una versión futura podría ofrecer un cliente instalable o una extensión firmada para mejorar la verificabilidad.

### 9.4 Metadatos visibles

El servidor conoce las direcciones IP, la duración de la sesión, el momento de la transferencia y el tamaño aproximado del contenido. La solución protege el contenido, no oculta todos los metadatos.

### 9.5 Copias realizadas por el receptor

Después del descifrado, el receptor puede copiar, guardar o fotografiar el secreto. Ninguna solución técnica puede garantizar su destrucción en el equipo de destino.

### 9.6 Comparación incorrecta del código

Si los usuarios no comparan el código o aceptan uno diferente, pierden la protección frente a un intermediario activo. La interfaz debe explicar este paso y exigir confirmación explícita.

## 10. Medidas complementarias

- Servir toda la aplicación exclusivamente mediante HTTPS y WSS.
- Definir una Content Security Policy estricta.
- No incluir herramientas de analítica, píxeles, gestores de etiquetas ni scripts de terceros en las pantallas de transferencia.
- Establecer `Cache-Control: no-store` en las rutas de sesión.
- Evitar que secretos, enlaces completos o mensajes cifrados aparezcan en logs.
- Aplicar límites de tamaño y frecuencia para evitar abuso o agotamiento de memoria.
- Limitar cada sala a dos conexiones activas.
- Invalidar inmediatamente una sala ante errores de protocolo o intentos adicionales de conexión.
- Utilizar comparaciones constantes donde sea relevante.
- Versionar el protocolo para poder evolucionarlo sin mezclar clientes incompatibles.
- Probar el comportamiento en Chrome, Edge, Firefox y Safari.
- Solicitar una revisión criptográfica externa antes de utilizar la aplicación con secretos de producción especialmente sensibles.

## 11. Decisiones propuestas para la primera versión

| Área | Decisión inicial |
| --- | --- |
| Interfaz | HTML, CSS y JavaScript nativo mediante módulos ES |
| Dependencias cliente | Ninguna |
| Criptografía cliente | Web Crypto API |
| Acuerdo de secreto | ECDH con P-256 |
| Derivación de claves | HKDF con SHA-256 |
| Cifrado | AES-256-GCM |
| Transporte | WebSocket sobre WSS |
| Persistencia del contenido | Ninguna |
| Estado de sesión | Redis con TTL y datos mínimos |
| Participantes | Exactamente dos, con validación en cliente y servidor |
| Duración | Cinco minutos desde la creación, con cuenta atrás visible |
| Verificación | Código corto comparado por Meet |
| Uso del enlace | Una única transferencia |
| Tamaño máximo | Pendiente de definir |

## 12. Criterios de aceptación iniciales

La primera versión se considerará válida cuando cumpla, al menos, estas condiciones:

- Dos navegadores obtienen la misma clave de sesión sin transmitirla.
- El servidor no puede descifrar una captura completa del tráfico de aplicación.
- Un contenido modificado durante el transporte es rechazado.
- Una sala caducada o consumida no puede volver a utilizarse.
- Un tercer participante no puede incorporarse a una sala ocupada.
- Manipular el JavaScript del cliente no permite ampliar la caducidad ni superar el límite de dos participantes.
- Los dos clientes muestran una cuenta atrás basada en el instante de caducidad indicado por el servidor.
- Al finalizar los cinco minutos, el cliente bloquea la interfaz y el servidor rechaza cualquier operación posterior.
- El contenido no se escribe en logs, base de datos, disco ni colas persistentes.
- Cerrar o recargar la pestaña elimina la posibilidad de recuperar el secreto desde la aplicación.
- Ambos navegadores muestran el mismo código en una conexión legítima.
- La sustitución de una clave pública produce códigos diferentes o invalida la negociación.
- La transferencia funciona en los navegadores incluidos en la matriz de compatibilidad.

## 13. Próximos pasos

1. Definir el modelo de amenazas y qué ataques quedan dentro o fuera del alcance.
2. Especificar el formato exacto de los mensajes WebSocket.
3. Definir cómo se utiliza `LINK_SECRET` para autenticar la negociación.
4. Elegir el formato y longitud del código de verificación.
5. Establecer el tamaño máximo del contenido; la duración inicial queda fijada en cinco minutos.
6. Diseñar los estados de interfaz y los mensajes de error.
7. Crear una prueba técnica de ECDH, HKDF y AES-GCM con dos pestañas.
8. Preparar pruebas automatizadas del protocolo y una revisión de seguridad.
