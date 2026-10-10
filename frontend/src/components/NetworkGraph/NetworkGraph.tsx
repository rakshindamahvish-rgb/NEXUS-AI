import React, { useState } from 'react';
import { NetworkOverview } from '../../types';
import { Layers, X, Building2, Factory, Truck } from 'lucide-react';

interface NetworkGraphProps {
  network: NetworkOverview | null;
  disruptedSupplierId?: number;
  onSelectNode?: (node: any) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ network, disruptedSupplierId = 1 }) => {
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'SUPPLIER' | 'FACILITY' | 'DC';
    data: any;
  } | null>(null);

  if (!network) {
    return (
      <div className="h-72 flex items-center justify-center border border-slate-800 rounded-xl bg-dark-900">
        <p className="text-xs font-mono text-slate-400">Loading supply network...</p>
      </div>
    );
  }

  const suppliers = network.suppliers;
  const facility = network.facilities[0];
  const dcs = network.distribution_centers;

  return (
    <div className="relative bg-dark-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Header / Legend */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-white text-xs">3-Echelon Network Model</span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-nexus-cyan" />
            <span>Operational</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Disrupted</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Alternate Supply</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Distribution Hub</span>
          </div>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div className="p-6 min-h-[420px] flex flex-col md:flex-row items-stretch justify-between gap-6 relative">
        
        {/* ECHELON 1: SUPPLIERS */}
        <div className="flex-1 flex flex-col justify-around space-y-3">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-1">
            Echelon 1: Sourcing Nodes
          </div>

          {suppliers.map((sup) => {
            const isDisrupted = sup.id === disruptedSupplierId;
            const isAlternate = sup.id === 2;
            return (
              <div
                key={sup.id}
                onClick={() => setSelectedEntity({ type: 'SUPPLIER', data: sup })}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isDisrupted
                    ? 'bg-red-950/20 border-red-500/40 text-red-200'
                    : isAlternate
                    ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400'
                    : 'bg-slate-850/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg ${isDisrupted ? 'bg-red-500/20 text-red-400' : isAlternate ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/10 text-nexus-cyan'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">{sup.code}</span>
                      <h4 className="text-xs font-semibold text-white truncate max-w-[130px] mt-0.5">{sup.name}</h4>
                    </div>
                  </div>
                  {isDisrupted && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                      Outage
                    </span>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Part:</span>
                    <span className="font-medium text-slate-300 truncate block">{sup.component_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cap:</span>
                    <span className="font-mono text-slate-200 font-medium">{sup.capacity_daily} u/d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ECHELON 2: MANUFACTURING FACILITY */}
        <div className="flex-1 flex flex-col justify-center space-y-3 max-w-xs">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-1">
            Echelon 2: Assembly Plant
          </div>

          {facility && (
            <div
              onClick={() => setSelectedEntity({ type: 'FACILITY', data: facility })}
              className="p-4 rounded-xl bg-slate-850/80 border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-purple-500/15 text-purple-300">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">{facility.code}</span>
                  <h4 className="text-xs font-semibold text-white mt-0.5">{facility.name}</h4>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-slate-200">{facility.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Cap:</span>
                  <span className="font-mono text-white font-medium">{facility.capacity_daily} u/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overtime Max:</span>
                  <span className="font-mono text-nexus-cyan font-medium">+{facility.overtime_max_daily} u/day</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ECHELON 3: DISTRIBUTION CENTERS */}
        <div className="flex-1 flex flex-col justify-around space-y-3">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-1">
            Echelon 3: Distribution Hubs
          </div>

          {dcs.map((dc) => (
            <div
              key={dc.id}
              onClick={() => setSelectedEntity({ type: 'DC', data: dc })}
              className="p-3.5 rounded-xl bg-slate-850/70 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">{dc.code}</span>
                  <h4 className="text-xs font-semibold text-white truncate max-w-[130px] mt-0.5">{dc.name}</h4>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Location:</span>
                  <span className="font-medium text-slate-300 truncate block">{dc.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Capacity:</span>
                  <span className="font-mono text-slate-200 font-medium">{dc.capacity.toLocaleString()} u</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Node Details Slide-Over Drawer */}
      {selectedEntity && (
        <div className="absolute top-0 right-0 w-80 h-full bg-dark-900 border-l border-slate-800 p-5 z-20 overflow-y-auto shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-semibold uppercase text-nexus-cyan">{selectedEntity.type} Details</span>
            <button
              onClick={() => setSelectedEntity(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">{selectedEntity.data.code}</span>
              <h3 className="text-sm font-semibold text-white mt-1">{selectedEntity.data.name}</h3>
              <p className="text-slate-400 text-xs">{selectedEntity.data.location}</p>
            </div>

            {selectedEntity.type === 'SUPPLIER' && (
              <div className="space-y-2.5 bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Component:</span>
                  <span className="font-medium text-white">{selectedEntity.data.component_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Capacity:</span>
                  <span className="font-mono text-white">{selectedEntity.data.capacity_daily} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lead Time:</span>
                  <span className="font-mono text-white">{selectedEntity.data.lead_time_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Cost:</span>
                  <span className="font-mono text-nexus-cyan font-semibold">₹{selectedEntity.data.unit_cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reliability:</span>
                  <span className="font-mono text-nexus-emerald font-medium">{(selectedEntity.data.reliability * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}

            {selectedEntity.type === 'FACILITY' && (
              <div className="space-y-2.5 bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Capacity:</span>
                  <span className="font-mono text-white">{selectedEntity.data.capacity_daily} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overtime Limit:</span>
                  <span className="font-mono text-nexus-cyan">+{selectedEntity.data.overtime_max_daily} units/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Overtime Cost:</span>
                  <span className="font-mono text-white">₹{selectedEntity.data.overtime_cost_per_unit}/unit</span>
                </div>
              </div>
            )}

            {selectedEntity.type === 'DC' && (
              <div className="space-y-2.5 bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Capacity:</span>
                  <span className="font-mono text-white">{selectedEntity.data.capacity.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Holding Cost:</span>
                  <span className="font-mono text-white">₹{selectedEntity.data.holding_cost_per_unit_day}/unit/day</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
