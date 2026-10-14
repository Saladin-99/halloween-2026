# GitHub Pages deployment

The workflow in `.github/workflows/github-pages.yml` builds and deploys this website as static files. It runs verification on pushes and pull requests. Deployment runs only after successful verification on the repository's default branch, including a manual run on that branch. It does not require a personal access token or a `gh-pages` branch.

## One-time repository setup

1. Push this project, including `package-lock.json`, `public/assets/`, and `.github/workflows/github-pages.yml`, to your GitHub repository.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to the default branch, or open **Actions → Verify and deploy GitHub Pages → Run workflow** and select the default branch.
4. Open the URL shown in the deployment job's `github-pages` environment.

The workflow reads the repository's default branch automatically, so both `main` and another default branch work without editing YAML. If the repository uses environment protection rules, allow the default branch to deploy to `github-pages`.

GitHub Pages availability depends on repository visibility and the account's plan. The repository must permit GitHub Actions and the official actions used in the workflow. No remote repository settings are changed by adding these local files.

## What the pipeline verifies

- Reproducible dependency installation with `npm ci` and Node.js 22.
- Core logic tests and the Chromium browser suite, with browser dependencies installed on the runner.
- Strict TypeScript compilation and the Vite production build.
- A smoke check of the actual build served under `/invitation/` with no SPA fallback: direct home, deferred 3D loading, carving, PNG export, navigation and asset requests.

Only `dist/` is uploaded as the Pages artifact. Source files, original reference photos, tests and `node_modules/` are not published. The deploy job alone receives `pages: write` and `id-token: write`; validation runs with read-only repository access. Pull requests never deploy.

## Paths and domains

Vite retains `base: './'`, and application asset URLs use that base. This works at both `https://OWNER.github.io/REPOSITORY/` and a root/custom domain without hardcoding the repository name. Navigation uses `?view=home` and `?view=pumpkin`, so refresh does not require a server rewrite or `404.html` routing trick. Keep the trailing slash on the project site's root URL; GitHub Pages supplies that canonical directory URL.

For a custom domain, configure it in the repository's Pages settings and follow GitHub's DNS instructions. The relative build paths continue to work.

## Documentation checked

Checked against the official documentation and latest stable action releases on 14 October 2026:

- [GitHub: custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Vite: static deployment and GitHub Pages](https://vite.dev/guide/static-deploy#github-pages)
- [Vite: relative base paths](https://vite.dev/guide/build#relative-base)
- [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0), [configure-pages v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0), [upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0), [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1).

The local build and verification commands can be run before pushing. An actual GitHub deployment is confirmed only when the workflow succeeds on the connected repository; adding the workflow does not publish the website by itself.
