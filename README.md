# Secure Personal Note Vault

A small full-stack notes app where every note belongs to one account. Users register, sign in, and can only ever read, create, or delete **their own** notes.

**Stack:** FastAPI · SQLAlchemy · MariaDB · JWT (OAuth2 password flow) · bcrypt · plain HTML/CSS/JavaScript frontend

## Screenshots

| Create account | Sign in | Your vault |
|---|---|---|
| ![Create account](docs/screenshots/register.jpg) | ![Sign in](docs/screenshots/login.jpg) | ![Vault](docs/screenshots/vault.jpg) |

## Features

- **Register / sign in** with username or email (email is normalised to lowercase).
- **Passwords hashed with bcrypt** (never stored in plain text).
- **JWT access tokens** (HS256, 30-minute expiry by default) via the OAuth2 bearer scheme.
- **Per-user isolation:** notes are filtered by the logged-in user's id; deleting someone else's note returns `404`.
- **Input validation** with Pydantic: username 3–50 chars (letters, numbers, `. _ -`), password 6–72 chars, non-empty note title (max 100) and content.
- **Tables are created automatically** on startup.
- **Single-command run:** FastAPI serves both the API and the frontend.
- Interactive API docs at `/docs`.

## Project structure

```
Secure_Personal_Note_Vault/
├── backend/
│   ├── router/
│   │   ├── __init__.py
│   │   ├── auth.py            # /register, /login
│   │   └── notes.py           # /notes CRUD (create, list, delete)
│   ├── __init__.py
│   ├── config_example.py      # template config (committed)
│   ├── database.py            # engine, session, Base, get_db
│   ├── hashing.py             # bcrypt hash / verify
│   ├── main.py                # FastAPI app, CORS, static frontend
│   ├── model.py               # User and Note tables
│   ├── OAuth2.py              # get_current_user dependency
│   ├── schema.py              # Pydantic request/response models
│   └── token.py               # JWT create / verify
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── utils.js
├── .gitignore
├── requirements.txt
└── README.md
```

## Getting started

### Prerequisites

- Python 3.14.7
- MariaDB server running locally
- MariaDB Connector/C (required by the `mariadb` Python package; see the [connector install guide](https://mariadb.com/docs/server/connect/programming-languages/c/install/))

### 1. Clone and create a virtual environment

```bash
git clone <your-repo-url>
cd Secure_Personal_Note_Vault

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
pip install python-multipart
```

`python-multipart` is needed by FastAPI to read the login form (`OAuth2PasswordRequestForm`).

### 3. Create the database

```sql
CREATE DATABASE PersonalNoteDB;
USE PersonalNoteDB;
SHOW TABLES;
```

Only the empty database is needed; the `users` and `notes` tables are created on first run.

### 4. Configure

`backend/config.py` is git-ignored because it holds secrets. Create it from the template:

```bash
# Windows
copy backend\config_example.py backend\config.py
# macOS / Linux
cp backend/config_example.py backend/config.py
```

Then edit `backend/config.py` and set:

| Setting | Meaning | Default |
|---|---|---|
| `database_url` | SQLAlchemy URL, e.g. `mariadb+mariadbconnector://user:password@localhost:3306/yourDatabse name` | local root, no password |
| `secret_key` | Long random string used to sign JWTs | **change it** |
| `algorithm` | JWT algorithm | `HS256` |
| `access_token_expire_minutes` | Token lifetime | `30` |
| `sql_echo` | Log SQL statements | `False` |

Generate a strong secret key with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

If your `config.py` reads values from a `.env` file, keep that `.env` out of git too (it is already in `.gitignore`).

### 5. Run

From the project root (the folder that contains `backend/` and `frontend/`):

```bash
uvicorn backend.main:app --reload
```

- App: http://127.0.0.1:8000/
- API docs: http://127.0.0.1:8000/docs#

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Create an account (`username`, `email`, `password` as JSON). Returns `201`. |
| `POST` | `/login` | No | Form fields `username` (username **or** email) and `password`. Returns `{access_token, token_type}`. |
| `POST` | `/notes/` | Bearer | Create a note (`title`, `content`). Returns `201`. |
| `GET` | `/notes/` | Bearer | List your notes, newest first. |
| `DELETE` | `/notes/{id}` | Bearer | Delete one of your notes. `204` on success, `404` if not found or not yours. |

Send the token as `Authorization: Bearer <access_token>`.

Quick example:

```bash
curl -X POST http://127.0.0.1:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"surya", "email":"surya@example.com", "password":"secret123"}'

curl -X POST http://127.0.0.1:8000/login \
  -d "username=surya & password=secret123"
```

## Database schema

**users:** `id`, `username` (unique), `email` (unique), `password` (bcrypt hash)
**notes:** `id`, `title`, `content`, `created_at`, `user_id` → `users.id` (deleting a user deletes their notes)

## Security notes

- Passwords are hashed with bcrypt; bcrypt only uses the first 72 bytes, so passwords are capped at 72 characters.
- Never commit `backend/config.py` or `.env`. Use `config_example.py` as the shared template.
- CORS currently allows all origins (`*`) for development convenience. Restrict `allow_origins` to your real domain before deploying.
- Serve over HTTPS in production.

## Current limitations / roadmap

- No automated tests yet.
- Notes can be created, listed, and deleted, but not edited.
- No refresh tokens or password reset.
- No database migrations (tables are created with `create_all`).

## Author

**Suryansh Kumar Pathak**
[GitHub](https://github.com/Suryansh2301) · [LinkedIn](https://www.linkedin.com/in/suryansh-kumar-pathak-ba2177325/)
