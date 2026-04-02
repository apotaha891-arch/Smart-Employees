# Google Service Account Setup Guide

To enable the "Hassle-Free" Google Sheets sync, the administrator needs to set up a Service Account in Google Cloud and add its credentials to Supabase.

## 🟢 Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown and select **"New Project"**.
3. Name it (e.g., `Smart-Employees-Sync`) and click **Create**.

## 🟢 Step 2: Enable Google Sheets API
1. In the search bar at the top, type **"Google Sheets API"**.
2. Click on the result and click the **"Enable"** button.

## 🟢 Step 3: Create a Service Account
1. Go to **"IAM & Admin"** > **"Service Accounts"**.
2. Click **"+ Create Service Account"**.
3. Name it (e.g., `sheet-sync-bot`) and click **Create and Continue**.
4. (Optional) Grant "Editor" role or leave blank. Click **Done**.

## 🟢 Step 4: Generate JSON Key
1. Click on the newly created service account email.
2. Go to the **"Keys"** tab.
3. Click **"Add Key"** > **"Create new key"**.
4. Select **JSON** and click **Create**.
5. Your computer will download a JSON file. **Keep this file secure!**

## 🟢 Step 5: Add to Supabase
1. Open your **Supabase Dashboard**.
2. Go to **Settings** > **Edge Functions**.
3. Add a new secret named `GOOGLE_SERVICE_ACCOUNT_KEY`.
4. Copy the **entire content** of the JSON file you downloaded and paste it as the value.
5. Click **Save**.

---

### 💡 How users connect their sheets:
1. Copy the `client_email` from your JSON file (e.g., `sheet-sync-bot@your-project.iam.gserviceaccount.com`).
2. Provide this email to your customers in the Dashboard.
3. The customer must **Share** their Google Sheet with this email (Viewer/Editor access).
4. The customer provides the **Spreadsheet ID** (from the URL) to your platform.
