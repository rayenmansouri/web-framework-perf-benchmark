import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 200 }, // Ramp up to 200 users
    { duration: '1m', target: 200 }, // Stay at 200 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
    'http_req_duration{type:register}': ['p(95)<500'],
    'http_req_duration{type:validation}': ['p(95)<300'],
  },
};

const BASE_URL = 'http://localhost:3000';

function generateUserData() {
  return {
    username: `user_${randomString(8)}_${__VU}_${__ITER}`,
    password: `pass_${randomString(12)}`,
  };
}

export default function () {
  // Test Case 1: Successful Registration
  const userData = generateUserData();
  const registerPayload = JSON.stringify(userData);

  const registerResponse = http.post(
    `${BASE_URL}/auth/register`,
    registerPayload,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'register' },
    },
  );

  check(registerResponse, {
    'register status is 201': (r) => r.status === 201,
    'register has user id': (r) => r.json('id') !== undefined,
    'register response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // Add a small delay between iterations
}
