/**
 * Simple CRM API Test - With Auto Login
 *
 * Just update your email and password below, then run:
 * node test-crm-simple.js
 */

const API_BASE = 'http://localhost:5000';

// ⚠️ UPDATE THESE WITH YOUR LOGIN CREDENTIALS
const LOGIN_EMAIL = 'walid.abdallah.ahmed@gmail.com';
const LOGIN_PASSWORD = 'Wa#123456';

let TOKEN = '';

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  log('\n🔐 Logging in...', 'yellow');

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      TOKEN = data.token;
      log(`✓ Login successful!`, 'green');
      log(`Token: ${TOKEN.substring(0, 30)}...`, 'cyan');
      return true;
    } else {
      log(`✗ Login failed: ${data.message || 'Unknown error'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Login error: ${error.message}`, 'red');
    return false;
  }
}

async function testEndpoint(method, url, body = null, description) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`${description}`, 'yellow');
  log(`${method} ${url}`, 'cyan');

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
      log(`Body: ${JSON.stringify(body, null, 2)}`, 'cyan');
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      log(`✓ SUCCESS (${response.status})`, 'green');
      log(JSON.stringify(data, null, 2), 'green');
      return data;
    } else {
      log(`✗ FAILED (${response.status})`, 'red');
      log(JSON.stringify(data, null, 2), 'red');
      return null;
    }
  } catch (error) {
    log(`✗ ERROR: ${error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('\n🚀 CRM API Simple Test\n', 'cyan');

  // Check credentials
  if (LOGIN_EMAIL === 'your-email@example.com') {
    log('⚠️  ERROR: Please update LOGIN_EMAIL and LOGIN_PASSWORD in the file!', 'red');
    log('Open: backend/test-crm-simple.js', 'yellow');
    log('Update lines 11-12 with your actual email and password', 'yellow');
    return;
  }

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n⚠️  Cannot continue without login. Please check your credentials.', 'red');
    return;
  }

  const testData = {};

  // Step 2: Test Pipeline Creation
  log('\n\n📊 Testing Pipelines...', 'cyan');

  const pipeline = await testEndpoint(
    'POST',
    `${API_BASE}/api/crm/pipelines`,
    {
      name: 'Sales Pipeline',
      description: 'Main B2B sales pipeline',
      is_default: true
    },
    '1. Create Pipeline'
  );
  if (pipeline?.data?.id) testData.pipelineId = pipeline.data.id;

  // Step 3: Add Stage
  if (testData.pipelineId) {
    const stage = await testEndpoint(
      'POST',
      `${API_BASE}/api/crm/pipelines/${testData.pipelineId}/stages`,
      {
        name: 'Qualified',
        color: 'blue',
        probability: 30
      },
      '2. Add Stage to Pipeline'
    );
    if (stage?.data?.id) testData.stageId = stage.data.id;
  }

  // Step 4: Create Company
  log('\n\n🏢 Testing Companies...', 'cyan');

  const company = await testEndpoint(
    'POST',
    `${API_BASE}/api/crm/companies`,
    {
      name: 'Acme Corporation',
      industry: 'Technology',
      company_size: 'medium',
      website: 'https://acme.com',
      phone: '+1234567890',
      status: 'active'
    },
    '3. Create Company'
  );
  if (company?.data?.id) testData.companyId = company.data.id;

  // Step 5: Create Contact
  log('\n\n👤 Testing Contacts...', 'cyan');

  const contact = await testEndpoint(
    'POST',
    `${API_BASE}/api/crm/contacts`,
    {
      name: 'John Doe',
      phone: '+1234567891',
      email: 'john.doe@acme.com',
      company_id: testData.companyId,
      job_title: 'CEO',
      status: 'active',
      lead_source: 'website'
    },
    '4. Create Contact'
  );
  if (contact?.data?.id) testData.contactId = contact.data.id;

  // Step 6: List Contacts
  await testEndpoint(
    'GET',
    `${API_BASE}/api/crm/contacts?page=1&limit=10`,
    null,
    '5. List All Contacts'
  );

  // Step 7: Create Deal
  if (testData.pipelineId && testData.stageId && testData.contactId) {
    log('\n\n💰 Testing Deals...', 'cyan');

    const deal = await testEndpoint(
      'POST',
      `${API_BASE}/api/crm/deals`,
      {
        title: 'Enterprise License',
        value: 50000,
        currency: 'USD',
        contact_id: testData.contactId,
        company_id: testData.companyId,
        pipeline_id: testData.pipelineId,
        stage_id: testData.stageId,
        expected_close_date: '2025-12-31',
        priority: 'high'
      },
      '6. Create Deal'
    );
    if (deal?.data?.id) testData.dealId = deal.data.id;
  }

  // Step 8: Get Kanban Board
  if (testData.pipelineId) {
    await testEndpoint(
      'GET',
      `${API_BASE}/api/crm/deals/kanban/${testData.pipelineId}`,
      null,
      '7. Get Kanban Board'
    );
  }

  // Summary
  log('\n\n' + '='.repeat(70), 'cyan');
  log('✅ TEST COMPLETED!', 'green');
  log('\nCreated Test Data:', 'yellow');
  log(JSON.stringify(testData, null, 2), 'cyan');
  log('\n💡 Next: Check your Supabase dashboard to see the data', 'yellow');
  log('💡 Or login to frontend to see contacts, companies, deals', 'yellow');
}

// Run
runTests().catch(error => {
  log(`\n✗ Test failed: ${error.message}`, 'red');
  console.error(error);
});
