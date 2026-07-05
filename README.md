<div align="center">

<!-- Replace with your actual logo -->
<img src="https://via.placeholder.com/120?text=RePair" alt="RePair Logo" width="120" />

<h1>RePair — Backend API</h1>

<p><em>The robust, secure, and scalable backend services powering the RePair ecosystem. Designed to manage specialist and student data efficiently while ensuring compliance and security in handling medical-centric information.</em></p>

<br/>

<!-- Badges -->
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white&style=flat-square)
![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?logo=express&logoColor=white&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white&style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)

<br/>

**[📖 API Documentation](#-api-endpoints)** · **[🐛 Report a Bug](https://github.com/RePaIR-ORG/RePair-Backend/issues)** · **[✨ Request a Feature](https://github.com/RePaIR-ORG/RePair-Backend/issues)**

</div>

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧩 About the Project

The RePair Backend provides the core API infrastructure for the RePair ecosystem, specifically supporting the **Specialist Web UI** and future clients. Built with Node.js and Express, it provides secure authentication, data persistence via MongoDB, and specialized endpoints tailored for therapists, educators, and clinicians working with children.

> **Our core belief:** A reliable backend is the foundation of inclusive and adaptive technological solutions.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Runtime** | [Node.js](https://nodejs.org/) |
| **Framework** | [Express](https://expressjs.com/) |
| **Database** | [MongoDB](https://www.mongodb.com/) (via [Mongoose](https://mongoosejs.com/)) |
| **Authentication** | [JSON Web Tokens (JWT)](https://jwt.io/) & [Bcrypt.js](https://www.npmjs.com/package/bcryptjs) |
| **Security/Middleware**| [CORS](https://www.npmjs.com/package/cors), [Dotenv](https://www.npmjs.com/package/dotenv) |
| **Development** | [Nodemon](https://nodemon.io/) |

---

## 📡 API Endpoints

Currently, the API supports authentication functionality for Specialists.

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET`  | `/api/health` | Check for status of server | Public |
| `POST` | `/api/auth/register` | Register a new specialist | Public |
| `POST` | `/api/auth/login` | Authenticate specialist & get token | Public |
| `GET`  | `/api/auth/me` | Get current user's full profile | Private (Token required) |

*(More endpoints for Student Management and Task Assignment are under development.)*

---

## 🚀 Getting Started

Follow these steps to get a local instance of the RePair Backend running on your machine.

### Prerequisites

Make sure you have the following installed:

- **Node.js** `>= 20.x` — [Download here](https://nodejs.org/en/download)
- **MongoDB** — Ensure you have a local instance running or a MongoDB Atlas connection string.

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/RePaIR-ORG/RePair-Backend.git
cd RePair-Backend
```

**2. Install dependencies:**
```bash
npm install
```

### Environment Variables

This project requires environment variables to connect to the database and sign JWT tokens. Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Then fill in the required values in your `.env` file:

```env
# Server Port
PORT=5000

# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/repair

# JWT Secret for Auth tokens
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

> **⚠️ Important:** Never commit your `.env` file to version control.

### Running the Server

Start the development server using Nodemon (which automatically restarts upon file changes):

```bash
npm run dev
```

To run the server in production mode:

```bash
npm start
```

The server will be available at **[http://localhost:5000](http://localhost:5000)**.

---

## 📁 Project Structure

```
RePair-Backend/
├── controllers/          # Request handlers for routes
│   └── authController.js # Logic for login/registration
│
├── models/               # Mongoose schema definitions
│   └── User.js           # Specialist user schema
│
├── routes/               # API route definitions
│   └── auth.js           # Auth-related routing
│
├── middleware/           # Express middleware
│   └── authMiddleware.js # JWT verification logic
│
├── .env                  # Local environment variables (DO NOT COMMIT)
├── .env.example          # Environment variable template
├── .dockerignore         # Exclusions for Docker builds
├── Dockerfile            # Production-ready Docker configuration
├── index.js              # Application entry point and express setup
├── package.json          # Project metadata and dependencies
└── package-lock.json     # Locked dependency versions
```

---

## 📦 Available Scripts

All scripts are run from the project root using `npm run <script>`.

| Script | Command | Description |
|---|---|---|
| **`dev`** | `npm run dev` | Starts the server with `nodemon` for local development. |
| **`start`** | `npm start` | Starts the server using `node` for production. |

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. **Any contributions you make are greatly appreciated.**

1. **Fork** the repository.
2. **Create** your feature branch: `git checkout -b feature/AmazingFeature`
3. **Commit** your changes: `git commit -m 'feat: Add some AmazingFeature'`
4. **Push** to the branch: `git push origin feature/AmazingFeature`
5. **Open a Pull Request** against the `main` branch.

Please make sure to write clean code and include comments where necessary.

---

## 📄 License

Distributed under the **MIT License**.

---

<div align="center">

Made with ❤️ by the **RePaIR Team** — *Bridging learning gaps, one child at a time.*

</div>
