# Vercel Deployment Secrets Setup

To enable automatic deployment to Vercel after Cypress tests pass, you need to configure GitHub Secrets.

## Required Secrets

You need to add 3 secrets to your GitHub repository:

1. `VERCEL_TOKEN`
2. `VERCEL_ORG_ID`
3. `VERCEL_PROJECT_ID`

---

## Step-by-Step Setup

### 1. Get Vercel Token

1. Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: `GitHub Actions Deployment`
4. Select scope: `Full Account`
5. Click "Create"
6. **Copy the token** (you'll only see it once!)

### 2. Get Organization ID and Project ID

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to your project
cd /path/to/your/project

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# This creates .vercel/project.json with your IDs
cat .vercel/project.json
```

You'll see output like:
```json
{
  "orgId": "team_xxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxx"
}
```

**Option B: From Vercel Dashboard**

1. Go to your project in Vercel Dashboard
2. Go to Settings → General
3. Scroll to "Project ID" - copy this value
4. For Org ID, go to your Account/Team Settings
5. The Org ID is in the URL or Settings page

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

**Secret 1:**
- Name: `VERCEL_TOKEN`
- Value: `[paste your Vercel token]`

**Secret 2:**
- Name: `VERCEL_ORG_ID`
- Value: `[paste your org ID, e.g., team_xxxxxxxxxxxxxx]`

**Secret 3:**
- Name: `VERCEL_PROJECT_ID`
- Value: `[paste your project ID, e.g., prj_xxxxxxxxxxxxxx]`

---

## Disable Vercel Auto-Deploy (Important!)

Since GitHub Actions will handle deployment, disable Vercel's automatic deployments:

1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Git**
3. Under "Ignored Build Step", add:
   ```bash
   exit 1;
   ```
   OR unlink the GitHub integration

This prevents Vercel from deploying automatically and lets GitHub Actions control when to deploy.

---

## How It Works

```
Developer pushes to main
         ↓
GitHub Actions runs Cypress tests
         ↓
   Tests PASS? ✅
         ↓
GitHub Actions deploys to Vercel
         ↓
   Deployment successful! 🚀
```

**If tests fail ❌:**
```
Tests FAIL
    ↓
Deployment SKIPPED
    ↓
No broken code in production! 🛡️
```

---

## Testing the Setup

1. Make a small change to your code
2. Commit and push to main:
   ```bash
   git add .
   git commit -m "Test automated deployment"
   git push origin main
   ```
3. Go to GitHub → Actions tab
4. Watch the workflow:
   - ✅ Tests run
   - ✅ Tests pass
   - ✅ Deployment starts
   - ✅ Site deployed!

---

## Troubleshooting

### "Error: Could not find Vercel project"
- Check that `VERCEL_PROJECT_ID` is correct
- Verify the project exists in your Vercel account

### "Error: Invalid token"
- Regenerate your Vercel token
- Make sure you copied it correctly to GitHub secrets

### "Error: Unauthorized"
- Check that `VERCEL_ORG_ID` is correct
- Verify your token has the right permissions

### Deployment skipped
- Check that tests passed
- Look at GitHub Actions logs for errors
- Verify all secrets are set correctly

---

## Alternative: Branch Protection (Simpler)

If you don't want to manage secrets, use Branch Protection instead:

1. Go to GitHub Settings → Branches
2. Add rule for `main`
3. Require "test" status check to pass
4. Let Vercel's automatic deployment handle it

See [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for details.
