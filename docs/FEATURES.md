# Momentum Features Guide

## What Momentum Is
Momentum is an AI-first task tracker built around two main workspaces:
- `Dashboard`: capture, prioritize, and execute tasks.
- `Planner`: schedule time blocks and run your day.

This guide covers current features in this repository and how users access them in the UI.

## Core User Features

### 1) Authentication (Google + Email/Password)
What it does:
- Sign in with Google OAuth.
- Sign in or sign up with email/password.
- Sign out from the header.

How to use it in UI:
1. Open `/auth`.
2. Choose `Continue with Google` or use email/password form.
3. After login, open `/dashboard`.
4. Use `Sign out` from the header when needed.

### 2) Project Management
What it does:
- Create projects.
- Switch active project context.
- Edit project details (name, description, color, icon, weight, order, archived flag, settings JSON).
- Delete project.

How to use it in UI:
1. Go to `/dashboard`.
2. In the header, use the `Project` dropdown to switch context.
3. Click `New` to create a project.
4. Click `Manage` to edit or delete the selected project.

### 3) Task Board (Kanban + Quick Capture)
What it does:
- Quick-add tasks to current project.
- Drag tasks across statuses: `Backlog`, `Todo`, `Doing`, `Blocked`, `Done`, `Canceled`.
- Mark tasks done in one click.
- Filter by tag.
- Sort by `Smart`, `Due date`, `Scheduled today`, `No recent work`, `Estimate`, `Manual`.
- Open task drawer for full editing.

How to use it in UI:
1. Go to `/dashboard`.
2. Enter title in `Create a task...` and click `Add task`.
3. Drag cards between columns to change status.
4. Use tag pills and sort pills above the board.
5. Click a task card to open `Task details` and save edits.

### 4) Task Details Drawer
What it does:
- Edit title, description, due date, estimate, priority, status.
- Edit `Next action` and `Why this matters` fields.
- Manage tags (add/remove).
- Manage subtasks (add, check off, delete).
- Delete task.

How to use it in UI:
1. Click any task card in `/dashboard`.
2. Update fields in `Task details`.
3. Use `Tags` and `Subtasks` sections.
4. Click `Save`.

### 5) Today Plan Panel
What it does:
- Shows `Right now` active block and `Next up` block.
- Lists today's planned blocks in time order.
- Pulls from planner time blocks.

How to use it in UI:
1. In `/dashboard`, check `AI plan for today` section.
2. If empty, click `Open planner` and add blocks.

### 6) Planner (Time Blocking)
What it does:
- Day view timeline planning.
- Add/edit/delete time blocks.
- Mark blocks complete.
- Drag task cards onto timeline to schedule quickly (default 60-minute block).
- Resize and move existing blocks directly on timeline.
- Duplicate blocks.
- Quick duration buttons (`15m`, `30m`, `60m`, `90m`) and `Auto-fill start`.
- Date and project filters.

How to use it in UI:
1. Open `/planner` from dashboard sidebar or direct URL.
2. Click `Add block` for manual scheduling.
3. Or drag a task from right sidebar onto timeline.
4. Click a block to `Edit block`, then save/duplicate/unschedule.
5. Use `Jump to now` to focus current time.

## AI Features (User-Facing)

### 1) Momentum Coach (Chat + Action Execution)
What it does:
- Conversational coaching in executive, action-oriented style.
- Can execute actions directly from chat:
  - create task
  - create subtask
  - update task fields
  - schedule or move blocks
  - delete tasks (with confirmation)
- Keeps conversation context to follow up on the same task.

How to use it in UI:
1. Open `/dashboard`.
2. In `Momentum Coach`, type a request (or tap one of the suggested prompts).
3. Press `Send`.
4. If coach proposes risky/destructive action, confirm in the confirmation box.
5. Use `Refresh data` to reset chat state and sync view.

Examples users can type:
- `What should I do next right now?`
- `Create a task: Prepare sprint review notes`
- `Add a subtask to Prepare sprint review notes: Draft talking points`
- `Schedule Prepare sprint review notes tomorrow 14:00 to 15:00`

### 2) Voice Input for Coach
What it does:
- Speech-to-text input in coach chat (browser-supported only).

How to use it in UI:
1. In coach chat, click `Mic`.
2. Speak your request.
3. Click `Stop mic` and send message.

### 3) AI Task Breakdown (Streaming)
What it does:
- Breaks a task into 5-8 actionable subtasks.
- Streams generation live.
- Avoids duplicates with existing subtasks before saving.

How to use it in UI:
1. In `/dashboard`, find a task card.
2. Click `Break into subtasks` (card button or drawer button).
3. Wait for generation.
4. New subtasks are inserted into the task.

### 4) AI Priority + Next Step Signals in Tasks
What it does:
- Tasks store AI priority, AI next action, and AI rationale (`why`).
- Cards surface these as quick execution cues.
- User can override priority manually in task drawer.

How to use it in UI:
1. In task cards, review `Priority`, `Next`, and `Why` blocks.
2. Open `Task details` to override priority or rewrite next action/why.
3. Save changes.

### 5) Fatigue-Aware Coaching + Recovery Break Suggestion
What it does:
- Detects fatigue intent (ex: "I'm tired", "burned out", "need a break").
- Suggests and can schedule a recovery break block.
- Uses confirmation before scheduling break block.

How to use it in UI:
1. In coach chat, write a fatigue message.
2. Review coach recommendation.
3. Click `Schedule break` in confirmation panel if you want it added to planner.

### 6) Safe AI Mutations (Confirmation for Destructive Actions)
What it does:
- AI requires explicit confirmation before task-deletion actions.

How to use it in UI:
1. Ask coach to delete tasks.
2. Confirm only if intended.
3. Cancel to abort.

## Additional App Features

### Landing Page AI Demo
What it does:
- Streaming text demo via `/api/ai`.

How to use it in UI:
1. Open `/`.
2. In `AI Demo`, enter a prompt.
3. Click `Ask AI` and watch streamed response.

### Health and User APIs
What it does:
- `/api/health`: simple health timestamp.
- `/api/me`: authenticated user profile payload.

### Legacy Todo Demo Page
What it does:
- Demo CRUD flows via direct Supabase and via API routes (`/api/todos`).

How to use it in UI:
1. Open `/dashboard/demo-page`.
2. Use `Direct Supabase calls` and `API routes` todo widgets.

## Notes on Scope
- This document describes implemented features present in current code.
- The database also includes knowledge/RAG tables and RPC support, but there is no primary end-user UI for that flow yet in this repository.
