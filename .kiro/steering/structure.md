# Project Structure

This workspace is currently empty and ready for project organization.

## Current Structure
```
.
└── .kiro/
    └── steering/
        ├── product.md
        ├── tech.md
        └── structure.md
```

## Recommended Organization Patterns

### General Principles
- Keep related files together
- Use clear, descriptive folder and file names
- Separate source code from configuration and documentation
- Group by feature rather than file type when possible

### Common Structure Patterns

#### Web Application
```
src/
├── components/     # Reusable UI components
├── pages/         # Page-level components
├── utils/         # Utility functions
├── hooks/         # Custom hooks (React)
├── services/      # API calls and external services
├── types/         # Type definitions
└── assets/        # Static assets

tests/             # Test files
docs/              # Documentation
config/            # Configuration files
```

#### Backend API
```
src/
├── controllers/   # Request handlers
├── models/        # Data models
├── services/      # Business logic
├── middleware/    # Custom middleware
├── routes/        # Route definitions
├── utils/         # Utility functions
└── types/         # Type definitions

tests/             # Test files
migrations/        # Database migrations
config/            # Configuration files
```

## File Naming Conventions
- Use consistent casing (camelCase, kebab-case, or snake_case)
- Be descriptive but concise
- Include file type in name when helpful (e.g., `user.model.js`, `auth.service.js`)
- Use index files to simplify imports when appropriate

## Configuration Files
- Keep configuration files in root or dedicated config folder
- Use environment-specific configs when needed
- Document all configuration options