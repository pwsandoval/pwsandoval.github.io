---
title: "PySpark básico para el día a día"
summary: "Select, filter y agregaciones: las tres operaciones diarias en PySpark."
description: "Guía práctica con ejemplos claros y salidas esperadas para dominar transformaciones básicas en DataFrames. Incluye patrones de chaining legibles y validaciones rápidas."
date: 2026-02-01
draft: true
tags: ["spark", "databricks", "infra", "testing", "certificacion"]
difficulty: "basico"
reading_time: "11 min"
slug: "pyspark-dataframe-basics"
series: ["Spark & Delta 101"]
series_index: 2
notebook_ipynb: "/notebooks/spark-101/02-pyspark-dataframe-basics.ipynb"
notebook_py: "/notebooks/spark-101/02-pyspark-dataframe-basics.py"
---

{{< series_nav >}}

Si eres nuevo en Spark, empieza con estas tres operaciones: select, filter y write. Este post es un tour práctico con un dataset pequeño que puedes correr en cualquier lugar. Referencia: [DataFrame select](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.select.html), [filter](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.filter.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- DataFrames es la API que usarás todos los días.
- Lo básico (select, filter, groupBy) cubre la mayoría del trabajo.
- Escribir datos es parte del flujo, no un extra.

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

## Crear un dataset pequeño
Creamos un DataFrame simple con columnas que usaremos luego.
```python
from pyspark.sql import functions as F

df = (
    spark.range(0, 100_000)
         .withColumn("country", F.when(F.col("id") % 3 == 0, "MX").when(F.col("id") % 3 == 1, "PE").otherwise("CO"))
         .withColumn("amount", (F.rand() * 100).cast("double"))
)
```

---

## Select y filter
Seleccionamos columnas y filtramos para quedarnos con lo relevante.
```python
filtered = df.select("id", "country", "amount").filter("amount > 50")
filtered.show(5)
```

**Salida esperada (ejemplo):**
```
+---+-------+------+
| id|country|amount|
+---+-------+------+
|  1|     PE| 78.21|
|  4|     MX| 65.03|
...
```

---

## Agrupar y agregar
Agrupamos por país para ver un resumen rápido.
```python
summary = filtered.groupBy("country").count()
summary.show()
```

**Salida esperada (ejemplo):**
```
+-------+-----+
|country|count|
+-------+-----+
|     PE|16667|
|     MX|16666|
|     CO|16667|
```

---

## Escribir el resultado
Guardamos el resultado para entender cómo queda en disco.
```python
out_path = "/tmp/pyspark/basics"
summary.write.mode("overwrite").parquet(out_path)
```

**Salida esperada:**
Se crea la carpeta `out_path` con archivos Parquet.

---

## Qué verificar
- `filtered.count()` es menor que el conteo original.
- La carpeta de salida existe y tiene Parquet.
- Los conteos por grupo tienen sentido.

---

## Notas de práctica
- Empieza mirando una muestra con `show()`.
- Mantén rutas simples para enseñar.
- Guarda outputs para entender el layout en disco.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
