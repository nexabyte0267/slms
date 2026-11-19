import { randomBytes } from 'node:crypto'
import { defineConfig, devices } from '@playwright/test'

const e2eJwtSecret = randomBytes(48).toString('hex')
const e2eTotpEncryptionKey = randomBytes(32).toString('base64')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: [
    {
      command: 'npm exec -- tsx tests/e2e/mock-openai.ts',
      url: 'http://127.0.0.1:4010/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm exec -- tsx src/server.ts',
      url: 'http://localhost:4000/api/books',
      reuseExistingServer: !process.env.CI,
      env: {
        JWT_SECRET: e2eJwtSecret,
        TOTP_ENCRYPTION_KEY: e2eTotpEncryptionKey,
        OPENAI_API_KEY: 'playwright-mock-key',
        OPENAI_BASE_URL: 'http://127.0.0.1:4010/v1',
        REDIS_URL: 'redis://127.0.0.1:6379',
        NODE_ENV: 'test',
        E2E_TEST_MODE: 'true',
      },
      timeout: 120_000,
    },
    {
      command: 'npm --prefix frontend run dev -- --host localhost',
      url: 'http://localhost:5173/login',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
