---
title: "🛠️ Basic Environment Check (Jupyter + Spark Local)"
date: 2025-10-06T23:05:18-05:00
draft: false
description: ""
tags: [spark, jupyter, basic]
categories: ["blog"]
---

### Quick steps

- Start a local Spark session
- Print the Spark version
- Run a simple row count
- Write & read a small Parquet dataset under ./data

> Tip: Keep this notebook as your first-run check for any lab session

## 1) Paths and data folder

We resolve path for `data/` folder, all files written here persist on your host


```python
from pathlib import Path

base_dir = Path.cwd().parent
data_dir = base_dir / "data" / "00_env_check"

print("Project base folder:", base_dir)
print("Project data folder:", data_dir)
```

    Project base folder: /home/jovyan/work
    Project data folder: /home/jovyan/work/data/00_env_check


## 2) Spark session and version

Creates a local Spark session, the Spark UI should use port **4040**


```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("pw0 - env check")
    .config("spark.ui.port", "4040")
    .getOrCreate()
)

spark
```
<div>
    <p><b>SparkSession - in-memory</b></p>

    <div>
        <p><b>SparkContext</b></p>

        <p><a href="http://5bebdeb0c884:4041">Spark UI</a></p>

        <dl>
        <dt>Version</dt>
            <dd><code>v4.0.1</code></dd>
        <dt>Master</dt>
            <dd><code>local[*]</code></dd>
        <dt>AppName</dt>
            <dd><code>pw0 - env check</code></dd>
        </dl>
    </div>

</div>




> Open http://localhost:4040 to confirm the Spark UI loads (header and app name)

## 3) Simple count

Perform a basic count with the timing to perform the operation


```python
import time

start = time.perf_counter()
df1 = spark.range(0, 1_000_000)
total = df1.count()
elapsed = time.perf_counter() - start

print("Rows counted:", total)
print(f"Time elapsed: {elapsed:.3f} s")
```

    Rows counted: 1000000
    Time elapsed: 0.098 s


## 4) Write & read parquet

Writes a small dataset to `data/` and reads it back, this verifies your folder mapping and permissions


```python
import os, shutil

df1.write.mode("overwrite").parquet(str(data_dir))
df2 = spark.read.parquet(str(parquet_path))

print("Rows read from parquet:", df2.count())
```

    Rows read from parquet: 1000000



```python
%ls ../data/00_env_check
```

    _SUCCESS
    part-00000-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00001-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00002-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00003-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00004-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00005-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00006-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00007-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00008-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00009-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00010-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00011-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet


## 6) Shutdown

Close the session to release resources when you're done


```python
spark.stop()
print("Spark session stopped")
```

    Spark session stopped
# Lab 0 - Basic environment check (Jupyter + Spark, local)

### Quick steps

- Start a local Spark session
- Print the Spark version
- Run a simple row count
- Write & read a small Parquet dataset under ./data

> Tip: Keep this notebook as your first-run check for any lab session

## 1) Paths and data folder

We resolve path for `data/` folder, all files written here persist on your host


```python
from pathlib import Path

base_dir = Path.cwd().parent
data_dir = base_dir / "data" / "00_env_check"

print("Project base folder:", base_dir)
print("Project data folder:", data_dir)
```

    Project base folder: /home/jovyan/work
    Project data folder: /home/jovyan/work/data/00_env_check


## 2) Spark session and version

Creates a local Spark session, the Spark UI should use port **4040**


```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("pw0 - env check")
    .config("spark.ui.port", "4040")
    .getOrCreate()
)

spark
```





    <div>
        <p><b>SparkSession - in-memory</b></p>

<div>
    <p><b>SparkContext</b></p>

    <p><a href="http://5bebdeb0c884:4041">Spark UI</a></p>

    <dl>
      <dt>Version</dt>
        <dd><code>v4.0.1</code></dd>
      <dt>Master</dt>
        <dd><code>local[*]</code></dd>
      <dt>AppName</dt>
        <dd><code>pw0 - env check</code></dd>
    </dl>
</div>

    </div>




> Open http://localhost:4040 to confirm the Spark UI loads (header and app name)

## 3) Simple count

Perform a basic count with the timing to perform the operation


```python
import time

start = time.perf_counter()
df1 = spark.range(0, 1_000_000)
total = df1.count()
elapsed = time.perf_counter() - start

print("Rows counted:", total)
print(f"Time elapsed: {elapsed:.3f} s")
```

    Rows counted: 1000000
    Time elapsed: 0.098 s


## 4) Write & read parquet

Writes a small dataset to `data/` and reads it back, this verifies your folder mapping and permissions


```python
import os, shutil

df1.write.mode("overwrite").parquet(str(data_dir))
df2 = spark.read.parquet(str(parquet_path))

print("Rows read from parquet:", df2.count())
```

    Rows read from parquet: 1000000



```python
%ls ../data/00_env_check
```

    _SUCCESS
    part-00000-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00001-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00002-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00003-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00004-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00005-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00006-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00007-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00008-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00009-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00010-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet
    part-00011-b68ec6ae-95c2-4359-bbe6-0245b81925da-c000.snappy.parquet


## 6) Shutdown

Close the session to release resources when you're done


```python
spark.stop()
print("Spark session stopped")
```

    Spark session stopped
