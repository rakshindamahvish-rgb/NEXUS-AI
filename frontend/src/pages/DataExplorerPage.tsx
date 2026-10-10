import React, { useState, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { api } from '../services/api';
import {
  Database,
  Download,
  Upload,
  Search,
  Filter,
  Layers,
  Building2,
  Package,
  Truck,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

export const DataExplorerPage: React.FC = () => {
  const { network } = useScenario();
  const [activeCategory, setActiveCategory] = useState<'SUPPLIERS' | 'PRODUCTS' | 'INVENTORY' | 'DEMAND' | 'ROUTES'>('SUPPLIERS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [provenance, setProvenance] = useState<any>(null);
  const [importStatus, setImportStatus] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    api.getDataProvenance().then(data => setProvenance(data)).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.importCsv('demand', file);
      setImportStatus(res);
    } catch (err: any) {
      setImportStatus({ status: 'error', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  if (!network) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm font-mono text-gray-400">Loading Data Explorer records...</p>
      </div>
    );
  }

  // Filtered rows based on search
  const filteredSuppliers = network.suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.component_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = network.products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventory = network.inventory.filter(i =>
    (i.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (i.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const filteredDemand = network.baseline_demand.filter(d =>
    (d.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (d.dc_code?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-600/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-nexus-cyan" />
            <span>Data Explorer & Provenance Records</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Structured records, bill of materials, demand matrices, and CSV import/export facilities.
          </p>
        </div>

        {/* Export / Import Buttons */}
        <div className="flex items-center space-x-3">
          <a
            href={api.exportCsvUrl(activeCategory.toLowerCase())}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-semibold text-nexus-cyan border border-dark-600/60 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-semibold text-nexus-violet border border-dark-600/60 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Demand CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Dataset Provenance Card */}
      {provenance && (
        <div className="p-4 rounded-xl bg-dark-850 border border-dark-600/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <Info className="w-4 h-4 text-nexus-cyan flex-shrink-0" />
            <div>
              <span className="font-bold text-white">{provenance.dataset_name}</span>
              <p className="text-[11px] text-gray-400 mt-0.5">{provenance.notice}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="text-gray-400">Currency: <strong className="text-white">INR (₹)</strong></span>
            <span className="text-gray-400">Horizon: <strong className="text-nexus-cyan">7 Days</strong></span>
          </div>
        </div>
      )}

      {/* CSV Import Feedback Banner */}
      {importStatus && (
        <div className={`p-4 rounded-xl border text-xs space-y-1 ${importStatus.status === 'success' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-red-950/30 border-red-500/40 text-red-200'}`}>
          <div className="flex items-center space-x-2 font-bold">
            {importStatus.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-nexus-emerald" /> : <AlertTriangle className="w-4 h-4 text-nexus-red" />}
            <span>{importStatus.status === 'success' ? 'CSV Import Succeeded' : 'CSV Import Error'}</span>
          </div>
          {importStatus.status === 'success' && (
            <p className="text-[11px] text-gray-300 ml-6">
              Processed {importStatus.total_rows} rows: <span className="text-nexus-emerald font-bold">{importStatus.accepted_rows} accepted</span>, <span className="text-nexus-rose font-bold">{importStatus.rejected_count} rejected</span>.
            </p>
          )}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-dark-800 p-1 rounded-lg border border-dark-600/60 text-xs overflow-x-auto">
          {(['SUPPLIERS', 'PRODUCTS', 'INVENTORY', 'DEMAND', 'ROUTES'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat ? 'bg-nexus-cyan text-black shadow-glow-cyan' : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-dark-800 border border-dark-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-nexus-cyan"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="p-6 rounded-xl bg-dark-850 border border-dark-600/50 shadow-xl overflow-x-auto">
        {activeCategory === 'SUPPLIERS' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Component Type</th>
                <th className="py-2.5 px-3">Daily Capacity</th>
                <th className="py-2.5 px-3">Lead Time</th>
                <th className="py-2.5 px-3">Unit Cost (₹)</th>
                <th className="py-2.5 px-3">Reliability</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/30">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-dark-800/40">
                  <td className="py-2.5 px-3 font-mono text-nexus-cyan font-semibold">{s.code}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{s.name}</td>
                  <td className="py-2.5 px-3 text-gray-300">{s.location}</td>
                  <td className="py-2.5 px-3 text-gray-200">{s.component_type}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{s.capacity_daily} u/d</td>
                  <td className="py-2.5 px-3 font-mono text-gray-300">{s.lead_time_days} days</td>
                  <td className="py-2.5 px-3 font-mono text-nexus-emerald font-bold">₹{s.unit_cost}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-gray-300">{(s.reliability * 100).toFixed(0)}%</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${s.is_critical ? 'bg-red-950/80 text-red-400 border border-red-500/40' : 'bg-dark-750 text-gray-300'}`}>
                      {s.is_critical ? 'CRITICAL DISRUPTED' : 'OPERATIONAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeCategory === 'PRODUCTS' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Selling Price (₹)</th>
                <th className="py-2.5 px-3">Shortage Penalty / Day (₹)</th>
                <th className="py-2.5 px-3">Target SLA</th>
                <th className="py-2.5 px-3">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/30">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-dark-800/40">
                  <td className="py-2.5 px-3 font-mono text-nexus-violet font-semibold">{p.code}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{p.name}</td>
                  <td className="py-2.5 px-3 text-gray-300">{p.category}</td>
                  <td className="py-2.5 px-3 font-mono text-nexus-cyan font-bold">₹{p.selling_price.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono text-nexus-rose font-bold">₹{p.shortage_penalty_per_day.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-nexus-emerald">{(p.target_service_level * 100).toFixed(0)}%</td>
                  <td className="py-2.5 px-3 font-mono text-gray-400">{p.unit_weight_kg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeCategory === 'INVENTORY' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                <th className="py-2.5 px-3">Echelon</th>
                <th className="py-2.5 px-3">Entity Name</th>
                <th className="py-2.5 px-3">Item / SKU</th>
                <th className="py-2.5 px-3">On-Hand Stock</th>
                <th className="py-2.5 px-3">Safety Stock Buffer</th>
                <th className="py-2.5 px-3">Reorder Point Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/30">
              {filteredInventory.map((i) => (
                <tr key={i.id} className="hover:bg-dark-800/40">
                  <td className="py-2.5 px-3 font-mono text-nexus-cyan text-[11px]">{i.echelon}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{i.entity_name}</td>
                  <td className="py-2.5 px-3 text-gray-300">{i.item_name}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{i.on_hand_units.toLocaleString()} units</td>
                  <td className="py-2.5 px-3 font-mono text-gray-400">{i.safety_stock_units} units</td>
                  <td className="py-2.5 px-3 font-mono text-gray-400">{i.reorder_point_units} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeCategory === 'DEMAND' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                <th className="py-2.5 px-3">Timeline Day</th>
                <th className="py-2.5 px-3">Product SKU</th>
                <th className="py-2.5 px-3">Target Distribution Hub</th>
                <th className="py-2.5 px-3">Daily Demand Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/30">
              {filteredDemand.map((d) => (
                <tr key={d.id} className="hover:bg-dark-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">Day {d.day}</td>
                  <td className="py-2.5 px-3 font-mono text-nexus-cyan font-semibold">{d.product_code}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{d.dc_code}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-nexus-emerald">{d.quantity.toFixed(0)} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeCategory === 'ROUTES' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-600/60 bg-dark-800/80 text-gray-300 font-mono">
                <th className="py-2.5 px-3">Lane Origin</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3">Standard Lead Time</th>
                <th className="py-2.5 px-3">Standard Freight (₹)</th>
                <th className="py-2.5 px-3">Expedited Lead Time</th>
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
                  <td className="py-2.5 px-3 font-mono text-nexus-emerald font-semibold">{r.expedited_transit_days} day</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-nexus-purple">₹{r.expedited_cost_per_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
