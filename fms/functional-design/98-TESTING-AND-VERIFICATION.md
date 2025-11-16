# 98 - Testing and Verification

This document outlines the comprehensive testing strategy for the Fleet Management System (FMS), covering the frontend, the Convex backend, the PostgreSQL data warehouse, and n8n integration workflows.

## 1. Testing Levels

### 1.1. Unit Tests

- **Purpose:** To test individual functions and components in isolation.
- **Scope:**
    -   **Convex Functions:** Each query, mutation, and action will have unit tests. Business logic within these functions will be the primary focus.
    -   **React Components:** UI components will be tested to verify rendering and behavior based on props.
- **Frameworks:**
    -   **Convex:** Vitest. We will use the Convex test helper functions to mock the database and authentication context (`ctx`).
    -   **React:** Vitest with React Testing Library.
- **Location:** Tests will be co-located with the source files (e.g., `convex/myFunction.test.ts`, `src/components/MyComponent.test.tsx`).

### 1.2. Integration Tests

- **Purpose:** To test the interaction between different parts of the system.
- **Scope & Strategy:**
    -   **Frontend-Backend Integration:**
        -   **Strategy:** We will run the React frontend against a local or development Convex instance. Tests will verify that calling a `useMutation` hook correctly updates the database and that components subscribing to `useQuery` hooks update correctly in response.
        -   **Framework:** Cypress or Playwright.
    -   **Data Warehouse Sync:**
        -   **Strategy:** A dedicated test suite will be created to verify the ETL process from Convex to PostgreSQL. The test will:
            1.  Seed the Convex dev database with sample data.
            2.  Run the data synchronization n8n workflow.
            3.  Query the PostgreSQL test database to assert that the data has been correctly transformed and inserted.
        -   **Tools:** A custom script using `vitest` or `pytest`.
    -   **n8n Workflow Integration:**
        -   **Strategy:** Each n8n workflow will be tested by triggering it and mocking its external dependencies. For example, for the predictive maintenance workflow, we will mock the Telematics API and assert that the workflow correctly calls the Convex `httpAction`.
        -   **Tools:** n8n's built-in testing features or manual testing in a dedicated n8n dev environment.

### 1.3. End-to-End (E2E) Tests

- **Purpose:** To simulate real user scenarios across the entire application stack.
- **Framework:** Cypress or Playwright.
- **Scenarios:**
    -   A new order is created by an external system, ingested by n8n, and appears on the dispatcher's dashboard in real-time.
    -   A driver updates a delivery status on the mobile app, and the change is instantly reflected on the live map.
    -   A telematics alert is ingested into PostgreSQL, analyzed by n8n, and correctly creates a maintenance alert in Convex, which then appears on the Fleet Manager's dashboard.
- **Environment:** E2E tests will run against a dedicated staging environment that is a complete replica of production, including Convex, PostgreSQL, and n8n instances.

## 2. Test Data Management

- **Convex:** Seeding scripts will be written to populate the development and testing databases with consistent and realistic test data.
- **PostgreSQL:** The test database will be reset and seeded with migrations before each integration test run.

## 3. Test Execution

- **Local Development:** Developers will run unit and integration tests locally before pushing code.
- **CI/CD Pipeline:**
    1.  On every pull request, the full suite of unit tests is executed.
    2.  On every merge to the `main` branch, the unit, integration, and E2E tests are run against the staging environment.
    3.  A successful E2E test run is a prerequisite for a production deployment.

## 4. Code Coverage

- **Tool:** `vitest-coverage` (built on Istanbul).
- **Target:** We aim for >80% code coverage for all new code.