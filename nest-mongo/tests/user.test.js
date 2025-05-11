import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 200 }, // Ramp up to 200 users
    { duration: '1m', target: 200 },  // Stay at 200 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
    'http_req_duration{type:create}': ['p(95)<500'],
    'http_req_duration{type:validation}': ['p(95)<300'],
  },
};

// Test setup
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

function generateUserData() {
  return {
    email: `test_${randomString(8)}@example.com`,
    password: `pass_${randomString(10)}`,
    name: `Test User ${randomString(5)}`,
  };
}

export default function () {
  // Test Case 1: Successful User Creation
  const userData = generateUserData();
  const createPayload = JSON.stringify(userData);
  
  const createResponse = http.post(
    `${BASE_URL}/users`,
    createPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'create' },
    }
  );

  check(createResponse, {
    'create status is 201': (r) => r.status === 201,
    'create response has user data': (r) => r.json('email') === userData.email,
    'create response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test Case 2: Duplicate Email
  const duplicateResponse = http.post(
    `${BASE_URL}/users`,
    createPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'validation' },
    }
  );

  check(duplicateResponse, {
    'duplicate email status is 400': (r) => r.status === 400,
    'duplicate email has error message': (r) => r.json('error') !== undefined,
    'duplicate response time < 300ms': (r) => r.timings.duration < 300,
  });

  // Test Case 3: Invalid Data
  const invalidPayload = JSON.stringify({
    email: 'invalid-email', // Invalid email format
    password: '', // Empty password
  });

  const invalidResponse = http.post(
    `${BASE_URL}/users`,
    invalidPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'validation' },
    }
  );

  check(invalidResponse, {
    'invalid data status is 400': (r) => r.status === 400,
    'invalid data has error message': (r) => r.json('error') !== undefined,
    'invalid response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1); // Add a small delay between iterations
} 