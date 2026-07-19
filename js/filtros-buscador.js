document.addEventListener("DOMContentLoaded", () => {
    const buscador = document.getElementById("buscador");
    const filtroCategoria = document.getElementById("filtro-categoria");
    const productos = document.querySelectorAll(".producto");

    // Función para filtrar productos de forma dinámica y ocultar secciones vacías
    function filtrarProductos() {
        const textoBusqueda = buscador.value.toLowerCase().trim();
        const categoriaSeleccionada = filtroCategoria.value;

        productos.forEach((producto) => {
            const nombreProducto = producto.querySelector(".card-title").textContent.toLowerCase();
            const categoriaProducto = producto.dataset.categoria;

            // Comprobar coincidencias de texto y categoría
            const coincideTexto = nombreProducto.includes(textoBusqueda) || textoBusqueda === "";
            const coincideCategoria = categoriaProducto === categoriaSeleccionada || categoriaSeleccionada === "todos";

            if (coincideTexto && coincideCategoria) {
                producto.style.display = ""; // Restaura el display original de Bootstrap
                producto.classList.add("fade-in");
            } else {
                producto.style.display = "none";
                producto.classList.remove("fade-in");
            }
        });

        // Ocultar las secciones completas si no contienen productos visibles
        const secciones = document.querySelectorAll("main section");
        secciones.forEach((sec) => {
            // Ignorar la sección del buscador o del hero si tienen etiqueta section
            if (sec.classList.contains("hero-banner") || sec.classList.contains("search-filter-section") || sec.classList.contains("features-grid")) {
                return;
            }

            const productosVisibles = sec.querySelectorAll(".producto:not([style*='display: none'])");
            if (productosVisibles.length === 0) {
                sec.style.display = "none";
            } else {
                sec.style.display = "";
            }
        });
    }

    if (buscador && filtroCategoria) {
        buscador.addEventListener("input", filtrarProductos);
        filtroCategoria.addEventListener("change", filtrarProductos);
    }
});
