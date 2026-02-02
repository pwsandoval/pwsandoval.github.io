---
title: "Delta storage layout: what’s really on disk"
date: 2026-02-01
tags: ["delta", "spark", "infra", "testing", "certificacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "delta-storage-layout-basics"
series: ["Spark & Delta 101"]
series_index: 4
notebook_ipynb: "/notebooks/spark-101/04-delta-storage-layout-basics.ipynb"
notebook_py: "/notebooks/spark-101/04-delta-storage-layout-basics.py"
cover:
  image: "/images/posts/delta-storage-layout-basics-nord.png"
  alt: "Delta storage layout: what’s really on disk"
  relative: false
  hidden: false
images:
  - "/images/posts/delta-storage-layout-basics-nord.png"
---

{{< series_nav >}}

Delta tables are Parquet files plus a transaction log. This post helps you see the folder structure and build intuition about what Delta writes to disk. Ref: [Delta transaction log](https://docs.delta.io/latest/delta-batch.html#delta-transaction-log).

Downloads at the end: [go to Downloads](#downloads).

## Quick takeaways
- Delta tables store data in Parquet files.
- The `_delta_log` folder tracks all versions and changes.
- You can inspect the files to understand how Delta works.

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
Create a table we can inspect on disk.
```python
from pyspark.sql import functions as F

delta_path = "/tmp/delta/storage_layout"

df = spark.range(0, 50_000).withColumn("group", (F.col("id") % 5).cast("int"))
df.write.format("delta").mode("overwrite").save(delta_path)
```

**Expected output:**
You should see `_delta_log` and Parquet files in the folder.

---

## Inspect the folder structure
List directories to confirm the layout.
```python
import os

for root, dirs, files in os.walk(delta_path):
    level = root.replace(delta_path, "").count(os.sep)
    indent = "  " * level
    print(f"{indent}{os.path.basename(root)}/")
    for f in files[:5]:
        print(f"{indent}  {f}")
```

**Expected output (example):**
```
storage_layout/
  _delta_log/
  part-00000-...
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

---

## Downloads {#downloads}
If you want to run this without copying code, download the notebook or the .py export.

{{< notebook_buttons >}}
