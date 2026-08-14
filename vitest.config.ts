import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Store-ууд localStorage ашигладаг тул setup дээр хөнгөн shim тавина
    // (jsdom бүхэлд нь ачаалахаас хямд, тестүүд DOM-гүй цэвэр логик шалгадаг).
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
