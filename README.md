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

## Troubleshooting

### Local Development Issues

-   **"GEMINI_API_KEY is missing":**
    Ensure you have created a `.env` file in the root directory (copy from `.env.example`) and added your key.
    
-   **"Port 3000 already in use":**
    Change the port in `.env` or kill the process using port 3000.

-   **"tsx: command not found":**
    Run `npm install` again to ensure all dependencies are installed.

### Netlify Deployment Issues

-   **"Build failed":**
    Check the Netlify build logs. Ensure you have set the `GEMINI_API_KEY` in Netlify's **Site settings > Build & deploy > Environment variables**.

-   **"Page not found" on refresh:**
    Ensure the `netlify.toml` file exists in your repository. It handles the redirects for the Single Page Application.

-   **"AI Quota Exceeded":**
    This means your Gemini API key has hit its rate limit. This is common on free tiers. Wait a few minutes or upgrade your plan.

## Project Structure

-   `src/`: Frontend source code (React)
-   `server.ts`: Backend server (Express)
-   `vite.config.ts`: Vite configuration
