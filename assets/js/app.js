"use strict";

/* CONFIGURACIÓN */

const CONFIG = {
    sitio: "data/site.json",
    alojamientos: "data/departamentos.json",

    // Pegá acá tu NUEVA clave API restringida
    googleApiKey: "AIzaSyACva5N9oPhLXuNV-3TjDQj3yMb3UynU5M"
};


/* INICIO */

document.addEventListener("DOMContentLoaded", iniciarSitio);


async function iniciarSitio() {

    const anio = document.getElementById("anio");

    if (anio) {
        anio.textContent = new Date().getFullYear();
    }

    try {

        const [sitio, datos] = await Promise.all([
            cargarJSON(CONFIG.sitio),
            cargarJSON(CONFIG.alojamientos)
        ]);

        mostrarInformacionEmpresa(sitio);

        window.sitioConfiguracion = sitio;

        configurarContacto(sitio);
        configurarRedes(sitio);

        await mostrarAlojamientos(datos.alojamientos || []);

    } catch (error) {

        console.error("Error al iniciar:", error);

        document.getElementById("lista-alojamientos").innerHTML =
            "<p class='mensaje-carga'>No se pudieron cargar los alojamientos.</p>";

    }

}


/* CARGAR JSON */

async function cargarJSON(ruta) {

    const respuesta = await fetch(ruta);

    if (!respuesta.ok) {
        throw new Error("No se pudo cargar: " + ruta);
    }

    return await respuesta.json();

}


/* INFORMACIÓN EMPRESA */

function mostrarInformacionEmpresa(sitio) {

    const descripcion = document.getElementById(
        "descripcion-empresa"
    );

    if (descripcion && sitio.empresa?.descripcion) {
        descripcion.textContent = sitio.empresa.descripcion;
    }

}


/* BUSCAR FOTOS EN GOOGLE DRIVE */

async function buscarImagenesDrive(carpetaId) {

    if (!CONFIG.googleApiKey ||
        CONFIG.googleApiKey === "PEGAR_AQUI_TU_CLAVE_NUEVA") {

        throw new Error("Falta configurar la clave API.");

    }

    const consulta = `'${carpetaId}' in parents and trashed = false`;

    const parametros = new URLSearchParams({
        q: consulta,
        fields: "files(id,name,mimeType)",
        pageSize: "1000",
        key: CONFIG.googleApiKey
    });

    const url =
        "https://www.googleapis.com/drive/v3/files?" +
        parametros.toString();

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
        throw new Error("Error consultando Google Drive.");
    }

    const datos = await respuesta.json();

    const archivos = datos.files || [];

    const mapa = {};

    archivos.forEach(archivo => {

        if (archivo.mimeType === "image/jpeg" ||
            archivo.mimeType === "image/png" ||
            archivo.mimeType === "image/webp") {

            mapa[archivo.name] = archivo.id;

        }

    });

    return mapa;

}


/* MOSTRAR ALOJAMIENTOS */

async function mostrarAlojamientos(alojamientos) {

    const contenedor = document.getElementById(
        "lista-alojamientos"
    );

    const activos = alojamientos.filter(
        alojamiento => alojamiento.activo !== false
    );

    if (activos.length === 0) {

        contenedor.innerHTML =
            "<p class='mensaje-carga'>Próximamente publicaremos nuestros alojamientos.</p>";

        return;

    }

    contenedor.replaceChildren();

    for (const alojamiento of activos) {

        const tarjeta = crearTarjeta(alojamiento);

        contenedor.appendChild(tarjeta);

        try {

            const imagenes = alojamiento.imagenes || {};

            const carpetaId = imagenes.carpeta_id;

            if (!carpetaId) {
                continue;
            }

            const archivosDrive = await buscarImagenesDrive(carpetaId);

            const nombres = imagenes.archivos || [];

            const primeraFoto = nombres.find(
                nombre => archivosDrive[nombre]
            );

            if (primeraFoto) {

                const imagen = document.createElement("img");

                imagen.className = "tarjeta-imagen";

                imagen.src = crearURLImagen(
                    archivosDrive[primeraFoto]
                );

                imagen.alt = alojamiento.nombre || "Alojamiento en Mendoza";

                imagen.loading = "lazy";

                imagen.onerror = function () {
                    this.style.display = "none";
                };

                tarjeta.prepend(imagen);

            }

        } catch (error) {

            console.error(
                "Error cargando fotos de " + alojamiento.nombre,
                error
            );

        }

    }

}


/* CREAR TARJETA */

function crearTarjeta(alojamiento) {

    const tarjeta = document.createElement("article");

    tarjeta.className = "tarjeta";

    const contenido = document.createElement("div");

    contenido.className = "tarjeta-contenido";

    const titulo = document.createElement("h3");

    titulo.textContent = alojamiento.nombre || "Alojamiento";

    contenido.appendChild(titulo);

    const zona = document.createElement("p");

    zona.textContent = alojamiento.zona || "Mendoza";

    contenido.appendChild(zona);

    const descripcion = document.createElement("p");

    descripcion.textContent =
        alojamiento.descripcion_corta || "";

    contenido.appendChild(descripcion);

    const capacidad = document.createElement("p");

    capacidad.textContent =
        "Capacidad: " +
        (alojamiento.capacidad || "Consultar") +
        " personas";

    contenido.appendChild(capacidad);

    if (alojamiento.precio_desde) {

        const precio = document.createElement("p");

        precio.className = "tarjeta-precio";

        precio.textContent =
            "Desde $" +
            Number(alojamiento.precio_desde).toLocaleString("es-AR");

        contenido.appendChild(precio);

    }

    const boton = document.createElement("a");

    boton.className = "tarjeta-boton";

    boton.href = crearEnlaceConsulta(alojamiento);

    boton.target = "_blank";

    boton.rel = "noopener noreferrer";

    boton.textContent = "CONSULTAR DISPONIBILIDAD →";

    contenido.appendChild(boton);

    tarjeta.appendChild(contenido);

    return tarjeta;

}


/* URL DE IMAGEN */

function crearURLImagen(fileId) {

    return "https://drive.google.com/thumbnail?id=" +
        encodeURIComponent(fileId) +
        "&sz=w1200";

}


/* CONTACTO */

function configurarContacto(sitio) {

    const boton = document.getElementById("boton-whatsapp");

    if (!boton) return;

    const numero = String(
        sitio.contacto?.whatsapp_numero || ""
    ).replace(/\D/g, "");

    const mensaje = sitio.contacto?.mensaje ||
        "Hola, quiero consultar por Destino Mendoza.";

    if (!numero) {

        boton.href = "#contacto";

        return;

    }

    boton.href =
        "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(mensaje);

    boton.target = "_blank";

    boton.rel = "noopener noreferrer";

}


/* CONSULTAS */

function crearEnlaceConsulta(alojamiento) {

    const sitio = window.sitioConfiguracion || {};

    const numero = String(
        sitio.contacto?.whatsapp_numero || ""
    ).replace(/\D/g, "");

    if (!numero) {
        return "#contacto";
    }

    const mensaje =
        "Hola, quiero consultar por el alojamiento: " +
        (alojamiento.nombre || "");

    return "https://wa.me/" +
        numero +
        "?text=" +
        encodeURIComponent(mensaje);

}


/* REDES SOCIALES */

function configurarRedes(sitio) {

    const facebook = document.getElementById("facebook");

    const instagram = document.getElementById("instagram");

    if (facebook && sitio.redes?.facebook) {

        facebook.href = sitio.redes.facebook;

        facebook.hidden = false;

    }

    if (instagram && sitio.redes?.instagram) {

        instagram.href = sitio.redes.instagram;

        instagram.hidden = false;

    }

}
