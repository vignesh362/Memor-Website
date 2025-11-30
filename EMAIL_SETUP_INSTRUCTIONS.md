# Email Setup Instructions for Memor Website

This guide will help you set up email notifications for the "I'm Interested" form using EmailJS.

## Step 1: Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Add an Email Service

1. Once logged in, go to the **"Email Services"** page
2. Click **"Add New Service"**
3. Choose your email provider (Gmail is recommended):
   - Select **Gmail**
   - Click **"Connect Account"**
   - Sign in with your Gmail account (use vs3128@nyu.edu or as20373@nyu.edu)
   - Grant the necessary permissions
4. Note down your **Service ID** (something like "service_xxxxxxx")

## Step 3: Create an Email Template

1. Go to the **"Email Templates"** page
2. Click **"Create New Template"**
3. Set up your template with the following content:

### Template Settings:
- **Template Name**: "Memor Interest Form"

### Email Template Content:

**Subject:**
```
New Interest Form Submission - Memor
```

**Content (Body):**
```
New form submission from Memor website!

Name: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

---
This email was sent from the Memor website interest form.
Reply to: {{reply_to}}
```

### Template Variables to Use:
- `{{from_name}}` - The person's name
- `{{from_email}}` - The person's email
- `{{message}}` - Their message
- `{{reply_to}}` - Reply-to email address

4. In the **"To email"** field, enter: `vs3128@nyu.edu, as20373@nyu.edu`
5. Click **"Save"**
6. Note down your **Template ID** (something like "template_xxxxxxx")

## Step 4: Get Your Public Key

1. Go to **"Account"** > **"General"** in the EmailJS dashboard
2. Find your **Public Key** (it looks like "YOUR_PUBLIC_KEY")
3. Copy this key

## Step 5: Update Your Website Code

Open `script.js` and replace the placeholder values:

```javascript
// Replace this line:
publicKey: "YOUR_PUBLIC_KEY",

// With your actual public key:
publicKey: "your_actual_public_key_here",

// Replace these lines:
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {

// With your actual IDs:
emailjs.send('service_xxxxxxx', 'template_xxxxxxx', {
```

### Example:
```javascript
emailjs.init({
    publicKey: "AbCdEfGhIjKlMnOp", // Your actual public key
});

emailjs.send('service_abc123', 'template_xyz789', {
    // ... rest of the code
```

## Step 6: Test the Form

1. Open your website in a browser
2. Fill out the "I'm Interested" form
3. Submit the form
4. Check both email addresses (vs3128@nyu.edu and as20373@nyu.edu) for the notification

## Troubleshooting

### Emails Not Sending?
- Make sure all three values (Public Key, Service ID, Template ID) are correct
- Check the browser console for error messages
- Verify your EmailJS account is active
- Check your spam folder

### Rate Limits
- EmailJS free tier allows 200 emails per month
- If you need more, consider upgrading to a paid plan

### Gmail Blocking Emails?
- Make sure "Less secure app access" is enabled (or use App Passwords)
- Check your Gmail spam folder
- Verify the EmailJS service is connected properly

## Alternative: Using Formspree (Simpler Option)

If you prefer a simpler setup without JavaScript configuration:

1. Go to [https://formspree.io/](https://formspree.io/)
2. Sign up for free
3. Create a new form
4. Replace the form's `action` attribute in `index.html`:

```html
<form id="interestForm" class="form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

5. Add hidden input for multiple recipients:
```html
<input type="hidden" name="_cc" value="vs3128@nyu.edu,as20373@nyu.edu">
```

This is simpler but provides less control over the email format.

## Support

If you encounter any issues, check:
- EmailJS documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- Browser console for error messages
- EmailJS dashboard for delivery logs

---

**Note**: Keep your Public Key safe but know that it's designed to be used in client-side code. Never share your Private Key if you have one.

