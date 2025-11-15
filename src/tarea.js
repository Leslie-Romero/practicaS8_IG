import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer, camera, camcontrols;
let Tierra;
let rotation = true;
let info;
let pauseButton;
let selectedMarker = null;
const datosVolcanes = [];

const txtSpace = new THREE.TextureLoader().load(
  "src/textures/2k_stars_milky_way.jpg"
);
txtSpace.colorSpace = THREE.SRGBColorSpace;
const txtEarthDay = new THREE.TextureLoader().load(
  "src/textures/2k_earth_daymap.jpg"
);
txtEarthDay.colorSpace = THREE.SRGBColorSpace;
const txtEarthSpec = new THREE.TextureLoader().load(
  "src/textures/2k_earth_specular_map.tif"
);
txtEarthSpec.colorSpace = THREE.SRGBColorSpace;
const txtEarthBump = new THREE.TextureLoader().load(
  "src/textures/earthbump1k.jpg"
);
txtEarthBump.colorSpace = THREE.SRGBColorSpace;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

init();
animate();


function init() {
  // Texto informacion
  info = document.createElement("div");
  info.classList.add("info");
  info.innerHTML = "Práctica S8 - Leslie Romero";
  document.body.appendChild(info);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  //Posición de la cámara
  camera.position.set(0, 0, 3);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const starGeo = new THREE.SphereGeometry(90, 64, 64);
  const starMat = new THREE.MeshBasicMaterial({
    map: txtSpace,
    side: THREE.BackSide
  });
  const starField = new THREE.Mesh(starGeo, starMat);
  scene.add(starField);

  camcontrols = new OrbitControls(camera, renderer.domElement);
  camcontrols.minDistance = 1.8;
  camcontrols.rotateSpeed = 0.6;
  camcontrols.enableDamping = true;
  camcontrols.dampingFactor = 0.05;

  window.addEventListener("click", onClick, false);
  window.addEventListener("mousemove", onHover, false);

  createLegend();

  function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(Tierra.children, true);

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      if (marker.userData) {
        showVolcanoInfo(marker.userData);

        if (selectedMarker) {
          let color = markerColor(selectedMarker.userData.ultimaErupcion);
          selectedMarker.material.color.set(color);
          selectedMarker.material.emissive.set(color);
        }
        
        marker.material.color.set(0xffff00);
        marker.material.emissive.set(0xffff00);
        selectedMarker = marker;
      }
    } else {
      if (selectedMarker) {
        let color = markerColor(selectedMarker.userData.ultimaErupcion);
        selectedMarker.material.color.set(color);
        selectedMarker.material.emissive.set(color);
        selectedMarker.scale.set(1, 1, 1)
        hideVolcanoInfo();
      }
    }
  }

  function onHover(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Tierra.children, true);
  
    Tierra.children.forEach(marker => {
      if (marker !== selectedMarker) marker.scale.set(1, 1, 1);
    });
  
    if (intersects.length > 0) {
      const marker = intersects[0].object;
      if (marker !== selectedMarker) marker.scale.set(1.2, 1.2, 1.2);
    }
  }

  pauseButton = createButton("Pause", false, "30px", "20px");
  pauseButton.onclick = function () {
    if (pauseButton.innerHTML == "Pause") {
      pauseButton.classList.add("active-btn");
      pauseButton.innerHTML = "Paused";
      rotation = false;
    } else if (pauseButton.innerHTML == "Paused") {
      pauseButton.classList.remove("active-btn");
      pauseButton.innerHTML = "Pause";
      rotation = true;
    }
  };
  document.body.appendChild(pauseButton);

  // Luz ambiente
  const Lamb = new THREE.AmbientLight(0xffe4b5, 0.5);
  scene.add(Lamb);

  const Lpunt = new THREE.PointLight(0xffe4b5, 2.5, 0, 2);
  Lpunt.position.set(2, 2, 0);
  Lpunt.castShadow = true;
  scene.add(Lpunt);
  
  Planeta(1.5, 30, 0xffffff, txtEarthDay, txtEarthBump, txtEarthSpec);
  console.log("Creada la Tierra");
  
  fetch("src/volcanoes.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error: " + response.statusText);
        }
        return response.text();
      })
      .then((content) => {
        procesarCSV(content);
      })
      .catch((error) => {
        console.error("Error al cargar el archivo:", error);
      });

}

function latLonToVector3(lat, lon, radius = 1) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
  
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
  
    return new THREE.Vector3(x, y, z);
}

function procesarCSV(content) {
  const sep = ";"; // separador ;
  const filas = content.split("\n");

  // Primera fila es el encabezado, separador ;
  const encabezados = filas[0].split(sep).map(h => h.trim());
  // Obtiene índices de columnas de interés
  const indices = {
    nombre: encabezados.indexOf("Volcano Name"),
    pais: encabezados.indexOf("Country"),
    ultimaErupcion: encabezados.indexOf("Last Known Eruption"),
    lat: encabezados.indexOf("Latitude"),
    lon: encabezados.indexOf("Longitude")
  };

  // Extrae los datos de interés de las estaciones
  for (let i = 1; i < filas.length; i++) {
    const columna = filas[i].split(sep); // separador ;
    if (columna.length > 1) {
      // No fila vacía, almacena datos
      datosVolcanes.push({
        nombre: columna[indices.nombre],
        pais: columna[indices.pais],
        ultimaErupcion: columna[indices.ultimaErupcion],
        lat: columna[indices.lat],
        lon: columna[indices.lon]
      });

      const lat = parseFloat(columna[indices.lat]);
      const lon = parseFloat(columna[indices.lon]);

      if (!isNaN(lat) && !isNaN(lon)) {
        const pos = latLonToVector3(lat, lon, 1.5);
        const geometry = new THREE.SphereGeometry(0.008, 8, 8);
        const material = new THREE.MeshPhongMaterial({
          color: markerColor(columna[indices.ultimaErupcion]),
          emissive: markerColor(columna[indices.ultimaErupcion])
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(pos);

        marker.userData = {
          nombre: columna[indices.nombre],
          pais: columna[indices.pais],
          ultimaErupcion: columna[indices.ultimaErupcion],
          lat,
          lon
        };

        Tierra.add(marker);
      }
    }
  }
  console.log("Archivo CSV cargado");
}

function markerColor(lastEruption) {
  if (lastEruption.includes("Unknown")) {
    return 0x1C0333;
  }

  let year = parseInt(lastEruption);

  if (lastEruption.includes("BCE")) {
      year += 2025
  }

  let yearsPassed = 2025 - year;

  if (yearsPassed <= 100) return 0xff0000;
  if (yearsPassed <= 1000) return 0xCC5500;
  if (yearsPassed <= 10000) return 0x770737;
  return 0x1C0333;
  
}

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

function createButton(name, isActive, top = "", right = "", bottom = "", left = "") {
  let btn = document.createElement("button");
  btn.innerHTML = name;
  btn.classList.add("btn");
  if (isActive) {
    btn.classList.add("active-btn");
  }
  btn.style.top = top;
  btn.style.bottom = bottom;
  btn.style.left = left;
  btn.style.right = right;
  return btn;
}

function showVolcanoInfo(data) {
  info.classList.remove("info");
  info.classList.add("volcano-info");
  info.innerHTML = `
    <strong>${data.nombre}</strong><br>
    Country: ${data.pais}<br>
    Last Eruption: ${data.ultimaErupcion}<br>
    Latitude: ${data.lat}<br>
    Longitude: ${data.lon}
  `;
}

function hideVolcanoInfo() {
  info.classList.remove("volcano-info");
  info.classList.add("info");
  info.innerHTML = "Práctica S8 - Leslie Romero";
}

function createLegend() {
  const legend = document.createElement("div");
  legend.id = "legend-box";

  legend.innerHTML = `
      <strong style="font-size: 14px;">Eruption recency</strong><br>
      <div class="color-item"><span class="color-dot" style="background:#ff0000"></span> Recent (1900–Now)</div>
      <div class="color-item"><span class="color-dot" style="background:#cc5500"></span> Medium (0–1900 CE)</div>
      <div class="color-item"><span class="color-dot" style="background:#770737"></span> Old (1000 BCE–0)</div>
      <div class="color-item"><span class="color-dot" style="background:#1c0333"></span> Ancient / Unknown</div>
  `;

  document.body.appendChild(legend);
}


function animate() {
  requestAnimationFrame(animate);

  if (rotation && Tierra) {
    Tierra.rotation.y -= 0.01;
  }

  camcontrols.update();
  renderer.render(scene, camera);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}