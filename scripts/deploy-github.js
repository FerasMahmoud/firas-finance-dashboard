#!/usr/bin/env node

/**
 * GitHub Pages Deployment Script
 * Deploy finance dashboard to GitHub Pages with one command
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Paths
const DASHBOARD_DIR = path.join(__dirname, '..');
const TOKEN_FILE = path.join(process.env.HOME, 'clawd', 'github-token.json');
const REPO_NAME = 'firas-finance-dashboard';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Execute command and return output
function exec(command, options = {}) {
  try {
    return execSync(command, {
      cwd: DASHBOARD_DIR,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (err) {
    if (options.ignoreError) return null;
    throw err;
  }
}

// Load existing token
function loadToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    }
  } catch (err) {
    warn('Could not load existing token');
  }
  return null;
}

// Save token
function saveToken(username, token) {
  const tokenDir = path.dirname(TOKEN_FILE);
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }
  
  const data = {
    username,
    token,
    repository: REPO_NAME,
    created: new Date().toISOString()
  };
  
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  success(`Token saved securely to: ${TOKEN_FILE}`);
}

// Check if git is installed
function checkGit() {
  try {
    exec('git --version', { silent: true });
    return true;
  } catch {
    return false;
  }
}

// Check if repository already exists on GitHub
async function checkRepoExists(username, token) {
  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Create GitHub repository
async function createRepo(username, token) {
  info('Creating GitHub repository...');
  
  try {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: REPO_NAME,
        description: 'Personal Finance Dashboard - Track expenses and income across multiple accounts',
        private: false,
        auto_init: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.message.includes('already exists')) {
        warn('Repository already exists, continuing...');
        return true;
      }
      throw new Error(errorData.message);
    }

    success('Repository created successfully!');
    return true;
  } catch (err) {
    error(`Failed to create repository: ${err.message}`);
    return false;
  }
}

// Enable GitHub Pages
async function enableGitHubPages(username, token) {
  info('Enabling GitHub Pages...');
  
  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: {
          branch: 'main',
          path: '/'
        }
      })
    });

    if (response.ok || response.status === 409) {
      success('GitHub Pages enabled!');
      return true;
    }

    // If 404, Pages might already be enabled
    if (response.status === 404) {
      warn('Could not enable Pages via API, may need manual setup');
      return true;
    }

    const errorData = await response.json();
    warn(`Pages API response: ${errorData.message}`);
    return true; // Continue anyway
  } catch (err) {
    warn(`Could not enable Pages automatically: ${err.message}`);
    info('You may need to enable it manually in repository settings');
    return true;
  }
}

// Initialize git repository
function initGit() {
  info('Initializing git repository...');
  
  // Check if already initialized
  if (fs.existsSync(path.join(DASHBOARD_DIR, '.git'))) {
    warn('Git already initialized, skipping...');
    return;
  }
  
  exec('git init');
  exec('git branch -M main');
  success('Git initialized!');
}

// Create .gitignore if it doesn't exist
function ensureGitignore() {
  const gitignorePath = path.join(DASHBOARD_DIR, '.gitignore');
  const defaultIgnore = `
# Dependencies
node_modules/

# Environment
.env
.env.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Secrets (important!)
github-token.json
*-token.json

# IDE
.vscode/
.idea/
`;

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, defaultIgnore.trim());
    success('Created .gitignore');
  }
}

// Commit and push files
function commitAndPush(username, token) {
  info('Committing files...');
  
  exec('git add .');
  exec('git commit -m "Deploy finance dashboard to GitHub Pages"', { ignoreError: true });
  
  info('Pushing to GitHub...');
  const remoteUrl = `https://${username}:${token}@github.com/${username}/${REPO_NAME}.git`;
  
  // Set remote
  exec(`git remote remove origin`, { silent: true, ignoreError: true });
  exec(`git remote add origin ${remoteUrl}`);
  
  // Push
  exec('git push -u origin main --force');
  success('Files pushed successfully!');
}

// Main deployment function
async function deploy() {
  log('\n🚀 GitHub Pages Deployment Script\n', 'bright');
  
  // Check prerequisites
  if (!checkGit()) {
    error('Git is not installed! Please install git first.');
    error('Visit: https://git-scm.com/downloads');
    process.exit(1);
  }
  
  // Load existing token or ask for new one
  let credentials = loadToken();
  let username, token;
  
  if (credentials && credentials.username && credentials.token) {
    info(`Found existing credentials for: ${credentials.username}`);
    const useExisting = await question('Use existing credentials? (y/n): ');
    
    if (useExisting.toLowerCase() === 'y' || useExisting.toLowerCase() === 'yes') {
      username = credentials.username;
      token = credentials.token;
      success('Using saved credentials');
    }
  }
  
  // Ask for credentials if not loaded
  if (!username || !token) {
    log('\n📝 GitHub Credentials\n', 'yellow');
    info('You will need:');
    info('1. Your GitHub username');
    info('2. A Personal Access Token (PAT) with repo + workflow permissions');
    info('   Get one at: https://github.com/settings/tokens\n');
    
    username = await question('GitHub username: ');
    token = await question('GitHub token (PAT): ');
    
    if (!username || !token) {
      error('Username and token are required!');
      process.exit(1);
    }
    
    // Save credentials
    saveToken(username, token);
  }
  
  log('\n');
  
  // Check if repo exists
  const repoExists = await checkRepoExists(username, token);
  
  if (repoExists) {
    warn('Repository already exists on GitHub');
    info('This script will update the existing repository');
  } else {
    // Create repository
    const created = await createRepo(username, token);
    if (!created) {
      error('Failed to create repository');
      process.exit(1);
    }
  }
  
  // Ensure .gitignore exists
  ensureGitignore();
  
  // Initialize git
  initGit();
  
  // Commit and push
  commitAndPush(username, token);
  
  // Enable GitHub Pages
  await enableGitHubPages(username, token);
  
  // Success message
  log('\n' + '='.repeat(60), 'green');
  success('🎉 Deployment Complete!');
  log('='.repeat(60) + '\n', 'green');
  
  const liveUrl = `https://${username}.github.io/${REPO_NAME}/`;
  info('Your dashboard is being deployed to:');
  log(`\n   ${liveUrl}\n`, 'bright');
  
  warn('Note: GitHub Pages may take 1-2 minutes to build and deploy');
  info('If you see 404, wait a moment and refresh');
  
  info('\nTo update your dashboard in the future, run:');
  log('   node finance-dashboard/scripts/update-dashboard.js\n', 'cyan');
  
  rl.close();
}

// Run deployment
deploy().catch(err => {
  error(`\nDeployment failed: ${err.message}`);
  rl.close();
  process.exit(1);
});
