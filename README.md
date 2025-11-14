# Tarea S8 IG - Leslie Liu Romero Martín

## Link de CodeSandbox

- https://codesandbox.io/p/sandbox/ig-tarea-s8-entrega-3v3nf5

## Introducción

Para esta tarea de visualización de datos, tenía interés en representar fenómenos naturales en el globo terráqueo. Finalmente, por facilidad de representación y la disponibilidad de un dataset, me decidí a representar volcanes.

## Dataset

El dataset lo pude conseguir con la ayuda de la IA generativa en el siguiente enlace: https://volcano.si.edu/volcanolist_holocene.cfm del Museo Nacional de Historia Natural Smithsonian. Me descargué el archivo en el formato que ofrecen (XML Excel) y me encargué de eliminar las columnas que no fueran de interés y convertir el archivo a CSV.

## Implementación básica

Para comenzar la implementación, me centré en simplemente mostrar la ubicación de los volcanes en el globo terráqueo. Previamente generado el planeta Tierra con las funciones que hemos usado en prácticas anteriores, aunque adaptada para utilizar solo los parámetros necesarios:

```js
function Planeta(
  radio,
  res,
  col,
  texture = undefined,
  texbump = undefined,
  texspec = undefined
) {
    let geom = new THREE.SphereGeometry(radio, res, res);
    let mat = new THREE.MeshPhongMaterial({ color: col });
    if (texture != undefined) {
      mat.map = texture;
    }
    // Textura
    if (texture != undefined) {
      mat.map = texture;
    }
    // Rugosidad
    if (texbump != undefined) {
      mat.bumpMap = texbump;
      mat.bumpScale = 1;
    }
    // Especular
    if (texspec != undefined) {
      mat.specularMap = texspec;
      mat.specular = new THREE.Color("orange");
    }
    
    let planeta = new THREE.Mesh(geom, mat);
  
    Tierra = planeta;
    scene.add(planeta);
}
```

Creamos la tierra en el init() como siempre:

