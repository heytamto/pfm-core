// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
rules: {
      // 1. Quản lý nghiêm ngặt kiểu dữ liệu (Senior khuyên dùng)
      '@typescript-eslint/no-explicit-any': 'warn', // Cảnh báo khi dùng 'any', nhắc nhở Tâm dùng strict type hoặc unknown
      '@typescript-eslint/no-unsafe-argument': 'error', // Nâng cấp từ warn -> error: Chặn việc truyền biến không an toàn vào hàm
      '@typescript-eslint/no-unsafe-assignment': 'off', // Tắt bớt cái này để code NestJS với các thư viện ngoài đỡ bị choke
      
      // 2. Bắt chết lỗi Async/Await trong Microservices (Tuyệt đối không để lọt)
      '@typescript-eslint/no-floating-promises': 'error', // Nâng cấp từ warn -> error: Quên await một Promise trong Microservices/Queue là chí mạng!
      '@typescript-eslint/await-thenable': 'error', // Báo lỗi nếu dùng await với một biến không phải là Promise
      'no-return-await': 'error', // Ép bỏ return await thừa thãi để tối ưu hiệu năng callstack

      // 3. Giữ code sạch sẽ (Clean Code)
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // Chặn dùng console.log bừa bãi, ép dùng Logger chính chủ của NestJS
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }], // Biến không dùng là lỗi, trừ những biến có tiền tố gạch dưới _
      
      // 4. Định dạng code tự động với Prettier
      'prettier/prettier': [
        'error',
        {
          'endOfLine': 'auto',
          'singleQuote': true,
          'trailingComma': 'all',
          'printWidth': 120 // Giúp code giãn dòng vừa phải, dễ đọc trên màn hình lớn
        }
      ],
    },
  },
);
