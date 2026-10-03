import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    flash_sale_spike: {
      executor: 'per-vu-iterations',
      vus: 3000,
      iterations: 1,
      maxDuration: '30s',
    },
  },
};

export default function () {
  const url = 'http://localhost:8000/api/v1/tickets/reserve';
  const payload = JSON.stringify({
    tier_id: 'b1000000-0000-0000-0000-000000000001',
    user_id: `00000000-0000-0000-0000-${__VU.toString().padStart(12, '0')}`,
    quantity: 1,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'Status code is either 201 (Created) or 409 (Sold Out)': (r) => r.status === 201 || r.status === 409,
    'Zero Server Fault (Not 500)': (r) => r.status !== 500,
  });

  sleep(0.1);
}
