## Task: Optimize Database Performance

Analyze and optimize the existing database to improve query speed, reduce response times, and handle concurrent requests efficiently without changing the application's existing functionality.

### Requirements

1. **Analyze the existing database**

   - Inspect the schema, tables, relationships, indexes, constraints, and frequently executed queries.
   - Identify slow queries, redundant indexes, unnecessary joins, and inefficient database access patterns.
   - Use actual database statistics and query execution plans wherever supported.

2. **Optimize queries**

   - Rewrite inefficient queries only when necessary.
   - Avoid fetching unnecessary columns and rows.
   - Use pagination for large result sets.
   - Prevent N+1 query problems.
   - Use efficient joins and filtering conditions.
   - Avoid repeated database calls when a single query can retrieve the required data.

3. **Add appropriate indexes**

   - Identify columns frequently used in `WHERE`, `JOIN`, `ORDER BY`, and lookup operations.
   - Add indexes based on actual query patterns.
   - Consider composite and unique indexes where appropriate.
   - Avoid unnecessary indexes that slow down inserts and updates.

4. **Optimize database connections**

   - Configure connection pooling appropriately for the existing database and backend framework.
   - Reuse database connections instead of creating a new connection for every request.
   - Ensure connections are released properly.
   - Configure pool sizes and timeouts according to the deployment environment and available resources.

5. **Optimize backend database access**

   - Use transactions where appropriate.
   - Avoid blocking operations in asynchronous request handlers.
   - Use eager loading or efficient relationship loading when needed.
   - Ensure database sessions and transactions are managed correctly.
   - Use parameterized queries and preserve existing security protections.

6. **Protect data integrity**

   - Do not delete existing records or reset the database.
   - Do not remove constraints or foreign keys merely to improve speed.
   - Do not introduce mock data or replace real database operations.
   - Preserve existing APIs, authentication, authorization, and business logic.
   - Apply schema changes through safe, reversible migrations where possible.

7. **Measure performance**

   - Record baseline query latency before making changes.
   - Benchmark important operations before and after optimization.
   - Test item creation, item listing, and other existing database operations.
   - Verify correctness under concurrent requests where practical.
   - Report measured improvements rather than claiming unverified speed gains.

### Implementation Instructions

First inspect the existing project, database engine, ORM, schema, and deployment configuration. Make only evidence-based optimizations relevant to the current application.

Do not blindly add indexes, introduce caching, or change database infrastructure without justification. If caching is beneficial, ensure data changes invalidate or update cached results correctly.

After implementation, provide:

- The bottlenecks identified.
- The files and database objects modified.
- The migrations or configuration changes required.
- Before-and-after benchmark results.
- Any remaining performance limitations.

**Goal:** Make the existing database faster and more reliable while preserving all existing data, functionality, and security.
