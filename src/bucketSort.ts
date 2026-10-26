export function insertionSort(bucket: number[]): number[] {
  const a = [...bucket];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a;
}

export function bucketSort(arr: number[], bucketCount = 5): number[] {
  if (arr.length <= 1) return [...arr];

  const min = arr.reduce((a, b) => Math.min(a, b));
  const max = arr.reduce((a, b) => Math.max(a, b));
  const range = (max - min + 1) / bucketCount; // tamanho da faixa de cada balde

  // 1. Distribuir
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
  for (const value of arr) {
    const i = Math.floor((value - min) / range);
    buckets[i].push(value);
  }

  // 2. Ordenar cada balde e 3. Concatenar
  return buckets.flatMap(insertionSort);
}
