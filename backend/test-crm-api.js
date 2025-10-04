/**
 * CRM API Test Script
 *
 * Prerequisites:
 * 1. Backend server running on port 5000
 * 2. You must be logged in and have a valid JWT token
 * 3. Update the TOKEN variable below with your JWT token
 *
 * How to get your token:
 * - Login via frontend or POST to /api/auth/login
 * - Copy the token from localStorage or response
 *
 * Run: node test-crm-api.js
 */

const API_BASE = 'http://localhost:5000/api/crm';

// ⚠️ REPLACE THIS WITH YOUR ACTUAL JWT TOKEN
const TOKEN = 'YOUR_JWT_TOKEN_HERE';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, url, body = null, description) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Testing: ${description}`, 'yellow');
  log(`${method} ${url}`, 'blue');

  if (body) {
    log(`Body: ${JSON.stringify(body, null, 2)}`, 'blue');
  }

  try {
    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
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
  log('\n🚀 Starting CRM API Tests...', 'cyan');
  log(`Token: ${TOKEN.substring(0, 20)}...`, 'yellow');

  if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    log('\n⚠️  ERROR: Please update the TOKEN variable with your actual JWT token!', 'red');
    log('Get your token by logging in via the frontend or /api/auth/login', 'yellow');
    return;
  }

  const testData = {};

  // ==================== PIPELINE TESTS ====================
  log('\n\n' + '█'.repeat(80), 'cyan');
  log('PIPELINE & STAGES TESTS', 'cyan');
  log('█'.repeat(80), 'cyan');

  // 1. Create Pipeline
  const pipeline = await testEndpoint(
    'POST',
    `${API_BASE}/pipelines`,
    {
      name: 'Sales Pipeline',
      description: 'Main sales pipeline for B2B customers',
      is_default: true
    },
    '1. Create Pipeline'
  );
  if (pipeline?.data?.id) testData.pipelineId = pipeline.data.id;

  // 2. Add Stages
  const stages = [
    { name: 'Lead', color: 'gray', probability: 10 },
    { name: 'Qualified', color: 'blue', probability: 30 },
    { name: 'Proposal', color: 'yellow', probability: 60 },
    { name: 'Negotiation', color: 'orange', probability: 80 },
    { name: 'Closed Won', color: 'green', probability: 100 }
  ];

  for (const stage of stages) {
    const result = await testEndpoint(
      'POST',
      `${API_BASE}/pipelines/${testData.pipelineId}/stages`,
      stage,
      `2. Add Stage: ${stage.name}`
    );
    if (result?.data?.id && stage.name === 'Qualified') {
      testData.stageId = result.data.id;
    }
  }

  // 3. List Pipelines
  await testEndpoint(
    'GET',
    `${API_BASE}/pipelines`,
    null,
    '3. List All Pipelines'
  );

  // 4. Get Pipeline with Stages
  await testEndpoint(
    'GET',
    `${API_BASE}/pipelines/${testData.pipelineId}`,
    null,
    '4. Get Pipeline with Stages'
  );

  // ==================== COMPANY TESTS ====================
  log('\n\n' + '█'.repeat(80), 'cyan');
  log('COMPANY TESTS', 'cyan');
  log('█'.repeat(80), 'cyan');

  // 5. Create Company
  const company = await testEndpoint(
    'POST',
    `${API_BASE}/companies`,
    {
      name: 'Acme Corporation',
      industry: 'Technology',
      company_size: 'medium',
      website: 'https://acme.com',
      phone: '+1234567890',
      email: 'contact@acme.com',
      address: '123 Tech Street',
      city: 'San Francisco',
      country: 'USA',
      status: 'active',
      tags: ['enterprise', 'technology'],
      notes: 'Potential high-value customer'
    },
    '5. Create Company'
  );
  if (company?.data?.id) testData.companyId = company.data.id;

  // 6. Create Second Company
  const company2 = await testEndpoint(
    'POST',
    `${API_BASE}/companies`,
    {
      name: 'TechStart Inc',
      industry: 'Software',
      company_size: 'small',
      website: 'https://techstart.io',
      status: 'active'
    },
    '6. Create Second Company'
  );

  // 7. List Companies
  await testEndpoint(
    'GET',
    `${API_BASE}/companies?page=1&limit=10`,
    null,
    '7. List All Companies'
  );

  // 8. Search Companies
  await testEndpoint(
    'GET',
    `${API_BASE}/companies?search=Acme`,
    null,
    '8. Search Companies by Name'
  );

  // 9. Get Company Details
  await testEndpoint(
    'GET',
    `${API_BASE}/companies/${testData.companyId}`,
    null,
    '9. Get Company Details'
  );

  // ==================== CONTACT TESTS ====================
  log('\n\n' + '█'.repeat(80), 'cyan');
  log('CONTACT TESTS', 'cyan');
  log('█'.repeat(80), 'cyan');

  // 10. Create Contact
  const contact = await testEndpoint(
    'POST',
    `${API_BASE}/contacts`,
    {
      name: 'John Doe',
      phone: '+1234567891',
      email: 'john.doe@acme.com',
      company_id: testData.companyId,
      job_title: 'CEO',
      status: 'active',
      lead_source: 'website',
      tags: ['decision-maker', 'high-priority'],
      notes: 'Initial contact from website inquiry'
    },
    '10. Create Contact'
  );
  if (contact?.data?.id) testData.contactId = contact.data.id;

  // 11. Create Second Contact
  const contact2 = await testEndpoint(
    'POST',
    `${API_BASE}/contacts`,
    {
      name: 'Jane Smith',
      phone: '+1234567892',
      email: 'jane.smith@acme.com',
      company_id: testData.companyId,
      job_title: 'CTO',
      status: 'active',
      lead_source: 'referral'
    },
    '11. Create Second Contact'
  );

  // 12. List Contacts
  await testEndpoint(
    'GET',
    `${API_BASE}/contacts?page=1&limit=10`,
    null,
    '12. List All Contacts'
  );

  // 13. Search Contacts
  await testEndpoint(
    'GET',
    `${API_BASE}/contacts?search=John`,
    null,
    '13. Search Contacts by Name'
  );

  // 14. Filter by Company
  await testEndpoint(
    'GET',
    `${API_BASE}/contacts?company_id=${testData.companyId}`,
    null,
    '14. Filter Contacts by Company'
  );

  // 15. Get Contact Details
  await testEndpoint(
    'GET',
    `${API_BASE}/contacts/${testData.contactId}`,
    null,
    '15. Get Contact Details'
  );

  // 16. Update Contact
  await testEndpoint(
    'PUT',
    `${API_BASE}/contacts/${testData.contactId}`,
    {
      job_title: 'Chief Executive Officer',
      tags: ['decision-maker', 'high-priority', 'vip']
    },
    '16. Update Contact'
  );

  // 17. Add Tags to Contact
  await testEndpoint(
    'PATCH',
    `${API_BASE}/contacts/${testData.contactId}/tags`,
    {
      action: 'add',
      tags: ['hot-lead']
    },
    '17. Add Tags to Contact'
  );

  // 18. Get Company Contacts
  await testEndpoint(
    'GET',
    `${API_BASE}/companies/${testData.companyId}/contacts`,
    null,
    '18. Get All Contacts for Company'
  );

  // ==================== DEAL TESTS ====================
  log('\n\n' + '█'.repeat(80), 'cyan');
  log('DEAL TESTS', 'cyan');
  log('█'.repeat(80), 'cyan');

  // 19. Create Deal
  const deal = await testEndpoint(
    'POST',
    `${API_BASE}/deals`,
    {
      title: 'Enterprise Software License',
      value: 50000,
      currency: 'USD',
      contact_id: testData.contactId,
      company_id: testData.companyId,
      pipeline_id: testData.pipelineId,
      stage_id: testData.stageId,
      expected_close_date: '2025-12-31',
      probability: 30,
      priority: 'high',
      notes: 'Annual license for 100 users'
    },
    '19. Create Deal'
  );
  if (deal?.data?.id) testData.dealId = deal.data.id;

  // 20. Create Second Deal
  const deal2 = await testEndpoint(
    'POST',
    `${API_BASE}/deals`,
    {
      title: 'Consulting Services',
      value: 25000,
      currency: 'USD',
      contact_id: testData.contactId,
      company_id: testData.companyId,
      pipeline_id: testData.pipelineId,
      stage_id: testData.stageId,
      expected_close_date: '2025-11-30',
      priority: 'medium'
    },
    '20. Create Second Deal'
  );

  // 21. List Deals
  await testEndpoint(
    'GET',
    `${API_BASE}/deals?page=1&limit=10`,
    null,
    '21. List All Deals'
  );

  // 22. Get Deal Details
  await testEndpoint(
    'GET',
    `${API_BASE}/deals/${testData.dealId}`,
    null,
    '22. Get Deal Details'
  );

  // 23. Get Kanban Board
  await testEndpoint(
    'GET',
    `${API_BASE}/deals/kanban/${testData.pipelineId}`,
    null,
    '23. Get Kanban Board Data'
  );

  // 24. Update Deal
  await testEndpoint(
    'PUT',
    `${API_BASE}/deals/${testData.dealId}`,
    {
      value: 55000,
      notes: 'Updated: Added 10 more user licenses'
    },
    '24. Update Deal Value'
  );

  // 25. Get Contact Deals
  await testEndpoint(
    'GET',
    `${API_BASE}/contacts/${testData.contactId}/deals`,
    null,
    '25. Get All Deals for Contact'
  );

  // 26. Get Company Deals
  await testEndpoint(
    'GET',
    `${API_BASE}/companies/${testData.companyId}/deals`,
    null,
    '26. Get All Deals for Company'
  );

  // ==================== STATS TESTS ====================
  log('\n\n' + '█'.repeat(80), 'cyan');
  log('STATISTICS TESTS', 'cyan');
  log('█'.repeat(80), 'cyan');

  // 27. Get Contact Stats
  await testEndpoint(
    'GET',
    `${API_BASE}/contacts/stats`,
    null,
    '27. Get Contact Statistics'
  );

  // ==================== SUMMARY ====================
  log('\n\n' + '█'.repeat(80), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('█'.repeat(80), 'cyan');

  log('\nTest Data IDs:', 'yellow');
  log(JSON.stringify(testData, null, 2), 'cyan');

  log('\n✅ All tests completed!', 'green');
  log('\nNext steps:', 'yellow');
  log('1. Review the test results above', 'white');
  log('2. Check for any failed requests (marked with ✗)', 'white');
  log('3. You can now test moving deals between stages, closing deals, etc.', 'white');
  log('4. Use the test data IDs above for manual testing', 'white');
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
});
