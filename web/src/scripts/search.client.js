document.addEventListener('DOMContentLoaded', () => {
  const buscador = document.getElementById('buscador');
  const filtroCategoria = document.getElementById('filtro-categoria');
  const productos = document.querySelectorAll('.producto');

  function filtrarProductos() {
    const textoBusqueda = buscador.value.toLowerCase().trim();
    const categoriaSeleccionada = filtroCategoria.value;

    productos.forEach((producto) => {
      const nombreProducto = producto.querySelector('.card-title').textContent.toLowerCase();
      const categoriaProducto = producto.dataset.categoria;

      const coincideTexto = nombreProducto.includes(textoBusqueda) || textoBusqueda === '';
      const coincideCategoria = categoriaProducto === categoriaSeleccionada || categoriaSeleccionada === 'todos';

      if (coincideTexto && coincideCategoria) {
        producto.style.display = '';
        producto.classList.add('fade-in');
      } else {
        producto.style.display = 'none';
        producto.classList.remove('fade-in');
      }
    });

    const secciones = document.querySelectorAll('main section');
    secciones.forEach((sec) => {
      if (
        sec.classList.contains('hero-banner') ||
        sec.classList.contains('search-filter-section') ||
        sec.classList.contains('features-grid')
      ) {
        return;
      }

      const productosVisibles = sec.querySelectorAll(".producto:not([style*='display: none'])");
      sec.style.display = productosVisibles.length === 0 ? 'none' : '';
    });
  }

  if (buscador && filtroCategoria) {
    buscador.addEventListener('input', filtrarProductos);
    filtroCategoria.addEventListener('change', filtrarProductos);
  }
});
