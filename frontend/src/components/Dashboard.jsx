import { DollarSign, Package, Activity, AlertCircle, Wrench } from 'lucide-react';

import { formatCurrency, calculateCurrentValue } from '../utils';
import { AssetValueChart, AssetCountChart, StatusDistributionChart } from './Charts';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className={`p-3 rounded-lg ${color}`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
            </div>
            <div className="p-2 bg-white/50 rounded-lg">
                <Icon size={24} className="text-gray-700" />
            </div>
        </div>
        {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
    </div>
);

const Dashboard = ({ assets }) => {
    const totalAssets = assets.length;
    const activeAssets = assets.filter(a => a.status === 'In Use').length;
    const maintenanceAssets = assets.filter(a => a.status === 'Maintenance').length;
    const totalValue = assets.reduce((sum, asset) => sum + calculateCurrentValue(asset), 0);

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Assets"
                    value={totalAssets}
                    icon={Package}
                    color="bg-blue-50"
                    subtext="Total registered assets"
                />
                <StatCard
                    title="Total Value"
                    value={formatCurrency(totalValue)}
                    icon={DollarSign}
                    color="bg-green-50"
                    subtext="Combined asset value"
                />
                <StatCard
                    title="Active Assets"
                    value={activeAssets}
                    icon={Activity}
                    color="bg-purple-50"
                    subtext={`${activeAssets} currently active`}
                />
                <StatCard
                    title="Maintenance"
                    value={maintenanceAssets}
                    icon={Wrench}
                    color="bg-orange-50"
                    subtext="Assets requiring attention"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Total Value Over Time</h3>
                    <AssetValueChart assets={assets} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Asset Growth</h3>
                    <AssetCountChart assets={assets} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Status Distribution</h3>
                    <StatusDistributionChart assets={assets} />
                </div>
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Recent Assets</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Value</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {assets.slice(0, 5).map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{asset.name}</div>
                                            <div className="text-xs text-gray-500">{asset.serial_number}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.status === 'In Use' ? 'bg-green-100 text-green-700' :
                                                asset.status === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                                                    asset.status === 'Retired' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{formatCurrency(calculateCurrentValue(asset))}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{asset.assigned_to || '-'}</td>
                                    </tr>
                                ))}
                                {assets.slice(0, 5).length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No recent assets found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
