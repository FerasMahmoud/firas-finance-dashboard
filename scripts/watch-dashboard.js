#!/usr/bin/env node

/**
 * Watch Dashboard Script
 * Automatically push updates when files change
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const DASHBOARD_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(DASHBOARD_DIR, 'data');
const TOKEN_FILE = path.join(process.env.HOME, 'clawd', 'github-token.json');

// Files to watch
const WATCH_FILES = [
  path.join(DATA_DIR, 'transactions.json'),
  path.join(DATA_DIR, 'balances.json'),
  path.join(DASHBOARD_DIR, 'index.html'),
  path.join(DASHBOARD_DIR, 'app.js')
];

// Debounce timer
let updateTimeout = null;
const DEBOUNCE_MS = 5000; // Wait 5 seconds after last change before pushing

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
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
      info('Please run: node finance-dashboard/scripts/deploy-github.js');
      process.exit(1);
    }
    
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
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

// Push updates
function pushUpdates(credentials) {
  if (!hasChanges()) {
    info('No changes to push');
    return;
  }
  
  try {
    info('Pushing updates...');
    
    // Stage changes
    exec('git add .', { silent: true });
    
    // Commit
    const timestamp = new Date().toLocaleString();
    exec(`git commit -m "Auto-update: ${timestamp}"`, { silent: true, ignoreError: true });
    
    // Push
    const remoteUrl = `https://${credentials.username}:${credentials.token}@github.com/${credentials.username}/${credentials.repository}.git`;
    exec('git remote remove origin', { silent: true, ignoreError: true });
    exec(`git remote add origin ${remoteUrl}`, { silent: true });
    exec('git push origin main', { silent: true });
    
    success('Updates pushed successfully!');
  } catch (err) {
    error(`Failed to push: ${err.message}`);
  }
}

// Handle file change
function onFileChange(filename, credentials) {
  log(`📝 Change detected: ${path.basename(filename)}`, 'yellow');
  
  // Clear existing timer
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  
  // Set new timer (debounce)
  updateTimeout = setTimeout(() => {
    pushUpdates(credentials);
  }, DEBOUNCE_MS);
  
  info(`Waiting ${DEBOUNCE_MS / 1000}s for more changes...`);
}

// Watch files
function watch() {
  log('👀 Dashboard Watch Script\n', 'bright');
  
  // Check git repo
  if (!fs.existsSync(path.join(DASHBOARD_DIR, '.git'))) {
    error('Git repository not initialized!');
    info('Please run: node finance-dashboard/scripts/deploy-github.js');
    process.exit(1);
  }
  
  // Load credentials
  const credentials = loadToken();
  success(`Watching dashboard for: ${credentials.username}`);
  
  // Check which files exist
  const existingFiles = WATCH_FILES.filter(file => fs.existsSync(file));
  
  if (existingFiles.length === 0) {
    error('No files to watch!');
    process.exit(1);
  }
  
  info(`Watching ${existingFiles.length} file(s):`);
  existingFiles.forEach(file => {
    info(`  - ${path.relative(DASHBOARD_DIR, file)}`);
  });
  
  log('\n' + '='.repeat(60), 'green');
  success('👀 Watching for changes...');
  log('='.repeat(60), 'green');
  info('Press Ctrl+C to stop\n');
  
  // Set up watchers
  existingFiles.forEach(file => {
    fs.watch(file, (eventType) => {
      if (eventType === 'change') {
        onFileChange(file, credentials);
      }
    });
  });
  
  // Keep process alive
  process.stdin.resume();
}

// Handle shutdown
process.on('SIGINT', () => {
  log('\n\n👋 Stopping watch script...', 'yellow');
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  process.exit(0);
});

// Run watcher
try {
  watch();
} catch (err) {
  error(`\nWatch failed: ${err.message}`);
  process.exit(1);
}
