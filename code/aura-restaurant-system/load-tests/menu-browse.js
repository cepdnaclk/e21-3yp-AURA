import http from 'k6/http';
import { check, sleep } from 'k6';

// The base URL of your AWS deployed server
const BASE_URL = 'https://www.aurarestaurant.tech/api';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users over 30 seconds
    { duration: '1m',  target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    // We expect 95% of requests to finish in under 1 second
    http_req_duration: ['p(95)<1000'],
    // We expect the failure rate to be less than 1%
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Simulate a user requesting the menu
  const res = http.get(`${BASE_URL}/menu`);
  
  // Validate that the request was successful
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  // Wait for a short random time between requests (simulate human reading)
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}
