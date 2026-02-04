---
title: "Pandas DataFrames mutate inside functions"
summary: "A DataFrame can change inside a function even if you don’t return it."
description: "See why pandas DataFrames are mutable, how in-place ops leak changes across function boundaries, and how to make intent explicit. Includes a runnable repro, expected output, and safer patterns."
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

This post covers a common pandas behavior: **DataFrames are mutable**, so a function can modify the caller’s object even if you do not return it. The behavior is documented in the [copy vs view guide](https://pandas.pydata.org/docs/user_guide/indexing.html#returning-a-view-versus-a-copy) and the [DataFrame API](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html).

Downloads at the end: [go to Downloads](#downloads).

## At a glance
- A DataFrame is mutable; in-place ops modify the original object.
- The bug looks like “nothing was returned, but things changed.”
- Fix it by copying, returning, or making mutation explicit.

## Minimal repro (runnable)
Run this as a plain script. The function **changes `raw`**, even if you ignore the return value.

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

Expected output:

```text
  price
0  10.0
2  20.0
```

## Why it happens
`DataFrame` is mutable. When you pass it into a function, you pass a reference. Any in‑place operation (`dropna(inplace=True)`, assignment to a column, `rename(inplace=True)`) changes that same object in memory. Pandas warns about this in the [copy vs view section](https://pandas.pydata.org/docs/user_guide/indexing.html#returning-a-view-versus-a-copy).

## Safer patterns (pick one)

### 1) Return a new object
Make a copy and return the new DataFrame.

```python
def clean_prices(df):
    out = df.copy()
    out["price"] = out["price"].astype(float)
    out = out.dropna()
    return out
```

### 2) Mutate on purpose
If you want in‑place behavior, make that explicit.

```python
def clean_prices_inplace(df):
    df["price"] = df["price"].astype(float)
    df.dropna(inplace=True)
    return None
```

### 3) Make intent visible in the name
Callers should know what the function does.

```python
def clean_prices_inplace(df):
    ...
```

## Practical checklist
- Avoid `inplace=True` unless you truly want to mutate the input.
- If you mutate, name it `*_inplace`.
- If you return a new object, **copy first**.

## Downloads
- Notebook (.ipynb): [Download](/notebooks/python-tips/01-pandas-mutable-dataframe.ipynb)
- Script (.py): [Download](/notebooks/python-tips/01-pandas-mutable-dataframe.py)
