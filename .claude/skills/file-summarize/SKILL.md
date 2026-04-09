---
name: file-summarize
description: A skill to summarize a file
allowed-tools: Bash(cat:*), Bash(head:*), Bash(tail:*), Bash(wc:*), Bash(grep:*), Bash(awk:*), Bash(sed:*)
argument-hint: Please provide the file path you want to summarize.
---

## Context

You have been given a file $1. Your task is to summarize it in a concise and clear manner. The summary should capture the main points and key information while omitting unnecessary details.
