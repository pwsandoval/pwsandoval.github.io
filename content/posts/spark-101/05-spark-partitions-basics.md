---
title: "Particiones en Spark: la palanca del rendimiento"
date: 2026-02-01
tags: ["spark", "optimizacion", "infra", "testing", "certificacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "spark-partitions-basics"
series: ["Spark & Delta 101"]
series_index: 5
notebook_ipynb: "/notebooks/spark-101/05-spark-partitions-basics.ipynb"
notebook_py: "/notebooks/spark-101/05-spark-partitions-basics.py"
---

{{< series_nav >}}

Las particiones son la unidad de paralelismo en Spark. Este post muestra cómo el número de particiones cambia la distribución de tareas y el rendimiento. Ref: [repartition](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.repartition.html), [coalesce](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.coalesce.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Pocas particiones desaprovechan el cluster.
- Demasiadas particiones agregan overhead.
- Puedes inspeccionar y ajustar de forma segura.

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

## Crear un dataset
Usamos un rango grande para ver cómo Spark lo particiona.
```python
df = spark.range(0, 5_000_000)
```

---

## Ver particiones actuales
Inspeccionamos cuántas particiones tiene el DataFrame.
```python
df.rdd.getNumPartitions()
```

**Salida esperada (ejemplo):**
```
8
```

---

## Repartition vs coalesce
Probamos ambos para entender su impacto en tasks y shuffle.
```python
df_repart = df.repartition(64)
df_coal = df.coalesce(8)
```

**Salida esperada:**
`df_repart` tendrá 64 particiones; `df_coal` tendrá 8 o menos.

---

## Qué verificar
- El número de particiones cambia como esperas.
- Más particiones aumentan tareas; menos las reducen.
- La duración de tareas se balancea con un número razonable.

---

## Notas de práctica
- Empieza con defaults y ajusta con evidencia.
- Repartition genera shuffle completo; coalesce lo evita.
- Usa Spark UI para ver cómo se mapean tareas.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
