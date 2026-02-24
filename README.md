# Batelec II Power Interruptions Scraper

A Node.js web scraper built with Playwright that extracts power advisory announcements from the official Batelec II Area III Facebook page. The scraper uses Groq (LLM) to parse, filter, and sanitize the announcements into structured HTML advisories and sends them via email to specified recipients using Brevo.

## Features

- **Automated Scraping**: Periodically checks the Batelec II Facebook page for new power advisories.
- **Login Validation**: Securely validates the session state. Can be configured to require a logged-in state or proceed without authentication depending on the `TYPE` setting.
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
# Facebook Account Credentials (for reference or state generation)
USER=your_facebook_email_or_phone
PASSWORD=your_facebook_password

BREVO_API_KEY=your_brevo_api_key
GROQ_API_KEY=your_groq_api_key
# GEMINI_API_KEY=your_gemini_api_key # Optional: If using the alternative sanitizeResults_OA.js
SUPABASE_URL=your_supabase_url # Optional: For storing advisories to avoid duplicates and resending same advisories everyday until end of schedule
SUPABASE_ANON_KEY=your_supabase_anon_key # Optional: For Supabase project

# Comma-separated list of target places to filter advisories by
PLACES=Darasa,Malvar,Tanauan

# Comma-separated list of recipient emails
RECIPIENTS=user1@gmail.com,user2@gmail.com

# Primary email for system reports and failure logs
PRIMARY_RECIPIENT=admin@gmail.com

# Authentication Type: AUTH or UNAUTH
# UNAUTH allows the scraper to run without a valid Facebook session.
# AUTH requires a valid session; otherwise, it sends a failure notification.
TYPE=UNAUTH
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

## Facebook Scraper Account Setup

To use this scraper reliably, it is recommended to create a dedicated Facebook account.

1. **Create a Dedicated Account**: Use a new email address and avoid using your personal phone number if possible to prevent account linking.
2. **Minimal Profile**: Set up a basic profile but avoid adding friends or posting personal content to reduce the risk of being flagged as a bot.
3. **Session State Generation**:
   Instead of logging in every time the script runs (which triggers bot detection), this project uses a `state.json` file to save your session.
   - Run the state generator:
     ```bash
     node state_generator.js
     ```
   - A browser window will open. Log in to Facebook manually.
   - Once logged in, the script will wait for you to reach the home screen and then save your session state to `state.json`.
   - The main scraper (`index.js`) will then use this file to browse "logged in" without needing to enter credentials.

4. **Update Credentials**: While the scraper uses `state.json` for active runs, keep your `USER` and `PASSWORD` in the `.env` file for your own reference or for future automation updates.

## Automation Setup

This project includes a `.github/workflows/batelec_scraper.yml` workflow file. To enable automated running:

1. Push the code to a private GitHub repository.
2. Go to your repository **Settings > Secrets and variables > Actions**.
3. Add the following repository secrets mapping exactly to the `.env` requirements:
   - `ENVIRONMENT`
   - `BREVO_API_KEY`
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PLACES`
   - `RECIPIENTS`
   - `PRIMARY_RECIPIENT`
   - `TYPE`

## Tech Stack

- **Web Scraping:** Playwright, Puppeteer Extra Stealth Plugin
- **AI/LLM Processing:** Groq SDK (`llama-3.3-70b-versatile`)
- **Mailing Service:** Brevo
- **Scripting:** ES6+ JavaScript (Node.js)

## License

This project is proprietary. All rights reserved. Unauthorized copying, distribution, or use is strictly prohibited.
