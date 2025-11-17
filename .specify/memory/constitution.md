<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: Initial → 1.0.0
  Modified Principles: None (initial constitution)
  Added Sections:
    - I. Code Quality First
    - II. Test-Driven Development (NON-NEGOTIABLE)
    - III. User Experience Consistency
    - IV. Performance Requirements
    - Quality Gates
    - Development Workflow
    - Governance (with amendment process and compliance review)
  Removed Sections: None (initial constitution)
  
  Templates Status:
    ✅ plan-template.md - Constitution Check section updated with all 4 principles
    ✅ spec-template.md - Added Non-Functional Requirements section aligned with all principles
    ✅ tasks-template.md - Updated all phases with constitution alignment notes and quality gates
    ✅ checklist-template.md - Compatible with quality gates (no changes needed)
    ✅ agent-file-template.md - No updates required (auto-generated file)
  
  Follow-up TODOs: None - All templates synchronized successfully
  
  Rationale for Version 1.0.0:
    - Initial constitution establishing core governance framework
    - Defines four foundational principles for code quality, testing, UX, and performance
    - MAJOR version (1.x.x) as this is the first ratified constitution
    - Comprehensive quality gates and development workflow established
    - Amendment process and compliance review procedures defined
-->

# Speckit Workshop Constitution

## Core Principles

### I. Code Quality First

All code MUST meet the following quality standards before merge:

- **Clarity Over Cleverness**: Code MUST be self-documenting with clear intent. Complex logic MUST include explanatory comments.
- **Consistent Style**: Code MUST follow established language-specific style guides (e.g., PEP 8 for Python, StandardJS for JavaScript).
- **No Code Duplication**: DRY principle enforced. Repeated logic MUST be extracted into reusable functions/modules.
- **Meaningful Names**: Variables, functions, and classes MUST have descriptive names that reveal intent without requiring comments.
- **Small, Focused Functions**: Functions SHOULD do one thing well. Functions exceeding 50 lines MUST be justified.
- **Error Handling**: All error conditions MUST be explicitly handled. No silent failures allowed.

**Rationale**: Quality code reduces bugs, improves maintainability, and accelerates onboarding of new team members.

### II. Test-Driven Development (NON-NEGOTIABLE)

TDD is mandatory for all new features and bug fixes:

- **Red-Green-Refactor Cycle**: Tests MUST be written first, verified to fail, then implementation follows.
- **Test Coverage Minimum**: All new code MUST have ≥80% test coverage. Critical paths MUST have 100% coverage.
- **Three-Layer Testing**:
  - **Unit Tests**: All functions/methods MUST have unit tests validating behavior in isolation.
  - **Integration Tests**: All API endpoints and inter-service communication MUST have integration tests.
  - **Contract Tests**: All public APIs and library interfaces MUST have contract tests ensuring backward compatibility.
- **Test Independence**: Tests MUST run independently in any order. No shared state between tests allowed.
- **Fast Feedback**: Unit test suite MUST complete in <30 seconds. Integration tests MUST complete in <5 minutes.

**Rationale**: TDD ensures correctness from the start, prevents regressions, and creates living documentation of expected behavior.

### III. User Experience Consistency

User-facing features MUST provide consistent and intuitive experiences:

- **Unified Interaction Patterns**: All CLI tools MUST use consistent argument patterns (e.g., `--verbose`, `--output`, `--help`).
- **Clear Error Messages**: Error messages MUST be actionable, stating what went wrong and how to fix it.
- **Input/Output Standards**:
  - CLI tools MUST accept input via stdin/arguments
  - Success output to stdout, errors to stderr
  - MUST support both JSON (machine-readable) and human-readable formats
- **Progressive Disclosure**: Default output MUST be concise. Verbose mode (--verbose) for detailed information.
- **Accessibility**: All user interfaces (CLI, web, mobile) MUST follow accessibility standards (WCAG 2.1 Level AA minimum).
- **Responsive Feedback**: User actions MUST provide immediate feedback (<200ms for acknowledgment, progress indicators for long operations).

**Rationale**: Consistent UX reduces learning curve, minimizes errors, and improves user satisfaction across all touchpoints.

### IV. Performance Requirements

All features MUST meet performance standards before production deployment:

- **Response Time Targets**:
  - API endpoints: p95 latency <200ms for read operations, <500ms for write operations
  - CLI commands: Complete in <2 seconds for common operations
  - UI interactions: First meaningful paint <1.5 seconds, time to interactive <3 seconds
- **Resource Efficiency**:
  - Memory usage MUST NOT exceed 200MB per service instance under normal load
  - CPU usage SHOULD remain <70% under peak load
  - Database queries MUST use proper indexes; no full table scans for tables >1000 rows
- **Scalability**:
  - Services MUST handle 1000 concurrent requests without degradation
  - Database schema MUST support horizontal scaling patterns
  - No hard-coded limits that prevent scale-up
- **Performance Testing**:
  - Load tests MUST be run before production deployment
  - Performance regressions >10% MUST be investigated and resolved
  - Critical paths MUST have performance benchmarks in CI/CD pipeline

**Rationale**: Performance directly impacts user satisfaction and operational costs. Proactive performance management prevents costly optimizations later.

## Quality Gates

All features MUST pass these gates before merge:

- **Code Review Gate**: Minimum two approvals from team members. Reviewers MUST verify:
  - Code quality standards (Principle I) met
  - Tests written first and passing (Principle II)
  - UX patterns consistent (Principle III)
  - Performance requirements met (Principle IV)

- **Automated Testing Gate**:
  - All tests passing (unit, integration, contract)
  - Test coverage ≥80% for new code
  - No decrease in overall project coverage
  - Performance benchmarks within acceptable ranges

- **Documentation Gate**:
  - Public APIs documented with examples
  - User-facing features have quickstart guides
  - Breaking changes documented in CHANGELOG

- **Constitution Compliance Gate**:
  - Feature plan (plan.md) includes Constitution Check section
  - All principle violations documented and justified
  - Complexity additions approved by tech lead

## Development Workflow

### Feature Development Process

1. **Specification Phase**:
   - Create feature spec (spec.md) with user stories and acceptance criteria
   - User stories MUST be independently testable
   - Prioritize stories (P1, P2, P3) for incremental delivery

2. **Planning Phase**:
   - Create implementation plan (plan.md) with Constitution Check
   - Define technical context and success criteria
   - Document any principle violations and justifications

3. **Implementation Phase**:
   - Follow TDD: Write tests → Verify failure → Implement → Verify pass
   - Create tasks (tasks.md) organized by user story
   - Implement incrementally by priority (P1 → P2 → P3)

4. **Review Phase**:
   - Submit PR with all quality gates passing
   - Address reviewer feedback
   - Merge only after all approvals received

### Continuous Improvement

- **Retrospectives**: After each feature, document lessons learned
- **Performance Monitoring**: Track production metrics against benchmarks
- **Test Suite Maintenance**: Refactor tests to maintain speed and clarity
- **Technical Debt**: Track and prioritize debt reduction in backlog

## Governance

This constitution supersedes all other development practices and guidelines.

### Amendment Process

1. **Proposal**: Anyone can propose amendments via pull request to constitution.md
2. **Discussion**: Team discusses impact on existing work and migration plan
3. **Approval**: Requires consensus from tech leads and affected team members
4. **Migration**: Update all templates and active features to comply with changes
5. **Version Bump**:
   - **MAJOR**: Backward incompatible changes (removing/redefining principles)
   - **MINOR**: New principles or substantial guidance additions
   - **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance Review

- All PRs MUST verify compliance with constitution principles
- Quarterly review of constitution effectiveness
- Annual review of amendment history and principle evolution
- Violations MUST be justified in plan.md Complexity Tracking section

### Template Synchronization

When constitution changes, these templates MUST be updated:

- `.specify/templates/plan-template.md` - Constitution Check section
- `.specify/templates/spec-template.md` - Requirements alignment
- `.specify/templates/tasks-template.md` - Task categorization and phases
- `.specify/templates/checklist-template.md` - Quality gate items

### Guidance Files

Runtime development guidance is maintained in:

- `.specify/templates/agent-file-template.md` - Auto-generated from feature plans
- Individual feature quickstart guides in `specs/[feature]/quickstart.md`

**Version**: 1.0.0 | **Ratified**: 2025-11-17 | **Last Amended**: 2025-11-17
