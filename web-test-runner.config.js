import { playwrightLauncher } from '@web/test-runner-playwright'

export default {
  files: 'tests/contract/**/*.test.js',
  nodeResolve: true,
  testFramework: {
    config: {
      timeout: 5000
    }
  },
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' })
  ],
  coverage: true,
  coverageConfig: {
    report: true,
    reportDir: 'coverage/contract',
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}
