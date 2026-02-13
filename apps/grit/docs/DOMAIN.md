# GRIT Domain

GRIT (GRok Issue Tracking) is a lightweight issue tracking system used across Datagrok.

## Use Cases
- **Internal**: Track user-reported defects and incidents
- **User-defined**: Users create projects to track anything
- **App-specific**: Other apps can use GRIT for their own issue tracking needs

## Entities
- **Project**: A container for grouping related issues. Has a short uppercase key (e.g. "GRIT", "DG").
- **Issue**: A trackable item within a project. Has type, priority, status, reporter, and optional assignee.

## Issue Fields
- **Type**: bug, feature, task
- **Priority**: low, medium (default), high
- **Status**: open, in_progress, done
- **Parent Issue**: Optional self-reference for sub-tasks
