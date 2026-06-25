import {
  loginUsuario, registrarUsuario, decodeToken,
  getProductos, getCategorias, postProducto, updateProducto, deleteProducto, getProductoById,
  getCarrito, agregarAlCarrito, actualizarCantidadCarrito, eliminarDelCarrito, checkout,
  getUsuarios, cambiarRol
} from './productosApi.js'
import { validarFormulario } from './validaciones.js'

// ── Estado global ──────────────────────────────────────────────
let userRole = null
let productos = []
let editingId = null

// ── Referencias DOM ────────────────────────────────────────────
const authSection       = document.getElementById('auth-section')
const mainSection       = document.getElementById('main-section')
const mensajeDiv        = document.getElementById('mensaje')
const userEmailSpan     = document.getElementById('user-email')
const roleBadge         = document.getElementById('role-badge')
const adminFormSection  = document.getElementById('admin-product-form-section')
const tabBtnCarrito     = document.getElementById('tab-btn-carrito')
const tabBtnUsuarios    = document.getElementById('tab-btn-usuarios')

// ── Utilidades ─────────────────────────────────────────────────
function mostrarMensaje(texto, color) {
  mensajeDiv.textContent = texto
  mensajeDiv.style.display = 'block'
  mensajeDiv.style.backgroundColor = color === 'green' ? '#27ae60' : '#e74c3c'
  clearTimeout(mostrarMensaje._t)
  mostrarMensaje._t = setTimeout(() => { mensajeDiv.style.display = 'none' }, 3000)
}

// ── Tabs ───────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(btn.dataset.tab).classList.add('active')

    if (btn.dataset.tab === 'tab-carrito') renderCarrito()
    if (btn.dataset.tab === 'tab-usuarios') renderUsuarios()
  })
})

//Login 
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault()
  const email    = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value
  try {
    const data = await loginUsuario(email, password)
    localStorage.setItem('token', data.token)
    const decoded = decodeToken(data.token)
    iniciarSesion(decoded)
  } catch (err) {
    mostrarMensaje(err.message, 'red')
  }
})

document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault()
  const email    = document.getElementById('register-email').value
  const password = document.getElementById('register-password').value
  try {
    await registrarUsuario(email, password)
    mostrarMensaje('Cuenta creada. Ahora podés iniciar sesión.', 'green')
    document.getElementById('register-form').reset()
  } catch (err) {
    mostrarMensaje(err.message, 'red')
  }
})

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token')
  userRole = null
  authSection.style.display = 'block'
  mainSection.style.display = 'none'
  mostrarMensaje('Sesión cerrada', 'green')
})

// ── Iniciar sesión 
async function iniciarSesion(decoded) {
  userRole = decoded.role
  userEmailSpan.textContent = decoded.email
  roleBadge.textContent = userRole
  roleBadge.className = `role-badge ${userRole}`

  authSection.style.display = 'none'
  mainSection.style.display = 'block'

  // Mostrar tabs y secciones según rol
  if (userRole === 'user') {
    tabBtnCarrito.style.display = 'inline-block'
    adminFormSection.style.display = 'none'
  } else {
    tabBtnCarrito.style.display = 'none'
    adminFormSection.style.display = 'block'
  }

  if (userRole === 'superadmin') {
    tabBtnUsuarios.style.display = 'inline-block'
  }

  await cargarDatos()
}

// ── Cargar productos y categorías ──────────────────────────────
async function cargarDatos() {
  try {
    productos = await getProductos()
    const categorias = await getCategorias()
    llenarCategorias(categorias)
    renderProductos()
  } catch (err) {
    mostrarMensaje('Error al cargar datos', 'red')
  }
}

function llenarCategorias(categorias) {
  const sel = document.getElementById('product-category')
  sel.innerHTML = '<option value="">Seleccioná una categoría</option>'
  categorias.forEach(c => {
    const opt = document.createElement('option')
    opt.value = c.id
    opt.textContent = c.name
    sel.appendChild(opt)
  })
}

// ── Render productos ───────────────────────────────────────────
function renderProductos() {
  const tbody = document.getElementById('tabla-productos')
  tbody.innerHTML = ''

  productos.forEach(p => {
    const tr = document.createElement('tr')

    let acciones = ''
    if (userRole === 'user') {
      acciones = `<button class="cart-btn" data-id="${p.id}" data-action="carrito">+ Carrito</button>`
    } else {
      acciones = `
        <button class="edit-btn"   data-id="${p.id}" data-action="edit">Editar</button>
        <button class="delete-btn" data-id="${p.id}" data-action="delete">Eliminar</button>
      `
    }

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.category?.name ?? '-'}</td>
      <td>$${p.price}</td>
      <td>${p.quantity}</td>
      <td>${acciones}</td>
    `
    tbody.appendChild(tr)
  })

  tbody.addEventListener('click', handleTablaClick)
}

async function handleTablaClick(e) {
  const btn = e.target.closest('button')
  if (!btn) return

  const id     = parseInt(btn.dataset.id)
  const action = btn.dataset.action

  if (action === 'delete') {
    if (!confirm('¿Eliminás este producto?')) return
    try {
      await deleteProducto(id)
      productos = productos.filter(p => p.id !== id)
      renderProductos()
      mostrarMensaje('Producto eliminado', 'green')
    } catch (err) { mostrarMensaje(err.message, 'red') }

  } else if (action === 'edit') {
    const p = await getProductoById(id)
    if (!p) return
    document.getElementById('product-name').value     = p.name
    document.getElementById('product-price').value    = p.price
    document.getElementById('product-stock').value    = p.quantity
    document.getElementById('product-category').value = p.categoryId
    document.getElementById('editing-id').value       = p.id
    document.getElementById('btn-product').textContent = 'Guardar cambios'

  } else if (action === 'carrito') {
    try {
      await agregarAlCarrito(id, 1)
      mostrarMensaje('Producto agregado al carrito', 'green')
    } catch (err) { mostrarMensaje(err.message, 'red') }
  }
}

// ── Formulario admin ───────────────────────────────────────────
document.getElementById('product-form')?.addEventListener('submit', async e => {
  e.preventDefault()
  const name      = document.getElementById('product-name').value
  const price     = document.getElementById('product-price').value
  const quantity  = document.getElementById('product-stock').value
  const categoryId = document.getElementById('product-category').value
  editingId       = document.getElementById('editing-id').value

  const error = validarFormulario(name, price, quantity, categoryId)
  if (error) { mostrarMensaje(error, 'red'); return }

  const body = { name: name.trim(), price: parseFloat(price), quantity: parseInt(quantity), categoryId: parseInt(categoryId) }

  try {
    if (editingId) {
      await updateProducto(parseInt(editingId), body)
      mostrarMensaje('Producto editado', 'green')
    } else {
      const nuevo = await postProducto(body)
      productos.push(nuevo)
      mostrarMensaje('Producto agregado', 'green')
    }
    productos = await getProductos()
    renderProductos()
    resetFormulario()
  } catch (err) { mostrarMensaje(err.message, 'red') }
})

function resetFormulario() {
  document.getElementById('product-form').reset()
  document.getElementById('editing-id').value = ''
  document.getElementById('btn-product').textContent = 'Agregar Producto'
}

// ── Carrito ────────────────────────────────────────────────────
async function renderCarrito() {
  const carrito = await getCarrito()
  const lista   = document.getElementById('carrito-lista')
  const totalEl = document.getElementById('carrito-total')

  if (!carrito.items || carrito.items.length === 0) {
    lista.innerHTML = '<p style="color:#888;">El carrito está vacío.</p>'
    totalEl.textContent = ''
    return
  }

  lista.innerHTML = ''
  carrito.items.forEach(item => {
    const div = document.createElement('div')
    div.className = 'carrito-item'
    div.innerHTML = `
      <div class="carrito-item-info">
        <strong>${item.product.name}</strong> — $${item.product.price} c/u
      </div>
      <div class="carrito-item-controles">
        <input type="number" min="1" value="${item.quantity}" data-pid="${item.productId}" class="input-cantidad" />
        <button class="btn-quitar" data-pid="${item.productId}">Quitar</button>
      </div>
    `
    lista.appendChild(div)
  })

  totalEl.textContent = `Total: $${carrito.total}`

  // Cambiar cantidad
  lista.querySelectorAll('.input-cantidad').forEach(input => {
    input.addEventListener('change', async () => {
      const qty = parseInt(input.value)
      if (qty < 1) { input.value = 1; return }
      try {
        await actualizarCantidadCarrito(parseInt(input.dataset.pid), qty)
        renderCarrito()
      } catch (err) { mostrarMensaje(err.message, 'red') }
    })
  })

  // Quitar item
  lista.querySelectorAll('.btn-quitar').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await eliminarDelCarrito(parseInt(btn.dataset.pid))
        renderCarrito()
        mostrarMensaje('Producto quitado del carrito', 'green')
      } catch (err) { mostrarMensaje(err.message, 'red') }
    })
  })
}

document.getElementById('btn-checkout').addEventListener('click', async () => {
  if (!confirm('¿Confirmás la compra?')) return
  try {
    const compra = await checkout()
    mostrarMensaje(`¡Compra realizada! Total: $${compra.total}`, 'green')
    renderCarrito()
    productos = await getProductos()
    renderProductos()
  } catch (err) { mostrarMensaje(err.message, 'red') }
})

// Usuario (superadmin)
async function renderUsuarios() {
  const tbody = document.getElementById('tabla-usuarios')
  try {
    const usuarios = await getUsuarios()
    tbody.innerHTML = ''
    const miId = decodeToken(localStorage.getItem('token'))?.id

    usuarios.forEach(u => {
      const tr = document.createElement('tr')
      const esSelf = u.id === miId
      if (userRole === 'superadmin'){
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td>
            ${esSelf
              ? '<em style="color:#aaa;">Tu cuenta</em>'
              : `
                <select class="role-select" data-uid="${u.id}">
                  <option value="user"       ${u.role === 'user'       ? 'selected' : ''}>user</option>
                  <option value="admin"      ${u.role === 'admin'      ? 'selected' : ''}>admin</option>
                  <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>superadmin</option>
                </select>
                <button class="btn-cambiar-rol" data-uid="${u.id}">Guardar</button>
              `
            }
          </td>
        `
             tbody.appendChild(tr)
      }else{
        tbody.innerHTML = 'no tiene permisos para ver esto'
      }
     
    })

    tbody.querySelectorAll('.btn-cambiar-rol').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid  = parseInt(btn.dataset.uid)
        const role = tbody.querySelector(`.role-select[data-uid="${uid}"]`).value
        try {
          await cambiarRol(uid, role)
          mostrarMensaje('Rol actualizado', 'green')
          renderUsuarios()
        } catch (err) { mostrarMensaje(err.message, 'red') }
      })
    })
  } catch (err) {
    mostrarMensaje(err.message, 'red')
  }
}

// ── Al cargar la página ────────────────────────────────────────
const token = localStorage.getItem('token')
if (token) {
  const decoded = decodeToken(token)
  if (decoded) {
    iniciarSesion(decoded)
  } else {
    localStorage.removeItem('token')
  }
}
