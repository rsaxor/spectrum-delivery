export const formatCurrency = (amount: number | string) => {
  if (!amount && amount !== 0) return "0";
  
  const value = Number(amount);
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2, // Always show .00 (Change to 0 if you don't want decimals)
    maximumFractionDigits: 2,
  }).format(value);
};