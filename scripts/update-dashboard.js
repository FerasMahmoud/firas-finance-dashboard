#!/usr/bin/env node

/**
 * Update Dashboard Script
 * Quick updates to GitHub Pages after changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const DASHBOARD_DIR = path.join(__dirname, '..');
const TOKEN_FILE = path.join(process.env.HOME, 'clawd', 'github-token.json');

// Colors
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

// Execute command
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

// Load token
function loadToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      error('GitHub token not found!');
      info('Please run the deployment script first:');
      info('  node finance-dashboard/scripts/deploy-github.js');
      process.exit(1);
    }
    
    const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    
    if (!data.username || !data.token) {
      error('Invalid token file!');
      info('Please run the deployment script again.');
      process.exit(1);
    }
    
    return data;
  } catch (err) {
    error(`Failed to load token: ${err.message}`);
    process.exit(1);
  }
}

// Check for changes
function hasChanges() {
  try {
    const status = exec('git status --porcelain', { silent: true });
    return status && status.trim().length > 0;
  } catch {
    return false;
  }
}

// Get last commit message
function getLastCommit() {
  try {
    return exec('git log -1 --pretty=%B', { silent: true }).trim();
  } catch {
    return null;
  }
}

// Check if git repo is initialized
function isGitRepo() {
  return fs.existsSync(path.join(DASHBOARD_DIR, '.git'));
}

// Update dashboard
function update() {
  log('\n🔄 Update Dashboard Script\n', 'bright');
  
  // Check if git is initialized
  if (!isGitRepo()) {
    error('Git repository not initialized!');
    info('Please run the deployment script first:');
    info('  node finance-dashboard/scripts/deploy-github.js');
    process.exit(1);
  }
  
  // Load credentials
  const credentials = loadToken();
  success(`Loaded credentials for: ${credentials.username}`);
  
  // Check for changes
  if (!hasChanges()) {
    info('No changes detected');
    const lastCommit = getLastCommit();
    if (lastCommit) {
      info(`Last commit: ${lastCommit}`);
    }
    info('Dashboard is already up to date!');
    return;
  }
  
  info('Changes detected, updating...');
  
  // Show what changed
  log('\nChanged files:', 'yellow');
  exec('git status --short');
  log('');
  
  // Stage all changes
  info('Staging changes...');
  exec('git add .');
  
  // Commit with timestamp
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const commitMessage = `Update dashboard - ${timestamp}`;
  
  info('Committing...');
  exec(`git commit -m "${commitMessage}"`, { ignoreError: true });
  
  // Push to GitHub
  info('Pushing to GitHub...');
  const remoteUrl = `https://${credentials.username}:${credentials.token}@github.com/${credentials.username}/${credentials.repository}.git`;
  
  // Ensure remote is set correctly
  exec('git remote remove origin', { silent: true, ignoreError: true });
  exec(`git remote add origin ${remoteUrl}`, { silent: true, ignoreError: true });
  
  // Push
  exec('git push origin main');
  
  // Success
  log('\n' + '='.repeat(60), 'green');
  success('🎉 Dashboard Updated!');
  log('='.repeat(60) + '\n', 'green');
  
  const liveUrl = `https://${credentials.username}.github.io/${credentials.repository}/`;
  info('Your changes are being deployed to:');
  log(`\n   ${liveUrl}\n`, 'bright');
  
  warn('Note: Changes may take 30-60 seconds to appear live');
  info('Hard refresh your browser to see updates: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
}

// Run update
try {
  update();
} catch (err) {
  error(`\nUpdate failed: ${err.message}`);
  
  // Helpful troubleshooting
  log('\n💡 Troubleshooting:\n', 'yellow');
  info('1. Make sure you ran deploy-github.js first');
  info('2. Check your internet connection');
  info('3. Verify your GitHub token is still valid');
  info('4. Try running deploy-github.js again to re-authenticate');
  
  process.exit(1);
}
