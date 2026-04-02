# Meta (Instagram & WhatsApp) Bring Your Own Token (BYOT) Guide

This guide helps you connect your own WhatsApp or Instagram to our platform instantly by creating a "System User" in your Meta Business Suite.

## 🟢 Step 1: Create a Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Click **"My Apps"** > **"Create App"**.
3. Select **"Other"** > **"Business"**.
4. Name your app (e.g., `My-AI-Agent-Sync`) and click **Create App**.

## 🟢 Step 2: Add WhatsApp (or Instagram) Product
1. In your App Dashboard, scroll down to **"Add a product"**.
2. Click **"Set Up"** on **WhatsApp** (or **Instagram Graph API**).
3. Follow the quick setup steps to select your Business Account.

## 🟢 Step 3: Create a System User (for Permanent Token)
1. Go to **[Meta Business Settings](https://business.facebook.com/settings)**.
2. Under **"Users"**, select **"System Users"**.
3. Click **"Add"**, enter a name (e.g., `system-bot`), and select **"Admin"** as the role.
4. Click **"Add Assets"** > **"Apps"** > Select your newly created app > Toggle **"Manage App"** > **Save Changes**.
5. Once saved, click **"Generate New Token"**.
6. Select your App and ensure the following permissions are checked:
   - `whatsapp_business_messaging` (for WhatsApp)
   - `whatsapp_business_management` (for WhatsApp)
   - `instagram_basic` (for Instagram)
   - `instagram_manage_messages` (for Instagram)
7. Click **"Generate Token"** and **Copy this token immediately!** Meta will not show it again.

## 🟢 Step 4: Configure Webhooks
1. In your Meta App Dashboard, go to **WhatsApp** > **Configuration**.
2. Click **"Edit"** next to **Webhook URL**.
3. Use the URL provided in our platform's dashboard (e.g., `https://.../meta-webhook?user_id=YOUR_ID`).
4. **Verify Token:** Enter `smart_employees_verify`.
5. Click **"Verify and Save"**.
6. Under **"Webhook fields"**, click **"Manage"** and subscribe to:
   - `messages` (for WhatsApp)
   - `messages` (for Instagram)

## 🟢 Step 5: Connect to Platform
1. Go to our platform's **Dashboard** > **Integrations**.
2. Select **WhatsApp** or **Instagram**.
3. Paste:
   - **Access Token:** The permanent token from Step 3.
   - **Phone Number ID:** Found in WhatsApp > Getting Started.
   - **WABA ID:** Found in WhatsApp > Configuration.
   - (For Instagram) **Instagram Account ID**: Found in Instagram settings.

**Success! 🎉** Your agents are now connected directly through your own Meta account.
