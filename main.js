import { getProductos, getCategorias, loginUsuario, registrarUsuario } from './productosApi.js'
import { setProductos, renderProductos, llenarCategorias, inicializarListeners, mostrarMensaje } from './productosUI.js'

// Elementos del DOM
const authSection = document.getElementById('auth-section')
const productosSection = document.getElementById('productos-section')
const loginForm = document.getElementById('login-form')
const registerForm = document.getElementById('register-form')
const btnLogout = document.getElementById('btn-logout')
const userEmailSpan = document.getElementById('user-email')

// Muestra la sección de productos y oculta el login
function mostrarProductos(email) {
  authSection.style.display = 'none'
  productosSection.style.display = 'block'
  userEmailSpan.textContent = email
}

// Muestra el login y oculta los productos
function mostrarLogin() {
  authSection.style.display = 'block'
  productosSection.style.display = 'none'
  userEmailSpan.textContent = ''
}

// Carga los productos y categorías
async function cargarDatos() {
  try {
    const categorias = await getCategorias()
    llenarCategorias(categorias)

    const productos = await getProductos()
    setProductos(productos)
    renderProductos()

    inicializarListeners()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  }
}

// --- LOGIN ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('login-email').value
  const password = document.getElementById('login-password').value

  try {
    const data = await loginUsuario(email, password)

    // Guardar token y email en localStorage
    localStorage.setItem('token', data.token)
    localStorage.setItem('email', email)

    mostrarMensaje('Sesión iniciada correctamente', 'green')
    mostrarProductos(email)
    await cargarDatos()
  } catch (err) {
    mostrarMensaje(err.message, 'red')
  }
})

// --- REGISTER ---
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('register-email').value
  const password = document.getElementById('register-password').value

  try {
    await registrarUsuario(email, password)
    mostrarMensaje('Cuenta creada. Ahora podés iniciar sesión.', 'green')

    // Limpiar el formulario de registro
    registerForm.reset()
  } catch (err) {
    mostrarMensaje(err.message, 'red')
  }
})

// --- LOGOUT ---
btnLogout.addEventListener('click', () => {
  localStorage.removeItem('token')
  localStorage.removeItem('email')
  mostrarLogin()
  mostrarMensaje('Sesión cerrada', 'green')
})

// --- AL CARGAR LA PÁGINA ---
// Si ya hay un token guardado, ir directo a productos
const tokenGuardado = localStorage.getItem('token')
const emailGuardado = localStorage.getItem('email')

if (tokenGuardado && emailGuardado) {
  mostrarProductos(emailGuardado)
  cargarDatos()
} else {
  mostrarLogin()
}
