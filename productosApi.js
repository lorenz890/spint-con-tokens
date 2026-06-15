const API_URL = 'http://localhost:3000/api'

// Obtiene el token guardado en localStorage
function getToken() {
  return localStorage.getItem('token')
}

// Headers con token para rutas protegidas
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

// --- AUTH ---

export async function loginUsuario(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error al iniciar sesión')
  }
  return data // { token: "eyJ..." }
}

export async function registrarUsuario(email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error al registrarse')
  }
  return data
}

// --- PRODUCTOS ---

export async function getProductos() {
  try {
    const response = await fetch(`${API_URL}/products`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching productos:', error)
    return []
  }
}

export async function getCategorias() {
  try {
    const response = await fetch(`${API_URL}/categories`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching categorías:', error)
    return []
  }
}

// POST, PATCH y DELETE mandan el token en el header
export async function postProducto(producto) {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(producto)
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error al agregar producto')
  }
  return data
}

export async function deleteProducto(id) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Error al eliminar producto')
  }
  return true
}

export async function updateProducto(id, productoEditado) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(productoEditado)
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Error al editar producto')
  }
  return data
}

export async function getProductoById(id) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`)
    const producto = await response.json()
    return producto
  } catch (error) {
    console.error('Error fetching producto by ID:', error)
    return null
  }
}
