const carrito = [];

function mostrarCategoria(indice) {
  const tabs = document.querySelectorAll(".sidebar button.tab");
  const contenedores = document.querySelectorAll(".contenedor");
  tabs.forEach((tab, i) => tab.classList.toggle("active", i === indice));
  contenedores.forEach((cont, i) => cont.classList.toggle("active", i === indice));
}

function modificarCantidad(btn, delta) {
  const cont = btn.parentNode.querySelector(".counter");
  let cantidad = parseInt(cont.textContent);
  cantidad += delta;
  if (cantidad < 0) cantidad = 0;
  if (cantidad > 10) cantidad = 10; // máximo 10 por producto
  cont.textContent = cantidad;
}

function agregarAlCarrito(btn) {
  const producto = btn.closest(".producto");
  const nombre = producto.querySelector("h4").textContent;
  const precio = parseFloat(producto.querySelector("p").textContent.replace("S/ ", ""));
  const cantidad = parseInt(producto.querySelector(".counter").textContent);

  if (cantidad === 0) {
    mostrarToast("Por favor, selecciona al menos 1 unidad para agregar al carrito.", true);
    return;
  }

  const index = carrito.findIndex(item => item.nombre === nombre);
  if (index > -1) {
    carrito[index].cantidad += cantidad;
    if (carrito[index].cantidad > 10) carrito[index].cantidad = 10;
  } else {
    carrito.push({ nombre, precio, cantidad });
  }

  producto.querySelector(".counter").textContent = "0";
  actualizarCarrito();
  mostrarToast(`Agregado al carrito: ${nombre} x${cantidad}`);
}

function mostrarToast(mensaje, esError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.className = "toast show";
  toast.style.backgroundColor = esError ? "#dc3545" : "#28a745";
  setTimeout(() => {
    toast.className = "toast";
    toast.style.backgroundColor = "#28a745";
  }, 1800);
}

function toggleCarrito() {
  const cartContainer = document.getElementById("cart-container");
  cartContainer.style.display = cartContainer.style.display === "none" ? "block" : "none";
}

function actualizarCarrito() {
  const cartList = document.getElementById("cart-list");
  const cartTotal = document.getElementById("cart-total");
  const cartCount = document.getElementById("cart-count");
  cartList.innerHTML = "";

  let total = 0;
  let count = 0;
  carrito.forEach((item, idx) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    count += item.cantidad;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.nombre} x${item.cantidad}</span>
      <span>S/ ${subtotal.toFixed(2)}
        <button class="cart-remove" onclick="eliminarDelCarrito(${idx})">X</button>
      </span>
    `;
    cartList.appendChild(li);
  });

  cartTotal.textContent = `Total: S/ ${total.toFixed(2)}`;
  cartCount.textContent = count;
}

function pagarCarrito() {
  if (carrito.length === 0) {
    mostrarToast("El carrito está vacío.", true);
    return;
  }
  mostrarBoletaCompra();
  document.getElementById("form-compra").style.display = "flex";
}

function mostrarBoletaCompra() {
  const resumenDiv = document.getElementById("resumen-boleta");
  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();
  const numBoleta = Math.floor(Math.random() * 900000 + 100000);

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <img src="https://files.catbox.moe/c1805q.jpg" alt="Logo" style="height:40px;">
      <div style="text-align:right;">
        <div style="font-size:0.95em;color:#888;">Boleta N°: <b>${numBoleta}</b></div>
        <div style="font-size:0.95em;color:#888;">Fecha: <span id="fecha-boleta">${fechaStr}</span></div>
      </div>
    </div>
    <div class="boleta-titulo">Detalle de Productos</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <th style="background:#e9ecef;">Producto</th>
        <th style="background:#e9ecef;">Cant.</th>
        <th style="background:#e9ecef;">Precio</th>
        <th style="background:#e9ecef;">Subtotal</th>
      </tr>
  `;
  let total = 0;
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    html += `
      <tr>
        <td>${item.nombre}</td>
        <td>${item.cantidad}</td>
        <td>S/ ${item.precio.toFixed(2)}</td>
        <td>S/ ${subtotal.toFixed(2)}</td>
      </tr>
    `;
  });
  html += `
    </table>
    <div class="boleta-total" style="text-align:right;font-size:1.1em;margin-top:8px;">
      Total a pagar: <span style="color:#28a745;">S/ ${total.toFixed(2)}</span>
    </div>
  `;
  resumenDiv.innerHTML = html;
}

async function enviarCompra(event) {
  event.preventDefault();

  // Detecta el método de pago seleccionado
  const metodo = document.querySelector('input[name="metodo-pago"]:checked').value;

  if (metodo === "Yape/Plin") {
    const email = document.getElementById('correo-usuario').value;
    const fileInput = document.getElementById('comprobante-yape');
    const file = fileInput.files[0];
    if (!file) {
      alert("Debes subir el comprobante.");
      return;
    }
    await enviarComprobanteADiscord(email, file);
    alert("Comprobante enviado. Te avisaremos por correo cuando verifiquemos el pago.");
    document.getElementById('form-compra').style.display = 'none';
    return;
  }

  // Obtener el correo del input
  const email = document.getElementById('correo-usuario').value;
  if (!email) {
    alert("Debes ingresar un correo.");
    return;
  }

  // Calcular la cantidad total de productos en el carrito
  let cantidadTotal = 0;
  carrito.forEach(item => {
    cantidadTotal += item.cantidad;
  });

  // Generar las licencias según la cantidad total
  let licencias = [];
  for (let i = 0; i < cantidadTotal; i++) {
    licencias.push('LIC-' + Math.random().toString(36).substr(2, 10).toUpperCase());
  }
  const licenciasTexto = licencias.join('\n');

  // Envía el correo usando EmailJS
  emailjs.send("service_t2dvd5v", "template_7kroxs9", {
    to_email: email,
    licencia: licenciasTexto,
    title: "Licencias DeathX"
  })
  .then(function(response) {
    document.getElementById('form-compra').style.display = 'none';
    // Mostrar mensaje simple de éxito
    mostrarMensajeLicenciaEnviada();
  }, function(error) {
    alert("Error al enviar el correo. Intenta nuevamente.");
  });
}

function cerrarFormularioCompra() {
  document.getElementById("form-compra").style.display = "none";
}

function eliminarDelCarrito(idx) {
  if (confirm("¿Eliminar este producto del carrito?")) {
    carrito.splice(idx, 1);
    actualizarCarrito();
  }
}

function abrirModal(img) {
  const producto = img.closest(".producto");
  const modal = document.getElementById("modal");
  modal.classList.add("active");
  document.getElementById("modal-img").src = img.src;
  document.getElementById("modal-title").textContent = producto.querySelector("h4").textContent;
  document.getElementById("modal-price").textContent = producto.querySelector("p").textContent;
  document.getElementById("modal-descripcion").textContent = producto.getAttribute("data-descripcion");
}

function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("active");
}

// Cerrar modal al hacer clic fuera del contenido
document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") {
    cerrarModal();
  }
});

// Modal bonito para mostrar licencias
function mostrarMensajeLicenciaEnviada() {
  // Si ya existe, elimínalo
  const old = document.getElementById('modal-licencias');
  if (old) old.remove();

  // Crea el modal
  const modal = document.createElement('div');
  modal.id = 'modal-licencias';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.45)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';

  modal.innerHTML = `
    <div style="background:#fff; padding:32px 24px 24px 24px; border-radius:14px; min-width:320px; max-width:90vw; box-shadow:0 8px 32px #0002; text-align:center; position:relative;">
      <button id="cerrar-modal-licencias" style="position:absolute;top:12px;right:16px;font-size:1.5em;background:none;border:none;cursor:pointer;color:#888;">&times;</button>
      <h2 style="color:#2e7d32;margin-top:0;">¡Licencias enviadas!</h2>
      <div style="margin:18px 0 12px 0;">
        <p style="color:#333;font-size:1.1em;">Revisa tu correo electrónico para ver tus licencias.</p>
      </div>
      <p style="color:#555;font-size:15px;">Si no ves el correo, revisa tu bandeja de spam o promociones.</p>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('cerrar-modal-licencias').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

document.getElementById('comprobante-yape').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const previewContainer = document.getElementById('preview-comprobante-yape-container');
  previewContainer.innerHTML = ''; // Limpia cualquier imagen previa

  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const img = document.createElement('img');
      img.id = 'preview-comprobante-yape';
      img.src = evt.target.result;
      img.style.maxWidth = '120px';
      img.style.maxHeight = '120px';
      img.style.display = 'block';
      img.style.margin = '20px auto 0 auto'; // <-- margen superior para bajarla
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 2px 8px #0002';
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

async function enviarComprobanteADiscord(email, file) {
  // 1. Subir imagen a Imgur
  const clientId = 'adb5d42a65422d1'; // <-- Tu Client-ID de Imgur
  let imageUrl = '';
  try {
    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Usa FormData en vez de JSON
    const formData = new FormData();
    formData.append('image', base64);
    formData.append('type', 'base64');

    const imgurResp = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID ' + clientId
        // NO pongas 'Content-Type', el navegador lo pone solo para FormData
      },
      body: formData
    });
    const imgurData = await imgurResp.json();
    console.log(imgurData);
    if (!imgurData.success) {
      alert('Error al subir la imagen a Imgur. Intenta nuevamente.');
      return;
    }
    imageUrl = imgurData.data.link;
  } catch (e) {
    alert('No se pudo subir la imagen. Intenta nuevamente.');
    return;
  }

  // 2. Enviar a Discord
  const webhookURL = "https://discord.com/api/webhooks/1381074076277149706/NiiZT9ZV_yIswrFkjx9tIKCJYIOGK0to-f8M0tHXugaOLHFaj0ZqNxkKOY7RZAreL8tf";
  const mensaje = {
    content: `Nuevo comprobante de Yape/Plin:\nCorreo: ${email}\nComprobante: ${imageUrl}`
  };
  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mensaje)
  });
}

function enviarLicenciasAdmin() {
  const email = document.getElementById('admin-correo').value;
  const cantidad = parseInt(document.getElementById('admin-cantidad').value, 10);
  if (!email || cantidad < 1) {
    alert("Completa el correo y la cantidad.");
    return;
  }
  let licencias = [];
  for (let i = 0; i < cantidad; i++) {
    licencias.push('LIC-' + Math.random().toString(36).substr(2, 10).toUpperCase());
  }
  const licenciasTexto = licencias.join('\n');
  emailjs.send("service_t2dvd5v", "template_7kroxs9", {
    to_email: email,
    licencia: licenciasTexto,
    title: "Licencias DeathX"
  })
  .then(function(response) {
    alert("Licencias enviadas correctamente.");
  }, function(error) {
    alert("Error al enviar el correo.");
  });
}

document.getElementById('show-admin-panel').onclick = function() {
  const pass = prompt("Contraseña de admin:");
  if (pass === "miclave123") {
    document.getElementById('admin-licencias').style.display = 'block';
  } else {
    alert("Contraseña incorrecta.");
  }
};

