---
title: "Delta Time Travel: query the past with confidence"
summary: "Query previous versions with Time Travel and recover data safely."
description: "Learn `versionAsOf` and `timestampAsOf`, validate changes, and understand when time travel is best for auditing, recovery, and regression analysis in Delta Lake."
date: 2026-02-01
tags: ["delta", "spark", "databricks", "testing", "certificacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "delta-time-travel-basics"
series: ["Spark & Delta 101"]
series_index: 3
notebook_ipynb: "/notebooks/spark-101/03-delta-time-travel-basics.ipynb"
notebook_py: "/notebooks/spark-101/03-delta-time-travel-basics.py"
---

{{< series_nav >}}

Time travel is one of the most useful Delta features. It lets you query older versions of your table without backups. This post shows a simple before/after so you can trust it in real work. Ref: [Delta Time Travel](https://docs.delta.io/latest/delta-batch.html#time-travel).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- Delta tables keep versions in the transaction log.
- You can query older versions with `versionAsOf` or `timestampAsOf`.
- Use it for audits, debugging, and rollback verification.

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

## Create a small Delta table
If you already ran **Delta Table 101**, you can reuse the same table path. Otherwise, run the snippet below.
```python
from pyspark.sql import functions as F

delta_path = "/tmp/delta/time_travel"

df_v1 = spark.range(0, 10_000).withColumn("status", F.lit("v1"))
df_v1.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Update the table (new version)
Overwrite to create a new version.
```python
df_v2 = spark.range(0, 10_000).withColumn("status", F.lit("v2"))
df_v2.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Read older version
Read version 0 to compare with the latest.
```python
v1 = (
    spark.read.format("delta")
         .option("versionAsOf", 0)
         .load(delta_path)
)

v1.groupBy("status").count().show()
```

**Expected output (example):**
```
+------+-----+
|status|count|
+------+-----+
|    v1|10000|
```

---

## What to verify
- Version 0 shows `status = v1`.
- Latest version shows `status = v2`.
- You can compare row counts across versions.

---

## Notes from practice
- Use time travel for audits, not as a permanent backup strategy.
- If you vacuum aggressively, older versions may disappear.
- Document the version you used when sharing results.

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
