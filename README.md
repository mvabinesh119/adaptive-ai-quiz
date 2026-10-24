# Adaptive AI Quiz — PDF-grounded edition

A beginner-friendly learning app built with **React + Vite**, **Express**, and **Gemini**. It adapts quiz difficulty to the learner and can now generate questions grounded in an uploaded, text-searchable PDF.

## What is included

- Upload a PDF containing lecture notes, textbook content, or revision material.
- Extract selectable text from the PDF on the backend.
- Generate multiple-choice questions using Gemini with a **source-only instruction** so the question, options, and explanation should be supported by the uploaded material.
- Show a short supporting excerpt alongside each PDF-grounded question.
- Keep the existing adaptive quiz, explanations, accuracy tracking, and topic mastery features.
- Keep the Gemini API key on the Express server, never in frontend code.

## Requirements

- Windows 10/11
- Node.js 20 or newer recommended (install the LTS release from https://nodejs.org/)
- A Gemini API key for AI-generated questions. Demo questions still work without a key, but **PDF-grounded quiz generation requires a key**.

## Windows setup (step by step)

### 1. Extract the ZIP

Extract `adaptive-ai-quiz-updated.zip` to a folder such as:

`C:\Users\YOUR_NAME\Downloads\adaptive-ai-quiz`

Open that folder. It should contain `package.json`, `client`, and `server`.

### 2. Open a terminal in the project folder

In File Explorer, open the extracted folder, click the address bar, type `cmd`, and press Enter. Alternatively, open VS Code in this folder and choose **Terminal → New Terminal**.

Check Node and npm are installed:

```powershell
node -v
npm -v
```

### 3. Install dependencies

Run these commands from the **project root** (the folder containing the top-level `package.json`):

```powershell
npm install
npm run install:all
```

Wait for both commands to finish. You only need to install dependencies again if you download a new version of the project or change its dependencies.

### 4. Add your Gemini API key

1. Open `server` inside the project folder.
2. Copy `.env.example` and name the copy `.env` (make sure Windows does not name it `.env.txt`).
3. Open `server/.env` in Notepad or VS Code and set your key:

```env
GEMINI_API_KEY=paste_your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=5000
```

Save the file. Do not share the key or put it in `client` files. If you already have a working Gemini key from your other project, you can use it here, subject to that key's quota and access.

### 5. Start the app

From the project root, run:

```powershell
npm run dev
```

Keep this terminal open while using the app. The terminal runs both the backend and frontend.

Open these addresses in your browser:

- App: http://localhost:5173
- Backend health check: http://localhost:5000/api/health

To stop the app, click the terminal and press `Ctrl + C`.

## How to create a quiz from a PDF

1. Start the app and confirm the Gemini key is configured.
2. On the Adaptive Quiz page, click **Upload PDF**.
3. Select a PDF with selectable text. The upload limit is **10 MB**.
4. Wait for the app to extract the text and prepare the first question.
5. Answer the question, check the explanation and supporting excerpt, then click **Next question** to continue.
6. Click **Remove PDF** to switch back to the built-in demo questions. Uploading a new PDF starts a fresh quiz session.

## Important notes and limitations

- The parser extracts text; scanned/image-only PDFs generally need OCR before upload. If extraction finds too little text, the app will show an error rather than silently making a quiz from unrelated sample questions.
- For very long documents, the app stores up to 100,000 extracted characters and sends the first 30,000 characters to Gemini for each question. The UI indicates when the prompt is using only an excerpt.
- Uploaded text is kept in server memory for this local starter and is cleared when the server restarts. Up to 10 recent uploads are retained in memory. This is not persistent storage or a production file-management system.
- Grounding is enforced through the generation prompt and a supporting excerpt, but AI output can still make mistakes. Compare questions with your notes before relying on them for exams.
- If the Gemini key is missing, invalid, out of quota, or the API is unavailable, PDF-based question generation will show an error. It deliberately does **not** fall back to unrelated demo questions while a PDF is selected.

## Adaptive quiz behavior

- Starts at Medium difficulty.
- Two correct answers in a row raise the difficulty.
- Two incorrect answers in a row lower the difficulty.
- Topic-level results are tracked and weaker topics are prioritized.

## Troubleshooting

**`npm` is not recognized** — install Node.js LTS, then close and reopen the terminal.

**`ENOENT` for `package.json`** — make sure the terminal is in the extracted project root, not inside `client` or `server`.

**Port 5000 is busy** — change `PORT` in `server/.env`, then update `API` at the top of `client/src/main.jsx` to match the new port.

**PDF says it has no text** — open the PDF and try selecting/copying a paragraph. If you cannot select text, run OCR or export a searchable PDF and upload that version.

**Gemini quota or API error** — confirm `server/.env` contains a valid key, restart `npm run dev`, and check that your Gemini API quota is available.

**Server restarts but uploaded PDF disappears** — this is expected for the in-memory starter; upload the PDF again after restarting the server.
