---
title: "Apache Spark"
icon: "apache-spark.svg"
summary: "Unified engine for data processing, SQL, and reproducible pipelines."
---

This tool documents the **local Spark Docker stack** used in this blog. The goal is reproducibility without a remote cluster.

If you want to jump straight to the download, go to [Download stack](#download).

## What this stack includes
- Spark Master + Workers + History Server.
- Local volumes for datasets, notebooks, and exports.
- A free, reproducible setup for new contributors.

## Step‑by‑step (with real compose pieces)

### 1) Spark Master
Runs the scheduler and exposes the UI on port `8080`.  
Workers register here.

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

### 2) Spark Workers (2 services)
Each worker provides compute resources.  
This stack runs two workers with 2 cores and 2 GB each.

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
Reads event logs and exposes the history UI on port `18080`.

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

### 4) Jupyter (optional)
If enabled, you get notebooks on `8888` and the Spark driver UI on `4040`.

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

## How to start the stack
From `content/tools/apache-spark/docker/`:

```bash
docker compose up -d
```

Stop it when you finish:

```bash
docker compose down
```

## Data paths
- Put datasets in `content/tools/apache-spark/docker/workspace/data/`
- Inside the container read them from `/home/jovyan/work/data/`

## Useful ports
- Spark Master UI: `http://localhost:8080`
- Workers: `http://localhost:8081` and `http://localhost:8082`
- Spark History: `http://localhost:18080`
- Jupyter: `http://localhost:8888` (if enabled)

---

---

## docker-compose.yml (full)
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

## Download {#download}
If you do not want to copy files manually, download the full stack:

{{< tool_download_button href="/downloads/spark-docker-stack.zip" >}}
