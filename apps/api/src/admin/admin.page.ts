// Plain-HTML admin shell served by the API itself (no SPA build needed).
// Talks to /auth/login and /admin/* endpoints with a Bearer token from localStorage.
export const ADMIN_PAGE_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Админка — роли</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 24px 12px; min-height: 100vh;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #e8f2f8;
    background:
      radial-gradient(circle at top, rgba(83,212,107,0.16), transparent 34%),
      linear-gradient(180deg, #07111d 0%, #0d2231 30%, #081523 100%);
  }
  .wrap { max-width: 760px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 16px; }
  .card {
    border-radius: 18px; padding: 16px; margin-bottom: 12px;
    background: linear-gradient(180deg, rgba(17,49,69,0.96), rgba(10,32,46,0.96));
    border: 1px solid rgba(160,200,220,0.18);
    box-shadow: 0 22px 44px rgba(0,0,0,0.28);
  }
  label { display: block; font-size: 12px; color: #9db8c6; margin: 10px 0 4px; }
  input, select {
    width: 100%; height: 40px; padding: 0 12px; font-size: 14px;
    border-radius: 12px; border: 1px solid rgba(160,200,220,0.22);
    background: rgba(255,255,255,0.06); color: #e8f2f8; outline: none;
  }
  select option { color: #000; }
  button {
    height: 40px; padding: 0 16px; border: none; border-radius: 12px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    background: linear-gradient(180deg, #53d46b, #3caa52); color: #07210f;
  }
  button.ghost {
    background: rgba(255,255,255,0.07); color: #e8f2f8;
    border: 1px solid rgba(160,200,220,0.24);
  }
  button:disabled { opacity: 0.5; cursor: default; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  th { color: #9db8c6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
  td select { height: 32px; width: auto; min-width: 120px; }
  .row { display: flex; gap: 8px; align-items: end; flex-wrap: wrap; }
  .row > div { flex: 1; min-width: 180px; }
  .muted { color: #9db8c6; font-size: 12px; }
  .error { color: #ff8a8a; font-size: 13px; margin-top: 8px; }
  .ok { color: #6fe08a; font-size: 13px; margin-top: 8px; }
  .pill {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-size: 11px; font-weight: 700;
  }
  .pill.admin { background: rgba(255,196,87,0.16); color: #ffc457; }
  .pill.trainer { background: rgba(96,165,250,0.16); color: #7cb8ff; }
  .pill.user { background: rgba(255,255,255,0.08); color: #9db8c6; }
  #topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <div id="topbar">
    <h1>⚙️ Админка — роли пользователей</h1>
    <button class="ghost" id="logoutBtn" style="display:none">Выйти</button>
  </div>

  <div class="card" id="loginCard">
    <div class="row">
      <div>
        <label>Email</label>
        <input id="email" type="email" autocomplete="username">
      </div>
      <div>
        <label>Пароль</label>
        <input id="password" type="password" autocomplete="current-password">
      </div>
      <button id="loginBtn">Войти</button>
    </div>
    <div id="loginMsg"></div>
  </div>

  <div class="card" id="usersCard" style="display:none">
    <div class="row" style="margin-bottom:10px">
      <div>
        <label>Поиск (email или username)</label>
        <input id="search" placeholder="например, sanya">
      </div>
      <button class="ghost" id="reloadBtn">Обновить</button>
    </div>
    <table>
      <thead><tr><th>Email</th><th>Username</th><th>Роль</th><th></th></tr></thead>
      <tbody id="usersBody"></tbody>
    </table>
    <div id="usersMsg"></div>
  </div>
</div>

<script>
(function () {
  var TOKEN_KEY = 'admin_token';
  var roles = ['admin', 'trainer', 'user'];

  function el(id) { return document.getElementById(id); }
  function token() { return localStorage.getItem(TOKEN_KEY); }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { 'Content-Type': 'application/json' },
      token() ? { Authorization: 'Bearer ' + token() } : {},
      opts.headers || {}
    );
    return fetch(path, opts).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(res.status === 401 ? 'Не авторизован' : 'Нужна роль admin');
      }
      if (!res.ok) return res.json().then(function (b) { throw new Error(b.message || res.status); });
      return res.json();
    });
  }

  function setView(loggedIn) {
    el('loginCard').style.display = loggedIn ? 'none' : 'block';
    el('usersCard').style.display = loggedIn ? 'block' : 'none';
    el('logoutBtn').style.display = loggedIn ? 'inline-block' : 'none';
  }

  function renderUsers(users) {
    var body = el('usersBody');
    body.innerHTML = '';
    users.forEach(function (u) {
      var tr = document.createElement('tr');

      var tdEmail = document.createElement('td');
      tdEmail.textContent = u.email || '—';
      tr.appendChild(tdEmail);

      var tdName = document.createElement('td');
      tdName.textContent = u.username || '—';
      tr.appendChild(tdName);

      var tdRole = document.createElement('td');
      var select = document.createElement('select');
      roles.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r; o.textContent = r;
        if (u.role === r) o.selected = true;
        select.appendChild(o);
      });
      tdRole.appendChild(select);
      var pill = document.createElement('span');
      pill.className = 'pill ' + (u.role || 'user');
      pill.style.marginLeft = '8px';
      pill.textContent = u.role || 'user';
      tdRole.appendChild(pill);
      tr.appendChild(tdRole);

      var tdSave = document.createElement('td');
      var btn = document.createElement('button');
      btn.textContent = 'Сохранить';
      btn.onclick = function () {
        btn.disabled = true;
        api('/admin/users/' + u.id + '/role', {
          method: 'POST',
          body: JSON.stringify({ role: select.value })
        }).then(function () {
          pill.className = 'pill ' + select.value;
          pill.textContent = select.value;
          el('usersMsg').innerHTML = '<div class="ok">Роль обновлена: ' + (u.email || u.username) + ' → ' + select.value + '</div>';
        }).catch(function (e) {
          el('usersMsg').innerHTML = '<div class="error">' + e.message + '</div>';
        }).finally(function () { btn.disabled = false; });
      };
      tdSave.appendChild(btn);
      tr.appendChild(tdSave);

      body.appendChild(tr);
    });
    if (!users.length) {
      body.innerHTML = '<tr><td colspan="4" class="muted">Никого не найдено</td></tr>';
    }
  }

  function loadUsers() {
    var q = el('search').value.trim();
    el('usersMsg').innerHTML = '';
    api('/admin/users' + (q ? '?search=' + encodeURIComponent(q) : ''))
      .then(renderUsers)
      .catch(function (e) {
        el('usersMsg').innerHTML = '<div class="error">' + e.message + '</div>';
        if (e.message === 'Не авторизован') { localStorage.removeItem(TOKEN_KEY); setView(false); }
      });
  }

  el('loginBtn').onclick = function () {
    el('loginMsg').innerHTML = '';
    fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: el('email').value.trim(), password: el('password').value })
    }).then(function (res) {
      if (!res.ok) throw new Error('Неверный email или пароль');
      return res.json();
    }).then(function (data) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setView(true);
      loadUsers();
    }).catch(function (e) {
      el('loginMsg').innerHTML = '<div class="error">' + e.message + '</div>';
    });
  };

  el('password').addEventListener('keydown', function (e) { if (e.key === 'Enter') el('loginBtn').click(); });
  el('search').addEventListener('keydown', function (e) { if (e.key === 'Enter') loadUsers(); });
  el('reloadBtn').onclick = loadUsers;
  el('logoutBtn').onclick = function () {
    localStorage.removeItem(TOKEN_KEY);
    setView(false);
  };

  if (token()) { setView(true); loadUsers(); } else { setView(false); }
})();
</script>
</body>
</html>`;
