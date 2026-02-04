---
title: "Apache Kafka"
icon: "apache-kafka.svg"
summary: "Event streaming platform for high‑throughput pipelines and real‑time analytics."
---

Kafka is the tool used in this blog to demonstrate ingestion, buffering, and decoupled pipelines.

## Recommended path (local and free)
Use Docker so the setup is reproducible.

**Workflow**
1. Start the stack with `docker compose up`.
2. Create a topic.
3. Produce a few messages.
4. Consume and verify.

## What to measure (for performance topics)
- Throughput (messages/second).
- Consumer lag.
- End‑to‑end latency.
