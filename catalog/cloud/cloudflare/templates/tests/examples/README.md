# Example Tests

This directory contains example test suites demonstrating how to test various Conductor features.

## Test Status

### ✅ Working Tests (Ready to Run)

- **`debug.test.ts`** - Member loading and structure validation

### ⏸️ Skipped Tests (Future Features)

The following tests demonstrate features that are not yet fully implemented in Conductor. They are disabled (`.test.skip.ts`) but provided as examples for future use:

#### Email & SMS Testing
- **`ensembles/welcome-email.test.skip.ts`** - Requires `TestConductor.mockEmail()` method
- **`ensembles/otp-sms.test.skip.ts`** - Requires `TestConductor.mockSMS()` method

#### Function Member Testing
- **`members/hello.test.skip.ts`** - Requires Function member execution support in TestConductor

#### Advanced Ensemble Testing
- **`ensembles/analytics-report-pdf.test.skip.ts`** - PDF generation workflows
- **`ensembles/dashboard.test.skip.ts`** - Page rendering workflows
- **`ensembles/invoice-pdf.test.skip.ts`** - PDF generation with data
- **`ensembles/login-page.test.skip.ts`** - Authentication page workflows

## Running Tests

```bash
# Run all working tests
npm test

# Run only example tests
npm test -- tests/examples

# Include skipped tests (will fail)
npm test -- tests/examples --reporter=verbose
```

## Enabling Skipped Tests

To enable a skipped test once the feature is implemented:

1. Rename the file from `.test.skip.ts` to `.test.ts`
2. Update any imports or dependencies
3. Run `npm test` to verify it passes

## Test Coverage

Current test coverage for working tests:
- ✅ Member loading and validation
- ✅ Basic ensemble structure
- ⏸️ Email/SMS mocking (coming soon)
- ⏸️ Function member execution (coming soon)
- ⏸️ PDF/Page workflows (coming soon)

## Contributing

When adding new example tests:

1. **For working features**: Add as `.test.ts` files
2. **For future features**: Add as `.test.skip.ts` files with comments explaining requirements
3. **Update this README**: Add your test to the appropriate section above

## Known Limitations

### TestConductor Methods

Currently supported:
- ✅ `mockAI(memberName, response)` - Mock AI model responses

Coming soon:
- ⏸️ `mockEmail(memberName, response)` - Mock email sending
- ⏸️ `mockSMS(memberName, response)` - Mock SMS sending
- ⏸️ `mockHTTP(url, response)` - Mock HTTP requests

### Member Type Support

Currently supported in tests:
- ✅ Think members (AI-powered)
- ✅ Data members (KV/D1/R2)
- ✅ API members (HTTP calls)

Coming soon:
- ⏸️ Function members (TypeScript functions)
- ⏸️ Page members (React components)
- ⏸️ Form members (User input)

## Questions?

Check the main [Conductor documentation](https://docs.conductor.ensemble.dev) or file an issue at https://github.com/ensemble-edge/conductor/issues
