# GitHub Pages Deployment Guide

## Steps to Deploy to GitHub Pages

### 1. Create a GitHub Repository
1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the **"+"** icon in the top-right corner and select **"New repository"**
3. Name your repository `contact-app` (or any name you prefer)
4. Add a description: "Mobile Contacts App"
5. Choose **Public** visibility (required for free GitHub Pages)
6. Click **"Create repository"**

### 2. Push Your Code to GitHub

After creating the repository, GitHub will provide you with instructions. Follow these commands in your terminal:

```bash
cd /Users/pranavikantreddi/contact-app

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/contact-app.git

# Rename the default branch to main (if not already done)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (gear icon)
3. Scroll down to **"Pages"** section in the left sidebar
4. Under **"Build and deployment"**:
   - Select **Source**: "Deploy from a branch"
   - Select **Branch**: "main" and folder: "/ (root)"
5. Click **"Save"**
6. Wait a few moments for GitHub to build your site

### 4. Access Your Live App

Your contact app will be available at:
```
https://YOUR_USERNAME.github.io/contact-app/
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Example
If your GitHub username is `johndoe`, your app will be at:
```
https://johndoe.github.io/contact-app/
```

## Alternative: Using GitHub CLI

If you have GitHub CLI installed, you can simplify the process:

```bash
cd /Users/pranavikantreddi/contact-app

# Create repository on GitHub
gh repo create contact-app --public --source=. --remote=origin --push
```

## Updating Your App

After making changes to your app, update GitHub Pages with:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

GitHub will automatically rebuild and redeploy your site within a few minutes.

## Troubleshooting

**Pages not showing up after 10 minutes?**
- Check the **Settings > Pages** tab to see build logs
- Ensure the branch is set to "main" and folder is "/ (root)"
- Make sure your repository is public

**Assets not loading?**
- This is usually due to the `index.html` being in the root directory (which is correct)
- Clear your browser cache and reload

**Want a custom domain?**
- In **Settings > Pages**, scroll to "Custom domain" and add your domain
- Follow GitHub's instructions for DNS configuration

## File Structure for GitHub Pages

Your app is already properly structured for GitHub Pages:
```
/
├── index.html
├── style.css
├── app.js
├── README.md
└── .git/
```

The `index.html` in the root is automatically served as your homepage.

## Features Available on GitHub Pages

Your contact app will have full functionality on GitHub Pages:
- ✅ All HTML/CSS/JavaScript features work
- ✅ LocalStorage persistence works
- ✅ Search functionality works
- ✅ Add/Edit/Delete contacts work
- ✅ Responsive design works on all devices

Enjoy your live contact app! 🎉
