# Saba Zulfiqar — Portfolio (Full Stack MERN)

A personal portfolio website for **Saba Zulfiqar** built with a static frontend
(HTML/CSS/JS) plus an **Express + MongoDB** backend and a private **admin
dashboard** for managing projects, skills, and the bio — no code editing
required to update your own content.

## Project Structure

```
project-root/
├── backend/
│   ├── config/db.js           # MongoDB connection helper
│   ├── controllers/           # Route handlers (auth, project, about, skill)
│   ├── middleware/            # JWT auth + image upload (multer)
│   ├── models/                # Mongoose models (Admin, Project, About, Skill)
│   ├── routes/                # Express routers
│   ├── .env.example           # Template for your secrets (copy to .env)
│   ├── package.json
│   ├── seed.js                # Optional: fills the DB with starter content
│   └── server.js              # Express app entry point
├── public/
│   ├── admin/
│   │   ├── admin.css          # Admin styling
│   │   ├── admin.js           # Login + dashboard logic
│   │   ├── dashboard.html     # Manage projects / about / skills
│   │   └── login.html         # Admin sign-in page
│   ├── index.html             # Public website
│   ├── script.js              # Public site interactions + API fetching
│   └── styles.css             # Public site styling
└── uploads/                   # Uploaded project images (created automatically)
```

## Prerequisites

- Node.js 18+ (tested on Node 24)
- A free MongoDB Atlas account

## Setup — step by step

### 1. Get your MongoDB Atlas connection string

1. Go to <https://cloud.mongodb.com> and log in (or sign up — it's free).
2. **Create a cluster** (choose the free M0 tier).
3. In **Database Access**, create a database user and save the username/password.
4. In **Network Access**, add your IP (or `0.0.0.0/0` to allow anywhere for a demo).
5. Click **Connect → Drivers → Node.js** and copy the connection string.
   It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/
   ```
6. Append your database name at the end, e.g.:
   ```
   mongodb+srv://saba:myPassword123@cluster0.xxxxx.mongodb.net/portfolio
   ```

### 2. Configure the backend environment

From the `backend` folder:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `backend/.env` and fill in:

| Variable          | What to put                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `MONGO_URI`       | Your Atlas connection string from step 1 (with `<password>` replaced).       |
| `JWT_SECRET`      | A long random string. Generate one: `openssl rand -base64 48` (or any random text 50+ chars). |
| `ADMIN_USERNAME`  | Your admin login username (default `admin`).                                 |
| `ADMIN_PASSWORD`  | Your admin login password — change this!                                     |

> The admin account is created automatically from these values the first time
> the server starts. If you later change `.env` values the account will **not**
> update automatically — edit it directly in MongoDB instead.

### 3. Install dependencies and run

```bash
cd backend
npm install
```

Optional — fill the database with starter content (admin, about, 8 skills, 3 sample projects):

```bash
npm run seed
```

Start the server:

```bash
npm start
# or, while developing with auto-restart:
npm run dev
```

You should see:

```
🚀 Server running at http://localhost:5000
   Public site :  http://localhost:5000
   Admin login :  http://localhost:5000/admin/login.html
```

### 4. Use it

- **Public site** — <http://localhost:5000> loads Projects, Skills, and About
  dynamically from the API. If the backend is not running it gracefully falls
  back to built-in demo content.
- **Admin dashboard** — <http://localhost:5000/admin/login.html>
  Sign in with the username/password from `backend/.env`, then add/edit/delete
  projects (with image upload or URL), update your bio, and manage skill bars.

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint             | Access | Description                          |
| ------ | -------------------- | ------ | ------------------------------------ |
| POST   | `/auth/login`        | Public | Returns a JWT token                  |
| GET    | `/auth/verify`       | Admin  | Checks if a token is still valid     |
| GET    | `/projects`          | Public | List all projects                    |
| POST   | `/projects`          | Admin  | Create a project (multipart, image optional) |
| PUT    | `/projects/:id`      | Admin  | Update a project                     |
| DELETE | `/projects/:id`      | Admin  | Delete a project                     |
| GET    | `/about`             | Public | Get the About document               |
| PUT    | `/about`             | Admin  | Update About/contact info (upsert)   |
| GET    | `/skills`            | Public | List all skills                      |
| POST   | `/skills`            | Admin  | Add a skill                          |
| PUT    | `/skills/:id`        | Admin  | Update a skill                       |
| DELETE | `/skills/:id`        | Admin  | Delete a skill                       |
| POST   | `/contact`           | Public | Emails a contact-form message to you |

Admin endpoints require the header: `Authorization: Bearer <JWT-token>`.

## Contact form emails (Nodemailer → Gmail)

The contact form at the bottom of the site posts to `POST /api/contact`.
The backend sends an email to **sabazulfiqar926@gmail.com** with the
visitor's name, email and message, and sets `replyTo` to the visitor's
address so you can simply hit Reply in Gmail.

### Generating a Gmail App Password (EMAIL_PASS)

Gmail will not accept your normal password for SMTP. You need an
**App Password**:

1. Go to <https://myaccount.google.com/security> and sign in with the
   account you want to receive emails on (sabazulfiqar926@gmail.com).
2. Turn **ON** *2-Step Verification* (App Passwords require it).
3. Go to <https://myaccount.google.com/apppasswords>.
4. In "App name" type something like `portfolio` and click **Create**.
5. Copy the 16-character password Google shows (e.g. `abcd efgh ijkl mnop`).
6. Paste it into `EMAIL_PASS` in `backend/.env` (spaces are fine).

### .env variables for email

| Variable      | What to put                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `EMAIL_USER`  | The sending Gmail address (usually `sabazulfiqar926@gmail.com`).        |
| `EMAIL_PASS`  | The 16-character Gmail **App Password** from the steps above.            |
| `EMAIL_TO`    | Where messages are delivered. Leave blank to use `EMAIL_USER`.           |

If these are not set, the server still starts — the contact form simply
shows a friendly error asking visitors to email you directly. A copy of
every message is also saved to MongoDB (`ContactMessage` collection).

## Deploying later (notes)

- **Render/Railway**: point the start command at `backend/server.js`, set the
  environment variables from `backend/.env`, and make sure the static files in
  `public/` and `uploads/` are bundled too.
- **Vercel/Netlify** can host the static `public/` folder alone (the site will
  show demo content when the API is unreachable).

## Security notes

- The JWT is stored in `localStorage` on the admin browser — fine for a
  personal dashboard, not ideal for high-security public apps.
- `uploads/` is not authenticated; image URLs are public by design.
- Never commit `backend/.env` — it is in `.gitignore`.

## Learn more

- [Express.js](https://expressjs.com)
- [Mongoose docs](https://mongoosejs.com/docs/)
- [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- [JSON Web Tokens](https://jwt.io)