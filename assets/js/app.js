"use strict";

/* CONFIGURACIÓN */

const RUTAS = {
    sitio: "data/site.json",
    alojamientos: "data/departamentos.json"
};


/* INICIO */

document.addEventListener("DOMContentLoaded", iniciarSitio);


async function iniciarSitio() {

    document.getElementById("anio").textContent =
        new Date().getFullYear();

    try {

        const [sitio, datos] = await Promise.all([
            cargarJSON(RUTAS.sitio),
            cargarJSON(RUTAS.alojamientos)
        ]);

        mostrarInformacionEmpresa(sitio);

        mostrarAlojamientos(datos.alojamientos || []);

        configurarContacto(sitio);

        configurarRedes(sitio);

    } catch (error) {

        console.error("Error al iniciar el sitio:", error);

        document.getElementById("lista-alojamientos").innerHTML =
            "<p class='mensaje-carga'>No se pudieron cargar los alojamientos. Intentá nuevamente más tarde.</p>";

    }

}


/* CARGA DE JSON */

async function cargarJSON(ruta) {

    const respuesta = await fetch(ruta);

    if (!respuesta.ok) {
        throw new Error("No se pudo cargar: " + ruta);
    }

    return await respuesta.json();

}


/* INFORMACIÓN DE LA EMPRESA */

function mostrarInformacionEmpresa(sitio) {

    const descripcion = document.getElementById(
        "descripcion-empresa"
    );

    if (sitio.empresa?.descripcion) {
        descripcion.textContent = sitio.empresa.descripcion;
    }

}


/* MOSTRAR ALOJAMIENTOS */

function mostrarAlojamientos(alojamientos) {

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

    activos.forEach(alojamiento => {

        const tarjeta = crearTarjeta(alojamiento);

        contenedor.appendChild(tarjeta);

    });

}


/* CREAR TARJETA */

function crearTarjeta(alojamiento) {

    const tarjeta = document.createElement("article");

    tarjeta.className = "tarjeta";

    const imagenes = Array.isArray(alojamiento.imagenes)
        ? alojamiento.imagenes
        : [];

    const primeraImagen = imagenes.find(
        imagen => imagen && imagen.file_id
    );

    if (primeraImagen) {

        const imagen = document.createElement("img");

        imagen.className = "tarjeta-imagen";

        imagen.src = crearURLImagen(primeraImagen.file_id);

        imagen.alt = primeraImagen.alt || alojamiento.nombre || "Alojamiento en Mendoza";

        imagen.loading = "lazy";

        imagen.onerror = function () {
            this.style.display = "none";
        };

        tarjeta.appendChild(imagen);

    }

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


/* IMÁGENES DE GOOGLE DRIVE */

function crearURLImagen(fileId) {

    return "https://drive.google.com/thumbnail?id=" +
        encodeURIComponent(fileId) +
        "&sz=w1200";

}


/* CONTACTO */

function configurarContacto(sitio) {

    const boton = document.getElementById("boton-whatsapp");

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


/* CONSULTA DE CADA ALOJAMIENTO */

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

    window.sitioConfiguracion = sitio;

    const facebook = document.getElementById("facebook");

    const instagram = document.getElementById("instagram");

    if (sitio.redes?.facebook) {

        facebook.href = sitio.redes.facebook;

        facebook.hidden = false;

    }

    if (sitio.redes?.instagram) {

        instagram.href = sitio.redes.instagram;

        instagram.hidden = false;

    }

    }
