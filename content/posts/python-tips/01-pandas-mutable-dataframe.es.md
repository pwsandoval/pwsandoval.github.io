---
title: "Un DataFrame de pandas se modifica dentro de una función"
summary: "Un DataFrame puede cambiar dentro de una función aunque no lo retornes."
description: "Aprende por qué los DataFrames de pandas son mutables, cómo las operaciones in‑place filtran cambios y cómo dejar la intención explícita. Incluye repro ejecutable, salida esperada y patrones seguros."
date: 2026-02-04
tags: ["testing", "optimizacion", "certificacion", "infra", "spark"]
difficulty: "basico"
reading_time: "9 min"
slug: "pandas-mutable-dataframe"
series: ["Python Tips"]
series_index: 1
notebook_ipynb: "/notebooks/python-tips/01-pandas-mutable-dataframe.ipynb"
notebook_py: "/notebooks/python-tips/01-pandas-mutable-dataframe.py"
---

{{< series_nav >}}

Este post cubre un comportamiento común de pandas: **los DataFrames son mutables**, así que una función puede modificar el objeto del caller aunque no lo retorne. Está documentado en la guía de [copy vs view](https://pandas.pydata.org/docs/user_guide/indexing.html#returning-a-view-versus-a-copy) y en la [API de DataFrame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html).

Descargas al final: [ir a Descargas](#descargas).

## En pocas palabras
- Un DataFrame es mutable; las operaciones in‑place modifican el original.
- El bug parece “no retornó nada, pero cambió”.
- Solución: copiar, retornar o hacer explícita la mutación.

## Repro mínima (ejecutable)
Ejecuta esto como script. La función **modifica `raw`**, aunque ignores el retorno.

```python
import pandas as pd

def clean_prices(df):
    df["price"] = df["price"].astype(float)
    df.dropna(inplace=True)
    return df

raw = pd.DataFrame({"price": ["10", None, "20"]})
_ = clean_prices(raw)

print(raw)
```

Salida esperada:

```text
  price
0  10.0
2  20.0
```

## Por qué pasa
`DataFrame` es mutable. Al pasarlo a una función pasas una referencia. Cualquier operación in‑place (`dropna(inplace=True)`, asignación a una columna, `rename(inplace=True)`) afecta el mismo objeto en memoria. La documentación de pandas lo advierte en [copy vs view](https://pandas.pydata.org/docs/user_guide/indexing.html#returning-a-view-versus-a-copy).

## Patrones más seguros (elige uno)

### 1) Retornar un objeto nuevo
Haz una copia y retorna el nuevo DataFrame.

```python
def clean_prices(df):
    out = df.copy()
    out["price"] = out["price"].astype(float)
    out = out.dropna()
    return out
```

### 2) Mutar a propósito
Si quieres in‑place, hazlo explícito.

```python
def clean_prices_inplace(df):
    df["price"] = df["price"].astype(float)
    df.dropna(inplace=True)
    return None
```

### 3) Haz visible la intención
El nombre debe avisar al caller.

```python
def clean_prices_inplace(df):
    ...
```

## Checklist práctico
- Evita `inplace=True` salvo que realmente quieras mutar.
- Si mutas, nombra `*_inplace`.
- Si retornas, **copia primero**.

## Descargas
- Notebook (.ipynb): [Descargar](/notebooks/python-tips/01-pandas-mutable-dataframe.ipynb)
- Script (.py): [Descargar](/notebooks/python-tips/01-pandas-mutable-dataframe.py)
