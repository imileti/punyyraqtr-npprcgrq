# Deployment Workflow

## Current Setup: Tests Before Deploy

The project is configured to **only deploy to Vercel after all Cypress tests pass**.

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Developer pushes code to main branch                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions: Run Cypress Tests                      │
│  - Install dependencies                                 │
│  - Build application                                    │
│  - Run 18 API tests                                     │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ✅ PASS           ❌ FAIL
         │                 │
         │                 ▼
         │         ┌───────────────────┐
         │         │ Deployment BLOCKED │
         │         │ No changes to prod │
         │         └───────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions: Deploy to Vercel                       │
│  - Checkout code                                        │
│  - Deploy with Vercel CLI                               │
│  - Post deployment URL as comment                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  ✅ Production Deployment Successful                     │
│  Only tested code reaches users!                        │
└─────────────────────────────────────────────────────────┘
```

## Workflow Files

### `.github/workflows/deploy.yml`
- **Triggers**: Push to `main` branch
- **Job 1**: Run Cypress tests
- **Job 2**: Deploy to Vercel (only if tests pass)

### `.github/workflows/e2e.yml`
- **Triggers**: Pull requests and deployment status
- **Purpose**: Test PRs before merging
- **Tests**: Against live Vercel preview deployments

## Benefits

✅ **Zero-downtime failures** - Broken code never reaches production
✅ **Automated quality gates** - No manual intervention needed
✅ **Fast feedback** - Know immediately if deployment will fail
✅ **Confidence** - Every deployment is tested
✅ **Audit trail** - Full history in GitHub Actions

## Setup Required

See [VERCEL_SECRETS_SETUP.md](./VERCEL_SECRETS_SETUP.md) for configuration steps.

Required GitHub Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Testing the Workflow

1. Make a change that breaks a test
2. Push to main
3. See tests fail ❌
4. Deployment is skipped
5. Fix the test
6. Push again
7. Tests pass ✅
8. Deployment proceeds 🚀
