---
title: "Apache Spark"
icon: "apache-spark.svg"
summary: "Unified engine for scalable data processing, SQL analytics, and machine learning across large datasets."
---

## Purpose
Apache Spark is the execution engine used throughout this blog for reproducible data engineering experiments.

## When to use this tool
- Run notebooks locally without heavy infrastructure.
- Reproduce optimization examples (joins, shuffle, partitioning) in a controlled environment.

## Quick paths
- **Local (Full Docker):** reproducible, free, and the default path for this blog.
- **Databricks Free Edition:** a quick alternative if you do not want to run Docker.

## Full Docker (recommended)
This is the default path for all posts in this blog.

**What you get**
- Spark + Jupyter in a consistent container environment.
- Local volume mounts for datasets, notebooks, and exports.
- A free and reproducible setup for new contributors.

**How it fits this blog**
- Run every post locally without a remote cluster.
- Capture Spark UI screenshots for before/after evidence.

**Workflow**
1. From `content/tools/apache-spark/docker/`, run `docker compose up`.
2. Open Jupyter (if you use it) or run Spark jobs from the container.
3. Run the notebook or snippets from the posts.
4. Capture Spark UI screenshots locally.

**Data paths**
- Keep datasets under `content/tools/apache-spark/docker/workspace/data/`.
- Inside the container, read them from `/home/jovyan/work/data/` (or map a simpler alias if you prefer).

**Notebook exports**
- Export to `.ipynb` for interactive use.
- Export to `.py` for code review and clean diffs.

**Ports**
- Spark Master UI: `http://localhost:8080`
- Worker UI: `http://localhost:8081` and `http://localhost:8082`
- Spark History: `http://localhost:18080`
- Jupyter: `http://localhost:8888`

## What to measure (for optimization posts)
- Total job time.
- Shuffle read/write per stage.
- Number of stages and duration of the critical join stage.

## Screenshot guidance
- Spark UI: join stage details (before vs after).
- SQL tab: physical plan showing broadcast vs shuffle join.
