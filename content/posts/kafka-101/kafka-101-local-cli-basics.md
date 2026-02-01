---
title: "Kafka 101: local setup + CLI basics"
date: 2026-02-01
tags: ["kafka", "infra"]
difficulty: "basico"
reading_time: "9 min"
slug: "kafka-101-local-cli-basics"
series: ["Kafka 101"]
series_index: 1
---

Series: **Kafka 101 (1/3)**

This post gets you running locally and proves Kafka works with the minimal CLI loop: create a topic, produce messages, and consume them.

## Quick takeaways
- Kafka is easiest to learn locally with Docker.
- CLI is enough to validate your setup.
- Once this works, you can integrate with Spark or Python.

---

## Run it yourself
- **Local Docker:** default path for this blog.
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

---

## What to verify
- Messages you typed are visible in the consumer.
- The topic has the partition count you set.
- You can stop and restart the consumer without data loss.
