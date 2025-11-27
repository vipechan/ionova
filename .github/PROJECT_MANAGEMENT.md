# GitHub Project Management Guide

## Branch Protection Rules

To maintain code quality and security, we recommend setting up the following branch protection rules for the `master` branch:

### Recommended Settings

1. **Navigate to:** Repository Settings → Branches → Add branch protection rule

2. **Branch name pattern:** `master`

3. **Protection Rules:**

   - ✅ **Require a pull request before merging**
     - Require approvals: 1
     - Dismiss stale pull request approvals when new commits are pushed
     - Require review from Code Owners
   
   - ✅ **Require status checks to pass before merging**
     - Require branches to be up to date before merging
     - Status checks that are required:
       - `Test Smart Contracts`
       - `Test on ubuntu-latest`
       - `Build and Lint Frontend`
   
   - ✅ **Require conversation resolution before merging**
   
   - ✅ **Require signed commits** (optional but recommended)
   
   - ✅ **Include administrators** (enforce rules for admins too)
   
   - ✅ **Restrict who can push to matching branches**
     - Add: Repository maintainers only

### Development Workflow

With branch protection enabled, follow this workflow:

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request:**
   - Go to GitHub repository
   - Click "Compare & pull request"
   - Fill out the PR template
   - Request review from code owners

5. **Wait for CI/CD:**
   - All workflows must pass
   - Address any failing tests or linting issues

6. **Get Approval:**
   - At least 1 approval required
   - Code owners must approve if CODEOWNERS file matches

7. **Merge:**
   - Squash and merge (recommended for clean history)
   - Or merge commit (preserves all commits)

## GitHub Projects Setup

### Creating Project Boards

1. **Navigate to:** Repository → Projects → New project

2. **Create the following boards:**

#### Board 1: Development Roadmap
- **Template:** Roadmap
- **Purpose:** Track major features and milestones
- **Columns:**
  - Backlog
  - Q1 2025
  - Q2 2025
  - Q3 2025
  - Q4 2025
  - Completed

#### Board 2: Sprint Board
- **Template:** Team backlog
- **Purpose:** Track current sprint work
- **Columns:**
  - Backlog
  - Todo
  - In Progress
  - In Review
  - Done

#### Board 3: Bug Tracker
- **Template:** Bug triage
- **Purpose:** Track and prioritize bugs
- **Columns:**
  - New
  - Triaged
  - High Priority
  - In Progress
  - Fixed
  - Verified

### Issue Labels

Create the following labels for better organization:

**Type:**
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `security` - Security-related issues

**Priority:**
- `priority: critical` - Critical issues requiring immediate attention
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority

**Component:**
- `component: node` - Rust blockchain node
- `component: contracts` - Smart contracts
- `component: sdk` - JavaScript SDK
- `component: frontend` - Website/UI
- `component: devnet` - DevNet/Docker

**Status:**
- `status: needs-triage` - Needs initial review
- `status: blocked` - Blocked by dependencies
- `status: in-progress` - Currently being worked on
- `status: needs-review` - Awaiting code review

**Good First Issue:**
- `good first issue` - Good for newcomers

### Milestones

Create milestones for major releases:

1. **v0.1.0 - Testnet Launch**
   - Due date: Q1 2025
   - Description: Initial testnet deployment with 8 shards

2. **v0.2.0 - Mainnet Beta**
   - Due date: Q2 2025
   - Description: Mainnet beta with 50 shards

3. **v1.0.0 - Mainnet Launch**
   - Due date: Q3 2025
   - Description: Full mainnet with 100 shards

## Automation with GitHub Actions

### Auto-labeling PRs

Create `.github/workflows/auto-label.yml` to automatically label PRs based on changed files:

```yaml
name: Auto Label
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

### Auto-assign Issues

Create `.github/workflows/auto-assign.yml` to automatically assign issues:

```yaml
name: Auto Assign
on:
  issues:
    types: [opened]

jobs:
  assign:
    runs-on: ubuntu-latest
    steps:
      - uses: pozil/auto-assign-issue@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          assignees: vipechan
```

## Release Management

### Semantic Versioning

Follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

### Creating Releases

1. **Update version numbers** in:
   - `node/Cargo.toml`
   - `contracts/package.json`
   - `sdk/package.json`

2. **Create release notes:**
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

3. **Create GitHub Release:**
   - Go to Releases → Draft a new release
   - Choose tag: v0.1.0
   - Release title: "v0.1.0 - Testnet Launch"
   - Description: Changelog and highlights
   - Attach binaries (node executables)

## Community Management

### Discussion Categories

Enable GitHub Discussions with these categories:

- 💬 **General** - General discussions
- 💡 **Ideas** - Feature ideas and suggestions
- 🙏 **Q&A** - Questions and answers
- 📣 **Announcements** - Official announcements
- 🐛 **Bug Reports** - Community bug discussions
- 🎓 **Tutorials** - Community tutorials

### Response Templates

Create saved replies for common responses:

1. **Thank you for contributing**
2. **Need more information**
3. **Duplicate issue**
4. **Won't fix**
5. **Fixed in next release**

## Metrics and Analytics

### Track These Metrics

- **Stars:** Repository popularity
- **Forks:** Community engagement
- **Issues:** Open vs closed ratio
- **PRs:** Merge rate and time to merge
- **Contributors:** Active contributor count
- **Traffic:** Unique visitors and clones

### Tools

- **GitHub Insights:** Built-in analytics
- **Shields.io:** Create custom badges
- **CodeCov:** Code coverage tracking
- **Dependabot:** Automated dependency updates

---

**Next Steps:**

1. Set up branch protection rules
2. Create project boards
3. Add issue labels
4. Create milestones
5. Enable GitHub Discussions
6. Set up Dependabot
