# IT_JOB — Large-Scale Recommendation Cache Solution

## 1. Overview

The current Recommendation Redis implementation uses a Cache-Aside pattern:

```text
User
  ↓
RecommendationService
  ↓
Redis GET
  ├── HIT  → return
  └── MISS → calculate → save Redis
```

Current invalidation:

```text
User edits profile
    → evict that user's recommendation cache

Job is created / updated / deleted
    → evict ALL recommendation caches
```

This works for a small system, but becomes problematic at large scale because one Job change can invalidate hundreds of thousands of user caches and cause a recomputation storm.

> Do not solve large-scale cache invalidation by making bulk deletion faster. Avoid unnecessary global invalidation in the first place.

---

# 2. Problems in the Current Implementation

## 2.1 `KEYS` is unsafe for large production workloads

Current code:

```java
Set<String> keys = redisTemplate.keys(KEY_PREFIX + "*");
```

`KEYS recommendation:user:*` scans the Redis keyspace to find matching keys.

At small scale this may appear harmless, but with a large keyspace it can cause latency spikes and negatively affect other Redis operations.

Replacing `KEYS` with `SCAN` is safer operationally, but does **not** solve the architectural problem if the application still needs to invalidate all recommendation caches whenever one Job changes.

`SCAN` should mainly be used for administrative or cleanup tasks, not as the normal invalidation mechanism.

---

# 3. Global Invalidation Creates a Recompute Storm

Current flow:

```text
1 Job update
       ↓
DELETE all recommendation caches
       ↓
Hundreds of thousands of Redis MISS
       ↓
Hundreds of thousands of recommendation calculations
       ↓
Database / Elasticsearch / recommendation engine overloaded
```

Example:

```text
500,000 users
100,000 jobs
```

If one company updates one Job:

```text
1 Job updated
    ↓
500,000 caches deleted
    ↓
500,000 cache misses
    ↓
500,000 recommendation calculations
```

The main bottleneck is therefore not Redis deletion itself.

> A small data change has a fan-out proportional to the entire user population.

---

# 4. Cache Stampede / Thundering Herd

When a cache expires or is invalidated, many concurrent requests can calculate the same recommendation simultaneously.

```text
Request A ─┐
Request B ─┤
Request C ─┤
Request D ─┤
Request E ─┘
      ↓
 Redis MISS
      ↓
Multiple calculations
      ↓
DB / Elasticsearch pressure
```

This is commonly called:

- Cache Stampede
- Thundering Herd

---

# 5. Recommended Large-Scale Architecture

```text
                         ┌──────────────┐
                         │ PostgreSQL   │
                         │ Source       │
                         │ of Truth     │
                         └──────┬───────┘
                                │
                         Transaction
                                │
                                ↓
                         ┌──────────────┐
                         │ Outbox       │
                         │ Table        │
                         └──────┬───────┘
                                │
                                ↓
                              Kafka
                                │
              ┌─────────────────┼─────────────────┐
              ↓                 ↓                 ↓
     Recommendation      Notification        Analytics
        Service             Service            Service
              │
        ┌─────┴─────┐
        ↓           ↓
      Redis    Elasticsearch
        │           │
        └─────┬─────┘
              ↓
          API Response
```

Responsibilities:

| Component | Responsibility |
|---|---|
| PostgreSQL | Source of truth |
| Outbox | Reliable event persistence |
| Kafka | Asynchronous event propagation |
| Redis | Hot recommendation cache |
| Elasticsearch / OpenSearch | Job search and candidate retrieval |
| Recommendation Service | Candidate generation + ranking |
| Worker | Background recomputation |
| Prometheus + Grafana | Observability |

---

# 6. Do Not Cache the Entire Recommendation Response

Instead of storing a large DTO such as:

```java
List<JobRecommendationResponse>
```

prefer a compact structure:

```json
[
  {
    "jobId": 1001,
    "score": 0.95
  },
  {
    "jobId": 1042,
    "score": 0.91
  },
  {
    "jobId": 1122,
    "score": 0.87
  }
]
```

Redis stores:

```text
jobId + recommendation score
```

Current Job details can then be retrieved from Elasticsearch or PostgreSQL.

Benefits:

- Lower Redis memory usage
- Less serialization overhead
- Less stale Job detail data
- Smaller cache payloads

---

# 7. Replace Global Invalidation with Selective Refresh

Do not do:

```text
JobUpdated
    ↓
DELETE ALL recommendation caches
```

Instead:

```text
JobUpdated
    ↓
Kafka
    ↓
Recommendation Service
    ↓
Determine impact
    ↓
Refresh affected users asynchronously
```

For a Job with:

```text
Java
Spring Boot
Kafka
Hanoi
```

only candidates related to those attributes need to be considered.

The goal is to reduce invalidation fan-out from:

```text
all users
```

to:

```text
affected users
```

---

# 8. Online Strategy: Merge Cached Recommendations with Fresh Jobs

A practical strategy is to avoid proactively recomputing every user's cache.

When a User requests recommendations:

```text
GET /recommendations
         ↓
      Redis
         │
         ├── cached recommendations
         │
         └── fresh/updated jobs from Elasticsearch
                    ↓
                  merge
                    ↓
                  rerank
                    ↓
                 Top N
```

Example:

```text
Cached:
[101, 102, 103, 104, 105]

Fresh jobs:
[201, 202]
```

After merge:

```text
[101, 102, 103, 104, 105, 201, 202]
```

After ranking:

```text
[201, 101, 202, 103, 104]
```

This lets users see relevant new Jobs without rebuilding recommendation caches for the entire population.

---

# 9. Reverse Index for Large-Scale Candidate Selection

At very large scale, maintain an index that maps attributes to users.

Conceptually:

```text
skill:java
    → user1, user2, user5, user10, ...

skill:spring
    → user1, user2, user7, ...

location:hanoi
    → user1, user5, user7, ...
```

For a Job requiring:

```text
Java + Spring + Hanoi
```

candidate selection can use:

```text
skill:java
    ∩
skill:spring
    ∩
location:hanoi
```

Instead of checking:

```text
1,000,000 users
```

the system may only evaluate a smaller affected candidate set.

At larger scale, Elasticsearch/OpenSearch or a dedicated indexing layer is generally more appropriate than putting the entire candidate graph into Redis.

---

# 10. Versioned Cache Keys

Current:

```text
recommendation:user:{userId}
```

Better:

```text
recommendation:u:{userId}:algo:{algorithmVersion}:p:{profileVersion}
```

Example:

```text
recommendation:u:123:algo:3:p:17
```

Meaning:

```text
userId            = 123
algorithmVersion  = 3
profileVersion    = 17
```

When the user updates the profile:

```text
profileVersion:
17 → 18
```

The application starts reading:

```text
recommendation:u:123:algo:3:p:18
```

No need to explicitly delete all old profile-versioned keys. The old key can expire naturally through TTL.

---

# 11. Why a Global Job Version Alone Is Not Enough

A tempting design is:

```text
recommendation:user:123:jobVersion:999
```

Then:

```text
Job updated
    ↓
global jobVersion++
```

This avoids a large `DELETE`, but still causes:

```text
all users → cache miss
all users → recompute
```

Therefore:

> Versioning solves logical invalidation cost, but a global version does not solve recomputation fan-out.

Use versions together with:

- selective refresh
- fresh candidate retrieval
- asynchronous workers
- stale-while-revalidate

---

# 12. Distributed Lock for Cache Misses

In a multi-instance Spring Boot deployment:

```text
App 1
App 2
App 3
App 4
```

do not rely on:

```java
synchronized
```

because it only synchronizes within one JVM.

A distributed lock can be implemented with Redisson:

```java
RLock lock =
    redissonClient.getLock("recommendation:lock:" + userId);

boolean acquired = lock.tryLock(
    100,
    10,
    TimeUnit.SECONDS
);

if (acquired) {
    try {
        // double-check Redis
        // calculate recommendation
        // save result
    } finally {
        lock.unlock();
    }
}
```

---

# 13. Double-Check After Acquiring the Lock

Do not do:

```java
if (cacheMiss) {
    acquireLock();
    calculate();
}
```

Use:

```text
Redis MISS
    ↓
Acquire lock
    ↓
Check Redis again
    ↓
Cache exists?
    ├── YES → return cached result
    └── NO  → calculate
```

Example:

```text
Request A → MISS
Request B → MISS

A → lock
A → calculate
A → save Redis
A → unlock

B → lock
B → check Redis again
B → HIT
B → return
```

This prevents duplicate calculations.

---

# 14. Stale-While-Revalidate

For high traffic, avoid forcing users to wait whenever a cache reaches its soft expiration.

Use two expiration levels:

```text
Soft TTL
Hard TTL
```

Example:

```text
Soft TTL = 30 minutes
Hard TTL = 2 hours
```

Store metadata:

```json
{
  "data": [...],
  "createdAt": "...",
  "softExpireAt": "...",
  "hardExpireAt": "..."
}
```

Logic:

```text
now < softExpire
    → return cache

softExpire < now < hardExpire
    → return stale cache
    → trigger background refresh

now > hardExpire
    → synchronous recomputation
```

This is commonly called:

> Stale-While-Revalidate

---

# 15. Add TTL Jitter

Avoid using exactly:

```java
TTL = 3600;
```

for every cache.

If many entries are created around the same time, they may expire together.

Instead:

```java
long ttl =
    3600 + ThreadLocalRandom.current().nextLong(600);
```

TTL becomes approximately:

```text
3601
3712
3890
4150
...
```

This spreads expiration over time.

---

# 16. Job Updates Should Be Event-Driven

Avoid doing expensive recommendation work inside the Job HTTP request:

```text
POST /jobs
    ↓
save Job
    ↓
recalculate recommendations
    ↓
HTTP response
```

Use:

```text
POST /jobs
    ↓
save Job
    ↓
publish event
    ↓
return response quickly

Kafka
    ↓
Recommendation Worker
    ↓
refresh asynchronously
```

Recommended events:

```text
JobCreated
JobUpdated
JobDeleted
UserProfileUpdated
JobClosed
```

---

# 17. Use the Outbox Pattern

Avoid relying on:

```text
DB transaction
    ↓
save Job
    ↓
publish Kafka message
```

because:

```text
DB SAVE SUCCESS
Kafka PUBLISH FAILED
```

can leave the system inconsistent.

Use:

```text
@Transactional
    ↓
save Job
+
save OutboxEvent
```

Database:

```text
jobs
outbox_events
```

Then:

```text
Outbox Publisher
    ↓
Kafka
```

Architecture:

```text
                    PostgreSQL
                ┌────────────────┐
                │ jobs            │
                │ outbox_events   │
                └───────┬────────┘
                        │
                        ↓
                Outbox Publisher
                        │
                        ↓
                      Kafka
                        │
          ┌─────────────┼──────────────┐
          ↓             ↓              ↓
 Recommendation    Notification    Analytics
```

---

# 18. Kafka Event Design

Example:

```java
public record JobUpdatedEvent(
    Long eventId,
    Long jobId,
    Long companyId,
    Set<String> changedFields,
    Instant occurredAt
) {}
```

Example message:

```json
{
  "eventId": 928173,
  "jobId": 1001,
  "companyId": 50,
  "changedFields": [
    "skills",
    "salary"
  ],
  "occurredAt": "2026-09-27T08:30:00Z"
}
```

Recommendation Service can determine whether changed fields actually affect recommendation.

Example:

```text
title typo
    → possibly no recomputation

skills / salary / location / experience
    → recommendation potentially affected
```

---

# 19. Kafka Consumer Idempotency

Kafka messages may be delivered more than once.

Example:

```text
JobUpdated event #100
JobUpdated event #100
```

The consumer should safely handle duplicates.

Possible storage:

```text
processed_events
    eventId
```

Flow:

```text
Kafka event
    ↓
check eventId
    ↓
already processed?
    ├── YES → ignore
    └── NO
         ↓
      process
         ↓
   mark processed
```

Recommendation updates should therefore be idempotent.

---

# 20. Redis Cluster

For large traffic, a single Redis instance may become a bottleneck.

Use Redis Cluster:

```text
             Redis Cluster
        ┌──────┼──────┐
        ↓      ↓      ↓
      Node1  Node2  Node3
        ↓      ↓      ↓
      Node4  Node5  Node6
```

Keys such as:

```text
recommendation:u:123
recommendation:u:456
recommendation:u:789
```

are distributed across the cluster.

This helps scale memory, throughput, and availability.

---

# 21. Keep Redis Values Small

Avoid storing complete objects such as entire Job and Company payloads.

Prefer:

```json
{
  "jobId": 1001,
  "score": 0.95
}
```

Then fetch Job details in bulk.

Avoid:

```text
20 recommendation entries
    ↓
20 individual DB queries
```

Prefer:

```sql
SELECT *
FROM jobs
WHERE id IN (?, ?, ?, ...);
```

or batch retrieval from Elasticsearch.

---

# 22. Elasticsearch / OpenSearch

A large Job recommendation system should separate candidate generation from ranking.

## Candidate Generation

```text
User profile
    ↓
Elasticsearch
    ↓
Top 100 candidate jobs
```

Possible filters:

```text
skills
location
salary
experience
job status
employment type
```

## Ranking

```text
100 candidates
    ↓
Ranking Engine
    ↓
Top 20
```

Example scoring model:

```text
score =
    skillMatch * 0.40
  + experienceMatch * 0.20
  + locationMatch * 0.15
  + salaryMatch * 0.15
  + behaviorScore * 0.10
```

The weights should be treated as product/business rules and tuned with data rather than assumed to be universally optimal.

---

# 23. Separate Candidate Generation from Ranking

Recommended pipeline:

```text
                 User Profile
                      ↓
          ┌────────────────────┐
          │ Candidate          │
          │ Generation         │
          └─────────┬──────────┘
                    ↓
              100 candidates
                    ↓
          ┌────────────────────┐
          │ Ranking Engine     │
          └─────────┬──────────┘
                    ↓
                 Top 20
```

This architecture also makes it easier to replace the scoring algorithm later with ML or AI.

---

# 24. End-to-End Request Flows

## Case A — Cache HIT

```text
GET /recommendations
        ↓
      Redis
        ↓
       HIT
        ↓
     return
```

## Case B — Cache MISS

```text
GET /recommendations
        ↓
      Redis MISS
        ↓
Acquire distributed lock
        ↓
Double-check Redis
        ↓
Elasticsearch
        ↓
Top 100 candidates
        ↓
Ranking
        ↓
Top 20
        ↓
Redis SET
        ↓
return
```

## Case C — Cache STALE

```text
GET /recommendations
        ↓
Redis stale
        ↓
return stale result
        │
        └────→ background refresh
```

## Case D — New Job

```text
Recruiter creates Job
        ↓
PostgreSQL
        ↓
Outbox
        ↓
Kafka
        ↓
Recommendation Consumer
        ↓
update indexes / fresh-job pool
        ↓
NO global cache deletion
```

## Case E — User updates profile

```text
User updates profile
        ↓
PostgreSQL
        ↓
profileVersion++
        ↓
Outbox
        ↓
Kafka
        ↓
Recommendation Service
        ↓
user-specific refresh
```

## Case F — Job is closed

```text
Job status = CLOSED
        ↓
Elasticsearch update
        ↓
Recommendation retrieval filters it out
        ↓
background refresh
```

---

# 25. Observability

Use:

```text
Micrometer
Prometheus
Grafana
```

Important metrics:

```text
recommendation_cache_hit_total
recommendation_cache_miss_total
recommendation_calculation_total
recommendation_calculation_duration
recommendation_lock_wait
redis_latency
redis_memory
kafka_consumer_lag
elasticsearch_latency
```

Especially monitor:

```text
Cache Hit Ratio
```

Formula:

```text
cache hit ratio =
    hits / (hits + misses)
```

A sudden drop in hit ratio can indicate cache expiry problems, invalidation storms, or upstream failures.

---

# 26. Recommended Cache Strategy

A production-oriented strategy:

```text
Soft TTL = 30 minutes
Hard TTL = 2 hours

Add random jitter
Use profile versioning
Use algorithm versioning
Use distributed lock
Use double-check
Use stale-while-revalidate
```

Conceptually:

```text
Cache
 ├── Fresh
 │    → return
 │
 ├── Stale
 │    → return stale
 │    → refresh async
 │
 └── Expired
      → distributed lock
      → calculate once
      → update Redis
```

The concrete TTLs should be derived from product freshness requirements and observed traffic rather than treated as universal defaults.

---

# 27. Recommended IT_JOB Architecture

```text
                         ┌──────────────┐
                         │ PostgreSQL   │
                         └──────┬───────┘
                                │
                              Outbox
                                ↓
                              Kafka
                                │
             ┌──────────────────┼──────────────────┐
             ↓                  ↓                  ↓
          Job Event         User Event         Apply Event
             │                                     │
             └──────────────┐                      ↓
                            ↓                  Analytics
                    Recommendation
                         Service
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
            Redis     Elasticsearch     Worker
              │             │
              └──────┬──────┘
                     ↓
                 API Gateway
                     ↓
                   User
```

---

# 28. Implementation Roadmap

## Phase 1 — Redis Architecture

Remove:

```text
KEYS
global delete
recompute on every miss
fixed TTL
```

Add:

```text
Redis Cluster
TTL jitter
distributed locking
double-check
stale-while-revalidate
profileVersion
algorithmVersion
compact cache payload
```

This phase directly improves cache correctness and runtime behavior.

## Phase 2 — Event-Driven Processing

Add:

```text
Kafka
Outbox Pattern
JobCreatedEvent
JobUpdatedEvent
JobDeletedEvent
JobClosedEvent
UserProfileUpdatedEvent
```

Recommendation work moves to asynchronous consumers/workers instead of blocking Job/User HTTP requests.

## Phase 3 — Recommendation Platform

Add:

```text
Elasticsearch / OpenSearch
Candidate Generation
Ranking Engine
Background Worker
Recommendation Analytics
```

Pipeline:

```text
Job/User Event
      ↓
    Kafka
      ↓
Recommendation Worker
      ↓
Candidate Retrieval
      ↓
Ranking
      ↓
Redis
```

---

# 29. Optional AI / ML Extension

The architecture can later support semantic or ML-based recommendations:

```text
User Profile
      +
Job Description
      ↓
Embedding
      ↓
Vector Search
      ↓
Candidate Jobs
      ↓
ML / AI Ranking
      ↓
Top 20
      ↓
Redis
```

Possible technologies:

```text
pgvector
OpenSearch vector search
Elasticsearch vector search
```

Avoid calling an LLM synchronously for every recommendation HTTP request.

Prefer:

```text
Async Worker
    ↓
calculate
    ↓
Redis
    ↓
User request
    ↓
fast response
```

---

# 30. Final Comparison

| Current approach | Large-scale approach |
|---|---|
| `KEYS recommendation:*` | No keyspace scan in request path |
| Delete all caches | Selective refresh / logical invalidation |
| Fixed TTL | TTL + jitter |
| Redis MISS → calculate | Lock + double-check |
| Cache entire DTO | Cache IDs + scores |
| Job update → delete all | Kafka event |
| DB + Kafka directly | Outbox Pattern |
| Synchronous recommendation | Async worker |
| Large DB scanning | Elasticsearch / OpenSearch |
| Single Redis | Redis Cluster |
| No cache metrics | Micrometer + Prometheus + Grafana |

---

# 31. Target Architecture Summary

The desired system should behave like:

```text
                   ┌──────────────┐
                   │ PostgreSQL   │
                   └──────┬───────┘
                          │
                       Outbox
                          ↓
                        Kafka
                          ↓
                ┌───────────────────┐
                │ Recommendation    │
                │ Worker             │
                └─────────┬─────────┘
                          ↓
                 Elasticsearch
                          ↓
                       Ranking
                          ↓
                        Redis
                          ↓
                         User
```

Online request:

```text
Redis HIT
    → immediate response

Redis STALE
    → return stale data
    → background refresh

Redis MISS
    → distributed lock
    → calculate once
    → cache result
```

Avoid:

```text
1 Job changed
      ↓
500,000 DELETE
      ↓
500,000 MISS
      ↓
500,000 RECOMPUTE
```

## Key Principles

1. Avoid global invalidation.
2. Move expensive work to asynchronous processing.
3. Use Redis for hot data, not as the source of truth.
4. Use Elasticsearch/OpenSearch for candidate retrieval.
5. Protect cache misses with distributed locking.
6. Use stale-while-revalidate to absorb traffic spikes.
7. Use TTL jitter to prevent synchronized expiry.
8. Use Outbox + Kafka for reliable event propagation.
9. Keep recommendation cache payloads small.
10. Measure the system with cache, Kafka, Redis, and search metrics.

---

## Recommended End State for IT_JOB

```text
PostgreSQL
   │
   ├── jobs / users / applications
   │
   └── outbox_events
          │
          ↓
        Kafka
          │
          ├── Recommendation Worker
          │       │
          │       ├── Elasticsearch
          │       ├── Ranking Engine
          │       └── Redis
          │
          ├── Notification Service
          │
          └── Analytics Service
```

The result is a system where:

```text
one Job update
    ≠
all Users recompute
```

Instead, recommendation updates are propagated asynchronously, only relevant candidates are considered, hot results are cached, concurrent misses are controlled, and the expensive parts can scale independently.
