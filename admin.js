/**
 * KITKING — Admin Panel Script
 * Features: login, product CRUD, image upload, settings, export
 */

// ── State ──────────────────────────────────────────────────────
let products = [];
let editingId = null;
let confirmCallback = null;
let adminSearchTerm = "";

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = sessionStorage.getItem("kitking_admin");
    if (isLoggedIn === "1") showAdmin();
    else showLogin();
    setupLogin();
});

// ── Login ──────────────────────────────────────────────────────
function showLogin() {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("admin-app").style.display = "none";
}

function showAdmin() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-app").style.display = "flex";
    products = getProducts();
    populateSettings();
    renderTable();
    attachAdminListeners();
}

function setupLogin() {
    const btn = document.getElementById("login-btn");
    const inp = document.getElementById("login-password");
    const err = document.getElementById("login-error");

    const doLogin = () => {
        const pw = inp.value.trim();
        const stored = getAdminConfig().adminPassword || STORE_CONFIG.adminPassword || "admin123";
        if (pw === stored) {
            sessionStorage.setItem("kitking_admin", "1");
            err.style.display = "none";
            showAdmin();
        } else {
            err.style.display = "block";
            inp.value = "";
            inp.focus();
            inp.classList.add("shake");
            setTimeout(() => inp.classList.remove("shake"), 400);
        }
    };

    btn.addEventListener("click", doLogin);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
}

// ── Admin Config (overrides from localStorage) ─────────────────
function getAdminConfig() {
    try { return JSON.parse(localStorage.getItem("kitking_config") || "{}"); } catch { return {}; }
}
function saveAdminConfig(cfg) {
    const existing = getAdminConfig();
    localStorage.setItem("kitking_config", JSON.stringify({ ...existing, ...cfg }));
}

// ── Panel Navigation ───────────────────────────────────────────
function attachAdminListeners() {
    // Nav
    document.querySelectorAll(".snav-item[data-panel]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".snav-item").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            showPanel(btn.dataset.panel);
        });
    });

    // Add product shortcut
    document.getElementById("add-product-shortcut").addEventListener("click", () => switchToAdd());
    document.getElementById("add-product-shortcut"); // redundant, kept for clarity

    // Cancel edit buttons
    document.getElementById("cancel-edit").addEventListener("click", cancelEdit);
    document.getElementById("cancel-edit-2").addEventListener("click", cancelEdit);

    // Form submit
    document.getElementById("product-form").addEventListener("submit", handleFormSubmit);

    // Settings form
    document.getElementById("settings-form").addEventListener("submit", handleSettingsSave);

    // Logout
    document.getElementById("logout-btn").addEventListener("click", () => {
        sessionStorage.removeItem("kitking_admin");
        showLogin();
    });

    // Admin search
    document.getElementById("admin-search").addEventListener("input", debounce(e => {
        adminSearchTerm = e.target.value.trim().toLowerCase();
        renderTable();
    }, 200));

    // Image upload
    setupImageUpload();

    // Price / discount live preview
    ["form-price", "form-discount"].forEach(id => {
        document.getElementById(id).addEventListener("input", updateFinalPrice);
    });

    // Stock toggle label
    document.getElementById("form-instock").addEventListener("change", e => {
        document.getElementById("stock-toggle-label").textContent = e.target.checked ? "In Stock" : "Out of Stock";
    });

    // Danger zone
    document.getElementById("reset-products-btn").addEventListener("click", () => {
        confirm_("Reset all products?", "This will delete all custom products and restore the sample defaults. This cannot be undone.", () => {
            localStorage.removeItem("kitking_products");
            products = getProducts();
            renderTable();
            toast("Products reset to defaults", "success");
        });
    });

    document.getElementById("export-btn").addEventListener("click", exportProducts);

    // Confirm dialog
    document.getElementById("confirm-cancel").addEventListener("click", () => {
        document.getElementById("confirm-overlay").style.display = "none";
        confirmCallback = null;
    });
    document.getElementById("confirm-ok").addEventListener("click", () => {
        document.getElementById("confirm-overlay").style.display = "none";
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });

    // Keyboard
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") document.getElementById("confirm-overlay").style.display = "none";
    });
}

function showPanel(name) {
    ["products", "add", "settings"].forEach(p => {
        document.getElementById(`panel-${p}`).style.display = p === name ? "block" : "none";
    });
}

function switchToAdd(productId = null) {
    document.querySelectorAll(".snav-item").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-panel="add"]`).classList.add("active");
    showPanel("add");
    editingId = productId;

    if (productId) {
        const p = products.find(x => x.id === productId);
        if (p) populateForm(p);
        document.getElementById("form-panel-title").textContent = "Edit Product";
        document.getElementById("form-submit-btn").textContent = "Update Product";
    } else {
        resetForm();
        document.getElementById("form-panel-title").textContent = "Add New Product";
        document.getElementById("form-submit-btn").textContent = "Save Product";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
    editingId = null;
    resetForm();
    document.querySelectorAll(".snav-item").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-panel="products"]`).classList.add("active");
    showPanel("products");
}

// ── Render Products Table ──────────────────────────────────────
function renderTable() {
    const filtered = adminSearchTerm
        ? products.filter(p => p.name.toLowerCase().includes(adminSearchTerm) || p.team.toLowerCase().includes(adminSearchTerm))
        : products;

    const tbody = document.getElementById("products-tbody");
    const c = STORE_CONFIG.currency;

    // Stats
    document.getElementById("stat-total").textContent = products.length;
    document.getElementById("stat-instock").textContent = products.filter(p => p.inStock).length;
    document.getElementById("stat-oos").textContent = products.filter(p => !p.inStock).length;
    document.getElementById("stat-sale").textContent = products.filter(p => p.discount > 0).length;
    document.getElementById("product-count-label").textContent = `${products.length} products in your store`;

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--cream-muted);">No products found</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const fp = finalPrice(p);
        return `
    <tr data-id="${p.id}">
      <td><img class="table-img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/80x60/111/333?text=?'"/></td>
      <td>
        <div class="table-name">${esc(p.name)}</div>
        <div class="table-team">${esc(p.team)} · ${esc(p.league || "")}</div>
      </td>
      <td>
        <div style="font-size:12px;">${esc(p.team)}</div>
        <div style="font-size:11px;color:var(--cream-muted);">${esc(p.league || "")}</div>
      </td>
      <td>
        <div style="font-family:'Cormorant Garamond',serif;font-size:18px;">${c}${fp.toLocaleString()}</div>
        ${p.discount ? `<div style="font-size:11px;color:var(--red);">${c}${p.price.toLocaleString()} −${p.discount}%</div>` : ""}
      </td>
      <td>
        ${p.discount ? `<span class="badge-pill bp-sale">−${p.discount}%</span>` : `<span style="color:var(--cream-muted);font-size:12px;">No discount</span>`}
      </td>
      <td>
        <button class="tbl-toggle ${p.inStock ? 'on' : 'off'}" data-toggle="${p.id}" title="Click to toggle">
          ${p.inStock ? "In Stock" : "Out of Stock"}
        </button>
      </td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn tbl-edit" data-edit="${p.id}">Edit</button>
          <button class="tbl-btn tbl-delete" data-delete="${p.id}">Delete</button>
        </div>
      </td>
    </tr>`;
    }).join("");

    // Attach row actions
    tbody.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => switchToAdd(Number(btn.dataset.edit)));
    });
    tbody.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", () => {
            const p = products.find(x => x.id === Number(btn.dataset.delete));
            confirm_("Delete product?", `"${p.name}" will be permanently removed.`, () => {
                products = products.filter(x => x.id !== Number(btn.dataset.delete));
                saveProducts(products);
                renderTable();
                toast("Product deleted", "success");
            });
        });
    });
    tbody.querySelectorAll("[data-toggle]").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.toggle);
            const p = products.find(x => x.id === id);
            if (p) {
                p.inStock = !p.inStock;
                saveProducts(products);
                renderTable();
                toast(`${p.name} marked as ${p.inStock ? "In Stock" : "Out of Stock"}`, "success");
            }
        });
    });
}

// ── Product Form ───────────────────────────────────────────────
function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const sizes = [...document.querySelectorAll(".size-checkboxes input:checked")].map(i => i.value);
    if (!sizes.length) { toast("Please select at least one size", "error"); return; }

    const imgUrl = document.getElementById("image-preview").dataset.base64 ||
        document.getElementById("form-image-url").value.trim() ||
        "https://placehold.co/600x480/111/333?text=No+Image";

    const p = {
        id: editingId || Date.now(),
        name: document.getElementById("form-name").value.trim(),
        team: document.getElementById("form-team").value.trim(),
        league: document.getElementById("form-league").value.trim() || "Other",
        description: document.getElementById("form-description").value.trim(),
        price: Number(document.getElementById("form-price").value),
        discount: Number(document.getElementById("form-discount").value) || 0,
        sizes,
        image: imgUrl,
        inStock: document.getElementById("form-instock").checked,
        featured: document.getElementById("form-featured").checked,
        badge: document.getElementById("form-badge").value,
        tags: [],
    };

    if (editingId) {
        const idx = products.findIndex(x => x.id === editingId);
        if (idx !== -1) products[idx] = p;
        toast("Product updated!", "success");
    } else {
        products.push(p);
        toast("Product added!", "success");
    }

    saveProducts(products);
    cancelEdit();
    renderTable();
}

function validateForm() {
    const required = [
        { id: "form-name", label: "Product name" },
        { id: "form-team", label: "Team" },
        { id: "form-price", label: "Price" },
    ];
    for (const { id, label } of required) {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
            toast(`${label} is required`, "error");
            el.focus();
            return false;
        }
    }
    return true;
}

function populateForm(p) {
    document.getElementById("edit-id").value = p.id;
    document.getElementById("form-name").value = p.name;
    document.getElementById("form-team").value = p.team;
    document.getElementById("form-league").value = p.league || "";
    document.getElementById("form-description").value = p.description || "";
    document.getElementById("form-price").value = p.price;
    document.getElementById("form-discount").value = p.discount || 0;
    document.getElementById("form-badge").value = p.badge || "";
    document.getElementById("form-instock").checked = p.inStock;
    document.getElementById("form-featured").checked = p.featured || false;
    document.getElementById("stock-toggle-label").textContent = p.inStock ? "In Stock" : "Out of Stock";

    // Sizes
    document.querySelectorAll(".size-checkboxes input").forEach(cb => {
        cb.checked = p.sizes.includes(cb.value);
    });

    // Image
    const preview = document.getElementById("image-preview");
    const placeholder = document.getElementById("upload-placeholder");
    const removeBtn = document.getElementById("remove-img");
    if (p.image) {
        preview.src = p.image;
        preview.style.display = "block";
        preview.dataset.base64 = "";
        placeholder.style.display = "none";
        removeBtn.style.display = "block";
        document.getElementById("form-image-url").value = p.image.startsWith("data:") ? "" : p.image;
    }

    updateFinalPrice();
}

function resetForm() {
    document.getElementById("product-form").reset();
    document.getElementById("edit-id").value = "";
    editingId = null;
    document.querySelectorAll(".size-checkboxes input").forEach(cb => cb.checked = false);
    document.getElementById("form-final-price").value = "";
    document.getElementById("stock-toggle-label").textContent = "In Stock";

    // Reset image
    const preview = document.getElementById("image-preview");
    preview.src = ""; preview.style.display = "none"; preview.dataset.base64 = "";
    document.getElementById("upload-placeholder").style.display = "flex";
    document.getElementById("remove-img").style.display = "none";
    document.getElementById("form-image-url").value = "";
}

function updateFinalPrice() {
    const price = Number(document.getElementById("form-price").value) || 0;
    const discount = Number(document.getElementById("form-discount").value) || 0;
    const fp = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
    const c = STORE_CONFIG.currency;
    document.getElementById("form-final-price").value = price > 0 ? `${c}${fp.toLocaleString()}` : "";
}

// ── Image Upload ───────────────────────────────────────────────
function setupImageUpload() {
    const area = document.getElementById("image-upload-area");
    const fileInput = document.getElementById("image-file");
    const preview = document.getElementById("image-preview");
    const placeholder = document.getElementById("upload-placeholder");
    const removeBtn = document.getElementById("remove-img");
    const urlInput = document.getElementById("form-image-url");

    // Click to open file picker
    area.addEventListener("click", e => {
        if (e.target === removeBtn || removeBtn.contains(e.target)) return;
        fileInput.click();
    });

    // File selected
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) processImageFile(file);
    });

    // Drag and drop
    area.addEventListener("dragover", e => { e.preventDefault(); area.classList.add("drag-over"); });
    area.addEventListener("dragleave", () => area.classList.remove("drag-over"));
    area.addEventListener("drop", e => {
        e.preventDefault(); area.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) processImageFile(file);
    });

    // Remove image
    removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        preview.src = ""; preview.style.display = "none"; preview.dataset.base64 = "";
        placeholder.style.display = "flex"; removeBtn.style.display = "none";
        urlInput.value = ""; fileInput.value = "";
    });

    // URL paste
    urlInput.addEventListener("input", debounce(() => {
        const url = urlInput.value.trim();
        if (url) {
            preview.src = url;
            preview.onload = () => {
                preview.style.display = "block"; preview.dataset.base64 = "";
                placeholder.style.display = "none"; removeBtn.style.display = "block";
            };
            preview.onerror = () => { preview.style.display = "none"; placeholder.style.display = "flex"; };
        }
    }, 500));
}

function processImageFile(file) {
    if (file.size > 5 * 1024 * 1024) { toast("Image must be under 5MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = e => {
        const base64 = e.target.result;
        const preview = document.getElementById("image-preview");
        const placeholder = document.getElementById("upload-placeholder");
        const removeBtn = document.getElementById("remove-img");
        preview.src = base64; preview.dataset.base64 = base64;
        preview.style.display = "block"; placeholder.style.display = "none";
        removeBtn.style.display = "block";
        document.getElementById("form-image-url").value = "";
    };
    reader.readAsDataURL(file);
}

// ── Settings ───────────────────────────────────────────────────
function populateSettings() {
    const cfg = { ...STORE_CONFIG, ...getAdminConfig() };
    document.getElementById("cfg-name").value = cfg.name || "";
    document.getElementById("cfg-tagline").value = cfg.tagline || "";
    document.getElementById("cfg-whatsapp").value = cfg.whatsappNumber || "";
    document.getElementById("cfg-shipping").value = cfg.freeShippingThreshold || 2000;
    document.getElementById("cfg-currency").value = cfg.currency || "Nu.";
}

function handleSettingsSave(e) {
    e.preventDefault();
    const newPw = document.getElementById("cfg-password").value.trim();
    const cfg = {
        name: document.getElementById("cfg-name").value.trim(),
        tagline: document.getElementById("cfg-tagline").value.trim(),
        whatsappNumber: document.getElementById("cfg-whatsapp").value.trim(),
        freeShippingThreshold: Number(document.getElementById("cfg-shipping").value) || 2000,
        currency: document.getElementById("cfg-currency").value.trim() || "Nu.",
    };
    if (newPw) cfg.adminPassword = newPw;
    saveAdminConfig(cfg);
    toast("Settings saved!", "success");
    document.getElementById("cfg-password").value = "";
}

// ── Export ─────────────────────────────────────────────────────
function exportProducts() {
    const json = JSON.stringify(products, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "kitking-products.json";
    a.click(); URL.revokeObjectURL(url);
    toast("Products exported!", "success");
}

// ── Confirm Dialog ─────────────────────────────────────────────
function confirm_(title, msg, cb) {
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-msg").textContent = msg;
    document.getElementById("confirm-overlay").style.display = "flex";
    confirmCallback = cb;
}

// ── Toast ──────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = "") {
    const t = document.getElementById("admin-toast");
    t.textContent = msg;
    t.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 2800);
}

// ── Helpers ────────────────────────────────────────────────────
function finalPrice(p) {
    if (!p.discount) return p.price;
    return Math.round(p.price * (1 - p.discount / 100));
}
function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}