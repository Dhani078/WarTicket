import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    smoke_concurrency: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 1,
      maxDuration: '10s',
    },
  },
};

export default function () {
  const url = 'http://localhost:8000/api/v1/tickets/reserve';
  const vuStr = __VU.toString().padStart(12, '0');
  const payload = JSON.stringify({
    tier_id: 'b1000000-0000-0000-0000-000000000001',
    user_id: `00000000-0000-4000-8000-${vuStr}`,
    quantity: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'Valid Flash-Sale Response (201 or 409 or 429)': (r) =>
      r.status === 201 || r.status === 409 || r.status === 429,
    'Zero Server Fault (Not 500)': (r) => r.status !== 500,
  });

  sleep(0.05);
}
