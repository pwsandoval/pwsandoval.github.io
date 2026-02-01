---
title: "Apache Kafka"
icon: "apache-kafka.svg"        # ruta dentro de /static/icons/
summary: "Distributed event streaming platform for high-throughput data pipelines and real-time analytics."
# url: "/tools/apache-kafka/"
---

## Purpose
Kafka is the event streaming platform used in the blog to demonstrate ingestion, buffering, and decoupled pipelines.

## Recommended path (local + free)
Use Docker so the setup is reproducible and free for new teammates.

**Workflow**
1. Start the stack with `docker compose up`.
2. Create a topic.
3. Produce a few messages.
4. Consume and verify them.

## What to measure (when you move to performance topics)
- Message throughput (messages/sec).
- Consumer lag (if applicable).
- End-to-end latency (produce → consume).
