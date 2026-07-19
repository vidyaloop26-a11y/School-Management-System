// ₹ formatter — Indian lakhs notation above 1,00,000; comma format below.
export function formatINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 100000) {
    const lakhs = n / 100000;
    // one decimal, drop trailing zero
    const str = (Math.round(lakhs * 10) / 10).toFixed(1).replace(/\.0$/, "");
    return `₹${str}L`;
  }
  // comma group Indian style
  const parts = Math.round(n).toString().split("");
  const rev = parts.reverse();
  const out = [];
  for (let i = 0; i < rev.length; i++) {
    if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) out.push(",");
    out.push(rev[i]);
  }
  return `₹${out.reverse().join("")}`;
}
