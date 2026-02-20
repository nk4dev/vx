Commit messages must conform to the Conventional Commits rules.

## Format

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

## Type

- `feat`: Adding a new feature
- `fix`: Bug fix
- `docs`: Documentation-only changes
- `style`: Changes that don't affect the semantics of the code (e.g., whitespace, formatting, missing semicolons, etc.)
- `refactor`: Code changes that don't fix bugs or add features
- `perf`: Code changes that improve performance
- `test`: Adding missing tests or modifying existing tests
- `build`: Changes that affect the build system or external dependencies (e.g., npm, webpack)
- `ci`: Changes to CI configuration files or scripts
- `chore`: Other changes (those that don't modify src or test files)
- `revert`: Reverting a previous commit

## Basic Rules

- The description must be no more than 50 characters in English.
- For breaking changes, add `!` after the type.
- Also add a descriptive emoji.

## Example

📝feat: Added user authentication functionality

Implemented a JWT-based authentication system with refresh tokens.