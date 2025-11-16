# 05 - Database Setup

This document details the database architecture, covering the application database and the reporting/historical database.

## 1. Application Database (Convex)

- **Provider:** Convex
- **Purpose:** Real-time data storage and retrieval for the main application.
- **Schema:**
  - Link to the schema definition file (e.g., `convex/schema.ts`).
  - Describe the main tables and their relationships.
- **Key Functions:**
  - List the critical Convex query and mutation functions.
  - Outline any scheduled or cron jobs.

## 2. Reporting & Historical Database (PostgreSQL)

- **Provider:** [e.g., AWS RDS, Supabase, local Docker instance]
- **Purpose:** Storing historical data for reporting and analytics.
- **Schema:**
  - Provide the SQL schema or a link to the schema migration files.
  - Describe the main tables, views, and relationships.
- **Data Sync:**
  - Explain the process for syncing data from the application database (Convex) to the reporting database (PostgreSQL).
  - [e.g., ETL scripts, Convex actions, nightly batch jobs]

## 3. Data Migration Strategy

- **Initial Setup:** Describe the process for setting up the initial database schemas.
- **Schema Changes:** Outline the procedure for applying schema migrations in development and production.
