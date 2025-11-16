# 91 - Deployment Strategy

This document outlines the deployment process for the project's frontend and backend services.

## 1. Environments

- **Development:** Local development environment using Docker Compose.
- **Staging:** A production-like environment for testing and QA.
- **Production:** The live environment for end-users.

## 2. Continuous Integration / Continuous Deployment (CI/CD)

- **Provider:** [e.g., GitHub Actions, GitLab CI, CircleCI]
- **Pipeline Triggers:**
  - On push to `main` branch (deploy to Staging).
  - On manual trigger or tag creation (deploy to Production).

## 3. Deployment Process

### 3.1. Frontend (React App)

- **Hosting:** Vercel
- **Deployment Steps:**
  1. Push changes to the `main` branch.
  2. The CI/CD pipeline runs tests and linting.
  3. If tests pass, the app is automatically deployed to Vercel's staging environment.
  4. A manual promotion step in the Vercel dashboard deploys the build to production.

### 3.2. Backend (API)

- **Hosting:** AWS ECS
- **Deployment Steps:**
  1. Push changes to the `main` branch.
  2. The CI/CD pipeline runs tests and builds a new Docker image.
  3. The Docker image is pushed to a container registry (e.g., AWS ECR).
  4. The pipeline updates the ECS service to use the new Docker image, deploying it to the staging environment.
  5. A manual approval step in the CI/CD pipeline triggers the deployment to the production ECS service.

## 4. Rollback Strategy

- **Frontend:** Revert to a previous deployment in the Vercel dashboard.
- **Backend:** Re-run the deployment pipeline with the Git SHA of the previous stable version.
