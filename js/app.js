// =====================================================
// Mueblería Hermanos Jota — Lógica del sitio
// Renderizado dinámico, carga asíncrona, carrito, búsqueda
// y validación de formulario. Sin backend.
// =====================================================

"use strict";

const pagina = document.body.dataset.pagina;

// -------------------------------------------------------
// Utilidades de formato
// -------------------------------------------------------
function formatearPrecio(valor) {
  return '$' + valor.toLocaleString('es-MX');
}

function rutaImagen(p, img) {
  img.onerror = function () {
    img.onerror = null;
    img.src = 'assets/img/placeholder.svg';
  };
  img.src = p.img;
  return img;
}

// -------------------------------------------------------
// Carga "asíncrona" del catálogo (simula una petición)
// -------------------------------------------------------
function cargarProductos() {
  return new Promise((resolver) => {
    setTimeout(() => resolver(productos), 650);
  });
}

// -------------------------------------------------------
// Plantillas de tarjetas
// -------------------------------------------------------
function crearTarjeta(p) {
  const articulo = document.createElement('article');
  articulo.className = 'tarjeta';
  articulo.dataset.productoId = p.id;

  const imagenWrap = document.createElement('div');
  imagenWrap.className = 'tarjeta__imagen-wrap';

  const imagen = document.createElement('img');
  imagen.className = 'tarjeta__imagen';
  imagen.alt = p.nombre;
  imagen.loading = 'lazy';
  rutaImagen(p, imagen);

  const cantidadBadge = document.createElement('span');
  cantidadBadge.className = 'tarjeta__cantidad-carrito';
  cantidadBadge.hidden = true;
  cantidadBadge.setAttribute('aria-label', 'Cantidad en el carrito');

  imagenWrap.appendChild(imagen);
  imagenWrap.appendChild(cantidadBadge);

  if (p.destacado) {
    const etiqueta = document.createElement('span');
    etiqueta.className = 'tarjeta__etiqueta';
    etiqueta.textContent = 'Destacado';
    imagenWrap.appendChild(etiqueta);
  }

  const cuerpo = document.createElement('div');
  cuerpo.className = 'tarjeta__cuerpo';

  const categoria = document.createElement('p');
  categoria.className = 'tarjeta__categoria';
  categoria.textContent = p.categoria;

  const enlaceNombre = document.createElement('a');
  enlaceNombre.className = 'tarjeta__nombre';
  enlaceNombre.href = 'producto.html?id=' + p.id;
  enlaceNombre.textContent = p.nombre;

  const descripcion = document.createElement('p');
  descripcion.className = 'tarjeta__descripcion';
  descripcion.textContent = p.descripcionCorta;

  const pie = document.createElement('div');
  pie.className = 'tarjeta__pie';

  const precio = document.createElement('span');
  precio.className = 'tarjeta__precio';
  precio.textContent = formatearPrecio(p.precio);

  const boton = document.createElement('a');
  boton.className = 'boton boton--primario';
  boton.href = 'producto.html?id=' + p.id;
  boton.textContent = 'Ver detalle';

  pie.appendChild(precio);
  pie.appendChild(boton);

  cuerpo.appendChild(categoria);
  cuerpo.appendChild(enlaceNombre);
  cuerpo.appendChild(descripcion);
  cuerpo.appendChild(pie);

  articulo.appendChild(imagenWrap);
  articulo.appendChild(cuerpo);

  return articulo;
}

// -------------------------------------------------------
// Página de inicio — productos destacados
// -------------------------------------------------------
async function renderizarDestacados() {
  const contenedor = document.getElementById('productos-destacados');
  if (!contenedor) return;

  const datos = await cargarProductos();
  const destacados = datos.filter((p) => p.destacado).slice(0, 4);

  contenedor.innerHTML = '';
  destacados.forEach((p) => {
    const envoltura = document.createElement('div');
    envoltura.className = 'grilla__item';
    envoltura.appendChild(crearTarjeta(p));
    contenedor.appendChild(envoltura);
  });

  actualizarContadorCarrito();
}

// -------------------------------------------------------
// Página catálogo — grilla completa + búsqueda
// -------------------------------------------------------
let catalogoActual = [];

async function renderizarCatalogo(filtro) {
  const contenedor = document.getElementById('grilla-productos');
  const contador = document.getElementById('resultado-contador');
  if (!contenedor) return;

  ensenarSpinner(contenedor, true);

  if (catalogoActual.length === 0) {
    catalogoActual = await cargarProductos();
  }

  const termino = (filtro || '').trim().toLowerCase();
  const visibles = catalogoActual.filter((p) =>
    p.nombre.toLowerCase().includes(termino) ||
    p.categoria.toLowerCase().includes(termino) ||
    p.descripcionCorta.toLowerCase().includes(termino)
  );

  ensenarSpinner(contenedor, false);
  contenedor.innerHTML = '';

  if (visibles.length === 0) {
    contenedor.appendChild(crearSinResultados(termino));
  } else {
    visibles.forEach((p) => {
      const envoltura = document.createElement('div');
      envoltura.className = 'grilla__item';
      envoltura.appendChild(crearTarjeta(p));
      contenedor.appendChild(envoltura);
    });
  }

  actualizarContadorCarrito();

  if (contador) {
    contador.innerHTML =
      'Mostrando <strong>' + visibles.length + '</strong> de <strong>' +
      catalogoActual.length + '</strong> productos';
  }
}

function crearSinResultados(termino) {
  const div = document.createElement('div');
  div.className = 'sin-resultados';
  div.innerHTML =
    '<div class="sin-resultados__icono"><svg class="icono" aria-hidden="true"><use href="#icono-sofa"></use></svg></div>' +
    '<h3>No encontramos muebles para "' +
    termino + '"</h3>' +
    '<p>Prueba con otro término o limpia la búsqueda.</p>';
  return div;
}

function ensenarSpinner(contenedor, activo) {
  const id = 'spinner-carga';
  if (activo) {
    if (contenedor.querySelector('#' + id)) return;
    const spinner = document.createElement('div');
    spinner.id = id;
    spinner.className = 'spinner';
    spinner.innerHTML =
      '<div class="spinner__anillo"></div><p>Cargando muebles…</p>';
    contenedor.appendChild(spinner);
  } else {
    const spinner = contenedor.querySelector('#' + id);
    if (spinner) spinner.remove();
  }
}

function prepararBusqueda() {
  const campo = document.getElementById('buscador');
  const botonLimpiar = document.getElementById('limpiar-busqueda');
  if (!campo) return;

  campo.addEventListener('input', () => {
    renderizarCatalogo(campo.value);
  });

  if (botonLimpiar) {
    botonLimpiar.addEventListener('click', () => {
      campo.value = '';
      renderizarCatalogo('');
      campo.focus();
    });
  }
}

function prepararBusquedaInicio() {
  const formulario = document.querySelector('.entrada--nav');
  if (!formulario) return;

  formulario.addEventListener('submit', (evento) => {
    const campo = formulario.querySelector('input');
    if (!campo.value.trim()) {
      evento.preventDefault();
      campo.focus();
    }
  });
}

// -------------------------------------------------------
// Página detalle — productos por id
// -------------------------------------------------------
async function renderizarDetalle() {
  const contenedor = document.getElementById('detalle-producto');
  if (!contenedor) return;

  const id = Number(new URLSearchParams(window.location.search).get('id'));
  const datos = await cargarProductos();
  const p = datos.find((item) => item.id === id);

  if (!p) {
    contenedor.innerHTML =
      '<div class="sin-resultados">' +
      '<div class="sin-resultados__icono"><svg class="icono" aria-hidden="true"><use href="#icono-lupa"></use></svg></div>' +
      '<h3>Producto no encontrado</h3>' +
      '<p>Es posible que el enlace haya cambiado.</p>' +
      '<p><a class="boton boton--primario" href="productos.html">Ir al catálogo</a></p>' +
      '</div>';
    return;
  }

  document.title = p.nombre + ' | Mueblería Hermanos Jota';
  const miga = document.getElementById('miga-producto');
  if (miga) miga.textContent = p.nombre;
  contenedor.innerHTML = construirDetalle(p);
  prepararDetalle(p);

  const hero = document.querySelector('[data-detalle-imagen]');
  if (hero) rutaImagen(p, hero);
}

function construirDetalle(p) {
  const stockClase = p.stock > 5 ? 'ok' : 'bajo';
  const stockTexto =
    p.stock > 5
      ? '<svg class="icono" aria-hidden="true"><use href="#icono-check"></use></svg> Disponible (' + p.stock + ' en almacén)'
      : '<svg class="icono" aria-hidden="true"><use href="#icono-alerta"></use></svg> Despacho inmediato (¡quedan ' + p.stock + '!)';

  const colores = p.colores
    .map((c) => '<button type="button" class="color-chip" data-color="' + c + '" aria-pressed="false">' + c + '</button>')
    .join('');

  let fichaHTML = '';
  const camposExcluidos = ['id', 'nombre', 'categoria', 'precio', 'img', 'destacado', 'stock', 'descripcionCorta', 'descripcion', 'colores'];

  for (const key in p) {
    if (Object.prototype.hasOwnProperty.call(p, key) && !camposExcluidos.includes(key)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      fichaHTML += '<div class="detalle__fila"><dt>' + label + '</dt><dd>' + (p[key] || '') + '</dd></div>';
    }
  }

  return (
    '<div class="detalle__grid">' +
    '  <div class="detalle__imagen-wrap">' +
    '    <img class="detalle__imagen" data-detalle-imagen alt="' + p.nombre + '">' +
    '  </div>' +
    '  <div class="detalle__info">' +
    '    <span class="detalle__categoria">' + p.categoria + '</span>' +
    '    <h1 class="detalle__nombre">' + p.nombre + '</h1>' +
    '    <p class="detalle__precio">' + formatearPrecio(p.precio) + '</p>' +
    '    <p class="detalle__stock detalle__stock--' + stockClase + '">' + stockTexto + '</p>' +
    '    <p class="detalle__descripcion">' + p.descripcion + '</p>' +
    '    <dl class="detalle__ficha">' + fichaHTML + '</dl>' +
    '    <p class="detalle__selector"><label for="cantidad">Cantidad:</label>' +
    '      <span class="cantidad">' +
    '        <button type="button" data-cantidad="menos" aria-label="Reducir">−</button>' +
    '        <input id="cantidad" type="number" value="1" min="1" max="' + p.stock + '" readonly>' +
    '        <button type="button" data-cantidad="mas" aria-label="Aumentar">+</button>' +
    '      </span>' +
    '    </p>' +
    '    <div class="detalle__colores" role="group" aria-label="Elige un color">' + colores + '</div>' +
    '    <p class="detalle__opciones-error" role="alert" hidden>Tienes que elegir un tema</p>' +
    '    <button type="button" class="boton boton--accent boton--amplio" data-agregar-carrito>' +
    '      <svg class="icono" aria-hidden="true"><use href="#icono-carrito"></use></svg> Añadir al Carrito — ' + formatearPrecio(p.precio) +
    '    </button>' +
    '  </div>' +
    '</div>'
  );
}

function prepararDetalle(p) {
  const input = document.getElementById('cantidad');
  const menos = document.querySelector('[data-cantidad="menos"]');
  const mas = document.querySelector('[data-cantidad="mas"]');
  const botonAgregar = document.querySelector('[data-agregar-carrito]');
  const opcionesColor = document.querySelectorAll('[data-color]');
  const mensajeError = document.querySelector('.detalle__opciones-error');
  let colorSeleccionado = '';

  function cambiarCantidad(delta) {
    let valor = Number(input.value) + delta;
    valor = Math.max(1, Math.min(p.stock, valor));
    input.value = valor;
  }

  menos.addEventListener('click', () => cambiarCantidad(-1));
  mas.addEventListener('click', () => cambiarCantidad(1));

  opcionesColor.forEach((opcion) => {
    opcion.addEventListener('click', () => {
      opcionesColor.forEach((elemento) => {
        elemento.classList.remove('color-chip--activo');
        elemento.setAttribute('aria-pressed', 'false');
      });
      opcion.classList.add('color-chip--activo');
      opcion.setAttribute('aria-pressed', 'true');
      colorSeleccionado = opcion.dataset.color;
      mensajeError.hidden = true;
    });
  });

  botonAgregar.addEventListener('click', () => {
    if (!colorSeleccionado) {
      mensajeError.hidden = false;
      return;
    }
    agregarAlCarrito(p.id, Number(input.value), colorSeleccionado);
  });
}

// -------------------------------------------------------
// Carrito simulado (localStorage + contador en el header)
// -------------------------------------------------------
const CLAVE_CARRITO = 'mhj-carrito';

function obtenerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
  } catch (e) {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
  const carrito = obtenerCarrito();
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  document.querySelectorAll('.contador-carrito').forEach((el) => {
    el.textContent = total;
    el.classList.toggle('oculto', total === 0);
  });

  document.querySelectorAll('.tarjeta__cantidad-carrito').forEach((badge) => {
    const tarjeta = badge.closest('.tarjeta');
    if (!tarjeta) return;

    const productoId = Number(tarjeta.dataset.productoId);
    const cantidad = carrito
      .filter((item) => item.id === productoId)
      .reduce((acc, item) => acc + item.cantidad, 0);

    if (cantidad > 0) {
      badge.textContent = cantidad;
      badge.hidden = false;
      badge.style.display = 'inline-flex';
    } else {
      badge.textContent = '';
      badge.hidden = true;
      badge.style.display = 'none';
    }
  });
}

function agregarAlCarrito(id, cantidad, color) {
  const carrito = obtenerCarrito();
  const existente = carrito.find((item) => item.id === id && item.color === color);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({ id: id, cantidad: cantidad, color: color });
  }

  guardarCarrito(carrito);
  actualizarContadorCarrito();
  mostrarToast(cantidad + ' producto(s) añadido(s) al carrito <svg class="icono" aria-hidden="true"><use href="#icono-carrito"></use></svg>');
}

let toastTemporizador = null;

function mostrarToast(mensaje) {
  let toast = document.querySelector('.toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }

  toast.innerHTML = mensaje;
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  clearTimeout(toastTemporizador);
  toastTemporizador = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 2400);
}

// -------------------------------------------------------
// Menú móvil (hamburguesa)
// -------------------------------------------------------
function prepararMenuMovil() {
  const boton = document.getElementById('menu-boton');
  const nav = document.getElementById('menu-principal');
  if (!boton || !nav) return;

  boton.addEventListener('click', () => {
    nav.classList.toggle('nav--abierta');
    boton.classList.toggle('menu-boton--activo');
  });
}

// -------------------------------------------------------
// Contacto — validación del lado del cliente
// -------------------------------------------------------
function prepararContacto() {
  const formulario = document.getElementById('formulario-contacto');
  if (!formulario) return;

  const campos = [
    { id: 'nombre', validar: validarNombre, mensaje: 'Ingresa tu nombre completo (mínimo 2 letras).' },
    { id: 'email', validar: validarEmail, mensaje: 'Ingresa un correo válido, por ejemplo: ana@correo.com' },
    { id: 'mensaje', validar: validarMensaje, mensaje: 'Escribe un mensaje de al menos 10 caracteres.' }
  ];

  const aviso = formulario.querySelector('.aviso');
  const avisoIcono = document.getElementById('aviso-icono');
  const avisoTexto = document.getElementById('aviso-texto');

  campos.forEach((campo) => {
    const input = document.getElementById(campo.id);
    if (!input) return;

    input.addEventListener('blur', () => {
      validarCampo(campo);
    });

    input.addEventListener('input', () => {
      if (input.closest('.campo--error')) {
        validarCampo(campo);
      }
    });
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    let todoValido = true;
    campos.forEach((campo) => {
      if (!validarCampo(campo)) todoValido = false;
    });

    if (!todoValido) {
      mostrarAviso(false, 'Revisa los campos marcados en rojo.');
      return;
    }

    formulario.reset();
    quitarDatosExitosos();
    mostrarAviso(true, '¡Gracias por escribirnos! Te contactaremos muy pronto.');
  });
}

function validarCampo(campo) {
  const input = document.getElementById(campo.id);
  const envoltura = input.closest('.campo');
  const mensaje = envoltura.querySelector('.campo__error');

  const valido = campo.validar(input.value.trim());

  envoltura.classList.toggle('campo--error', !valido);
  envoltura.classList.toggle('campo--ok', valido);
  mensaje.classList.toggle('campo__error--visible', !valido);
  input.setAttribute('aria-invalid', String(!valido));

  return valido;
}

function validarNombre(valor) {
  return valor.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(valor);
}

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(valor);
}

function validarMensaje(valor) {
  return valor.length >= 10;
}

function mostrarAviso(exito, texto) {
  const aviso = document.getElementById('aviso');
  const avisoIcono = document.getElementById('aviso-icono');
  const avisoTexto = document.getElementById('aviso-texto');

  aviso.classList.add('aviso--visible');
  aviso.classList.toggle('aviso--ok', exito);
  aviso.classList.toggle('aviso--error', !exito);
  avisoIcono.innerHTML = exito
    ? '<svg class="icono" aria-hidden="true"><use href="#icono-check-circulo"></use></svg>'
    : '<svg class="icono" aria-hidden="true"><use href="#icono-alerta-circulo"></use></svg>';
  avisoTexto.textContent = texto;

  window.scrollTo({ top: aviso.offsetTop - 120, behavior: 'smooth' });
}

function quitarDatosExitosos() {
  document.querySelectorAll('.campo--ok').forEach((c) => c.classList.remove('campo--ok'));
}

// -------------------------------------------------------
// Inicialización por página
// -------------------------------------------------------
function iniciar() {
  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  const heroFondo = document.querySelector('[data-hero-imagen]');
  if (heroFondo) {
    heroFondo.onerror = function () {
      this.remove();
    };
  }

  actualizarContadorCarrito();
  prepararMenuMovil();

  switch (pagina) {
    case 'inicio':
      prepararBusquedaInicio();
      renderizarDestacados();
      break;
    case 'productos':
      prepararBusqueda();
      renderizarCatalogo(new URLSearchParams(window.location.search).get('busqueda') || '');
      const busquedaInicial = document.getElementById('buscador');
      if (busquedaInicial) {
        busquedaInicial.value = new URLSearchParams(window.location.search).get('busqueda') || '';
      }
      break;
    case 'producto':
      renderizarDetalle();
      break;
    case 'contacto':
      prepararContacto();
      break;
  }
}

document.addEventListener('DOMContentLoaded', iniciar);
