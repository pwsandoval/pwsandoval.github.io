---
title: "Salting in Spark: fix skewed joins with simple evidence"
date: 2026-02-01
tags: ["spark", "databricks", "optimizacion"]
difficulty: "intermedio"
reading_time: "10 min"
slug: "salting-skewed-joins-spark"
cover:
  image: "/images/posts/cover-salting-skew-spark.svg"
  alt: "Cover: Spark Salting for Skewed Joins"
  caption: "Salting to fix skewed joins in Spark"
  relative: false
  hidden: false
---

## Summary
- Problem: skewed keys create a hotspot that dominates the join stage.
- Optimization: salting splits heavy keys to spread work across partitions.
- Evidence: lower stage duration, less skew, more balanced task times.
- Use when: a small set of keys dominates the join workload.
- Avoid when: keys are already balanced or the heavy keys are not stable.

---

## 1) Problem and context
Skewed joins happen when a small number of keys dominate the data. Spark assigns those keys to a few tasks, creating stragglers and long stages. This is common in event logs, user activity, or product catalogs with power‑users or hot items.

---

## 2) Minimal reproducible setup
- **Large table:** synthetic events with a skewed key distribution.
- **Small lookup:** a dimension table with unique keys.
- **Run options:**
  - **Databricks Free Edition** (fastest path).
  - **Local Spark (Full Docker)** via the Apache Spark tool page.

---

## 3) Baseline approach (before)
Join on the skewed key with no mitigation. The result is correct, but the join stage shows a few very slow tasks because of the hot key.

### Baseline snippet
```python
from pyspark.sql import functions as F

# Skewed events: 90% of rows share the same key
events = (
    spark.range(0, 10_000_000)
         .withColumn("key", F.when(F.col("id") < 9_000_000, F.lit(1)).otherwise(F.col("id")))
)

# Lookup table
lookup = spark.range(0, 10_001).withColumnRenamed("id", "key")

# Baseline join
baseline = events.join(lookup, on="key", how="left")
baseline.count()
```

---

## 4) Optimization (after)
Add a salt column to spread the hot key across multiple partitions, then join using the salted key.

### Optimized snippet
```python
from pyspark.sql import functions as F

salt_buckets = 16

events_salted = events.withColumn(
    "salt",
    F.when(F.col("key") == 1, (F.rand() * salt_buckets).cast("int")).otherwise(F.lit(0))
)

lookup_salted = (
    lookup
        .withColumn("salt", F.explode(F.array([F.lit(i) for i in range(salt_buckets)])))
)

optimized = events_salted.join(lookup_salted, on=["key", "salt"], how="left")
optimized.count()
```

---

## 5) Evidence / metrics
Capture both **before** and **after** using the Spark UI or SQL tab.

**Metrics to compare**
- Join stage duration.
- Task time distribution (max vs median).
- Shuffle read/write in the join stage.

**Suggested screenshots**
- Spark UI: task time skew in baseline join.
- Spark UI: balanced tasks after salting.
- SQL tab: physical plan showing the salted join.

---

## 6) Final snippets (copy-ready)
```python
# Baseline
baseline = events.join(lookup, on="key", how="left")
```

```python
# Salting (optimized)
optimized = events_salted.join(lookup_salted, on=["key", "salt"], how="left")
```

```python
# Quick plan check
optimized.explain(True)
```

---

## 7) Toward production (Databricks checklist)
- Detect skew with simple key frequency checks.
- Start with a small salt_buckets value and measure.
- Document the salting logic and the expected skew pattern.
- Revalidate after schema or data distribution changes.

---

## 8) References
- Apache Spark SQL join optimization docs.
- Databricks guidance on handling skew.

---

## Tools (run it yourself)
- **Databricks Free Edition:** fastest path with minimal setup.
- **Local:** use the **Apache Spark** tool (Full Docker) under `/tools/apache-spark/`.
