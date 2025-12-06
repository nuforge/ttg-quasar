# GitHub Pages Deployment Guide

This guide will walk you through deploying the Tabletop Gaming application to GitHub Pages.

## Prerequisites

1. A GitHub account (username: `nuforge`)
2. The repository pushed to GitHub
3. GitHub Pages enabled in repository settings

## Repository Setup

### Step 1: Push Your Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# If you haven't initialized git yet
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/nuforge/ttg-quasar.git
git branch -M main
git push -u origin main
```

**Note:** If your repository has a different name than `ttg-quasar`, you'll need to update the base path in `quasar.config.ts` (change `/ttg-quasar/` to match your repository name).

### Step 2: Enable GitHub Pages

**CRITICAL:** You must use GitHub Actions as the source, NOT a branch deployment.

1. Go to your repository on GitHub: `https://github.com/nuforge/ttg-quasar`
2. Click on **Settings** (in the repository navigation bar)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select:
   - **Source**: `GitHub Actions` (NOT "Deploy from a branch" - this will cause Jekyll to process your files)
5. Click **Save**

**Important:** If you see Jekyll processing errors, it means GitHub Pages is still configured to use branch deployment instead of GitHub Actions. Make sure "GitHub Actions" is selected as the source.

### Step 3: Verify Workflow File

The GitHub Actions workflow file (`.github/workflows/deploy-gh-pages.yml`) is already configured. It will:
- Trigger on pushes to `main` or `master` branch
- Build your Quasar application with the correct base path for GitHub Pages
- Deploy to GitHub Pages automatically

## Deployment Process

### Automatic Deployment

Once GitHub Pages is enabled, every push to the `main` or `master` branch will automatically:
1. Build the application
2. Deploy it to GitHub Pages

You can monitor the deployment progress:
1. Go to the **Actions** tab in your GitHub repository
2. Click on the latest workflow run to see the build and deployment status

### Manual Deployment

You can also trigger a manual deployment:
1. Go to the **Actions** tab
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select the branch (usually `main`)
5. Click **Run workflow**

## Accessing Your Deployed Application

After the first successful deployment, your application will be available at:

```
https://nuforge.github.io/ttg-quasar/
```

**Note:** It may take a few minutes for the site to be available after the first deployment.

## Configuration Details

### Base Path Configuration

The application is configured to work with GitHub Pages using the repository name as the base path. This is set in `quasar.config.ts`:

- **Development**: Uses `/` as the base path
- **GitHub Pages**: Uses `/ttg-quasar/` as the base path (when `GITHUB_PAGES` environment variable is set)

If your repository has a different name, update the base path in `quasar.config.ts`:

```typescript
vueRouterBase: process.env.GITHUB_PAGES ? '/your-repo-name/' : '/',
publicPath: process.env.GITHUB_PAGES ? '/your-repo-name/' : '/',
```

### Router Mode

The application uses **history mode** for routing, which requires proper base path configuration. The configuration ensures that:
- All routes work correctly on GitHub Pages
- Assets (CSS, JS, images) are loaded from the correct paths
- Deep linking to specific pages works as expected

## Troubleshooting

### Site Not Loading

1. **Check the Actions tab**: Ensure the workflow completed successfully
2. **Verify GitHub Pages settings**: Make sure "GitHub Actions" is selected as the source (NOT "Deploy from a branch")
3. **Wait a few minutes**: First deployment can take 5-10 minutes

### Jekyll Processing Errors

If you see Jekyll processing errors in the GitHub Actions logs:

1. **Check GitHub Pages Source**: Go to Settings → Pages and ensure "GitHub Actions" is selected (NOT a branch)
2. **Verify .nojekyll file**: The workflow automatically creates this file, but you can verify it exists in `dist/spa/.nojekyll` after build
3. **Clear cache**: Sometimes GitHub Pages caches Jekyll settings - try disabling and re-enabling Pages

### 404 Errors on Routes

If you're getting 404 errors when navigating to routes:
1. Verify the base path in `quasar.config.ts` matches your repository name
2. Ensure the workflow is setting `GITHUB_PAGES=true` during build
3. Check that `.nojekyll` file exists in the `public` folder (it prevents Jekyll from processing files)

### Assets Not Loading

If images, CSS, or JavaScript files aren't loading:
1. Check the browser console for 404 errors
2. Verify the `publicPath` in `quasar.config.ts` is correct
3. Ensure all assets are in the `public` folder or properly imported

### Build Failures

If the GitHub Actions workflow fails:
1. Check the Actions tab for error messages
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version compatibility (project requires Node 20+)
4. Check that there are no TypeScript or linting errors

## Local Testing

To test the GitHub Pages build locally:

```bash
# Build with GitHub Pages configuration
GITHUB_PAGES=true npm run build

# Serve the built files (you may need to install a simple HTTP server)
npx serve dist/spa
```

Then visit `http://localhost:3000/ttg-quasar/` (or whatever port serve uses) to test.

## Firebase Configuration

**Important:** Ensure your Firebase configuration allows requests from your GitHub Pages domain:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add `nuforge.github.io` to the authorized domains list
3. Update any CORS or security rules if needed

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file to the `public` folder with your domain name
2. Configure DNS settings for your domain
3. Update Firebase authorized domains to include your custom domain
4. Update the base path in `quasar.config.ts` to `/` (since custom domains use root path)

## Updating the Deployment

To update your deployed application:

1. Make your changes locally
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. The workflow will automatically build and deploy your changes

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Quasar Framework Documentation](https://quasar.dev)

