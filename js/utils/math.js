export function maxBy(arr, fn) {
  if (!arr?.length) return null;
  let best = arr[0];
  for (const item of arr) {
    if (fn(item) > fn(best)) best = item;
  }
  return best;
}
