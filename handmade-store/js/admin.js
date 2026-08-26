const ADMIN_SESSION_KEY = "timeless_treasures_admin_session";
const SETTINGS_KEY = "timeless_treasures_settings";

const categories = [
  "Rakhis",
  "Earrings - Beads",
  "Earrings - Thread",
  "Keychains",
  "Frames",
  "Necklaces",
  "Bangles",
  "Bracelets",
  "Hair Bands"
];

/* =========================================================
   ADMIN ACCESS
========================================================= */

if (localStorage.getItem(ADMIN_SESSION_KEY) !== "active") {
  location.replace("admin-login.html");
}

/* =========================================================
   HELPERS
========================================================= */

const $ = selector => document.querySelector(selector);

const showToast = message => {
  const toast = $("#admin-toast");

  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;

  setTimeout(() => {
    toast.hidden = true;
  }, 2200);
};

const escapeValue = value => {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

/*
  Convert comma-separated input into an array.

  Example:
  "Gold, Black, Red"

  becomes:

  ["Gold", "Black", "Red"]
*/
function readList(value) {
  if (!value) return [];

  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

/* =========================================================
   NAVIGATION
========================================================= */

function showSection(name) {
  document
    .querySelectorAll(".admin-section")
    .forEach(section => {
      section.classList.toggle(
        "active",
        section.id === `${name}-section`
      );
    });

  document
    .querySelectorAll(".admin-nav button[data-section]")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.section === name
      );
    });

  if (name === "dashboard") {
    renderStats();
  }

  if (name === "products") {
    renderProducts();
  }

  if (name === "orders") {
    renderOrders();
  }

  if (name === "settings") {
    loadSettings();
  }
}

document
  .querySelectorAll("[data-section]")
  .forEach(button => {
    button.addEventListener("click", () => {
      showSection(button.dataset.section);
    });
  });

/* =========================================================
   LOGOUT
========================================================= */

$("#logout")?.addEventListener("click", () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  location.replace("admin-login.html");
});

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function renderStats() {
  const products = productStore.getProducts();

  $("#stat-total").textContent = products.length;

  $("#stat-active").textContent =
    products.filter(product => product.active).length;

  $("#stat-out").textContent =
    products.filter(product => product.stockQuantity <= 0).length;

  $("#stat-featured").textContent =
    products.filter(product => product.featured).length;
}

/* =========================================================
   PRODUCT LIST
========================================================= */

function renderProducts() {
  const filter = $("#product-category-filter");

  if (!filter) return;

  const selected = filter.value;

  filter.innerHTML = `
    <option value="">All categories</option>
    ${categories
      .map(category => `
        <option value="${escapeValue(category)}">
          ${escapeValue(category)}
        </option>
      `)
      .join("")}
  `;

  filter.value = selected;

  let products = productStore.getProducts();

  const search =
    $("#product-search")?.value.trim().toLowerCase() || "";

  if (search) {
    products = products.filter(product =>
      `${product.name} ${product.category} ${product.description || ""}`
        .toLowerCase()
        .includes(search)
    );
  }

  if (filter.value) {
    products = products.filter(
      product => product.category === filter.value
    );
  }

  if ($("#product-stock-filter")?.value === "in") {
    products = products.filter(
      product => product.stockQuantity > 0
    );
  }

  if ($("#product-stock-filter")?.value === "out") {
    products = products.filter(
      product => product.stockQuantity <= 0
    );
  }

  const sort = $("#product-sort")?.value;

  products.sort((a, b) => {
    if (sort === "price-low") {
      return Number(a.price) - Number(b.price);
    }

    if (sort === "price-high") {
      return Number(b.price) - Number(a.price);
    }

    return a.name.localeCompare(b.name);
  });

  const container = $("#products-table");

  if (!container) return;

  container.innerHTML = products.length
    ? `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Active</th>
            <th>Featured</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${products.map(product => `
            <tr class="product-row">

              <td>
                <div class="product-thumbnail">
                  <img
                    src="${escapeValue(product.image)}"
                    alt="${escapeValue(product.name)}"
                    loading="lazy"
                  >
                </div>
              </td>

              <td>
                <span class="product-name" title="${escapeValue(product.name)}">
                  ${escapeValue(product.name)}
                </span>
              </td>

              <td>
                ${escapeValue(product.category)}
              </td>

              <td>
                ₹${Number(product.price).toLocaleString("en-IN")}
              </td>

              <td>
                <span class="status ${
                  product.stockQuantity > 0
                    ? "good"
                    : "bad"
                }">
                  ${
                    product.stockQuantity > 0
                      ? `${product.stockQuantity} in stock`
                      : "Out of stock"
                  }
                </span>
              </td>

              <td>
                ${product.active ? "Yes" : "No"}
              </td>

              <td>
                ${product.featured ? "Yes" : "No"}
              </td>

              <td class="row-actions">

                <button
                  class="admin-button"
                  data-edit="${product.id}">
                  Edit
                </button>

                <button
                  class="admin-button danger"
                  data-delete="${product.id}">
                  Delete
                </button>

              </td>

            </tr>
          `).join("")}
        </tbody>
      </table>
    `
    : `
      <p class="empty-admin">
        No products match these filters.
      </p>
    `;

  document
    .querySelectorAll("[data-edit]")
    .forEach(button => {
      button.addEventListener("click", () => {
        openProductForm(
          Number(button.dataset.edit)
        );
      });
    });

  document
    .querySelectorAll("[data-delete]")
    .forEach(button => {
      button.addEventListener("click", () => {
        deleteProduct(
          Number(button.dataset.delete)
        );
      });
    });
}

/* =========================================================
   PRODUCT SEARCH / FILTERS
========================================================= */

[
  "#product-search",
  "#product-category-filter",
  "#product-stock-filter",
  "#product-sort"
].forEach(selector => {
  $(selector)?.addEventListener("input", renderProducts);
});

/* =========================================================
   CATEGORY-SPECIFIC PRODUCT FIELDS
========================================================= */

/*
  These categories can have multiple colors.
*/
const colorCategories = [
  "Rakhis",
  "Earrings - Beads",
  "Earrings - Thread",
  "Necklaces",
  "Bracelets",
  "Hair Bands"
];

/*
  These categories can have sizes.
*/
const sizeCategories = [
  "Bangles"
];

/*
  Generate the extra fields shown in
  Admin → Add Product / Edit Product.
*/
function categoryFields(category, product = {}) {

  /* -------------------------------------------------------
     KEYCHAINS
  ------------------------------------------------------- */

  if (category === "Keychains") {

    return `
      <div class="form-grid">

        <label>
          Keychain Type

          <select name="keychainType">

            <option
              value="Photo Keychains"
              ${
                product.keychainType === "Photo Keychains"
                  ? "selected"
                  : ""
              }>
              Photo Keychains
            </option>

            <option
              value="Name Keychains"
              ${
                product.keychainType === "Name Keychains"
                  ? "selected"
                  : ""
              }>
              Name Keychains
            </option>

          </select>
        </label>

        <label>
          Available Colors

          <input
            name="availableColors"
            value="${escapeValue(
              (product.availableColors || []).join(", ")
            )}"
            placeholder="Gold, Black, Red"
          >

          <small>
            Separate colors with commas.
          </small>
        </label>

      </div>
    `;
  }

  /* -------------------------------------------------------
     FRAMES
  ------------------------------------------------------- */

  if (category === "Frames") {

    return `
      <div class="form-grid">

        <label>
          Frame Style

          <input
            name="frameStyle"
            value="${escapeValue(
              product.frameStyle || ""
            )}"
            placeholder="Floral, Classic, Heart..."
          >
        </label>

        <label>
          Frame Size

          <input
            name="frameSize"
            value="${escapeValue(
              product.frameSize || ""
            )}"
            placeholder="8 × 10 inch"
          >
        </label>

        <label>
          Photo Capacity

          <input
            name="photoCapacity"
            value="${escapeValue(
              (product.photoCapacity || []).join(", ")
            )}"
            placeholder="1, 2, 4"
          >

          <small>
            Example: 1, 2, 4, 6
          </small>
        </label>

      </div>
    `;
  }

  /* -------------------------------------------------------
     BANGLES
  ------------------------------------------------------- */

  if (category === "Bangles") {

    return `
      <div class="form-grid">

        <label>
          Available Sizes

          <input
            name="sizes"
            value="${escapeValue(
              (product.sizes || []).join(", ")
            )}"
            placeholder="2.2, 2.4, 2.6"
          >

          <small>
            Separate sizes with commas.
          </small>
        </label>

        <label>
          Available Colors

          <input
            name="availableColors"
            value="${escapeValue(
              (product.availableColors || []).join(", ")
            )}"
            placeholder="Gold, Black, Red"
          >

          <small>
            Separate colors with commas.
          </small>
        </label>

      </div>
    `;
  }

  /* -------------------------------------------------------
     OTHER PRODUCTS THAT CAN HAVE COLORS
  ------------------------------------------------------- */

  if (colorCategories.includes(category)) {

    return `
      <div class="form-grid">

        <label>
          Available Colors

          <input
            name="availableColors"
            value="${escapeValue(
              (product.availableColors || []).join(", ")
            )}"
            placeholder="Gold, Black, Red"
          >

          <small>
            Separate colors with commas.
          </small>
        </label>

      </div>
    `;
  }

  return "";
}

/* =========================================================
   CATEGORY FIELD RENDERING
========================================================= */

function populateCategoryFields(product = {}) {

  const category =
    $("#form-category")?.value || "";

  const container =
    $("#category-fields");

  if (!container) return;

  container.innerHTML =
    categoryFields(category, product);
}

/* =========================================================
   CATEGORY SELECT
========================================================= */

if ($("#form-category")) {

  $("#form-category").innerHTML =
    categories
      .map(category => `
        <option value="${escapeValue(category)}">
          ${escapeValue(category)}
        </option>
      `)
      .join("");

  $("#form-category").addEventListener(
    "change",
    () => {
      populateCategoryFields();
    }
  );
}

/* =========================================================
   OPEN ADD / EDIT PRODUCT FORM
========================================================= */

function openProductForm(id) {

  const form = $("#product-form");

  if (!form) return;

  const product =
    id
      ? productStore.getProductById(id)
      : {};

  form.reset();

  form.id.value =
    product.id || "";

  form.name.value =
    product.name || "";

  form.category.value =
    product.category || categories[0];

  form.price.value =
    product.price || "";

  form.stockQuantity.value =
    product.stockQuantity ??
    (product.stock === false ? 0 : "");

  form.description.value =
    product.description || "";

  form.color.value =
    product.color || "";

  form.material.value =
    product.material || "";

  form.active.checked =
    product.active !== false;

  form.featured.checked =
    product.featured === true;

  form.customizable.checked =
    product.customizable === true;

  $("#form-title").textContent =
    id ? "Edit Product" : "Add Product";

  populateCategoryFields(product);

  showSection("product-form");
}

/* =========================================================
   ADD / CANCEL PRODUCT
========================================================= */

$("#add-product")?.addEventListener(
  "click",
  () => openProductForm()
);

$("#cancel-product")?.addEventListener(
  "click",
  () => showSection("products")
);

/* =========================================================
   IMAGE PROCESSING
========================================================= */

function readImage(file) {

  if (!file) {
    return Promise.resolve(null);
  }

  if (!file.type.startsWith("image/")) {
    return Promise.reject(
      new Error("Please select an image file.")
    );
  }

  if (file.size > 3 * 1024 * 1024) {
    return Promise.reject(
      new Error(
        "Each source image must be under 3 MB."
      )
    );
  }

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const image = new Image();

      image.onload = () => {

        const scale =
          Math.min(
            1,
            1200 / image.width,
            1200 / image.height
          );

        const canvas =
          document.createElement("canvas");

        canvas.width =
          Math.max(
            1,
            image.width * scale
          );

        canvas.height =
          Math.max(
            1,
            image.height * scale
          );

        const context =
          canvas.getContext("2d");

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const result =
          canvas.toDataURL(
            "image/jpeg",
            0.78
          );

        if (result.length > 700000) {

          reject(
            new Error(
              "The image is too large after compression."
            )
          );

          return;
        }

        resolve(result);
      };

      image.onerror = () => {
        reject(
          new Error(
            "That image could not be read."
          )
        );
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      reject(
        new Error(
          "That image could not be read."
        )
      );
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   PRODUCT FORM SUBMISSION
========================================================= */

$("#product-form")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const form = event.target;

    const data =
      Object.fromEntries(
        new FormData(form).entries()
      );

    const error =
      $("#product-form-error");

    error.textContent = "";

    const price =
      Number(data.price);

    const stockQuantity =
      Number(data.stockQuantity);

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (
      !data.name ||
      !data.name.trim() ||
      !data.category
    ) {

      error.textContent =
        "Product name and category are required.";

      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {

      error.textContent =
        "Enter a valid price.";

      return;
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {

      error.textContent =
        "Stock must be a whole number of zero or more.";

      return;
    }

    try {

      /* ---------------------------------------------------
         CURRENT PRODUCT
      --------------------------------------------------- */

      const current =
        data.id
          ? productStore.getProductById(
              Number(data.id)
            )
          : {};

      /* ---------------------------------------------------
         IMAGES
      --------------------------------------------------- */

      const primaryImage =
        await readImage(
          form.primaryImage?.files?.[0]
        ) || current.image;

      const extraImages =
        await Promise.all(
          [
            ...(form.additionalImages?.files || [])
          ].map(readImage)
        );

      if (!primaryImage) {

        error.textContent =
          "A primary image is required.";

        return;
      }

      /* ---------------------------------------------------
         BASE PRODUCT
      --------------------------------------------------- */

      const product = {

        ...current,

        id:
          data.id
            ? Number(data.id)
            : productStore.nextId(),

        name:
          data.name.trim(),

        category:
          data.category,

        price,

        stockQuantity,

        stock:
          stockQuantity > 0,

        description:
          data.description?.trim() || "",

        color:
          data.color?.trim() || "",

        material:
          data.material?.trim() || "",

        image:
          primaryImage,

        /*
          If editing and no new additional images
          were selected, preserve existing images.
        */
        images:
          extraImages.length
            ? [
                primaryImage,
                ...extraImages.filter(Boolean)
              ]
            : (
                current.images?.length
                  ? current.images
                  : [primaryImage]
              ),

        active:
          form.active.checked,

        featured:
          form.featured.checked,

        customizable:
          form.customizable.checked
      };

      /* ---------------------------------------------------
         KEYCHAINS
      --------------------------------------------------- */

      if (data.category === "Keychains") {

        product.keychainType =
          data.keychainType || "Name Keychains";

        product.availableColors =
          readList(
            data.availableColors || ""
          );
      }

      /* ---------------------------------------------------
         FRAMES
      --------------------------------------------------- */

      if (data.category === "Frames") {

        product.frameStyle =
          data.frameStyle?.trim() || "";

        product.frameSize =
          data.frameSize?.trim() || "";

        product.photoCapacity =
          readList(
            data.photoCapacity || ""
          )
            .map(Number)
            .filter(Number.isFinite);
      }

      /* ---------------------------------------------------
         BANGLES
      --------------------------------------------------- */

      if (data.category === "Bangles") {

        product.sizes =
          readList(
            data.sizes || ""
          );

        product.availableColors =
          readList(
            data.availableColors || ""
          );
      }

      /* ---------------------------------------------------
         OTHER COLOR-BASED CATEGORIES
      --------------------------------------------------- */

      if (
        colorCategories.includes(
          data.category
        )
      ) {

        product.availableColors =
          readList(
            data.availableColors || ""
          );
      }

      /* ---------------------------------------------------
         SAVE PRODUCT
      --------------------------------------------------- */

      if (data.id) {

        productStore.updateProduct(
          Number(data.id),
          product
        );

      } else {

        productStore.addProduct(
          product
        );
      }

      showToast(
        data.id
          ? "Product updated"
          : "Product added"
      );

      showSection("products");

    } catch (submissionError) {

      error.textContent =
        submissionError.message ||
        "Product could not be saved.";
    }
  }
);

/* =========================================================
   DELETE PRODUCT
========================================================= */

function deleteProduct(id) {

  if (
    !confirm(
      "Are you sure you want to delete this product?"
    )
  ) {
    return;
  }

  productStore.deleteProduct(id);

  showToast("Product deleted");

  renderProducts();
  renderStats();
}

/* =========================================================
   EXPORT PRODUCTS
========================================================= */

$("#export-products")?.addEventListener(
  "click",
  () => {

    const blob =
      new Blob(
        [
          JSON.stringify(
            productStore.getProducts(),
            null,
            2
          )
        ],
        {
          type: "application/json"
        }
      );

    const link =
      document.createElement("a");

    link.href =
      URL.createObjectURL(blob);

    link.download =
      "timeless-treasures-products.json";

    link.click();

    URL.revokeObjectURL(link.href);

    showToast(
      "Products exported successfully"
    );
  }
);

/* =========================================================
   IMPORT PRODUCTS
========================================================= */

$("#import-products")?.addEventListener(
  "change",
  async event => {

    const file =
      event.target.files[0];

    if (!file) return;

    try {

      const imported =
        JSON.parse(
          await file.text()
        );

      if (
        !Array.isArray(imported) ||
        !imported.length
      ) {

        throw new Error(
          "Import must be a non-empty array of products."
        );
      }

      const ids =
        imported.map(
          product => Number(product.id)
        );

      if (
        ids.some(
          id =>
            !Number.isInteger(id) ||
            id < 1
        )
      ) {

        throw new Error(
          "Every product must have a valid ID."
        );
      }

      if (
        new Set(ids).size !== ids.length
      ) {

        throw new Error(
          "Product IDs must be unique."
        );
      }

      if (
        imported.some(
          product =>
            !product.name ||
            !product.category ||
            !Number.isFinite(
              Number(product.price)
            )
        )
      ) {

        throw new Error(
          "Every product needs a unique ID, name, category, and valid price."
        );
      }

      productStore.saveProducts(
        imported
      );

      showToast(
        "Products imported successfully"
      );

      renderProducts();
      renderStats();

    } catch (importError) {

      alert(
        importError.message ||
        "The JSON file is invalid."
      );

    }

    event.target.value = "";
  }
);

/* =========================================================
   RESET PRODUCTS
========================================================= */

$("#reset-products")?.addEventListener(
  "click",
  () => {

    if (
      !confirm(
        "Reset to Original Products? This removes local product changes."
      )
    ) {
      return;
    }

    productStore.resetProducts();

    showToast(
      "Products reset"
    );

    renderProducts();
    renderStats();
  }
);

/* =========================================================
   ORDERS
========================================================= */

function renderOrders() {

  let orders = [];

  try {

    orders =
      JSON.parse(
        localStorage.getItem(
          "handmade_orders"
        ) || "[]"
      );

  } catch (_) {

    orders = [];
  }

  const statusOptions = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled"
  ];

  const container =
    $("#orders-list");

  if (!container) return;

  container.innerHTML =
    orders.length

      ? orders
          .map(
            (order, index) => `
              <div class="order-row">

                <div>
                  <strong>
                    ${escapeValue(order.orderId)}
                  </strong>

                  <small>
                    ${new Date(
                      order.createdAt
                    ).toLocaleString()}
                  </small>
                </div>

                <div>
                  ${escapeValue(order.name)}

                  <small>
                    ${escapeValue(order.mobile)}
                  </small>
                </div>

                <div>
                  ${(order.items || [])
                    .map(
                      item =>
                        `${escapeValue(
                          item.name
                        )} × ${item.quantity}`
                    )
                    .join(", ")}
                </div>

                <strong>
                  ₹${Number(
                    order.total || 0
                  ).toLocaleString("en-IN")}
                </strong>

                <select
                  data-order-status="${index}">
                  ${statusOptions
                    .map(
                      status => `
                        <option
                          ${
                            status ===
                            (
                              order.adminStatus ||
                              order.status
                            )
                              ? "selected"
                              : ""
                          }>
                          ${status}
                        </option>
                      `
                    )
                    .join("")}
                </select>

              </div>
            `
          )
          .join("")

      : `
        <p class="empty-admin">
          No local orders yet.
        </p>
      `;

  document
    .querySelectorAll(
      "[data-order-status]"
    )
    .forEach(select => {

      select.addEventListener(
        "change",
        event => {

          const current =
            JSON.parse(
              localStorage.getItem(
                "handmade_orders"
              ) || "[]"
            );

          const index =
            Number(
              event.target.dataset
                .orderStatus
            );

          if (!current[index]) return;

          current[index].status =
          event.target.value;
          
          current[index].adminStatus =
          event.target.value;

          localStorage.setItem(
            "handmade_orders",
            JSON.stringify(current)
          );

          showToast(
            "Order status saved"
          );
        }
      );
    });
}

/* =========================================================
   SETTINGS
========================================================= */

function loadSettings() {

  let settings = {};

  try {

    settings =
      JSON.parse(
        localStorage.getItem(
          SETTINGS_KEY
        ) || "{}"
      );

  } catch (_) {

    settings = {};
  }

  const form =
    $("#settings-form");

  if (!form) return;

  form.businessName.value =
    settings.businessName ||
    "Timeless Treasures";

  form.whatsapp.value =
    settings.whatsapp ||
    "917386780566";

  form.email.value =
    settings.email ||
    "";
}

$("#settings-form")?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const data =
      Object.fromEntries(
        new FormData(event.target)
          .entries()
      );

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(data)
    );

    const message =
      $("#settings-message");

    if (message) {
      message.textContent =
        "Settings saved in this browser.";
    }

    showToast(
      "Settings saved"
    );
  }
);

/* =========================================================
   INITIAL LOAD
========================================================= */

renderStats();
renderProducts();