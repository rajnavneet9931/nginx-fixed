/**
 * BareSober — Products Page
 */

(async function () {
  let currentPage = 1;
  let totalPages = 1;
  let currentFilters = {
    category: Utils.getUrlParam('category') || '',
    search: Utils.getUrlParam('search') || '',
    sortBy: Utils.getUrlParam('sortBy') || 'createdAt',
    order: Utils.getUrlParam('order') || 'desc',
    minPrice: Utils.getUrlParam('minPrice') || '',
    maxPrice: Utils.getUrlParam('maxPrice') || '',
    skinType: Utils.getUrlParam('skinType') || '',
    inStock: Utils.getUrlParam('inStock') || '',
  };

  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('product-count');
  const paginationEl = document.getElementById('pagination');
  const loadingEl = document.getElementById('products-loading');

  const buildQueryString = () => {
    const params = new URLSearchParams({ page: currentPage, limit: 12 });
    Object.entries(currentFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params.toString();
  };

  const renderProducts = async () => {
    if (loadingEl) loadingEl.style.display = 'flex';
    if (grid) grid.innerHTML = '';

    try {
      const { products, total, totalPages: tp } = await API.Products.getAll(buildQueryString());
      totalPages = tp;

      if (countEl) countEl.textContent = `${total} Products`;

      if (!products.length) {
        if (grid) grid.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state-icon">🌿</div>
            <h3>No Products Found</h3>
            <p>Try adjusting your filters or search term.</p>
          </div>`;
        return;
      }

      if (grid) grid.innerHTML = products.map(p => Utils.renderProductCard(p)).join('');
      renderPagination();
    } catch (err) {
      Toast.error('Failed to load products');
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  };

  const renderPagination = () => {
    if (!paginationEl || totalPages <= 1) return;
    let html = '';
    if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage - 1}">‹</button>`;
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      html += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (currentPage < totalPages) html += `<button class="page-btn" data-page="${currentPage + 1}">›</button>`;
    paginationEl.innerHTML = html;

    paginationEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.page-btn');
      if (btn) { currentPage = parseInt(btn.dataset.page); renderProducts(); }
    });
  };

  const initFilters = () => {
    // Category filters
    document.querySelectorAll('[data-filter-category]').forEach(el => {
      if (el.dataset.filterCategory === currentFilters.category) el.classList.add('active');
      el.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-category]').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        currentFilters.category = el.dataset.filterCategory;
        currentPage = 1;
        Utils.setUrlParam('category', currentFilters.category);
        renderProducts();
      });
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.value = currentFilters.sortBy;
      sortSelect.addEventListener('change', () => {
        const [sortBy, order] = sortSelect.value.split('-');
        currentFilters.sortBy = sortBy;
        currentFilters.order = order || 'desc';
        currentPage = 1;
        renderProducts();
      });
    }

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = currentFilters.search;
      searchInput.addEventListener('input', Utils.debounce(() => {
        currentFilters.search = searchInput.value.trim();
        currentPage = 1;
        renderProducts();
      }, 500));
    }

    // Price range
    const applyPriceBtn = document.getElementById('apply-price');
    if (applyPriceBtn) {
      applyPriceBtn.addEventListener('click', () => {
        currentFilters.minPrice = document.getElementById('min-price')?.value || '';
        currentFilters.maxPrice = document.getElementById('max-price')?.value || '';
        currentPage = 1;
        renderProducts();
      });
    }

    // In stock filter
    const inStockCb = document.getElementById('in-stock-filter');
    if (inStockCb) {
      inStockCb.addEventListener('change', () => {
        currentFilters.inStock = inStockCb.checked ? 'true' : '';
        currentPage = 1;
        renderProducts();
      });
    }

    // Skin type checkboxes
    document.querySelectorAll('[data-skin-type]').forEach(cb => {
      cb.addEventListener('change', () => {
        const selected = [...document.querySelectorAll('[data-skin-type]:checked')].map(x => x.value);
        currentFilters.skinType = selected.join(',');
        currentPage = 1;
        renderProducts();
      });
    });

    // Clear filters
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        currentFilters = { category: '', search: '', sortBy: 'createdAt', order: 'desc', minPrice: '', maxPrice: '', skinType: '', inStock: '' };
        document.querySelectorAll('[data-filter-category]').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('[data-skin-type]').forEach(cb => cb.checked = false);
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'createdAt';
        if (inStockCb) inStockCb.checked = false;
        currentPage = 1;
        renderProducts();
      });
    }
  };

  initFilters();
  await renderProducts();
})();
