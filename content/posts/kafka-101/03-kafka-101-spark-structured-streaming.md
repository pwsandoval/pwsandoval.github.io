---
title: "Read Kafka with Spark Streaming"
summary: "Read a Kafka topic with Spark Structured Streaming and validate console output."
description: "Connect local Kafka to Spark Structured Streaming, define a schema, and run a continuous read. Includes simple metrics and validations to confirm the stream is working."
date: 2026-02-01
draft: true
tags: ["kafka", "spark", "streaming", "infra", "testing"]
difficulty: "basico"
reading_time: "11 min"
slug: "kafka-101-spark-structured-streaming"
paths: ["Kafka 101"]
paths_index: 3
notebook_ipynb: "/notebooks/kafka-101/03-kafka-101-spark-structured-streaming.ipynb"
notebook_py: "/notebooks/kafka-101/03-kafka-101-spark-structured-streaming.py"
---

{{< paths_nav >}}

This post connects Spark Structured Streaming to a local Kafka topic and reads messages in real time. Ref: [Structured Streaming + Kafka](https://spark.apache.org/docs/latest/structured-streaming-kafka-integration.html).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- Spark can read Kafka topics directly using the Kafka connector.
- You can validate end-to-end streaming locally.
- This is the bridge between ingestion and processing.

---

## Run it yourself
- **Local Docker:** default path for this blog.

```bash
docker compose up
```

Links:
- [Apache Kafka tool](/tools/apache-kafka/)
- [Apache Spark tool](/tools/apache-spark/)

---

## Produce messages
```bash
kafka-console-producer.sh --topic demo-events --bootstrap-server localhost:9092
```

---

## Read with Spark Structured Streaming
```python
df = (
    spark.readStream.format("kafka")
         .option("kafka.bootstrap.servers", "localhost:9092")
         .option("subscribe", "demo-events")
         .load()
)

out = df.selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)")

q = (
    out.writeStream.format("console")
       .outputMode("append")
       .option("truncate", False)
       .start()
)
```

**Expected output:**
You should see new rows in the console when you produce messages.

---

## What to verify
- Messages appear in the Spark console sink.
- The streaming query stays active while you produce data.
- Stopping the producer does not crash the query.

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
