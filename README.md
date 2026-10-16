# Yashnu Creative — Flask website with email enquiries

## Run locally

1. Install Python 3.10 or newer.
2. Open a terminal in this `brandstudio_flask` folder.
3. Install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
4. Copy `.env.example` to a new file named `.env`.
5. In `.env`, replace `PASTE_YOUR_16_CHARACTER_GOOGLE_APP_PASSWORD_HERE` with a Google App Password for `yashnucreative@gmail.com`. Keep `.env` private and do not upload it to public repositories.
6. Start the app:
   ```bash
   python app.py
   ```
7. Open `http://127.0.0.1:5000` and submit a test enquiry.

## Gmail setup

The configured sending and receiving address is `yashnucreative@gmail.com`. Enable 2-Step Verification on that Google account, then create an App Password in Google Account security settings. Use that App Password in `SMTP_PASSWORD`; do not use the normal Gmail password. The website sends each enquiry to the configured `CONTACT_RECEIVER`.

## What happens to enquiries

- Flask validates the form and saves each enquiry in `brandstudio.db` (SQLite).
- Flask attempts to email the enquiry using Gmail SMTP.
- The contact form displays whether email delivery succeeded. If email is not configured or delivery fails, the enquiry is still saved in the local database.

For a public website, deploy the Flask app on a server that remains online and set the same environment variables securely in the hosting provider's settings. The local address `127.0.0.1` is only accessible on your own computer.
