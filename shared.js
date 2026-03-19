
let cart = [];

function loadCart() { try { cart = JSON.parse(localStorage.getItem("kitking_cart") || "[]"); } catch { cart = []; } }
function saveCart() { try { localStorage.setItem("kitking_cart", JSON.stringify(cart)); } catch { } }
function getAdminConfig() { try { return JSON.parse(localStorage.getItem("kitking_config") || "{}"); } catch { return {}; } }
function cfg() { return { ...STORE_CONFIG, ...getAdminConfig() }; }
function finalPrice(p) { return p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price; }
function esc(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function addToCart(product, size) {
  const ex = cart.find(i => i.id === product.id && i.size === size);
  if (ex) ex.qty++;
  else cart.push({ id: product.id, name: product.name, image: product.image, price: finalPrice(product), size, qty: 1 });
  saveCart(); updateCartBadge(); renderCartItems();
}
function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart(); updateCartBadge(); renderCartItems();
}
function clearCart() { cart = []; saveCart(); updateCartBadge(); renderCartItems(); }

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById("cart-count");
  if (!el) return;
  el.textContent = total;
  el.classList.toggle("show", total > 0);
}

function openCart() {
  renderCartItems();
  document.getElementById("cart-overlay")?.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  document.getElementById("cart-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
}

function renderCartItems() {
  const body = document.getElementById("cart-body");
  const foot = document.getElementById("cart-foot");
  const total = document.getElementById("cart-total");
  const ship = document.getElementById("cart-ship");
  if (!body) return;
  const c = cfg().currency;

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      <p>Your cart is empty</p>
      <a href="shop.html" class="btn-outline" style="font-size:11px;padding:10px 20px;">Browse Kits</a>
    </div>`;
    if (foot) foot.style.display = "none";
    return;
  }

  if (foot) foot.style.display = "flex";
  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-img"><img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy"/></div>
      <div class="ci-info">
        <div class="ci-name">${esc(item.name)}</div>
        <div class="ci-meta">Size: ${item.size} · Qty: ${item.qty}</div>
        <div class="ci-price">${c}${(item.price * item.qty).toLocaleString()}</div>
      </div>
      <button class="ci-remove" data-id="${item.id}" data-size="${item.size}">✕</button>
    </div>`).join("");

  body.querySelectorAll(".ci-remove").forEach(btn =>
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id), btn.dataset.size))
  );

  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (total) total.textContent = `${c}${sub.toLocaleString()}`;
  if (ship) {
    const thresh = cfg().freeShippingThreshold || 2000;
    ship.textContent = sub >= thresh
      ? "🎉 Free delivery on this order!"
      : `Add ${c}${(thresh - sub).toLocaleString()} more for free delivery`;
    ship.style.color = sub >= thresh ? "var(--green)" : "var(--ink-3)";
  }
}

function sendCartWhatsApp() {
  const { currency, whatsappNumber } = cfg();
  if (!cart.length) return;
  const lines = cart.map(i => `• ${i.name} (${i.size} ×${i.qty}) — ${currency}${(i.price * i.qty).toLocaleString()}`);
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const msg = [`Hi KITKING! Here's my order:`, "", ...lines, "", `💰 Total: ${currency}${sub.toLocaleString()}`, "", "Please confirm and arrange delivery. Thank you!"].join("\n");
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

// ── WhatsApp helpers ───────────────────────────────────────────
function sendProductWhatsApp(product, size) {
  const { currency, whatsappNumber } = cfg();
  const msg = [`Hi KITKING! I'd like to order:`, "",
    `👕 *${product.name}*`, `📏 Size: *${size}*`,
    `💰 Price: *${currency}${finalPrice(product).toLocaleString()}*`, "",
    "Please confirm availability. Thank you!"].join("\n");
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}
function sendNotifyWhatsApp(product) {
  const { whatsappNumber } = cfg();
  const msg = [`Hi KITKING! 👋`, "", `Could you notify me when back in stock?`, "", `👕 *${product.name}*`, `🏆 ${product.team} · ${product.league}`, "", "Thank you!"].join("\n");
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  showToast("Opening WhatsApp…", "green");
}
function shareProduct(product) {
  const { currency, whatsappNumber } = cfg();
  const fp = finalPrice(product);
  const msg = [`🔥 Check this out from KITKING!`, "", `👕 *${product.name}*`, `🏆 ${product.team}`, `💰 ${currency}${fp.toLocaleString()}`, `📏 Sizes: ${product.sizes.join(", ")}`, "", `Order 👉 https://wa.me/${whatsappNumber}`].join("\n");
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  showToast("Sharing…");
}

// ── Toast ──────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.className = "toast"; }, 2800);
}

// ── WA Bubble ──────────────────────────────────────────────────
function initWaBubble() {
  const fab = document.getElementById("wa-fab");
  const tip = document.getElementById("wa-tip");
  const tipX = document.getElementById("wa-tip-x");
  if (!fab) return;
  const num = cfg().whatsappNumber;
  fab.href = `https://wa.me/${num}?text=${encodeURIComponent("Hi KITKING! I have a question.")}`;
  if (tipX) tipX.addEventListener("click", e => { e.preventDefault(); tip?.classList.add("gone"); });
  setTimeout(() => tip?.classList.add("gone"), 8000);
}

// ── Header scroll ──────────────────────────────────────────────
function initHeader() {
  window.addEventListener("scroll", () => {
    document.getElementById("site-header")?.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });
}

// ── WA links ───────────────────────────────────────────────────
function initWaLinks() {
  const num = cfg().whatsappNumber;
  const href = `https://wa.me/${num}`;
  ["footer-wa", "footer-wa2", "cta-wa", "contact-wa", "faq-wa-inline", "sg-wa-link"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = href;
  });
}

// ── Cart listeners ─────────────────────────────────────────────
function initCartListeners() {
  document.getElementById("cart-btn")?.addEventListener("click", openCart);
  document.getElementById("cart-close")?.addEventListener("click", closeCart);
  document.getElementById("cart-overlay")?.addEventListener("click", e => {
    if (e.target === document.getElementById("cart-overlay")) closeCart();
  });
  document.getElementById("cart-wa-btn")?.addEventListener("click", sendCartWhatsApp);
  document.getElementById("cart-clear")?.addEventListener("click", () => { clearCart(); showToast("Cart cleared"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });
}

// ── Shared boot ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  updateCartBadge();
  initHeader();
  initWaBubble();
  initWaLinks();
  initCartListeners();
});

// ── Build product card (shared across pages) ───────────────────
function buildCard(p, opts = {}) {
  const c = cfg().currency;
  const fp = finalPrice(p);
  const hasSale = p.discount > 0;
  const badge = opts.forceNew ? "New Arrival"
    : hasSale && !["New", "Best Seller"].includes(p.badge) ? "Sale"
      : p.badge || "";
  const tagClass = opts.forceNew ? "tag-arrival"
    : hasSale && badge === "Sale" ? "tag-sale"
      : p.badge === "New" ? "tag-new"
        : p.badge === "Best Seller" ? "tag-bestseller" : "";

  const priceHtml = hasSale
    ? `<span class="price-now">${c}${fp.toLocaleString()}</span>
       <span class="price-was">${c}${p.price.toLocaleString()}</span>
       <span class="price-pct">−${p.discount}%</span>`
    : `<span class="price-now">${c}${fp.toLocaleString()}</span>`;

  const actionHtml = p.inStock
    ? `<button class="card-wa-btn" data-id="${p.id}" data-action="order">
         <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
         Order
       </button>`
    : `<button class="card-notify-btn" data-id="${p.id}" data-action="notify">🔔 Notify Me</button>`;

  const oosTag = !p.inStock ? `<span class="card-tag tag-oos">Out of Stock</span>` : "";
  const badgeTag = badge ? `<span class="card-tag ${tagClass}">${esc(badge)}</span>` : "";

  return `
  <article class="product-card" data-id="${p.id}">
    <div class="card-img">
      <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"
           onerror="this.src='https://placehold.co/400x300/f2f0eb/b0b0b0?text=No+Image'"/>
      ${oosTag}${badgeTag}
    </div>
    <div class="card-body">
      <p class="card-league">${esc(p.league || "")}</p>
      <h2 class="card-name">${esc(p.name)}</h2>
      ${p.playerName ? `<p class="card-player">#${p.playerNumber || ""} ${esc(p.playerName)}</p>` : ""}
      <div class="card-sizes">${p.sizes.map(s => `<span class="size-dot">${s}</span>`).join("")}</div>
      <div class="card-footer">
        <div class="card-price">${priceHtml}</div>
        ${actionHtml}
      </div>
    </div>
  </article>`;
}
