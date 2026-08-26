/*
 * DEVELOPMENT ONLY:
 * This frontend admin authentication is not secure for production.
 * Before deploying a real store, replace this with server-side authentication,
 * authorization and a database.
 */
(function () {
  const STORAGE_KEY = "timeless_treasures_products";
  const CATALOG_VERSION_KEY = "timeless_treasures_catalog_version";
  const CATALOG_VERSION = "2026-08-26-106-products-v4";
  const NEXT_ID_KEY = "timeless_treasures_next_product_id";

  function normalize(product) {
    const item = {...product};
    item.id = Number(item.id);
    item.price = Number(item.price) || 0;
    item.stockQuantity = Number.isFinite(Number(item.stockQuantity))
      ? Math.max(0, Number(item.stockQuantity))
      : item.stock === false ? 0 : 1;
    item.stock = item.stockQuantity > 0;
    item.active = item.active !== false;
    item.featured = item.featured === true;
    item.images = Array.isArray(item.images) ? item.images : item.image ? [item.image] : [];
    item.image = item.image || item.images[0] || "images/logo.png";
    return item;
  }

  function readStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Product storage is not an array");
      return parsed.map(normalize);
    } catch (error) {
      console.warn("Product storage could not be read; restoring original products.", error);
      return null;
    }
  }

  function write(products) {
    const normalized = products.map(normalize);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    PRODUCTS.splice(0, PRODUCTS.length, ...normalized);
    return normalized;
  }

  function initialize() {
    const stored = readStored();
    const storedVersion = localStorage.getItem(CATALOG_VERSION_KEY);
    const sourceProducts = PRODUCTS.map((product, index) => ({...product, featured: index < 8}));

    if (stored && storedVersion === CATALOG_VERSION) return write(stored);

    localStorage.setItem(CATALOG_VERSION_KEY, CATALOG_VERSION);
    return write(sourceProducts);
  }

  const initialProducts = initialize();
  const originalProducts = initialProducts.map(product => ({...product}));

  window.productStore = {
    key: STORAGE_KEY,
    getProducts(options = {}) {
      const products = readStored() || initialProducts;
      if (options.activeOnly) return products.filter(product => product.active);
      return products;
    },
    getProductById(id) {
      return this.getProducts().find(product => product.id === Number(id));
    },
    saveProducts: write,
    addProduct(product) {
      const products = this.getProducts();
      if (products.some(item => item.id === Number(product.id))) throw new Error("Product ID already exists.");
      write([...products, product]);
      return this.getProductById(product.id);
    },
    updateProduct(id, product) {
      const products = this.getProducts();
      const index = products.findIndex(item => item.id === Number(id));
      if (index < 0) throw new Error("Product was not found.");
      products[index] = {...product, id: Number(id)};
      write(products);
      return products[index];
    },
    deleteProduct(id) {
      const products = this.getProducts().filter(product => product.id !== Number(id));
      write(products);
      return products;
    },
    resetProducts() {
      return write(originalProducts.map(product => ({...product})));
    },
    nextId() {
      const highest = this.getProducts().reduce((value, product) => Math.max(value, Number(product.id) || 0), 0);
      const next = Math.max(highest + 1, Number(localStorage.getItem(NEXT_ID_KEY)) || 1);
      localStorage.setItem(NEXT_ID_KEY, String(next + 1));
      return next;
    }
  };
}());
