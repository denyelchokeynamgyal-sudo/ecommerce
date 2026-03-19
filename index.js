/** KITKING — index.js (landing page) */

document.addEventListener("DOMContentLoaded", () => {
  const products = getProducts();

  // Featured (up to 4)
  const featuredGrid = document.getElementById("featured-grid");
  const featured = products.filter(p => p.featured).slice(0, 4);
  if (featuredGrid) {
    featuredGrid.innerHTML = featured.map(p => buildCard(p)).join("");
    attachSimpleCardListeners(featuredGrid, products);
  }

  // New arrivals (up to 3)
  const newCards = document.getElementById("new-cards");
  const newOnes  = products.filter(p => p.isNew).slice(0, 3);
  if (newCards) {
    newCards.innerHTML = newOnes.length
      ? newOnes.map(p => buildCard(p, { forceNew: true })).join("")
      : "<p style='color:rgba(255,255,255,.5);font-size:14px;'>Check back soon for new arrivals!</p>";
    attachSimpleCardListeners(newCards, products);
  }
});

// For landing page — clicking a card opens shop with that product pre-selected
// We'll open the shop and pass the product id via URL
function attachSimpleCardListeners(container, products) {
  container.querySelectorAll(".product-card").forEach(card => {
    const id = Number(card.dataset.id);
    card.addEventListener("click", e => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (action === "notify") { e.stopPropagation(); const p = products.find(x => x.id===id); if(p) sendNotifyWhatsApp(p); return; }
      if (action === "order")  { e.stopPropagation(); window.location.href = `shop.html?open=${id}`; return; }
      window.location.href = `shop.html?open=${id}`;
    });
  });
}
