import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  UserCheck
} from 'lucide-react';

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [actionStats, setActionStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        search,
        entity: entityFilter,
        action: actionFilter
      });
      setLogs(res.logs || []);
      setTotalLogs(res.totalLogs || 0);
      setActionStats(res.actionStats || []);
    } catch (err) {
      console.error('Error loading audit log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [search, entityFilter, actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'DELETE':
        return 'bg-red-50 text-red-800 border-red-300';
      case 'APPROVE':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'FLAG':
        return 'bg-orange-50 text-orange-800 border-orange-300';
      case 'LOGIN':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      case 'EXPORT':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
            <span>Immutable Regulatory Audit Trail (21 CFR Part 11 Standard)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographically sealed system transaction log recording all trial creations, modifications, ethics approvals, and safety reports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Total Logged Events: {totalLogs}
          </span>
        </div>
      </div>

      {/* Action Breakdown Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {actionStats.map(stat => (
          <div key={stat.action_type} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">{stat.action_type}</span>
            <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block">{stat.count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-2 items-center justify-between text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, details, entity ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="All">All Entities</option>
            <option value="TRIAL">Clinical Trial</option>
            <option value="ADVERSE_EVENT">Adverse Event</option>
            <option value="PROTOCOL_DEVIATION">Protocol Deviation</option>
            <option value="ETHICS">Ethics Review</option>
            <option value="USER">User Account</option>
            <option value="SYSTEM">System Event</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="All">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="FLAG">FLAG</option>
            <option value="EXPORT">EXPORT</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden text-xs">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-800 mb-2" />
            Querying immutable audit log...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Timestamp (UTC)</th>
                  <th className="py-3 px-3">User & Role</th>
                  <th className="py-3 px-3">Action Type</th>
                  <th className="py-3 px-3">Entity Affected</th>
                  <th className="py-3 px-3">Entity Identifier</th>
                  <th className="py-3 px-3">Transaction Details</th>
                  <th className="py-3 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">{log.user_name}</div>
                      <div className="text-[10px] text-slate-400">{log.user_role}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadge(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {log.entity_affected}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-emerald-800 dark:text-emerald-400 font-bold whitespace-nowrap">
                      {log.entity_id || 'N/A'}
                    </td>
                    <td className="py-3 px-3 max-w-md">
                      <p className="line-clamp-2">{log.details}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
