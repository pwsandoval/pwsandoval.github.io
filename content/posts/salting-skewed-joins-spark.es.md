---
title: "Arregla joins con skew en Spark usando salting"
summary: "Caso reproducible de skew y solución con salting, con métricas antes/después y un ejemplo real."
description: "Detecta joins con skew en Spark y aplica salting para repartir las llaves “hot”. Verás el antes/después con tiempos de stage y shuffle, una repro sintética y un dataset real con descargas al final."
date: 2026-02-01
tags: ["spark", "databricks", "optimizacion", "testing", "infra"]
difficulty: "intermedio"
reading_time: "12 min"
slug: "salting-skewed-joins-spark"
---

Este post muestra primero un caso simple y reproducible de skew, y luego aplica la misma idea a un dataset más real. El objetivo es que la diferencia de performance sea evidente y fácil de medir. Ref: [Spark SQL performance](https://spark.apache.org/docs/latest/sql-performance-tuning.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- El sesgo (skew) genera tasks lentas y stages largos.
- El salting reparte llaves “hot” entre particiones.
- Medirás **antes/después** con tiempos de stage y shuffle.
- Incluye repro sintética y ejemplo con dataset real.

---

## Por qué el skew duele (y cómo ayuda el salting)
Cuando una llave domina, Spark envía casi todo el trabajo a pocas tasks. Esos “stragglers” controlan el tiempo total del stage. El salting agrega un bucket aleatorio a la llave hot para repartir las filas pesadas entre más particiones y balancear tiempos.

---

## Repro rápida (sintética)
La versión mínima para ver el efecto con claridad.

### Baseline (join con skew)
Primero ejecutamos el join sin mitigación para observar el cuello de botella.
```python
from pyspark.sql import functions as F

# Skewed events: 90% of rows share the same key
events = (
    spark.range(0, 10_000_000)
         .withColumn("key", F.when(F.col("id") < 9_000_000, F.lit(1)).otherwise(F.col("id")))
)

# Lookup table
lookup = spark.range(0, 10_001).withColumnRenamed("id", "key")

baseline = events.join(lookup, on="key", how="left")
baseline.count()
```

**Salida esperada:**
Un número grande (por ejemplo `10000000`).

### Después de salting (mismo join, tasks balanceadas)
Aplicamos salting para repartir la llave hot entre particiones.
```python
from pyspark.sql import functions as F

salt_buckets = 16

events_salted = events.withColumn(
    "salt",
    F.when(F.col("key") == 1, (F.rand() * salt_buckets).cast("int")).otherwise(F.lit(0))
)

lookup_salted = (
    lookup.withColumn("salt", F.explode(F.array([F.lit(i) for i in range(salt_buckets)])))
)

optimized = events_salted.join(lookup_salted, on=["key", "salt"], how="left")
optimized.count()
```

**Salida esperada:**
El mismo conteo que el baseline.

---

## Ejemplo real (NYC Taxi + zones)
Usa un dataset real para un caso práctico, manteniendo el mismo patrón de skew.

### Cargar datos (Docker local primero)
Coloca los archivos de NYC Taxi en `content/tools/apache-spark/docker/workspace/data/nyc_taxi/` para que se vean en el contenedor como `/home/jovyan/work/data/nyc_taxi/`.

```python
trips = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("/home/jovyan/work/data/nyc_taxi/yellow")
)

zones = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("/home/jovyan/work/data/nyc_taxi/taxi_zone_lookup.csv")
)
```

### Cargar datos (Databricks sample data)
Si estás en Databricks, usa los datasets de ejemplo.
```python
trips = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("dbfs:/databricks-datasets/nyctaxi/tripdata/yellow")
)

zones = (
    spark.read.format("csv")
         .option("header", True)
         .option("inferSchema", True)
         .load("dbfs:/databricks-datasets/nyctaxi/taxi_zone_lookup.csv")
)
```

### Crear una llave con skew (simular un “hot” zone)
Forzamos skew para que el efecto sea visible.
```python
from pyspark.sql import functions as F

trips_skewed = trips.withColumn(
    "PULocationID",
    F.when(F.col("PULocationID").isNull(), F.lit(1)).otherwise(F.col("PULocationID"))
)

baseline_real = trips_skewed.join(zones, trips_skewed.PULocationID == zones.LocationID, "left")
baseline_real.count()
```

**Salida esperada:**
Un conteo mayor a cero (depende del dataset).

### Aplicar salting
Agregamos un salt para distribuir las filas calientes.
```python
salt_buckets = 16

trips_salted = trips_skewed.withColumn(
    "salt",
    F.when(F.col("PULocationID") == 1, (F.rand() * salt_buckets).cast("int")).otherwise(F.lit(0))
)

zones_salted = (
    zones.withColumn("salt", F.explode(F.array([F.lit(i) for i in range(salt_buckets)])))
)

optimized_real = trips_salted.join(
    zones_salted,
    (trips_salted.PULocationID == zones_salted.LocationID) & (trips_salted.salt == zones_salted.salt),
    "left"
)
optimized_real.count()
```

**Salida esperada:**
El mismo conteo que el baseline real.

---

## Antes/después: qué capturar
Agrega tus métricas reales después de ejecutar el código.

**Agrega estos números**
- Tiempo total del job (baseline vs salted).
- Duración del stage del join.
- Shuffle read/write del stage.
- Max task time vs mediana.

**Agrega estas capturas**
- Spark UI: stage baseline con tasks desbalanceadas.
- Spark UI: stage con salting y tasks balanceadas.
- SQL tab: plan físico mostrando el join con salting.

---

## Notas de práctica
- Empieza con `salt_buckets` pequeño (8 o 16) y mide.
- Aplica salting solo a llaves hot.
- Si el patrón cambia, revisa la lógica.

---

## Ejecuta tú mismo
- **Spark local (Docker):** ruta principal del blog.
- **Databricks Free Edition:** alternativa rápida.

### Docker quick start
```bash
docker compose up
```

Links:
- [Apache Spark tool](/tools/apache-spark/)
- [Databricks Free Edition](https://www.databricks.com/try-databricks)

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
