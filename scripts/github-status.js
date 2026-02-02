#!/usr/bin/env node

/**
 * GitHub Status Checker
 * Check deployment status and provide helpful info
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
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, silent = true) {
  try {
    return execSync(command, {
      cwd: DASHBOARD_DIR,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch {
    return null;
  }
}

function checkStatus() {
  log('\n📊 GitHub Pages Status\n', 'bright');
  
  // Check if token exists
  const hasToken = fs.existsSync(TOKEN_FILE);
  log(`Token saved: ${hasToken ? '✅ Yes' : '❌ No'}`, hasToken ? 'green' : 'red');
  
  if (hasToken) {
    try {
      const credentials = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      log(`  Username: ${credentials.username}`, 'dim');
      log(`  Repository: ${credentials.repository}`, 'dim');
      if (credentials.created) {
        const created = new Date(credentials.created);
        log(`  Created: ${created.toLocaleString()}`, 'dim');
      }
    } catch (err) {
      log('  (Invalid token file)', 'red');
    }
  }
  
  log('');
  
  // Check if git is initialized
  const isGitRepo = fs.existsSync(path.join(DASHBOARD_DIR, '.git'));
  log(`Git initialized: ${isGitRepo ? '✅ Yes' : '❌ No'}`, isGitRepo ? 'green' : 'red');
  
  if (isGitRepo) {
    // Get current branch
    const branch = exec('git rev-parse --abbrev-ref HEAD');
    if (branch) {
      log(`  Branch: ${branch.trim()}`, 'dim');
    }
    
    // Get remote
    const remote = exec('git remote get-url origin');
    if (remote) {
      // Hide token in URL
      const cleanRemote = remote.replace(/:([^@]+)@/, ':***@');
      log(`  Remote: ${cleanRemote.trim()}`, 'dim');
    }
    
    // Get last commit
    const lastCommit = exec('git log -1 --pretty=format:"%h - %s (%cr)"');
    if (lastCommit) {
      log(`  Last commit: ${lastCommit.trim()}`, 'dim');
    }
    
    // Check for uncommitted changes
    const status = exec('git status --porcelain');
    const hasChanges = status && status.trim().length > 0;
    log(`  Uncommitted changes: ${hasChanges ? '⚠️  Yes' : '✅ No'}`, hasChanges ? 'yellow' : 'green');
    
    if (hasChanges) {
      log('  Files changed:', 'dim');
      const files = status.trim().split('\n');
      files.slice(0, 5).forEach(file => {
        log(`    ${file}`, 'dim');
      });
      if (files.length > 5) {
        log(`    ... and ${files.length - 5} more`, 'dim');
      }
    }
  }
  
  log('');
  
  // Check if deployed
  if (hasToken && isGitRepo) {
    try {
      const credentials = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      const liveUrl = `https://${credentials.username}.github.io/${credentials.repository}/`;
      
      log('🌐 Live Dashboard:', 'bright');
      log(`  ${liveUrl}`, 'cyan');
      log('');
      
      log('📝 Quick Commands:', 'bright');
      log('  Update dashboard:  node scripts/update-dashboard.js', 'dim');
      log('  Watch for changes: node scripts/watch-dashboard.js', 'dim');
      log('  Add transaction:   node scripts/add-transaction.js', 'dim');
      log('');
      
    } catch {
      // Ignore
    }
  } else {
    log('❌ Not deployed yet', 'red');
    log('');
    log('To deploy, run:', 'yellow');
    log('  node scripts/deploy-github.js', 'cyan');
    log('');
  }
  
  // System checks
  log('🔧 System:', 'bright');
  
  const hasGit = exec('git --version');
  log(`  Git installed: ${hasGit ? '✅ Yes' : '❌ No'}`, hasGit ? 'green' : 'red');
  if (hasGit) {
    log(`    ${hasGit.trim()}`, 'dim');
  }
  
  const hasNode = exec('node --version');
  log(`  Node.js: ${hasNode ? '✅ ' + hasNode.trim() : '❌ Not found'}`, hasNode ? 'green' : 'red');
  
  log('');
}

checkStatus();
