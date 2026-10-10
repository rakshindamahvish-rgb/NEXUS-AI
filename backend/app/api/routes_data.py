import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.entities import (
    Supplier, Facility, DistributionCenter, Product,
    BaselineDemand, InventoryRecord, TransportationRoute, AuditEvent
)

router = APIRouter(prefix="/data", tags=["Data Explorer & I/O"])

@router.get("/provenance")
def get_data_provenance():
    """Returns dataset provenance, synthetic environment metadata, and currency standards."""
    return {
        "dataset_name": "NEXUS Precision Electronics 3-Echelon Benchmark Dataset",
        "environment_type": "SYNTHETIC DEMONSTRATION ENVIRONMENT",
        "notice": "DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA. This dataset models a representative high-tech electronics supply network. No proprietary enterprise data is exposed.",
        "currency": "INR (Indian Rupee, ₹)",
        "planning_horizon_days": 7,
        "network_echelons": [
            {"echelon": 1, "type": "Suppliers", "entities": ["Apex Semiconductors Ltd", "Bharat Silicon Corp", "Zenith PowerTech Ltd"]},
            {"echelon": 2, "type": "Manufacturing Facility", "entities": ["Pune Advanced Electronics MegaFactory"]},
            {"echelon": 3, "type": "Distribution Hubs", "entities": ["Mumbai North DC", "Bengaluru South DC"]}
        ],
        "created_date": "2026-10-09",
        "version": "1.2.0"
    }

@router.get("/export/csv/{entity_type}")
def export_csv(entity_type: str, db: Session = Depends(get_db)):
    """Exports specified supply chain entity table to standard CSV format."""
    output = io.StringIO()
    writer = csv.writer(output)

    if entity_type == "suppliers":
        records = db.query(Supplier).all()
        writer.writerow(["ID", "Code", "Name", "Location", "Component", "Daily Capacity", "Lead Time Days", "Unit Cost (INR)", "Reliability", "Is Critical", "Status"])
        for r in records:
            writer.writerow([r.id, r.code, r.name, r.location, r.component_type, r.capacity_daily, r.lead_time_days, r.unit_cost, r.reliability, r.is_critical, r.status])
    elif entity_type == "products":
        records = db.query(Product).all()
        writer.writerow(["ID", "Code", "Name", "Category", "Selling Price (INR)", "Shortage Penalty / Day (INR)", "Target SLA", "Weight (kg)"])
        for r in records:
            writer.writerow([r.id, r.code, r.name, r.category, r.selling_price, r.shortage_penalty_per_day, r.target_service_level, r.unit_weight_kg])
    elif entity_type == "demand":
        records = db.query(BaselineDemand).all()
        writer.writerow(["ID", "Day", "Product ID", "DC ID", "Quantity Units"])
        for r in records:
            writer.writerow([r.id, r.day, r.product_id, r.dc_id, r.quantity])
    elif entity_type == "inventory":
        records = db.query(InventoryRecord).all()
        writer.writerow(["ID", "Echelon", "Entity ID", "Item Type", "Item ID", "On Hand Units", "Safety Stock Units", "Reorder Point Units"])
        for r in records:
            writer.writerow([r.id, r.echelon, r.entity_id, r.item_type, r.item_id, r.on_hand_units, r.safety_stock_units, r.reorder_point_units])
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported entity type '{entity_type}'. Supported: suppliers, products, demand, inventory.")

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=nexus_{entity_type}.csv"}
    )

@router.post("/import/csv/{entity_type}")
async def import_csv(entity_type: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Imports and validates CSV data with strict column checking and error reporting."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv file.")

    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.reader(io.StringIO(decoded))
    
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    header = [col.strip().lower() for col in rows[0]]
    data_rows = rows[1:]

    accepted_count = 0
    rejected_rows = []

    if entity_type == "demand":
        # Expect day, product_id, dc_id, quantity
        for idx, row in enumerate(data_rows, start=2):
            try:
                if len(row) < 4:
                    rejected_rows.append({"row_number": idx, "reason": "Insufficient columns (expected 4)"})
                    continue
                day = int(row[1]) if len(row) > 4 else int(row[0])
                p_id = int(row[2]) if len(row) > 4 else int(row[1])
                dc_id = int(row[3]) if len(row) > 4 else int(row[2])
                qty = float(row[4]) if len(row) > 4 else float(row[3])

                if day < 1 or day > 30 or qty < 0:
                    rejected_rows.append({"row_number": idx, "reason": "Values out of range (day 1-30, qty >= 0)"})
                    continue

                # Update or insert
                existing = db.query(BaselineDemand).filter(
                    BaselineDemand.day == day,
                    BaselineDemand.product_id == p_id,
                    BaselineDemand.dc_id == dc_id
                ).first()
                if existing:
                    existing.quantity = qty
                else:
                    db.add(BaselineDemand(day=day, product_id=p_id, dc_id=dc_id, quantity=qty))
                accepted_count += 1
            except Exception as e:
                rejected_rows.append({"row_number": idx, "reason": str(e)})

        db.commit()
    else:
        raise HTTPException(status_code=400, detail=f"Direct import currently supported for 'demand' records. Received '{entity_type}'.")

    return {
        "status": "success",
        "entity_type": entity_type,
        "total_rows": len(data_rows),
        "accepted_rows": accepted_count,
        "rejected_count": len(rejected_rows),
        "rejected_details": rejected_rows[:20]  # Return top 20 rejected
    }
