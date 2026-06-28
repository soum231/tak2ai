# Google Apps Script — Call Reports Deployment Guide

## Step 1: Deploy the Script

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1-yPyZbO_oMcmjVf_HjP3e9WBD0Ff44fc5Da-IJvdvRQ
2. Go to **Extensions > Apps Script**
3. Delete any existing code in the editor
4. Copy the contents of `setup/google-apps-script.js` and paste it into the Apps Script editor
5. Click **Save** (Ctrl+S)
6. Click **Deploy > New deployment**
7. Select type: **Web app**
8. Description: `Tak2AI Call Reports API`
9. Execute as: **Me**
10. Who has access: **Anyone** (so Tak2AI can fetch data)
11. Click **Deploy**
12. Authorize the script when prompted (review permissions, click Allow)
13. **Copy the Web app URL** — it looks like:
    ```
    https://script.google.com/macros/s/AKfycxxxxxxxxxxxxxx/exec
    ```

## Step 2: Update Tak2AI Backend

Replace the URL in `routes/api.js` line 721:

```javascript
// OLD:
const CALL_REPORT_URL = 'https://script.google.com/macros/s/AKfycbyuz00fxXxbee2GuAzh24hkvFRWWbK-Rt0JbyGEz5zYxOPJJTKjotvHDoYAlZ1MG7KY/exec';

// NEW (replace with YOUR deployment URL):
const CALL_REPORT_URL = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec';
```

## Step 3: Access the GUI

After deployment, open the web app URL in your browser to see the Call Reports GUI with:
- Stats cards (total calls, positive/negative sentiment, duration)
- Searchable/filterable table
- Sortable columns
- Conversation viewer
- Recording links

## Step 4: Optional — Push New Reports via API

The Apps Script also supports POST requests to add new call data to the sheet:

```bash
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_name": "My Bot",
    "call_date": "2026-06-26T10:00:00",
    "call_direction": "outbound",
    "customer_name": "John",
    "phone_number": "+919876543210",
    "sentiment": "Positive",
    "summary": "Customer interested in services",
    "call_status": "completed"
  }'
```

## Sheet Column Mapping

| Column | Description |
|--------|-------------|
| bot_name | Name of the voice agent |
| call_date | Date/time of the call |
| call_direction | inbound or outbound |
| call_duration_in_minutes | Duration (minutes) |
| call_duration_in_seconds | Duration (seconds) |
| call_id | Unique call ID |
| call_status | completed, failed, etc. |
| customer_name | Caller name |
| customer_location | Caller location |
| phone_number | Phone number |
| sentiment | Positive, Neutral, Negative |
| service_requested | Service the caller asked about |
| summary | AI-generated call summary |
| full_conversation | Full call transcript |
| recording_url | Audio recording link |
