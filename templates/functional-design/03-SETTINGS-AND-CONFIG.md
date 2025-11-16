# 03 - Settings and Config

This document describes how settings and configuration are managed in the project.

## 1. Configuration Files

- **.env:** Local environment variables. This file is not committed to version control.
- **config/default.json:** Default configuration values.
- **config/production.json:** Production-specific configuration.
- **config/development.json:** Development-specific configuration.

## 2. Loading Configuration

Explain how the configuration is loaded at runtime. For example, using a library like `dotenv` and `config`.

## 3. Configuration Schema

Define the structure of the configuration object.

```json
{
  "appName": "My Awesome App",
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "user": "admin",
    "password": "password"
  },
  "apiKeys": {
    "someService": "your-api-key"
  }
}
```

## 4. Adding New Configuration

Provide instructions on how to add new configuration values.

1.  Add the new key to `config/default.json`.
2.  Add environment-specific values to `config/development.json` and `config/production.json` if needed.
3.  Update the configuration schema in this document.
