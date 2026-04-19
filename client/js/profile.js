/**
 * BareSober — Profile & Orders Page
 */

(async function () {
  if (!BSAuth.requireAuth()) return;

  const user = BSAuth.getUser();
  document.getElementById('profile-name')?.setAttribute('textContent', user.name);
  document.querySelectorAll('.profile-user-name').forEach(el => el.textContent = user.name || '');
  document.querySelectorAll('.profile-user-email').forEach(el => el.textContent = user.email || user.mobile || '');

  const initials = (user.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.querySelectorAll('.profile-avatar-initials').forEach(el => el.textContent = initials);

  const activeTab = Utils.getUrlParam('tab') || 'profile';
  showTab(activeTab);

  document.querySelectorAll('.profile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      showTab(tab);
      Utils.setUrlParam('tab', tab);
    });
  });

  function showTab(tab) {
    document.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.profile-nav-item').forEach(i => i.classList.remove('active'));
    const contentEl = document.getElementById(`tab-${tab}`);
    const navItem = document.querySelector(`[data-tab="${tab}"]`);
    if (contentEl) contentEl.style.display = 'block';
    if (navItem) navItem.classList.add('active');
    if (tab === 'orders') loadOrders();
    if (tab === 'wishlist') loadWishlist();
    if (tab === 'profile') loadProfileForm();
    if (tab === 'bulk') loadBulkOrders();
  }

  async function loadProfileForm() {
    const formEl = document.getElementById('profile-form');
    if (!formEl) return;
    try {
      const { user: u } = await API.Auth.getMe();
      formEl.elements['name'].value = u.name || '';
      formEl.elements['email'].value = u.email || '';
      formEl.elements['mobile'].value = u.mobile || '';
    } catch {}

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formEl.querySelector('[type=submit]');
      btn.classList.add('btn-loading');
      try {
        const data = { name: formEl.elements['name'].value, email: formEl.elements['email'].value };
        await API.Auth.updateProfile(data);
        Toast.success('Profile updated!');
        const updated = { ...BSAuth.getUser(), ...data };
        localStorage.setItem('bs_user', JSON.stringify(updated));
      } catch (err) { Toast.error(err.message); }
      finally { btn.classList.remove('btn-loading'); }
    });

    const pwForm = document.getElementById('change-password-form');
    pwForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPw = pwForm.elements['newPassword'].value;
      const confirm = pwForm.elements['confirmPassword'].value;
      if (newPw !== confirm) { Toast.error('Passwords do not match'); return; }
      const btn = pwForm.querySelector('[type=submit]');
      btn.classList.add('btn-loading');
      try {
        await API.Auth.changePassword({ currentPassword: pwForm.elements['currentPassword'].value, newPassword: newPw });
        Toast.success('Password changed!');
        pwForm.reset();
      } catch (err) { Toast.error(err.message); }
      finally { btn.classList.remove('btn-loading'); }
    });
  }

  async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    try {
      const { orders } = await API.Orders.getAll();
      if (!orders.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No orders yet</h3><a href="/products.html" class="btn btn-primary" style="margin-top:16px">Start Shopping</a></div>`;
        return;
      }
      container.innerHTML = orders.map(order => `
        <div class="order-card" id="order-${order._id}">
          <div class="order-card-header">
            <div>
              <div class="order-number">#${order.orderNumber}</div>
              <div style="font-size:.8125rem;color:var(--light-gray)">${Utils.formatDate(order.createdAt)} · ${order.items.length} item(s)</div>
            </div>
            <span class="order-status-badge status-${order.orderStatus}">${order.orderStatus}</span>
          </div>
          <div>
            ${order.items.slice(0, 2).map(item => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <img src="${item.image||'/img/placeholder.jpg'}" style="width:44px;height:44px;object-fit:cover;border-radius:6px">
                <div style="font-size:.875rem">${item.name} <span style="color:var(--light-gray)">× ${item.quantity}</span></div>
              </div>`).join('')}
            ${order.items.length > 2 ? `<p style="font-size:.8125rem;color:var(--light-gray)">+${order.items.length-2} more items</p>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--border-light)">
            <div><span style="font-weight:700;font-size:1.0625rem">${Utils.formatPrice(order.totalAmount)}</span> <span style="font-size:.8125rem;color:var(--light-gray)")>${order.paymentMethod.toUpperCase()}</span></div>
            <div style="display:flex;gap:8px">
              ${['placed','confirmed'].includes(order.orderStatus) ? `<button class="btn btn-outline btn-sm cancel-order-btn" data-id="${order._id}">Cancel</button>` : ''}
              <button class="btn btn-outline btn-sm view-order-btn" data-id="${order._id}">View Details</button>
            </div>
          </div>
          ${order.trackingNumber ? `<p style="margin-top:8px;font-size:.8125rem;color:var(--info)">Tracking: ${order.trackingNumber}</p>` : ''}
        </div>`).join('');

      document.querySelectorAll('.cancel-order-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const orderId = btn.dataset.id;
          
          // Create custom modal overlay
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
          
          overlay.innerHTML = `
            <div style="background:var(--white);padding:24px;border-radius:16px;width:90%;max-width:400px;box-shadow:var(--shadow-lg);animation:upiSlideUp 0.3s ease">
              <h3 style="font-family:var(--font-serif);font-size:1.25rem;margin-bottom:12px">Cancel Order</h3>
              <p style="font-size:0.875rem;color:var(--mid-gray);margin-bottom:16px">Are you sure you want to cancel this order? This action cannot be undone.</p>
              <div class="form-group" style="margin-bottom:20px">
                <label class="form-label">Reason (optional)</label>
                <input type="text" id="cancel-reason-input" class="form-input" placeholder="e.g. Changed my mind">
              </div>
              <div style="display:flex;flex-direction:column;gap:10px">
                <button class="btn btn-primary w-full" id="cancel-confirm-btn" style="background:#dc2626;border-color:#dc2626;color:#fff">Yes, Cancel Order</button>
                <button class="btn btn-outline w-full" id="cancel-close-btn">Keep Order</button>
              </div>
            </div>
          `;
          
          document.body.appendChild(overlay);
          
          document.getElementById('cancel-close-btn').onclick = () => overlay.remove();
          document.getElementById('cancel-confirm-btn').onclick = async () => {
            const reason = document.getElementById('cancel-reason-input').value.trim();
            const confirmBtn = document.getElementById('cancel-confirm-btn');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = 'Cancelling...';
            
            try {
              await API.Orders.cancel(orderId, { reason: reason || 'Cancelled by user' });
              Toast.success('Order cancelled successfully');
              overlay.remove();
              loadOrders(); // Refresh list
            } catch (err) {
              Toast.error(err.message || 'Failed to cancel order');
              confirmBtn.disabled = false;
              confirmBtn.innerHTML = 'Yes, Cancel Order';
            }
          };
        });
      });
    } catch (err) {
      container.innerHTML = '<p style="color:var(--error);padding:20px">Failed to load orders</p>';
    }
  }

  async function loadWishlist() {
    const container = document.getElementById('wishlist-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    try {
      const { wishlist } = await API.Wishlist.get();
      if (!wishlist?.products?.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">♡</div><h3>Your wishlist is empty</h3><a href="/products.html" class="btn btn-primary" style="margin-top:16px">Explore Products</a></div>`;
        return;
      }
      container.innerHTML = `<div class="products-grid">${wishlist.products.map(p => Utils.renderProductCard(p)).join('')}</div>`;
    } catch {}
  }

  async function loadBulkOrders() {
    const container = document.getElementById('bulk-orders-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
    try {
      const { bulkOrders } = await API.BulkOrders.getAll();
      if (!bulkOrders.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No bulk inquiries yet</h3><a href="/bulk-order.html" class="btn btn-primary" style="margin-top:16px">Submit Bulk Order</a></div>`;
        return;
      }
      container.innerHTML = bulkOrders.map(o => `
        <div class="order-card">
          <div class="order-card-header">
            <div><div class="order-number">#${o.inquiryNumber}</div><div style="font-size:.8125rem;color:var(--light-gray)">${Utils.formatDate(o.createdAt)}</div></div>
            <span class="order-status-badge status-${o.status==='pending'?'placed':'confirmed'}">${o.status}</span>
          </div>
          <p style="font-size:.875rem;color:var(--mid-gray);margin-top:8px">Qty: ${o.totalEstimatedQty||0} units · ${o.products.length} product(s)</p>
          ${o.quotedPrice ? `<p style="font-weight:700;margin-top:8px">Quoted: ${Utils.formatPrice(o.quotedPrice)}</p>` : ''}
        </div>`).join('');
    } catch {}
  }

  document.getElementById('logout-btn')?.addEventListener('click', () => BSAuth.logout());
})();
