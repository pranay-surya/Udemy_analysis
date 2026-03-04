# Udemy Course Intelligence Platform

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-2.2-150458?style=for-the-badge&logo=pandas&logoColor=white)
![NumPy](https://img.shields.io/badge/NumPy-1.26-013243?style=for-the-badge&logo=numpy&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

An end-to-end data analysis project that explores online education trends using a comprehensive dataset of 3,678 Udemy courses. Raw data manipulation via Pandas is surfaced through a custom-built, interactive FastAPI dashboard with live filtering, charting, and course exploration.

---
 

## Analytical Objectives

This analysis aims to answer key questions about the e-learning market:

| Question | Focus Area |
| :--- | :--- |
| Which knowledge domains attract the highest subscriber volume? | Subject Popularity |
| Is there a correlation between course price and enrollment? | Pricing Strategy |
| How do free courses compare to paid ones in terms of reach? | Monetization |
| What is the distribution of difficulty levels across the catalog? | Target Audience |
| Does lecture count or content duration influence perceived value? | Content Volume |

---

## Dataset

File: `udemy_courses.csv` — 3,678 records across 12 columns.

| Column | Type | Description |
| :--- | :---: | :--- |
| `course_id` | int | Unique course identifier |
| `course_title` | str | Full title of the course |
| `url` | str | Direct Udemy course URL |
| `is_paid` | bool | Paid (`True`) or free (`False`) |
| `price` | int | Price in USD |
| `num_subscribers` | int | Total enrolled students — primary popularity metric |
| `num_reviews` | int | Total student reviews — engagement indicator |
| `num_lectures` | int | Number of individual lectures |
| `level` | str | Target difficulty level |
| `content_duration` | float | Total instructional hours |
| `published_timestamp` | str | ISO 8601 publication date |
| `subject` | str | Course category |

**Subject categories:** Web Development, Business Finance, Graphic Design, Musical Instruments

**Difficulty levels:** All Levels, Beginner Level, Intermediate Level, Expert Level

---

## Project Structure

```
Udemy_recom/
├── server.py              # FastAPI backend — data loading, analytics, API routes
├── index.html             # Frontend entry point (HTML structure only)
├── udemy_courses.csv      # Source dataset
├── requirements.txt       # Python dependencies
└── static/
    ├── styles.css         # Complete design system and component styles
    └── main.js            # Chart rendering, filters, pagination, modal logic
```

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Backend | Python 3.9+, FastAPI, Uvicorn | API routes, data serving, static file hosting |
| Data | Pandas 2.2, NumPy 1.26 | CSV ingestion, aggregation, EDA computation |
| Frontend | HTML5, CSS3, Vanilla JavaScript | Structure, styling, interactivity |
| Charts | Chart.js 4.4 | Bar, line, and doughnut visualizations |
| Icons | Font Awesome 6 | UI iconography |
| Fonts | Sora, JetBrains Mono | Typography via Google Fonts |

---

## Installation

**Prerequisites:** Python 3.9 or higher, pip

**1. Install dependencies**

```bash
pip install -r requirements.txt
```

**2. Confirm dataset is present**

Ensure `udemy_courses.csv` sits in the same directory as `server.py`.

---

## Running the App

```bash
uvicorn server:app --reload
```

| URL | Description |
| :--- | :--- |
| `http://127.0.0.1:8000` | Interactive dashboard |
| `http://127.0.0.1:8000/docs` | Auto-generated Swagger UI |
| `http://127.0.0.1:8000/redoc` | ReDoc API documentation |

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| GET | `/api/analytics` | Pre-computed EDA stats and all chart data |
| GET | `/api/courses` | Paginated, filtered course listing |
| GET | `/api/courses/{course_id}` | Single course full detail |
| GET | `/api/subjects` | List of all distinct subjects |
| GET | `/api/levels` | List of all distinct levels |
 
### Example Requests

```bash
# Top 10 free Web Development courses
GET /api/courses?subject=Web Development&max_price=0&per_page=10

# Beginner courses sorted by review count
GET /api/courses?level=Beginner Level&sort_by=num_reviews

# Search for Excel courses under $50
GET /api/courses?search=excel&max_price=50
```

---

## Key Insights

> Derived from exploratory data analysis surfaced in the dashboard.

| # | Insight | Finding |
| :---: | :--- | :--- |
| 1 | **Web Development Dominance** | Web Development accounts for a disproportionately large share of total subscribers relative to catalog size. |
| 2 | **Free Course Effect** | Courses priced at $0 exhibit exponentially higher enrollment, functioning as top-of-funnel audience builders. |
| 3 | **Broad Appeal Wins** | The majority of courses target "All Levels" or "Beginner," indicating introductory content holds the largest market share. |
| 4 | **Early Mover Advantage** | Courses published before 2015 accumulate significantly more subscribers on average, despite fewer total courses in that period. |
| 5 | **Price Clustering** | Most paid courses cluster between $20–$100, with Web Development commanding the highest average price across all subjects. |

---

## Dashboard Features

### Analytics View

- Six summary stat cards: total courses, subscribers, reviews, free/paid split, average price
- Subscribers by subject (bar chart)
- Price distribution: Free / $1-$50 / $51-$100 / $100+ (doughnut chart)
- Courses by difficulty level (bar chart)
- Course publications per year (line chart)
- Average subscribers by publication year (bar chart)
- Average price by subject (bar chart)
- Top 10 courses ranked by subscriber count (sortable table)

### Course Browser View

- Keyword search on course titles (debounced, real-time)
- Filter by subject, difficulty level, and price range
- Sort by popularity, reviews, price, duration, or lecture count
- Paginated card grid — 24 results per page
- Course detail modal with full stats and direct Udemy link
