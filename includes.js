window.addEventListener("DOMContentLoaded", () => {
  // Calcular cuántos niveles subir desde la ubicación actual de forma robusta
  let depth = 0;
  
  if (window.location.protocol === "file:") {
    // Si se abre localmente por file://, buscamos la carpeta raíz en la URL para calcular la profundidad exacta
    const parts = window.location.pathname.split("/");
    const rootIndex = parts.findIndex(p => decodeURIComponent(p) === "Pagina Ruben");
    if (rootIndex !== -1) {
      depth = parts.length - rootIndex - 2;
    }
  } else {
    // En caso de servidor web local (Live Server, etc.)
    depth = window.location.pathname
      .split("/")
      .filter(segment => segment !== "")
      .length - 1;
  }

  const basePath = "../".repeat(Math.max(0, depth));

  // Cargar header.html
  fetch(`${basePath}header.html`)
    .then(res => res.text())
    .then(data => {
      const header = document.getElementById('header');
      if (header) header.innerHTML = data;
    })
    .catch(err => console.error("Error cargando header:", err));

  // Cargar footer.html
  fetch(`${basePath}footer.html`)
    .then(res => res.text())
    .then(data => {
      const footer = document.getElementById('footer');
      if (footer) footer.innerHTML = data;
    })
    .catch(err => console.error("Error cargando footer:", err));

  // Cargar whatsapp.html dinámicamente y añadirlo al final del body
  fetch(`${basePath}whatsapp.html`)
    .then(res => res.text())
    .then(data => {
      const div = document.createElement('div');
      div.innerHTML = data.trim();
      const widget = div.firstElementChild;
      if (widget) {
        document.body.appendChild(widget);

        // Activar el tooltip animado de WhatsApp a los 3 segundos
        setTimeout(() => {
          const tooltip = document.querySelector(".whatsapp-tooltip");
          if (tooltip) {
            tooltip.classList.add("active");
          }
        }, 3000);
      }
    })
    .catch(err => console.error("Error cargando widget de WhatsApp:", err));
});
