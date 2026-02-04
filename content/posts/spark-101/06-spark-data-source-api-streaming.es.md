---
title: "Crear un Data Source API en Spark (streaming real)"
summary: "Crea un Data Source API en Spark con streaming real desde una API externa."
description: "Implementa `SimpleDataSourceStreamReader`, define schema y offsets, y expone un formato propio para leer eventos en streaming con control y observabilidad, sin depender de connectors externos."
date: 2026-02-01
tags: ["spark", "streaming", "infra", "testing", "databricks"]
difficulty: "basico"
reading_time: "12 min"
slug: "python-api-streaming-basics"
notebook_ipynb: "/notebooks/python-101/01-python-api-streaming-basics.ipynb"
notebook_py: "/notebooks/python-101/01-python-api-streaming-basics.py"
---

Este post enseña **cómo construir un Data Source de streaming en PySpark**. Primero mostramos el problema (leer una API como batch), luego creamos un reader real usando `SimpleDataSourceStreamReader`. Ref: [PySpark Data Source API](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.datasource.SimpleDataSourceStreamReader.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Una API externa no es un source de Spark por defecto.
- Con `SimpleDataSourceStreamReader` puedes convertirla en streaming.
- El resultado: `spark.readStream.format("weather").load()`.

---

## Ejecuta tú mismo
Usa el tool de Spark (Docker) de este blog. No necesitas crear venv ni instalar paquetes externos.

Links:
- [Apache Spark tool](/tools/apache-spark/)

---

## 1) El enfoque básico (batch)
Funciona, pero no es streaming real:

```python
import json, requests

url = "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m,relative_humidity_2m"
payload = requests.get(url).json()

with open("/home/jovyan/work/data/weather_stream/batch.json", "w") as f:
    f.write(json.dumps(payload))
```

---

## 2) El enfoque correcto: Data Source de streaming
Aquí implementamos un reader que Spark puede consumir en tiempo real.

### 2.1 Esquema del output
Definimos un schema mínimo que represente una lectura de clima.
```python
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, LongType

schema = StructType([
    StructField("station", StringType(), True),
    StructField("temperature_2m", DoubleType(), True),
    StructField("relative_humidity_2m", DoubleType(), True),
    StructField("ts_ingest", LongType(), True),
])
```

### 2.2 Reader streaming (skeleton funcional)
El reader traduce offsets y llamadas a la API en filas.
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
        # offset inicial por estación
        now = int(time.time())
        return {s: now for s in self.stations}

    def latestOffset(self):
        # último offset disponible
        now = int(time.time())
        return {s: now for s in self.stations}

    def read(self, start, end):
        # obtiene datos de la API y devuelve filas
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

### 2.3 Registro del Data Source (idea principal)
El objetivo es que puedas consumirlo así:

```python
df = (spark.readStream
      .format("weather")
      .option("stations", "[{'id':'NYC','lat':40.71,'lon':-74.01}]")
      .load())
```

Para que esto funcione, el reader debe estar **en el classpath** y registrado como proveedor con el nombre `"weather"`. En Spark 3.5+ la Data Source API es experimental, así que valida tu versión.

---

## 3) Ejecuta el stream
Si el reader está registrado, el stream imprimirá filas nuevas.
```python
q = (
    df.writeStream
      .format("console")
      .outputMode("append")
      .option("truncate", False)
      .start()
)
```

**Salida esperada (ejemplo):**
```
+-------+-------------+-------------------+---------+
|station|temperature_2m|relative_humidity_2m|ts_ingest|
+-------+-------------+-------------------+---------+
|NYC    | 12.3        | 56.0              | 17190000|
```

---

## Qué verificar
- El stream imprime filas nuevas.
- El schema coincide con lo que esperas.
- Puedes cambiar estaciones sin romper el reader.

---

## Notas de práctica
- Empieza con 1 estación, luego escala.
- Separa el código de API para que sea testeable.
- Si la API falla, agrega reintentos simples.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
