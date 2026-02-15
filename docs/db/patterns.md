# Common DB patterns

## Effective priority rule

effectivePriority =
tasks.priority_source == 'user' ? tasks.priority_user : tasks.priority_ai

## Planning (today)

Query task_time_blocks where planned_start_at is today, order by planned_start_at.

## Time spent (per task)

Sum duration_minutes from task_work_logs filtered by task_id.

## Stuck detection (heuristic)

Task in 'doing' + no work_logs in last N hours OR repeated 'stuck_reported' events.
