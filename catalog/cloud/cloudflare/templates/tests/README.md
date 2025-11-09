# Testing Your Conductor Project

This directory contains tests for your Conductor ensembles and members.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Writing Tests

### Testing Members

See `members/hello.test.ts` for an example of testing a member:

```typescript
import { TestConductor, registerMatchers } from '@ensemble-edge/conductor/testing';

registerMatchers();

describe('My Member', () => {
  let conductor: TestConductor;

  beforeEach(async () => {
    conductor = await TestConductor.create({ projectPath: '.' });
  });

  afterEach(async () => {
    await conductor.cleanup();
  });

  it('should execute successfully', async () => {
    const result = await conductor.executeMember('my-member', { input: 'data' });
    expect(result.output).toBeDefined();
  });
});
```

### Testing Ensembles

See `ensembles/hello-world.test.ts` for an example of testing an ensemble:

```typescript
it('should execute successfully', async () => {
  const result = await conductor.executeEnsemble('my-ensemble', { input: 'data' });

  expect(result).toBeSuccessful();
  expect(result).toHaveExecutedMember('my-member');
  expect(result).toHaveCompletedIn(1000);
});
```

## Custom Matchers

Conductor provides custom Vitest matchers for testing:

- `toBeSuccessful()` - Check if execution succeeded
- `toHaveFailed()` - Check if execution failed
- `toHaveExecutedMember(name)` - Check if a member was executed
- `toHaveExecutedSteps(count)` - Check number of steps executed
- `toHaveCompletedIn(ms)` - Check execution time
- `toHaveCalledAI(memberName?)` - Check if AI was called
- `toHaveUsedTokens(count)` - Check token usage
- `toHaveCostLessThan(dollars)` - Check estimated cost

## Mocking

### Mock AI Responses

```typescript
conductor.mockAI('my-member', {
  message: 'Mocked AI response'
});
```

### Mock Database

```typescript
conductor.mockDatabase('users', [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' }
]);
```

### Mock HTTP APIs

```typescript
conductor.mockAPI('https://api.example.com/data', {
  result: 'mocked response'
});
```

## CI/CD Integration

Tests run automatically in CI. See `.github/workflows/test.yml` for configuration.

## Coverage

Coverage reports are generated in `./coverage/` directory. Open `coverage/index.html` to view detailed coverage.

## Learn More

- [Conductor Testing Documentation](https://docs.conductor.dev/testing)
- [Vitest Documentation](https://vitest.dev)
