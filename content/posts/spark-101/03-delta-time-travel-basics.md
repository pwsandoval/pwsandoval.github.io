---
title: "Delta Time Travel: view older versions without backups"
date: 2026-02-01
tags: ["delta", "spark", "databricks"]
difficulty: "basico"
reading_time: "10 min"
slug: "delta-time-travel-basics"
series: ["Spark & Delta 101"]
series_index: 3
cover:
  image: "/images/posts/cover-delta-time-travel.svg"
  alt: "Cover: Delta Time Travel"
  caption: "Delta time travel made simple"
  relative: false
  hidden: false
---

{{< series_nav >}}

{{< notebook_buttons >}}

Time travel is one of the most useful Delta features. It lets you query older versions of your table without backups. This post shows a simple before/after so you can trust it in real work.

## Quick takeaways
- Delta tables keep versions in the transaction log.
- You can query older versions with `versionAsOf` or `timestampAsOf`.
- Use it for audits, debugging, and rollback verification.

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
```python
df_v2 = spark.range(0, 10_000).withColumn("status", F.lit("v2"))
df_v2.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Read older version
```python
v1 = (
    spark.read.format("delta")
         .option("versionAsOf", 0)
         .load(delta_path)
)

v1.groupBy("status").count().show()
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
