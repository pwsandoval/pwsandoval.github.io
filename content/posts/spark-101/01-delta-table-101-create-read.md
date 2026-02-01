---
title: "Delta Table 101: create, read, and overwrite safely"
date: 2026-02-01
tags: ["delta", "spark", "databricks"]
difficulty: "basico"
reading_time: "9 min"
slug: "delta-table-101-create-read"
series: ["Spark & Delta 101"]
series_index: 1
cover:
  image: "/images/posts/cover-delta-table-101.svg"
  alt: "Cover: Delta Table 101"
  caption: "Delta basics for new Spark users"
  relative: false
  hidden: false
---

{{< series_nav >}}

{{< notebook_buttons >}}

If you are new to Delta Lake, this is the first post to run. It focuses on the minimal actions you do in real work: create a Delta table, read it back, and overwrite it safely.

## Quick takeaways
- Delta tables are regular files + transaction log.
- You can read/write Delta like a normal table, but with reliability.
- This post gives you a minimal, reproducible flow to start.

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

## Minimal setup
We will generate a small dataset, write it as Delta, then read it back.

```python
from pyspark.sql import functions as F

df = (
    spark.range(0, 100_000)
         .withColumn("group", (F.col("id") % 10).cast("int"))
)
```

---

## Create the Delta table
```python
delta_path = "/tmp/delta/table_101"

df.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Read it back
```python
read_back = spark.read.format("delta").load(delta_path)
read_back.groupBy("group").count().show()
```

---

## Overwrite safely (same schema)
```python
df_filtered = df.filter("group < 5")
df_filtered.write.format("delta").mode("overwrite").save(delta_path)
```

---

## What to verify
- The table reads without errors.
- Counts change after overwrite.
- The folder contains a `_delta_log` directory.

---

## Notes from practice
- Always use `format("delta")` explicitly to avoid ambiguity.
- Start with a local path so you can inspect files on disk.
- Keep paths simple for beginners.
