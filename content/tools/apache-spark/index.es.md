---
title: "Apache Spark"
icon: "apache-spark.svg"
summary: "Motor unificado para procesamiento de datos, SQL y pipelines reproducibles."
---

Esta herramienta describe el **stack local de Spark con Docker** que uso en el blog. La idea es que puedas reproducir cada post sin depender de un cluster remoto.

Si quieres saltar directo a la descarga, ve a [Descargar stack](#descarga).

## Qué incluye este stack
- Spark Master + Workers + History Server.
- Volúmenes locales para datos, notebooks y exports.
- Configuración reproducible y gratuita.

## Paso a paso (con piezas reales del compose)

### 1) Spark Master
Ejecuta el scheduler principal y expone la UI en el puerto `8080`.  
Los workers se registran aquí.

```yaml
services:
  spark-master:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    restart: unless-stopped
    environment:
      - SPARK_MODE=master
      - SPARK_MASTER_PORT=7077
      - SPARK_MASTER_WEBUI_PORT=8080
    healthcheck:
      test: curl -f http://localhost:8080 || exit 1
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 1s
    ports:
      - "8080:8080"
```

### 2) Spark Workers (2 servicios)
Cada worker aporta CPU/Memoria al cluster.  
En este stack tienes dos workers de 2 cores y 2 GB cada uno.

```yaml
  spark-worker-1:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    depends_on:
      spark-master:
        condition: service_healthy
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_HOST=spark-master
      - SPARK_MASTER_PORT=7077
      - SPARK_WORKER_CORES=2
      - SPARK_WORKER_MEMORY=2g
    ports:
      - "8081:8081"

  spark-worker-2:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    depends_on:
      spark-master:
        condition: service_healthy
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_HOST=spark-master
      - SPARK_MASTER_PORT=7077
      - SPARK_WORKER_CORES=2
      - SPARK_WORKER_MEMORY=2g
    ports:
      - "8082:8081"
```

### 3) Spark History Server
Lee los logs de eventos y expone la UI de historial en `18080`.

```yaml
  spark-history:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    depends_on:
      spark-master:
        condition: service_healthy
    ports:
      - "18080:18080"
    environment:
      - SPARK_MODE=history
    volumes:
      - ./docker/spark/conf:/opt/spark/conf:ro
      - ./docker/spark/logs:/tmp/spark-events
```

### 4) Jupyter (opcional)
Si mantienes este servicio, tendrás notebooks en `8888` y UI de Spark driver en `4040`.

```yaml
  jupyter:
    hostname: jupyter
    build:
      context: ./docker
      dockerfile: jupyter/Dockerfile
    depends_on:
      - spark-worker-1
      - spark-worker-2
    ports:
      - "8888:8888"
      - "4040:4040"
```

## Cómo levantar el stack
Desde `content/tools/apache-spark/docker/`:

```bash
docker compose up -d
```

Apaga el stack al terminar:

```bash
docker compose down
```

## Rutas de datos
- Coloca datasets en `content/tools/apache-spark/docker/workspace/data/`
- Dentro del contenedor se leen desde `/home/jovyan/work/data/`

## Puertos útiles
- Spark Master UI: `http://localhost:8080`
- Workers: `http://localhost:8081` y `http://localhost:8082`
- Spark History: `http://localhost:18080`
- Jupyter: `http://localhost:8888` (si está habilitado)

---

## docker-compose.yml (completo)
```yaml
x-spark-volumes: &spark-volumes
  - ./docker/spark/conf:/opt/spark/conf:rw
  - ./workspace:/home/jovyan/work

services:
  spark-master:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    restart: unless-stopped
    environment:
      - SPARK_MODE=master
      - SPARK_MASTER_PORT=7077
      - SPARK_MASTER_WEBUI_PORT=8080
    healthcheck:
      test: curl -f http://localhost:8080 || exit 1
      interval: 5s
      timeout: 3s
      retries: 3
      start_period: 1s
    ports:
      - "8080:8080"
    volumes: *spark-volumes
    networks:
      - spark-network

  spark-worker-1:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    depends_on:
      spark-master:
        condition: service_healthy
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_HOST=spark-master
      - SPARK_MASTER_PORT=7077
      - SPARK_WORKER_CORES=2
      - SPARK_WORKER_MEMORY=2g
    ports:
      - "8081:8081"
    volumes: *spark-volumes
    networks:
      - spark-network
    restart: unless-stopped

  spark-worker-2:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    depends_on:
      spark-master:
        condition: service_healthy
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_HOST=spark-master
      - SPARK_MASTER_PORT=7077
      - SPARK_WORKER_CORES=2
      - SPARK_WORKER_MEMORY=2g
    ports:
      - "8082:8081"
    volumes: *spark-volumes
    networks:
      - spark-network
    restart: unless-stopped

  spark-history:
    build:
      context: ./docker
      dockerfile: spark/Dockerfile
    depends_on:
      spark-master:
        condition: service_healthy
    ports:
      - "18080:18080"
    environment:
      - SPARK_MODE=history
    volumes:
      - ./docker/spark/conf:/opt/spark/conf:ro
      - ./docker/spark/logs:/tmp/spark-events
    networks:
      - spark-network
    restart: unless-stopped

  jupyter:
    hostname: jupyter
    build:
      context: ./docker
      dockerfile: jupyter/Dockerfile
    depends_on:
      - spark-worker-1
      - spark-worker-2
    env_file:
      - ./docker/jupyter/jupyter.env
    ports:
      - "8888:8888"
      - "4040:4040"
    environment:
      - CHOWN_EXTRA=/tmp/spark-events
      - CHOWN_EXTRA_OPTS=-R
    volumes:
      - ./workspace:/home/jovyan/work
      - ./docker/jupyter/conf:/home/jovyan/.spark/conf:ro
      - ./docker/jupyter/settings:/home/jovyan/.jupyter
      - ./docker/spark/logs:/tmp/spark-events
    networks:
      - spark-network
      - proxy-network

networks:
  proxy-network:
    external: true
    name: proxy-network
  spark-network:
    name: spark-network
    driver: bridge
```

---

## Descarga {#descarga}
Si no quieres copiar archivos manualmente, descarga el stack completo:

<div class="notebook-buttons">
  <a class="notebook-btn" href="/downloads/spark-docker-stack.zip">Descargar stack completo de Spark (Docker)</a>
</div>
