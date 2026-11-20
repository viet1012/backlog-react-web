import { defineConfig } from 'vitest/config'

// Test logic thuần (không render giao diện): chạy trên Node, không cần plugin React.
// Chạy: npm test (1 lần) / npm run test:watch (tự chạy lại khi sửa)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
