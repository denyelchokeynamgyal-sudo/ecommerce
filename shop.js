/** KITKING — shop.js */

const shopState = { search:"", league:"", team:"", size:"", price:"", stock:"", sort:"default" };
let products = [], activeProduct = null, detailSize = null;

document.addEventListener("DOMContentLoaded", () => {
  products = getProducts();
  buildFilters();
  showSkeletons();
  setTimeout(() => { renderGrid(); checkURLParams(); }, 280);
  initDetail();
  initFilterBlocks();
  initShopListeners();
  document.getElementById("site-header")?.classList.add("scrolled");
});

function checkURLParams() {
  const p = new URLSearchParams(window.location.search);
  const filter = p.get("filter");
  const openId = p.get("open");
  if (filter === "new")      { document.querySelector('[name="stock"]')?.closest(".filter-check-list")?.querySelectorAll("input")[0]; /* handled below */ }
  if (filter === "sale")     { /* auto-apply discount sort */ shopState.sort = "discount"; document.getElementById("sort-sel").value = "discount"; renderGrid(); }
  if (filter === "new")      { /* filter isNew */ shopState.isNew = true; renderGrid(); }
  if (filter === "featured") { products = products.filter(p => p.featured); renderGrid(); }
  if (openId)                { openDetail(Number(openId)); }
}

// ── Filter builders ────────────────────────────────────────────
function buildFilters() {
  const leagues = [...new Set(products.map(p => p.league).filter(Boolean))].sort();
  const teams   = [...new Set(products.map(p => p.team))].sort();
  const ll = document.getElementById("filter-league-list");
  const tl = document.getElementById("filter-team-list");
  if (ll) {
    ll.innerHTML = `<label class="fcheck"><input type="radio" name="league" value="" checked> All Leagues</label>`
      + leagues.map(l => `<label class="fcheck"><input type="radio" name="league" value="${esc(l)}"> ${esc(l)}</label>`).join("");
  }
  if (tl) {
    tl.innerHTML = `<label class="fcheck"><input type="radio" name="team" value="" checked> All Teams</label>`
      + teams.map(t => `<label class="fcheck"><input type="radio" name="team" value="${esc(t)}"> ${esc(t)}</label>`).join("");
  }
}

// ── Skeletons ──────────────────────────────────────────────────
function showSkeletons(n = 9) {
  const g = document.getElementById("shop-grid");
  if (!g) return;
  g.innerHTML = Array.from({length:n}).map(() => `
    <div class="skel-card">
      <div class="skel skel-img"></div>
      <div class="skel-body">
        <div class="skel skel-line w40"></div>
        <div class="skel skel-line w80" style="height:20px"></div>
        <div class="skel skel-line w60"></div>
        <div class="skel skel-btn"></div>
      </div>
    </div>`).join("");
}

// ── Render grid ────────────────────────────────────────────────
function renderGrid() {
  const grid  = document.getElementById("shop-grid");
  const empty = document.getElementById("shop-empty");
  const count = document.getElementById("results-txt");
  if (!grid) return;

  let filtered = [...products];
  if (shopState.search) {
    const q = shopState.search;
    filtered = filtered.filter(p => `${p.name} ${p.team} ${p.league} ${p.playerName||""} ${p.playerNumber||""}`.toLowerCase().includes(q));
  }
  if (shopState.league)  filtered = filtered.filter(p => p.league === shopState.league);
  if (shopState.team)    filtered = filtered.filter(p => p.team   === shopState.team);
  if (shopState.size)    filtered = filtered.filter(p => p.sizes.includes(shopState.size));
  if (shopState.stock === "instock") filtered = filtered.filter(p => p.inStock);
  if (shopState.isNew)   filtered = filtered.filter(p => p.isNew);
  if (shopState.price) {
    const [mn,mx] = shopState.price.split("-").map(Number);
    filtered = filtered.filter(p => { const fp=finalPrice(p); return fp>=mn && fp<=mx; });
  }
  switch (shopState.sort) {
    case "price-asc":  filtered.sort((a,b) => finalPrice(a)-finalPrice(b)); break;
    case "price-desc": filtered.sort((a,b) => finalPrice(b)-finalPrice(a)); break;
    case "discount":   filtered.sort((a,b) => (b.discount||0)-(a.discount||0)); break;
    case "name":       filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
  }

  if (count) count.textContent = `${filtered.length} ${filtered.length===1?"kit":"kits"}`;
  renderActiveFilters();

  if (!filtered.length) {
    grid.innerHTML = ""; empty.style.display = "block";
  } else {
    empty.style.display = "none";
    grid.innerHTML = filtered.map(p => buildCard(p)).join("");
    grid.querySelectorAll(".product-card").forEach(card => {
      const id = Number(card.dataset.id);
      card.addEventListener("click", e => {
        const action = e.target.closest("[data-action]")?.dataset.action;
        if (action === "notify") { e.stopPropagation(); const p=products.find(x=>x.id===id); if(p) sendNotifyWhatsApp(p); return; }
        if (action === "order")  { e.stopPropagation(); openDetail(id); return; }
        if (!e.target.closest("button")) openDetail(id);
      });
    });
  }
}

// ── Active filter pills ────────────────────────────────────────
function renderActiveFilters() {
  const wrap = document.getElementById("active-filters");
  if (!wrap) return;
  const pills = [];
  if (shopState.search)  pills.push({ label: `"${shopState.search}"`, key: "search" });
  if (shopState.league)  pills.push({ label: shopState.league, key: "league" });
  if (shopState.team)    pills.push({ label: shopState.team, key: "team" });
  if (shopState.size)    pills.push({ label: `Size: ${shopState.size}`, key: "size" });
  if (shopState.price)   pills.push({ label: `Price filter`, key: "price" });
  if (shopState.stock)   pills.push({ label: "In Stock", key: "stock" });

  wrap.style.display = pills.length ? "flex" : "none";
  wrap.innerHTML = pills.map(pl =>
    `<span class="filter-pill">${esc(pl.label)}<button data-key="${pl.key}" title="Remove">✕</button></span>`
  ).join("");
  wrap.querySelectorAll("button[data-key]").forEach(btn => {
    btn.addEventListener("click", () => { removeSingleFilter(btn.dataset.key); });
  });
}
function removeSingleFilter(key) {
  if (key === "search") { shopState.search=""; document.getElementById("search-input").value=""; document.getElementById("search-clr").style.display="none"; }
  else shopState[key] = "";
  // reset corresponding radio
  if (key === "league") document.querySelector('[name="league"][value=""]')?.click();
  if (key === "team")   document.querySelector('[name="team"][value=""]')?.click();
  if (key === "price")  document.querySelector('[name="price"][value=""]')?.click();
  if (key === "stock")  document.querySelector('[name="stock"][value=""]')?.click();
  if (key === "size") {
    document.querySelectorAll(".sfbtn").forEach(b => b.classList.toggle("active", b.dataset.size===""));
  }
  renderGrid();
}

// ── Detail Modal ───────────────────────────────────────────────
function initDetail() {
  document.getElementById("detail-x")?.addEventListener("click", closeDetail);
  document.getElementById("detail-bg")?.addEventListener("click", e => {
    if (e.target === document.getElementById("detail-bg")) closeDetail();
  });
  document.getElementById("d-size-guide")?.addEventListener("click", openSizeGuide);
  document.getElementById("sg-x")?.addEventListener("click", closeSizeGuide);
  document.getElementById("sg-bg")?.addEventListener("click", e => {
    if (e.target === document.getElementById("sg-bg")) closeSizeGuide();
  });
  const sgWa = document.getElementById("sg-wa");
  if (sgWa) { sgWa.href = `https://wa.me/${cfg().whatsappNumber}?text=${encodeURIComponent("Hi KITKING! Can you help me pick a size?")}`; sgWa.target="_blank"; sgWa.rel="noopener"; }
  document.addEventListener("keydown", e => { if (e.key==="Escape") { closeDetail(); closeSizeGuide(); } });
}

function openDetail(id) {
  const p = products.find(x => x.id===id);
  if (!p) return;
  activeProduct=p; detailSize=null;
  const c=cfg().currency, fp=finalPrice(p), hasSale=p.discount>0;

  document.getElementById("d-img").src = p.image;
  document.getElementById("d-img").alt = p.name;
  document.getElementById("d-league").textContent = p.league||"";
  document.getElementById("d-team").textContent   = p.team;
  document.getElementById("d-name").textContent   = p.name;
  document.getElementById("d-desc").textContent   = p.description||"";
  document.getElementById("d-sku").textContent    = `KK-${String(p.id).padStart(4,"0")}`;
  document.getElementById("d-stock").textContent  = p.inStock ? "In Stock ✓" : "Out of Stock";
  document.getElementById("d-stock").style.color  = p.inStock ? "var(--green)" : "var(--red)";

  document.getElementById("d-price").innerHTML = hasSale
    ? `<span class="d-price-now">${c}${fp.toLocaleString()}</span>
       <span class="d-price-was">${c}${p.price.toLocaleString()}</span>
       <span class="d-price-pct">−${p.discount}%</span>`
    : `<span class="d-price-now">${c}${p.price.toLocaleString()}</span>`;

  const tags = document.getElementById("d-tags");
  const badge = hasSale ? "Sale" : p.badge;
  const tagCls = hasSale ? "tag-sale" : p.badge==="New" ? "tag-new" : p.badge==="Best Seller" ? "tag-bestseller" : "";
  tags.innerHTML = badge ? `<span class="card-tag ${tagCls}">${badge}</span>` : "";
  if (!p.inStock) tags.innerHTML += `<span class="card-tag tag-oos">Out of Stock</span>`;

  const sz = document.getElementById("d-sizes");
  sz.innerHTML = p.sizes.map(s => `<button class="d-size-btn" data-size="${s}">${s}</button>`).join("");
  sz.querySelectorAll(".d-size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sz.querySelectorAll(".d-size-btn").forEach(b => b.classList.remove("sel"));
      btn.classList.add("sel");
      detailSize = btn.dataset.size;
      if (p.inStock) { document.getElementById("d-wa-btn").disabled=false; document.getElementById("d-cart-btn").disabled=false; showStickyBar(p, detailSize); }
    });
  });

  const waBtn   = document.getElementById("d-wa-btn");
  const cartBtn = document.getElementById("d-cart-btn");
  const notifBtn= document.getElementById("d-notify-btn");
  waBtn.disabled=true; cartBtn.disabled=true;

  if (!p.inStock) {
    waBtn.style.display="none"; cartBtn.style.display="none"; notifBtn.style.display="flex";
    notifBtn.onclick = () => sendNotifyWhatsApp(p);
  } else {
    waBtn.style.display="flex"; cartBtn.style.display="flex"; notifBtn.style.display="none";
    waBtn.onclick = () => { if (!detailSize) { showToast("Select a size first"); return; } sendProductWhatsApp(activeProduct, detailSize); };
    cartBtn.onclick = () => { if (!detailSize) { showToast("Select a size first"); return; } addToCart(activeProduct, detailSize); showToast(`Added to cart`, "green"); openCart(); };
  }
  hideStickyBar();
  document.getElementById("d-share-btn").onclick = () => shareProduct(p);
  renderRelated(p);

  document.getElementById("detail-bg").classList.add("open");
  document.body.style.overflow="hidden";
}

function closeDetail() {
  document.getElementById("detail-bg")?.classList.remove("open");
  hideStickyBar();
  document.body.style.overflow="";
}

function showStickyBar(p, size) {
  const bar=document.getElementById("sticky-bar");
  if (!bar) return;
  document.getElementById("sb-name").textContent = `${p.name} · ${size}`;
  document.getElementById("sb-price").textContent= `${cfg().currency}${finalPrice(p).toLocaleString()}`;
  document.getElementById("sb-btn").onclick = () => sendProductWhatsApp(p, size);
  bar.style.display="flex";
}
function hideStickyBar() { const b=document.getElementById("sticky-bar"); if(b) b.style.display="none"; }

function openSizeGuide()  { document.getElementById("sg-bg")?.classList.add("open"); }
function closeSizeGuide() { document.getElementById("sg-bg")?.classList.remove("open"); }

function renderRelated(current) {
  const section = document.getElementById("related-section");
  const row     = document.getElementById("related-row");
  if (!row) return;
  const rel = products.filter(p => p.id!==current.id && (p.team===current.team||p.league===current.league)).slice(0,4);
  if (!rel.length) { section.style.display="none"; return; }
  section.style.display="block";
  row.innerHTML = rel.map(p => `
    <div class="rel-card" data-id="${p.id}">
      <div class="rel-img"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"/></div>
      <div class="rel-info"><div class="rel-name">${esc(p.name)}</div><div class="rel-price">${cfg().currency}${finalPrice(p).toLocaleString()}</div></div>
    </div>`).join("");
  row.querySelectorAll(".rel-card").forEach(c => c.addEventListener("click", () => openDetail(Number(c.dataset.id))));
}

// ── Shop listeners ─────────────────────────────────────────────
function initShopListeners() {
  const inp = document.getElementById("search-input");
  const clr = document.getElementById("search-clr");
  if (inp) {
    inp.addEventListener("input", debounce(() => {
      shopState.search = inp.value.trim().toLowerCase();
      clr.style.display = shopState.search ? "block" : "none";
      renderGrid();
    }, 220));
  }
  if (clr) clr.addEventListener("click", () => { inp.value=""; shopState.search=""; clr.style.display="none"; renderGrid(); });

  document.querySelectorAll('[name="league"]').forEach(r => r.addEventListener("change", e => { shopState.league=e.target.value; renderGrid(); }));
  document.querySelectorAll('[name="team"]').forEach(r   => r.addEventListener("change", e => { shopState.team=e.target.value;   renderGrid(); }));
  document.querySelectorAll('[name="price"]').forEach(r  => r.addEventListener("change", e => { shopState.price=e.target.value;  renderGrid(); }));
  document.querySelectorAll('[name="stock"]').forEach(r  => r.addEventListener("change", e => { shopState.stock=e.target.value;  renderGrid(); }));

  document.querySelectorAll(".sfbtn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sfbtn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      shopState.size = btn.dataset.size;
      renderGrid();
    });
  });

  document.getElementById("sort-sel")?.addEventListener("change", e => { shopState.sort=e.target.value; renderGrid(); });
  document.getElementById("sidebar-reset")?.addEventListener("click", resetShopFilters);
  document.getElementById("empty-reset")?.addEventListener("click", resetShopFilters);

  // Mobile sidebar
  const sidebarToggle = document.getElementById("mobile-filter-btn");
  const sidebar = document.getElementById("shop-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay?.classList.toggle("show", sidebar.classList.contains("open"));
    });
    overlay?.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }
}

function resetShopFilters() {
  Object.assign(shopState, { search:"", league:"", team:"", size:"", price:"", stock:"", sort:"default", isNew:false });
  const inp = document.getElementById("search-input"); if(inp) inp.value="";
  const clr = document.getElementById("search-clr");  if(clr) clr.style.display="none";
  document.querySelectorAll('[name="league"],[name="team"],[name="price"],[name="stock"]').forEach(r => { if(r.value==="") r.checked=true; });
  document.querySelectorAll(".sfbtn").forEach(b => b.classList.toggle("active", b.dataset.size===""));
  document.getElementById("sort-sel").value = "default";
  renderGrid();
}

// ── Collapsible filter blocks ──────────────────────────────────
function initFilterBlocks() {
  document.querySelectorAll(".filter-block-head").forEach(head => {
    head.addEventListener("click", () => {
      head.closest(".filter-block").classList.toggle("open");
    });
  });
}

// ── Active filter count badge (sidebar + mobile btn) ───────────
function updateFilterCount() {
  const count = [shopState.search, shopState.league, shopState.team,
                 shopState.size, shopState.price, shopState.stock]
    .filter(Boolean).length;
  const badge     = document.getElementById("filter-count-badge");
  const mobBadge  = document.getElementById("mobile-badge");
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle("visible", count > 0);
  }
  if (mobBadge) {
    mobBadge.textContent = count;
    mobBadge.classList.toggle("visible", count > 0);
  }
}

// Wrap renderGrid to also update badge
const _origRenderGrid = renderGrid;
// Redefine renderGrid
window.renderGrid = function() {
  _origRenderGrid();
  updateFilterCount();
};
// Re-run once