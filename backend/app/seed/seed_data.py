from sqlalchemy.orm import Session
from app.models.entities import (
    Supplier, Facility, DistributionCenter, Product,
    BillOfMaterials, TransportationRoute, BaselineDemand, InventoryRecord,
    AuditEvent
)
from app.database import Base, engine

def init_db(db: Session, force_reseed: bool = False):
    """Initializes tables and seeds synthetic demonstration data if empty or forced."""
    Base.metadata.create_all(bind=engine)

    supplier_count = db.query(Supplier).count()
    if supplier_count > 0 and not force_reseed:
        return {"status": "already_initialized", "suppliers": supplier_count}

    if force_reseed:
        # Clear existing non-decision records safely
        db.query(BaselineDemand).delete()
        db.query(InventoryRecord).delete()
        db.query(TransportationRoute).delete()
        db.query(BillOfMaterials).delete()
        db.query(Product).delete()
        db.query(DistributionCenter).delete()
        db.query(Facility).delete()
        db.query(Supplier).delete()
        db.commit()

    # 1. Suppliers
    suppliers = [
        Supplier(
            code="SUP-01",
            name="Apex Semiconductors Ltd",
            location="Bengaluru, Karnataka",
            component_type="Microcontroller MCU-X",
            capacity_daily=500.0,
            lead_time_days=2,
            unit_cost=450.0,
            reliability=0.95,
            is_critical=True,
            status="OPERATIONAL",
            latitude=12.9716,
            longitude=77.5946
        ),
        Supplier(
            code="SUP-02",
            name="Bharat Silicon Corp",
            location="Hyderabad, Telangana",
            component_type="Microcontroller MCU-X (Alternate)",
            capacity_daily=300.0,
            lead_time_days=4,
            unit_cost=550.0,
            reliability=0.88,
            is_critical=False,
            status="OPERATIONAL",
            latitude=17.3850,
            longitude=78.4867
        ),
        Supplier(
            code="SUP-03",
            name="Zenith PowerTech Ltd",
            location="Chennai, Tamil Nadu",
            component_type="Power Module PM-A & Enclosure",
            capacity_daily=800.0,
            lead_time_days=1,
            unit_cost=320.0,
            reliability=0.98,
            is_critical=False,
            status="OPERATIONAL",
            latitude=13.0827,
            longitude=80.2707
        )
    ]
    db.add_all(suppliers)
    db.commit()

    # 2. Manufacturing Facility
    facilities = [
        Facility(
            code="FAC-01",
            name="Pune Advanced Electronics MegaFactory",
            location="Pune, Maharashtra",
            capacity_daily=600.0,
            overtime_max_daily=200.0,
            holding_cost_per_unit_day=15.0,
            operating_cost_per_unit=80.0,
            status="OPERATIONAL",
            latitude=18.5204,
            longitude=73.8567
        )
    ]
    db.add_all(facilities)
    db.commit()

    # 3. Distribution Centers
    dcs = [
        DistributionCenter(
            code="DC-01",
            name="Mumbai North Distribution Hub",
            location="Bhiwandi, Mumbai, Maharashtra",
            capacity=5000.0,
            holding_cost_per_unit_day=10.0,
            status="OPERATIONAL",
            latitude=19.0760,
            longitude=72.8777
        ),
        DistributionCenter(
            code="DC-02",
            name="Bengaluru South Distribution Hub",
            location="Electronic City, Bengaluru, Karnataka",
            capacity=4000.0,
            holding_cost_per_unit_day=12.0,
            status="OPERATIONAL",
            latitude=12.8452,
            longitude=77.6602
        )
    ]
    db.add_all(dcs)
    db.commit()

    # 4. Products
    products = [
        Product(
            code="PRD-01",
            name="SmartSensor Industrial Hub",
            category="IoT Core",
            selling_price=2400.0,
            shortage_penalty_per_day=800.0,
            target_service_level=0.95,
            unit_weight_kg=0.8
        ),
        Product(
            code="PRD-02",
            name="Industrial IoT Gateway Pro",
            category="Enterprise Gateway",
            selling_price=4800.0,
            shortage_penalty_per_day=1500.0,
            target_service_level=0.98,
            unit_weight_kg=1.5
        ),
        Product(
            code="PRD-03",
            name="Telematics Fleet Tracker",
            category="Automotive IoT",
            selling_price=1900.0,
            shortage_penalty_per_day=600.0,
            target_service_level=0.90,
            unit_weight_kg=0.5
        ),
        Product(
            code="PRD-04",
            name="EcoPower Smart Monitor",
            category="Energy Analytics",
            selling_price=1500.0,
            shortage_penalty_per_day=400.0,
            target_service_level=0.92,
            unit_weight_kg=0.6
        )
    ]
    db.add_all(products)
    db.commit()

    # 5. Bill of Materials (BOM)
    # PRD-01 requires 1x MCU-X (SUP-01/02) and 1x PM-A (SUP-03)
    # PRD-02 requires 2x MCU-X (SUP-01/02) and 1x PM-A (SUP-03)
    # PRD-03 requires 1x MCU-X (SUP-01/02) and 1x PM-A (SUP-03)
    # PRD-04 requires 0x MCU-X and 2x PM-A (SUP-03) -> Unaffected by MCU outage!
    boms = [
        BillOfMaterials(product_id=1, component_name="Microcontroller MCU-X", required_quantity=1.0, supplier_id=1),
        BillOfMaterials(product_id=1, component_name="Power Module PM-A", required_quantity=1.0, supplier_id=3),
        BillOfMaterials(product_id=2, component_name="Microcontroller MCU-X", required_quantity=2.0, supplier_id=1),
        BillOfMaterials(product_id=2, component_name="Power Module PM-A", required_quantity=1.0, supplier_id=3),
        BillOfMaterials(product_id=3, component_name="Microcontroller MCU-X", required_quantity=1.0, supplier_id=1),
        BillOfMaterials(product_id=3, component_name="Power Module PM-A", required_quantity=1.0, supplier_id=3),
        BillOfMaterials(product_id=4, component_name="Power Module PM-A", required_quantity=2.0, supplier_id=3)
    ]
    db.add_all(boms)
    db.commit()

    # 6. Transportation Routes
    routes = [
        # Suppliers to Factory (Pune)
        TransportationRoute(
            source_type="SUPPLIER", source_id=1, target_type="FACILITY", target_id=1,
            distance_km=840.0, transit_time_days=2, standard_cost_per_unit=40.0,
            expedited_cost_per_unit=110.0, expedited_transit_days=1
        ),
        TransportationRoute(
            source_type="SUPPLIER", source_id=2, target_type="FACILITY", target_id=1,
            distance_km=560.0, transit_time_days=4, standard_cost_per_unit=55.0,
            expedited_cost_per_unit=130.0, expedited_transit_days=2
        ),
        TransportationRoute(
            source_type="SUPPLIER", source_id=3, target_type="FACILITY", target_id=1,
            distance_km=1180.0, transit_time_days=1, standard_cost_per_unit=35.0,
            expedited_cost_per_unit=95.0, expedited_transit_days=1
        ),
        # Factory to Distribution Centers
        TransportationRoute(
            source_type="FACILITY", source_id=1, target_type="DC", target_id=1,
            distance_km=150.0, transit_time_days=1, standard_cost_per_unit=25.0,
            expedited_cost_per_unit=70.0, expedited_transit_days=1
        ),
        TransportationRoute(
            source_type="FACILITY", source_id=1, target_type="DC", target_id=2,
            distance_km=840.0, transit_time_days=2, standard_cost_per_unit=35.0,
            expedited_cost_per_unit=90.0, expedited_transit_days=1
        )
    ]
    db.add_all(routes)
    db.commit()

    # 7. Baseline Demand for 7 Days (Units per day across products and DCs)
    # Realistic steady demand with weekend variations
    baseline_demands = []
    # Day-wise demand profiles
    # (day, prd_id, dc_id, qty)
    demand_matrix = [
        # Day 1
        (1, 1, 1, 90.0), (1, 1, 2, 70.0),
        (1, 2, 1, 50.0), (1, 2, 2, 40.0),
        (1, 3, 1, 60.0), (1, 3, 2, 50.0),
        (1, 4, 1, 80.0), (1, 4, 2, 60.0),
        # Day 2
        (2, 1, 1, 95.0), (2, 1, 2, 75.0),
        (2, 2, 1, 55.0), (2, 2, 2, 45.0),
        (2, 3, 1, 65.0), (2, 3, 2, 55.0),
        (2, 4, 1, 85.0), (2, 4, 2, 65.0),
        # Day 3
        (3, 1, 1, 100.0), (3, 1, 2, 80.0),
        (3, 2, 1, 60.0), (3, 2, 2, 50.0),
        (3, 3, 1, 70.0), (3, 3, 2, 60.0),
        (3, 4, 1, 90.0), (3, 4, 2, 70.0),
        # Day 4
        (4, 1, 1, 90.0), (4, 1, 2, 70.0),
        (4, 2, 1, 50.0), (4, 2, 2, 40.0),
        (4, 3, 1, 60.0), (4, 3, 2, 50.0),
        (4, 4, 1, 80.0), (4, 4, 2, 60.0),
        # Day 5
        (5, 1, 1, 110.0), (5, 1, 2, 90.0),
        (5, 2, 1, 65.0), (5, 2, 2, 55.0),
        (5, 3, 1, 75.0), (5, 3, 2, 65.0),
        (5, 4, 1, 95.0), (5, 4, 2, 75.0),
        # Day 6
        (6, 1, 1, 85.0), (6, 1, 2, 65.0),
        (6, 2, 1, 45.0), (6, 2, 2, 35.0),
        (6, 3, 1, 55.0), (6, 3, 2, 45.0),
        (6, 4, 1, 75.0), (6, 4, 2, 55.0),
        # Day 7
        (7, 1, 1, 80.0), (7, 1, 2, 60.0),
        (7, 2, 1, 40.0), (7, 2, 2, 30.0),
        (7, 3, 1, 50.0), (7, 3, 2, 40.0),
        (7, 4, 1, 70.0), (7, 4, 2, 50.0),
    ]
    for d, p, dc, q in demand_matrix:
        baseline_demands.append(BaselineDemand(day=d, product_id=p, dc_id=dc, quantity=q))
    db.add_all(baseline_demands)
    db.commit()

    # 8. Initial Inventory Records
    inventory_records = [
        # Factory component stock (on hand, safety stock, reorder point)
        InventoryRecord(echelon="FACILITY", entity_id=1, item_type="COMPONENT", item_id=1, on_hand_units=450.0, safety_stock_units=300.0, reorder_point_units=500.0), # MCU-X
        InventoryRecord(echelon="FACILITY", entity_id=1, item_type="COMPONENT", item_id=3, on_hand_units=900.0, safety_stock_units=400.0, reorder_point_units=700.0), # PM-A
        # Factory finished goods buffer
        InventoryRecord(echelon="FACILITY", entity_id=1, item_type="PRODUCT", item_id=1, on_hand_units=150.0, safety_stock_units=100.0, reorder_point_units=200.0),
        InventoryRecord(echelon="FACILITY", entity_id=1, item_type="PRODUCT", item_id=2, on_hand_units=80.0, safety_stock_units=60.0, reorder_point_units=120.0),
        InventoryRecord(echelon="FACILITY", entity_id=1, item_type="PRODUCT", item_id=3, on_hand_units=100.0, safety_stock_units=80.0, reorder_point_units=150.0),
        InventoryRecord(echelon="FACILITY", entity_id=1, item_type="PRODUCT", item_id=4, on_hand_units=120.0, safety_stock_units=90.0, reorder_point_units=160.0),
        # DC-01 Finished Goods (Mumbai)
        InventoryRecord(echelon="DC", entity_id=1, item_type="PRODUCT", item_id=1, on_hand_units=180.0, safety_stock_units=120.0, reorder_point_units=250.0),
        InventoryRecord(echelon="DC", entity_id=1, item_type="PRODUCT", item_id=2, on_hand_units=100.0, safety_stock_units=70.0, reorder_point_units=140.0),
        InventoryRecord(echelon="DC", entity_id=1, item_type="PRODUCT", item_id=3, on_hand_units=120.0, safety_stock_units=80.0, reorder_point_units=160.0),
        InventoryRecord(echelon="DC", entity_id=1, item_type="PRODUCT", item_id=4, on_hand_units=160.0, safety_stock_units=100.0, reorder_point_units=200.0),
        # DC-02 Finished Goods (Bengaluru)
        InventoryRecord(echelon="DC", entity_id=2, item_type="PRODUCT", item_id=1, on_hand_units=140.0, safety_stock_units=100.0, reorder_point_units=200.0),
        InventoryRecord(echelon="DC", entity_id=2, item_type="PRODUCT", item_id=2, on_hand_units=80.0, safety_stock_units=50.0, reorder_point_units=110.0),
        InventoryRecord(echelon="DC", entity_id=2, item_type="PRODUCT", item_id=3, on_hand_units=100.0, safety_stock_units=70.0, reorder_point_units=140.0),
        InventoryRecord(echelon="DC", entity_id=2, item_type="PRODUCT", item_id=4, on_hand_units=120.0, safety_stock_units=80.0, reorder_point_units=160.0),
    ]
    db.add_all(inventory_records)
    
    # Audit log
    db.add(AuditEvent(
        event_type="SYSTEM_INITIALIZATION",
        details_json='{"message": "Synthetic supply chain demonstration dataset initialized with 3 suppliers, 1 facility, 2 DCs, 4 products, 7 days demand."}',
        user_role="System"
    ))
    db.commit()

    return {"status": "seeded", "suppliers": len(suppliers), "products": len(products)}
