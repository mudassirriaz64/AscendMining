const prefetched = new Set();

export const prefetchComponent = (importFn) => {
  const key = importFn.toString();
  if (prefetched.has(key)) return;
  prefetched.add(key);
  importFn().catch(() => {});
};
