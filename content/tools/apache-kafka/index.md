---
title: "Apache Kafka"
icon: "apache-kafka.svg"
summary: "Plataforma de streaming de eventos para pipelines y analítica en tiempo real."
---

Kafka es la herramienta que uso en el blog para ejemplos de ingesta, buffering y pipelines desacoplados.

## Ruta recomendada (local y gratis)
Usa Docker para que el setup sea reproducible.

**Workflow**
1. Levanta el stack con `docker compose up`.
2. Crea un tópico.
3. Produce algunos mensajes.
4. Consume y verifica.

## Qué medir (cuando pases a performance)
- Throughput (mensajes/segundo).
- Lag del consumidor.
- Latencia end‑to‑end.
