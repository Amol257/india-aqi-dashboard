const fs = require('fs');
const path = './src/components/views/Stations.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace Active Sites
content = content.replace('{TOTAL_STATIONS} Active Sites', '{activeCount} Active Sites');

// 2. Replace Status UI
const oldStatus = `        <div className="flex items-center gap-4 w-full md:w-auto px-4 md:border-r border-[#c1c6d5]/30">
          <span className="text-[10px] font-black text-[#717785] uppercase tracking-widest leading-none">Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            <span className="text-sm font-black text-[#181c22]">Live (412)</span>
          </div>
        </div>`;

const newStatus = `        <div className="flex items-center gap-4 w-full md:w-auto px-4 md:border-r border-[#c1c6d5]/30">
          <span className="text-[10px] font-black text-[#717785] uppercase tracking-widest leading-none">Status</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-black text-[#181c22] focus:ring-0 cursor-pointer min-w-[120px]"
          >
            <option value="All">All ({totalSites})</option>
            <option value="ACTIVE">Live ({activeCount})</option>
            <option value="SERVICE">Service ({serviceCount})</option>
            <option value="OFFLINE">Offline ({offlineCount})</option>
          </select>
        </div>`;
content = content.replace(oldStatus, newStatus);
// Try CRLF replacement as well if LF fails
content = content.replace(oldStatus.replace(/\n/g, '\r\n'), newStatus);

// 3. Replace System Health
const oldHealth = `              {[
                { l: 'Optimal', v: '410', c: 'text-emerald-500' },
                { l: 'Service', v: '45', c: 'text-amber-500' },
                { l: 'Offline', v: '14', c: 'text-red-500' },
              ].map(i => (`;
              
const newHealth = `              {[
                { l: 'Optimal', v: activeCount, c: 'text-emerald-500' },
                { l: 'Service', v: serviceCount, c: 'text-amber-500' },
                { l: 'Offline', v: offlineCount, c: 'text-red-500' },
              ].map(i => (`;

content = content.replace(oldHealth, newHealth);
content = content.replace(oldHealth.replace(/\n/g, '\r\n'), newHealth);

fs.writeFileSync(path, content, 'utf8');
