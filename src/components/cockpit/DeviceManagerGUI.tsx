// jb7572_2026-08-27: Comprehensive Device Manager & Driver Authority GUI
import React, { useState, useEffect } from 'react';
import { 
  HardwareDevice, 
  HardwareCategory, 
  DriverOption 
} from '../../types';
import { hardwareLogsService } from '../../services/hardwareLogsService';
import { 
  Cpu, 
  Layers, 
  HardDrive, 
  Wifi, 
  Volume2, 
  Radio, 
  Sliders, 
  Search, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings2, 
  ChevronRight, 
  Info, 
  Zap, 
  ShieldCheck, 
  ArrowRightLeft, 
  Database, 
  Check, 
  X, 
  SlidersHorizontal,
  FileCode,
  Box,
  ExternalLink,
  Power
} from 'lucide-react';

interface DeviceManagerGUIProps {
  onRunCliCommand?: (cmd: string) => void;
}

export const DeviceManagerGUI: React.FC<DeviceManagerGUIProps> = ({ onRunCliCommand }) => {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>('dev_gpu');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Modal State for Driver Switching
  const [driverModalDevice, setDriverModalDevice] = useState<HardwareDevice | null>(null);
  const [selectedDriverOption, setSelectedDriverOption] = useState<DriverOption | null>(null);
  const [isApplyingDriver, setIsApplyingDriver] = useState(false);
  const [driverChangeSuccess, setDriverChangeSuccess] = useState<string | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const refreshDevices = () => {
    const list = hardwareLogsService.getHardwareDevices();
    setDevices(list);
    if (!selectedDeviceId && list.length > 0) {
      setSelectedDeviceId(list[0].id);
    }
  };

  useEffect(() => {
    refreshDevices();
  }, []);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0] || null;

  const handleToggleDeviceStatus = (devId: string) => {
    const res = hardwareLogsService.toggleDeviceStatus(devId);
    refreshDevices();
    showNotification(res.message, res.success ? 'success' : 'error');
  };

  const handleOpenDriverModal = (dev: HardwareDevice) => {
    setDriverModalDevice(dev);
    // Find the currently active driver option or the recommended one
    const currentOpt = dev.availableDrivers?.find(d => d.driverName === dev.driver) || dev.availableDrivers?.[0] || null;
    setSelectedDriverOption(currentOpt);
    setDriverChangeSuccess(null);
    setIsApplyingDriver(false);
  };

  const handleApplyDriverChange = () => {
    if (!driverModalDevice || !selectedDriverOption) return;

    setIsApplyingDriver(true);
    setTimeout(() => {
      const res = hardwareLogsService.switchDeviceDriver(driverModalDevice.id, selectedDriverOption.driverName);
      setIsApplyingDriver(false);
      if (res.success) {
        setDriverChangeSuccess(`Driver successfully rebound to "${selectedDriverOption.driverName}"`);
        refreshDevices();
        showNotification(res.message, 'success');
        setTimeout(() => {
          setDriverModalDevice(null);
          setDriverChangeSuccess(null);
        }, 1200);
      } else {
        showNotification(res.message, 'error');
      }
    }, 700);
  };

  // Filtered devices
  const filteredDevices = devices.filter(dev => {
    const matchesCategory = categoryFilter === 'ALL' || dev.category === categoryFilter;
    const matchesSearch = 
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.busAddress.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: HardwareCategory, className = "w-4 h-4") => {
    switch (cat) {
      case 'CPU': return <Cpu className={`${className} text-emerald-400`} />;
      case 'GPU': return <Layers className={`${className} text-purple-400`} />;
      case 'STORAGE_NVME': return <HardDrive className={`${className} text-amber-400`} />;
      case 'NETWORK_NIC': return <Wifi className={`${className} text-cyan-400`} />;
      case 'AUDIO': return <Volume2 className={`${className} text-indigo-400`} />;
      case 'USB_CONTROLLER': return <Radio className={`${className} text-blue-400`} />;
      case 'MEMORY': return <Sliders className={`${className} text-teal-400`} />;
      default: return <Box className={`${className} text-gray-400`} />;
    }
  };

  const getProviderBadge = (provider?: string) => {
    switch (provider) {
      case 'Microkernel Native':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Native Ring 0/3</span>;
      case 'Driver VMM (Linux)':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-700/60"><Box className="w-3 h-3 text-purple-400" /> Linux VMM Compat</span>;
      case 'Vendor Proprietary':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60"><Zap className="w-3 h-3 text-amber-400" /> Vendor Direct</span>;
      case 'VFIO Passthrough':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-700/60"><ExternalLink className="w-3 h-3 text-blue-400" /> VFIO IOMMU</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-900 text-gray-300 border border-gray-700">Generic Fallback</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#ececf1]">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200' 
            : notification.type === 'error'
            ? 'bg-red-950/90 border-red-600 text-red-200'
            : 'bg-blue-950/90 border-blue-600 text-blue-200'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Top Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#111114] p-3.5 rounded-xl border border-[#222]">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
            <input
              id="input_device_search"
              type="text"
              placeholder="Search hardware, vendor, model, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#18181c] border border-[#2e2e36] rounded-lg text-xs text-white placeholder-[#666] focus:outline-none focus:border-purple-500 font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#777] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#666] font-mono mr-1">Filter:</span>
            {[
              { id: 'ALL', label: `All (${devices.length})` },
              { id: 'CPU', label: 'CPU' },
              { id: 'GPU', label: 'GPU' },
              { id: 'STORAGE_NVME', label: 'Storage' },
              { id: 'NETWORK_NIC', label: 'Network' },
              { id: 'USB_CONTROLLER', label: 'USB' },
              { id: 'AUDIO', label: 'Audio' },
              { id: 'MEMORY', label: 'Memory' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-purple-950 text-purple-200 border border-purple-600/70 shadow-sm font-semibold'
                    : 'bg-[#18181e] text-[#888] hover:text-[#ccc] border border-[#282830]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRunCliCommand && (
            <>
              <button
                id="btn_cli_lspci"
                onClick={() => onRunCliCommand('lspci -v')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-700/60 text-xs font-mono transition-colors"
                title="Run lspci -v in integrated terminal"
              >
                <Terminal className="w-3 h-3" />
                <span>lspci -v</span>
              </button>
              <button
                id="btn_cli_lsusb"
                onClick={() => onRunCliCommand('lsusb -v')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181820] hover:bg-[#22222c] text-[#aaa] hover:text-white border border-[#333] text-xs font-mono transition-colors"
                title="Run lsusb -v in integrated terminal"
              >
                <Terminal className="w-3 h-3" />
                <span>lsusb</span>
              </button>
            </>
          )}

          <button
            id="btn_rescan_pci_bus"
            onClick={() => {
              refreshDevices();
              showNotification('PCI & USB Bus rescanned. Hardware enumeration up to date.', 'success');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#24242c] text-[#ccc] border border-[#333] text-xs transition-colors"
            title="Rescan PCIe/USB bus"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Rescan Bus</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Device Manager Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Device Hierarchy & List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs text-[#888] font-mono">
            <span>Discovered Hardware Devices ({filteredDevices.length})</span>
            <span className="text-[11px] text-[#666]">Select to inspect specs</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredDevices.length === 0 ? (
              <div className="bg-[#111114] border border-[#222] rounded-xl p-8 text-center text-[#777] text-xs">
                No hardware devices match your filter query.
              </div>
            ) : (
              filteredDevices.map(dev => {
                const isSelected = selectedDeviceId === dev.id;
                return (
                  <div
                    key={dev.id}
                    id={`device_card_${dev.id}`}
                    onClick={() => setSelectedDeviceId(dev.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-950/40 via-[#181622] to-[#14121c] border-purple-500/70 shadow-lg shadow-purple-950/20'
                        : dev.status === 'DISABLED'
                        ? 'bg-[#0f0f12] border-gray-800/60 opacity-60 hover:opacity-90'
                        : 'bg-[#111114] border-[#222] hover:bg-[#16161b] hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg border ${
                        isSelected 
                          ? 'bg-purple-950 border-purple-700/80 text-purple-300' 
                          : 'bg-[#18181e] border-[#26262e]'
                      }`}>
                        {getCategoryIcon(dev.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-purple-200' : 'text-white'}`}>
                            {dev.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#777] font-mono truncate">{dev.vendor}</p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-[#1a1a22] text-cyan-300 border border-[#2a2a36]">
                            {dev.busAddress}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#1c1a24] text-purple-300 border border-purple-900/50 truncate max-w-[130px]" title={dev.driver}>
                            drv: {dev.driver}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        dev.status === 'OK'
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                          : 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                      }`}>
                        {dev.status}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-purple-400 translate-x-0.5' : 'text-[#444]'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Device Specification & Driver Control Authority (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedDevice ? (
            <div className="bg-[#111114] border border-[#24242c] rounded-xl p-5 shadow-2xl space-y-5">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222]">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-700/50">
                    {getCategoryIcon(selectedDevice.category, "w-6 h-6")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {selectedDevice.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[#888] font-mono mt-0.5">
                      {selectedDevice.deviceModel}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[11px] text-[#aaa] bg-[#1a1a22] px-2 py-0.5 rounded border border-[#2a2a36] font-mono">
                        Vendor ID: <strong className="text-cyan-300">{selectedDevice.vendorId || '0x8086'}</strong>
                      </span>
                      <span className="text-[11px] text-[#aaa] bg-[#1a1a22] px-2 py-0.5 rounded border border-[#2a2a36] font-mono">
                        Device ID: <strong className="text-cyan-300">{selectedDevice.deviceId || '0x0000'}</strong>
                      </span>
                      <span className="text-[11px] text-[#aaa] bg-[#1a1a22] px-2 py-0.5 rounded border border-[#2a2a36] font-mono">
                        Bus: <strong className="text-purple-300">{selectedDevice.busAddress}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Toggle Device Status */}
                {selectedDevice.category !== 'CPU' && selectedDevice.category !== 'MEMORY' && (
                  <button
                    id={`btn_action_toggle_${selectedDevice.id}`}
                    onClick={() => handleToggleDeviceStatus(selectedDevice.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      selectedDevice.status === 'OK'
                        ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-950/70 border border-rose-800/60'
                        : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/70 border border-emerald-800/60'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{selectedDevice.status === 'OK' ? 'Disable Device' : 'Enable Device'}</span>
                  </button>
                )}
              </div>

              {/* ACTIVE DRIVER AUTHORITY CARD */}
              <div className="bg-gradient-to-br from-[#161420] to-[#121218] border border-purple-600/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Active Device Driver & Binding
                    </span>
                  </div>
                  {getProviderBadge(selectedDevice.driverProvider)}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-[#0c0c10] p-3 rounded-lg border border-[#24242e]">
                  <div>
                    <span className="text-[#666] block text-[10px]">Loaded Kernel Driver:</span>
                    <span className="text-emerald-300 font-bold text-xs">{selectedDevice.driver}</span>
                  </div>
                  <div>
                    <span className="text-[#666] block text-[10px]">Driver Version:</span>
                    <span className="text-purple-300 text-xs">{selectedDevice.driverVersion || '1.0.0-rt'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#666] block text-[10px]">Source / Binary Hook:</span>
                    <span className="text-[#aaa] text-[11px] truncate block">{selectedDevice.driverLoadedAt || '/drivers/microkernel_core.bin'}</span>
                  </div>
                </div>

                {/* Change Driver Trigger Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-[#888]">
                    {selectedDevice.availableDrivers && selectedDevice.availableDrivers.length > 1 ? (
                      <span><strong>{selectedDevice.availableDrivers.length}</strong> alternate compatible drivers available in repository</span>
                    ) : (
                      <span>Default system kernel driver is bound</span>
                    )}
                  </div>

                  {selectedDevice.availableDrivers && selectedDevice.availableDrivers.length > 1 && (
                    <button
                      id={`btn_change_driver_${selectedDevice.id}`}
                      onClick={() => handleOpenDriverModal(selectedDevice)}
                      className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-950/40 border border-purple-400/30 transition-all hover:scale-[1.02]"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Change Driver</span>
                    </button>
                  )}
                </div>
              </div>

              {/* HARDWARE SPECIFICATIONS MATRIX */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#888] font-mono">
                  <span className="flex items-center gap-1.5 text-white font-semibold">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    Hardware Architecture & Bus Specifications
                  </span>
                  <span className="text-[11px] text-[#666]">Read from ACPI / PCI Config Space</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-[#15151a] p-2.5 rounded-lg border border-[#222]">
                    <span className="text-[#666] text-[10px] block">IRQ Vector / Line:</span>
                    <span className="text-purple-300 font-semibold">{selectedDevice.irq}</span>
                  </div>
                  <div className="bg-[#15151a] p-2.5 rounded-lg border border-[#222]">
                    <span className="text-[#666] text-[10px] block">Power Management State:</span>
                    <span className="text-amber-300 font-semibold">{selectedDevice.powerState}</span>
                  </div>
                  <div className="bg-[#15151a] p-2.5 rounded-lg border border-[#222]">
                    <span className="text-[#666] text-[10px] block">Firmware / Microcode:</span>
                    <span className="text-emerald-300 text-[11px] truncate block">{selectedDevice.firmwareVersion || 'UEFI V1.20'}</span>
                  </div>
                  <div className="bg-[#15151a] p-2.5 rounded-lg border border-[#222]">
                    <span className="text-[#666] text-[10px] block">Bus Link Speed & Bandwidth:</span>
                    <span className="text-cyan-300 text-[11px] truncate block">{selectedDevice.linkSpeed || 'PCIe Gen 3.0 x4'}</span>
                  </div>
                  <div className="bg-[#15151a] p-2.5 rounded-lg border border-[#222] md:col-span-2">
                    <span className="text-[#666] text-[10px] block">MMIO Base Address Registers (BARs) / Memory Window:</span>
                    <span className="text-[#bbb] text-[11px] break-all">{selectedDevice.memoryRange}</span>
                  </div>
                </div>

                {/* Additional Detailed Specs (Key-Value) */}
                {selectedDevice.specs && (
                  <div className="bg-[#141418] border border-[#222] rounded-lg p-3 space-y-2 mt-3">
                    <span className="text-[11px] font-mono text-[#888] uppercase tracking-wider block">
                      Component Parameters:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                      {Object.entries(selectedDevice.specs).map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#1f1f26] pb-1">
                          <span className="text-[#777] text-[11px]">{key}:</span>
                          <span className="text-[#ddd] text-[11px] text-right font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hardware Capabilities Badges */}
                {selectedDevice.capabilities && selectedDevice.capabilities.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-mono text-[#777] uppercase tracking-wider">
                      Hardware Features & Offloads:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedDevice.capabilities.map((cap, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#1a1a24] text-cyan-200 border border-cyan-800/40 text-[10px] font-mono"
                        >
                          ✓ {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#111114] border border-[#222] rounded-xl p-12 text-center text-[#666]">
              Select a hardware device from the left panel to inspect specifications and driver settings.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRIVER SWITCHING MODAL DIALOG                                             */}
      {/* ========================================================================= */}
      {driverModalDevice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            id="driver_selection_modal"
            className="bg-[#121216] border border-[#333] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleUp text-[#ececf1] space-y-4 p-5 font-sans"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-950 border border-purple-700 text-purple-300">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Change Hardware Driver</h3>
                  <p className="text-xs text-[#888] font-mono">
                    {driverModalDevice.name} ({driverModalDevice.busAddress})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDriverModalDevice(null)}
                className="p-1 rounded-lg text-[#888] hover:text-white hover:bg-[#222]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Architecture Context Banner */}
            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-mono text-[11px]">
                <strong>Microkernel Driver Isolation:</strong> Drivers run in sandboxed user-space servers or within the isolated Linux Driver VMM container. Switching drivers hot-rebinds the hardware MMIO and DMA channels without requiring an OS reboot.
              </p>
            </div>

            {/* Driver Options List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              <span className="text-xs font-mono text-[#888]">Select Target Driver:</span>
              
              {driverModalDevice.availableDrivers?.map(opt => {
                const isSelected = selectedDriverOption?.driverName === opt.driverName;
                const isCurrentlyActive = driverModalDevice.driver === opt.driverName;

                return (
                  <div
                    key={opt.driverName}
                    id={`driver_option_${opt.driverName}`}
                    onClick={() => setSelectedDriverOption(opt)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500 shadow-md shadow-purple-950/30'
                        : 'bg-[#16161c] border-[#262630] hover:bg-[#1c1c24]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="driver_choice"
                          checked={isSelected}
                          onChange={() => setSelectedDriverOption(opt)}
                          className="accent-purple-500"
                        />
                        <span className="text-xs font-bold text-white font-mono">{opt.driverName}</span>
                        {opt.isRecommended && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
                            Recommended
                          </span>
                        )}
                        {isCurrentlyActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                            Currently Active
                          </span>
                        )}
                      </div>
                      {getProviderBadge(opt.provider)}
                    </div>

                    <p className="text-xs text-[#aaa] pl-5">{opt.description}</p>
                    
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#777] pl-5">
                      <span>Version: <strong className="text-[#bbb]">{opt.version}</strong></span>
                      <span>•</span>
                      <span>Source: <strong className="text-[#bbb]">{opt.source}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Success Message Feedback */}
            {driverChangeSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{driverChangeSuccess}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
              <button
                onClick={() => setDriverModalDevice(null)}
                disabled={isApplyingDriver}
                className="px-4 py-2 rounded-lg bg-[#1a1a20] hover:bg-[#262630] text-[#ccc] text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn_confirm_switch_driver"
                onClick={handleApplyDriverChange}
                disabled={isApplyingDriver || !selectedDriverOption || selectedDriverOption.driverName === driverModalDevice.driver}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium shadow-md shadow-purple-950/50 transition-all font-mono"
              >
                {isApplyingDriver ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rebinding Driver...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Driver Change</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
