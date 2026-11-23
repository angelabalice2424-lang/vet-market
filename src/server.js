const path = require('path');
const express = require('express');
const session = require('express-session');
const { initDb } = require('./db');
const { formatDate, todayStr } = require('./services/slots');
const { roomUrl } = require('./services/video');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const vetRoutes = require('./routes/vet');
const adminRoutes = require('./routes/admin');

initDb();

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // EasyPanel / proxy inverso delante de la app
app.disable('x-powered-by');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cambiar-en-produccion',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '');
  res.locals.roomUrl = roomUrl;
  res.locals.formatDate = formatDate;
  res.locals.todayStr = todayStr;
  res.locals.DIAS = DIAS;
  next();
});

app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/vet', vetRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: 'No encontrado', message: 'La página que buscás no existe.' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Vet Turnos escuchando en puerto ${port}`);
});
