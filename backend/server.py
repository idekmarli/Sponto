from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Models ───

class ItemCreate(BaseModel):
    title: str
    brand: str = ""
    category: str = ""
    size: str = ""
    condition: str = ""
    source: str = ""
    purchase_price: float = 0
    shipping_to_acquire: float = 0
    prep_cost: float = 0
    target_list_price: float = 0
    sold_price: float = 0
    fees: float = 0
    packaging_cost: float = 0
    date_acquired: str = ""
    date_listed: str = ""
    date_sold: str = ""
    status: str = "sourced"
    platforms: List[str] = []
    notes: str = ""
    photos: List[str] = []
    is_draft: bool = False

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    size: Optional[str] = None
    condition: Optional[str] = None
    source: Optional[str] = None
    purchase_price: Optional[float] = None
    shipping_to_acquire: Optional[float] = None
    prep_cost: Optional[float] = None
    target_list_price: Optional[float] = None
    sold_price: Optional[float] = None
    fees: Optional[float] = None
    packaging_cost: Optional[float] = None
    date_acquired: Optional[str] = None
    date_listed: Optional[str] = None
    date_sold: Optional[str] = None
    status: Optional[str] = None
    platforms: Optional[List[str]] = None
    notes: Optional[str] = None
    photos: Optional[List[str]] = None
    is_draft: Optional[bool] = None

class SettingsModel(BaseModel):
    platform_fees: Dict[str, float] = {
        "ebay": 13.25,
        "depop": 10.0,
        "vinted": 5.0,
        "vestiaire": 15.0,
        "poshmark": 20.0,
        "etsy": 12.0,
        "custom": 10.0
    }
    target_roi: float = 50.0
    min_profit: float = 10.0
    dead_stock_thresholds: Dict[str, int] = {
        "warning": 30,
        "danger": 45,
        "critical": 60,
        "dead": 90
    }
    default_packaging_cost: float = 2.0
    default_shipping: float = 5.0
    selected_platforms: List[str] = ["ebay", "depop", "vinted"]
    business_goals: List[str] = []
    onboarding_complete: bool = False

class SourceCalcRequest(BaseModel):
    purchase_price: float
    expected_sale_price: float
    platform: str
    shipping_to_acquire: float = 0
    prep_cost: float = 0
    packaging_cost: float = 0

# ─── Helpers ───

def make_id():
    return str(uuid.uuid4())

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def serialize_item(doc):
    doc.pop("_id", None)
    return doc

def compute_item_fields(item):
    cost_basis = item.get("purchase_price", 0) + item.get("shipping_to_acquire", 0) + item.get("prep_cost", 0)
    item["total_cost_basis"] = cost_basis
    sold_price = item.get("sold_price", 0)
    fees = item.get("fees", 0)
    packaging = item.get("packaging_cost", 0)
    if sold_price > 0:
        net_profit = sold_price - cost_basis - fees - packaging
        roi = (net_profit / cost_basis * 100) if cost_basis > 0 else 0
    else:
        target = item.get("target_list_price", 0)
        net_profit = target - cost_basis - fees - packaging if target > 0 else 0
        roi = (net_profit / cost_basis * 100) if cost_basis > 0 else 0
    item["net_profit"] = round(net_profit, 2)
    item["roi"] = round(roi, 1)

    today = datetime.now(timezone.utc)
    if item.get("date_listed"):
        try:
            listed = datetime.fromisoformat(item["date_listed"].replace("Z", "+00:00"))
            if item.get("date_sold"):
                sold = datetime.fromisoformat(item["date_sold"].replace("Z", "+00:00"))
                item["days_to_sell"] = (sold - listed).days
            else:
                item["days_listed"] = (today - listed).days
        except Exception:
            pass
    if item.get("date_acquired"):
        try:
            acq = datetime.fromisoformat(item["date_acquired"].replace("Z", "+00:00"))
            item["days_in_inventory"] = (today - acq).days
        except Exception:
            pass

    # Health state
    status = item.get("status", "sourced")
    if status in ["sold", "shipped", "completed"]:
        item["health"] = "sold"
    elif status == "sourced" and not item.get("date_listed"):
        item["health"] = "needs_listing"
    elif not item.get("title") or not item.get("purchase_price"):
        item["health"] = "incomplete"
    elif item.get("days_listed", 0) > 90:
        item["health"] = "dead_stock"
    elif item.get("days_listed", 0) > 30:
        item["health"] = "stale"
    else:
        item["health"] = "fresh"
    return item

# ─── Items CRUD ───

@api_router.get("/items")
async def get_items(
    status: Optional[str] = None,
    platform: Optional[str] = None,
    category: Optional[str] = None,
    health: Optional[str] = None
):
    query = {}
    if status:
        query["status"] = status
    if platform:
        query["platforms"] = platform
    if category:
        query["category"] = category
    items = await db.items.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [compute_item_fields(i) for i in items]

@api_router.get("/items/{item_id}")
async def get_item(item_id: str):
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return compute_item_fields(item)

@api_router.post("/items")
async def create_item(item: ItemCreate):
    doc = item.dict()
    doc["id"] = make_id()
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.items.insert_one(doc)
    created = await db.items.find_one({"id": doc["id"]}, {"_id": 0})
    return compute_item_fields(created)

@api_router.put("/items/{item_id}")
async def update_item(item_id: str, item: ItemUpdate):
    updates = {k: v for k, v in item.dict().items() if v is not None}
    updates["updated_at"] = now_iso()
    result = await db.items.update_one({"id": item_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    updated = await db.items.find_one({"id": item_id}, {"_id": 0})
    return compute_item_fields(updated)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    result = await db.items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"deleted": True}

# ─── Dashboard ───

@api_router.get("/dashboard")
async def get_dashboard():
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i) for i in items]
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    sold_this_month = []
    active_listings = []
    capital_in_inventory = 0
    dead_stock = 0

    for item in items:
        status = item.get("status", "")
        if status in ["sold", "shipped", "completed"]:
            if item.get("date_sold"):
                try:
                    sold_date = datetime.fromisoformat(item["date_sold"].replace("Z", "+00:00"))
                    if sold_date >= month_start:
                        sold_this_month.append(item)
                except Exception:
                    pass
        elif status in ["listed", "crosslisted"]:
            active_listings.append(item)
            capital_in_inventory += item.get("total_cost_basis", 0)
        elif status in ["sourced", "intake", "photographed"]:
            capital_in_inventory += item.get("total_cost_basis", 0)

        if item.get("health") == "dead_stock":
            dead_stock += 1

    monthly_profit = sum(i.get("net_profit", 0) for i in sold_this_month)
    monthly_revenue = sum(i.get("sold_price", 0) for i in sold_this_month)

    # Best platform
    platform_profits = {}
    for item in sold_this_month:
        for p in item.get("platforms", []):
            platform_profits[p] = platform_profits.get(p, 0) + item.get("net_profit", 0)
    best_platform = max(platform_profits, key=platform_profits.get) if platform_profits else None

    # Best category
    cat_profits = {}
    for item in sold_this_month:
        cat = item.get("category", "other")
        cat_profits[cat] = cat_profits.get(cat, 0) + item.get("net_profit", 0)
    best_category = max(cat_profits, key=cat_profits.get) if cat_profits else None

    # Action feed
    actions = []
    for item in items:
        h = item.get("health", "")
        if h == "needs_listing":
            actions.append({"type": "needs_listing", "item_id": item["id"], "title": item.get("title", ""), "message": f'"{item.get("title", "")}" needs to be listed'})
        elif h == "stale":
            actions.append({"type": "stale", "item_id": item["id"], "title": item.get("title", ""), "message": f'"{item.get("title", "")}" has been listed {item.get("days_listed", 0)} days — consider repricing'})
        elif h == "dead_stock":
            actions.append({"type": "dead_stock", "item_id": item["id"], "title": item.get("title", ""), "message": f'"{item.get("title", "")}" is dead stock — take action'})
        elif h == "incomplete":
            actions.append({"type": "incomplete", "item_id": item["id"], "title": item.get("title", ""), "message": f'"{item.get("title", "")}" has incomplete records'})
        if item.get("status") in ["sold"] and not item.get("date_sold"):
            actions.append({"type": "cleanup", "item_id": item["id"], "title": item.get("title", ""), "message": f'"{item.get("title", "")}" sold but needs cleanup'})

    # Monthly trends (last 6 months)
    trends = []
    for i in range(5, -1, -1):
        m = now - timedelta(days=30 * i)
        m_start = m.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i > 0:
            m_end = (m_start + timedelta(days=32)).replace(day=1)
        else:
            m_end = now
        rev = 0
        prof = 0
        for item in items:
            if item.get("date_sold"):
                try:
                    sd = datetime.fromisoformat(item["date_sold"].replace("Z", "+00:00"))
                    if m_start <= sd < m_end:
                        rev += item.get("sold_price", 0)
                        prof += item.get("net_profit", 0)
                except Exception:
                    pass
        trends.append({
            "month": m_start.strftime("%b"),
            "revenue": round(rev, 2),
            "profit": round(prof, 2)
        })

    return {
        "monthly_net_profit": round(monthly_profit, 2),
        "monthly_revenue": round(monthly_revenue, 2),
        "sold_this_month": len(sold_this_month),
        "active_listings": len(active_listings),
        "capital_in_inventory": round(capital_in_inventory, 2),
        "dead_stock_count": dead_stock,
        "best_platform": best_platform,
        "best_category": best_category,
        "actions": actions[:10],
        "trends": trends,
        "total_items": len(items)
    }

# ─── Pipeline ───

@api_router.get("/pipeline")
async def get_pipeline():
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i) for i in items]
    stages = {
        "sourced": [], "intake": [], "photographed": [],
        "listed": [], "crosslisted": [], "sold": [],
        "shipped": [], "completed": []
    }
    for item in items:
        s = item.get("status", "sourced")
        if s in stages:
            stages[s].append(item)
    return stages

# ─── Dead Stock ───

@api_router.get("/deadstock")
async def get_deadstock():
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().dict()

    items = await db.items.find({"status": {"$in": ["listed", "crosslisted"]}}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i) for i in items]

    thr = settings.get("dead_stock_thresholds", {"warning": 30, "danger": 45, "critical": 60, "dead": 90})
    buckets = {"30_45": [], "45_60": [], "60_90": [], "90_plus": []}

    for item in items:
        days = item.get("days_listed", 0)
        if days >= 90:
            item["suggested_action"] = "Archive or bundle"
            item["urgency"] = "critical"
            buckets["90_plus"].append(item)
        elif days >= 60:
            item["suggested_action"] = "Lower price significantly"
            item["urgency"] = "high"
            buckets["60_90"].append(item)
        elif days >= 45:
            item["suggested_action"] = "Crosslist or lower price"
            item["urgency"] = "medium"
            buckets["45_60"].append(item)
        elif days >= 30:
            item["suggested_action"] = "Optimize listing"
            item["urgency"] = "low"
            buckets["30_45"].append(item)

    return buckets

# ─── Source Calculator ───

@api_router.post("/source/calculate")
async def source_calculate(req: SourceCalcRequest):
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().dict()

    platform_fees = settings.get("platform_fees", {})
    fee_pct = platform_fees.get(req.platform.lower(), 10.0)
    target_roi = settings.get("target_roi", 50.0)
    min_profit = settings.get("min_profit", 10.0)

    total_cost = req.purchase_price + req.shipping_to_acquire + req.prep_cost + req.packaging_cost
    estimated_fees = round(req.expected_sale_price * (fee_pct / 100), 2)
    net_profit = round(req.expected_sale_price - total_cost - estimated_fees, 2)
    roi = round((net_profit / total_cost * 100), 1) if total_cost > 0 else 0
    break_even = round(total_cost / (1 - fee_pct / 100), 2) if fee_pct < 100 else 0
    max_buy = round(req.expected_sale_price * (1 - fee_pct / 100) - req.shipping_to_acquire - req.prep_cost - req.packaging_cost, 2)
    min_sale = round(total_cost / (1 - fee_pct / 100), 2) if fee_pct < 100 else 0

    if roi >= target_roi and net_profit >= min_profit:
        verdict = "buy"
    elif net_profit > 0 and roi > 0:
        verdict = "risky"
    else:
        verdict = "skip"

    return {
        "total_cost_basis": round(total_cost, 2),
        "estimated_fees": estimated_fees,
        "fee_percentage": fee_pct,
        "net_profit": net_profit,
        "roi": roi,
        "break_even_price": break_even,
        "max_buy_price": max_buy,
        "min_acceptable_sale": min_sale,
        "verdict": verdict
    }

# ─── Insights ───

@api_router.get("/insights")
async def get_insights():
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i) for i in items]

    sold = [i for i in items if i.get("status") in ["sold", "shipped", "completed"]]
    active = [i for i in items if i.get("status") in ["listed", "crosslisted"]]

    # By platform
    platform_rev = {}
    platform_prof = {}
    for item in sold:
        for p in item.get("platforms", []):
            platform_rev[p] = platform_rev.get(p, 0) + item.get("sold_price", 0)
            platform_prof[p] = platform_prof.get(p, 0) + item.get("net_profit", 0)

    # By category
    cat_perf = {}
    for item in sold:
        cat = item.get("category", "other")
        if cat not in cat_perf:
            cat_perf[cat] = {"revenue": 0, "profit": 0, "count": 0}
        cat_perf[cat]["revenue"] += item.get("sold_price", 0)
        cat_perf[cat]["profit"] += item.get("net_profit", 0)
        cat_perf[cat]["count"] += 1

    avg_roi = round(sum(i.get("roi", 0) for i in sold) / len(sold), 1) if sold else 0
    avg_days = round(sum(i.get("days_to_sell", 0) for i in sold if i.get("days_to_sell")) / max(len([i for i in sold if i.get("days_to_sell")]), 1), 1)

    dead = len([i for i in active if i.get("days_listed", 0) > 60])
    dead_pct = round(dead / len(active) * 100, 1) if active else 0
    capital_stale = round(sum(i.get("total_cost_basis", 0) for i in active if i.get("days_listed", 0) > 30), 2)

    now = datetime.now(timezone.utc)
    monthly_trends = []
    for i in range(5, -1, -1):
        m = now - timedelta(days=30 * i)
        m_start = m.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = (m_start + timedelta(days=32)).replace(day=1) if i > 0 else now
        rev = 0
        prof = 0
        for item in items:
            if item.get("date_sold"):
                try:
                    sd = datetime.fromisoformat(item["date_sold"].replace("Z", "+00:00"))
                    if m_start <= sd < m_end:
                        rev += item.get("sold_price", 0)
                        prof += item.get("net_profit", 0)
                except Exception:
                    pass
        monthly_trends.append({"month": m_start.strftime("%b"), "revenue": round(rev, 2), "profit": round(prof, 2)})

    return {
        "platform_revenue": {k: round(v, 2) for k, v in platform_rev.items()},
        "platform_profit": {k: round(v, 2) for k, v in platform_prof.items()},
        "category_performance": {k: {kk: round(vv, 2) if isinstance(vv, float) else vv for kk, vv in v.items()} for k, v in cat_perf.items()},
        "avg_roi": avg_roi,
        "avg_days_to_sell": avg_days,
        "dead_stock_percentage": dead_pct,
        "capital_in_stale": capital_stale,
        "monthly_trends": monthly_trends,
        "total_sold": len(sold),
        "total_active": len(active)
    }

# ─── Settings ───

@api_router.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not s:
        default = SettingsModel().dict()
        default["id"] = "global"
        await db.settings.insert_one(default)
        s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    return s

@api_router.put("/settings")
async def update_settings(data: dict):
    data.pop("_id", None)
    data.pop("id", None)
    await db.settings.update_one({"id": "global"}, {"$set": data}, upsert=True)
    s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    return s

# ─── Seed Data ───

@api_router.post("/seed")
async def seed_data():
    existing = await db.items.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "count": existing}

    now = datetime.now(timezone.utc)
    brands = ["Acne Studios", "Jacquemus", "Maison Margiela", "Comme des Garçons", "A.P.C.", "Sandro", "Isabel Marant", "The Row", "Totême", "Lemaire", "Stüssy", "Carhartt WIP", "Our Legacy", "Margaret Howell", "Dries Van Noten"]
    categories = ["Bags", "Outerwear", "Knitwear", "Footwear", "Accessories", "Dresses", "Tops", "Trousers"]
    sources = ["Thrift Store", "Estate Sale", "eBay Auction", "Depop", "Garage Sale", "Consignment", "Flea Market", "Goodwill", "Online Resale"]
    conditions = ["New with Tags", "Excellent", "Very Good", "Good", "Fair"]
    platforms = ["ebay", "depop", "vinted", "vestiaire", "poshmark", "etsy"]
    statuses = ["sourced", "intake", "photographed", "listed", "crosslisted", "sold", "shipped", "completed"]

    mock_items = [
        {"title": "Acne Studios Musubi Bag", "brand": "Acne Studios", "category": "Bags", "size": "OS", "condition": "Excellent", "source": "Consignment", "purchase_price": 120, "shipping_to_acquire": 12, "prep_cost": 5, "target_list_price": 340, "sold_price": 310, "fees": 41, "packaging_cost": 3, "date_acquired": (now - timedelta(days=65)).isoformat(), "date_listed": (now - timedelta(days=55)).isoformat(), "date_sold": (now - timedelta(days=8)).isoformat(), "status": "completed", "platforms": ["vestiaire", "depop"], "notes": "Minor scuff on bottom — mentioned in listing"},
        {"title": "Jacquemus Le Chiquito", "brand": "Jacquemus", "category": "Bags", "size": "OS", "condition": "Very Good", "source": "eBay Auction", "purchase_price": 85, "shipping_to_acquire": 8, "prep_cost": 0, "target_list_price": 220, "sold_price": 195, "fees": 26, "packaging_cost": 3, "date_acquired": (now - timedelta(days=40)).isoformat(), "date_listed": (now - timedelta(days=32)).isoformat(), "date_sold": (now - timedelta(days=5)).isoformat(), "status": "shipped", "platforms": ["depop", "vinted"], "notes": ""},
        {"title": "Maison Margiela Tabi Boots", "brand": "Maison Margiela", "category": "Footwear", "size": "39", "condition": "Good", "source": "Thrift Store", "purchase_price": 45, "shipping_to_acquire": 0, "prep_cost": 15, "target_list_price": 280, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=22)).isoformat(), "date_listed": (now - timedelta(days=15)).isoformat(), "date_sold": "", "status": "listed", "platforms": ["vestiaire", "ebay"], "notes": "Resoled — great condition now"},
        {"title": "CdG Play Striped Longsleeve", "brand": "Comme des Garçons", "category": "Tops", "size": "M", "condition": "Excellent", "source": "Garage Sale", "purchase_price": 8, "shipping_to_acquire": 0, "prep_cost": 0, "target_list_price": 85, "sold_price": 78, "fees": 8, "packaging_cost": 2, "date_acquired": (now - timedelta(days=50)).isoformat(), "date_listed": (now - timedelta(days=42)).isoformat(), "date_sold": (now - timedelta(days=12)).isoformat(), "status": "completed", "platforms": ["depop"], "notes": ""},
        {"title": "A.P.C. Demi-Lune Bag", "brand": "A.P.C.", "category": "Bags", "size": "OS", "condition": "Very Good", "source": "Flea Market", "purchase_price": 35, "shipping_to_acquire": 0, "prep_cost": 3, "target_list_price": 160, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=95)).isoformat(), "date_listed": (now - timedelta(days=88)).isoformat(), "date_sold": "", "status": "listed", "platforms": ["ebay", "depop", "vinted"], "notes": "Has been listed too long — needs repricing"},
        {"title": "Sandro Tweed Jacket", "brand": "Sandro", "category": "Outerwear", "size": "S", "condition": "New with Tags", "source": "Estate Sale", "purchase_price": 40, "shipping_to_acquire": 5, "prep_cost": 0, "target_list_price": 145, "sold_price": 130, "fees": 17, "packaging_cost": 3, "date_acquired": (now - timedelta(days=30)).isoformat(), "date_listed": (now - timedelta(days=25)).isoformat(), "date_sold": (now - timedelta(days=3)).isoformat(), "status": "sold", "platforms": ["poshmark"], "notes": "Quick sale!"},
        {"title": "Isabel Marant Étoile Knit", "brand": "Isabel Marant", "category": "Knitwear", "size": "36", "condition": "Excellent", "source": "Online Resale", "purchase_price": 55, "shipping_to_acquire": 8, "prep_cost": 0, "target_list_price": 140, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=48)).isoformat(), "date_listed": (now - timedelta(days=40)).isoformat(), "date_sold": "", "status": "crosslisted", "platforms": ["vestiaire", "depop", "ebay"], "notes": "Crosslisted everywhere"},
        {"title": "The Row Half Moon Bag", "brand": "The Row", "category": "Bags", "size": "OS", "condition": "Excellent", "source": "Consignment", "purchase_price": 280, "shipping_to_acquire": 15, "prep_cost": 0, "target_list_price": 650, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=10)).isoformat(), "date_listed": (now - timedelta(days=7)).isoformat(), "date_sold": "", "status": "listed", "platforms": ["vestiaire"], "notes": "Premium piece — hold price firm"},
        {"title": "Totême Twisted Seam Denim", "brand": "Totême", "category": "Trousers", "size": "27", "condition": "Very Good", "source": "Thrift Store", "purchase_price": 12, "shipping_to_acquire": 0, "prep_cost": 0, "target_list_price": 95, "sold_price": 88, "fees": 9, "packaging_cost": 2, "date_acquired": (now - timedelta(days=35)).isoformat(), "date_listed": (now - timedelta(days=28)).isoformat(), "date_sold": (now - timedelta(days=10)).isoformat(), "status": "completed", "platforms": ["vinted"], "notes": ""},
        {"title": "Lemaire Croissant Bag", "brand": "Lemaire", "category": "Bags", "size": "OS", "condition": "Good", "source": "eBay Auction", "purchase_price": 150, "shipping_to_acquire": 10, "prep_cost": 8, "target_list_price": 380, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=70)).isoformat(), "date_listed": (now - timedelta(days=62)).isoformat(), "date_sold": "", "status": "listed", "platforms": ["vestiaire", "ebay"], "notes": "Minor patina — priced accordingly"},
        {"title": "Stüssy Varsity Jacket", "brand": "Stüssy", "category": "Outerwear", "size": "L", "condition": "Very Good", "source": "Goodwill", "purchase_price": 18, "shipping_to_acquire": 0, "prep_cost": 5, "target_list_price": 120, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=5)).isoformat(), "date_listed": "", "date_sold": "", "status": "photographed", "platforms": ["depop", "ebay"], "notes": "Ready to list"},
        {"title": "Carhartt WIP Michigan Coat", "brand": "Carhartt WIP", "category": "Outerwear", "size": "M", "condition": "Good", "source": "Flea Market", "purchase_price": 25, "shipping_to_acquire": 0, "prep_cost": 0, "target_list_price": 90, "sold_price": 82, "fees": 8, "packaging_cost": 2, "date_acquired": (now - timedelta(days=60)).isoformat(), "date_listed": (now - timedelta(days=52)).isoformat(), "date_sold": (now - timedelta(days=18)).isoformat(), "status": "completed", "platforms": ["ebay"], "notes": ""},
        {"title": "Our Legacy Mohair Cardigan", "brand": "Our Legacy", "category": "Knitwear", "size": "48", "condition": "Excellent", "source": "Online Resale", "purchase_price": 70, "shipping_to_acquire": 10, "prep_cost": 0, "target_list_price": 180, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=3)).isoformat(), "date_listed": "", "date_sold": "", "status": "sourced", "platforms": [], "notes": "Just acquired — needs photos"},
        {"title": "Margaret Howell Linen Dress", "brand": "Margaret Howell", "category": "Dresses", "size": "UK 10", "condition": "Very Good", "source": "Estate Sale", "purchase_price": 30, "shipping_to_acquire": 5, "prep_cost": 8, "target_list_price": 125, "sold_price": 0, "fees": 0, "packaging_cost": 0, "date_acquired": (now - timedelta(days=38)).isoformat(), "date_listed": (now - timedelta(days=32)).isoformat(), "date_sold": "", "status": "crosslisted", "platforms": ["ebay", "depop", "etsy"], "notes": "Beautiful piece — linen season coming"},
        {"title": "Dries Van Noten Silk Scarf", "brand": "Dries Van Noten", "category": "Accessories", "size": "OS", "condition": "New with Tags", "source": "Thrift Store", "purchase_price": 5, "shipping_to_acquire": 0, "prep_cost": 0, "target_list_price": 75, "sold_price": 68, "fees": 7, "packaging_cost": 2, "date_acquired": (now - timedelta(days=20)).isoformat(), "date_listed": (now - timedelta(days=16)).isoformat(), "date_sold": (now - timedelta(days=2)).isoformat(), "status": "sold", "platforms": ["etsy", "depop"], "notes": "Beautiful print — sold fast"},
    ]

    for item in mock_items:
        item["id"] = make_id()
        item["created_at"] = now_iso()
        item["updated_at"] = now_iso()
        item["photos"] = []
        item["is_draft"] = False

    await db.items.insert_many(mock_items)

    # Seed settings
    default_settings = SettingsModel().dict()
    default_settings["id"] = "global"
    default_settings["onboarding_complete"] = True
    default_settings["selected_platforms"] = ["ebay", "depop", "vinted", "vestiaire", "poshmark", "etsy"]
    default_settings["business_goals"] = ["profit_clarity", "better_buying"]
    await db.settings.update_one({"id": "global"}, {"$set": default_settings}, upsert=True)

    return {"message": "Seeded successfully", "count": len(mock_items)}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
