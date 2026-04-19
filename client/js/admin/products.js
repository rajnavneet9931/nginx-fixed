/**
 * BareSober — Admin: Products Management
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!BSAuth.isAdmin()) { window.location.href = '/auth.html'; return; }
  document.getElementById('admin-logout-btn').addEventListener('click', () => BSAuth.logout());

  let currentPage = 1;
  let editingId = null;
  let selectedFiles = [];

  const load = async () => {
    const search = document.getElementById('product-search')?.value || '';
    const category = document.getElementById('category-filter')?.value || '';
    const params = new URLSearchParams({ page: currentPage, limit: 15 });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    // admin sees inactive too — override
    params.set('isActive', '');

    try {
      const { products, total, totalPages } = await API.Products.getAll(params.toString());
      document.getElementById('products-tbody').innerHTML = products.map(p => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <img class="table-product-img" src="${p.images?.[0]||'/img/placeholder.jpg'}" onerror="this.style.background='var(--admin-bg)'">
              <div>
                <div style="font-weight:600;font-size:.875rem">${p.name}</div>
                <div style="font-size:.75rem;color:var(--admin-muted)">${p.volume||p.weight||''}</div>
              </div>
            </div>
          </td>
          <td><span class="table-badge badge-gray">${p.category}</span></td>
          <td>
            <div style="font-weight:700">₹${(p.discountPrice||p.price).toLocaleString('en-IN')}</div>
            ${p.discountPrice ? `<div style="font-size:.75rem;color:var(--admin-muted);text-decoration:line-through">₹${p.price.toLocaleString('en-IN')}</div>` : ''}
          </td>
          <td>
            <div style="font-weight:${p.stock===0?'700':'400'};color:${p.stock===0?'var(--admin-error)':p.stock<=10?'var(--admin-warning)':'inherit'}">${p.stock}</div>
            <div class="stock-bar" style="width:80px"><div class="stock-bar-fill ${p.stock===0?'low':p.stock<=10?'medium':'high'}" style="width:${Math.min(100,(p.stock/100)*100)}%"></div></div>
          </td>
          <td>⭐ ${(p.averageRating||0).toFixed(1)} (${p.numReviews||0})</td>
          <td>
            <span class="table-badge ${p.isActive?'badge-success':'badge-error'}">${p.isActive?'Active':'Inactive'}</span>
            ${p.isFeatured ? '<span class="table-badge badge-gold" style="margin-left:4px">Featured</span>' : ''}
          </td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="action-btn action-btn-edit edit-product-btn" data-id="${p._id}">Edit</button>
              <button class="action-btn action-btn-delete delete-product-btn" data-id="${p._id}">Delete</button>
            </div>
          </td>
        </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--admin-muted)">No products found</td></tr>';

      // Pagination
      const pagEl = document.getElementById('products-pagination');
      if (pagEl && totalPages > 1) {
        pagEl.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
          const btn = document.createElement('button');
          btn.className = `page-btn${i === currentPage ? ' active' : ''}`;
          btn.textContent = i;
          btn.addEventListener('click', () => { currentPage = i; load(); });
          pagEl.appendChild(btn);
        }
      }

      // Edit handlers
      document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.id));
      });

      // Delete handlers
      document.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this product? This action is permanent.')) return;
          try { await API.Products.delete(btn.dataset.id); Toast.success('Product deleted'); load(); } catch (err) { Toast.error(err.message); }
        });
      });
    } catch (err) { Toast.error('Failed to load products'); }
  };

  const openModal = async (productId = null) => {
    editingId = productId;
    selectedFiles = [];
    document.getElementById('image-previews').innerHTML = '';
    document.getElementById('product-form').reset();
    document.getElementById('modal-title').textContent = productId ? 'Edit Product' : 'Add Product';
    document.getElementById('product-modal-overlay').style.display = 'flex';

    if (productId) {
      try {
        const { product } = await API.Products.getOne(productId);
        document.getElementById('p-name').value = product.name || '';
        document.getElementById('p-category').value = product.category || 'serum';
        document.getElementById('p-price').value = product.price || '';
        document.getElementById('p-discount-price').value = product.discountPrice || '';
        document.getElementById('p-stock').value = product.stock || 0;
        document.getElementById('p-volume').value = product.volume || product.weight || '';
        document.getElementById('p-short-desc').value = product.shortDescription || '';
        document.getElementById('p-desc').value = product.description || '';
        document.getElementById('p-ingredients').value = product.ingredients || '';
        document.getElementById('p-benefits').value = (product.benefits || []).join(', ');
        document.getElementById('p-howto').value = product.howToUse || '';
        document.getElementById('p-skintype').value = (product.skinType || []).join(', ');
        document.getElementById('p-tags').value = (product.tags || []).join(', ');
        document.getElementById('p-featured').checked = product.isFeatured;
        document.getElementById('p-bestseller').checked = product.isBestSeller;
        document.getElementById('p-active').checked = product.isActive;

        if (product.images?.length) {
          document.getElementById('image-previews').innerHTML = product.images.map(img => `
            <div class="image-preview-item"><img src="${img}" alt="Product image" onerror="this.style.background='var(--admin-bg)'"></div>`).join('');
        }
      } catch {}
    }
  };

  const closeModal = () => {
    document.getElementById('product-modal-overlay').style.display = 'none';
    editingId = null;
  };

  // Save product
  document.getElementById('product-save-btn').addEventListener('click', async () => {
    const btn = document.getElementById('product-save-btn');
    btn.textContent = 'Saving...'; btn.disabled = true;
    try {
      const formData = new FormData();
      formData.append('name', document.getElementById('p-name').value);
      formData.append('category', document.getElementById('p-category').value);
      formData.append('price', document.getElementById('p-price').value);
      formData.append('stock', document.getElementById('p-stock').value);
      formData.append('description', document.getElementById('p-desc').value);
      if (document.getElementById('p-discount-price').value) formData.append('discountPrice', document.getElementById('p-discount-price').value);
      if (document.getElementById('p-short-desc').value) formData.append('shortDescription', document.getElementById('p-short-desc').value);
      if (document.getElementById('p-ingredients').value) formData.append('ingredients', document.getElementById('p-ingredients').value);
      if (document.getElementById('p-benefits').value) formData.append('benefits', document.getElementById('p-benefits').value);
      if (document.getElementById('p-howto').value) formData.append('howToUse', document.getElementById('p-howto').value);
      if (document.getElementById('p-skintype').value) formData.append('skinType', document.getElementById('p-skintype').value);
      if (document.getElementById('p-tags').value) formData.append('tags', document.getElementById('p-tags').value);
      if (document.getElementById('p-volume').value) formData.append('volume', document.getElementById('p-volume').value);
      formData.append('isFeatured', document.getElementById('p-featured').checked);
      formData.append('isBestSeller', document.getElementById('p-bestseller').checked);
      formData.append('isActive', document.getElementById('p-active').checked);
      selectedFiles.forEach(f => formData.append('images', f));

      if (editingId) {
        await API.Products.update(editingId, formData);
        Toast.success('Product updated');
      } else {
        await API.Products.create(formData);
        Toast.success('Product created');
      }
      closeModal(); load();
    } catch (err) { Toast.error(err.message); }
    finally { btn.textContent = 'Save Product'; btn.disabled = false; }
  });

  // Image upload
  const uploadZone = document.getElementById('upload-zone');
  uploadZone.addEventListener('click', () => document.getElementById('p-images').click());
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault(); uploadZone.classList.remove('dragover');
    handleFiles([...e.dataTransfer.files]);
  });
  document.getElementById('p-images').addEventListener('change', (e) => handleFiles([...e.target.files]));

  function handleFiles(files) {
    files.filter(f => f.type.startsWith('image/')).slice(0, 5).forEach(file => {
      selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.innerHTML = `<img src="${e.target.result}"><span class="image-remove" data-idx="${selectedFiles.length - 1}">×</span>`;
        div.querySelector('.image-remove').addEventListener('click', (ev) => {
          selectedFiles.splice(parseInt(ev.target.dataset.idx), 1);
          div.remove();
        });
        document.getElementById('image-previews').appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }

  // Event handlers
  document.getElementById('add-product-btn').addEventListener('click', () => openModal());
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('product-modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  document.getElementById('product-search').addEventListener('input', debounce(() => { currentPage = 1; load(); }, 500));
  document.getElementById('category-filter').addEventListener('change', () => { currentPage = 1; load(); });

  // Check for ?action=add param
  if (new URLSearchParams(window.location.search).get('action') === 'add') openModal();

  load();
});
