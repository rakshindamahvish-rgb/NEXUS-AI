import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { NetworkGraph } from '../components/NetworkGraph/NetworkGraph';
import { Layers, Network, Building2, Factory, Truck, Package, Route as RouteIcon, ShieldAlert } from 'lucide-react';

export const NetworkPage: React.FC = () => {
  const { network, simulationResult } = useScenario();
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'BOM' | 'ROUTES' | 'INVENTORY'>('GRAPH');

  if (!network) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm font-mono text-gray-400">Loading supply network...</p>
      </div>
    );
  }

  const disruptedId = simulationResult?.active_disruption?.disrupted_supplier_id || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Network className="w-5 h-5 text-nexus-cyan" />
            <span>3-Echelon Supply Network Architecture</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Precision electronics manufacturing network connecting Tier-1 component suppliers, Pune assembly plant, and regional distribution centers.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-dark-800 p-1 rounded-lg border border-dark-600/60 text-xs">
          <button
            onClick={() => setActiveTab('GRAPH')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'GRAPH'
                ? 'bg-nexus-cyan text-black shadow-glow-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Interactive Topology
          </button>
          <button
            onClick={() => setActiveTab('BOM')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'BOM'
                ? 'bg-nexus-cyan text-black shadow-glow-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Bill of Materials (BOM)
          </button>
          <button
            onClick={() => setActiveTab('ROUTES')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'ROUTES'
                ? 'bg-nexus-cyan text-black shadow-glow-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Freight Routes
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'INVENTORY'
                ? 'bg-nexus-cyan text-black shadow-glow-cyan'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Base Inventory
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE GRAPH */}
      {activeTab === 'GRAPH' && (
        <div className="space-y-6">
          <NetworkGraph network={network} disruptedSupplierId={disruptedId} />

          {/* Echelon Detail Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl bg-dark-850 border border-dark-600/50">
              <div className="flex items-center space-x-2 text-nexus-cyan mb-2">
                <Building2 className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Echelon 1: Component Sourcing</h4>
              </div>
              <p className="text-xs text-gray-300">
                3 active suppliers. Microcontroller MCU-X is sourced primarily from Apex Semiconductors (SUP-01), with secondary qualified backup at Bharat Silicon Corp (SUP-02).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark-850 border border-dark-600/50">
              <div className="flex items-center space-x-2 text-nexus-violet mb-2">
                <Factory className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Echelon 2: Pune MegaFactory</h4>
              </div>
              <p className="text-xs text-gray-300">
                600 units/day base assembly throughput + 200 units/day max overtime. Performs surface-mount assembly, testing, and box build packaging for all 4 product lines.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-dark-850 border border-dark-600/50">
              <div className="flex items-center space-x-2 text-nexus-blue mb-2">
                <Truck className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Echelon 3: Regional Hubs</h4>
              </div>
              <p className="text-xs text-gray-300">
                DC-01 (Mumbai North) and DC-02 (Bengaluru South) service western and southern consumer clusters with 1-2 day freight lanes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BILL OF MATERIALS (BOM) */}
      {activeTab === 'BOM' && (
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Bill of Materials (BOM) Component Mapping</h3>
            <p className="text-xs text-gray-400">
              Component requirements per finished good. Note that PRD-04 does not consume MCU-X, demonstrating multi-product resilience during microcontroller crises.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-600/60 bg-dark-800/60 text-gray-300 font-mono">
                  <th className="py-2.5 px-3">Product Code</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Required Component</th>
                  <th className="py-2.5 px-3">Quantity per Unit</th>
                  <th className="py-2.5 px-3">Primary Supplier</th>
                  <th className="py-2.5 px-3">Disruption Vulnerability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {network.bom.map((b) => {
                  const isVulnerable = b.component_name.includes('MCU-X');
                  return (
                    <tr key={b.id} className="hover:bg-dark-800/40">
                      <td className="py-2.5 px-3 font-mono text-gray-300">PRD-0{b.product_id}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{b.product_name}</td>
                      <td className="py-2.5 px-3 font-mono text-nexus-cyan">{b.component_name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{b.required_quantity}x</td>
                      <td className="py-2.5 px-3 text-gray-300">{b.supplier_name || 'Apex Semiconductors'}</td>
                      <td className="py-2.5 px-3">
                        {isVulnerable ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/40 font-semibold flex items-center space-x-1 w-fit">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Vulnerable to MCU Outage</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-semibold w-fit block">
                            Immune (100% Operational)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FREIGHT ROUTES */}
      {activeTab === 'ROUTES' && (
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Multi-Modal Logistics & Freight Lanes</h3>
            <p className="text-xs text-gray-400">
              Standard ground freight vs. expedited air cargo options with transit times and unit surcharges.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-600/60 bg-dark-800/60 text-gray-300 font-mono">
                  <th className="py-2.5 px-3">Lane Origin</th>
                  <th className="py-2.5 px-3">Destination</th>
                  <th className="py-2.5 px-3">Distance</th>
                  <th className="py-2.5 px-3">Standard Transit</th>
                  <th className="py-2.5 px-3">Standard Freight (₹)</th>
                  <th className="py-2.5 px-3">Expedited Transit</th>
                  <th className="py-2.5 px-3">Expedited Freight (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {network.routes.map((r) => (
                  <tr key={r.id} className="hover:bg-dark-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{r.source_name}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{r.target_name}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400">{r.distance_km} km</td>
                    <td className="py-2.5 px-3 font-mono text-gray-300">{r.transit_time_days} days</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-nexus-cyan">₹{r.standard_cost_per_unit}</td>
                    <td className="py-2.5 px-3 font-mono text-nexus-emerald font-semibold">{r.expedited_transit_days} day(s)</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-nexus-purple">₹{r.expedited_cost_per_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BASE INVENTORY */}
      {activeTab === 'INVENTORY' && (
        <div className="p-5 rounded-xl bg-dark-850 border border-dark-600/50 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Baseline On-Hand Inventory Records</h3>
            <p className="text-xs text-gray-400">
              Starting component buffer and finished goods safety stock across all tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-600/60 bg-dark-800/60 text-gray-300 font-mono">
                  <th className="py-2.5 px-3">Echelon Tier</th>
                  <th className="py-2.5 px-3">Facility Name</th>
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3">On-Hand Stock</th>
                  <th className="py-2.5 px-3">Safety Stock Buffer</th>
                  <th className="py-2.5 px-3">Reorder Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600/30">
                {network.inventory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-dark-800/40">
                    <td className="py-2.5 px-3 font-mono text-nexus-cyan text-[11px]">{inv.echelon}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{inv.entity_name}</td>
                    <td className="py-2.5 px-3 text-gray-300">{inv.item_name}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{inv.on_hand_units.toLocaleString()} units</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400">{inv.safety_stock_units} units</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400">{inv.reorder_point_units} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
