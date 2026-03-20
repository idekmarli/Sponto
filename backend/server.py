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
import math
import re
import base64
from io import BytesIO

# Image analysis imports
try:
    from PIL import Image
    IMAGE_PROCESSING_AVAILABLE = True
except ImportError:
    IMAGE_PROCESSING_AVAILABLE = False

import json
import httpx

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
    shipping_cost: float = 0  # Cost to ship to buyer
    date_acquired: str = ""
    date_listed: str = ""
    date_sold: str = ""
    status: str = "sourced"
    platforms: List[str] = []
    notes: str = ""
    photos: List[str] = []
    is_draft: bool = False
    tags: List[str] = []  # Manual workflow tags
    color: str = ""

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
    shipping_cost: Optional[float] = None  # Cost to ship to buyer
    date_acquired: Optional[str] = None
    date_listed: Optional[str] = None
    date_sold: Optional[str] = None
    status: Optional[str] = None
    platforms: Optional[List[str]] = None
    notes: Optional[str] = None
    photos: Optional[List[str]] = None
    is_draft: Optional[bool] = None
    tags: Optional[List[str]] = None  # Manual workflow tags
    color: Optional[str] = None

class SettingsModel(BaseModel):
    platform_fees: Dict[str, float] = {
        "ebay": 13.25, "depop": 10.0, "vinted": 5.0,
        "vestiaire": 15.0, "poshmark": 20.0, "etsy": 12.0, "custom": 10.0
    }
    target_roi: float = 50.0
    min_profit: float = 10.0
    min_margin: float = 30.0  # Margin threshold for margin_risk tag
    stale_days: int = 30  # Days until item is flagged stale
    dead_stock_thresholds: Dict[str, int] = {"stale": 45, "dead": 90}
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
    category: str = ""

class ScreenshotAnalysisRequest(BaseModel):
    images: List[str]  # Base64 encoded images

class ExtractedField(BaseModel):
    value: str
    confidence: str  # "high", "medium", "low"
    
class ScreenshotAnalysisResponse(BaseModel):
    success: bool
    extracted_data: Dict[str, Any]
    raw_text: str
    detected_platform: Optional[str]
    product_image: Optional[str]  # Base64 cropped product image
    original_screenshot: str  # Keep original for reference

# ─── Helpers ───

def make_id():
    return str(uuid.uuid4())

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def parse_date(s):
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        # Ensure timezone-aware
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

def compute_item_fields(item, settings=None):
    """Compute derived fields including health state and derived tags."""
    cost_basis = item.get("purchase_price", 0) + item.get("shipping_to_acquire", 0) + item.get("prep_cost", 0)
    item["total_cost_basis"] = round(cost_basis, 2)
    sold_price = item.get("sold_price", 0)
    fees = item.get("fees", 0)
    packaging = item.get("packaging_cost", 0)
    shipping_cost = item.get("shipping_cost", 0)  # Cost to ship to buyer

    if sold_price > 0:
        net_profit = sold_price - cost_basis - fees - packaging - shipping_cost
        roi = (net_profit / cost_basis * 100) if cost_basis > 0 else 0
        margin = (net_profit / sold_price * 100) if sold_price > 0 else 0
    else:
        target = item.get("target_list_price", 0)
        net_profit = target - cost_basis - fees - packaging - shipping_cost if target > 0 else 0
        roi = (net_profit / cost_basis * 100) if cost_basis > 0 else 0
        margin = (net_profit / target * 100) if target > 0 else 0

    item["net_profit"] = round(net_profit, 2)
    item["roi"] = round(roi, 1)
    item["margin"] = round(margin, 1)

    today = datetime.now(timezone.utc)
    item["days_listed"] = 0
    item["days_to_sell"] = 0
    item["days_in_inventory"] = 0

    listed_date = parse_date(item.get("date_listed"))
    sold_date = parse_date(item.get("date_sold"))
    acq_date = parse_date(item.get("date_acquired"))

    if listed_date:
        if sold_date:
            item["days_to_sell"] = max((sold_date - listed_date).days, 0)
        else:
            item["days_listed"] = max((today - listed_date).days, 0)

    if acq_date:
        item["days_in_inventory"] = max((today - acq_date).days, 0)

    # ── Enhanced Health States ──
    status = item.get("status", "sourced")
    days_listed = item.get("days_listed", 0)
    platforms = item.get("platforms", [])
    photos = item.get("photos", [])
    has_photos = len(photos) > 0

    if status in ["sold", "shipped", "completed"]:
        if status == "sold" and not sold_date:
            item["health"] = "sold_pending"
        elif status == "shipped":
            item["health"] = "shipped_pending"
        else:
            item["health"] = "sold"
    elif not item.get("title") or item.get("purchase_price", 0) <= 0:
        item["health"] = "incomplete"
    elif status in ["sourced", "intake"]:
        item["health"] = "needs_listing"
    elif status == "photographed":
        item["health"] = "ready_to_list"
    elif days_listed >= 90:
        item["health"] = "dead_stock"
    elif days_listed >= 45:
        item["health"] = "stale"
    elif days_listed >= 30:
        item["health"] = "approaching_stale"
    elif status in ["listed"] and len(platforms) <= 1 and days_listed >= 10:
        item["health"] = "crosslist_candidate"
    else:
        item["health"] = "fresh"

    # ── Derived Tags ──
    # Get settings for configurable thresholds
    min_margin = settings.get("min_margin", 30.0) if settings else 30.0
    
    derived_tags = []
    manual_tags = item.get("tags", [])
    
    # Check for incomplete - missing required fields
    title = item.get("title", "").strip()
    category = item.get("category", "").strip()
    purchase_price = item.get("purchase_price", 0)
    date_acquired = item.get("date_acquired", "").strip()
    
    if not title or not category or purchase_price <= 0 or not date_acquired or not has_photos:
        derived_tags.append("incomplete")
    
    # Check for stale (45+ days listed)
    if days_listed >= 45 and status in ["listed", "crosslisted"]:
        derived_tags.append("stale")
    
    # Check for dead_stock (60+ days listed - matching deadstock screen)
    if days_listed >= 60 and status in ["listed", "crosslisted"]:
        derived_tags.append("dead_stock")
    
    # Check for margin_risk
    if margin < min_margin and status not in ["sold", "shipped", "completed"]:
        derived_tags.append("margin_risk")
    
    # Check for sold_pending_cleanup
    if status == "sold" and item["health"] == "sold_pending":
        derived_tags.append("sold_pending_cleanup")
    
    # Check for needs_cleanup - sold/completed but may need platform cleanup
    if status in ["sold", "shipped", "completed"] and len(platforms) > 1:
        derived_tags.append("needs_cleanup")
    
    item["derived_tags"] = derived_tags
    item["all_tags"] = list(set(manual_tags + derived_tags))

    return item


# ─── Smart Action Engine ───

def generate_smart_actions(items, settings):
    """Generate priority-ranked, specific, actionable items."""
    actions = []
    now = datetime.now(timezone.utc)
    avg_days_to_sell = 0
    sold_items = [i for i in items if i.get("status") in ["sold", "shipped", "completed"] and i.get("days_to_sell", 0) > 0]
    if sold_items:
        avg_days_to_sell = sum(i["days_to_sell"] for i in sold_items) / len(sold_items)

    for item in items:
        health = item.get("health", "")
        days = item.get("days_listed", 0)
        title = item.get("title", "Untitled")
        item_id = item.get("id", "")
        cost = item.get("total_cost_basis", 0)
        price = item.get("target_list_price", 0)
        platforms = item.get("platforms", [])
        status = item.get("status", "")

        # P1: DEAD STOCK — losing money daily
        if health == "dead_stock":
            daily_cost = round(cost / 365, 2) if cost > 0 else 0
            drop_price = round(price * 0.75, 0) if price > 0 else 0
            actions.append({
                "priority": 1, "type": "dead_stock", "item_id": item_id, "title": title,
                "message": f"{title} — {days}d listed, ${cost} locked. Consider dropping to ${drop_price}.",
                "suggested_action": "price_drop",
                "suggested_price": drop_price,
                "capital_at_risk": cost,
            })

        # P2: CRITICAL STALE — approaching dead stock
        elif health == "critical_stale":
            drop_pct = 15
            drop_price = round(price * (1 - drop_pct / 100), 0)
            actions.append({
                "priority": 2, "type": "critical_stale", "item_id": item_id, "title": title,
                "message": f"{title} — {days}d. Drop price {drop_pct}% to ${drop_price} or crosslist now.",
                "suggested_action": "price_drop_or_crosslist",
                "suggested_price": drop_price,
                "capital_at_risk": cost,
            })

        # P3: STALE — needs action
        elif health == "stale":
            if len(platforms) <= 1:
                all_plats = ["ebay", "depop", "vinted", "vestiaire", "poshmark", "etsy"]
                suggest_plats = [p for p in all_plats if p not in platforms][:2]
                actions.append({
                    "priority": 3, "type": "stale_crosslist", "item_id": item_id, "title": title,
                    "message": f"{title} — {days}d on {platforms[0] if platforms else 'unknown'}. Crosslist to {', '.join(p.capitalize() for p in suggest_plats)}.",
                    "suggested_action": "crosslist",
                    "suggested_platforms": suggest_plats,
                })
            else:
                drop_price = round(price * 0.9, 0)
                actions.append({
                    "priority": 3, "type": "stale_reprice", "item_id": item_id, "title": title,
                    "message": f"{title} — {days}d across {len(platforms)} platforms. Drop 10% to ${drop_price}.",
                    "suggested_action": "price_drop",
                    "suggested_price": drop_price,
                })

        # P4: CROSSLIST CANDIDATE — single platform, 10+ days
        elif health == "crosslist_candidate":
            all_plats = ["ebay", "depop", "vinted", "vestiaire", "poshmark", "etsy"]
            suggest_plats = [p for p in all_plats if p not in platforms][:2]
            actions.append({
                "priority": 4, "type": "crosslist", "item_id": item_id, "title": title,
                "message": f"{title} — only on {platforms[0].capitalize() if platforms else '?'}. Crosslist to {', '.join(p.capitalize() for p in suggest_plats)}.",
                "suggested_action": "crosslist",
                "suggested_platforms": suggest_plats,
            })

        # P4: APPROACHING STALE
        elif health == "approaching_stale":
            days_to_stale = 30 - days
            actions.append({
                "priority": 4, "type": "approaching_stale", "item_id": item_id, "title": title,
                "message": f"{title} — {days}d listed. {days_to_stale}d until stale. Refresh listing or optimize.",
                "suggested_action": "optimize",
            })

        # P5: NEEDS LISTING — unlisted items with value
        elif health in ["needs_listing", "ready_to_list"]:
            potential = round(price - cost, 0) if price > 0 else 0
            verb = "List now" if health == "ready_to_list" else "Photograph and list"
            actions.append({
                "priority": 5, "type": "needs_listing", "item_id": item_id, "title": title,
                "message": f"{title} — ${potential} potential profit. {verb}.",
                "suggested_action": "list",
            })

        # P6: SOLD PENDING — needs shipping or completion
        elif health == "sold_pending":
            actions.append({
                "priority": 6, "type": "sold_pending", "item_id": item_id, "title": title,
                "message": f"{title} — sold! Record sale details and ship.",
                "suggested_action": "complete_sale",
            })
        elif health == "shipped_pending":
            actions.append({
                "priority": 6, "type": "shipped_pending", "item_id": item_id, "title": title,
                "message": f"{title} — shipped. Mark complete when delivered.",
                "suggested_action": "mark_complete",
            })

        # P6: INCOMPLETE
        elif health == "incomplete":
            actions.append({
                "priority": 7, "type": "incomplete", "item_id": item_id, "title": title,
                "message": f"{title} — missing purchase price or title. Complete the record.",
                "suggested_action": "edit",
            })

    actions.sort(key=lambda a: (a["priority"], -(a.get("capital_at_risk", 0))))
    return actions


# ─── Item Smart Actions ───

def get_item_smart_actions(item, all_items, settings):
    """Generate contextual smart actions for a specific item."""
    actions = []
    status = item.get("status", "sourced")
    health = item.get("health", "fresh")
    days = item.get("days_listed", 0)
    price = item.get("target_list_price", 0)
    cost = item.get("total_cost_basis", 0)
    platforms = item.get("platforms", [])
    all_plats = ["ebay", "depop", "vinted", "vestiaire", "poshmark", "etsy"]
    missing_plats = [p for p in all_plats if p not in platforms]

    # Status transitions
    if status in ["sourced", "intake"]:
        actions.append({"action": "mark_photographed", "label": "Mark Photographed", "icon": "camera", "type": "status"})
    if status in ["sourced", "intake", "photographed"]:
        actions.append({"action": "mark_listed", "label": "Mark Listed", "icon": "tag", "type": "status"})
    if status == "listed":
        actions.append({"action": "mark_crosslisted", "label": "Mark Crosslisted", "icon": "copy", "type": "status"})
    if status in ["listed", "crosslisted"]:
        actions.append({"action": "mark_sold", "label": "Mark Sold", "icon": "dollar-sign", "type": "status"})
    if status == "sold":
        actions.append({"action": "mark_shipped", "label": "Mark Shipped", "icon": "truck", "type": "status"})
    if status == "shipped":
        actions.append({"action": "mark_completed", "label": "Mark Complete", "icon": "check-circle", "type": "status"})

    # Smart contextual actions
    if status in ["listed", "crosslisted"] and days >= 20 and price > 0:
        drop_10 = round(price * 0.90, 0)
        drop_15 = round(price * 0.85, 0)
        actions.append({
            "action": "price_drop_10", "label": f"Drop 10% → ${drop_10}",
            "icon": "trending-down", "type": "smart", "new_price": drop_10,
        })
        if days >= 40:
            actions.append({
                "action": "price_drop_15", "label": f"Drop 15% → ${drop_15}",
                "icon": "trending-down", "type": "smart", "new_price": drop_15,
            })

    if status in ["listed"] and len(platforms) < 3 and missing_plats:
        top_plats = missing_plats[:2]
        actions.append({
            "action": "crosslist_to", "label": f"Crosslist to {', '.join(p.capitalize() for p in top_plats)}",
            "icon": "copy", "type": "smart", "platforms": top_plats,
        })

    if price > 0 and cost > 0:
        breakeven = round(cost * 1.15, 0)  # rough with fees
        if price < breakeven and status in ["listed", "crosslisted"]:
            actions.append({
                "action": "price_warning", "label": f"Price below breakeven (${breakeven})",
                "icon": "alert-triangle", "type": "warning",
            })

    # Always available
    actions.append({"action": "archive", "label": "Archive", "icon": "archive", "type": "danger"})

    return actions


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
        query["platforms"] = {"$in": [platform]}  # Array field — use $in for proper matching
    if category:
        query["category"] = category

    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().dict()

    items = await db.items.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    computed = [compute_item_fields(i, settings) for i in items]

    # Post-query filter: health state is computed, not stored in DB
    if health:
        computed = [i for i in computed if i.get("health") == health]

    return computed

@api_router.get("/items/{item_id}")
async def get_item(item_id: str):
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().dict()
    
    item = await db.items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    computed = compute_item_fields(item, settings)
    all_items = await db.items.find({}, {"_id": 0}).to_list(1000)
    all_items = [compute_item_fields(i, settings) for i in all_items]
    computed["smart_actions"] = get_item_smart_actions(computed, all_items, settings)

    # Category context
    same_cat_sold = [i for i in all_items if i.get("category") == computed.get("category") and i.get("status") in ["sold", "shipped", "completed"]]
    if same_cat_sold:
        computed["category_avg_roi"] = round(sum(i.get("roi", 0) for i in same_cat_sold) / len(same_cat_sold), 1)
        days_list = [i.get("days_to_sell", 0) for i in same_cat_sold if i.get("days_to_sell", 0) > 0]
        computed["category_avg_days"] = round(sum(days_list) / len(days_list), 1) if days_list else 0
        computed["category_sold_count"] = len(same_cat_sold)

    return computed

@api_router.post("/items")
async def create_item(item: ItemCreate):
    doc = item.dict()
    doc["id"] = make_id()
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.items.insert_one(doc)
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    created = await db.items.find_one({"id": doc["id"]}, {"_id": 0})
    return compute_item_fields(created, settings)

@api_router.put("/items/{item_id}")
async def update_item(item_id: str, item: ItemUpdate):
    updates = {k: v for k, v in item.dict().items() if v is not None}
    updates["updated_at"] = now_iso()
    result = await db.items.update_one({"id": item_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    updated = await db.items.find_one({"id": item_id}, {"_id": 0})
    return compute_item_fields(updated, settings)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    result = await db.items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"deleted": True}


# ─── Bulk Operations ───

class BulkUpdateRequest(BaseModel):
    item_ids: List[str]
    update: Dict[str, Any]  # Fields to update

class BulkDeleteRequest(BaseModel):
    item_ids: List[str]

@api_router.post("/items/bulk-update")
async def bulk_update_items(request: BulkUpdateRequest):
    """Update multiple items at once."""
    if not request.item_ids:
        raise HTTPException(status_code=400, detail="No item IDs provided")
    
    updates = {k: v for k, v in request.update.items() if v is not None}
    updates["updated_at"] = now_iso()
    
    result = await db.items.update_many(
        {"id": {"$in": request.item_ids}},
        {"$set": updates}
    )
    
    return {
        "matched": result.matched_count,
        "modified": result.modified_count
    }

@api_router.post("/items/bulk-delete")
async def bulk_delete_items(request: BulkDeleteRequest):
    """Delete multiple items at once."""
    if not request.item_ids:
        raise HTTPException(status_code=400, detail="No item IDs provided")
    
    result = await db.items.delete_many({"id": {"$in": request.item_ids}})
    
    return {
        "deleted": result.deleted_count
    }


# ─── Dashboard ───

@api_router.get("/dashboard")
async def get_dashboard():
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().dict()
    
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i, settings) for i in items]

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    days_in_month = (now - month_start).days + 1

    sold_this_month = []
    sold_all = []
    active_listings = []
    pre_listing = []
    capital_in_inventory = 0
    capital_at_risk = 0

    for item in items:
        status = item.get("status", "")
        if status in ["sold", "shipped", "completed"]:
            sold_all.append(item)
            sold_date = parse_date(item.get("date_sold"))
            if sold_date and sold_date >= month_start:
                sold_this_month.append(item)
        elif status in ["listed", "crosslisted"]:
            active_listings.append(item)
            capital_in_inventory += item.get("total_cost_basis", 0)
            if item.get("days_listed", 0) >= 45:
                capital_at_risk += item.get("total_cost_basis", 0)
        elif status in ["sourced", "intake", "photographed"]:
            pre_listing.append(item)
            capital_in_inventory += item.get("total_cost_basis", 0)

    monthly_profit = sum(i.get("net_profit", 0) for i in sold_this_month)
    monthly_revenue = sum(i.get("sold_price", 0) for i in sold_this_month)

    # Sell-through rate: sold / (sold + still active) over last 90 days
    ninety_ago = now - timedelta(days=90)
    sold_90 = [i for i in sold_all if parse_date(i.get("date_sold")) and parse_date(i.get("date_sold")) >= ninety_ago]
    sell_through = round(len(sold_90) / max(len(sold_90) + len(active_listings), 1) * 100, 1)

    # Profit velocity
    profit_velocity = round(monthly_profit / max(days_in_month, 1), 2)

    # Average margin on sold
    margins = [i.get("margin", 0) for i in sold_all if i.get("margin", 0) != 0]
    avg_margin = round(sum(margins) / len(margins), 1) if margins else 0
    
    # Average ROI on profitable sales (more meaningful metric)
    profitable_rois = [i.get("roi", 0) for i in sold_all if i.get("roi", 0) > 0]
    avg_roi = round(sum(profitable_rois) / len(profitable_rois), 1) if profitable_rois else 0
    
    # Overall ROI for the month (total profit / total cost)
    total_cost = sum(i.get("purchase_price", 0) for i in sold_this_month)
    monthly_roi = round((monthly_profit / total_cost * 100), 1) if total_cost > 0 else 0

    # Dead stock count
    dead_stock_count = len([i for i in active_listings if i.get("days_listed", 0) >= 60])
    stale_count = len([i for i in active_listings if 30 <= i.get("days_listed", 0) < 60])

    # Inventory age distribution
    age_dist = {"fresh": 0, "warming": 0, "stale": 0, "dead": 0}
    for item in active_listings:
        d = item.get("days_listed", 0)
        if d < 15:
            age_dist["fresh"] += 1
        elif d < 30:
            age_dist["warming"] += 1
        elif d < 60:
            age_dist["stale"] += 1
        else:
            age_dist["dead"] += 1

    # Best platform / category
    platform_profits = {}
    for item in sold_this_month:
        for p in item.get("platforms", []):
            platform_profits[p] = platform_profits.get(p, 0) + item.get("net_profit", 0)
    best_platform = max(platform_profits, key=platform_profits.get) if platform_profits else None

    cat_profits = {}
    for item in sold_this_month:
        cat = item.get("category", "other")
        cat_profits[cat] = cat_profits.get(cat, 0) + item.get("net_profit", 0)
    best_category = max(cat_profits, key=cat_profits.get) if cat_profits else None

    # This week activity
    week_start = now - timedelta(days=now.weekday())  # Monday
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    this_week_sourced = [i for i in items if parse_date(i.get("date_acquired")) and parse_date(i.get("date_acquired")) >= week_start and i.get("status") not in ["sold", "shipped", "completed"]]
    this_week_sold = [i for i in sold_all if parse_date(i.get("date_sold")) and parse_date(i.get("date_sold")) >= week_start]
    this_week_listed = [i for i in items if parse_date(i.get("date_listed")) and parse_date(i.get("date_listed")) >= week_start]
    this_week_profit = sum(i.get("net_profit", 0) for i in this_week_sold)

    # Quick stats for home screen
    quick_stats = {
        "active": len(active_listings) + len(pre_listing),
        "listed": len(active_listings),
        "stale": stale_count,
        "dead": dead_stock_count,
    }

    # Smart action feed
    actions = generate_smart_actions(items, settings)

    # Trends
    trends = []
    for i in range(5, -1, -1):
        m = now - timedelta(days=30 * i)
        m_start = m.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = (m_start + timedelta(days=32)).replace(day=1) if i > 0 else now
        rev = prof = count = 0
        for item in items:
            sd = parse_date(item.get("date_sold"))
            if sd and m_start <= sd < m_end:
                rev += item.get("sold_price", 0)
                prof += item.get("net_profit", 0)
                count += 1
        trends.append({"month": m_start.strftime("%b"), "revenue": round(rev, 2), "profit": round(prof, 2), "count": count})

    return {
        "monthly_net_profit": round(monthly_profit, 2),
        "monthly_revenue": round(monthly_revenue, 2),
        "sold_this_month": len(sold_this_month),
        "active_listings": len(active_listings),
        "pre_listing": len(pre_listing),
        "capital_in_inventory": round(capital_in_inventory, 2),
        "capital_at_risk": round(capital_at_risk, 2),
        "dead_stock_count": dead_stock_count,
        "stale_count": stale_count,
        "sell_through_rate": sell_through,
        "profit_velocity": profit_velocity,
        "avg_margin": avg_margin,
        "avg_roi": avg_roi,
        "monthly_roi": monthly_roi,
        "inventory_age": age_dist,
        "best_platform": best_platform,
        "best_category": best_category,
        "quick_stats": quick_stats,
        "actions": actions[:15],
        "action_count": len(actions),
        "trends": trends,
        "total_items": len(items),
        "this_week": {
            "sourced": len(this_week_sourced),
            "sold": len(this_week_sold),
            "listed": len(this_week_listed),
            "profit": round(this_week_profit, 2),
        },
    }


# ─── Pipeline ───

@api_router.get("/pipeline")
async def get_pipeline():
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i, settings) for i in items]
    stage_order = ["sourced", "intake", "photographed", "listed", "crosslisted", "sold", "shipped", "completed"]
    stages = {}
    for stage in stage_order:
        stage_items = [i for i in items if i.get("status") == stage]
        # Calculate stage duration
        durations = []
        for si in stage_items:
            if si.get("days_listed", 0) > 0:
                durations.append(si["days_listed"])
            elif si.get("days_in_inventory", 0) > 0:
                durations.append(si["days_in_inventory"])
        avg_duration = round(sum(durations) / len(durations), 1) if durations else 0
        # Items stuck = above average duration by 50%+
        stuck_count = len([d for d in durations if d > avg_duration * 1.5]) if avg_duration > 0 else 0
        stages[stage] = {
            "items": stage_items,
            "count": len(stage_items),
            "avg_days": avg_duration,
            "stuck_count": stuck_count,
            "is_bottleneck": len(stage_items) >= 3 and stage not in ["sold", "shipped", "completed"],
        }
    return stages


# ─── Dead Stock ───

@api_router.get("/deadstock")
async def get_deadstock():
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().dict()
    platform_fees = settings.get("platform_fees", {})

    items = await db.items.find({"status": {"$in": ["listed", "crosslisted"]}}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i, settings) for i in items]

    buckets = {"30_45": [], "45_60": [], "60_90": [], "90_plus": []}

    for item in items:
        days = item.get("days_listed", 0)
        price = item.get("target_list_price", 0)
        cost = item.get("total_cost_basis", 0)
        platforms = item.get("platforms", [])

        # Calculate fee-adjusted profit at different discount levels
        avg_fee_pct = 10.0
        if platforms:
            fees_list = [platform_fees.get(p, 10.0) for p in platforms]
            avg_fee_pct = sum(fees_list) / len(fees_list)

        discounts = {}
        for pct in [0, 10, 15, 25]:
            disc_price = round(price * (1 - pct / 100), 2)
            est_fees = round(disc_price * avg_fee_pct / 100, 2)
            disc_profit = round(disc_price - cost - est_fees, 2)
            discounts[f"drop_{pct}"] = {"price": disc_price, "profit": disc_profit}

        item["discount_scenarios"] = discounts
        item["daily_capital_cost"] = round(cost / 365, 2) if cost > 0 else 0

        if days >= 90:
            if discounts.get("drop_25", {}).get("profit", 0) > 0:
                item["suggested_action"] = f"Drop 25% to ${discounts['drop_25']['price']} — still ${discounts['drop_25']['profit']} profit"
            else:
                item["suggested_action"] = f"Archive or bundle — losing ${item['daily_capital_cost']}/day in locked capital"
            item["urgency"] = "critical"
            buckets["90_plus"].append(item)
        elif days >= 60:
            item["suggested_action"] = f"Drop 15% to ${discounts['drop_15']['price']} — ${discounts['drop_15']['profit']} profit"
            item["urgency"] = "high"
            buckets["60_90"].append(item)
        elif days >= 45:
            if len(platforms) <= 1:
                all_plats = ["ebay", "depop", "vinted", "vestiaire", "poshmark", "etsy"]
                suggest = [p for p in all_plats if p not in platforms][:2]
                item["suggested_action"] = f"Crosslist to {', '.join(p.capitalize() for p in suggest)} before dropping price"
            else:
                item["suggested_action"] = f"Drop 10% to ${discounts['drop_10']['price']} — ${discounts['drop_10']['profit']} profit"
            item["urgency"] = "medium"
            buckets["45_60"].append(item)
        elif days >= 30:
            item["suggested_action"] = "Refresh listing — update photos, title, description"
            item["urgency"] = "low"
            buckets["30_45"].append(item)

    total_capital = sum(i.get("total_cost_basis", 0) for bucket in buckets.values() for i in bucket)
    return {
        "buckets": buckets,
        "total_stale_items": sum(len(b) for b in buckets.values()),
        "total_capital_locked": round(total_capital, 2),
    }


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
    margin = round((net_profit / req.expected_sale_price * 100), 1) if req.expected_sale_price > 0 else 0
    break_even = round(total_cost / (1 - fee_pct / 100), 2) if fee_pct < 100 else 0
    max_buy = round(req.expected_sale_price * (1 - fee_pct / 100) - req.shipping_to_acquire - req.prep_cost - req.packaging_cost, 2)
    min_sale = round(total_cost / (1 - fee_pct / 100), 2) if fee_pct < 100 else 0

    # Enhanced verdict with confidence
    if roi >= target_roi and net_profit >= min_profit:
        verdict = "buy"
        if roi >= target_roi * 1.5 and net_profit >= min_profit * 2:
            confidence = "strong"
        else:
            confidence = "meets_targets"
    elif net_profit > 0 and roi > 0:
        verdict = "risky"
        if roi >= target_roi * 0.5:
            confidence = "close_to_targets"
        else:
            confidence = "below_targets"
    else:
        verdict = "skip"
        confidence = "unprofitable" if net_profit <= 0 else "negative_roi"

    # Historical context
    all_items = await db.items.find({}, {"_id": 0}).to_list(1000)
    all_items = [compute_item_fields(i, settings) for i in all_items]

    # Platform context
    plat_sold = [i for i in all_items if req.platform.lower() in i.get("platforms", []) and i.get("status") in ["sold", "shipped", "completed"]]
    platform_context = None
    if plat_sold:
        platform_context = {
            "avg_roi": round(sum(i.get("roi", 0) for i in plat_sold) / len(plat_sold), 1),
            "avg_days": round(sum(i.get("days_to_sell", 0) for i in plat_sold if i.get("days_to_sell")) / max(len([i for i in plat_sold if i.get("days_to_sell")]), 1), 1),
            "total_sold": len(plat_sold),
        }

    # Category context
    cat_context = None
    if req.category:
        cat_sold = [i for i in all_items if i.get("category") == req.category and i.get("status") in ["sold", "shipped", "completed"]]
        if cat_sold:
            cat_context = {
                "avg_roi": round(sum(i.get("roi", 0) for i in cat_sold) / len(cat_sold), 1),
                "avg_days": round(sum(i.get("days_to_sell", 0) for i in cat_sold if i.get("days_to_sell")) / max(len([i for i in cat_sold if i.get("days_to_sell")]), 1), 1),
                "total_sold": len(cat_sold),
            }

    # Profit per day estimate
    avg_days_all = 0
    sold_with_days = [i for i in all_items if i.get("days_to_sell", 0) > 0]
    if sold_with_days:
        avg_days_all = sum(i["days_to_sell"] for i in sold_with_days) / len(sold_with_days)
    profit_per_day = round(net_profit / max(avg_days_all, 1), 2) if net_profit > 0 else 0

    return {
        "total_cost_basis": round(total_cost, 2),
        "estimated_fees": estimated_fees,
        "fee_percentage": fee_pct,
        "net_profit": net_profit,
        "roi": roi,
        "margin": margin,
        "break_even_price": break_even,
        "max_buy_price": max_buy,
        "min_acceptable_sale": min_sale,
        "verdict": verdict,
        "confidence": confidence,
        "profit_per_day": profit_per_day,
        "platform_context": platform_context,
        "category_context": cat_context,
    }


# ─── Screenshot Analysis (OCR) ───

def detect_platform(text: str) -> tuple[Optional[str], str]:
    """Detect which marketplace platform the screenshot is from"""
    text_lower = text.lower()
    
    platform_indicators = {
        "vinted": ["vinted", "vendeur", "protection acheteur", "en voir plus"],
        "depop": ["depop", "buy now", "make offer", "sold by", "bundle discount"],
        "ebay": ["ebay", "buy it now", "add to cart", "place bid", "seller information", "item condition"],
        "poshmark": ["poshmark", "posh protect", "add to bundle", "authenticate"],
        "vestiaire": ["vestiaire", "authenticity check", "direct shipping"],
        "etsy": ["etsy", "add to basket", "handmade", "vintage"],
        "mercari": ["mercari", "smart pay", "shipping protection"],
        "grailed": ["grailed", "send offer", "sold out"],
    }
    
    for platform, indicators in platform_indicators.items():
        matches = sum(1 for ind in indicators if ind in text_lower)
        if matches >= 1:
            confidence = "high" if matches >= 2 else "medium"
            return platform, confidence
    
    return None, "low"

def extract_price(text: str) -> tuple[Optional[float], str]:
    """Extract price from OCR text"""
    # Common price patterns
    patterns = [
        r'[\$\£\€]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # $199, £199.99, €1,999
        r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[\$\£\€]',  # 199$, 199.99€
        r'(?:price|prix|preis|prijs)[\s:]*[\$\£\€]?\s*(\d+(?:\.\d{2})?)',  # Price: $199
        r'(?:asking|listed|for sale)[\s:]*[\$\£\€]?\s*(\d+(?:\.\d{2})?)',
        r'\b(\d{2,4}(?:\.\d{2})?)\s*(?:incl|including|free ship)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(',', '')
            try:
                price = float(price_str)
                if 1 < price < 50000:  # Reasonable price range
                    return price, "high"
            except ValueError:
                continue
    
    # Fallback: find any number that looks like a price
    numbers = re.findall(r'\b(\d{2,4}(?:\.\d{2})?)\b', text)
    for num in numbers:
        try:
            price = float(num)
            if 5 < price < 10000:
                return price, "low"
        except ValueError:
            continue
    
    return None, "low"

def extract_brand(text: str) -> tuple[Optional[str], str]:
    """Extract brand name from OCR text"""
    known_brands = [
        "Acne Studios", "A.P.C.", "Jacquemus", "Lemaire", "Our Legacy", "Margaret Howell",
        "Isabel Marant", "Dries Van Noten", "Maison Margiela", "Balenciaga", "Gucci",
        "Prada", "Louis Vuitton", "Hermès", "Chanel", "Nike", "Adidas", "New Balance",
        "Carhartt", "Stüssy", "Supreme", "Off-White", "Stone Island", "Burberry",
        "Ralph Lauren", "Tommy Hilfiger", "Levi's", "Zara", "H&M", "Uniqlo",
        "COS", "& Other Stories", "Arket", "Toteme", "The Row", "Bottega Veneta",
        "Celine", "Saint Laurent", "Loewe", "Miu Miu", "Fendi", "Valentino",
        "Alexander McQueen", "Jil Sander", "Rick Owens", "Comme des Garçons",
    ]
    
    text_lower = text.lower()
    for brand in known_brands:
        if brand.lower() in text_lower:
            return brand, "high"
    
    # Try to find capitalized words that might be brands
    potential_brands = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b', text)
    if potential_brands:
        # Filter out common non-brand words
        skip_words = {"Size", "Color", "Condition", "Description", "Shipping", "Price", "Buy", "Sell", "New", "Used"}
        for brand in potential_brands:
            if brand not in skip_words and len(brand) > 2:
                return brand, "low"
    
    return None, "low"

def extract_size(text: str) -> tuple[Optional[str], str]:
    """Extract size from OCR text"""
    # Size patterns
    patterns = [
        r'(?:size|sz|taille)[\s:]*([XSMLXL]{1,3}|\d{1,2}|[0-9]{1,2}[/-][0-9]{1,2})',
        r'\b(XXS|XS|S|M|L|XL|XXL|XXXL)\b',
        r'\b(UK\s*\d{1,2}|US\s*\d{1,2}|EU\s*\d{1,2})\b',
        r'\b(\d{1,2})\s*(?:UK|US|EU)\b',
        r'(?:waist|chest|length)[\s:]*(\d{1,2})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).upper(), "high"
    
    return None, "low"

def extract_condition(text: str) -> tuple[Optional[str], str]:
    """Extract condition from OCR text"""
    text_lower = text.lower()
    
    condition_map = {
        "new with tags": ["new with tags", "nwt", "bnwt", "brand new"],
        "new without tags": ["new without tags", "nwot", "new no tags"],
        "like new": ["like new", "mint", "excellent", "pristine", "as new"],
        "good": ["good condition", "very good", "gently used", "great condition"],
        "fair": ["fair condition", "some wear", "visible wear", "used"],
        "poor": ["poor condition", "well worn", "needs repair"],
    }
    
    for condition, indicators in condition_map.items():
        for ind in indicators:
            if ind in text_lower:
                return condition, "high"
    
    return None, "low"

def extract_title(text: str, brand: Optional[str]) -> tuple[Optional[str], str]:
    """Extract or construct a title from the text"""
    lines = [line.strip() for line in text.split('\n') if line.strip() and len(line.strip()) > 3]
    
    if lines:
        # First non-trivial line is often the title
        for line in lines[:5]:
            # Skip lines that are just prices or sizes
            if re.match(r'^[\$\£\€]?\d+(?:\.\d{2})?$', line):
                continue
            if len(line) < 50 and len(line) > 5:
                return line, "medium"
    
    return None, "low"

def extract_category(text: str) -> tuple[Optional[str], str]:
    """Extract category from text"""
    text_lower = text.lower()
    
    category_keywords = {
        "Bags": ["bag", "handbag", "tote", "clutch", "backpack", "crossbody", "purse", "satchel"],
        "Dresses": ["dress", "gown", "maxi", "midi", "mini dress"],
        "Tops": ["top", "shirt", "blouse", "t-shirt", "tee", "sweater", "jumper", "hoodie", "cardigan"],
        "Outerwear": ["jacket", "coat", "blazer", "parka", "vest", "gilet", "puffer"],
        "Bottoms": ["pants", "trousers", "jeans", "shorts"],
        "Skirts": ["skirt", "mini skirt", "midi skirt", "maxi skirt", "pencil skirt", "a-line skirt"],
        "Footwear": ["shoes", "boots", "sneakers", "trainers", "heels", "sandals", "loafers"],
        "Accessories": ["scarf", "hat", "belt", "sunglasses", "jewelry", "watch", "wallet"],
        "Knitwear": ["knit", "sweater", "cardigan", "pullover", "jumper"],
        "Swimwear": ["swimsuit", "bikini", "swim", "swimwear", "bathing suit"],
    }
    
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                return category, "high"
    
    return None, "low"

def extract_color(text: str) -> tuple[Optional[str], str]:
    """Extract color from text"""
    colors = [
        "black", "white", "grey", "gray", "navy", "blue", "red", "green", "brown",
        "beige", "cream", "pink", "purple", "orange", "yellow", "gold", "silver",
        "burgundy", "olive", "tan", "camel", "khaki", "charcoal", "ivory", "coral",
    ]
    
    text_lower = text.lower()
    for color in colors:
        if re.search(r'\b' + color + r'\b', text_lower):
            return color.capitalize(), "medium"
    
    return None, "low"

async def analyze_screenshot_ai(image_base64: str) -> Dict[str, Any]:
    """Analyze a screenshot using Claude Vision API to extract listing information"""
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")

    if not anthropic_key:
        logging.error("ANTHROPIC_API_KEY not set — falling back to regex extraction")
        return analyze_screenshot_regex(image_base64)

    try:
        # Clean base64 string
        raw_b64 = image_base64
        media_type = "image/jpeg"
        if ',' in image_base64:
            header, raw_b64 = image_base64.split(',', 1)
            if 'png' in header:
                media_type = "image/png"

        prompt = """Analyze this screenshot of a marketplace listing (e.g. Vinted, Depop, eBay, Poshmark, Vestiaire Collective, Etsy, Mercari, Grailed).

Extract the following fields. For each field, provide a value and confidence level ("high", "medium", or "low").

Return ONLY valid JSON in this exact format:
{
  "title": {"value": "item title", "confidence": "high"},
  "brand": {"value": "brand name", "confidence": "high"},
  "listed_price": {"value": 29.99, "confidence": "high"},
  "size": {"value": "M", "confidence": "medium"},
  "condition": {"value": "Like New", "confidence": "high"},
  "category": {"value": "Tops", "confidence": "medium"},
  "color": {"value": "Black", "confidence": "high"},
  "detected_platform": "Vinted",
  "raw_text": "all visible text from the screenshot"
}

Rules:
- listed_price must be a number or null
- detected_platform should be the marketplace name or null
- raw_text should contain all readable text from the image
- If you can't determine a field, set value to "" or null with confidence "low"
- For condition, use: "New with Tags", "New without Tags", "Like New", "Very Good", "Good", "Fair", or "Poor"
- For category, use: "Bags", "Dresses", "Tops", "Outerwear", "Bottoms", "Skirts", "Footwear", "Accessories", "Knitwear", "Swimwear", or "Trousers"
"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": raw_b64,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }],
                },
            )

        if resp.status_code != 200:
            logging.error(f"Claude API error {resp.status_code}: {resp.text}")
            return analyze_screenshot_regex(image_base64)

        result = resp.json()
        text_content = result["content"][0]["text"]

        # Parse JSON from response — robustly extract from markdown blocks
        json_str = text_content.strip()
        # Try to extract JSON from ```json ... ``` blocks
        json_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', json_str)
        if json_match:
            json_str = json_match.group(1)
        elif not json_str.startswith('{'):
            # Try to find a JSON object in the text
            brace_start = json_str.find('{')
            brace_end = json_str.rfind('}')
            if brace_start != -1 and brace_end != -1:
                json_str = json_str[brace_start:brace_end + 1]

        parsed = json.loads(json_str)

        def normalize_field(val, default_val="") -> Dict[str, Any]:
            """Ensure every field is {value, confidence} dict, even if Claude returns a flat value."""
            if isinstance(val, dict) and "value" in val and "confidence" in val:
                return val
            if isinstance(val, dict) and "value" in val:
                return {"value": val["value"], "confidence": "medium"}
            # Claude returned a bare value (string, number, etc.)
            return {"value": val if val is not None else default_val, "confidence": "medium"}

        extracted_data = {
            "title": normalize_field(parsed.get("title"), ""),
            "brand": normalize_field(parsed.get("brand"), ""),
            "listed_price": normalize_field(parsed.get("listed_price"), None),
            "size": normalize_field(parsed.get("size"), ""),
            "condition": normalize_field(parsed.get("condition"), ""),
            "category": normalize_field(parsed.get("category"), ""),
            "color": normalize_field(parsed.get("color"), ""),
        }

        return {
            "success": True,
            "raw_text": parsed.get("raw_text", ""),
            "extracted_data": extracted_data,
            "detected_platform": parsed.get("detected_platform"),
        }

    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse Claude response: {e}")
        return analyze_screenshot_regex(image_base64)
    except Exception as e:
        logging.error(f"AI Analysis Error: {str(e)}")
        return analyze_screenshot_regex(image_base64)


def analyze_screenshot_regex(image_base64: str) -> Dict[str, Any]:
    """Fallback: extract data using regex patterns on OCR text (if Tesseract available)"""
    try:
        if not IMAGE_PROCESSING_AVAILABLE:
            return {"success": False, "error": "Image processing not available", "raw_text": "", "extracted_data": {}}

        # Try Tesseract if available
        raw_text = ""
        try:
            import pytesseract
            if ',' in image_base64:
                image_base64 = image_base64.split(',')[1]
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            raw_text = pytesseract.image_to_string(image, lang='eng')
        except Exception as e:
            logging.warning(f"Tesseract fallback failed: {e}")
            return {"success": False, "error": "Image analysis unavailable", "raw_text": "", "extracted_data": {}}

        platform, platform_conf = detect_platform(raw_text)
        price, price_conf = extract_price(raw_text)
        brand, brand_conf = extract_brand(raw_text)
        size, size_conf = extract_size(raw_text)
        condition, condition_conf = extract_condition(raw_text)
        category, category_conf = extract_category(raw_text)
        color, color_conf = extract_color(raw_text)
        title, title_conf = extract_title(raw_text, brand)

        extracted_data = {
            "title": {"value": title or "", "confidence": title_conf},
            "brand": {"value": brand or "", "confidence": brand_conf},
            "listed_price": {"value": price, "confidence": price_conf},
            "size": {"value": size or "", "confidence": size_conf},
            "condition": {"value": condition or "", "confidence": condition_conf},
            "category": {"value": category or "", "confidence": category_conf},
            "color": {"value": color or "", "confidence": color_conf},
        }

        return {
            "success": True,
            "raw_text": raw_text,
            "extracted_data": extracted_data,
            "detected_platform": platform,
        }
    except Exception as e:
        logging.error(f"Regex fallback error: {str(e)}")
        return {"success": False, "error": str(e), "raw_text": "", "extracted_data": {}}

@api_router.post("/analyze-screenshot")
async def analyze_screenshot(req: ScreenshotAnalysisRequest):
    """Analyze uploaded screenshot(s) to extract listing information"""
    if not req.images:
        raise HTTPException(status_code=400, detail="No images provided")
    
    all_text = []
    combined_data = {}
    detected_platforms = []
    
    for idx, image_b64 in enumerate(req.images):
        result = await analyze_screenshot_ai(image_b64)
        
        if result["success"]:
            all_text.append(result["raw_text"])
            
            if result.get("detected_platform"):
                detected_platforms.append(result["detected_platform"])
            
            # Merge extracted data, preferring higher confidence values
            for field, data in result.get("extracted_data", {}).items():
                if field not in combined_data:
                    combined_data[field] = data
                elif data.get("confidence") == "high" and combined_data[field].get("confidence") != "high":
                    combined_data[field] = data
                elif data.get("value") and not combined_data[field].get("value"):
                    combined_data[field] = data
    
    # Determine primary platform
    primary_platform = detected_platforms[0] if detected_platforms else None

    # If no images were successfully analyzed, return failure
    if not all_text and not combined_data:
        return {
            "success": False,
            "extracted_data": {},
            "raw_text": "",
            "detected_platform": None,
        }

    return {
        "success": True,
        "extracted_data": combined_data,
        "raw_text": "\n---\n".join(all_text),
        "detected_platform": primary_platform,
    }


# ─── Insights ───

@api_router.get("/insights")
async def get_insights():
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    items = await db.items.find({}, {"_id": 0}).to_list(1000)
    items = [compute_item_fields(i, settings) for i in items]

    sold = [i for i in items if i.get("status") in ["sold", "shipped", "completed"]]
    active = [i for i in items if i.get("status") in ["listed", "crosslisted"]]

    platform_rev = {}
    platform_prof = {}
    for item in sold:
        for p in item.get("platforms", []):
            platform_rev[p] = platform_rev.get(p, 0) + item.get("sold_price", 0)
            platform_prof[p] = platform_prof.get(p, 0) + item.get("net_profit", 0)

    cat_perf = {}
    for item in sold:
        cat = item.get("category", "other")
        if cat not in cat_perf:
            cat_perf[cat] = {"revenue": 0, "profit": 0, "count": 0, "avg_roi": 0, "rois": []}
        cat_perf[cat]["revenue"] += item.get("sold_price", 0)
        cat_perf[cat]["profit"] += item.get("net_profit", 0)
        cat_perf[cat]["count"] += 1
        cat_perf[cat]["rois"].append(item.get("roi", 0))

    for cat in cat_perf:
        rois = cat_perf[cat].pop("rois")
        cat_perf[cat]["avg_roi"] = round(sum(rois) / len(rois), 1) if rois else 0
        cat_perf[cat] = {k: round(v, 2) if isinstance(v, float) else v for k, v in cat_perf[cat].items()}

    avg_roi = round(sum(i.get("roi", 0) for i in sold) / len(sold), 1) if sold else 0
    days_list = [i.get("days_to_sell", 0) for i in sold if i.get("days_to_sell", 0) > 0]
    avg_days = round(sum(days_list) / len(days_list), 1) if days_list else 0

    dead = len([i for i in active if i.get("days_listed", 0) > 60])
    dead_pct = round(dead / len(active) * 100, 1) if active else 0
    capital_stale = round(sum(i.get("total_cost_basis", 0) for i in active if i.get("days_listed", 0) > 30), 2)

    now = datetime.now(timezone.utc)
    monthly_trends = []
    for i in range(5, -1, -1):
        m = now - timedelta(days=30 * i)
        m_start = m.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = (m_start + timedelta(days=32)).replace(day=1) if i > 0 else now
        rev = prof = 0
        for item in items:
            sd = parse_date(item.get("date_sold"))
            if sd and m_start <= sd < m_end:
                rev += item.get("sold_price", 0)
                prof += item.get("net_profit", 0)
        monthly_trends.append({"month": m_start.strftime("%b"), "revenue": round(rev, 2), "profit": round(prof, 2)})

    return {
        "platform_revenue": {k: round(v, 2) for k, v in platform_rev.items()},
        "platform_profit": {k: round(v, 2) for k, v in platform_prof.items()},
        "category_performance": cat_perf,
        "avg_roi": avg_roi,
        "avg_days_to_sell": avg_days,
        "dead_stock_percentage": dead_pct,
        "capital_in_stale": capital_stale,
        "monthly_trends": monthly_trends,
        "total_sold": len(sold),
        "total_active": len(active),
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
    # Clear existing data first
    await db.items.delete_many({})
    
    now = datetime.now(timezone.utc)
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

    # Sample product photos from Unsplash
    # Unique product photos for each item
    ITEM_PHOTOS = [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",  # Acne bag
        "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop",  # Jacquemus bag
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop",  # Tabi boots
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",  # CdG striped shirt
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",  # APC bag
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop",  # Sandro tweed jacket
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop",  # Isabel Marant knit
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",  # The Row bag
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop",  # Toteme denim
        "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop",  # Lemaire bag
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",  # Stussy varsity
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",  # Carhartt coat
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop",  # Our Legacy knit
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",  # Margaret Howell dress
        "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop",  # DVN scarf
    ]

    for i, item in enumerate(mock_items):
        item["id"] = make_id()
        item["created_at"] = now_iso()
        item["updated_at"] = now_iso()
        # Give each item its own unique photo
        photo_url = ITEM_PHOTOS[i] if i < len(ITEM_PHOTOS) else ""
        item["photos"] = [photo_url] if photo_url else []
        item["is_draft"] = False

    await db.items.insert_many(mock_items)

    default_settings = SettingsModel().dict()
    default_settings["id"] = "global"
    default_settings["onboarding_complete"] = True
    default_settings["selected_platforms"] = ["ebay", "depop", "vinted", "vestiaire", "poshmark", "etsy"]
    default_settings["business_goals"] = ["profit_clarity", "better_buying"]
    await db.settings.update_one({"id": "global"}, {"$set": default_settings}, upsert=True)

    return {"message": "Seeded successfully", "count": len(mock_items)}


@api_router.post("/reset")
async def reset_data():
    """Clear all items and reset settings to defaults"""
    await db.items.delete_many({})
    default_settings = SettingsModel().dict()
    default_settings["id"] = "global"
    await db.settings.update_one({"id": "global"}, {"$set": default_settings}, upsert=True)
    return {"message": "All data reset successfully"}


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
