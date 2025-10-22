# Deployment Setup - Tests Before Deploy

## Option 1: Branch Protection Rules (Recommended)

This ensures Vercel only deploys code that has passed all tests.

### Setup Steps:

1. **Go to GitHub Repository Settings**
   - Navigate to: Settings → Branches → Branch protection rules
   - Click "Add rule"

2. **Configure Protection for `main` branch:**
   ```
   Branch name pattern: main
   
   ✅ Require a pull request before merging
   ✅ Require status checks to pass before merging
      - Search and select: "e2e"
   ✅ Require branches to be up to date before merging
   ```

3. **Configure Vercel:**
   - Go to Vercel Dashboard → Project Settings → Git
   - Set "Production Branch" to `main`
   - Enable "Automatically Deploy"

### How It Works:
```
Developer → Creates PR → GitHub Actions runs tests
                              ↓
                          Tests PASS ✅
                              ↓
                        PR can be merged
                              ↓
                     Code merged to main
                              ↓
                    Vercel auto-deploys ✅
```

If tests fail ❌, the PR cannot be merged, so Vercel never sees failing code!

---

## Option 2: Vercel Ignored Build Step

Use Vercel's `ignoreCommand` to check test status before building.

### Setup:

Update `vercel.json`:
```json
{
  "framework": "nextjs",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "ignoreCommand": "bash -c 'if [ \"$VERCEL_GIT_COMMIT_REF\" = \"main\" ]; then exit 1; else exit 0; fi'"
}
```

Then require GitHub Actions to pass before merging to main.

---

## Option 3: GitHub Actions + Vercel CLI

Run tests first, then deploy with Vercel CLI only if tests pass.

### Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: cypress-io/github-action@v6
        with:
          start: npm start
          wait-on: 'http://localhost:3000'
          browser: chrome

  deploy:
    needs: test  # Only runs if tests pass!
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

**Required Secrets:**
- `VERCEL_TOKEN` - Get from Vercel Account Settings → Tokens
- `ORG_ID` - Get from `.vercel/project.json` after running `vercel`
- `PROJECT_ID` - Get from `.vercel/project.json`

---

## Recommended Approach

**Use Option 1 (Branch Protection)** because:
- ✅ No additional configuration needed
- ✅ Works with Vercel's automatic deployment
- ✅ Enforces code quality across the team
- ✅ Prevents accidental bad merges
- ✅ Shows test status on PRs
- ✅ Free on GitHub

**Steps:**
1. Enable branch protection on `main`
2. Require "e2e" status check to pass
3. Let Vercel auto-deploy from `main`
4. Done! 🎉

---

## Testing the Setup

1. Create a feature branch
2. Make a change that breaks a test
3. Open a PR
4. See tests fail ❌
5. Try to merge → Blocked! ✋
6. Fix the test
7. Tests pass ✅
8. Merge allowed → Vercel deploys 🚀
