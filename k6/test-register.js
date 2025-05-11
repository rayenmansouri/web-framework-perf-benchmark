import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 1000 }, // Ramp up to 200 users
    { duration: '1m', target: 1000 },  // Stay at 200 users
    { duration: '30s', target: 550 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

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
  });


  sleep(1); // Wait 1 second between iterations
}
