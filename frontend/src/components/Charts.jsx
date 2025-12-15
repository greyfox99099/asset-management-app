import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, calculateCurrentValue } from '../utils';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

// Process assets into monthly time series data
const processTimeSeriesData = (assets) => {
    if (!assets.length) return [];

    // Get all unique months from purchase dates
    const monthsMap = new Map();

    assets.forEach(asset => {
        const dateStr = asset.purchase_date || asset.date_of_use;
        if (!dateStr) return;

        const date = new Date(dateStr);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthsMap.has(monthKey)) {
            monthsMap.set(monthKey, {
                month: monthKey,
                count: 0,
                totalValue: 0,
                assets: []
            });
        }

        const monthData = monthsMap.get(monthKey);
        monthData.count += 1;
        monthData.assets.push(asset);
    });

    // Sort by month and calculate cumulative values
    const sortedMonths = Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    let cumulativeCount = 0;
    const result = sortedMonths.map(monthData => {
        cumulativeCount += monthData.count;

        // Calculate total current value for all assets up to this month
        const allAssetsUpToMonth = sortedMonths
            .filter(m => m.month <= monthData.month)
            .flatMap(m => m.assets);

        const totalCurrentValue = allAssetsUpToMonth.reduce((sum, asset) => {
            return sum + calculateCurrentValue(asset);
        }, 0);

        return {
            month: monthData.month,
            count: cumulativeCount,
            value: totalCurrentValue,
            newAssets: monthData.count
        };
    });

    return result;
};

// Process status distribution
const processStatusData = (assets) => {
    const statusMap = new Map();

    assets.forEach(asset => {
        const status = asset.status || 'Unknown';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    return Array.from(statusMap.entries()).map(([name, value]) => ({
        name,
        value
    }));
};

export const AssetValueChart = ({ assets }) => {
    const data = processTimeSeriesData(assets);

    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value).replace('Rp', '').trim()}
                />
                <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    name="Total Value"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export const AssetCountChart = ({ assets }) => {
    const data = processTimeSeriesData(assets);

    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Total Assets"
                />
                <Line
                    type="monotone"
                    dataKey="newAssets"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    name="New Assets"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export const StatusDistributionChart = ({ assets }) => {
    const data = processStatusData(assets);

    if (!data.length) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    );
};
