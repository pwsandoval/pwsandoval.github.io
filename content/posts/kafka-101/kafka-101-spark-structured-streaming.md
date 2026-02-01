---
title: "Kafka 101: Spark Structured Streaming read"
date: 2026-02-01
tags: ["kafka", "spark", "streaming"]
difficulty: "basico"
reading_time: "11 min"
slug: "kafka-101-spark-structured-streaming"
series: ["Kafka 101"]
series_index: 3
---

Series: **Kafka 101 (3/3)**

This post connects Spark Structured Streaming to a local Kafka topic and reads messages in real time.

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

---

## What to verify
- Messages appear in the Spark console sink.
- The streaming query stays active while you produce data.
- Stopping the producer does not crash the query.
