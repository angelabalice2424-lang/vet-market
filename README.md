# Vet Turnos

Web simple para reservar consultas veterinarias por videollamada (Jitsi Meet) cuando no podés llevar a la mascota a una clínica.

## Qué hace

**Dueño (sin cuenta):**
- Elige veterinario, día y horario libre.
- Completa datos de la mascota, motivo y síntomas.
- Recibe por email un link de turno con el botón para entrar a la videollamada y la opción de cancelar.
- Si los síntomas describen posibles urgencias (convulsiones, dificultad para respirar, sangrado, intoxicación, etc.), la app avisa que hay que ir a una guardia presencial.

**Veterinario (login):**
- Panel con próximos turnos y botón para entrar a la sala.
- Carga de disponibilidad semanal (día, franja horaria y duración de cada turno).
- Ficha de consulta con pautas escritas, que puede marcar como realizada y enviar por email al dueño.

**Administrador (login):**
- Alta y activación/desactivación de veterinarios (cada uno con su email y contraseña).
- Listado de los últimos turnos.

## Stack

- Node.js 22, Express, EJS (sin build de frontend).
- SQLite en un archivo (`/data/vet.db`) con el módulo `node:sqlite` integrado. Sin servicios externos ni compilación nativa.
- Videollamada con Jitsi Meet (por defecto `meet.jit.si`, configurable con `JITSI_BASE_URL`).
- Email por SMTP (opcional; Hostinger funciona).

## Correrlo en local

```bash
cp .env.example .env     # completar al menos ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET
npm install              # requiere Node 22.13 o superior
npm start
```

Abrir `http://localhost:3000`. Si no configurás SMTP, los mails no se envían y aparecen en la consola.

## Despliegue en Hostinger con EasyPanel

1. **Código en GitHub.** Subí esta carpeta a un repositorio privado (sin `.env`, `node_modules` ni `data`; el `.gitignore` ya los excluye).
2. **Crear el servicio.** En EasyPanel: *Create Service → App*, origen *GitHub*, build con **Dockerfile**.
3. **Variables de entorno.** Cargá las de `.env.example`. Como mínimo:
   - `APP_NAME` = nombre de la app (por defecto `Patitas`).
   - `BASE_URL` = `https://tu-dominio` (sin barra final).
   - `SESSION_SECRET` = un texto largo y aleatorio.
   - `COOKIE_SECURE` = `true`.
   - `ADMIN_EMAIL` y `ADMIN_PASSWORD`: se crean solos la primera vez que arranca la app (si ya existe un admin, se ignoran).
   - `SMTP_*` y `MAIL_FROM` si querés enviar mails.
4. **Volumen persistente.** En *Mounts / Volumes* agregá un volumen montado en `/data`. Ahí vive la base de datos. Sin este paso, los turnos se pierden al redeployar.
5. **Dominio y HTTPS.** Asociá tu dominio o subdominio (por ejemplo `turnos.tu-dominio.com`) y activá HTTPS. Es obligatorio: los navegadores solo dan cámara y micrófono por HTTPS.
6. **Deploy.** Al terminar, entrá con la cuenta de admin, creá los veterinarios y pedíles que carguen su disponibilidad.

### Backups

Copiá `/data/vet.db` de forma periódica (por ejemplo, con un cron que descargue el archivo). Es un SQLite normal.

## Puntos a tener en cuenta antes de usarlo con pacientes reales

- **Aviso legal.** La teleconsulta orienta y da pautas; no reemplaza el examen presencial ni la urgencia. La web lo muestra en cada pantalla. Revisá la normativa de telemedicina veterinaria de tu provincia o país y que cada profesional tenga matrícula vigente.
- **Datos personales.** Se guardan nombre, email, teléfono y datos de salud de la mascota. Conviene agregar una política de privacidad y pedir consentimiento (el formulario ya pide aceptar el aviso).
- **Sesiones en memoria.** Las sesiones de login se guardan en memoria: si reiniciás el contenedor, los usuarios tienen que volver a ingresar. Los turnos no se afectan.
- **Link del turno como acceso.** El link de cada turno es secreto y funciona como clave de acceso. No lo expongas públicamente.
- **Sala de video.** Por defecto usa `meet.jit.si`. Si necesitás más control o privacidad, podés montar un Jitsi propio y cambiar `JITSI_BASE_URL`.
- **Protección CSRF.** La v1 depende de `SameSite=Lax` en las cookies. Antes de una exposición pública amplia, conviene agregar tokens CSRF en los formularios de login y panel.

## Estructura

```
src/
  server.js          Arranque de Express, sesiones y rutas
  db.js              Esquema SQLite y creación del admin inicial
  routes/            public.js (reserva), auth.js, vet.js, admin.js
  services/          slots.js (horarios libres), triage.js (señales de urgencia),
                     video.js (salas), mail.js (SMTP opcional)
  middleware/auth.js Control de acceso por rol
  views/             Plantillas EJS
public/styles.css    Estilos responsive
```
