"""
Udemy Course Analysis Platform
 
"""

import math
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# ─────────────────────────────────────────────
# Data Loading
# ─────────────────────────────────────────────

BASE_DIR = Path(__file__).parent

print("Loading data...")
df = pd.read_csv(BASE_DIR / "udemy_courses.csv")
df["published_year"] = pd.to_datetime(df["published_timestamp"]).dt.year
df["is_paid"] = df["is_paid"].astype(bool)
df = df.fillna("")
print(f"Loaded {len(df)} courses.")


# ─────────────────────────────────────────────
# Pre-compute Analytics (runs once at startup)
# ─────────────────────────────────────────────

def _subject_revenue() -> list:
    return [
        {
            "subject": subj,
            "revenue": round(float((grp["price"] * grp["num_subscribers"]).sum()), 0),
        }
        for subj, grp in df.groupby("subject")
    ]


def _compute_analytics() -> dict:
    return {
        "total_courses":     int(len(df)),
        "total_subscribers": int(df["num_subscribers"].sum()),
        "total_reviews":     int(df["num_reviews"].sum()),
        "free_courses":      int((df["price"] == 0).sum()),
        "paid_courses":      int((df["price"] > 0).sum()),
        "avg_price":         round(float(df[df["price"] > 0]["price"].mean()), 2),

        "by_subject": df.groupby("subject").agg(
            count=("course_id", "count"),
            total_subscribers=("num_subscribers", "sum"),
            avg_price=("price", "mean"),
            avg_reviews=("num_reviews", "mean"),
        ).round(2).reset_index().to_dict("records"),

        "by_level": df.groupby("level").agg(
            count=("course_id", "count"),
            avg_subscribers=("num_subscribers", "mean"),
            avg_duration=("content_duration", "mean"),
            avg_price=("price", "mean"),
        ).round(2).reset_index().to_dict("records"),

        "top_courses": df.nlargest(10, "num_subscribers")[[
            "course_id", "course_title", "subject", "level",
            "price", "num_subscribers", "num_reviews", "content_duration",
        ]].to_dict("records"),

        "price_distribution": {
            "Free":     int((df["price"] == 0).sum()),
            "$1-$50":   int(((df["price"] > 0)  & (df["price"] <= 50)).sum()),
            "$51-$100": int(((df["price"] > 50) & (df["price"] <= 100)).sum()),
            "$100+":    int((df["price"] > 100).sum()),
        },

        "yearly_trends": df.groupby("published_year").agg(
            count=("course_id", "count"),
            avg_subscribers=("num_subscribers", "mean"),
        ).round(1).reset_index().to_dict("records"),

        "subject_revenue": _subject_revenue(),
    }


ANALYTICS = _compute_analytics()


# ─────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────

app = FastAPI(
    title="Udemy Course Analytics API",
    description="EDA analytics dashboard for Udemy courses",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

# Serve /static/styles.css, /static/main.js, etc.
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")


# ─────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────

@app.get("/api/analytics", tags=["Analytics"])
def get_analytics():
    """All pre-computed EDA stats, chart data and top courses."""
    return ANALYTICS


@app.get("/api/courses", tags=["Courses"])
def get_courses(
    page:      int             = Query(1,  ge=1),
    per_page:  int             = Query(24, ge=1, le=100),
    subject:   Optional[str]   = Query(None),
    level:     Optional[str]   = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    search:    Optional[str]   = Query(None),
    sort_by:   str             = Query("num_subscribers"),
):
    filtered = df.copy()

    if subject:
        filtered = filtered[filtered["subject"] == subject]
    if level:
        filtered = filtered[filtered["level"] == level]
    if min_price is not None:
        filtered = filtered[filtered["price"] >= min_price]
    if max_price is not None:
        filtered = filtered[filtered["price"] <= max_price]
    if search:
        filtered = filtered[
            filtered["course_title"].str.lower().str.contains(search.lower(), na=False)
        ]

    valid_sorts = {"num_subscribers", "num_reviews", "price", "content_duration", "num_lectures"}
    if sort_by not in valid_sorts:
        sort_by = "num_subscribers"
    filtered = filtered.sort_values(sort_by, ascending=False)

    total = len(filtered)
    start = (page - 1) * per_page
    records = filtered.iloc[start: start + per_page][[
        "course_id", "course_title", "subject", "level", "price",
        "num_subscribers", "num_reviews", "num_lectures", "content_duration",
        "is_paid", "url",
    ]].to_dict("records")

    for r in records:
        r["is_paid"] = bool(r["is_paid"])

    return {
        "total":    total,
        "page":     page,
        "per_page": per_page,
        "pages":    math.ceil(total / per_page) if total else 1,
        "courses":  records,
    }


@app.get("/api/courses/{course_id}", tags=["Courses"])
def get_course_detail(course_id: int):
    """Full detail for a single course."""
    row = df[df["course_id"] == course_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Course {course_id} not found")

    record = row.iloc[0].to_dict()
    record["is_paid"] = bool(record["is_paid"])
    for k, v in record.items():
        if isinstance(v, np.integer):
            record[k] = int(v)
        elif isinstance(v, np.floating):
            record[k] = float(v)
    return record


@app.get("/api/subjects", tags=["Meta"])
def get_subjects():
    return {"subjects": sorted(df["subject"].unique().tolist())}


@app.get("/api/levels", tags=["Meta"])
def get_levels():
    return {"levels": sorted(df["level"].unique().tolist())}


# ─────────────────────────────────────────────
# Serve Frontend
# ─────────────────────────────────────────────

@app.get("/", include_in_schema=False)
def root():
    index = BASE_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"message": "Place index.html next to server.py and reload."}



# ─────────────────────────────────────────────
# Direct run
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)