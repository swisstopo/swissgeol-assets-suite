export function log(log: string, level: 'main' | 'batch' = 'batch') {
  console.log(`[${new Date().toISOString()}] ${level === 'batch' ? '=> ' : ''}${log}`);
}
