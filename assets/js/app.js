// ============================================
// DESTINO MENDOZA - TURISMO & EXPERIENCIAS
// ============================================

// CONFIGURACIÓN
const CONFIG = {
  sitio: "data/site.json",
  alojamientos: "data/departamentos.json",
  paquetes: "data/paquetes.json",

  // Dejar vacío hasta configurar una nueva API Key
  // restringida para Google Drive API.
  googleApiKey: "AIzaSyACva5N9oPhLXuNV-3TjDQj3yMb3UynU5M"
};

let datosSitio = {};
let datosAlojamientos = [];
let datosPaquetes = [];


// ============================================
// INICIO
// ============================================

document.addEventListener("DOMContentLoaded", iniciarSitio);

async function iniciarSitio() {
  document.getElementById("anio-actual").textContent =
    new Date().getFullYear();

  try {
    const [sitio, alojamientos, paquetes] = await Promise.all([
      cargarJSON(CONFIG.sitio),
      cargarJSON(CONFIG.alojamientos),
      cargarJSON(CONFIG.paquetes)
    ]);

    datosSitio = sitio;
    datosAlojamientos = obtenerLista(alojamientos, [
      "alojamientos",
      "departamentos",
      "propiedades"
    ]);

    datosPaquetes = obtenerLista(paquetes, [
      "paquetes",
      "excursiones",
      "experiencias"
    ]);

    mostrarAlojamientos();
    mostrarPaquetes();
    configurarContacto();
    configurarRedes();

  } catch (error) {
    console.error("Error al iniciar el sitio:", error);

    mostrarError("lista-alojamientos");
    mostrarError("lista-paquetes");
  }
}


// ============================================
// CARGA DE ARCHIVOS JSON
// ============================================

async function cargarJSON(ruta) {
  const respuesta = await fetch(ruta);

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar: " + ruta);
  }

  return await respuesta.json();
}


function obtenerLista(datos, posiblesClaves) {
  if (Array.isArray(datos)) {
    return datos;
  }

  for (const clave of posiblesClaves) {
    if (Array.isArray(datos?.[clave])) {
      return datos[clave];
    }
  }

  return [];
}


function mostrarError(id) {
  const contenedor = document.getElementById(id);

  if (contenedor) {
    contenedor.innerHTML =
      '<p class="mensaje-error">No se pudo cargar la información. Intentá nuevamente más tarde.</p>';
  }
}


// ============================================
// FUNCIONES GENERALES
// ============================================

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caracter]);
}


function obtenerTexto(valor) {
  if (Array.isArray(valor)) {
    return valor.join(", ");
  }

  return valor ?? "";
}


function formatearPrecio(precio) {
  if (precio === undefined || precio === null || precio === "") {
    return "Consultar precio";
  }

  if (typeof precio === "string" && /[a-záéíóú$]/i.test(precio)) {
    return precio;
  }

  const numero = Number(precio);

  if (Number.isNaN(numero)) {
    return precio;
  }

  return "$" + numero.toLocaleString("es-AR");
}


// ============================================
// WHATSAPP
// ============================================

function obtenerNumeroWhatsApp() {
  return (
    datosSitio?.contacto?.whatsapp_numero ||
    datosSitio?.whatsapp_numero ||
    datosSitio?.contacto?.whatsapp ||
    ""
  ).toString().replace(/\D/g, "");
}


function crearEnlaceWhatsApp(mensaje) {
  const numero = obtenerNumeroWhatsApp();

  if (!numero) {
    return "#contacto";
  }

  return "https://wa.me/" + numero +
    "?text=" + encodeURIComponent(mensaje);
}


function crearEnlaceConsulta(alojamiento) {
  const nombre = alojamiento.nombre || "el alojamiento";

  return crearEnlaceWhatsApp(
    "Hola, quisiera consultar por disponibilidad y tarifas de " +
    nombre + "."
  );
}


function crearEnlacePaquete(paquete) {
  return crearEnlaceWhatsApp(
    "Hola, quisiera recibir información y reservar el paquete " +
    paquete.nombre + "."
  );
}


function configurarContacto() {
  const boton = document.getElementById("boton-whatsapp");

  if (!boton) return;

  boton.href = crearEnlaceWhatsApp(
    "Hola, quisiera recibir información sobre Destino Mendoza."
  );
}


// ============================================
// ALOJAMIENTOS
// ============================================

function mostrarAlojamientos() {
  const contenedor = document.getElementById("lista-alojamientos");

  if (!contenedor) return;

  if (!datosAlojamientos.length) {
    contenedor.innerHTML =
      '<p class="mensaje-error">Próximamente publicaremos nuestros alojamientos.</p>';
    return;
  }

  contenedor.innerHTML = datosAlojamientos.map(
    (alojamiento, indice) =>
      crearTarjetaAlojamiento(alojamiento, indice)
  ).join("");

  datosAlojamientos.forEach((alojamiento, indice) => {
    cargarFotosAlojamiento(alojamiento, indice);
  });
}


function crearTarjetaAlojamiento(alojamiento, indice) {
  const nombre = alojamiento.nombre || "Alojamiento en Mendoza";

  const zona =
    alojamiento.zona ||
    alojamiento.ubicacion?.zona ||
    alojamiento.localidad ||
    "";

  const descripcion =
    alojamiento.descripcion ||
    alojamiento.descripcion_corta ||
    alojamiento.detalle ||
    "Consultanos para conocer más sobre este alojamiento.";

  const servicios = Array.isArray(alojamiento.servicios)
    ? alojamiento.servicios
    : [];

  const direccion =
    alojamiento.ubicacion?.direccion ||
    alojamiento.direccion ||
    "";

  const precio = formatearPrecio(
    alojamiento.precio_desde ||
    alojamiento.precio ||
    ""
  );

  const booking =
    alojamiento.reservas?.url ||
    alojamiento.booking_url ||
    alojamiento.url_booking ||
    "";

  const carpeta = alojamiento.imagenes?.carpeta_id || "";

  const imagenes = alojamiento.imagenes?.archivos || [];

  const primeraImagen = imagenes.length
    ? crearURLImagenDrive(carpeta, imagenes[0])
    : "";

  return `
    <article class="tarjeta alojamiento-card">

      <div class="carrusel"
           id="carrusel-${indice}"
           data-indice="0">

        <div class="carrusel-imagenes"
             id="imagenes-${indice}">

          ${
            primeraImagen
              ? `<img src="${escaparHTML(primeraImagen)}"
                      alt="${escaparHTML(nombre)}"
                      loading="lazy">`
              : `<div class="imagen-placeholder">🏡</div>`
          }

        </div>

        <button class="carrusel-btn anterior"
                onclick="moverCarrusel(${indice}, -1)"
                aria-label="Imagen anterior">❮</button>

        <button class="carrusel-btn siguiente"
                onclick="moverCarrusel(${indice}, 1)"
                aria-label="Imagen siguiente">❯</button>

        <span class="carrusel-contador"
              id="contador-${indice}">1</span>

      </div>

      <div class="tarjeta-contenido">

        <p class="tarjeta-zona">${escaparHTML(zona)}</p>

        <h3>${escaparHTML(nombre)}</h3>

        <p>${escaparHTML(descripcion)}</p>

        ${
          direccion
            ? `<p class="alojamiento-direccion">
                 📍 ${escaparHTML(direccion)}
               </p>`
            : ""
        }

        ${
          servicios.length
            ? `<div class="servicios">
                 <h4>Servicios</h4>
                 <ul>
                   ${servicios.map(servicio =>
                     `<li>${escaparHTML(servicio)}</li>`
                   ).join("")}
                 </ul>
               </div>`
            : ""
        }

        <div class="alojamiento-precio">
          <span>Desde</span>
          <strong>${escaparHTML(precio)}</strong>
        </div>

        <div class="botones-tarjeta">

          ${
            booking
              ? `<a href="${escaparHTML(booking)}"
                    class="boton boton-booking"
                    target="_blank"
                    rel="noopener noreferrer">
                    RESERVAR EN BOOKING
                 </a>`
              : ""
          }

          <a href="${escaparHTML(crearEnlaceConsulta(alojamiento))}"
             class="boton boton-whatsapp"
             target="_blank"
             rel="noopener noreferrer">
             CONSULTAR POR WHATSAPP
          </a>

        </div>

      </div>

    </article>
  `;
}


// ============================================
// FOTOS DE GOOGLE DRIVE
// ============================================

function crearURLImagenDrive(carpetaId, archivo) {
  if (!archivo) return "";

  // Si ya es una URL completa, se utiliza directamente.
  if (typeof archivo === "string" &&
      archivo.startsWith("http")) {
    return archivo;
  }

  const id = String(archivo).replace(/\.[^/.]+$/, "");

  return "https://drive.google.com/thumbnail?id=" +
    encodeURIComponent(id) + "&sz=w1200";
}


async function buscarImagenesDrive(carpetaId) {
  if (!CONFIG.googleApiKey || !carpetaId) {
    return [];
  }

  const consulta = encodeURIComponent(
    `'${carpetaId}' in parents and trashed=false`
  );

  const url =
    "https://www.googleapis.com/drive/v3/files" +
    "?q=" + consulta +
    "&fields=files(id,name,mimeType)" +
    "&pageSize=100" +
    "&key=" + encodeURIComponent(CONFIG.googleApiKey);

  try {
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error("Error consultando Google Drive");
    }

    const datos = await respuesta.json();

    return (datos.files || [])
      .filter(archivo =>
        archivo.mimeType?.startsWith("image/")
      )
      .map(archivo => archivo.id);

  } catch (error) {
    console.error("Error cargando imágenes:", error);
    return [];
  }
}


async function cargarFotosAlojamiento(alojamiento, indice) {
  const contenedor =
    document.getElementById("imagenes-" + indice);

  if (!contenedor) return;

  const carpeta = alojamiento.imagenes?.carpeta_id || "";

  const archivos = alojamiento.imagenes?.archivos || [];

  let fotos = archivos.map(archivo =>
    crearURLImagenDrive(carpeta, archivo)
  );

  // Si no hay archivos definidos, intentar consultar Drive.
  if (!fotos.length && CONFIG.googleApiKey && carpeta) {
    const ids = await buscarImagenesDrive(carpeta);

    fotos = ids.map(id => crearURLImagenDrive(carpeta, id));
  }

  if (!fotos.length) {
    contenedor.innerHTML =
      '<div class="imagen-placeholder">🏡</div>';
    return;
  }

  contenedor.innerHTML = fotos.map((url, posicion) => `
    <img
      src="${escaparHTML(url)}"
      alt="${escaparHTML(alojamiento.nombre || "Alojamiento")} - Foto ${posicion + 1}"
      loading="lazy"
      style="display:${posicion === 0 ? "block" : "none"}"
      onerror="this.style.display='none'"
    >
  `).join("");

  const contador = document.getElementById("contador-" + indice);

  if (contador) {
    contador.textContent = "1 / " + fotos.length;
  }

  const carrusel = document.getElementById("carrusel-" + indice);

  if (carrusel) {
    carrusel.dataset.total = fotos.length;
  }
}


// ============================================
// CONTROLES DEL CARRUSEL
// ============================================

function moverCarrusel(indice, direccion) {
  const contenedor =
    document.getElementById("imagenes-" + indice);

  const carrusel =
    document.getElementById("carrusel-" + indice);

  const contador =
    document.getElementById("contador-" + indice);

  if (!contenedor || !carrusel) return;

  const imagenes = contenedor.querySelectorAll("img");

  if (imagenes.length <= 1) return;

  let actual = Number(carrusel.dataset.indice || 0);

  actual += direccion;

  if (actual < 0) {
    actual = imagenes.length - 1;
  }

  if (actual >= imagenes.length) {
    actual = 0;
  }

  carrusel.dataset.indice = actual;

  imagenes.forEach((imagen, posicion) => {
    imagen.style.display =
      posicion === actual ? "block" : "none";
  });

  if (contador) {
    contador.textContent =
      (actual + 1) + " / " + imagenes.length;
  }
}


// ============================================
// PAQUETES TURÍSTICOS
// ============================================

function mostrarPaquetes() {
  const contenedor = document.getElementById("lista-paquetes");

  if (!contenedor) return;

  const paquetesActivos = datosPaquetes.filter(paquete =>
    paquete.activo !== false
  );

  if (!paquetesActivos.length) {
    contenedor.innerHTML =
      '<p class="mensaje-error">Próximamente publicaremos nuevas experiencias.</p>';
    return;
  }

  contenedor.innerHTML = paquetesActivos.map(paquete =>
    crearTarjetaPaquete(paquete)
  ).join("");
}


function crearTarjetaPaquete(paquete) {
  const nombre = paquete.nombre || "Experiencia en Mendoza";

  const imagen =
    paquete.imagen_principal ||
    paquete.imagen ||
    "";

  const descripcion =
    paquete.descripcion ||
    paquete.descripcion_corta ||
    "";

  const duracion = paquete.duracion || "";

  const categoria = paquete.categoria || "Excursión";

  const precio = formatearPrecio(
    paquete.precio ||
    paquete.precio_desde ||
    ""
  );

  const incluye = paquete.incluye || [];
  const noIncluye = paquete.no_incluye || [];
  const itinerario = paquete.itinerario || [];

  const detalles = `
    <details class="paquete-detalles">

      <summary>VER DETALLES E ITINERARIO</summary>

      ${
        itinerario.length
          ? `<div class="itinerario">
               <h4>🗺️ Itinerario</h4>
               <ul>
                 ${itinerario.map(paso => `
                   <li>${escaparHTML(
                     typeof paso === "object"
                       ? (paso.descripcion || paso.detalle || paso.nombre || "")
                       : paso
                   )}</li>
                 `).join("")}
               </ul>
             </div>`
          : ""
      }

      ${
        incluye.length
          ? `<div class="paquete-incluye">
               <h4>✓ ¿Qué incluye?</h4>
               <ul>
                 ${incluye.map(item =>
                   `<li>${escaparHTML(item)}</li>`
                 ).join("")}
               </ul>
             </div>`
          : ""
      }

      ${
        noIncluye.length
          ? `<div class="paquete-no-incluye">
               <h4>✕ No incluye</h4>
               <ul>
                 ${noIncluye.map(item =>
                   `<li>${escaparHTML(item)}</li>`
                 ).join("")}
               </ul>
             </div>`
          : ""
      }

      ${
        paquete.notas
          ? `<p class="paquete-notas">${escaparHTML(paquete.notas)}</p>`
          : ""
      }

    </details>
  `;

  return `
    <article class="tarjeta paquete-card">

      <div class="paquete-imagen">
        ${
          imagen
            ? `<img src="${escaparHTML(imagen)}"
                    alt="${escaparHTML(nombre)}"
                    loading="lazy">`
            : `<div class="imagen-placeholder">🌄</div>`
        }
      </div>

      <div class="tarjeta-contenido">

        <span class="paquete-categoria">
          ${escaparHTML(categoria)}
        </span>

        <h3>${escaparHTML(nombre)}</h3>

        ${
          duracion
            ? `<p class="paquete-duracion">⏱️ ${escaparHTML(duracion)}</p>`
            : ""
        }

        <p>${escaparHTML(descripcion)}</p>

        ${
          paquete.destacado
            ? `<p class="paquete-destacado">⭐ Experiencia destacada</p>`
            : ""
        }

        <div class="paquete-precio">
          <span>Precio por persona</span>
          <strong>${escaparHTML(precio)}</strong>
        </div>

        ${detalles}

        <a
          href="${escaparHTML(crearEnlacePaquete(paquete))}"
          class="boton boton-whatsapp"
          target="_blank"
          rel="noopener noreferrer"
        >
          CONSULTAR Y RESERVAR
        </a>

      </div>

    </article>
  `;
}


// ============================================
// REDES SOCIALES
// ============================================

function configurarRedes() {
  const instagram = document.getElementById("enlace-instagram");
  const facebook = document.getElementById("enlace-facebook");

  const urlInstagram =
    datosSitio?.redes?.instagram || "";

  const urlFacebook =
    datosSitio?.redes?.facebook || "";

  if (instagram && urlInstagram) {
    instagram.href = urlInstagram;
    instagram.hidden = false;
  }

  if (facebook && urlFacebook) {
    facebook.href = urlFacebook;
    facebook.hidden = false;
  }
                         }
