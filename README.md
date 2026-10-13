# Ledgerly — Personal Expense Tracker

A polished, responsive expense tracker that runs directly in your browser. Track income and expenses, see monthly totals and yearly money flow, set category budgets, search and filter entries, and export a month as CSV.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

No installation, build step, account, or server is required. The Google Fonts used for the visual design load when an internet connection is available; the app itself works offline once the files are available.

## Using the tracker

- Choose a month and display currency from the top bar. PKR is selected by default.
- Add, edit, or delete income and expense transactions. Each entry includes a description, amount, category, date, and optional note.
- Search and filter the selected month's transactions, then export that month to CSV.
- Select **Manage** in Monthly budgets to add limits for Food, Transport, Shopping, and Bills.
- The chart shows monthly income and expenses for the selected year.

Currency selection changes the displayed currency label and number formatting only; it does **not** convert amounts or exchange rates. Existing and new entries are interpreted in the currently selected currency.

## Privacy and storage

Transactions, budgets, and the selected currency are saved in this browser's local storage on this device. They are not sent to a server. Clearing this browser's site data, using a different browser or device, or opening the app in private browsing can remove or isolate saved data. Export a CSV backup if you need a portable copy.

## Project files

- `index.html` — app structure and accessible form controls
- `styles.css` — responsive dashboard styles
- `app.js` — transactions, budgets, chart, CSV export, and local storage
