---
title: "Spark partitions without the pain"
summary: "How partitions affect performance and how to control them in Spark."
description: "Introduce `spark.sql.shuffle.partitions`, repartition, and coalesce with a reproducible example to see impact on stages, time, and shuffle size."
date: 2026-02-01
draft: true
tags: ["spark", "optimizacion", "infra", "testing", "certificacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "spark-partitions-basics"
series: ["Spark & Delta 101"]
series_index: 5
notebook_ipynb: "/notebooks/spark-101/05-spark-partitions-basics.ipynb"
notebook_py: "/notebooks/spark-101/05-spark-partitions-basics.py"
---

{{< series_nav >}}

Partitions are the unit of parallelism in Spark. This post shows how partition count changes task distribution and performance. Ref: [repartition](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.repartition.html), [coalesce](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.coalesce.html).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- Too few partitions underutilize the cluster.
- Too many partitions add overhead.
- You can inspect partitions and adjust them safely.

---

## Run it yourself
- **Local Spark (Docker):** main path for this blog.
- **Databricks Free Edition:** quick alternative if you do not want Docker.

```bash
docker compose up
```

Links:
- [Apache Spark tool](/tools/apache-spark/)
- [Databricks Free Edition](https://www.databricks.com/try-databricks)

---

## Create a dataset
Use a large range to see partition behavior.
```python
df = spark.range(0, 5_000_000)
```

---

## Check current partitions
Inspect how many partitions the DataFrame has.
```python
df.rdd.getNumPartitions()
```

**Expected output (example):**
```
8
```

---

## Repartition vs coalesce
Compare both to understand their impact.
```python
df_repart = df.repartition(64)
df_coal = df.coalesce(8)
```

**Expected output:**
`df_repart` has 64 partitions; `df_coal` has 8 or fewer.

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

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
