---
title: "Kafka 101: consumer groups and offsets"
date: 2026-02-01
tags: ["kafka", "infra"]
difficulty: "basico"
reading_time: "10 min"
slug: "kafka-101-consumer-groups"
series: ["Kafka 101"]
series_index: 2
---

Series: **Kafka 101 (2/3)**

This post shows how consumer groups distribute work and how offsets move. It is the mental model you need before streaming with Spark.

## Quick takeaways
- Consumer groups split partitions across instances.
- Offsets track where each consumer group is in the topic.
- Rebalancing is normal when consumers start or stop.

---

## Run it yourself
- **Local Docker:** default path for this blog.

```bash
docker compose up
```

Links:
- [Apache Kafka tool](/tools/apache-kafka/)

---

## Start two consumers in the same group
```bash
kafka-console-consumer.sh --topic demo-events --bootstrap-server localhost:9092 --group demo-group
```

Open a second terminal and run the same command. Produce a few messages and observe how they are split.

---

## Check group offsets
```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group demo-group
```

---

## What to verify
- Each consumer receives a subset of partitions.
- Offsets advance as messages are consumed.
- Rebalancing happens when a consumer stops.
