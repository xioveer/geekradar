document.addEventListener("DOMContentLoaded", () => {
    // Mapa en directo con Leaflet.js
    const map = L.map('map').setView([10.9685, -74.7813], 14);

    // Servidor de mapas OSCURO (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Marcador interactivo del restaurante
    const marker = L.marker([10.9685, -74.7813]).addTo(map);
    marker.bindPopup("<b>Pixel Burger 🍔🎮</b><br>Restaurante Gamer & Arcade").openPopup();
});
