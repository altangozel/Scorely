# Scorely

**A full-stack cooperative education management platform for universities, students, and employers.**

Scorely is a graduation project designed to streamline the cooperative education process—from student applications and CV evaluation to company preferences, placements, approvals, and communication.

The application connects **students, university coordinators, and employers** through role-specific dashboards and workflows, reducing the need to manage the process through disconnected forms, files, and messages.

> **Project status:** This repository contains a development snapshot of Scorely and may not reflect the latest local version of the graduation project. The application has not been independently tested end to end for this documentation.

## Key Features

### Student experience
- Register, sign in, and manage a student account.
- Submit cooperative education applications and track their approval status.
- Upload CVs for text extraction, skill identification, and rule-based evaluation.
- Upload transcripts and manage academic information.
- Browse available companies, submit ranked preferences, and view published placement results.

### University coordinator dashboard
- Manage program codes, applications, and approval workflows.
- Review candidate CVs, add evaluations, and access summary statistics.
- Create and manage participating companies.
- Calculate student-company placements and control when results become visible.
- Communicate with mentors through an in-app messaging workflow.

### Employer dashboard
- Manage a company profile, departments, and mentors.
- View assigned students and review placement approvals.
- Access a dashboard summary and exchange messages.

### Placement and CV evaluation
- **Placement engine:** Prioritizes eligible students using academic and CV-related scores, then considers ranked preferences and available company capacity. The implementation also handles alternative placements and records results within a database transaction.
- **CV processing:** Extracts text from PDF and DOCX files and uses rule-based heuristics to identify skills, estimate experience, assess education and languages, and calculate CV scores.
- **Role-based access control:** Uses JWT authentication and middleware to restrict routes by user role.

> The CV analysis in this repository is **rule-based**; it is not presented as a trained machine-learning model.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | JavaScript, React, React Router, React Bootstrap, Axios |
| Backend | Node.js, Express.js, REST APIs |
| Database | PostgreSQL, Sequelize ORM |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| File handling | Multer, pdf-parse, Mammoth |
| Other | HTML, CSS, Bootstrap |

## Architecture

```text
                  React Frontend
           (role-specific dashboards)
                         |
                   Axios / REST
                         |
                 Express.js API
            (routes and controllers)
                    /         \
         JWT / role checks     File processing
                    \         /
                 Sequelize ORM
                         |
                    PostgreSQL
```

The backend organizes business logic into controllers, routing into Express route modules, database entities into Sequelize models, and authorization into middleware.

## Project Structure

```text
Scorely/
├── scorely-backend/
│   ├── src/
│   │   ├── config/           # Database connection
│   │   ├── controllers/      # Application logic
│   │   ├── middleware/       # Authentication and role checks
│   │   ├── models/           # Sequelize models and associations
│   │   ├── routes/           # REST API endpoints
│   │   ├── utils/            # CV parsing, scoring, file helpers
│   │   ├── uploads/          # Local development uploads
│   │   └── server.js         # Express application entry point
│   └── package.json
└── scorely-frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   ├── services/
    │   └── App.js
    └── package.json
```

## Getting Started

### Prerequisites

- A recent LTS version of **Node.js** and **npm**
- **PostgreSQL** running locally
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/altangozel/Scorely.git
cd Scorely
```

> The repository is currently private; cloning requires authorized GitHub access.

### 2. Create a PostgreSQL database

Create an empty database (for example, `scorely_db`) using psql or your preferred PostgreSQL tool.

```sql
CREATE DATABASE scorely_db;
```

### 3. Configure the backend

In `scorely-backend/`, create a local `.env` file:

```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=scorely_db
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

JWT_SECRET=replace_with_a_long_random_secret
```

Use your own credentials and a unique random JWT secret. **Never commit real secrets to Git.**

Install dependencies and start the API:

```bash
cd scorely-backend
npm install
npm run dev
```

The backend defaults to `http://localhost:5000`. On startup, Sequelize attempts to synchronize the database models, and the application initializes its user roles.

### 4. Configure and start the frontend

In `scorely-frontend/`, optionally create a local `.env` file at the **frontend project root**:

```dotenv
REACT_APP_API_URL=http://localhost:5000/api
```

Then run:

```bash
cd scorely-frontend
npm install
npm start
```

The React development server normally opens at `http://localhost:3000`.

> Use **separate terminals** for the backend and frontend. Initial setup may require additional local configuration; the latest repository snapshot has not been verified as a one-command deployment.

## API Overview

The backend mounts these route groups beneath `/api`:

| Base path | Purpose |
| --- | --- |
| `/auth` | Registration, login, profile |
| `/cv` | CV upload, analysis, download, deletion |
| `/coordinator` | Coordinator CV review and statistics |
| `/program-codes` | Cooperative education program codes |
| `/internships` | Student applications and approval workflow |
| `/companies` | Company management and availability |
| `/placements` | Preferences and placement calculation |
| `/employer` | Employer profile, students, mentors, messages |
| `/transcripts` | Transcript upload and verification |
| `/messages` | Coordinator messaging |
| `/users` | Student profile and academic updates |

Some endpoints require a JWT bearer token and role-specific permissions.

## Development and Security Notes

This is an **academic project/development snapshot**, not a production security certification. Before a public release or deployment:

- Remove committed `node_modules/`, local `.env` files, and uploaded documents from version control, including sensitive historical commits as necessary.
- Rotate any secrets that may have been committed, and add appropriate `.gitignore` rules.
- Review authentication and authorization on file-download, upload, and student-record endpoints.
- Verify the complete workflow with test accounts and a sanitized database.
- Add automated tests, example data, screenshots, and a documented deployment process.

Do **not** upload real personal documents into an unreviewed deployment.

## Development Contribution

Scorely was built as a **team graduation project**. **Altan Gözel** was responsible for the majority of the frontend and backend implementation, including core workflows and application logic.

**Repository:** [github.com/altangozel/Scorely](https://github.com/altangozel/Scorely)
