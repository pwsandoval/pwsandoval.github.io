---
title: "Crear un Data Source de streaming en Spark"
summary: "Crea un source de streaming en Spark respaldado por una API externa."
description: "Implementa un reader mínimo con offsets reales, un schema claro y un formato utilizable. Comparas el enfoque batch vs streaming y lo ejecutas end-to-end."
date: 2026-02-01
tags: ["spark", "streaming", "optimizacion", "testing", "databricks"]
difficulty: "basico"
reading_time: "12 min"
slug: "spark-data-source-api-streaming"
notebook_ipynb: "/notebooks/spark/01-spark-data-source-api-streaming.ipynb"
notebook_py: "/notebooks/spark/01-spark-data-source-api-streaming.py"
---

Este post muestra **cómo construir un Data Source de streaming en PySpark**. Partimos del enfoque batch y luego implementamos un reader con `SimpleDataSourceStreamReader` usando la [Data Source API oficial](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.SimpleDataSourceStreamReader.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Una API externa no es un source de Spark por defecto.
- La Data Source API permite definir offsets y leer filas en streaming.
- Resultado: `spark.readStream.format("weather").load()`.

## Ejecuta tú mismo
Usa el [tool de Apache Spark](/tools/apache-spark/) de este blog. No necesitas crear venv.

## 1) El enfoque batch (ingenuo)
Funciona, pero no es streaming. Solo escribes un archivo y lo vuelves a leer:

```python
import json, requests

url = "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m,relative_humidity_2m"
payload = requests.get(url).json()

with open("/home/jovyan/work/data/weather_stream/batch.json", "w") as f:
    f.write(json.dumps(payload))
```

## 2) El enfoque correcto: Data Source de streaming
Un reader de streaming debe definir schema y offsets. Eso es lo que espera la Data Source API.

### 2.1 Schema de salida
Define el schema explícitamente (ver la [documentación de schemas](https://spark.apache.org/docs/latest/sql-ref-datatype-schema.html)) para que Spark pueda planificar el stream:

```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

schema = StructType([
    StructField("station", StringType(), True),
    StructField("temperature_2m", DoubleType(), True),
    StructField("relative_humidity_2m", DoubleType(), True),
    StructField("ts_ingest", LongType(), True),
])
```

### 2.2 Reader de streaming (esqueleto funcional)
Los offsets son la clave: `initialOffset` y `latestOffset` definen el rango, y `read` devuelve filas entre ellos.

```python
import ast
import requests
import json
import time
from pyspark.sql.datasource import SimpleDataSourceStreamReader

class WeatherSimpleStreamReader(SimpleDataSourceStreamReader):
    def __init__(self, options):
        self.options = options
        self.stations = ast.literal_eval(options.get("stations", "[]"))

    def initialOffset(self):
        now = int(time.time())
        return {s: now for s in self.stations}

    def latestOffset(self):
        now = int(time.time())
        return {s: now for s in self.stations}

    def read(self, start, end):
        rows = []
        for station in self.stations:
            url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={station['lat']}&longitude={station['lon']}"
                "&current=temperature_2m,relative_humidity_2m"
            )
            payload = requests.get(url).json()
            rows.append({
                "station": station["id"],
                "temperature_2m": payload["current"]["temperature_2m"],
                "relative_humidity_2m": payload["current"]["relative_humidity_2m"],
                "ts_ingest": int(time.time()),
            })
        return rows
```

### 2.3 Registrar el Data Source (idea principal)
El uso deseado es:

```python
df = (spark.readStream
      .format("weather")
      .option("stations", "[{'id':'NYC','lat':40.71,'lon':-74.01}]")
      .load())
```

Para que esto funcione, el reader debe estar en el classpath y registrado como provider `weather`. La Data Source API en Spark 3.5+ sigue marcada como experimental, valida tu versión en la [documentación oficial](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.DataSource.html).

## 3) Ejecuta el stream
Una ejecución mínima para validar el pipeline:

```python
(df.writeStream
   .format("console")
   .outputMode("append")
   .start())
```

Salida esperada (ejemplo):

```text
+-------+---------------+---------------------+----------+
|station|temperature_2m |relative_humidity_2m |ts_ingest |
+-------+---------------+---------------------+----------+
|NYC    | 4.2           | 71.0                |1707070000|
+-------+---------------+---------------------+----------+
```

## Descargas
- Notebook (.ipynb): [Descargar](/notebooks/spark-101/06-spark-data-source-api-streaming.ipynb)
- Script (.py): [Descargar](/notebooks/spark-101/06-spark-data-source-api-streaming.py)
