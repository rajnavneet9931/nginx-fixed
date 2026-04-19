/**
 * BareSober — Admin: Orders Management
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!BSAuth.isAdmin()) { window.location.href = '/auth.html'; return; }
  document.getElementById('admin-logout-btn').addEventListener('click', () => BSAuth.logout());

  const typeFilter = document.getElementById('order-type-filter');
  const statusFilter = document.getElementById('order-status-filter');
  let currentType = new URLSearchParams(window.location.search).get('type') || 'regular';
  if (typeFilter) typeFilter.value = currentType;
  switchOrderType(currentType);

  statusFilter?.addEventListener('change', () => {
    if (currentType === 'regular') loadOrders();
    else if (currentType === 'bulk') loadBulkOrders();
  });

  async function loadOrders() {
    const status = document.getElementById('order-status-filter')?.value || '';
    const params = new URLSearchParams({ page: 1, limit: 20 });
    if (status) params.set('status', status);
    try {
      const { orders, total } = await API.Admin.getOrders(params.toString());
      const statusColors = { placed:'warning',confirmed:'success',shipped:'info',delivered:'success',cancelled:'error',processing:'warning' };
      document.getElementById('orders-tbody').innerHTML = orders.map(o => `
        <tr>
          <td><a style="color:var(--admin-accent);font-weight:700">#${o.orderNumber}</a></td>
          <td><div style="font-weight:600">${o.user?.name||'Guest'}</div><div style="font-size:.75rem;color:var(--admin-muted)">${o.user?.email||o.user?.mobile||''}</div></td>
          <td>${o.items?.length||0} item(s)</td>
          <td style="font-weight:700">₹${o.totalAmount?.toLocaleString('en-IN')}</td>
          <td><span class="table-badge ${o.paymentStatus==='paid'?'badge-success':o.paymentStatus==='pending'?'badge-warning':'badge-error'}">${o.paymentStatus}</span></td>
          <td><span class="table-badge badge-${statusColors[o.orderStatus]||'gray'}">${o.orderStatus}</span></td>
          <td style="color:var(--admin-muted)">${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
          <td><button class="action-btn action-btn-edit update-status-btn" data-id="${o._id}" data-status="${o.orderStatus}">Update</button></td>
        </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--admin-muted)">No orders found</td></tr>';

      document.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('status-order-id').value = btn.dataset.id;
          document.getElementById('new-status').value = btn.dataset.status;
          document.getElementById('status-modal').style.display = 'flex';
        });
      });
    } catch (err) { Toast.error('Failed to load orders'); }
  }

  async function loadBulkOrders() {
    try {
      const { bulkOrders } = await API.Admin.getBulkOrders();
      document.getElementById('bulk-tbody').innerHTML = bulkOrders.map(o => `
        <tr>
          <td><strong>#${o.inquiryNumber}</strong></td>
          <td><div style="font-weight:600">${o.contactName}</div><div style="font-size:.75rem;color:var(--admin-muted)">${o.email}<br>${o.mobile}</div></td>
          <td>${o.companyName||'—'}</td>
          <td>${o.totalEstimatedQty||0} units</td>
          <td><span class="table-badge badge-${o.status==='pending'?'warning':o.status==='confirmed'?'success':'gray'}">${o.status}</span></td>
          <td>${o.quotedPrice ? '₹'+o.quotedPrice.toLocaleString('en-IN') : '—'}</td>
          <td style="color:var(--admin-muted)">${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
          <td>
            <select class="admin-select bulk-status-select" data-id="${o._id}" style="padding:5px 10px;font-size:.8125rem">
              <option ${o.status==='pending'?'selected':''} value="pending">Pending</option>
              <option ${o.status==='reviewing'?'selected':''} value="reviewing">Reviewing</option>
              <option ${o.status==='quoted'?'selected':''} value="quoted">Quoted</option>
              <option ${o.status==='confirmed'?'selected':''} value="confirmed">Confirmed</option>
              <option ${o.status==='processing'?'selected':''} value="processing">Processing</option>
              <option ${o.status==='shipped'?'selected':''} value="shipped">Shipped</option>
              <option ${o.status==='delivered'?'selected':''} value="delivered">Delivered</option>
              <option ${o.status==='cancelled'?'selected':''} value="cancelled">Cancelled</option>
            </select>
          </td>
        </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--admin-muted)">No bulk inquiries</td></tr>';

      document.querySelectorAll('.bulk-status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          try {
            await API.Admin.updateBulkOrder(sel.dataset.id, { status: sel.value });
            Toast.success('Bulk order status updated');
          } catch (err) { Toast.error(err.message); }
        });
      });
    } catch (err) { Toast.error('Failed to load bulk orders'); }
  }

  async function loadNotifications() {
    try {
      const { notifications } = await API.Admin.getStockNotifs();
      document.getElementById('notifs-tbody').innerHTML = notifications.map(n => `
        <tr>
          <td><strong>${n.product?.name||'Unknown'}</strong> <span style="font-size:.75rem;color:var(--admin-muted)">(Stock: ${n.product?.stock||0})</span></td>
          <td>${n.email||n.user?.email||n.mobile||'—'}</td>
          <td><span class="table-badge ${n.notified?'badge-success':'badge-warning'}">${n.notified?'Notified':'Pending'}</span></td>
          <td style="color:var(--admin-muted)">${new Date(n.createdAt).toLocaleDateString('en-IN')}</td>
        </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--admin-muted)">No notifications</td></tr>';
    } catch {}
  }

  window.switchOrderType = (type) => {
    currentType = type;
    if (typeFilter) typeFilter.value = type;
    document.getElementById('regular-orders-section').style.display = type === 'regular' ? 'block' : 'none';
    document.getElementById('bulk-orders-section').style.display = type === 'bulk' ? 'block' : 'none';
    document.getElementById('notifications-section').style.display = type === 'notifications' ? 'block' : 'none';
    if (typeFilter) typeFilter.addEventListener('change', (e) => switchOrderType(e.target.value));
    if (type === 'regular') loadOrders();
    else if (type === 'bulk') loadBulkOrders();
    else if (type === 'notifications') loadNotifications();
  };

  // Status update
  document.getElementById('save-status-btn').addEventListener('click', async () => {
    const orderId = document.getElementById('status-order-id').value;
    const status = document.getElementById('new-status').value;
    const note = document.getElementById('status-note').value;
    const trackingNumber = document.getElementById('tracking-number').value;
    try {
      await API.Admin.updateOrderStatus(orderId, { status, note, trackingNumber });
      Toast.success('Order status updated');
      document.getElementById('status-modal').style.display = 'none';
      loadOrders();
    } catch (err) { Toast.error(err.message); }
  });
});
