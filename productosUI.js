import { getProductoById, updateProducto, deleteProducto, postProducto, getProductos } from './productosApi.js'
import { validarFormulario } from './validaciones.js'

let productos = []

const tablaProductos = document.getElementById('productos')
const btnProduct = document.getElementById('btn-product')
const editingIdInput = document.getElementById('editing-id')
const productForm = document.getElementById('product-form')
const mensajeDiv = document.getElementById('mensaje')

export function setProductos(data) {
  productos = data
}

export function renderProductos() {
  tablaProductos.innerHTML = ''
  productos.forEach(producto => {
    const productoCard = document.createElement('tr')
    productoCard.className = 'producto-card'
    productoCard.innerHTML = `
      <td>${producto.name}</td>  
      <td>${producto.price}</td>
      <td>${producto.quantity}</td>
      <td>
        <button class="edit-btn" data-id="${producto.id}" data-action="edit">Editar</button>
        <button class="delete-btn" data-id="${producto.id}" data-action="delete">Eliminar</button>
      </td>
    `
    tablaProductos.appendChild(productoCard)
  })
}

export function llenarCategorias(categorias) {
  const categorySelect = document.getElementById('product-category')
  // Limpiar opciones anteriores excepto la primera
  categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>'
  categorias.forEach(category => {
    const option = document.createElement('option')
    option.value = category.id
    option.textContent = category.name
    categorySelect.appendChild(option)
  })
}

export function mostrarMensaje(texto, color) {
  mensajeDiv.textContent = texto
  mensajeDiv.style.display = 'block'
  mensajeDiv.style.backgroundColor = color
  mensajeDiv.style.color = 'white'
  setTimeout(() => {
    mensajeDiv.style.display = 'none'
  }, 3000)
}

export async function handleFormSubmit(event) {
  event.preventDefault()
  
  const name = document.getElementById('product-name').value
  const price = document.getElementById('product-price').value
  const quantity = document.getElementById('product-stock').value
  const category = document.getElementById('product-category').value
  const editingId = editingIdInput ? editingIdInput.value : ''

  const error = validarFormulario(name, price, quantity, category)
  if (error) {
    mostrarMensaje(error, 'red')
    return
  }

  const newProducto = { 
    name: name.trim(), 
    price: parseFloat(price), 
    quantity: parseInt(quantity),
    categoryId: parseInt(category)
  }

  if (editingId) {
    try {
      await updateProducto(parseInt(editingId), newProducto)
      productos = await getProductos()
      renderProductos()
      mostrarMensaje('Producto editado correctamente', 'green')
    } catch (err) {
      mostrarMensaje(err.message, 'red')
    }
    resetFormulario()
  } else {
    try {
      const productoAgregado = await postProducto(newProducto)
      if (productoAgregado) {
        productos.push(productoAgregado)
        renderProductos()
        mostrarMensaje('Producto agregado correctamente', 'green')
      }
    } catch (err) {
      mostrarMensaje(err.message, 'red')
    }
    resetFormulario()
  }
}

function resetFormulario() {
  productForm.reset()
  if (editingIdInput) editingIdInput.value = ''
  if (btnProduct) btnProduct.textContent = 'Agregar Producto'
}

export async function handleTablaClick(event) {
  const button = event.target.closest('button')
  if (!button) return

  const id = parseInt(button.getAttribute('data-id'))
  const action = button.getAttribute('data-action')

  if (action === 'delete') {
    if (!confirm('¿Estás seguro de que querés eliminar este producto?')) return

    try {
      await deleteProducto(id)
      productos = productos.filter(p => p.id !== id)
      renderProductos()
      mostrarMensaje('Producto eliminado correctamente', 'green')
    } catch (err) {
      mostrarMensaje(err.message, 'red')
    }

  } else if (action === 'edit') {
    await prepararEditarProducto(id)
  }
}

export async function prepararEditarProducto(id) {
  const producto = await getProductoById(id)
  if (producto) {
    document.getElementById('product-name').value = producto.name
    document.getElementById('product-price').value = producto.price
    document.getElementById('product-stock').value = producto.quantity
    document.getElementById('product-category').value = producto.categoryId
    if (editingIdInput) editingIdInput.value = id
    if (btnProduct) btnProduct.textContent = 'Guardar cambios'
  }
  return producto
}

export function inicializarListeners() {
  productForm.addEventListener('submit', handleFormSubmit)
  tablaProductos.addEventListener('click', handleTablaClick)
}
