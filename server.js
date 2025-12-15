const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// Database setup
const db = new sqlite3.Database('./ahli_kariah.db');

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ahli_kariah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    ic TEXT NOT NULL,
    alamat TEXT,
    telefon TEXT,
    email TEXT,
    latitude REAL,
    longitude REAL,
    tarikh_daftar DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`);
  
  // Insert default users if not exist
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin', 'admin')`);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('user', 'user', 'user')`);
});

// Middleware to check login
function requireLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
app.get('/', requireLogin, (req, res) => {
  const userInfo = req.session.user ? `${req.session.user.username} (${req.session.user.role})` : 'Tidak diketahui';
  const adminLink = req.session.user && req.session.user.role === 'admin' ? '<li class="nav-item"><a class="nav-link" href="/list">Senarai Ahli Kariah</a></li>' : '';
  db.get('SELECT COUNT(*) as count FROM ahli_kariah', [], (err, row) => {
    const totalMembers = row ? row.count : 0;
    const html = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pendaftaran Ahli Kariah</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
            <div class="container">
                <a class="navbar-brand" href="/">Sistem Ahli Kariah</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item"><a class="nav-link" href="/register">Daftar Ahli Baru</a></li>
                        ${adminLink}
                    </ul>
                    <ul class="navbar-nav">
                        <li class="nav-item"><span class="navbar-text me-3">Log masuk sebagai: ${userInfo}</span></li>
                        <li class="nav-item"><a class="nav-link" href="/logout">Log Keluar</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="container mt-4">
            <h1 class="mb-4">Dashboard</h1>
            <div class="row">
                <div class="col-md-4">
                    <div class="card text-white bg-success mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Jumlah Ahli Kariah</h5>
                            <p class="card-text display-4">${totalMembers}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-white bg-info mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Aktiviti Terkini</h5>
                            <p class="card-text">Pendaftaran ahli kariah</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-white bg-warning mb-3">
                        <div class="card-body">
                            <h5 class="card-title">Notifikasi</h5>
                            <p class="card-text">Tiada notifikasi baru</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">Tindakan Cepat</div>
                        <div class="card-body">
                            <a href="/register" class="btn btn-primary me-2">Daftar Ahli Baru</a>
                            ${req.session.user && req.session.user.role === 'admin' ? '<a href="/list" class="btn btn-secondary">Lihat Senarai</a>' : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">Maklumat Sistem</div>
                        <div class="card-body">
                            <p>Versi: 1.0.0</p>
                            <p>Tarikh: ${new Date().toLocaleDateString('ms-MY')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    `;
    res.send(html);
  });
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      return res.status(500).send('Error logging in');
    }
    if (row) {
      req.session.user = row;
      res.redirect('/');
    } else {
      res.send('Invalid credentials');
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/register', requireLogin, (req, res) => {
  res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', requireLogin, (req, res) => {
  const { nama, ic, alamat, telefon, email, latitude, longitude } = req.body;
  const stmt = db.prepare('INSERT INTO ahli_kariah (nama, ic, alamat, telefon, email, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(nama, ic, alamat, telefon, email, latitude || null, longitude || null, function(err) {
    if (err) {
      return res.status(500).send('Error registering member');
    }
    res.redirect('/');
  });
  stmt.finalize();
});

app.get('/list', requireLogin, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.send('Access denied');
  }
  db.all('SELECT * FROM ahli_kariah', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving members');
    }
    let listItems = '';
    rows.forEach(row => {
      listItems += `<li class="list-group-item">${row.nama} - ${row.ic} - ${row.alamat} - ${row.telefon} - ${row.email}</li>`;
    });
    const html = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Senarai Ahli Kariah</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.datatables.net/1.13.4/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
            <div class="container">
                <a class="navbar-brand" href="/">Sistem Ahli Kariah</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item"><a class="nav-link" href="/register">Daftar Ahli Baru</a></li>
                        <li class="nav-item"><a class="nav-link active" href="/list">Senarai Ahli Kariah</a></li>
                        <li class="nav-item"><a class="nav-link" href="/">Dashboard</a></li>
                    </ul>
                    <ul class="navbar-nav">
                        <li class="nav-item"><a class="nav-link" href="/logout">Log Keluar</a></li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="container mt-4">
            <h1 class="mb-4">Senarai Ahli Kariah</h1>
            <table id="ahli-table" class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>No. IC</th>
                        <th>Alamat</th>
                        <th>Telefon</th>
                        <th>Email</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Tarikh Daftar</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            <td>${row.nama}</td>
                            <td>${row.ic}</td>
                            <td>${row.alamat || ''}</td>
                            <td>${row.telefon || ''}</td>
                            <td>${row.email || ''}</td>
                            <td>${row.latitude || ''}</td>
                            <td>${row.longitude || ''}</td>
                            <td>${row.tarikh_daftar}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
        <script src="https://cdn.datatables.net/1.13.4/js/dataTables.bootstrap5.min.js"></script>
        <script>
            $(document).ready(function() {
                $('#ahli-table').DataTable({
                    "pageLength": 10,
                    "lengthMenu": [5, 10, 25, 50],
                    "language": {
                        "search": "Cari:",
                        "lengthMenu": "Tunjuk _MENU_ rekod per halaman",
                        "zeroRecords": "Tiada rekod ditemui",
                        "info": "Menunjukkan halaman _PAGE_ dari _PAGES_",
                        "infoEmpty": "Tiada rekod tersedia",
                        "infoFiltered": "(ditapis dari _MAX_ rekod)",
                        "paginate": {
                            "first": "Pertama",
                            "last": "Terakhir",
                            "next": "Seterusnya",
                            "previous": "Sebelumnya"
                        }
                    }
                });
            });
        </script>
    </body>
    </html>
    `;
    res.send(html);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});