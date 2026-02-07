---
title: "Spark local, first run"
summary: "Start Spark locally with Docker, validate the setup, and run a first verification job."
description: "Hands‑on guide to bring up the local stack, check UI/health, and run a first job. Includes minimal checks to confirm Master/Workers are healthy and ready for the rest of the series."
date: 2026-02-01
draft: true
tags: ["spark", "infra", "testing", "databricks", "certificacion"]
difficulty: "basico"
reading_time: "8 min"
slug: "spark-local-first-run"
notebook_ipynb: "/notebooks/spark-101/00-env-check.ipynb"
notebook_py: "/notebooks/spark-101/00-env-check.py"
---

Este post es tu **primer paso** antes de correr cualquier notebook. Verificamos que Spark levanta, que el UI responde y que puedes escribir/leer Parquet. Úsalo como checklist inicial.

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Confirmas que Spark inicia sin errores.
- Verificas el Spark UI y versión.
- Escribes/lees Parquet en el volumen local.

---

## Ejecuta tú mismo
Usa el stack de Spark con Docker de este blog.

Links:
- [Apache Spark tool](/tools/apache-spark/)

---

## 1) Iniciar Spark y ver versión
Este bloque prueba que Spark está vivo.

```python
from pyspark.sql import SparkSession

spark = (
    SparkSession.builder
    .appName("pw0 - env check")
    .config("spark.ui.port", "4040")
    .getOrCreate()
)

spark.version
```

**Salida esperada (ejemplo):**
```
'3.5.1'
```

Abre el UI en `http://localhost:4040` y confirma que ves el nombre de la app.

---

## 2) Conteo simple
Un conteo básico valida que el cluster ejecuta jobs.

```python
df = spark.range(0, 1_000_000)
df.count()
```

**Salida esperada:**
```
1000000
```

---

## 3) Escribir y leer Parquet
Esto valida que el volumen local está bien montado.

```python
out_path = "/home/jovyan/work/data/env_check_parquet"
df.write.mode("overwrite").parquet(out_path)

df2 = spark.read.parquet(out_path)
df2.count()
```

**Salida esperada:**
```
1000000
```

---

## Notas de práctica
- Si el UI no carga, revisa el puerto en Docker.
- Si el path falla, revisa los volúmenes en el compose.
- Este post es la base antes de **Delta Table 101**.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
