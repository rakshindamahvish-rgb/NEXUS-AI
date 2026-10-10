# NEXUS — AI Supply Chain Future Simulation & Resilience Engine

> **"Don't just react to a supply-chain crisis. Simulate its consequences before making the decision."**

![NEXUS Control Tower](https://img.shields.io/badge/Architecture-3--Echelon%20Multi--Agent%20Control%20Tower-06B6D4?style=for-the-badge)
![Optimization](https://img.shields.io/badge/Solver-SciPy%20HiGHS%20Exact%20LP-8B5CF6?style=for-the-badge)
![Currency](https://img.shields.io/badge/Currency-INR%20%28%E2%82%B9%29-10B981?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Complete%20Production%20Prototype-F59E0B?style=for-the-badge)

---

## 1. Executive Summary & Core Concept

When a critical supplier suddenly suffers an unplanned shutdown, traditional ERP and supply-chain systems typically output a single static heuristic recommendation without evaluating or comparing multi-echelon consequences across production, transport, holding costs, and customer service levels.

**NEXUS** is an enterprise-grade AI simulation and resilience engine designed for supply-chain planners. It transforms crisis response from reactive guesswork into an interactive, multi-agent future-state simulation engine. Planners can stress-test demand surges, inspect candidate recovery plans, evaluate mathematical optimization baselines, resolve multi-agent trade-offs, and legally sign off on decisions with a persistent audit trail.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 CRITICAL SUPPLIER SHUTDOWN             │
                  │             Apex Semiconductors (SUP-01) — 7 Days      │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │            8-AGENT AUTONOMOUS DOMAIN SWARM             │
                  │  Demand • Inventory • Sourcing • Freight • Production  │
                  │    Cost/Service • Risk/Resilience • Swarm Coordinator  │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │                 NEXUS FUTURE LAB ENGINE                │
                  │    Simulates 7-Day Discrete Timelines Across 4 Plans   │
                  │     Cost-First • Service-First • Balanced • Consensus  │
                  │        SciPy HiGHS LP Solver • Reorder-Rule Baseline    │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │            HUMAN PLANNER GOVERNANCE LEDGER             │
                  │    Revalidation Guardrails • Approval • SQLite Audit   │
                  └────────────────────────────────────────────────────────┘
```

---

## 2. Realistic 3-Echelon Supply Network Specification

All baseline data is grounded in a reproducible, synthetic electronics manufacturing supply chain operating in **Indian Rupees (INR — ₹)**:

### Echelon 1: Component Sourcing Nodes
1. **Apex Semiconductors Ltd (`SUP-01`)** — *Bengaluru, Karnataka*
   - Component: Microcontroller `MCU-X` (Primary, Single-Source)
   - Capacity: `500 units/day` | Lead Time: `2 days` | Unit Cost: `₹450` | Reliability: `95%` | **Critical Disrupted Node**
2. **Bharat Silicon Corp (`SUP-02`)** — *Hyderabad, Telangana*
   - Component: Microcontroller `MCU-X` (Alternate Qualified Supplier)
   - Capacity: `300 units/day` | Lead Time: `4 days (Standard)` / `2 days (Air Expedited)` | Unit Cost: `₹550` | Reliability: `88%`
3. **Zenith PowerTech Ltd (`SUP-03`)** — *Chennai, Tamil Nadu*
   - Component: Power Module `PM-A` & Enclosures
   - Capacity: `800 units/day` | Lead Time: `1 day` | Unit Cost: `₹320` | Reliability: `98%`

### Echelon 2: Manufacturing Facility
- **Pune Advanced Electronics MegaFactory (`FAC-01`)** — *Pune, Maharashtra*
  - Base Assembly Capacity: `600 units/day` | Max Overtime Capacity: `+200 units/day`
  - Base Assembly Operating Cost: `₹80/unit` | Overtime Rate: `₹120/unit`
  - Holding Cost: `₹15/unit/day`

### Echelon 3: Regional Distribution Hubs
- **Mumbai North Distribution Hub (`DC-01`)** — *Bhiwandi, Mumbai* (Capacity: 5,000 units, Transit: 1 day, Std Freight: ₹25/unit, Exp: ₹70/unit)
- **Bengaluru South Distribution Hub (`DC-02`)** — *Electronic City, Bengaluru* (Capacity: 4,000 units, Transit: 2 days, Std Freight: ₹35/unit, Exp: ₹90/unit)

### Finished Products & BOM Mapping
- **`PRD-01` — SmartSensor Industrial Hub**: Price ₹2,400 | Shortage Penalty: ₹800/unit/day | Target SLA: 95% | BOM: 1x MCU-X, 1x PM-A
- **`PRD-02` — Industrial IoT Gateway Pro**: Price ₹4,800 | Shortage Penalty: ₹1,500/unit/day | Target SLA: 98% | BOM: 2x MCU-X, 1x PM-A
- **`PRD-03` — Telematics Fleet Tracker**: Price ₹1,900 | Shortage Penalty: ₹600/unit/day | Target SLA: 90% | BOM: 1x MCU-X, 1x PM-A
- **`PRD-04` — EcoPower Smart Monitor**: Price ₹1,500 | Shortage Penalty: ₹400/unit/day | Target SLA: 92% | BOM: 0x MCU-X, 2x PM-A *(**Immune Line** — continues operating during microcontroller crises!)*

---

## 3. The 8 Specialized Autonomous Agents

NEXUS deploys 8 dedicated domain agents that evaluate data, identify constraints, and synthesize balanced directives:

| Agent | Domain Responsibility | Primary Output & Constraint Enforced |
|---|---|---|
| **1. Demand Intelligence** | Forecast volatility & peak draw analysis | Evaluates demand multipliers (1.0x - 2.0x), regional DC split |
| **2. Inventory Agent** | Stock depletion & run-rate modeling | Identifies factory buffer exhaustion at Day 3 without intervention |
| **3. Supplier Risk Agent** | Single-source vulnerability & alternate sourcing | Activates SUP-02 (Bharat Silicon) up to 300 u/d capacity ceiling |
| **4. Logistics Agent** | Freight lane optimization & expediting | Evaluates 2-day air expediting (₹130/u) vs 4-day ground (₹55/u) |
| **5. Production Agent** | Assembly scheduling & overtime dispatch | Prioritizes high-margin PRD-02, manages +200 u/d overtime line |
| **6. Cost & Service Agent** | Landed cost accounting & penalty trade-offs | Validates ROI: air freight (₹75 surcharge) vs lost-sale penalty (₹1,500) |
| **7. Risk & Resilience** | Concentration buffers & fragility auditing | Caps SUP-02 allocation at 75-80% to avoid secondary supplier shock |
| **8. Coordinator Agent** | Multi-agent conflict resolution & consensus | Synthesizes consensus plan and selects optimal recommendation |

---

## 4. Distinctive Feature: The Future Lab

The **Future Lab** is the core differentiator of NEXUS. For any crisis scenario, it simulates the consequences of candidate recovery plans across a 7-day discrete timeline:

1. **Cost-First Strategy**: Minimizes cash expenditure via standard ground freight and zero overtime, accepting selective stockouts.
2. **Service-First Strategy**: Prioritizes 100% customer fill rate at all costs via continuous air charters and maximum factory overtime.
3. **Balanced Compromise**: Optimal trade-off allocating air freight on Days 1–3 to bridge critical inventory valleys, followed by standard transit.
4. **Coordinated Agent Consensus**: Multi-agent consensus enforcing supplier concentration risk ceilings and product prioritization.
5. **Exact SciPy LP Solver**: Theoretical mathematical cost-minimization benchmark using HiGHS Interior-Point linear programming.
6. **Reorder-Rule Baseline**: Static $(s, S)$ periodic review policy that fails to anticipate disruption lead times.

### Dynamic Counterfactual Explanations
- **"Why This Plan?"**: Explains binding bottlenecks, supplier throughput limits, and cost-to-service optimality.
- **"Why Not The Alternatives?"**: Computes exact mathematical differentials (e.g., *"+₹240,000 in excess air charter cost with diminishing returns"* or *"-14.2% fill rate causing ₹680,000 in customer penalty fees"*).

---

## 5. Technology Stack & Architecture

- **Backend**:
  - Python 3.12, FastAPI, Pydantic v2
  - NumPy, Pandas, SciPy (`scipy.optimize.linprog` HiGHS)
  - SQLite, SQLAlchemy 2.0
  - Pytest test suite
- **Frontend**:
  - React 18, TypeScript, Vite
  - Tailwind CSS (Dark Control Tower Theme)
  - Recharts for time-series and comparative visualizations
  - Lucide React icons
  - React Router v6

---

## 6. Installation & Quick Start

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ & npm

### One-Click Launch (Windows PowerShell)
```powershell
.\start.ps1
```

### Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r backend/requirements.txt

# Run backend test suite
$env:PYTHONPATH="backend"
pytest backend/tests -v

# Start FastAPI server
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```
Backend API will be live at `http://localhost:8000` (Swagger docs: `http://localhost:8000/docs`).

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 7. Complete End-to-End Demonstration Walkthrough

Follow these steps to demonstrate all capabilities:

1. **Step 1 — Command Center Overview**: Open `http://localhost:5173`. View the active disruption banner, executive KPI cards (Demand at Risk, Fill Rate, Backorders), 7-day fulfillment trend chart, and mini topology preview.
2. **Step 2 — Supply Network Topology**: Click **Supply Network** in sidebar. Explore interactive nodes, Echelon 1-3 cards, Bill of Materials (BOM) matrix, and freight routes. Click on **Apex Semiconductors** to inspect its single-source vulnerability.
3. **Step 3 — Crisis Simulator**: Navigate to **Crisis Simulator**. Verify default 7-day outage of SUP-01. Click **SIMULATE SUPPLIER SHUTDOWN** to trigger live backend execution.
4. **Step 4 — Agent Operations**: Navigate to **Agent Operations**. Inspect real structured outputs from all 8 agents (Demand, Inventory, Supplier Risk, Logistics, Production, Cost/Service, Risk/Resilience, and Coordinator).
5. **Step 5 — Future Lab**: Navigate to **Future Lab**. Compare Cost-First, Service-First, Balanced, and Coordinated plans. Select a plan to inspect its 7-day day-by-day balance sheet and charts.
6. **Step 6 — Counterfactual Explanations**: Review the generated *"Why This Plan?"* and *"Why Not The Alternatives?"* sections.
7. **Step 7 — What-If Stress Testing**: Click **+20% Demand Surge** in Future Lab toolbar. Observe instantaneous recalculation of metrics, new binding capacity constraints, and updated recommendations.
8. **Step 8 — Benchmarks**: Navigate to **Performance & Benchmarks**. Compare Reorder-Rule Baseline vs SciPy HiGHS LP Solver vs Agent-Coordinated Planning on identical data.
9. **Step 9 — Action Modification & Safety Guardrails**: Navigate to **Recovery Plans**. Click **Modify Actions**, adjust procurement quantities, and click **Revalidate Constraints** to test physical bounds.
10. **Step 10 — Planner Governance Approval**: Click **Approve Plan**, enter planner sign-off notes, and confirm.
11. **Step 11 — Decision History**: Navigate to **Decision History**. Verify the decision is permanently recorded in SQLite.
12. **Step 12 — Persistence Check**: Refresh the page / restart server; verify historical decisions remain stored.
13. **Step 13 — Data Explorer**: Navigate to **Data Explorer**. Search records, export CSV, or import custom demand CSV.

---

## 8. License & Attribution

Built for the **Agentic AI Hackathon**.
Demonstration Environment — Synthetic Supply Chain Dataset.
Currency Standard: Indian Rupee (INR — ₹).
#   N E X U S - A I  
 