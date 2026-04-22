const BUILD_ID = 'tenant-2026-01-22-01';
function showJsError(message) {
  const banner = document.getElementById('jsErrorBanner');
  const text = document.getElementById('jsErrorText');
  if (!banner || !text) return;
  text.textContent = String(message || 'Unknown error');
  banner.style.display = 'block';
}
window.addEventListener('error', (e) => {
  const msg = e?.error?.stack || e?.message || 'Unknown error';
  showJsError(msg);
});
window.addEventListener('unhandledrejection', (e) => {
  const reason = e?.reason;
  const msg = reason?.stack || reason?.message || String(reason || 'Unhandled promise rejection');
  showJsError(msg);
});
const STORAGE = {
  profile: 'rentiva_tenant_profile',
  owner: 'rentiva_tenant_owner_details',
  payments: 'rentiva_tenant_payments',
  notifications: 'rentiva_tenant_notifications',
  notifSettings: 'rentiva_tenant_notification_settings',
  maintenance: 'rentiva_tenant_maintenance',
  expenses: 'rentiva_tenant_expenses',
  theme: 'rentiva_tenant_theme'
};

async function getAuthToken() {
  if (window.auth && window.auth.currentUser) {
    try {
      return await window.auth.currentUser.getIdToken();
    } catch (e) {
      console.error('Firebase token error:', e);
    }
  }
  return localStorage.getItem('rentiva_jwt') || '';
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

try {
  const el = document.getElementById('buildId');
  if (el) el.textContent = BUILD_ID;
} catch { }

$('#btnHideJsError')?.addEventListener('click', () => {
  const banner = document.getElementById('jsErrorBanner');
  if (banner) banner.style.display = 'none';
});

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str ?? '').replace(/[&<>"']/g, (ch) => map[ch] || ch);
}

function formatMoney(n) {
  const v = Number(n || 0);
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(isoOrDate || '');
  }
}

function getCurrentMonthKey() {
  const d = new Date();
  return `${monthNames[d.getMonth()]}-${d.getFullYear()}`;
}

function toast(title, message, type = 'info') {
  const icon = type === 'success'
    ? 'check-circle'
    : type === 'danger'
      ? 'exclamation-circle'
      : type === 'warning'
        ? 'triangle-exclamation'
        : 'info-circle';

  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i class="fas fa-${icon}"></i><div class="t"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div>`;
  $('#toastWrap')?.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    el.style.transition = '220ms ease';
    setTimeout(() => el.remove(), 260);
  }, 3200);
}

const state = {
  profile: loadJSON(STORAGE.profile, { name: 'Tenant', unit: 'Unit', rent: 12000, dueDay: 5, photo: '' }),
  owner: loadJSON(STORAGE.owner, { name: 'Property Owner', upi: 'owner@upi', note: 'Rent payment' }),
  payments: loadJSON(STORAGE.payments, []),
  notifications: loadJSON(STORAGE.notifications, []),
  notifSettings: loadJSON(STORAGE.notifSettings, { reminders: 'on', dueAlerts: 'on', confirmAlerts: 'on', quietHours: 'none' }),
  maintenance: loadJSON(STORAGE.maintenance, []),
  expenses: loadJSON(STORAGE.expenses, []),
  ownerId: null
};

function logout() {
  window.location.href = 'landing.html';
}

function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const icon = $('#themeIcon');
    if (icon) icon.className = 'fas fa-sun';
  } else {
    document.documentElement.removeAttribute('data-theme');
    const icon = $('#themeIcon');
    if (icon) icon.className = 'fas fa-moon';
  }
  localStorage.setItem(STORAGE.theme, theme);
}

function toggleTheme() {
  const next = (localStorage.getItem(STORAGE.theme) || 'light') === 'light' ? 'dark' : 'light';
  setTheme(next);
  toast('Theme', next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'success');
}

function updateAvatar() {
  const name = String(state.profile.name || 'Tenant').trim();
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'T';
  const avatarText = $('#avatarText');
  const avatarImg = $('#avatarImg');
  if (avatarText) avatarText.textContent = initials;
  if (avatarImg) {
    if (state.profile.photo) {
      avatarImg.src = state.profile.photo;
      avatarImg.style.display = 'block';
      if (avatarText) avatarText.style.display = 'none';
    } else {
      avatarImg.style.display = 'none';
      if (avatarText) avatarText.style.display = 'block';
    }
  }
}

window.syncProfileData = (user) => {
  if (!user) return;
  state.profile.name = user.displayName || state.profile.name;
  const savedImg = localStorage.getItem(`profile_img_${user.uid}`);
  state.profile.photo = savedImg || user.photoURL || state.profile.photo;
  updateAvatar();
};

function setActiveView(view) {
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));

  const meta = {
    dashboard: { title: 'Dashboard', subtitle: 'Your rent, receipts and requests — all in one place' },
    pay: { title: 'Pay Owner', subtitle: 'Make full or partial payments and download receipts' },
    history: { title: 'Payment History', subtitle: 'Timeline of payments with downloadable receipts' },
    notifications: { title: 'Notifications', subtitle: 'Reminders, confirmations and announcements' },
    maintenance: { title: 'Maintenance', subtitle: 'Raise issues and track their status' },
    expenses: { title: 'Expenses', subtitle: 'Track utilities and understand monthly costs' },
    settings: { title: 'Profile & Settings', subtitle: 'Personalize Rentiva for daily usability' },
    terms: { title: 'Terms & Conditions', subtitle: 'Understand your rental agreement and policies' }
  };

  const t = meta[view] || meta.dashboard;
  const title = $('#pageTitle');
  const sub = $('#pageSubtitle');
  if (title) title.textContent = t.title;
  if (sub) sub.textContent = t.subtitle;

  localStorage.setItem('rentiva_tenant_active_view', String(view || 'dashboard'));

  if (view === 'dashboard') refreshDashboard();
  if (view === 'pay') refreshDashboard();
  if (view === 'history') refreshHistory();
  if (view === 'notifications') refreshNotifications();
  if (view === 'maintenance') refreshMaintenance();
  if (view === 'expenses') refreshExpenses();
  if (view === 'settings') {
    $('#setName').value = state.profile.name || '';
    $('#setUnit').value = state.profile.unit || '';
    $('#setRent').value = String(state.profile.rent ?? '');
    $('#setDueDay').value = String(state.profile.dueDay ?? '');
    $('#setOwnerName').value = state.owner.name || '';
    $('#setOwnerUpi').value = state.owner.upi || '';
    $('#setOwnerNote').value = state.owner.note || '';
  }

  if (window.innerWidth < 860) $('#sidebar')?.classList.remove('open');
}

function parseAmount(raw) {
  const n = Number(String(raw || '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return n;
}

function getDueDateForMonth(ref = new Date()) {
  const dueDay = clamp(parseInt(state.profile.dueDay || 5, 10) || 5, 1, 28);
  return new Date(ref.getFullYear(), ref.getMonth(), dueDay, 23, 59, 59, 999);
}

function getNextDueDate(ref = new Date()) {
  const dueThisMonth = getDueDateForMonth(ref);
  if (ref <= dueThisMonth) return dueThisMonth;
  return getDueDateForMonth(new Date(ref.getFullYear(), ref.getMonth() + 1, 1));
}

function paymentsForMonth(monthKey) {
  return state.payments.filter(p => p.monthKey === monthKey);
}

function sumPaidForMonth(monthKey) {
  return paymentsForMonth(monthKey).reduce((acc, p) => acc + Number(p.amount || 0), 0);
}

function totals() {
  const totalPaid = state.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const monthKey = getCurrentMonthKey();
  const rent = Number(state.profile.rent || 0);
  const paidThisMonth = sumPaidForMonth(monthKey);
  const due = Math.max(0, rent - paidThisMonth);
  return { totalPaid, monthKey, rent, paidThisMonth, due };
}

function rentStatus() {
  const { rent, due } = totals();
  const dueDate = getDueDateForMonth(new Date());
  const today = new Date();
  if (rent > 0 && due <= 0) return { status: 'paid', label: 'PAID' };
  if (today > dueDate && due > 0) return { status: 'overdue', label: 'OVERDUE' };
  return { status: 'pending', label: 'PENDING' };
}

function setPill(status) {
  const pill = $('#rentStatusPill');
  if (!pill) return;
  pill.textContent = status.label;
  pill.classList.remove('paid', 'pending', 'overdue');
  pill.classList.add(status.status);
}

function addNotification(kind, title, message) {
  const entry = {
    id: `n_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    kind,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false
  };
  state.notifications.unshift(entry);
  saveJSON(STORAGE.notifications, state.notifications);
  refreshNotifications();
}

function remindersAllowed() {
  if (state.notifSettings.reminders !== 'on') return false;
  const q = state.notifSettings.quietHours;
  if (q === 'none') return true;
  const h = new Date().getHours();
  if (q === '22-8') return !(h >= 22 || h < 8);
  if (q === '23-9') return !(h >= 23 || h < 9);
  return true;
}

function ensureReminders() {
  if (!remindersAllowed()) return;
  const { due, rent } = totals();
  if (rent <= 0) return;

  const dueDate = getDueDateForMonth(new Date());
  const ms = dueDate.getTime() - Date.now();
  const daysLeft = Math.floor(ms / (1000 * 60 * 60 * 24));
  const status = rentStatus();

  const fp = `rem_${getCurrentMonthKey()}_${status.status}_${daysLeft}_${Math.round(due)}`;
  const already = state.notifications.some(n => n.kind === 'reminder' && n.message.includes(fp));
  if (already) return;

  if (status.status === 'paid') {
    if (state.notifSettings.confirmAlerts === 'on') {
      addNotification('reminder', 'Rent settled', `All good for ${getCurrentMonthKey()} ✅ (${fp})`);
    }
    return;
  }

  if (status.status === 'overdue') {
    if (state.notifSettings.dueAlerts === 'on') {
      addNotification('reminder', 'Rent overdue', `Pending: ${formatMoney(due)} (${fp})`);
      toast('Overdue', `Pending: ${formatMoney(due)}`, 'danger');
    }
    return;
  }

  if (state.notifSettings.dueAlerts !== 'on') return;
  if (daysLeft <= 0) addNotification('reminder', 'Rent due today', `Pending: ${formatMoney(due)} (${fp})`);
  else if (daysLeft <= 1) addNotification('reminder', 'Rent due tomorrow', `Pending: ${formatMoney(due)} (${fp})`);
  else if (daysLeft <= 3) addNotification('reminder', 'Rent due in 3 days', `Pending: ${formatMoney(due)} (${fp})`);
  else if (daysLeft <= 7) addNotification('reminder', 'Upcoming rent due', `Rent due in ${daysLeft} days • Pending: ${formatMoney(due)} (${fp})`);
}

function diffParts(ms) {
  const total = Math.max(0, ms);
  const s = Math.floor(total / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return { days, hours, mins, secs };
}

function pad2(n) { return String(n).padStart(2, '0'); }

function tickCountdown() {
  const next = getNextDueDate(new Date());
  const ms = next.getTime() - Date.now();
  const parts = diffParts(ms);
  const st = rentStatus();

  const dueDateEl = $('#dashDueDate');
  if (dueDateEl) dueDateEl.textContent = `Next due: ${next.toLocaleDateString()}`;
  const badge = $('#dashStatus');
  if (badge) badge.textContent = st.label;

  if (st.status === 'paid') {
    $('#dashCountdown').textContent = '✅ Paid';
    $('#dashCountdownHint').textContent = `You're all set for ${getCurrentMonthKey()}.`;
    $('#badgeCountdown').textContent = 'OK';
    $('#dashCountdownProgress').style.width = '100%';
    return;
  }

  if (st.status === 'overdue') {
    $('#dashCountdown').textContent = 'Overdue';
    $('#dashCountdownHint').textContent = 'Please pay to avoid late fees.';
    $('#badgeCountdown').textContent = 'LATE';
    $('#dashCountdownProgress').style.width = '12%';
    return;
  }

  const label = `${parts.days}d ${pad2(parts.hours)}h ${pad2(parts.mins)}m ${pad2(parts.secs)}s`;
  $('#dashCountdown').textContent = label;
  $('#dashCountdownHint').textContent = 'Pay early for a smooth month.';
  $('#badgeCountdown').textContent = parts.days >= 1 ? `${parts.days}d` : 'Soon';

  const dueThisMonth = getDueDateForMonth(new Date());
  const start = new Date(dueThisMonth.getFullYear(), dueThisMonth.getMonth(), 1, 0, 0, 0, 0).getTime();
  const total = Math.max(1, dueThisMonth.getTime() - start);
  const elapsed = clamp(Date.now() - start, 0, total);
  const pct = clamp((elapsed / total) * 100, 0, 100);
  $('#dashCountdownProgress').style.width = `${pct}%`;
}

function refreshDashboard() {
  updateAvatar();

  const { totalPaid, monthKey, rent, paidThisMonth, due } = totals();
  const status = rentStatus();
  setPill(status);

  $('#profileName').textContent = state.profile.name || 'Tenant';
  $('#profileSub').textContent = `${state.profile.unit || 'Unit'} • Due day ${clamp(parseInt(state.profile.dueDay || 5, 10) || 5, 1, 28)}`;

  $('#dashMonth').textContent = monthKey;
  $('#dashRent').textContent = formatMoney(rent);
  $('#dashPaidLabel').textContent = `Paid ${formatMoney(paidThisMonth)}`;
  $('#dashDueLabel').textContent = `Due ${formatMoney(due)}`;
  const paidPct = rent > 0 ? clamp((paidThisMonth / rent) * 100, 0, 100) : 0;
  $('#dashPaidProgress').style.width = `${paidPct}%`;

  $('#dashTotalPaid').textContent = formatMoney(totalPaid);

  const recent = state.payments.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (recent) {
    $('#dashRecentAmount').textContent = formatMoney(recent.amount);
    $('#dashRecentDate').textContent = formatDate(recent.createdAt);
    $('#dashRecentMeta').textContent = `${recent.monthKey} • ${recent.method}${recent.note ? ` • ${recent.note}` : ''}`;
    $('#dashRecentBadge').textContent = recent.status.toUpperCase();
  } else {
    $('#dashRecentAmount').textContent = formatMoney(0);
    $('#dashRecentDate').textContent = '--';
    $('#dashRecentMeta').textContent = 'No payments yet';
    $('#dashRecentBadge').textContent = '--';
  }

  $('#badgeDue').textContent = formatMoney(due).replace('.00', '');
  $('#badgeHistory').textContent = String(state.payments.length);

  $('#payRent').textContent = formatMoney(rent).replace('.00', '');
  $('#payBalance').textContent = formatMoney(due).replace('.00', '');
  $('#payMonthKey').textContent = monthKey;
  $('#payStatus').textContent = status.label;
  $('#payDueInfo').textContent = `Due day: ${clamp(parseInt(state.profile.dueDay || 5, 10) || 5, 1, 28)} • Pending: ${formatMoney(due)}`;

  const recentForReceipt = state.payments.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  updateReceiptCard(recentForReceipt || null);

  $('#ownerPayName').textContent = `Owner: ${state.owner.name || '--'}`;
  $('#ownerPayUpi').textContent = `UPI: ${state.owner.upi || '--'}`;
  $('#ownerPayNote').textContent = `Note: ${state.owner.note || '--'}`;
}

function makeReceiptHtml(payment) {
  const tenantName = escapeHtml(state.profile.name || 'Tenant');
  const unit = escapeHtml(state.profile.unit || 'Unit');
  const ownerName = escapeHtml(state.owner.name || 'Owner');
  const upi = escapeHtml(state.owner.upi || '');
  const note = escapeHtml(payment.note || '');
  const method = escapeHtml(payment.method || '');

  const upiRow = upi
    ? `<div class="row"><span class="muted">UPI</span><strong>${upi}</strong></div>`
    : '';
  const noteRow = note
    ? `<div class="row"><span class="muted">Note</span><strong>${note}</strong></div>`
    : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Rentiva Receipt</title>
<style>
body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;background:#fff;margin:0;padding:24px;color:#0f172a;}
.wrap{max-width:520px;margin:0 auto;border:1px solid rgba(15,23,42,.12);border-radius:18px;overflow:hidden}
.head{padding:18px;background:linear-gradient(135deg,#10b981 0%,#3b82f6 45%,#06b6d4 100%);color:#fff}
.head h1{margin:0;font-size:18px;letter-spacing:.6px}
.head p{margin:6px 0 0;opacity:.95;font-size:12px}
.body{padding:18px}
.row{display:flex;justify-content:space-between;gap:12px;margin:10px 0;font-size:13px}
.row strong{font-weight:800}
.muted{color:#64748b}
.total{margin-top:12px;padding-top:12px;border-top:1px dashed rgba(15,23,42,.18);font-size:15px}
.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(16,185,129,.14);border:1px solid rgba(15,23,42,.10);font-weight:800;font-size:12px}
.foot{padding:14px 18px;border-top:1px solid rgba(15,23,42,.10);background:#f8fafc;font-size:12px;color:#64748b}
</style></head><body>
<div class="wrap"><div class="head"><h1>RENTIVA • RENT RECEIPT</h1><p>Digital receipt generated by tenant portal</p></div>
<div class="body">
<div class="row"><span class="muted">Receipt ID</span><strong>${escapeHtml(payment.id)}</strong></div>
<div class="row"><span class="muted">Date</span><strong>${escapeHtml(formatDate(payment.createdAt))}</strong></div>
<div class="row"><span class="muted">Tenant</span><strong>${tenantName} (${unit})</strong></div>
<div class="row"><span class="muted">Owner</span><strong>${ownerName}</strong></div>
<div class="row"><span class="muted">Month</span><strong>${escapeHtml(payment.monthKey)}</strong></div>
<div class="row"><span class="muted">Method</span><strong>${method}</strong></div>
${upiRow}${noteRow}
<div class="row total"><span class="muted">Amount Paid</span><strong>${escapeHtml(formatMoney(payment.amount))}</strong></div>
<div style="margin-top:12px"><span class="badge">${escapeHtml(payment.status.toUpperCase())}</span></div>
</div>
<div class="foot">Keep this receipt for your records. For any discrepancy, contact the owner.</div></div>
</body>` + `</html>`;
}

function downloadReceipt(payment) {
  const html = makeReceiptHtml(payment);
  payment.receiptHtml = html;
  saveJSON(STORAGE.payments, state.payments);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeMonth = String(payment.monthKey || '').replace(/\s+/g, '_');
  a.download = `Rentiva_Receipt_${safeMonth}_${payment.id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function updateReceiptCard(payment) {
  if (!payment) {
    $('#receiptBadge').textContent = '--';
    $('#receiptTitle').textContent = 'No receipt yet';
    $('#receiptSubtitle').textContent = 'Make a payment to generate a receipt';
    $('#receiptStatus').textContent = '--';
    $('#receiptLine1').textContent = '--';
    $('#receiptLine2').textContent = '--';
    $('#receiptLine3').textContent = '--';
    return;
  }
  $('#receiptBadge').textContent = payment.monthKey;
  $('#receiptTitle').textContent = `${payment.monthKey} payment`;
  $('#receiptSubtitle').textContent = formatDate(payment.createdAt);
  $('#receiptStatus').textContent = payment.status.toUpperCase();
  $('#receiptLine1').textContent = `Amount: ${formatMoney(payment.amount)}`;
  $('#receiptLine2').textContent = `Method: ${payment.method}`;
  $('#receiptLine3').textContent = payment.note ? `Note: ${payment.note}` : 'Note: --';
}

let selectedPaymentId = null;

function openPaymentDetail(p) {
  selectedPaymentId = p.id;
  $('#detailBadge').textContent = p.monthKey;
  $('#detailTitle').textContent = `${p.monthKey} • ${formatMoney(p.amount)}`;
  $('#detailSubtitle').textContent = formatDate(p.createdAt);
  $('#detailStatus').textContent = p.status.toUpperCase();
  $('#detailLine1').textContent = `Method: ${p.method}`;
  $('#detailLine2').textContent = p.note ? `Note: ${p.note}` : 'Note: --';
  $('#detailLine3').textContent = `Receipt ID: ${p.id}`;
  updateReceiptCard(p);
}

function refreshHistory() {
  const filter = $('#historyFilter')?.value || 'all';
  const query = ($('#historySearch')?.value || '').trim().toLowerCase();

  const items = state.payments
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(p => (filter === 'all' ? true : p.status === filter))
    .filter(p => {
      if (!query) return true;
      return `${p.monthKey} ${p.method} ${p.note || ''}`.toLowerCase().includes(query);
    });

  $('#historyCount').textContent = String(items.length);
  const list = $('#historyList');
  list.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'item';
    empty.innerHTML = `<div class="item-top"><div style="display:grid;gap:4px;"><strong>No payments</strong><span>Add a payment to see it here</span></div><span class="badge">--</span></div>`;
    list.appendChild(empty);
    return;
  }

  items.forEach(p => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
          <div class="item-top">
            <div style="display:grid;gap:4px;">
              <strong>${escapeHtml(p.monthKey)} • ${escapeHtml(formatMoney(p.amount))}</strong>
              <span>${escapeHtml(formatDate(p.createdAt))} • ${escapeHtml(p.method)}${p.note ? ` • ${escapeHtml(p.note)}` : ''}</span>
            </div>
            <span class="badge ${p.status === 'paid' ? 'success' : 'warn'}">${escapeHtml(p.status.toUpperCase())}</span>
          </div>
          <div class="item-actions">
            <button class="btn" type="button" data-act="open" data-id="${escapeHtml(p.id)}"><i class="fas fa-eye"></i> Details</button>
            <button class="btn" type="button" data-act="download" data-id="${escapeHtml(p.id)}"><i class="fas fa-download"></i> Receipt</button>
          </div>
        `;
    list.appendChild(el);
  });

  list.querySelectorAll('button[data-act]').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');
      const p = state.payments.find(x => x.id === id);
      if (!p) return;
      if (act === 'download') downloadReceipt(p);
      if (act === 'open') openPaymentDetail(p);
    });
  });
}

function refreshNotifications() {
  const unread = state.notifications.filter(n => !n.read).length;
  $('#badgeNotif').textContent = String(unread);
  $('#notifCount').textContent = String(state.notifications.length);
  $('#notifUnread').textContent = String(unread);

  const r = $('#toggleReminders');
  const d = $('#toggleDueAlerts');
  const c = $('#toggleConfirmAlerts');
  const q = $('#quietHours');
  if (r) r.value = state.notifSettings.reminders;
  if (d) d.value = state.notifSettings.dueAlerts;
  if (c) c.value = state.notifSettings.confirmAlerts;
  if (q) q.value = state.notifSettings.quietHours;

  const list = $('#notifList');
  list.innerHTML = '';

  if (state.notifications.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'item';
    empty.innerHTML = `<div class="item-top"><div style="display:grid;gap:4px;"><strong>No notifications</strong><span>You're all caught up</span></div><span class="badge">0</span></div>`;
    list.appendChild(empty);
    return;
  }

  state.notifications.slice(0, 40).forEach(n => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
          <div class="item-top">
            <div style="display:grid;gap:4px;">
              <strong>${escapeHtml(n.title)}</strong>
              <span>${escapeHtml(n.message)} • ${escapeHtml(formatDate(n.createdAt))}</span>
            </div>
            <span class="badge ${n.read ? '' : 'warn'}">${n.read ? 'READ' : 'NEW'}</span>
          </div>
          <div class="item-actions">
            <button class="btn" type="button" data-act="toggle" data-id="${escapeHtml(n.id)}"><i class="fas fa-check"></i> ${n.read ? 'Unread' : 'Mark read'}</button>
            <button class="btn danger" type="button" data-act="del" data-id="${escapeHtml(n.id)}"><i class="fas fa-trash"></i> Delete</button>
          </div>
        `;
    list.appendChild(el);
  });

  list.querySelectorAll('button[data-act]').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');
      const idx = state.notifications.findIndex(x => x.id === id);
      if (idx < 0) return;
      if (act === 'toggle') state.notifications[idx].read = !state.notifications[idx].read;
      if (act === 'del') state.notifications.splice(idx, 1);
      saveJSON(STORAGE.notifications, state.notifications);
      refreshNotifications();
    });
  });
}

async function refreshMaintenance() {
  try {
    const token = await getAuthToken();
    if (token) {
      if (!state.ownerId) {
        const leaseRes = await fetch('/api/leases', { headers: { 'Authorization': `Bearer ${token}` } });
        const leaseData = await leaseRes.json();
        if (leaseData.leases && leaseData.leases.length > 0) {
          state.ownerId = leaseData.leases[0].ownerId;
          saveJSON('rentiva_tenant_owner_id', state.ownerId);
        }
      }

      const res = await fetch('/api/maintenance', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.tickets) {
        state.maintenance = data.tickets;
        saveJSON(STORAGE.maintenance, state.maintenance);
      }
    }
  } catch (err) {
    console.error('Maintenance fetch error:', err);
  }

  const maintCount = $('#maintCount');
  if (maintCount) maintCount.textContent = String(state.maintenance.length);
  const openCount = state.maintenance.filter(r => r.status !== 'resolved' && r.status !== 'Resolved').length;
  const maintOpen = $('#maintOpen');
  if (maintOpen) maintOpen.textContent = String(openCount);
  const badgeMaint = $('#badgeMaint');
  if (badgeMaint) badgeMaint.textContent = String(openCount);

  const list = $('#maintList');
  if (!list) return;
  list.innerHTML = '';

  if (state.maintenance.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'item';
    empty.innerHTML = `<div class="item-top"><div style="display:grid;gap:4px;"><strong>No requests</strong><span>Raise an issue if needed</span></div><span class="badge">--</span></div>`;
    list.appendChild(empty);
    return;
  }

  state.maintenance.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).forEach(r => {
    const el = document.createElement('div');
    el.className = 'item';
    const status = (r.status || 'open').toLowerCase();
    const badgeClass = status === 'resolved' ? 'success' : (status === 'in_progress' ? 'warn' : '');
    const displayStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    el.innerHTML = `
          <div class="item-top">
            <div style="display:grid;gap:4px;">
              <strong>${escapeHtml(r.title || r.category)}</strong>
              <span>${escapeHtml(formatDate(r.createdAt))}</span>
            </div>
            <span class="badge ${badgeClass}">${escapeHtml(displayStatus)}</span>
          </div>
          <div style="color:var(--muted); font-size:12px; font-weight:800;">${escapeHtml(r.description)}</div>
          ${r.image ? `<img src="${escapeHtml(r.image)}" alt="Request image" style="width:100%; border-radius:14px; border:1px solid var(--border);" />` : ''}
          <div class="split">
            <div class="field">
              <label>Category</label>
              <div style="font-size:13px; font-weight:700; color:var(--primary);">${escapeHtml(r.category)}</div>
            </div>
            <div class="field" style="text-align:right;">
              <label>Actions</label>
              <button class="btn danger" type="button" data-act="del" data-id="${escapeHtml(r.id)}"><i class="fas fa-trash"></i> Cancel</button>
            </div>
          </div>
        `;
    list.appendChild(el);
  });

  list.querySelectorAll('button[data-act="del"]').forEach(btn => {
    btn.addEventListener('click', async function () {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to cancel this request?')) return;
      try {
        const token = await getAuthToken();
        const res = await fetch(`/api/maintenance/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Delete failed');
        state.maintenance = state.maintenance.filter(x => x.id !== id);
        saveJSON(STORAGE.maintenance, state.maintenance);
        refreshMaintenance();
        toast('Cancelled', 'Maintenance request removed.', 'warning');
      } catch (err) {
        console.error('Delete maintenance error:', err);
        toast('Error', 'Failed to cancel request.', 'danger');
      }
    });
  });
}

function currentMonthExpenses() {
  const now = new Date();
  return state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
}

function refreshExpenses() {
  const now = new Date();
  $('#expMonth').textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const list = $('#expenseList');
  list.innerHTML = '';

  const monthItems = currentMonthExpenses().slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  $('#expCount').textContent = String(monthItems.length);

  const total = monthItems.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  $('#expTotal').textContent = formatMoney(total).replace('.00', '');
  $('#badgeExp').textContent = formatMoney(total).replace('.00', '');
  $('#expSummaryHint').textContent = monthItems.length ? 'Track and optimize utilities month by month.' : 'Add your first utility expense.';

  if (monthItems.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'item';
    empty.innerHTML = `<div class="item-top"><div style="display:grid;gap:4px;"><strong>No expenses</strong><span>Add utilities to see insights</span></div><span class="badge">--</span></div>`;
    list.appendChild(empty);
  } else {
    monthItems.forEach(e => {
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
            <div class="item-top">
              <div style="display:grid;gap:4px;">
                <strong>${escapeHtml(e.category)} • ${escapeHtml(formatMoney(e.amount))}</strong>
                <span>${escapeHtml(new Date(e.date).toLocaleDateString())}${e.note ? ` • ${escapeHtml(e.note)}` : ''}</span>
              </div>
              <button class="btn danger" type="button" data-id="${escapeHtml(e.id)}"><i class="fas fa-trash"></i> Delete</button>
            </div>
          `;
      list.appendChild(el);
    });

    list.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-id');
        state.expenses = state.expenses.filter(x => x.id !== id);
        saveJSON(STORAGE.expenses, state.expenses);
        refreshExpenses();
        refreshDashboard();
      });
    });
  }

  const byCat = new Map();
  monthItems.forEach(e => byCat.set(e.category, (byCat.get(e.category) || 0) + Number(e.amount || 0)));
  const breakdown = $('#expenseBreakdown');
  breakdown.innerHTML = '';
  const pairs = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]);
  if (pairs.length) {
    pairs.forEach(([cat, amt]) => {
      const pct = total > 0 ? clamp((amt / total) * 100, 0, 100) : 0;
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
            <div class="item-top">
              <div style="display:grid;gap:4px;">
                <strong>${escapeHtml(cat)}</strong>
                <span>${escapeHtml(formatMoney(amt))} • ${pct.toFixed(0)}%</span>
              </div>
              <span class="badge">${pct.toFixed(0)}%</span>
            </div>
            <div class="progress"><div style="width:${pct}%;"></div></div>
          `;
      breakdown.appendChild(el);
    });
  }
}

async function createPayment(amount, method, note) {
  const { monthKey, rent, due } = totals();
  const amt = parseAmount(amount);
  if (amt <= 0) {
    toast('Invalid amount', 'Enter a valid payment amount.', 'warning');
    return null;
  }
  if (rent > 0 && amt > rent * 2) {
    toast('Too large', 'Amount seems unusually high. Please verify.', 'warning');
    return null;
  }

  // If not UPI/Bank (i.e Cash/Other), keep the old local tracking logic
  if (method !== 'UPI' && method !== 'Bank') {
    const afterDue = Math.max(0, due - amt);
    const status = afterDue <= 0 && rent > 0 ? 'paid' : 'pending';
    const entry = {
      id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      monthKey,
      amount: amt,
      method,
      note: note || '',
      status
    };
    entry.receiptHtml = makeReceiptHtml(entry);

    state.payments.push(entry);
    saveJSON(STORAGE.payments, state.payments);

    updateReceiptCard(entry);
    if (state.notifSettings.confirmAlerts === 'on') {
      addNotification('payment', 'Payment confirmed', `${formatMoney(amt)} recorded for ${monthKey}`);
    }

    refreshDashboard();
    refreshHistory();
    ensureReminders();
    toast('Payment saved', `Receipt generated for ${formatMoney(amt)}`, 'success');
    return entry;
  }

  // --- Razorpay Integration Flow ---
  const btn = $('#payForm button[type="submit"]');
  const ogText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;

  try {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication token missing. Please re-login.");

    if (!state.ownerId) {
        // Attempt to fetch lease/owner info if missing
        const leaseRes = await fetch('/api/leases', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const leaseData = await leaseRes.json();
        if (leaseData.leases && leaseData.leases.length > 0) {
            state.ownerId = leaseData.leases[0].ownerId;
        } else {
            throw new Error("No active lease found. You cannot pay rent without a lease.");
        }
    }

    // 1. Create Order on Backend
    const orderRes = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
          amountPaise: Math.round(amt * 100), 
          ownerId: state.ownerId,
          monthKey: monthKey,
          note: note 
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

    // 2. Initialize Razorpay SDK
    const options = {
      key: orderData.keyId, 
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'RENTIVA.ai',
      description: `Rent Payment for ${monthKey}`,
      order_id: orderData.orderId,
      handler: async function (response) {
        // 3. Verify Payment on Backend
        try {
          toast('Verifying', 'Verifying payment with server...', 'info');
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

          // Success - Save to local state for UI rendering
          const entry = {
            id: verifyData.paymentId,
            createdAt: new Date().toISOString(),
            monthKey,
            amount: amt,
            method: 'Razorpay (' + (verifyData.method || 'Online') + ')',
            note: note || '',
            status: 'paid'
          };
          entry.receiptHtml = makeReceiptHtml(entry);
          state.payments.push(entry);
          saveJSON(STORAGE.payments, state.payments);

          updateReceiptCard(entry);
          if (state.notifSettings.confirmAlerts === 'on') {
            addNotification('payment', 'Payment confirmed', `Razorpay transfer of ${formatMoney(amt)} successful.`);
          }

          refreshDashboard();
          refreshHistory();
          ensureReminders();
          toast('Payment Successful', `Receipt generated for ${formatMoney(amt)}`, 'success');

          $('#payAmount').value = '';
          $('#payNote').value = '';

        } catch (err) {
          console.error('Verify error:', err);
          toast('Verification Error', err.message, 'danger');
        } finally {
          btn.innerHTML = ogText;
          btn.disabled = false;
        }
      },
      prefill: {
        name: state.profile.name || 'Tenant',
        email: state.profile.email || 'tenant@rentiva.ai',
        contact: state.profile.phone || ''
      },
      theme: { color: '#6366f1' },
      modal: {
        ondismiss: function() {
          btn.innerHTML = ogText;
          btn.disabled = false;
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      toast('Payment Failed', response.error.description, 'danger');
    });
    rzp.open();

  } catch (err) {
    console.error('Checkout error:', err);
    toast('Error', err.message, 'danger');
    btn.innerHTML = ogText;
    btn.disabled = false;
  }
}

function refreshAll() {
  refreshDashboard();
  refreshHistory();
  refreshNotifications();
  refreshMaintenance();
  refreshExpenses();
  ensureReminders();
  tickCountdown();
}

function syncFromOwnerRecords() {
  const tenants = loadJSON('tenants', []);
  const records = loadJSON('rentRecords', {});
  const name = String(state.profile.name || '').trim();

  if (!Array.isArray(tenants) || tenants.length === 0) {
    toast('Sync unavailable', 'No owner tenant records found in this browser.', 'warning');
    return;
  }

  const match = tenants.find(t => String(t.name || '').trim().toLowerCase() === name.toLowerCase());
  if (!match) {
    toast('No match', 'Update your profile name to match owner tenant name, then sync again.', 'warning');
    return;
  }

  state.profile.rent = Number(match.rent || state.profile.rent || 0);
  saveJSON(STORAGE.profile, state.profile);

  const monthKey = getCurrentMonthKey();
  const monthRecords = records?.[monthKey] || [];
  const rec = Array.isArray(monthRecords) ? monthRecords.find(r => String(r.tenantName || '').trim().toLowerCase() === name.toLowerCase()) : null;

  if (rec && rec.status === 'paid') {
    const already = state.payments.some(p => p.monthKey === monthKey && p.method === 'Synced');
    if (!already) {
      const entry = {
        id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        monthKey,
        amount: Number(state.profile.rent || 0),
        method: 'Synced',
        note: 'Synced from owner records',
        status: 'paid'
      };
      entry.receiptHtml = makeReceiptHtml(entry);
      state.payments.push(entry);
      saveJSON(STORAGE.payments, state.payments);
      if (state.notifSettings.confirmAlerts === 'on') addNotification('payment', 'Payment synced', `${formatMoney(entry.amount)} synced for ${monthKey}`);
    }
  }

  refreshAll();
  toast('Synced', 'Updated rent info from owner records.', 'success');
}

document.addEventListener('DOMContentLoaded', function () {
  setTheme(localStorage.getItem(STORAGE.theme) || 'light');

  $('#btnLogout')?.addEventListener('click', logout);
  $('#btnTheme')?.addEventListener('click', toggleTheme);

  $('#btnOpenSidebar')?.addEventListener('click', () => $('#sidebar')?.classList.add('open'));
  $('#btnCloseSidebar')?.addEventListener('click', () => $('#sidebar')?.classList.remove('open'));

  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const view = btn.dataset.view;
      if (!view) return;
      setActiveView(view);
    });
  });

  $('#btnOpenPay')?.addEventListener('click', () => setActiveView('pay'));
  $('#btnOpenHistory')?.addEventListener('click', () => setActiveView('history'));
  $('#btnOpenHistory2')?.addEventListener('click', () => setActiveView('history'));

  $('#btnPrefillBalance')?.addEventListener('click', function () {
    const { due } = totals();
    $('#payAmount').value = due > 0 ? String(due) : '';
  });

  $('#payForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    createPayment($('#payAmount').value, $('#payMethod').value, $('#payNote').value);
  });

  $('#btnDownloadReceipt')?.addEventListener('click', function () {
    const last = state.payments.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!last) return toast('No receipt', 'Make a payment first.', 'warning');
    downloadReceipt(last);
  });

  $('#btnDownloadRecent')?.addEventListener('click', function () {
    const last = state.payments.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!last) return toast('No receipt', 'No payment found yet.', 'warning');
    downloadReceipt(last);
  });

  $('#btnDownloadDetail')?.addEventListener('click', function () {
    const p = state.payments.find(x => x.id === selectedPaymentId);
    if (!p) return toast('Select payment', 'Choose a payment entry first.', 'warning');
    downloadReceipt(p);
  });

  $('#btnDeletePayment')?.addEventListener('click', function () {
    const p = state.payments.find(x => x.id === selectedPaymentId);
    if (!p) return toast('Select payment', 'Choose a payment entry first.', 'warning');
    if (!confirm('Delete this payment entry?')) return;
    state.payments = state.payments.filter(x => x.id !== selectedPaymentId);
    saveJSON(STORAGE.payments, state.payments);
    selectedPaymentId = null;
    refreshAll();
    toast('Deleted', 'Payment entry removed.', 'warning');
  });

  $('#historyFilter')?.addEventListener('change', refreshHistory);
  $('#historySearch')?.addEventListener('input', refreshHistory);

  $('#toggleReminders')?.addEventListener('change', function () {
    state.notifSettings.reminders = this.value;
    saveJSON(STORAGE.notifSettings, state.notifSettings);
    refreshNotifications();
  });
  $('#toggleDueAlerts')?.addEventListener('change', function () {
    state.notifSettings.dueAlerts = this.value;
    saveJSON(STORAGE.notifSettings, state.notifSettings);
    refreshNotifications();
  });
  $('#toggleConfirmAlerts')?.addEventListener('change', function () {
    state.notifSettings.confirmAlerts = this.value;
    saveJSON(STORAGE.notifSettings, state.notifSettings);
    refreshNotifications();
  });
  $('#quietHours')?.addEventListener('change', function () {
    state.notifSettings.quietHours = this.value;
    saveJSON(STORAGE.notifSettings, state.notifSettings);
    refreshNotifications();
  });

  $('#btnTestNotif')?.addEventListener('click', function () {
    addNotification('test', 'Test notification', 'This is how reminders will appear.');
    toast('Notification', 'Test notification added', 'success');
  });

  $('#btnClearNotifs')?.addEventListener('click', function () {
    if (!confirm('Clear all notifications?')) return;
    state.notifications = [];
    saveJSON(STORAGE.notifications, state.notifications);
    refreshNotifications();
    toast('Cleared', 'Notifications cleared.', 'success');
  });

  $('#maintImage')?.addEventListener('change', function () {
    const file = this.files && this.files[0];
    const preview = $('#maintImagePreview');
    const img = $('#maintPreviewImg');
    if (!file) {
      if (preview) preview.style.display = 'none';
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      if (img) img.src = reader.result;
      if (preview) preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  $('#maintForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const category = $('#maintCategory').value;
    const priority = $('#maintPriority').value;
    const description = ($('#maintDesc').value || '').trim();
    const imgSrc = $('#maintPreviewImg')?.src || '';
    if (!description) return toast('Missing info', 'Please describe the issue.', 'warning');

    if (!state.ownerId) {
      // Try loading from savedId
      state.ownerId = loadJSON('rentiva_tenant_owner_id', null);
      if (!state.ownerId) {
        return toast('No Lease', 'You need an active lease to raise requests.', 'danger');
      }
    }

    try {
      const token = await getAuthToken();
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ownerId: state.ownerId,
          title: `${category.toUpperCase()} - ${priority}`,
          description,
          category: category.toLowerCase()
        })
      });

      if (!res.ok) throw new Error('Failed to submit request');
      const data = await res.json();

      state.maintenance.unshift(data.ticket);
      saveJSON(STORAGE.maintenance, state.maintenance);
      addNotification('maintenance', 'Maintenance request submitted', `${category} issue submitted.`);
      $('#maintDesc').value = '';
      $('#maintImage').value = '';
      const preview = $('#maintImagePreview');
      if (preview) preview.style.display = 'none';
      refreshMaintenance();
      toast('Submitted', 'Maintenance request sent.', 'success');
    } catch (err) {
      console.error('Submit maintenance error:', err);
      toast('Error', 'Failed to send request.', 'danger');
    }
  });

  $('#expenseForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const category = $('#expCategory').value;
    const amount = parseAmount($('#expAmount').value);
    const date = $('#expDate').value;
    const note = ($('#expNote').value || '').trim();
    if (!date) return toast('Missing date', 'Select a date.', 'warning');
    if (amount <= 0) return toast('Invalid amount', 'Enter a valid amount.', 'warning');
    const entry = {
      id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      category,
      amount,
      date,
      note
    };
    state.expenses.push(entry);
    saveJSON(STORAGE.expenses, state.expenses);
    $('#expAmount').value = '';
    $('#expNote').value = '';
    refreshExpenses();
    refreshDashboard();
    toast('Saved', 'Expense added.', 'success');
  });

  $('#profileForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = ($('#setName').value || '').trim();
    const unit = ($('#setUnit').value || '').trim();
    const rent = parseAmount($('#setRent').value);
    const dueDay = clamp(parseInt($('#setDueDay').value || '5', 10) || 5, 1, 28);
    if (!name) return toast('Missing name', 'Please enter your name.', 'warning');
    state.profile.name = name;
    state.profile.unit = unit || 'Unit';
    state.profile.rent = rent;
    state.profile.dueDay = dueDay;

    const photoFile = $('#setPhoto')?.files && $('#setPhoto').files[0];
    if (photoFile) {
      const reader = new FileReader();
      reader.onload = function () {
        state.profile.photo = reader.result;
        saveJSON(STORAGE.profile, state.profile);
        refreshAll();
        toast('Profile', 'Profile saved.', 'success');
      };
      reader.readAsDataURL(photoFile);
    } else {
      saveJSON(STORAGE.profile, state.profile);
      refreshAll();
      toast('Profile', 'Profile saved.', 'success');
    }
  });

  $('#ownerForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    state.owner.name = ($('#setOwnerName').value || '').trim() || 'Property Owner';
    state.owner.upi = ($('#setOwnerUpi').value || '').trim();
    state.owner.note = ($('#setOwnerNote').value || '').trim() || 'Rent payment';
    saveJSON(STORAGE.owner, state.owner);
    refreshDashboard();
    toast('Owner', 'Owner details saved.', 'success');
  });

  $('#btnSyncOwner')?.addEventListener('click', syncFromOwnerRecords);

  $('#btnResetAll')?.addEventListener('click', function () {
    if (!confirm('Reset all tenant-side data stored in this browser?')) return;
    localStorage.removeItem(STORAGE.profile);
    localStorage.removeItem(STORAGE.owner);
    localStorage.removeItem(STORAGE.payments);
    localStorage.removeItem(STORAGE.notifications);
    localStorage.removeItem(STORAGE.notifSettings);
    localStorage.removeItem(STORAGE.maintenance);
    localStorage.removeItem(STORAGE.expenses);
    localStorage.removeItem(STORAGE.theme);
    window.location.reload();
  });

  const now = new Date();
  const expDate = $('#expDate');
  if (expDate && !expDate.value) {
    expDate.value = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }

  $('#setName').value = state.profile.name || '';
  $('#setUnit').value = state.profile.unit || '';
  $('#setRent').value = String(state.profile.rent ?? '');
  $('#setDueDay').value = String(state.profile.dueDay ?? '');
  $('#setOwnerName').value = state.owner.name || '';
  $('#setOwnerUpi').value = state.owner.upi || '';
  $('#setOwnerNote').value = state.owner.note || '';

  refreshAll();

  const savedView = localStorage.getItem('rentiva_tenant_active_view') || 'dashboard';
  if ($(`#view-${savedView}`)) {
    setActiveView(savedView);
  } else {
    setActiveView('dashboard');
  }

  setInterval(tickCountdown, 1000);
  setInterval(ensureReminders, 60000);
});
