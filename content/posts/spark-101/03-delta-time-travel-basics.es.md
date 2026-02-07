---
title: "Consultar versiones pasadas en Delta"
summary: "Consulta versiones anteriores con Time Travel y recupera datos con confianza."
description: "Aprende `versionAsOf` y `timestampAsOf`, valida cambios y entiende cuándo usar time travel para auditoría, recovery y análisis de regresiones en Delta Lake."
date: 2026-02-01
draft: true
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

El “time travel” es una de las funciones más útiles de Delta. Permite consultar versiones anteriores sin backups. Este post muestra un antes/después simple para confiar en la técnica. Ref: [Delta Time Travel](https://docs.delta.io/latest/delta-batch.html#time-travel).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Delta guarda versiones en el transaction log.
- Puedes consultar versiones antiguas con `versionAsOf` o `timestampAsOf`.
- Úsalo para auditoría, debugging y validación de rollback.

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
Si ya corriste **Delta Table 101**, puedes reutilizar la misma ruta. Si no, usa este snippet.

```python
from pyspark.sql import functions as F

delta_path = "/tmp/delta/time_travel"

df_v1 = spark.range(0, 10_000).withColumn("status", F.lit("v1"))
df_v1.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Actualizar la tabla (nueva versión)
Creamos una nueva versión con overwrite para habilitar time travel.
```python
df_v2 = spark.range(0, 10_000).withColumn("status", F.lit("v2"))
df_v2.write.format("delta").mode("overwrite").save(delta_path)
```

---

## Leer una versión anterior
Leemos la versión 0 para comparar con la última.
```python
v1 = (
    spark.read.format("delta")
         .option("versionAsOf", 0)
         .load(delta_path)
)

v1.groupBy("status").count().show()
```

**Salida esperada (ejemplo):**
```
+------+-----+
|status|count|
+------+-----+
|    v1|10000|
```

---

## Qué verificar
- La versión 0 muestra `status = v1`.
- La última versión muestra `status = v2`.
- Puedes comparar conteos entre versiones.

---

## Notas de práctica
- Usa time travel para auditorías, no como backup permanente.
- Si haces vacuum agresivo, versiones antiguas desaparecen.
- Documenta la versión usada cuando compartas resultados.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
