#!/usr/bin/env node

/**
 * Master Test Runner - Automated Permission Testing
 *
 * Usage:
 *   npm run test:permissions contacts agent
 *   npm run test:permissions companies manager --lang=ar
 *   npm run test:permissions segments admin --full
 *
 * This script runs:
 * 1. Backend Jest tests (permission enforcement at API level)
 * 2. Frontend Cypress tests in English
 * 3. Frontend Cypress tests in Arabic (if --full flag)
 * 4. Generates HTML report with results
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const resource = args[0] || 'contacts';
const role = args[1] || 'agent';
const flags = args.slice(2);
const runFullTests = flags.includes('--full');
const specificLang = flags.find(f => f.startsWith('--lang='))?.split('=')[1];

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Run a command and return promise
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Test results tracker
 */
const results = {
  resource,
  role,
  timestamp: new Date().toISOString(),
  tests: [],
};

/**
 * 1. Run Backend Jest Tests
 */
async function runBackendTests() {
  logHeader('Running Backend Permission Tests');
  logInfo(`Resource: ${resource}`);
  logInfo(`Testing all roles against ${resource} endpoints`);

  try {
    await runCommand('npm', ['test', '--', `--testNamePattern="${resource}"`], {
      cwd: path.join(__dirname, '..', 'backend'),
    });

    logSuccess('Backend tests passed!');
    results.tests.push({
      name: 'Backend Permission Tests',
      status: 'PASSED',
      details: `All roles tested against ${resource} endpoints`,
    });
  } catch (error) {
    logError('Backend tests failed!');
    results.tests.push({
      name: 'Backend Permission Tests',
      status: 'FAILED',
      error: error.message,
    });
    throw error;
  }
}

/**
 * 2. Run Frontend Cypress Tests (English)
 */
async function runFrontendTestsEnglish() {
  logHeader('Running Frontend E2E Tests (English)');
  logInfo(`Resource: ${resource}`);
  logInfo(`Role: ${role}`);
  logInfo(`Language: English`);

  try {
    await runCommand(
      'npx',
      [
        'cypress',
        'run',
        '--spec',
        'cypress/e2e/crm-permissions.cy.js',
        '--env',
        `role=${role},page=${resource},lang=en`,
      ],
      {
        cwd: path.join(__dirname, '..', 'Frontend'),
      }
    );

    logSuccess('Frontend tests (English) passed!');
    results.tests.push({
      name: 'Frontend E2E Tests (English)',
      status: 'PASSED',
      details: `Role: ${role}, Page: ${resource}`,
    });
  } catch (error) {
    logError('Frontend tests (English) failed!');
    results.tests.push({
      name: 'Frontend E2E Tests (English)',
      status: 'FAILED',
      error: error.message,
    });
    throw error;
  }
}

/**
 * 3. Run Frontend Cypress Tests (Arabic)
 */
async function runFrontendTestsArabic() {
  logHeader('Running Frontend E2E Tests (Arabic)');
  logInfo(`Resource: ${resource}`);
  logInfo(`Role: ${role}`);
  logInfo(`Language: Arabic (RTL)`);

  try {
    await runCommand(
      'npx',
      [
        'cypress',
        'run',
        '--spec',
        'cypress/e2e/crm-permissions.cy.js',
        '--env',
        `role=${role},page=${resource},lang=ar`,
      ],
      {
        cwd: path.join(__dirname, '..', 'Frontend'),
      }
    );

    logSuccess('Frontend tests (Arabic) passed!');
    results.tests.push({
      name: 'Frontend E2E Tests (Arabic)',
      status: 'PASSED',
      details: `Role: ${role}, Page: ${resource}`,
    });
  } catch (error) {
    logError('Frontend tests (Arabic) failed!');
    results.tests.push({
      name: 'Frontend E2E Tests (Arabic)',
      status: 'FAILED',
      error: error.message,
    });
    throw error;
  }
}

/**
 * Generate HTML Report
 */
function generateReport() {
  logHeader('Generating Test Report');

  const reportDir = path.join(__dirname, '..', 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(
    reportDir,
    `permission-tests-${resource}-${role}-${Date.now()}.html`
  );

  const passed = results.tests.filter(t => t.status === 'PASSED').length;
  const failed = results.tests.filter(t => t.status === 'FAILED').length;
  const total = results.tests.length;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Permission Test Report - ${resource} (${role})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 10px 0;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      flex: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat.passed { color: #10b981; }
    .stat.failed { color: #ef4444; }
    .stat.total { color: #6366f1; }
    .test-results {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-item {
      padding: 15px;
      border-left: 4px solid;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .test-item.passed {
      border-color: #10b981;
      background: #f0fdf4;
    }
    .test-item.failed {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .test-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .test-details {
      color: #666;
      font-size: 14px;
    }
    .error {
      color: #ef4444;
      font-family: monospace;
      font-size: 12px;
      margin-top: 5px;
      padding: 10px;
      background: #fee;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Permission Test Report</h1>
    <div>Resource: ${resource} | Role: ${role}</div>
    <div>Timestamp: ${new Date(results.timestamp).toLocaleString()}</div>
  </div>

  <div class="summary">
    <div class="card">
      <div>Total Tests</div>
      <div class="stat total">${total}</div>
    </div>
    <div class="card">
      <div>Passed</div>
      <div class="stat passed">${passed}</div>
    </div>
    <div class="card">
      <div>Failed</div>
      <div class="stat failed">${failed}</div>
    </div>
  </div>

  <div class="test-results">
    <h2>Test Results</h2>
    ${results.tests
      .map(
        test => `
      <div class="test-item ${test.status.toLowerCase()}">
        <div class="test-name">
          ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}
        </div>
        <div class="test-details">${test.details || ''}</div>
        ${test.error ? `<div class="error">${test.error}</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>

  <div class="footer">
    <p>Generated by Omnichannel CRM Test Suite</p>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, html);
  logSuccess(`Report generated: ${reportPath}`);
}

/**
 * Main test execution
 */
async function runTests() {
  logHeader('Automated Permission Testing Suite');
  logInfo(`Resource: ${resource}`);
  logInfo(`Role: ${role}`);
  logInfo(`Full Test: ${runFullTests ? 'Yes' : 'No (English only)'}`);

  const startTime = Date.now();

  try {
    // 1. Backend tests
    await runBackendTests();

    // 2. Frontend tests (English)
    if (!specificLang || specificLang === 'en') {
      await runFrontendTestsEnglish();
    }

    // 3. Frontend tests (Arabic) - only if --full flag or --lang=ar
    if (runFullTests || specificLang === 'ar') {
      await runFrontendTestsArabic();
    }

    // Generate report
    generateReport();

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logHeader('Test Suite Completed Successfully!');
    logSuccess(`All tests passed in ${duration}s`);
    logInfo(`View detailed report in test-reports/ directory`);

    process.exit(0);
  } catch (error) {
    // Generate report even on failure
    generateReport();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logHeader('Test Suite Failed');
    logError(`Tests failed after ${duration}s`);
    logInfo(`View detailed report in test-reports/ directory`);

    process.exit(1);
  }
}

// Show usage if no arguments
if (args.length === 0) {
  log('\nAutomated Permission Testing Suite', 'bright');
  log('\nUsage:', 'cyan');
  log('  npm run test:permissions <resource> <role> [options]', 'yellow');
  log('\nExamples:', 'cyan');
  log('  npm run test:permissions contacts agent');
  log('  npm run test:permissions companies manager --lang=ar');
  log('  npm run test:permissions segments admin --full');
  log('\nOptions:', 'cyan');
  log('  --full       Run tests in both English and Arabic');
  log('  --lang=en    Run tests in English only');
  log('  --lang=ar    Run tests in Arabic only');
  log('\nResources:', 'cyan');
  log('  contacts, companies, segments');
  log('\nRoles:', 'cyan');
  log('  admin, manager, agent, member, pos');
  log('');
  process.exit(0);
}

// Run the tests
runTests();
