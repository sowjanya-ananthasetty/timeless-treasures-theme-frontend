function renderShop() {
  const params = new URLSearchParams(location.search);
  const search = (params.get("search") || "").toLowerCase();
  const categoryFilter = document.getElementById("category-filter");
  const sort = document.getElementById("sort-products");

  categoryFilter.innerHTML = `<option value="">All Categories</option>` +
    CATEGORIES.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  function draw() {
    let items = productStore.getProducts({activeOnly: true}).filter(p => {
      const matchesSearch = !search || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(search);
      const matchesCategory = !categoryFilter.value || p.category === categoryFilter.value;
      return matchesSearch && matchesCategory;
    });

    if (sort.value === "low") items.sort((a,b) => a.price-b.price);
    if (sort.value === "high") items.sort((a,b) => b.price-a.price);
    if (sort.value === "name") items.sort((a,b) => a.name.localeCompare(b.name));

    document.getElementById("shop-title").textContent = search ? `Search: ${search}` : "Shop All";
    document.getElementById("shop-count").textContent = `${items.length} product${items.length !== 1 ? "s" : ""} available`;

    document.getElementById("shop-products").innerHTML = items.length
      ? items.map(productCard).join("")
      : `<div class="empty"><h2>No products found</h2><p>Try another search or category.</p></div>`;
  }

  categoryFilter.addEventListener("change", draw);
  sort.addEventListener("change", draw);
  draw();
}

renderShop();
