export function validarFormulario(name, price, quantity, category) {
  if (!name || name.trim() === '') return 'El nombre es obligatorio'
  if (name.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres'
  if (price === '' || isNaN(price) || Number(price) <= 0) return 'El precio debe ser mayor a 0'
  if (quantity === '' || isNaN(quantity) || Number(quantity) < 0) return 'El stock no puede ser negativo'
  if (!category || category === '') return 'Seleccioná una categoría'
  return null
}
