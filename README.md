# AI Learning OS

This is a React + TypeScript application powered by Vite and Express.

## Local Development

### Prerequisites

- Node.js (v18 or later recommended)
- npm

### Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Configure environment variables:**

    Copy `.env.example` to `.env` and fill in the required values.

    ```bash
    cp .env.example .env
    ```

    -   `GEMINI_API_KEY`: Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
    -   `APP_URL`: Set to `http://localhost:3000` for local development.
    -   `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Optional, only if using Supabase features.

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Netlify

1.  **Fork/Push to GitHub:**
    Push your code to a GitHub repository.

2.  **Import to Netlify:**
    -   Log in to Netlify.
    -   Click "Add new site" -> "Import an existing project".
    -   Select your GitHub repository.

3.  **Configure Build Settings:**
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`

4.  **Set Environment Variables:**
    In "Site settings" -> "Build & deploy" -> "Environment", add:
    -   `GEMINI_API_KEY`: Your Gemini API key.
    -   `VITE_SUPABASE_URL`: (Optional) Your Supabase URL.
    -   `VITE_SUPABASE_ANON_KEY`: (Optional) Your Supabase Anon Key.

5.  **Deploy:**
    Click "Deploy site".

## Project Structure

-   `src/`: Frontend source code (React)
-   `server.ts`: Backend server (Express)
-   `vite.config.ts`: Vite configuration
