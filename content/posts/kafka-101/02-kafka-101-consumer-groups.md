---
title: "Kafka consumer groups, explained"
summary: "Understand how consumer groups and partitions split work."
description: "Explains offsets, partitions, and rebalances with a runnable example that shows how consumption is split across consumers and what happens when scaling or failures occur."
date: 2026-02-01
draft: true
tags: ["kafka", "infra", "streaming", "testing", "certificacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "kafka-101-consumer-groups"
series: ["Kafka 101"]
series_index: 2
notebook_ipynb: "/notebooks/kafka-101/02-kafka-101-consumer-groups.ipynb"
notebook_py: "/notebooks/kafka-101/02-kafka-101-consumer-groups.py"
---

{{< series_nav >}}

This post shows how consumer groups distribute work and how offsets move. It is the mental model you need before streaming with Spark. Ref: [Consumer groups](https://kafka.apache.org/documentation/#intro_consumers).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- Consumer groups split partitions across instances.
- Offsets track where each consumer group is in the topic.
- Rebalancing is normal when consumers start or stop.

---

## Run it yourself
- **Local Docker:** main path for this blog.

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

**Expected output (example):**
```
TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
demo-events 0  42  42  0
```

---

## What to verify
- Each consumer receives a subset of partitions.
- Offsets advance as messages are consumed.
- Rebalancing happens when a consumer stops.

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
