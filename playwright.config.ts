import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;
const MOCK_BREVO_PORT = 4010;

/**
 * End-to-end tests run a production build of the site against a local mock of
 * the Brevo API (tests/e2e/mock-brevo.mjs). No real contacts are created.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node tests/e2e/mock-brevo.mjs',
      url: `http://127.0.0.1:${MOCK_BREVO_PORT}/__requests`,
      env: { MOCK_BREVO_PORT: String(MOCK_BREVO_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `npx next build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/en`,
      timeout: 300_000,
      reuseExistingServer: false,
      env: {
        NEXT_DIST_DIR: '.next-e2e',
        NEXT_TELEMETRY_DISABLED: '1',
        BREVO_API_KEY: 'test-key',
        BREVO_LIST_ID_CUSTOMERS: '11',
        BREVO_LIST_ID_PROVIDERS: '12',
        BREVO_API_BASE_URL: `http://127.0.0.1:${MOCK_BREVO_PORT}/v3`,
        NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST000000',
        WAITLIST_RATE_LIMIT: '1000',
      },
    },
  ],
});
