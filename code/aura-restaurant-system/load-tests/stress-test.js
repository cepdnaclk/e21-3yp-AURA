import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://www.aurarestaurant.tech/api';

export const options = {
  stages: [
    { duration: '15s', target: 100 }, // Ramp up to 100 users quickly
    { duration: '30s', target: 300 }, // Push it hard to 300 users
    { duration: '30s', target: 500 }, // Extreme stress: 500 concurrent users
    { duration: '15s', target: 0 },   // Cool down
  ],
  // In a stress test, we actually expect some requests to take longer or fail,
  // so we relax or remove the strict thresholds used in load testing.
};

export default function () {
  // Hitting the menu endpoint aggressively
  const res = http.get(`${BASE_URL}/menu`);
  
  check(res, {
    'is status 200': (r) => r.status === 200,
  });

  // Very short sleep to maximize the request rate
  sleep(Math.random() * 0.5 + 0.1); 
}
