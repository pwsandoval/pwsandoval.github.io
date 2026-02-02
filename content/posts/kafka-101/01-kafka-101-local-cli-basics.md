---
title: "Kafka 101: tu primer tópico local"
summary: "Crea un tópico local, produce y consume mensajes y entiende el flujo básico."
description: "Primeros pasos con Kafka CLI: crear tópicos, producir eventos y consumirlos desde consola en un entorno local reproducible. Ideal para practicar sin cloud ni dependencias externas."
date: 2026-02-01
tags: ["kafka", "infra", "streaming", "testing", "certificacion"]
difficulty: "basico"
reading_time: "9 min"
slug: "kafka-101-local-cli-basics"
series: ["Kafka 101"]
series_index: 1
notebook_ipynb: "/notebooks/kafka-101/01-kafka-101-local-cli-basics.ipynb"
notebook_py: "/notebooks/kafka-101/01-kafka-101-local-cli-basics.py"
---

{{< series_nav >}}

Este post te deja corriendo localmente y prueba que Kafka funciona con el ciclo mínimo de CLI: crear tópico, producir y consumir. Ref: [Kafka quickstart](https://kafka.apache.org/quickstart).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Kafka se aprende más rápido local con Docker.
- La CLI es suficiente para validar el setup.
- Con esto listo, integras Spark o Python.

---

## Ejecuta tú mismo
- **Docker local:** ruta principal.
- **Databricks:** no es necesario aquí.

```bash
docker compose up
```

Links:
- [Apache Kafka tool](/tools/apache-kafka/)

---

## Crear un tópico
Creamos un tópico simple para pruebas locales.
```bash
kafka-topics.sh --create --topic demo-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

**Salida esperada (ejemplo):**
```
Created topic demo-events.
```

---

## Producir mensajes
Envia unas líneas de texto como eventos.
```bash
kafka-console-producer.sh --topic demo-events --bootstrap-server localhost:9092
```

Type a few lines and press Enter.

---

## Consumir mensajes
Lee desde el inicio para validar que todo funciona.
```bash
kafka-console-consumer.sh --topic demo-events --from-beginning --bootstrap-server localhost:9092
```

**Salida esperada:**
Verás las líneas que escribiste en el producer.

---

## Qué verificar
- Los mensajes aparecen en el consumidor.
- El tópico tiene el número de particiones que definiste.
- Puedes detener y reiniciar el consumidor sin perder datos.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
