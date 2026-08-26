// =============================
// Handmade Store - Frontend Core
// =============================

// Put your business WhatsApp number here.
// India example: 919876543210 (country code + number, no + or spaces)
const BUSINESS_WHATSAPP = "917386780566";
const BUSINESS_NAME = "Sowjany Ananthasetty";

const MAX_CART_QUANTITY = 20;

const money = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

function getCart() {
  const cart = JSON.parse(
    localStorage.getItem("handmade_cart") || "[]"
  );

  return cart.map(item => ({
    ...item,
    quantity: Math.min(
      MAX_CART_QUANTITY,
      Math.max(1, Number(item.quantity) || 1)
    )
  }));
}

function saveCart(cart) {
  const limitedCart = cart.map(item => ({
    ...item,
    quantity: Math.min(
      MAX_CART_QUANTITY,
      Math.max(1, Number(item.quantity) || 1)
    )
  }));

  localStorage.setItem(
    "handmade_cart",
    JSON.stringify(limitedCart)
  );

  updateHeaderCounts();
}

function getWishlist() {
  return JSON.parse(localStorage.getItem("handmade_wishlist") || "[]");
}

function saveWishlist(items) {
  localStorage.setItem("handmade_wishlist", JSON.stringify(items));
  updateHeaderCounts();
}

function addToCart(id, options = {}) {
  const product = productStore.getProductById(id);
  if (!product) return;

  if (product.stockQuantity <= 0) {
    toast("This product is out of stock");
    return;
  }

  const colors = Array.isArray(product.availableColors)
    ? product.availableColors
    : [];

  const sizes = Array.isArray(product.sizes)
    ? product.sizes
    : [];

  const selectedColor =
    options.selectedColor ||
    (colors.length === 1 ? colors[0] : product.color || "");

  const selectedSize =
    options.selectedSize || "";

  if (sizes.length && !selectedSize) {
    toast("Please select a size.");
    return;
  }

  if (colors.length > 1 && !selectedColor) {
    toast("Please select a color.");
    return;
  }

  const customizationKey =
    options.customizationKey || "";

  const cartItemKey = [
    product.id,
    selectedColor,
    selectedSize,
    customizationKey
  ].join("|");

  const cart = getCart();

  const existing = cart.find(
    item => item.cartItemKey === cartItemKey
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      id: product.id,
      cartItemKey,
      selectedColor,
      selectedSize,
      quantity: 1
    });
  }

  saveCart(cart);
  toast("Added to cart");
}

function removeFromCart(id) {
  const key = String(id);

  const cart = getCart().filter(
    item =>
      String(item.cartItemKey || item.id) !== key
  );

  saveCart(cart);
  renderCartPage();
}

function changeQuantity(id, delta) {
  const key = String(id);
  const cart = getCart();

  const item = cart.find(
    item =>
      String(item.cartItemKey || item.id) === key
  );

  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    saveCart(
      cart.filter(
        x =>
          String(x.cartItemKey || x.id) !== key
      )
    );
  } else {
    saveCart(cart);
  }

  renderCartPage();
}

function toggleWishlist(id) {
  const product = productStore.getProductById(id);
  if (!product) return;

  let wishlist = getWishlist();

  const exists = wishlist.some(
    item => item.id === product.id
  );

  if (exists) {
    wishlist = wishlist.filter(
      item => item.id !== product.id
    );

    toast("Removed from wishlist");
  } else {
    wishlist.push(product);
    toast("Added to wishlist");
  }

  saveWishlist(wishlist);

  const page = document.body.dataset.page;

  if (page === "home") renderHome();
  if (page === "shop") renderShop();

  if (
    location.pathname.endsWith(
      "category.html"
    )
  ) {
    renderCategoryPage();
  }

  if (
    location.pathname.endsWith(
      "wishlist.html"
    )
  ) {
    renderWishlistPage();
  }
}

function getCurrentPageName() {
  const page =
    location.pathname.split("/").pop() ||
    "index.html";

  return page.toLowerCase();
}

function renderBreadcrumb() {
  const page = getCurrentPageName();

  const category =
    new URLSearchParams(
      location.search
    ).get("category");

  const isCategory =
    page === "category.html" &&
    category;

  const isShop =
    page === "shop.html";

  let breadcrumb =
    document.getElementById(
      "site-breadcrumb"
    );

  if (!isCategory && !isShop) {
    breadcrumb?.remove();
    return;
  }

  if (!breadcrumb) {
    breadcrumb =
      document.createElement("nav");

    breadcrumb.id =
      "site-breadcrumb";

    breadcrumb.setAttribute(
      "aria-label",
      "Breadcrumb"
    );

    document
      .getElementById("site-header")
      ?.after(breadcrumb);
  }

  const parts = isCategory
    ? [
        {
          label: "HOME",
          href: "index.html"
        },
        {
          label: "SHOP ALL",
          href: "shop.html"
        },
        {
          label:
            category.toUpperCase(),
          current: true
        }
      ]
    : [
        {
          label: "HOME",
          href: "index.html"
        },
        {
          label: "SHOP ALL",
          current: true
        }
      ];

  breadcrumb.innerHTML =
    parts
      .map(
        (part, index) => `
          ${
            index
              ? `<span aria-hidden="true">/</span>`
              : ""
          }

          ${
            part.current
              ? `
                <span
                  class="breadcrumb-current"
                  aria-current="page">
                  ${escapeHtml(
                    part.label
                  )}
                </span>
              `
              : `
                <a href="${part.href}">
                  ${escapeHtml(
                    part.label
                  )}
                </a>
              `
          }
        `
      )
      .join("");
}
function productCard(product) {
  const wished =
    getWishlist().some(
      item => item.id === product.id
    );

  const hasOptions =
    (
      Array.isArray(
        product.availableColors
      ) &&
      product.availableColors.length > 1
    ) ||
    (
      Array.isArray(product.sizes) &&
      product.sizes.length > 0
    );

  const addButton = hasOptions
    ? `
      <button
        class="small-btn"
        ${
          product.stockQuantity <= 0
            ? "disabled"
            : ""
        }
        onclick="location.href='product.html?id=${product.id}'">

        ${
          product.stockQuantity <= 0
            ? "Out of Stock"
            : "Choose Options"
        }

      </button>
    `
    : `
      <button
        class="small-btn"
        ${
          product.stockQuantity <= 0
            ? "disabled"
            : ""
        }
        onclick="addToCart(${product.id})">

        ${
          product.stockQuantity <= 0
            ? "Out of Stock"
            : "Add to Cart"
        }

      </button>
    `;

  return `
    <article class="product-card">

      <div class="product-image">

        <!-- CLICKING THE IMAGE OPENS PRODUCT PAGE -->
        <a
          href="product.html?id=${product.id}"
          class="product-image-link"
          aria-label="View ${escapeHtml(
            product.name
          )}">

          <img
            src="${product.image}"
            alt="${escapeHtml(
              product.name
            )}">

        </a>

        <!-- WISHLIST HEART -->
        <button
          class="heart ${
            wished ? "active" : ""
          }"
          onclick="event.stopPropagation(); toggleWishlist(${product.id})"
          aria-label="Wishlist">

          ${
            wished
              ? "♥"
              : "♡"
          }

        </button>

      </div>

      <div class="product-info">

        <span class="product-category">
          ${escapeHtml(product.category)}
        </span>

        ${
          product.keychainType
            ? `
              <span class="keychain-badge">

                ${
                  product.keychainType ===
                  "Photo Keychains"
                    ? "Photo Keychain"
                    : "Name Keychain"
                }

              </span>
            `
            : ""
        }

        <!-- CLICKING THE PRODUCT NAME OPENS PRODUCT PAGE -->
        <a
          href="product.html?id=${product.id}">

          <h3>
            ${escapeHtml(
              product.name
            )}
          </h3>

        </a>

        <div class="product-row">

          <strong>
            ${money(product.price)}
          </strong>

          ${
            product.category ===
              "Frames" ||

            (
              product.category ===
                "Keychains" &&
              product.customizable
            )

              ? `
                <div class="product-actions">

                  <button
                    class="small-btn customize-card-btn"
                    ${
                      product.stockQuantity <= 0
                        ? "disabled"
                        : ""
                    }
                    onclick="${
                      product.category ===
                      "Keychains"
                        ? "openKeychainCustomization"
                        : "openFrameCustomization"
                    }(${product.id})">

                    Customize Now

                  </button>

                  ${addButton}

                </div>
              `

              : addButton
          }

        </div>

      </div>

    </article>
  `;
}
function renderHeader() {
  const header =
    document.getElementById(
      "site-header"
    );

  if (!header) return;

  const page =
    getCurrentPageName();

  const categoryPage =
    page === "category.html";

  const activePage =
    (
      page === "index.html" ||
      page === ""
    )
      ? "home"
      : page === "shop.html" ||
        page === "product.html"
        ? "shop"
        : page === "contact.html"
          ? "contact"
          : page === "about.html"
            ? "about"
            : categoryPage
              ? "categories"
              : "";

  header.innerHTML = `
    <header class="navbar">

      <a
        class="brand"
        href="index.html"
        aria-label="Timeless Treasures home">

        <img
          src="images/logo.png"
          alt="Timeless Treasures">

      </a>

      <nav class="nav-links">

        <a
          class="${
            activePage === "home"
              ? "active"
              : ""
          }"
          href="index.html">
          HOME
        </a>

        <a
          class="${
            activePage === "shop"
              ? "active"
              : ""
          }"
          href="shop.html">
          SHOP ALL
        </a>

        <div class="nav-dropdown">

          <button
            class="${
              activePage === "categories"
                ? "active"
                : ""
            }">
            CATEGORIES
          </button>

          <div class="dropdown-menu">

            ${CATEGORIES
              .map(
                c => `
                  <a
                    href="category.html?category=${encodeURIComponent(
                      c
                    )}">
                    ${escapeHtml(c)}
                  </a>
                `
              )
              .join("")}

          </div>

        </div>

        <a
          class="contact-nav ${
            activePage === "contact"
              ? "active"
              : ""
          }"
          href="contact.html">
          CONTACT
        </a>

        <a
          class="${
            activePage === "about"
              ? "active"
              : ""
          }"
          href="about.html">
          ABOUT US
        </a>

      </nav>

      <div class="nav-actions">

        <form
          class="search-form"
          onsubmit="headerSearch(event)">

          <input
            id="header-search"
            aria-label="Search products"
            placeholder="Search">

          <button
            aria-label="Search">
            ⌕
          </button>

        </form>

        <a
          href="wishlist.html"
          class="nav-icon wishlist-nav"
          aria-label="Wishlist">

          <span class="wishlist-heart">
            ♡
          </span>

          <span
            id="wishlist-count"
            class="wishlist-count"
            aria-hidden="true">
            0
          </span>

        </a>

        <a
          href="cart.html"
          class="cart-pill"
          aria-label="Cart">

          <span class="bag-icon">
            ♧
          </span>

          CART ₹
          <span id="cart-total">
            0
          </span>

        </a>

        <a
          class="track-pill"
          href="track-order.html">

          <span>▣</span>
          TRACK

        </a>

      </div>

      <button
        class="mobile-menu"
        onclick="toggleMobileMenu()">
        ☰
      </button>

    </header>
  `;

  renderBreadcrumb();
}

function renderFooter() {
  const footer =
    document.getElementById(
      "site-footer"
    );

  if (!footer) return;

  footer.innerHTML = `
    <footer class="footer">

      <div class="footer-grid">

        <div>

          <a
            class="brand footer-brand"
            href="index.html">

            <img
              src="images/logo.png"
              alt="Timeless Treasures">

          </a>

          <p>
            Timeless handmade treasures,
            created with care.
          </p>

        </div>

        <div>

          <h3>QUICK LINKS</h3>

          <a href="index.html">
            Home
          </a>

          <a href="shop.html">
            Shop All
          </a>

          <a href="about.html">
            About Us
          </a>

          <a href="contact.html">
            Contact
          </a>

        </div>

        <div>

          <h3>CUSTOMER CARE</h3>

          <a href="track-order.html">
            Track Order
          </a>

          <a href="wishlist.html">
            Wishlist
          </a>

          <a href="cart.html">
            Cart
          </a>

        </div>

        <div>

          <h3>CATEGORIES</h3>

          ${CATEGORIES
            .slice(0, 5)
            .map(
              c => `
                <a
                  href="category.html?category=${encodeURIComponent(
                    c
                  )}">
                  ${escapeHtml(c)}
                </a>
              `
            )
            .join("")}

        </div>

      </div>

      <div class="footer-bottom">
        © 2026 Timeless Treasures.
        All rights reserved.
      </div>

    </footer>
  `;
}

function updateHeaderCounts() {
  const cart = getCart();
  const wishlist = getWishlist();

  const cartCount =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  const cartTotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const cartTotalEl =
    document.getElementById(
      "cart-total"
    );

  if (cartTotalEl) {
    cartTotalEl.textContent =
      cartTotal.toLocaleString(
        "en-IN"
      );
  }

  const wishlistCountEl =
    document.getElementById(
      "wishlist-count"
    );

  if (wishlistCountEl) {
    wishlistCountEl.textContent =
      String(wishlist.length);

    wishlistCountEl.hidden =
      wishlist.length === 0;
  }
}

function headerSearch(event) {
  event.preventDefault();

  const value =
    document
      .getElementById(
        "header-search"
      )
      .value
      .trim();

  if (value) {
    location.href =
      `shop.html?search=${encodeURIComponent(
        value
      )}`;
  }
}

function toggleMobileMenu() {
  document
    .querySelector(
      ".nav-links"
    )
    ?.classList.toggle(
      "open"
    );
}

function renderHome() {
  renderHeader();
  renderFooter();
  updateHeaderCounts();

  const categoryContainer =
    document.getElementById(
      "home-categories"
    );

  const featured =
    document.getElementById(
      "featured-products"
    );

  const categoryImages = {};

  CATEGORIES.forEach(
    category => {

      const item =
        productStore
          .getProducts({
            activeOnly: true
          })
          .find(
            p =>
              p.category ===
              category
          );

      if (item) {
        categoryImages[
          category
        ] = item.image;
      }

    }
  );

  if (categoryContainer) {

    categoryContainer.innerHTML =
      CATEGORIES
        .map(
          category => `
            <a
              class="category-card"
              href="category.html?category=${encodeURIComponent(
                category
              )}">

              <img
                src="${categoryImages[category]}"
                alt="${escapeHtml(
                  category
                )}">

              <div>

                <h3>
                  ${escapeHtml(
                    category
                  )}
                </h3>

                <span>
                  EXPLORE →
                </span>

              </div>

            </a>
          `
        )
        .join("");

  }

  if (featured) {

    featured.innerHTML =
      productStore
        .getProducts({
          activeOnly: true
        })
        .filter(
          product =>
            product.featured
        )
        .slice(0, 8)
        .map(productCard)
        .join("");

  }
}

function getSelectedFilters() {

  const checked =
    name =>
      [
        ...document.querySelectorAll(
          `input[name="${name}"]:checked`
        )
      ].map(
        x => x.value
      );

  return {
    prices:
      checked("price"),

    framePrices:
      checked("frame-price"),

    colors:
      checked("color"),

    frameColors:
      checked("frame-color"),

    keychainPrices:
      checked("keychain-price"),

    keychainTypes:
      checked("keychain-type"),

    keychainColors:
      checked("keychain-color"),

    sizes:
      checked("size"),

    photoCapacities:
      checked(
        "photo-capacity"
      ).map(Number),

    availability:
      checked("availability")
  };
}

function matchesPrice(
  product,
  ranges
) {

  if (!ranges.length)
    return true;

  return ranges.some(
    range => {

      if (range === "0-199")
        return product.price < 200;

      if (range === "200-399")
        return (
          product.price >= 200 &&
          product.price <= 399
        );

      if (range === "400-699")
        return (
          product.price >= 400 &&
          product.price <= 699
        );

      if (range === "700-plus")
        return product.price >= 700;

      return true;
    }
  );
}

function matchesFramePrice(
  product,
  ranges
) {

  if (!ranges.length)
    return true;

  return ranges.some(
    range => {

      if (range === "under-500")
        return product.price < 500;

      if (range === "500-999")
        return (
          product.price >= 500 &&
          product.price <= 999
        );

      if (range === "1000-1499")
        return (
          product.price >= 1000 &&
          product.price <= 1499
        );

      if (range === "1500-plus")
        return product.price >= 1500;

      return true;
    }
  );
}

function matchesKeychainPrice(
  product,
  ranges
) {

  if (!ranges.length)
    return true;

  return ranges.some(
    range => {

      if (range === "under-200")
        return product.price < 200;

      if (range === "200-399")
        return (
          product.price >= 200 &&
          product.price <= 399
        );

      if (range === "400-599")
        return (
          product.price >= 400 &&
          product.price <= 599
        );

      if (range === "600-plus")
        return product.price >= 600;

      return true;
    }
  );
}

function syncKeychainTab(
  types
) {

  document
    .querySelectorAll(
      "[data-keychain-tab]"
    )
    .forEach(
      tab => {

        const active =
          types.length === 1
            ? tab.dataset.keychainTab ===
              types[0]
            : tab.dataset.keychainTab ===
              "all";

        tab.classList.toggle(
          "active",
          active
        );

      }
    );
}

function renderCategoryPage() {

  renderHeader();
  renderFooter();
  updateHeaderCounts();

  const params =
    new URLSearchParams(
      location.search
    );

  const category =
    params.get("category") ||
    CATEGORIES[0];

  document.getElementById(
    "category-title"
  ).textContent =
    category;

  const isFrames =
    category === "Frames";

  const isKeychains =
    category === "Keychains";

  document.getElementById(
    "standard-price-filter"
  ).hidden =
    isFrames ||
    isKeychains;

  document.getElementById(
    "frame-price-filter"
  ).hidden =
    !isFrames;

  document.getElementById(
    "photo-capacity-filter"
  ).hidden =
    !isFrames;

  document.getElementById(
    "bangle-color-filter"
  ).hidden =
    isFrames ||
    isKeychains;

  document.getElementById(
    "frame-color-filter"
  ).hidden =
    !isFrames;

  document.getElementById(
    "keychain-tabs"
  ).hidden =
    !isKeychains;

  document.getElementById(
    "keychain-price-filter"
  ).hidden =
    !isKeychains;

  document.getElementById(
    "keychain-type-filter"
  ).hidden =
    !isKeychains;

  document.getElementById(
    "keychain-color-filter"
  ).hidden =
    !isKeychains;

  if (isKeychains) {

    document
      .querySelectorAll(
        'input[name="keychain-type"]'
      )
      .forEach(
        input =>
          input.checked = false
      );

  }

  const sizeFilter =
    document.getElementById(
      "size-filter"
    );

  if (sizeFilter) {
    sizeFilter.hidden =
      category !== "Bangles";
  }

  document
    .querySelectorAll(
      "[data-non-bangle-color]"
    )
    .forEach(
      label => {

        label.hidden =
          category ===
          "Bangles";

      }
    );

  const draw = () => {

    const filters =
      getSelectedFilters();

    let items =
      productStore
        .getProducts({
          activeOnly: true
        })
        .filter(
          p =>
            p.category ===
            category
        );

    items =
      items.filter(
        p =>
          (
            isFrames
              ? matchesFramePrice(
                  p,
                  filters.framePrices
                )
              : isKeychains
                ? matchesKeychainPrice(
                    p,
                    filters.keychainPrices
                  )
                : matchesPrice(
                    p,
                    filters.prices
                  )
          ) &&

          (
            !filters.colors.length ||
            filters.colors.includes(
              p.color
            ) ||
            (
              Array.isArray(
                p.availableColors
              ) &&
              p.availableColors.some(
                color =>
                  filters.colors.includes(
                    color
                  )
              )
            )
          ) &&

          (
            !filters.keychainTypes.length ||
            filters.keychainTypes.includes(
              p.keychainType
            )
          ) &&

          (
            !filters.keychainColors.length ||
            filters.keychainColors.includes(
              p.color
            ) ||
            (
              Array.isArray(
                p.availableColors
              ) &&
              p.availableColors.some(
                color =>
                  filters.keychainColors.includes(
                    color
                  )
              )
            )
          ) &&

          (
            !filters.sizes.length ||
            (
              p.sizes || []
            ).some(
              size =>
                filters.sizes.includes(
                  size
                )
            )
          ) &&

          (
            !filters.frameColors.length ||
            filters.frameColors.includes(
              p.color
            )
          ) &&

          (
            !filters.photoCapacities.length ||
            (
              p.photoCapacity || []
            ).some(
              capacity =>
                filters.photoCapacities.includes(
                  capacity
                )
            )
          ) &&

          (
            !filters.availability.length ||
            filters.availability.includes(
              p.stock
                ? "in-stock"
                : "out-of-stock"
            )
          )
      );

    if (isKeychains) {
      syncKeychainTab(
        filters.keychainTypes
      );
    }

    const sort =
      document.getElementById(
        "category-sort"
      )?.value ||
      "featured";

    if (sort === "low")
      items.sort(
        (a, b) =>
          a.price - b.price
      );

    if (sort === "high")
      items.sort(
        (a, b) =>
          b.price - a.price
      );

    if (sort === "name")
      items.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );

    document.getElementById(
      "category-count"
    ).textContent =
      `${items.length} product${
        items.length !== 1
          ? "s"
          : ""
      } available`;

    const container =
      document.getElementById(
        "category-products"
      );

    container.innerHTML =
      items.length
        ? items
            .map(productCard)
            .join("")
        : `
          <div class="empty">

            <div class="empty-icon">
              ⌕
            </div>

            <h2>
              No products match these filters
            </h2>

            <p>
              Try changing or clearing
              your filters.
            </p>

          </div>
        `;
  };

  document
    .querySelectorAll(
      ".filter-panel input"
    )
    .forEach(
      input =>
        input.addEventListener(
          "change",
          draw
        )
    );

  document
    .getElementById(
      "category-sort"
    )
    ?.addEventListener(
      "change",
      draw
    );

  if (isKeychains) {

    document
      .querySelectorAll(
        "[data-keychain-tab]"
      )
      .forEach(
        tab => {

          tab.classList.toggle(
            "active",
            tab.dataset.keychainTab ===
              "all"
          );

          tab.addEventListener(
            "click",
            () => {

              document
                .querySelectorAll(
                  "[data-keychain-tab]"
                )
                .forEach(
                  item =>
                    item.classList.remove(
                      "active"
                    )
                );

              tab.classList.add(
                "active"
              );

              document
                .querySelectorAll(
                  'input[name="keychain-type"]'
                )
                .forEach(
                  input => {

                    input.checked =
                      tab.dataset
                        .keychainTab !==
                        "all" &&
                      input.value ===
                        tab.dataset
                          .keychainTab;

                  }
                );

              draw();
            }
          );
        }
      );

  }

  draw();
}

function clearCategoryFilters() {

  document
    .querySelectorAll(
      ".filter-panel input"
    )
    .forEach(
      input =>
        input.checked = false
    );

  renderCategoryPage();
}

function renderProductPage() {

  renderHeader();
  renderFooter();
  updateHeaderCounts();

  const id =
    Number(
      new URLSearchParams(
        location.search
      ).get("id")
    );

  const product =
    productStore.getProductById(id);

  const container =
    document.getElementById(
      "product-details"
    );

  if (!container)
    return;

  if (!product || !product.active) {

    container.innerHTML = `
      <div class="empty">

        <h2>
          Product not found
        </h2>

        <a
          class="btn btn-primary"
          href="shop.html">
          Back to Shop
        </a>

      </div>
    `;

    return;
  }

  const colors =
    Array.isArray(
      product.availableColors
    )
      ? product.availableColors
      : product.color
        ? [product.color]
        : [];

  const sizes =
    Array.isArray(product.sizes)
      ? product.sizes
      : [];

  const hasColors =
    colors.length > 0;

  const hasSizes =
    sizes.length > 0;

  const hasCustomization =
    product.category ===
      "Frames" ||
    (
      product.category ===
        "Keychains" &&
      product.customizable
    );

  container.innerHTML = `

    <div class="details">

      <div class="details-image">

        <img
          src="${product.image}"
          alt="${escapeHtml(
            product.name
          )}">

      </div>

      <div class="details-copy">

        <span class="product-category">
          ${escapeHtml(
            product.category
          )}
        </span>

        <h1>
          ${escapeHtml(
            product.name
          )}
        </h1>

        <div class="stars">
          ★★★★★
        </div>

        <div class="price">
          ${money(product.price)}
        </div>

        <p>
          ${escapeHtml(
            product.description ||
              ""
          )}
        </p>

        ${
          hasColors
            ? `
              <div class="product-option">

                <label>
                  <strong>
                    Color
                  </strong>
                </label>

                <div
                  class="option-buttons"
                  id="product-color-options">

                  ${colors
                    .map(
                      (color, index) => `
                        <label
                          class="option-button">

                          <input
                            type="radio"
                            name="product-color"
                            value="${escapeHtml(
                              color
                            )}"
                            ${
                              index === 0
                                ? "checked"
                                : ""
                            }>

                          <span>
                            ${escapeHtml(
                              color
                            )}
                          </span>

                        </label>
                      `
                    )
                    .join("")}

                </div>

              </div>
            `
            : ""
        }

        ${
          hasSizes
            ? `
              <div class="product-option">

                <label
                  for="product-size">

                  <strong>
                    Size
                  </strong>

                </label>

                <select
                  id="product-size"
                  name="product-size">

                  <option
                    value=""
                    selected
                    disabled>
                    Select Size
                  </option>

                  ${sizes
                    .map(
                      size => `
                        <option
                          value="${escapeHtml(
                            size
                          )}">

                          ${escapeHtml(
                            size
                          )}

                        </option>
                      `
                    )
                    .join("")}

                </select>

              </div>
            `
            : ""
        }

        ${
          hasCustomization
            ? `
              <p class="form-note">

                This product can be customized.
                Choose
                <strong>
                  Customize Now
                </strong>
                below.

              </p>
            `
            : ""
        }

        <div class="quantity-control">

          <button
            onclick="adjustDetailQty(-1)">
            −
          </button>

          <span id="detail-qty">
            1
          </span>

          <button
            onclick="adjustDetailQty(1)">
            +
          </button>

        </div>

        <div class="details-buttons">

          ${
            hasCustomization
              ? `
                <button
                  class="btn btn-primary"
                  ${
                    product.stockQuantity <= 0
                      ? "disabled"
                      : ""
                  }
                  onclick="${
                    product.category ===
                    "Keychains"
                      ? "openKeychainCustomization"
                      : "openFrameCustomization"
                  }(${product.id})">

                  Customize Now

                </button>

                <button
                  class="btn btn-outline"
                  ${
                    product.stockQuantity <= 0
                      ? "disabled"
                      : ""
                  }
                  onclick="addDetailToCart(${product.id})">

                  ${
                    product.stockQuantity <= 0
                      ? "Out of Stock"
                      : "Add to Cart"
                  }

                </button>
              `
              : `
                <button
                  class="btn btn-primary"
                  ${
                    product.stockQuantity <= 0
                      ? "disabled"
                      : ""
                  }
                  onclick="addDetailToCart(${product.id})">

                  ${
                    product.stockQuantity <= 0
                      ? "Out of Stock"
                      : "Add to Cart"
                  }

                </button>
              `
          }

          <button
            class="btn btn-outline"
            onclick="toggleWishlist(${product.id})">

            ♡ Wishlist

          </button>

        </div>

        <div class="product-benefits">

          <p>
            ✓ Handmade with care
          </p>

          <p>
            ✓ Unique design
          </p>

          <p>
            ✓ Carefully packed
          </p>

        </div>

      </div>

    </div>

  `;
}

function openFrameCustomization(
  productId
) {
  openCustomizationModal(
    productId
  );
}

function openKeychainCustomization(
  productId
) {
  openCustomizationModal(
    productId
  );
}

function openCustomizationModal(
  productId
) {

  const product =
    productStore.getProductById(
      productId
    );

  const isFrame =
    product?.category ===
    "Frames";

  const isPhotoKeychain =
    product?.keychainType ===
    "Photo Keychains";

  let modal =
    document.getElementById(
      "frame-customization-modal"
    );

  if (!product)
    return;

  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "frame-customization-modal";

    modal.className =
      "modal-backdrop";

    document.body.appendChild(
      modal
    );
  }

  if (
    modal.parentElement !==
    document.body
  ) {
    document.body.appendChild(
      modal
    );
  }

  modal.innerHTML = `
    <div
      class="custom-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="frame-modal-title">

      <div
        class="customize-modal-header">

        <h2 id="frame-modal-title">

          ${
            isFrame
              ? "Customize Photo Frame"
              : isPhotoKeychain
                ? "Customize Photo Keychain"
                : "Customize Name Keychain"
          }

        </h2>

        <button
          class="modal-close"
          type="button"
          onclick="closeFrameCustomization()"
          aria-label="Close">

          ×

        </button>

      </div>

      <form
        id="frame-customization-form"
        class="custom-form">

        ${
          isFrame ||
          isPhotoKeychain
            ? `
              <label>

                ${
                  isFrame
                    ? "Upload Photos"
                    : "Upload Photo"
                }

                <input
                  id="frame-photo-input"
                  type="file"
                  accept="image/*"
                  ${
                    isFrame
                      ? "multiple"
                      : ""
                  }>

              </label>

              <div
                id="frame-photo-count"
                class="form-note">

                0 /
                ${
                  isFrame
                    ? "10"
                    : "1"
                }
                photos selected

              </div>

              <div
                id="frame-photo-previews"
                class="photo-preview-grid">
              </div>
            `
            : `
              <label>

                Enter Name

                <input
                  name="customerName"
                  placeholder="Your Name">

              </label>
            `
        }

        ${
          isFrame
            ? `
              <label>

                Customer Name

                <input
                  name="customerName"
                  aria-required="true"
                  placeholder="Enter your name">

              </label>

              <label>

                Custom Message

                <textarea
                  name="customMessage"
                  rows="3"
                  placeholder="Write your message...">
                </textarea>

              </label>

              <div class="two-col">

                <label>

                  Frame Size

                  <select
                    name="frameSize"
                    aria-required="true">

                    <option
                      value=""
                      selected
                      disabled>
                      Select frame size
                    </option>

                    ${
                      [
                        "6 × 8 inch",
                        "8 × 10 inch",
                        "10 × 12 inch",
                        "12 × 18 inch",
                        "18 × 24 inch"
                      ]
                        .map(
                          size =>
                            `<option value="${size}">${size}</option>`
                        )
                        .join("")
                    }

                  </select>

                </label>

                <label>

                  Frame Color

                  <select
                    name="frameColor">

                    ${
                      [
                        "Gold",
                        "Brown",
                        "Black",
                        "White",
                        "Red"
                      ]
                        .map(
                          color =>
                            `<option ${
                              color ===
                              product.color
                                ? "selected"
                                : ""
                            }>${color}</option>`
                        )
                        .join("")
                    }

                  </select>

                </label>

              </div>

              <label>

                Number of Photos / Layout

                <select
                  id="frame-photo-layout"
                  name="photoLayout">

                  ${
                    product.photoCapacity
                      .map(
                        capacity =>
                          `<option value="${capacity}">${capacity} Photo${
                            capacity === 1
                              ? ""
                              : "s"
                          }</option>`
                      )
                      .join("")
                  }

                </select>

              </label>
            `
            : isPhotoKeychain
              ? `
                <label>

                  Customer Name

                  <input
                    name="customerName"
                    required
                    placeholder="Enter your name">

                </label>

                <label>

                  Custom Message

                  <textarea
                    name="customMessage"
                    rows="3"
                    placeholder="Write your message...">
                  </textarea>

                </label>

                <label>

                  Keychain Color

                  <select
                    name="frameColor">

                    ${
                      product.availableColors
                        .map(
                          color =>
                            `<option ${
                              color ===
                              product.color
                                ? "selected"
                                : ""
                            }>${color}</option>`
                        )
                        .join("")
                    }

                  </select>

                </label>
              `
              : `
                <label>

                  Keychain Color

                  <select
                    name="frameColor">

                    ${
                      product.availableColors
                        .map(
                          color =>
                            `<option ${
                              color ===
                              product.color
                                ? "selected"
                                : ""
                            }>${color}</option>`
                        )
                        .join("")
                    }

                  </select>

                </label>
              `
        }

        <label>

          Quantity

          <input
            name="quantity"
            type="number"
            min="1"
            max="20"
            value="1"
            required>

        </label>

        <label>

          Special Instructions

          <textarea
            name="specialInstructions"
            rows="3"
            placeholder="Any special request...">
          </textarea>

        </label>

        <p
          id="frame-photo-error"
          class="form-error"
          role="alert">
        </p>

        <button
          class="btn btn-primary full"
          type="submit">

          Add Customized
          ${
            isFrame
              ? "Frame"
              : "Keychain"
          }
          to Cart

        </button>

      </form>

    </div>
  `;

  modal.hidden = false;

  document.body.style.overflow =
    "hidden";

  const modalContent =
    modal.querySelector(
      ".custom-modal"
    );

  modalContent.scrollTop = 0;

  const layout =
    document.getElementById(
      "frame-photo-layout"
    );

  if (layout) {
    layout.value =
      String(
        product.photoCapacity[0]
      );
  }

  modal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        modal
      ) {
        closeFrameCustomization();
      }

    }
  );

  modal.onkeydown =
    event => {

      if (
        event.key ===
        "Escape"
      ) {
        closeFrameCustomization();
      }

    };

  modal.tabIndex = -1;
  modal.focus();

  const selectedPhotos = [];

  const input =
    document.getElementById(
      "frame-photo-input"
    );

  const previews =
    document.getElementById(
      "frame-photo-previews"
    );

  const count =
    document.getElementById(
      "frame-photo-count"
    );

  const error =
    document.getElementById(
      "frame-photo-error"
    );

  const drawPhotos = () => {

    if (
      !input ||
      !previews ||
      !count
    ) {
      return;
    }

    const slotCount =
      isFrame
        ? Number(
            layout.value
          )
        : 1;

    count.textContent =
      `${selectedPhotos.length} / ${
        isFrame
          ? "10"
          : "1"
      } photos selected`;

    previews.innerHTML =
      Array.from(
        {
          length:
            slotCount
        },
        (_, index) => {

          const photo =
            selectedPhotos[
              index
            ];

          return photo
            ? `
              <div class="photo-preview">

                <img
                  src="${photo.dataUrl}"
                  alt="Photo ${
                    index + 1
                  }">

                <button
                  type="button"
                  onclick="removeFramePhoto(${index})"
                  aria-label="Remove Photo ${
                    index + 1
                  }">

                  ×

                </button>

                <span>
                  Photo ${
                    index + 1
                  }
                </span>

              </div>
            `
            : `
              <div class="photo-slot">
                Photo ${
                  index + 1
                }
              </div>
            `;

        }
      ).join("");
  };

  window.removeFramePhoto =
    index => {

      selectedPhotos.splice(
        index,
        1
      );

      drawPhotos();
    };

  input?.addEventListener(
    "change",
    () => {

      error.textContent =
        "";

      const remaining =
        isFrame
          ? Math.min(
              10 -
                selectedPhotos.length,
              Number(
                layout.value
              ) -
                selectedPhotos.length
            )
          : 1 -
            selectedPhotos.length;

      [
        ...input.files
      ]
        .slice(
          0,
          remaining
        )
        .forEach(
          file => {

            const reader =
              new FileReader();

            reader.onload =
              event => {

                selectedPhotos.push({
                  name:
                    file.name,

                  dataUrl:
                    event.target
                      .result
                });

                drawPhotos();
              };

            reader.readAsDataURL(
              file
            );

          }
        );

      input.value =
        "";

    }
  );

  layout?.addEventListener(
    "change",
    () => {

      selectedPhotos.splice(
        Number(
          layout.value
        )
      );

      error.textContent =
        "";

      drawPhotos();
    }
  );

  document
    .getElementById(
      "frame-customization-form"
    )
    .addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const data =
          Object.fromEntries(
            new FormData(
              event.target
            ).entries()
          );

        if (
          isFrame &&
          !data.frameSize
        ) {

          error.textContent =
            "Please select a frame size.";

          return;
        }

        if (
          isFrame &&
          !data.customerName.trim()
        ) {

          error.textContent =
            "Please enter your name.";

          return;
        }

        const requiredPhotos =
          isFrame
            ? Number(
                layout.value
              )
            : 1;

        if (
          isFrame &&
          selectedPhotos.length !==
            requiredPhotos
        ) {

          error.textContent =
            `Please select exactly ${
              requiredPhotos
            } photo${
              requiredPhotos === 1
                ? ""
                : "s"
            } for this layout.`;

          return;
        }

        if (
          isPhotoKeychain &&
          !selectedPhotos.length
        ) {

          error.textContent =
            "Please upload a photo for your customized keychain.";

          return;
        }

        if (
          !isFrame &&
          !isPhotoKeychain &&
          !data.customerName.trim()
        ) {

          error.textContent =
            "Please enter the name for your customized keychain.";

          return;
        }

        const requestedQuantity =
          Number(data.quantity);

        if (
          requestedQuantity < 1 ||
          requestedQuantity > MAX_CART_QUANTITY
        ) {

          error.textContent =
            `Quantity must be between 1 and ${MAX_CART_QUANTITY}.`;

          return;
        }

        const isKeychain =
          product.category ===
          "Keychains";

        const cart =
          getCart();

        cart.push({

          ...product,

          id:
            Date.now(),

          cartItemKey:
            `custom-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,

          name:
            isFrame
              ? "Customized Photo Frame"
              : isPhotoKeychain
                ? "Customized Photo Keychain"
                : "Customized Name Keychain",

          quantity:
            Math.min(
              MAX_CART_QUANTITY,
              requestedQuantity
            ),

          customized:
            true,

          photoCount:
            isFrame
              ? requiredPhotos
              : undefined,

          photoLayout:
            isFrame
              ? `${requiredPhotos} Photos`
              : undefined,

          uploadedPhotos:
            isPhotoKeychain
              ? selectedPhotos
              : [],

          customerName:
            data.customerName,

          customMessage:
            data.customMessage,

          frameSize:
            data.frameSize,

          frameColor:
            data.frameColor,

          keychainType:
            isKeychain
              ? product.keychainType
              : product.keychainType,

          specialInstructions:
            data.specialInstructions

        });

        saveCart(cart);

        closeFrameCustomization();

        toast(
          `${
            isFrame
              ? "Customized frame"
              : "Customized keychain"
          } added to cart`
        );

      }
    );

  drawPhotos();
}

function closeFrameCustomization() {

  const modal =
    document.getElementById(
      "frame-customization-modal"
    );

  if (modal) {

    modal.hidden = true;
    modal.innerHTML = "";

  }

  document.body.style.overflow =
    "";
}

function adjustDetailQty(
  delta
) {

  const el =
    document.getElementById(
      "detail-qty"
    );

  if (!el) return;

  const current =
    Number(
      el.textContent
    ) || 1;

  const newQuantity =
    current + delta;

  if (
    newQuantity >
    MAX_CART_QUANTITY
  ) {

    toast(
      `Maximum ${MAX_CART_QUANTITY} items allowed`
    );

    return;
  }

  el.textContent =
    Math.max(
      1,
      newQuantity
    );
}

function addDetailToCart(
  id
) {

  const product =
    productStore.getProductById(
      id
    );

  if (!product)
    return;

  const qty =
    Number(
      document.getElementById(
        "detail-qty"
      )?.textContent ||
        1
    );

  const selectedColor =
    document.querySelector(
      'input[name="product-color"]:checked'
    )?.value ||
    product.color ||
    "";

  const selectedSize =
    document.getElementById(
      "product-size"
    )?.value ||
    "";

  if (
    Array.isArray(
      product.sizes
    ) &&
    product.sizes.length &&
    !selectedSize
  ) {

    toast(
      "Please select a size."
    );

    return;
  }

  if (
    Array.isArray(
      product.availableColors
    ) &&
    product.availableColors.length > 1 &&
    !selectedColor
  ) {

    toast(
      "Please select a color."
    );

    return;
  }

  for (
    let i = 0;
    i < Math.min(
      qty,
      MAX_CART_QUANTITY
    );
    i++
  ) {

    addToCart(
      id,
      {
        selectedColor,
        selectedSize
      }
    );

  }
}

function renderWishlistPage() {

  renderHeader();
  renderFooter();
  updateHeaderCounts();

  const items =
    getWishlist();

  const container =
    document.getElementById(
      "wishlist-products"
    );

  container.innerHTML =
    items.length
      ? items
          .map(productCard)
          .join("")
      : `
        <div class="empty">

          <div class="empty-icon">
            ♡
          </div>

          <h2>
            Your wishlist is empty
          </h2>

          <p>
            Save products you love here.
          </p>

          <a
            class="btn btn-primary"
            href="shop.html">
            Start Shopping
          </a>

        </div>
      `;
}

function renderCartPage() {

  renderHeader();
  renderFooter();
  updateHeaderCounts();

  const cart =
    getCart();

  const container =
    document.getElementById(
      "cart-page"
    );

  if (!cart.length) {

    container.innerHTML = `
      <div class="empty">

        <div class="empty-icon">
          🛒
        </div>

        <h2>
          Your cart is empty
        </h2>

        <a
          class="btn btn-primary"
          href="shop.html">
          Start Shopping
        </a>

      </div>
    `;

    return;
  }

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const delivery =
    subtotal >= 999
      ? 0
      : 50;

  const total =
    subtotal +
    delivery;

  container.innerHTML = `
    <div class="cart-layout">

      <div class="cart-items">

        ${cart
          .map(
            item => `

              <div class="cart-item">

                <img
                  src="${item.image}"
                  alt="${escapeHtml(
                    item.name
                  )}">

                <div class="cart-item-main">

                  <span
                    class="product-category">

                    ${escapeHtml(
                      item.category
                    )}

                  </span>

                  <h3>
                    ${escapeHtml(
                      item.name
                    )}
                  </h3>

                  ${
                    item.selectedColor
                      ? `
                        <div
                          class="cart-option">

                          <span>
                            Color:
                            ${escapeHtml(
                              item.selectedColor
                            )}
                          </span>

                        </div>
                      `
                      : ""
                  }

                  ${
                    item.selectedSize
                      ? `
                        <div
                          class="cart-option">

                          <span>
                            Size:
                            ${escapeHtml(
                              item.selectedSize
                            )}
                          </span>

                        </div>
                      `
                      : ""
                  }

                  ${
                    item.photoCount ||
                    item.customized
                      ? `
                        <div
                          class="custom-cart-details">

                          <strong>

                            ${
                              item.photoCount
                                ? `${item.photoCount} Photos`
                                : item.keychainType ===
                                  "Photo Keychains"
                                  ? "Photo Keychain"
                                  : "Name Keychain"
                            }

                          </strong>

                          <span>

                            ${
                              escapeHtml(
                                item.frameColor ||
                                  item.selectedColor ||
                                  item.color ||
                                  ""
                              )
                            }

                            ${
                              item.frameSize
                                ? ` · ${escapeHtml(
                                    item.frameSize
                                  )}`
                                : ""
                            }

                          </span>

                          ${
                            item.customerName
                              ? `
                                <span>
                                  Name:
                                  ${escapeHtml(
                                    item.customerName
                                  )}
                                </span>
                              `
                              : ""
                          }

                          ${
                            item.uploadedPhotos?.length
                              ? `
                                <div
                                  class="cart-photo-previews">

                                  ${
                                    item.uploadedPhotos
                                      .map(
                                        photo =>
                                          `
                                            <img
                                              src="${photo.dataUrl}"
                                              alt="Uploaded photo preview">
                                          `
                                      )
                                      .join("")
                                  }

                                </div>
                              `
                              : ""
                          }

                        </div>
                      `
                      : ""
                  }

                  <strong>
                    ${money(
                      item.price
                    )}
                  </strong>

                  <div
                    class="mini-qty">

                    <button
                      onclick='changeQuantity(${JSON.stringify(
                        String(
                          item.cartItemKey ||
                            item.id
                        )
                      )},-1)'>

                      −

                    </button>

                    <span>
                      ${item.quantity}
                    </span>

                    <button
                      onclick='changeQuantity(${JSON.stringify(
                        String(
                          item.cartItemKey ||
                            item.id
                        )
                      )},1)'>

                      +

                    </button>

                  </div>

                </div>

                <strong>
                  ${money(
                    item.price *
                      item.quantity
                  )}
                </strong>

                <button
                  class="remove"
                  onclick='removeFromCart(${JSON.stringify(
                    String(
                      item.cartItemKey ||
                        item.id
                    )
                  )})'>

                  ×

                </button>

              </div>

            `
          )
          .join("")}

      </div>

      <aside class="summary">

        <h2>
          Order Summary
        </h2>

        <div>

          <span>
            Subtotal
          </span>

          <strong>
            ${money(
              subtotal
            )}
          </strong>

        </div>

        <div>

          <span>
            Delivery
          </span>

          <strong>
            ${
              delivery
                ? money(
                    delivery
                  )
                : "FREE"
            }
          </strong>

        </div>

        <hr>

        <div class="total">

          <span>
            Total
          </span>

          <strong>
            ${money(total)}
          </strong>

        </div>

        <a
          class="btn btn-primary full"
          href="checkout.html">

          Proceed to Checkout

        </a>

        <p class="form-note">

          Payment is handled through
          WhatsApp in your planned workflow.

        </p>

      </aside>

    </div>
  `;
}

function renderCheckoutPage() {

  renderHeader();
  renderFooter();
  updateHeaderCounts();

  const cart =
    getCart();

  const container =
    document.getElementById(
      "checkout-page"
    );

  if (!cart.length) {

    container.innerHTML = `
      <div class="empty">

        <h2>
          Your cart is empty
        </h2>

        <a
          class="btn btn-primary"
          href="shop.html">

          Shop Products

        </a>

      </div>
    `;

    return;
  }

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const delivery =
    subtotal >= 999
      ? 0
      : 50;

  const total =
    subtotal +
    delivery;

  container.innerHTML = `
    <div class="checkout-layout">

      <form
        id="order-form"
        class="form-card">

        <h2>
          Customer Details
        </h2>

        <label>
          Full Name
          <input
            name="name"
            required>
        </label>

        <label>
          Mobile Number
          <input
            name="mobile"
            required
            type="tel">
        </label>

        <label>
          Email
          <input
            name="email"
            type="email">
        </label>

        <label>
          Address
          <textarea
            name="address"
            required
            rows="4">
          </textarea>
        </label>

        <label>
          City
          <input
            name="city"
            required>
        </label>

        <div class="two-col">

          <label>
            State
            <input
              name="state"
              required>
          </label>

          <label>
            PIN Code
            <input
              name="pin"
              required
              inputmode="numeric">
          </label>

        </div>

        <button
          class="btn btn-primary full"
          type="submit">

          Place Order &
          Continue on WhatsApp

        </button>

        <p class="form-note">

          You will receive payment
          instructions from the client
          after the order is sent.

        </p>

      </form>

      <aside class="summary">

        <h2>
          Your Order
        </h2>

        ${cart
          .map(
            item => `
              <div>

                <span>

                  ${escapeHtml(
                    item.name
                  )}

                  ${
                    item.selectedColor
                      ? ` · Color: ${escapeHtml(
                          item.selectedColor
                        )}`
                      : ""
                  }

                  ${
                    item.selectedSize
                      ? ` · Size: ${escapeHtml(
                          item.selectedSize
                        )}`
                      : ""
                  }

                  ${
                    item.photoCount
                      ? ` · ${item.photoCount} Photos`
                      : ""
                  }

                  ×
                  ${item.quantity}

                </span>

                <strong>
                  ${money(
                    item.price *
                      item.quantity
                  )}
                </strong>

              </div>
            `
          )
          .join("")}

        <hr>

        <div>

          <span>
            Subtotal
          </span>

          <strong>
            ${money(
              subtotal
            )}
          </strong>

        </div>

        <div>

          <span>
            Delivery
          </span>

          <strong>
            ${
              delivery
                ? money(
                    delivery
                  )
                : "FREE"
            }
          </strong>

        </div>

        <div class="total">

          <span>
            Total
          </span>

          <strong>
            ${money(total)}
          </strong>

        </div>

      </aside>

    </div>
  `;

  document
    .getElementById(
      "order-form"
    )
    .addEventListener(
      "submit",
      e => {

        e.preventDefault();

        const data =
          Object.fromEntries(
            new FormData(
              e.target
            ).entries()
          );

        const orderId =
          "HM" +
          Math.floor(
            100000 +
              Math.random() *
                900000
          );

        const order = {

          orderId,

          ...data,

          items:
            cart,

          subtotal,

          delivery,

          total,

          status:
            "Order Placed",

          createdAt:
            new Date()
              .toISOString()

        };

        const orders =
          JSON.parse(
            localStorage.getItem(
              "handmade_orders"
            ) ||
              "[]"
          );

        orders.push(
          order
        );

        localStorage.setItem(
          "handmade_orders",
          JSON.stringify(
            orders
          )
        );

        const lines = [

          `Hello, I want to place an order.`,

          ``,

          `Order ID: ${orderId}`,

          `Name: ${data.name}`,

          `Mobile: ${data.mobile}`,

          `Address: ${data.address}, ${data.city}, ${data.state} - ${data.pin}`,

          ``,

          `Items:`,

          ...cart.flatMap(
            item =>
              item.photoCount

                ? [

                    `- ${item.name} x ${item.quantity} = ${money(
                      item.price *
                        item.quantity
                    )}`,

                    `  Number of Photos: ${item.photoCount}`,

                    `  Frame Size: ${
                      item.frameSize ||
                      "-"
                    }`,

                    `  Frame Color: ${
                      item.frameColor ||
                      item.selectedColor ||
                      item.color ||
                      "-"
                    }`,

                    ...(item.selectedSize
                      ? [
                          `  Product Size: ${item.selectedSize}`
                        ]
                      : []),

                    `  Customer Name: ${
                      item.customerName ||
                      "-"
                    }`,

                    `  Message: ${
                      item.customMessage ||
                      "-"
                    }`,

                    `  Special Instructions: ${
                      item.specialInstructions ||
                      "-"
                    }`,

                    `  Photo previews: saved in this browser prototype; image transfer requires a backend.`

                  ]

                : item.customized &&
                  item.keychainType

                  ? [

                      `- ${item.name} x ${item.quantity} = ${money(
                        item.price *
                          item.quantity
                      )}`,

                      `  Product: ${item.name.replace(
                        "Customized ",
                        ""
                      )}`,

                      `  Keychain Type: ${
                        item.keychainType
                      }`,

                      `  Price: ${money(
                        item.price
                      )}`,

                      `  Customer Name: ${
                        item.customerName ||
                        "-"
                      }`,

                      `  Color: ${
                        item.frameColor ||
                        item.selectedColor ||
                        item.color ||
                        "-"
                      }`,

                      ...(item.selectedSize
                        ? [
                            `  Size: ${item.selectedSize}`
                          ]
                        : []),

                      `  Custom Message: ${
                        item.customMessage ||
                        "-"
                      }`,

                      `  Special Instructions: ${
                        item.specialInstructions ||
                        "-"
                      }`,

                      `  Photo preview: saved in this browser prototype; image transfer requires a backend.`

                    ]

                  : [

                      `- ${item.name} x ${item.quantity} = ${money(
                        item.price *
                          item.quantity
                      )}`,

                      ...(item.selectedColor
                        ? [
                            `  Color: ${item.selectedColor}`
                          ]
                        : []),

                      ...(item.selectedSize
                        ? [
                            `  Size: ${item.selectedSize}`
                          ]
                        : [])

                    ]
          ),

          ``,

          `Total: ${money(
            total
          )}`,

          ``,

          `Please share the payment QR/details.`

        ];

        const waUrl =
          `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(
            lines.join(
              "\n"
            )
          )}`;

        localStorage.removeItem(
          "handmade_cart"
        );

        location.href =
          waUrl;

      }
    );
}

function initContactForm() {

  renderHeader();
  renderFooter();
  updateHeaderCounts();

  document
    .getElementById(
      "custom-form"
    )
    .addEventListener(
      "submit",
      e => {

        e.preventDefault();

        const data =
          Object.fromEntries(
            new FormData(
              e.target
            ).entries()
          );

        const message = [

          "Hello, I have a customization idea.",

          "",

          `Name: ${data.name}`,

          `Mobile: ${data.mobile}`,

          `Email: ${
            data.email ||
            "-"
          }`,

          "",

          `Message:`,

          data.message

        ].join("\n");

        location.href =
          `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(
            message
          )}`;

      }
    );
}

function initTrackOrder() {

  renderHeader();
  renderFooter();
  updateHeaderCounts();

  document
    .getElementById(
      "track-form"
    )
    .addEventListener(
      "submit",
      e => {

        e.preventDefault();

        const orderId =
          document
            .getElementById(
              "track-order-id"
            )
            .value
            .trim()
            .toUpperCase();

        const mobile =
          document
            .getElementById(
              "track-mobile"
            )
            .value
            .trim();

        const orders =
          JSON.parse(
            localStorage.getItem(
              "handmade_orders"
            ) ||
              "[]"
          );

        const order =
          orders.find(
            o =>
              o.orderId.toUpperCase() ===
                orderId &&
              o.mobile ===
                mobile
          );

        const result =
          document.getElementById(
            "track-result"
          );

        if (!order) {

          result.innerHTML = `
            <div class="track-error">

              Order not found in this browser.
              In the final version, tracking
              will use the backend database.

            </div>
          `;

          return;
        }

        result.innerHTML = `

          <div class="order-status">

            <div class="order-top">

              <div>

                <small>
                  ORDER ID
                </small>

                <h2>
                  ${order.orderId}
                </h2>

              </div>

              <span
                class="status-pill">

                ${escapeHtml(
                  order.status
                )}

              </span>

            </div>

            <div class="timeline">

              ${timelineItem(
                "Order Placed",
                true,
                "Your order has been received."
              )}

              ${timelineItem(
                "Payment Confirmed",
                order.status !==
                  "Order Placed",
                "Payment will be marked confirmed after verification."
              )}

              ${timelineItem(
                "Processing",
                [
                  "Processing",
                  "Shipped",
                  "Out for Delivery",
                  "Delivered"
                ].includes(
                  order.status
                ),
                "Your handmade order is being prepared."
              )}

              ${timelineItem(
                "Shipped",
                [
                  "Shipped",
                  "Out for Delivery",
                  "Delivered"
                ].includes(
                  order.status
                ),
                "Your order has been shipped."
              )}

              ${timelineItem(
                "Delivered",
                order.status ===
                  "Delivered",
                "Order delivered."
              )}

            </div>

          </div>

        `;
      }
    );
}

function timelineItem(
  title,
  done,
  text
) {

  return `
    <div
      class="timeline-item ${
        done
          ? "done"
          : ""
      }">

      <span>
        ${
          done
            ? "✓"
            : "○"
        }
      </span>

      <div>

        <h3>
          ${title}
        </h3>

        <p>
          ${text}
        </p>

      </div>

    </div>
  `;
}

function toast(message) {

  let el =
    document.getElementById(
      "toast"
    );

  if (!el) {

    el =
      document.createElement(
        "div"
      );

    el.id =
      "toast";

    document.body.appendChild(
      el
    );
  }

  el.textContent =
    message;

  el.classList.add(
    "show"
  );

  setTimeout(
    () =>
      el.classList.remove(
        "show"
      ),
    1800
  );
}

function escapeHtml(
  value
) {

  return String(
    value
  ).replace(
    /[&<>"']/g,
    char =>
      ({
        "&":
          "&amp;",
        "<":
          "&lt;",
        ">":
          "&gt;",
        '"':
          "&quot;",
        "'":
          "&#039;"
      }[char])
  );
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (
      !document.getElementById(
        "site-header"
      )?.innerHTML
    ) {

      renderHeader();
      renderFooter();
      updateHeaderCounts();

    }

  }
);