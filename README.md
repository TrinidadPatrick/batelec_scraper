# Batelec II Power Interruptions Scraper

A Node.js web scraper built with Playwright that extracts power advisory announcements from the official Batelec II Area III Facebook page. The scraper uses Groq (LLM) to parse, filter, and sanitize the announcements into structured HTML advisories and sends them via email to specified recipients using Brevo.

## Features
- **Automated Scraping**: Periodically checks the Batelec II Facebook page for new power advisories.
- **Smart Filtering**: Filters advisories based on predefined locations (e.g., specific barangays or municipalities).
- **Date Matching**: Automatically drops outdated announcements to only notify you about today's or future interruptions.
- **LLM-Powered Formatting**: Uses Groq LLMs to format raw Facebook text into clean, easy-to-read HTML templates.
- **Email Notifications**: Distributes notifications directly to a mailing list via Brevo.
- **GitHub Actions Integration**: Designed to be run automatically on a set schedule without manual intervention.

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/)
- A [Brevo](https://www.brevo.com/) API key for sending emails.
- A [Groq](https://groq.com/) API key for text processing.

### Environment Variables
Create a `.env` file in the root directory and configure the following required environment variables:

```env
ENVIRONMENT=LOCAL # Use LOCAL for headful browser testing, otherwise PROD
BREVO_API_KEY=your_brevo_api_key
GROQ_API_KEY=your_groq_api_key
# GEMINI_API_KEY=your_gemini_api_key # Optional: If using the alternative sanitizeResults_OA.js

# Comma-separated list of target places to filter advisories by
PLACES=Darasa,Malvar,Tanauan

# Comma-separated list of recipient emails
RECIPIENTS=user1@gmail.com,user2@gmail.com
```

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the scraper locally:
   ```bash
   node index.js
   ```

## Automation Setup
This project includes a `.github/workflows/batelec_scraper.yml` workflow file. To enable automated running:
1. Fork or push the code to a GitHub repository.
2. Go to your repository **Settings > Secrets and variables > Actions**.
3. Add the following repository secrets mapping exactly to the `.env` requirements:
   - `ENVIRONMENT`
   - `BREVO_API_KEY`
   - `GROQ_API_KEY`
   - `PLACES`
   - `RECIPIENTS`

## Tech Stack
- **Web Scraping:** Playwright, Puppeteer Extra Stealth Plugin
- **AI/LLM Processing:** Groq SDK (`llama-3.3-70b-versatile`)
- **Mailing Service:** Brevo
- **Scripting:** ES6+ JavaScript (Node.js)
