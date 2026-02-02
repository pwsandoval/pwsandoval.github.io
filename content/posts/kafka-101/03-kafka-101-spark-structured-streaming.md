---
title: "Kafka + Spark: tu primer streaming real"
date: 2026-02-01
tags: ["kafka", "spark", "streaming", "infra", "testing"]
difficulty: "basico"
reading_time: "11 min"
slug: "kafka-101-spark-structured-streaming"
series: ["Kafka 101"]
series_index: 3
notebook_ipynb: "/notebooks/kafka-101/03-kafka-101-spark-structured-streaming.ipynb"
notebook_py: "/notebooks/kafka-101/03-kafka-101-spark-structured-streaming.py"
---

{{< series_nav >}}

Este post conecta Spark Structured Streaming a un tópico local de Kafka y lee mensajes en tiempo real. Ref: [Structured Streaming + Kafka](https://spark.apache.org/docs/latest/structured-streaming-kafka-integration.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Spark puede leer Kafka directo con el connector.
- Puedes validar streaming end‑to‑end localmente.
- Es el puente entre ingesta y procesamiento.

---

## Ejecuta tú mismo
- **Docker local:** ruta principal de este blog.

```bash
docker compose up
```

Links:
- [Apache Kafka tool](/tools/apache-kafka/)
- [Apache Spark tool](/tools/apache-spark/)

---

## Producir mensajes
Genera eventos en el tópico para alimentar el stream.
```bash
kafka-console-producer.sh --topic demo-events --bootstrap-server localhost:9092
```

---

## Leer con Spark Structured Streaming
Spark leerá el tópico y enviará los mensajes a consola.
```python
df = (
    spark.readStream.format("kafka")
         .option("kafka.bootstrap.servers", "localhost:9092")
         .option("subscribe", "demo-events")
         .load()
)

out = df.selectExpr("CAST(key AS STRING)", "CAST(value AS STRING)")

q = (
    out.writeStream.format("console")
       .outputMode("append")
       .option("truncate", False)
       .start()
)
```

**Salida esperada:**
Verás filas nuevas en consola cuando envíes mensajes.

---

## Qué verificar
- Los mensajes aparecen en la salida de consola de Spark.
- La consulta streaming sigue activa mientras produces.
- Detener el producer no rompe la consulta.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
