const API_URL = 'http://localhost:3000/api'

function getToken() {
  return localStorage.getItem('token')
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

// Decodifica el payload del JWT para obtener { id, email, role }
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

// --- AUTH ---

export async function loginUsuario(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
  return data
}

export async function registrarUsuario(email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al registrarse')
  return data
}

// --- PRODUCTOS ---

export async function getProductos() {
  const res = await fetch(`${API_URL}/products`)
  return res.ok ? res.json() : []
}

export async function getCategorias() {
  const res = await fetch(`${API_URL}/categories`)
  return res.ok ? res.json() : []
}

export async function postProducto(producto) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(producto)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al agregar producto')
  return data
}

export async function updateProducto(id, producto) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(producto)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al editar producto')
  return data
}

export async function deleteProducto(id) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Error al eliminar producto')
  }
  return true
}

export async function getProductoById(id) {
  const res = await fetch(`${API_URL}/products/${id}`)
  return res.ok ? res.json() : null
}

// --- CARRITO ---

export async function getCarrito() {
  const res = await fetch(`${API_URL}/cart`, { headers: authHeaders() })
  return res.ok ? res.json() : { items: [], total: 0 }
}

export async function agregarAlCarrito(productId, quantity = 1) {
  const res = await fetch(`${API_URL}/cart/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ productId, quantity })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al agregar al carrito')
  return data
}

export async function actualizarCantidadCarrito(productId, quantity) {
  const res = await fetch(`${API_URL}/cart/items/${productId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ quantity })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al actualizar cantidad')
  return data
}

export async function eliminarDelCarrito(productId) {
  const res = await fetch(`${API_URL}/cart/items/${productId}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Error al eliminar del carrito')
  }
  return true
}

export async function checkout() {
  const res = await fetch(`${API_URL}/cart/checkout`, {
    method: 'POST',
    headers: authHeaders()
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al realizar la compra')
  return data
}

// --- USUARIOS (superadmin) ---

export async function getUsuarios() {
  const res = await fetch(`${API_URL}/users`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios')
  return data
}

export async function cambiarRol(userId, role) {
  const res = await fetch(`${API_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ role })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al cambiar rol')
  return data
}
