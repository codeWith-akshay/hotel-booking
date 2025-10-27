#!/usr/bin/env node

/**
 * Automated Staging Deployment Script
 * 
 * This script automates the deployment of the hotel booking application
 * to Vercel staging environment.
 * 
 * Prerequisites:
 * - Vercel CLI installed and authenticated
 * - .env.staging file configured
 * - Database ready and accessible
 * 
 * Usage:
 *   node scripts/deploy-staging.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(60) + '\n');
}

function runCommand(command, description) {
  try {
    log(`▶ ${description}...`, 'cyan');
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`✓ ${description} completed`, 'green');
    return output;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

function checkPrerequisites() {
  logSection('Checking Prerequisites');

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    log('✓ Vercel CLI installed', 'green');
  } catch {
    log('✗ Vercel CLI not installed', 'red');
    log('  Install with: npm install -g vercel', 'yellow');
    process.exit(1);
  }

  // Check if .env.staging exists
  const envStagingPath = path.join(process.cwd(), '.env.staging');
  if (fs.existsSync(envStagingPath)) {
    log('✓ .env.staging file found', 'green');
  } else {
    log('✗ .env.staging file not found', 'red');
    log('  Create .env.staging with your staging configuration', 'yellow');
    process.exit(1);
  }

  // Check if user is logged into Vercel
  try {
    const whoami = execSync('vercel whoami', { encoding: 'utf-8', stdio: 'pipe' });
    log(`✓ Logged into Vercel as: ${whoami.trim()}`, 'green');
  } catch {
    log('✗ Not logged into Vercel', 'red');
    log('  Login with: vercel login', 'yellow');
    process.exit(1);
  }

  // Check if package.json exists
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    log('✓ package.json found', 'green');
  } else {
    log('✗ package.json not found', 'red');
    process.exit(1);
  }

  log('\n✓ All prerequisites met!', 'green');
}

function validateEnvironmentVariables() {
  logSection('Validating Environment Variables');

  const envStagingPath = path.join(process.cwd(), '.env.staging');
  const envContent = fs.readFileSync(envStagingPath, 'utf-8');

  const requiredVars = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_BASE_URL',
  ];

  const placeholders = [
    'your-staging-secret-here',
    'your_stripe_secret_key_here',
    'your_stripe_publishable_key_here',
    'user:password@host',
  ];

  let hasPlaceholders = false;

  for (const variable of requiredVars) {
    const regex = new RegExp(`${variable}=["']?(.+?)["']?$`, 'm');
    const match = envContent.match(regex);

    if (!match) {
      log(`⚠ ${variable} not found in .env.staging`, 'yellow');
    } else {
      const value = match[1];
      const hasPlaceholder = placeholders.some(ph => value.includes(ph));

      if (hasPlaceholder) {
        log(`⚠ ${variable} contains placeholder value`, 'yellow');
        hasPlaceholders = true;
      } else {
        log(`✓ ${variable} configured`, 'green');
      }
    }
  }

  if (hasPlaceholders) {
    log('\n⚠ Warning: Some environment variables contain placeholder values', 'yellow');
    log('  Update .env.staging before deploying to staging', 'yellow');
    log('  Continue anyway? (Ctrl+C to cancel)', 'yellow');
    // Give user 5 seconds to cancel
    execSync('timeout /t 5', { stdio: 'inherit' });
  }
}

function buildApplication() {
  logSection('Building Application');

  // Install dependencies
  runCommand('pnpm install --frozen-lockfile', 'Installing dependencies');

  // Generate Prisma client
  runCommand('pnpm prisma generate', 'Generating Prisma client');

  // Run type check
  try {
    runCommand('pnpm type-check', 'Running type check');
  } catch (error) {
    log('⚠ Type check failed, but continuing deployment', 'yellow');
  }

  // Run linter
  try {
    runCommand('pnpm lint', 'Running linter');
  } catch (error) {
    log('⚠ Linting issues found, but continuing deployment', 'yellow');
  }
}

function deployToVercel() {
  logSection('Deploying to Vercel Staging');

  try {
    // Deploy to preview (staging) environment
    log('Starting deployment...', 'cyan');
    log('This may take several minutes...', 'cyan');

    const deployOutput = execSync('vercel --prod=false --yes', {
      encoding: 'utf-8',
      stdio: 'inherit',
    });

    log('\n✓ Deployment successful!', 'green');

    // Extract deployment URL (if possible)
    try {
      const inspectOutput = execSync('vercel inspect', { encoding: 'utf-8' });
      const urlMatch = inspectOutput.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        log(`\n🌐 Staging URL: ${urlMatch[0]}`, 'bright');
      }
    } catch {
      log('\n🌐 Check Vercel dashboard for deployment URL', 'cyan');
    }
  } catch (error) {
    log('\n✗ Deployment failed', 'red');
    log('Check the error messages above for details', 'yellow');
    process.exit(1);
  }
}

function runDatabaseMigrations() {
  logSection('Database Migrations');

  log('⚠ Database migrations should be run manually or via Vercel build', 'yellow');
  log('  If not automatic, run:', 'cyan');
  log('  DATABASE_URL="your-staging-url" pnpm prisma migrate deploy', 'cyan');
  log('\n  Migrations are configured to run automatically in package.json build script', 'green');
}

function printPostDeploymentSteps() {
  logSection('Post-Deployment Steps');

  log('Next steps:', 'bright');
  log('', 'reset');
  log('1. Configure Stripe Webhook:', 'cyan');
  log('   - Go to https://dashboard.stripe.com/test/webhooks', 'reset');
  log('   - Add endpoint: https://your-staging-url.vercel.app/api/webhooks/stripe', 'reset');
  log('   - Select events: payment_intent.succeeded, payment_intent.payment_failed', 'reset');
  log('   - Copy webhook secret and add to Vercel env vars', 'reset');
  log('', 'reset');

  log('2. Verify Deployment:', 'cyan');
  log('   - Visit staging URL', 'reset');
  log('   - Check /api/health endpoint', 'reset');
  log('   - Check /api/db/health endpoint', 'reset');
  log('', 'reset');

  log('3. Run Tests:', 'cyan');
  log('   - Follow STAGING_TEST_PLAN.md', 'reset');
  log('   - Test all critical flows', 'reset');
  log('   - Document results in STAGING_TEST_REPORT.md', 'reset');
  log('', 'reset');

  log('4. Monitor Logs:', 'cyan');
  log('   - vercel logs --follow', 'reset');
  log('   - Check Vercel dashboard for errors', 'reset');
  log('', 'reset');

  log('✓ Deployment script completed!', 'green');
}

// Main execution
async function main() {
  try {
    log('\n🚀 Hotel Booking - Staging Deployment Script', 'bright');
    log('='.repeat(60), 'bright');

    checkPrerequisites();
    validateEnvironmentVariables();
    buildApplication();
    deployToVercel();
    runDatabaseMigrations();
    printPostDeploymentSteps();

    log('\n✨ Deployment process completed successfully!', 'green');
    process.exit(0);
  } catch (error) {
    log('\n❌ Deployment process failed', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  log('\n\n⚠ Deployment cancelled by user', 'yellow');
  process.exit(1);
});

// Run the script
main();
