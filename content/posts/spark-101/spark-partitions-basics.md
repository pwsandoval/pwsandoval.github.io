---
title: "Spark partitions 101: why they matter for performance"
date: 2026-02-01
tags: ["spark", "databricks", "optimizacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "spark-partitions-basics"
series: ["Spark & Delta 101"]
series_index: 5
---

Series: **Spark & Delta 101 (5/5)**

Partitions are the unit of parallelism in Spark. This post shows how partition count changes task distribution and why it affects performance.

## Quick takeaways
- Too few partitions underutilize the cluster.
- Too many partitions add overhead.
- You can inspect partitions and adjust them safely.

---

## Run it yourself
- **Local Spark (Full Docker):** default path for this blog.
- **Databricks Free Edition:** quick alternative if you do not want Docker.

```bash
docker compose up
```

Links:
- [Apache Spark tool](/tools/apache-spark/)
- [Databricks Free Edition](https://www.databricks.com/try-databricks)

---

## Create a dataset
```python
df = spark.range(0, 5_000_000)
```

---

## Check current partitions
```python
df.rdd.getNumPartitions()
```

---

## Repartition vs coalesce
```python
df_repart = df.repartition(64)
df_coal = df.coalesce(8)
```

---

## What to verify
- The number of partitions changes as expected.
- More partitions increase tasks; fewer partitions reduce them.
- Task duration becomes more balanced with a reasonable count.

---

## Notes from practice
- Start with defaults; adjust only when the evidence is clear.
- Repartition triggers a full shuffle; coalesce avoids one.
- Use Spark UI to see how partitions map to tasks.
