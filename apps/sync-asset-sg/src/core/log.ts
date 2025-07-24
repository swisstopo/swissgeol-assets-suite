export function log(log: string, level: 'main' | 'batch' = 'main') {
  console.log(`[${new Date().toISOString()}] ${level === 'batch' ? '=> ' : ''}${log}`);
}
