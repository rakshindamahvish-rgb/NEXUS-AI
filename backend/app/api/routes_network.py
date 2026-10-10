from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.entities import (
    Supplier, Facility, DistributionCenter, Product,
    BillOfMaterials, TransportationRoute, BaselineDemand, InventoryRecord
)
from app.models.schemas import (
    SupplierOut, FacilityOut, DistributionCenterOut, ProductOut,
    BOMOut, RouteOut, BaselineDemandOut, InventoryRecordOut, NetworkOverviewOut
)

router = APIRouter(prefix="/network", tags=["Network"])

@router.get("/overview", response_model=NetworkOverviewOut)
def get_network_overview(db: Session = Depends(get_db)):
    """Returns complete 3-echelon supply network topology, inventory, demand, and BOM."""
    suppliers = db.query(Supplier).all()
    facilities = db.query(Facility).all()
    dcs = db.query(DistributionCenter).all()
    products = db.query(Product).all()
    routes = db.query(TransportationRoute).all()
    boms = db.query(BillOfMaterials).all()
    inventory = db.query(InventoryRecord).all()
    demand = db.query(BaselineDemand).all()

    # Enrich BOM with product & supplier names
    bom_out = []
    prd_map = {p.id: p.name for p in products}
    sup_map = {s.id: s.name for s in suppliers}
    for b in boms:
        bom_out.append(BOMOut(
            id=b.id,
            product_id=b.product_id,
            product_name=prd_map.get(b.product_id, f"Product {b.product_id}"),
            component_name=b.component_name,
            required_quantity=b.required_quantity,
            supplier_id=b.supplier_id,
            supplier_name=sup_map.get(b.supplier_id)
        ))

    # Enrich routes with entity names
    route_out = []
    fac_map = {f.id: f.name for f in facilities}
    dc_map = {dc.id: dc.name for dc in dcs}
    for r in routes:
        s_name = sup_map.get(r.source_id, f"Supplier {r.source_id}") if r.source_type == "SUPPLIER" else fac_map.get(r.source_id, f"Facility {r.source_id}")
        t_name = fac_map.get(r.target_id, f"Facility {r.target_id}") if r.target_type == "FACILITY" else dc_map.get(r.target_id, f"DC {r.target_id}")
        route_out.append(RouteOut(
            id=r.id,
            source_type=r.source_type,
            source_id=r.source_id,
            source_name=s_name,
            target_type=r.target_type,
            target_id=r.target_id,
            target_name=t_name,
            distance_km=r.distance_km,
            transit_time_days=r.transit_time_days,
            standard_cost_per_unit=r.standard_cost_per_unit,
            expedited_cost_per_unit=r.expedited_cost_per_unit,
            expedited_transit_days=r.expedited_transit_days
        ))

    # Enrich inventory
    inv_out = []
    for inv in inventory:
        ent_name = "Pune MegaFactory" if inv.echelon == "FACILITY" else (dc_map.get(inv.entity_id, f"DC {inv.entity_id}"))
        item_name = "Microcontroller MCU-X" if inv.item_type == "COMPONENT" and inv.item_id == 1 else ("Power Module PM-A" if inv.item_type == "COMPONENT" else prd_map.get(inv.item_id, f"Product {inv.item_id}"))
        inv_out.append(InventoryRecordOut(
            id=inv.id,
            echelon=inv.echelon,
            entity_id=inv.entity_id,
            entity_name=ent_name,
            item_type=inv.item_type,
            item_id=inv.item_id,
            item_name=item_name,
            on_hand_units=inv.on_hand_units,
            safety_stock_units=inv.safety_stock_units,
            reorder_point_units=inv.reorder_point_units
        ))

    # Enrich demand
    dem_out = []
    for d in demand:
        dem_out.append(BaselineDemandOut(
            id=d.id,
            day=d.day,
            product_id=d.product_id,
            product_code=next((p.code for p in products if p.id == d.product_id), f"PRD-{d.product_id}"),
            dc_id=d.dc_id,
            dc_code=next((dc.code for dc in dcs if dc.id == d.dc_id), f"DC-{d.dc_id}"),
            quantity=d.quantity
        ))

    return NetworkOverviewOut(
        suppliers=[SupplierOut.model_validate(s) for s in suppliers],
        facilities=[FacilityOut.model_validate(f) for f in facilities],
        distribution_centers=[DistributionCenterOut.model_validate(dc) for dc in dcs],
        products=[ProductOut.model_validate(p) for p in products],
        routes=route_out,
        bom=bom_out,
        inventory=inv_out,
        baseline_demand=dem_out
    )

@router.get("/suppliers", response_model=List[SupplierOut])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()

@router.get("/products", response_model=List[ProductOut])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()
