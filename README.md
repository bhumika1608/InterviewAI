# InterviewAI – AI Mock Interview Simulator

InterviewAI is a local-first mock interview platform. It extracts selectable text from uploaded resumes, uses a local Ollama model to analyze the resume and generate interview questions, and uses the same model to review answers and create a session report. Voice answers use browser speech recognition when it works and fall back to local Whisper transcription when it does not.

## Current phase

The interview flow includes browser speech playback/recognition and temporary camera-frame analysis for face visibility, camera-facing direction, and additional faces. It does not record or save camera images.

## Project structure

- frontend/ – Next.js + TypeScript + Tailwind UI
- backend/ – Django REST API project
- README.md – project overview and setup instructions

## Tech stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Lucide React
- Backend: Python, Django, Django REST Framework
- Database: SQLite
- AI: Local Ollama model; there is no canned-question or offline-review fallback
- Resume parsing: PyMuPDF, python-docx

## Getting started

1. Install Node.js 18+ and Python 3.12 (recommended for compatibility with local ML packages)
2. Set up the frontend and backend as described below
3. Run both services locally

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:3000 by default.

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend runs on http://localhost:8000 by default.

## Local AI setup

Install Ollama, then download the configured model and start its local service:

```bash
ollama pull qwen2.5:3b
ollama serve
```

Copy `backend/.env.example` to `backend/.env` if you need to change the default Ollama URL or model. Interview creation and reviews return an error when the local model is unavailable; the app does not substitute prewritten questions or feedback.

## Resume and camera notes

- PDF extraction analyzes all selectable page text. Image-only scanned PDFs are rejected with a readable-text error; OCR is not configured.
- Camera frames are sent to the local backend for transient MediaPipe analysis. Only aggregate counts are saved with the interview; image data is not persisted.
- Mic audio is recorded only for the current answer and sent to the local backend only when browser transcription failed. Local Whisper converts it to text; the audio file is deleted after processing and is not saved with the report.
- The first Whisper fallback downloads the `base.en` model into the local Hugging Face cache and can take longer than later answers.
- Camera checks can flag missing or additional faces and tab visibility changes. A browser cannot verify that a person is not consulting another physical device, so these checks are deterrents, not proof of identity or cheating.
- Camera-facing direction is a rough presentation signal, not an emotion or personality assessment.

## Free public demo from your own computer

The app uses local Ollama. A free public link can keep working with Ollama by running the frontend, backend, and model on your own computer and exposing only the Next.js frontend through a temporary Cloudflare Quick Tunnel. Your computer, Ollama, and all three services must remain running. This is for a limited demo, not reliable production hosting; the link changes when the tunnel restarts.

The browser sends API calls to the same origin as the frontend. Next.js proxies `/api/*` to Django, so the backend port is not exposed directly. AI generation endpoints require a signed-in user. Restrict the tunnel to your own email address; anyone who passes the tunnel's email check can still create an account and use the app.

1. Install Ollama and Cloudflare's `cloudflared` CLI. Download the configured model and confirm it is available:

   ```powershell
   ollama pull qwen2.5:3b
   ollama list
   ```

2. Set up the backend dependencies and local environment. Keep `backend/.env` private and do not commit it:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   Copy-Item .env.example .env
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

   Put the generated key in `backend/.env`, then set `DEBUG=False`, `ALLOW_TRYCLOUDFLARE=True`, `CSRF_COOKIE_SECURE=True`, `SESSION_COOKIE_SECURE=True`, and `TRUST_X_FORWARDED_PROTO=True`. Keep the example's `ALLOWED_HOSTS=localhost,127.0.0.1`; Django adds the Quick Tunnel host when enabled. The development `SECRET_KEY` fallback is disabled when `DEBUG=False`.

3. In a backend terminal, migrate and start Django on loopback only:

   ```powershell
   python manage.py migrate
   waitress-serve --host=127.0.0.1 --port=8000 config.wsgi:application
   ```

4. In another terminal, build and start Next.js. Its default API proxy target is `http://127.0.0.1:8000`; change `BACKEND_URL` only if Django listens elsewhere:

   ```powershell
   cd frontend
   npm install
   Copy-Item .env.example .env.local
   npm run build
   npm start
   ```

5. In a third terminal, start an email-restricted temporary tunnel to the frontend. Replace the example address with your own:

   ```powershell
   cloudflared tunnel --url http://127.0.0.1:3000 --allowed-mail your-email@example.com
   ```

   Open the `https://...trycloudflare.com` URL printed by the command and complete the email PIN check. Stop the tunnel when you are done. Do not share the link publicly.

For regular or long-term production use, use a managed host and a managed AI service or a server with sufficient resources for Ollama. Cloudflare Quick Tunnels are temporary and do not provide an uptime guarantee.
