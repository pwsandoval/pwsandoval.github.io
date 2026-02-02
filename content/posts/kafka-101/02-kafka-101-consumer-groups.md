---
title: "Consumer groups en Kafka: cómo se reparte el trabajo"
date: 2026-02-01
tags: ["kafka", "infra", "streaming", "testing", "certificacion"]
difficulty: "basico"
reading_time: "10 min"
slug: "kafka-101-consumer-groups"
series: ["Kafka 101"]
series_index: 2
notebook_ipynb: "/notebooks/kafka-101/02-kafka-101-consumer-groups.ipynb"
notebook_py: "/notebooks/kafka-101/02-kafka-101-consumer-groups.py"
---

{{< series_nav >}}

Este post muestra cómo los consumer groups reparten trabajo y cómo se mueven los offsets. Es el modelo mental clave antes de usar Spark Streaming. Ref: [Consumer groups](https://kafka.apache.org/documentation/#intro_consumers).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Los consumer groups dividen particiones entre instancias.
- Los offsets indican por dónde va cada grupo.
- El rebalance es normal cuando entran o salen consumidores.

---

## Ejecuta tú mismo
- **Docker local:** ruta principal de este blog.

```bash
docker compose up
```

Links:
- [Apache Kafka tool](/tools/apache-kafka/)

---

## Inicia dos consumidores en el mismo grupo
Esto simula dos instancias trabajando en paralelo.
```bash
kafka-console-consumer.sh --topic demo-events --bootstrap-server localhost:9092 --group demo-group
```

Open a second terminal and run the same command. Produce a few messages and observe how they are split.

---

## Ver offsets del grupo
Aquí confirmas cómo avanzan los offsets del grupo.
```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group demo-group
```

**Salida esperada (ejemplo):**
```
TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
demo-events 0  42  42  0
```

---

## Qué verificar
- Cada consumidor recibe un subconjunto de particiones.
- Los offsets avanzan cuando se consumen mensajes.
- El rebalance ocurre cuando un consumidor se detiene.

---

## Descargas {#descargas}
Si no quieres copiar código, descarga el notebook o el .py.

{{< notebook_buttons >}}
