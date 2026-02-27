---
title: "Tu primera tabla Delta, paso a paso"
summary: "Crea tu primera tabla Delta, escribe y lee con operaciones básicas y verificables."
description: "Recorrido end‑to‑end: crear tabla Delta, insertar datos, leer, filtrar y validar resultados con salidas esperadas. Base mínima para entender Delta antes de optimizar."
date: 2026-02-01
# draft: true
tags: ["spark", "delta", "databricks", "infra", "testing"]
difficulty: "basico"
reading_time: "9 min"
slug: "delta-table-101-create-read"
paths: ["Spark & Delta 101"]
paths_index: 1
notebook_ipynb: "/notebooks/spark-101/01-delta-table-101.ipynb"
notebook_py: "/notebooks/spark-101/01-delta-table-101.py"
---

{{< paths_nav >}}

Si eres nuevo en Delta Lake, este es el primer post que debes ejecutar. Se enfoca en lo mínimo que haces en trabajo real: crear una tabla Delta, leerla y sobrescribirla de forma segura. Referencia oficial: [Delta Lake](https://docs.delta.io/latest/delta-intro.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Una tabla Delta es archivos + registro de transacciones.
- Lees/escribes Delta como una tabla normal, pero con confiabilidad.
- Este flujo te deja listo para empezar.

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

## Setup mínimo
Generaremos un dataset pequeño, lo escribimos como Delta y luego lo leemos. Usamos `spark.range` para no depender de datos externos. Ref: [Spark range](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.SparkSession.range.html).

```python
from pyspark.sql import functions as F

df = (
    spark.range(0, 100_000)
         .withColumn("group", (F.col("id") % 10).cast("int"))
)
```

---

## Crear la tabla Delta
Aquí persistimos el DataFrame como Delta en una ruta local. Ref: [DataFrameWriter](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrameWriter.html).
```python
delta_path = "/tmp/delta/table_101"

df.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Leerla de nuevo
Leemos el mismo path para validar que quedó bien. Ref: [DataFrameReader](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrameReader.html).
```python
read_back = spark.read.format("delta").load(delta_path)
read_back.groupBy("group").count().show()
```

**Salida esperada (ejemplo):**
```
+-----+-----+
|group|count|
+-----+-----+
|    0|10000|
|    1|10000|
|    2|10000|
...
```

---

## Sobrescribir de forma segura (mismo schema)
Reescribimos con el mismo esquema para simular una actualización.
```python
df_filtered = df.filter("group < 5")
df_filtered.write.format("delta").mode("overwrite").save(delta_path)
```

**Salida esperada:**
No verás salida directa, pero el conteo debe bajar cuando vuelvas a leer.

---

## Qué verificar
- La tabla se lee sin errores.
- Los conteos cambian después del overwrite.
- La carpeta contiene `_delta_log`.

---

## Notas de práctica
- Usa `format("delta")` explícito para evitar ambigüedad.
- Empieza con una ruta local para inspeccionar archivos.
- Mantén rutas simples para principiantes.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
