# Alternative: Formspree Setup (Simpler Option)

If you want a simpler setup without managing EmailJS configuration, use Formspree instead. This is a 5-minute setup!

## Quick Setup Steps

### 1. Sign Up for Formspree
1. Go to [https://formspree.io/](https://formspree.io/)
2. Sign up with your NYU email (vs3128@nyu.edu)
3. Verify your email

### 2. Create a Form
1. Click **"New Form"**
2. Name it "Memor Interest Form"
3. Copy your form endpoint (looks like: `https://formspree.io/f/xyzabc123`)

### 3. Update HTML

Replace the form opening tag in `index.html`:

**Find this line (around line 91):**
```html
<form id="interestForm" class="form">
```

**Replace with:**
```html
<form id="interestForm" class="form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

**Add these hidden inputs right after the form opening tag:**
```html
<form id="interestForm" class="form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
    <!-- Hidden fields for additional recipients -->
    <input type="hidden" name="_cc" value="as20373@nyu.edu">
    <input type="hidden" name="_subject" value="New Interest Form Submission - Memor">
    <input type="hidden" name="_next" value="https://yourdomain.com/#interest">
    
    <div class="form-group">
```

### 4. Update Form Field Names

Make sure your form fields have the correct `name` attributes (they should already be correct):
- `name="name"` ✓
- `name="email"` ✓  
- `name="message"` ✓

### 5. Simplify JavaScript (Optional)

If you use Formspree, you can remove the EmailJS code and use this simpler version:

**In `script.js`, replace the form submission handler with:**

```javascript
// Handle form submission with Formspree
form.addEventListener('submit', function(e) {
    // Let the form submit naturally to Formspree
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Trigger confetti immediately for better UX
    createConfetti();
});
```

## Configuration in Formspree Dashboard

After creating your form:

1. Go to **Settings** in your Formspree form
2. Add **"as20373@nyu.edu"** as an additional recipient
3. Enable **reCAPTCHA** (optional, but recommended to prevent spam)
4. Set a custom thank you page (optional)

## Advantages of Formspree

✅ Simpler setup - no API keys to manage
✅ Free tier: 50 submissions per month
✅ Built-in spam protection
✅ Email notifications automatically sent
✅ Form data stored in Formspree dashboard
✅ No client-side configuration needed

## Disadvantages

❌ Less control over email format
❌ Lower free tier limit (50 vs 200 emails)
❌ Form redirects to Formspree confirmation page (unless customized)

## Testing

1. Submit the form on your website
2. Check both email addresses for the notification
3. View submissions in your Formspree dashboard

## Spam Protection

Formspree includes built-in spam protection, but you can add honeypot or reCAPTCHA:

**Honeypot (add to form):**
```html
<input type="text" name="_gotcha" style="display:none">
```

## Free Tier Limits

- 50 form submissions per month
- 1 form maximum
- Formspree branding on confirmation page

For more submissions, upgrade to a paid plan ($10/month for 1,000 submissions).

## Support

- Formspree Docs: [https://help.formspree.io/](https://help.formspree.io/)
- Contact: help@formspree.io

