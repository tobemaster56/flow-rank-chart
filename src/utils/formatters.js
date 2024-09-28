export function formatMoney(money) {
  return money.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' });
}
