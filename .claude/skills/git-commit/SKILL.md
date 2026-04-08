---
name: git-commit
description: A skill to create a git commit message with context
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*)
---

## Context

- Git status: !`git status`
- Git diff: !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your Task

Based on the above changes, create a single commit.

Make sure to include a clear and concise commit message that summarizes the changes made.
Commit message should be in the format: "[type]: (scope) subject", where:

- type: A noun describing the type of change:
    - feat: A new feature
    - fix: A bug fix
    - docs: Documentation changes
    - style: Code style changes (formatting, missing semicolons, etc.)
    - refactor: Code refactoring without changing functionality
    - test: Adding or updating tests
    - chore: Maintenance tasks (e.g., updating dependencies)
- scope: A noun describing the area of the codebase affected (e.g., "auth", "ui", "api", "database")
- subject: A brief description of the change (max 50 characters)
- Detail (optional): If necessary, you can also include a more detailed description of the changes in the body of the commit message, separated from the subject by a blank line. The body should provide additional context and explain why the change was made, if it's not obvious from the subject alone.
- Do not include Co-Authored-By in the commit message.
