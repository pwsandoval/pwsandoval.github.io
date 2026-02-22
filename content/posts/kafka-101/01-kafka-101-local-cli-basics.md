---
title: "Local Kafka with CLI, your first run"
summary: "Create a local topic, produce and consume messages, and understand the basic flow."
description: "Kafka CLI first steps: create topics, produce events, and consume from console in a reproducible local environment. Great for practice without cloud dependencies."
date: 2026-02-01
draft: true
tags: ["kafka", "infra", "streaming", "testing", "certificacion"]
difficulty: "basico"
reading_time: "9 min"
slug: "kafka-101-local-cli-basics"
paths: ["Kafka 101"]
paths_index: 1
notebook_ipynb: "/notebooks/kafka-101/01-kafka-101-local-cli-basics.ipynb"
notebook_py: "/notebooks/kafka-101/01-kafka-101-local-cli-basics.py"
---

{{< paths_nav >}}

This post gets you running locally and proves Kafka works with the minimal CLI loop: create a topic, produce messages, and consume them. Ref: [Kafka quickstart](https://kafka.apache.org/quickstart).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- Kafka is easiest to learn locally with Docker.
- CLI is enough to validate your setup.
- Once this works, you can integrate with Spark or Python.

---

## Run it yourself
- **Local Docker:** main path for this blog.
- **Databricks:** not needed for this post.

```bash
docker compose up
```

Links:
- [Apache Kafka tool](/tools/apache-kafka/)

---

## Create a topic
```bash
kafka-topics.sh --create --topic demo-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

**Expected output (example):**
```
Created topic demo-events.
```

---

## Produce messages
```bash
kafka-console-producer.sh --topic demo-events --bootstrap-server localhost:9092
```

Type a few lines and press Enter.

---

## Consume messages
```bash
kafka-console-consumer.sh --topic demo-events --from-beginning --bootstrap-server localhost:9092
```

**Expected output:**
You will see the lines you typed in the producer.

---

## What to verify
- Messages you typed are visible in the consumer.
- The topic has the partition count you set.
- You can stop and restart the consumer without data loss.

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
