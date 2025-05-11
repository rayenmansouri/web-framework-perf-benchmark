import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 200 }, // Ramp up to 200 users
    { duration: '1m', target: 200 },  // Stay at 200 users
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  // Test successful registration
  const successfulPayload = {
    username: `user_${randomString(8)}`,
    name: `Test User ${randomString(5)}`,
  };

  const successfulResponse = http.post(
    `${BASE_URL}/register`,
    JSON.stringify(successfulPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(successfulResponse, {
    'successful registration status is 201': (r) => r.status === 201,
    'successful registration has message': (r) => JSON.parse(r.body).message === 'User registered successfully',
  });

  // Test validation error (missing required fields)
  const invalidPayload = {
    username: '', // Missing required username
    name: 'Test User',
  };

  const invalidResponse = http.post(
    `${BASE_URL}/register`,
    JSON.stringify(invalidPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(invalidResponse, {
    'invalid registration status is 400': (r) => r.status === 400,
    'invalid registration has error message': (r) => JSON.parse(r.body).error !== undefined,
  });

  sleep(1); // Wait 1 second between iterations
}
