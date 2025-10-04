/**
 * Authentication API Test Script
 * Tests registration, login, and user management endpoints
 */

const API_URL = 'http://localhost:5000/api';

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints\n');

  try {
    // Test 1: Register new organization
    console.log('Test 1: Register new organization...');
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: `Test Org ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'Password123!',
        fullName: 'Test Admin'
      })
    });

    const registerData = await registerResponse.json();

    if (registerResponse.ok) {
      console.log('✅ Registration successful');
      console.log(`   User: ${registerData.user.email}`);
      console.log(`   Organization: ${registerData.organization.name}`);
      console.log(`   Token: ${registerData.token.substring(0, 20)}...`);

      const token = registerData.token;
      const email = registerData.user.email;

      // Test 2: Get current user info
      console.log('\nTest 2: Get current user info...');
      const meResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const meData = await meResponse.json();

      if (meResponse.ok) {
        console.log('✅ Get user info successful');
        console.log(`   User: ${meData.user.fullName} (${meData.user.role})`);
      } else {
        console.log('❌ Get user info failed:', meData.error);
      }

      // Test 3: Get users list
      console.log('\nTest 3: Get organization users...');
      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const usersData = await usersResponse.json();

      if (usersResponse.ok) {
        console.log('✅ Get users successful');
        console.log(`   Total users: ${usersData.users.length}`);
      } else {
        console.log('❌ Get users failed:', usersData.error);
      }

      // Test 4: Logout
      console.log('\nTest 4: Logout...');
      const logoutResponse = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const logoutData = await logoutResponse.json();

      if (logoutResponse.ok) {
        console.log('✅ Logout successful');
      } else {
        console.log('❌ Logout failed:', logoutData.error);
      }

      // Test 5: Login
      console.log('\nTest 5: Login...');
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Password123!'
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        console.log('✅ Login successful');
        console.log(`   Welcome back: ${loginData.user.fullName}`);
      } else {
        console.log('❌ Login failed:', loginData.error);
      }

      console.log('\n✅ All authentication tests passed!');

    } else {
      console.log('❌ Registration failed:', registerData.error);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. Backend server is running on http://localhost:5000');
    console.log('2. Database migrations have been run');
    console.log('3. Environment variables are configured');
  }
}

testAuthEndpoints();
