# BIO//GLITCH
Una plataforma audiovisual experimental que explora el conflicto entre la naturaleza y la tecnología. A través de videos de flores en movimiento, sonidos electrónicos e interferencias digitales, la plataforma transforma un fenómeno visual en una experiencia sonora y gráfica.

---

## Concepto y relación imagen–sonido
BIO//GLITCH explora la relación entre el movimiento de una flor y la generación de sonido. La flor representa algo delicado y orgánico, mientras que el glitch representa la intervención de un sistema tecnológico que altera su imagen.

La relación principal es de **traducción**: los cambios que ocurren en la imagen se convierten en señales que activan o modifican el sonido. El movimiento deja de ser solamente algo que vemos y se transforma en algo que también podemos escuchar.

Al mismo tiempo, la plataforma construye una **relación recíproca** entre ambos medios. El movimiento de la flor activa la respuesta sonora y la actividad del sonido influye en la intensidad de las interferencias visuales.

La experiencia se organiza en una secuencia:

1. La flor se mueve.
2. El sistema detecta los cambios de la imagen.
3. El movimiento se traduce en sonido.
4. La actividad sonora modifica el glitch visual.
5. Cuando disminuye la actividad, el sonido y la distorsión se reducen progresivamente.

El objetivo es hacer perceptibles pequeños cambios visuales que normalmente pasan desapercibidos. El sonido permite experimentar el movimiento desde otra perspectiva y reconocer variaciones en su intensidad y ritmo.

## Banco de sonidos y disparador
La plataforma utiliza un banco de cinco sonidos seleccionados para construir una atmósfera electrónica y experimental. Estos sonidos son parte de la identidad sonora de BIO//GLITCH y permiten explorar distintas respuestas frente al movimiento de las flores. La selección busca contrastar la delicadeza de las flores con una respuesta tecnológica más artificial.

### Disparador y regla de correspondencia (mapping)

El disparador principal es el **cambio entre fotogramas del video**. El sistema compara la imagen actual con la anterior para identificar movimiento.

| Fenómeno visual | Respuesta sonora |
|---|---|
| Poco movimiento | Sonido de menor intensidad o actividad |
| Aumento del movimiento | Mayor actividad sonora |
| Cambios rápidos en la imagen | Respuesta sonora más dinámica |
| Disminución del movimiento | Reducción progresiva de la actividad sonora |

La respuesta final depende de la detección de movimiento y de las reglas implementadas en `script.js`. Además, la actividad sonora modifica la intensidad del glitch, creando una conexión entre lo que se escucha y lo que se ve.

## Parámetros y gráfica

### Parámetros de interacción
BIO//GLITCH incluye controles que permiten experimentar con la relación entre el movimiento, el sonido y la distorsión visual.

| Parámetro | Función |
|---|---|
| **Glitch Intensity** | Controla la intensidad de las interferencias digitales. |
| **Motion Sensitivity** | Define cuánto movimiento se necesita para activar la respuesta. |
| **Pixel Size** | Modifica el tamaño de los fragmentos digitales. |
| **Audio Reactivity** | Regula cuánto influye la actividad sonora en el glitch visual. |
| **Decay** | Controla cuánto tarda en desaparecer la respuesta después del movimiento. |

Estos parámetros permiten intervenir en la experiencia sin cambiar su idea principal. Cada uno modifica un aspecto distinto de la percepción: la sensibilidad del sistema, la apariencia de la imagen o la relación entre el sonido y la distorsión.

### Decisiones gráficas
La interfaz utiliza una estética oscura y experimental para representar un laboratorio digital donde una imagen natural es analizada e intervenida por la tecnología.

**Paleta cromática**

| Color | Código | Uso |
|---|---|---|
| Negro verdoso | `#080A08` | Fondo; genera contraste. |
| Verde ácido | `#8BEA35` | Controles, indicadores y señales del sistema. |
| Magenta eléctrico | `#FF3BD4` | Interferencias; refuerza la sensación de error digital. |
| Blanco verdoso | `#E6F0E3` | Textos; mantiene la legibilidad. |

La flor conserva sus colores naturales para mantener el contraste entre lo orgánico y lo digital. Los colores artificiales se usan principalmente en la interfaz y en los efectos de glitch.

**Visualización**

Los efectos principales son la separación de canales RGB, las líneas horizontales, el desplazamiento de fragmentos y la pixelación. Estas distorsiones representan la intervención tecnológica sobre la flor. Los efectos responden a la actividad audiovisual y no se mantienen constantemente al máximo, de modo que el glitch se convierte en una señal visible de lo que ocurre dentro del sistema.

## Reflexión
Desarrollar BIO//GLITCH permite explorar cómo un fenómeno visual puede convertirse en una experiencia que involucra otro sentido. El movimiento de una flor parece algo sencillo cuando se observa, pero al traducirlo en sonido aparecen diferencias de intensidad, ritmo y actividad que pueden percibirse de otra manera.

La experiencia también muestra que traducir una imagen en sonido implica tomar decisiones. El sistema no reproduce todo lo que ocurre en la imagen: selecciona ciertos cambios, los interpreta mediante reglas y los convierte en una respuesta sonora. Por eso, el resultado depende tanto del fenómeno observado como del diseño de la traducción.

Sin embargo, existen límites. El sistema no comprende el significado de una flor ni interpreta emociones humanas. Detecta cambios visuales según las reglas programadas. Además, algunos movimientos pueden ser difíciles de distinguir de otros cambios de imagen, y las características de los sonidos disponibles condicionan lo que se puede escuchar.

### Posibles mejoras
1. **Mejorar la detección del movimiento:** incorporar ajustes para distinguir mejor el movimiento de los pétalos de los cambios producidos por la iluminación o el fondo, reduciendo activaciones innecesarias.
2. **Ampliar la respuesta sonora:** permitir más relaciones entre la intensidad y la velocidad del movimiento y características del sonido, como el volumen, la frecuencia o la distribución espacial.
3. **Mejorar la relación recíproca:** hacer que la actividad sonora influya de forma más precisa en la distorsión visual, para que el vínculo entre imagen y sonido sea perceptible y consistente.

## Cómo ejecutar el proyecto
El proyecto es una página web estática (HTML, CSS y JavaScript), sin dependencias que instalar.

1. Clona el repositorio:
   ```bash
   git clone https://github.com/marcezm/BIO-GLITCH.git
   cd BIO-GLITCH
   ```
2. Abre `index.html` en el navegador. Si el navegador bloquea la carga de video o audio al abrir el archivo directamente, sirve la carpeta con un servidor local:
   ```bash
   python3 -m http.server 8000
   ```
   y visita `http://localhost:8000`.

## Estructura del repositorio

```
BIO-GLITCH/
├── index.html     # Estructura de la interfaz
├── style.css      # Estilos y paleta cromática
├── script.js      # Detección de movimiento, sonido y efectos glitch
└── README.md
```
