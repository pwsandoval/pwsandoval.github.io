---
title: "Qué guarda Delta en disco"
summary: "Qué archivos se crean en Delta (Parquet + _delta_log) y cómo inspeccionarlos."
description: "Explora el layout en disco, commits y checkpoints, y entiende por qué esto importa para performance, mantenimiento y troubleshooting en producción."
date: 2026-02-01
draft: true
tags: ["delta", "spark", "infra", "testing", "certificacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "delta-storage-layout-basics"
series: ["Spark & Delta 101"]
series_index: 4
notebook_ipynb: "/notebooks/spark-101/04-delta-storage-layout-basics.ipynb"
notebook_py: "/notebooks/spark-101/04-delta-storage-layout-basics.py"
cover:
  image: "/images/posts/delta-storage-layout-basics.webp"
  alt: "Delta storage layout: qué hay realmente en disco"
  relative: false
  hidden: false
images:
  - "/images/posts/delta-storage-layout-basics.webp"
---

{{< series_nav >}}

Una tabla Delta son archivos Parquet + un registro de transacciones. Este post te ayuda a ver la estructura de carpetas y entender qué escribe Delta en disco. Ref: [Delta Lake internals](https://docs.delta.io/latest/delta-batch.html#delta-transaction-log).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Delta guarda datos en Parquet.
- `_delta_log` registra versiones y cambios.
- Puedes inspeccionar archivos para entender el comportamiento.

---

## Ejecuta tú mismo
- **Spark local (Docker):** ruta principal de este blog.
- **Databricks Free Edition:** alternativa rápida si no quieres Docker.

```bash
docker compose up
```

Links:
- [Apache Spark tool](/tools/apache-spark/)
- [Databricks Free Edition](https://www.databricks.com/try-databricks)

---

## Crear una tabla Delta pequeña
Creamos una tabla básica para inspeccionar su layout en disco.
```python
from pyspark.sql import functions as F

delta_path = "/tmp/delta/storage_layout"

df = spark.range(0, 50_000).withColumn("group", (F.col("id") % 5).cast("int"))
df.write.format("delta").mode("overwrite").save(delta_path)
```

**Salida esperada:**
Se crea `_delta_log` y archivos Parquet en el path.

---

## Inspeccionar la estructura de carpetas
Listamos directorios y archivos para ver `_delta_log` y Parquet.
```python
import os

for root, dirs, files in os.walk(delta_path):
    level = root.replace(delta_path, "").count(os.sep)
    indent = "  " * level
    print(f"{indent}{os.path.basename(root)}/")
    for f in files[:5]:
        print(f"{indent}  {f}")
```

**Salida esperada (ejemplo):**
```
storage_layout/
  _delta_log/
  part-00000-...
```

---

## Qué verificar
- Existe un directorio `_delta_log/`.
- Hay archivos Parquet en la raíz.
- La tabla se lee normal con `format("delta")`.

---

## Notas de práctica
- No edites `_delta_log` manualmente.
- El log habilita time travel y ACID.
- Entender el layout ayuda a depurar storage.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
