---
title: "Delta storage layout: parquet files + _delta_log"
date: 2026-02-01
tags: ["delta", "spark", "databricks"]
difficulty: "basico"
reading_time: "10 min"
slug: "delta-storage-layout-basics"
series: ["Spark & Delta 101"]
series_index: 4
---

Series: **Spark & Delta 101 (4/5)**

Delta tables are just Parquet files plus a transaction log. This post helps you see the folder structure and build intuition about what Delta actually writes to disk.

## Quick takeaways
- Delta tables store data in Parquet files.
- The `_delta_log` folder tracks all versions and changes.
- You can inspect the files to understand how Delta works.

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
```python
from pyspark.sql import functions as F

delta_path = "/tmp/delta/storage_layout"

df = spark.range(0, 50_000).withColumn("group", (F.col("id") % 5).cast("int"))
df.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Inspect the folder structure
```python
import os

for root, dirs, files in os.walk(delta_path):
    level = root.replace(delta_path, "").count(os.sep)
    indent = "  " * level
    print(f"{indent}{os.path.basename(root)}/")
    for f in files[:5]:
        print(f"{indent}  {f}")
```

---

## What to verify
- You see a `_delta_log/` directory.
- You see Parquet files in the table root.
- The table still reads normally via `format("delta")`.

---

## Notes from practice
- Do not edit `_delta_log` files manually.
- The log is what makes time travel and ACID possible.
- Understanding the layout helps when debugging storage issues.
