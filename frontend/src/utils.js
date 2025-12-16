export const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export const calculateCurrentValue = (asset) => {
    if (!asset.purchase_price) return 0;
    const price = parseFloat(asset.purchase_price);
    if (!asset.depreciation_monthly) return price;

    // User Request: Only depreciate if asset is IN USE (has date_of_use)
    // If date_of_use is empty, it means asset is new/storage -> No Depreciation.
    const startDateStr = asset.date_of_use;

    if (!startDateStr) return price;

    const startDate = new Date(startDateStr);
    const now = new Date();

    let months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    if (now.getDate() < startDate.getDate()) months--;
    if (months < 0) months = 0;

    const currentValue = price - (parseFloat(asset.depreciation_monthly) * months);
    return currentValue > 0 ? currentValue : 0;
};
