if (typeof process !== 'undefined' && typeof (process as any).exit === 'function') {
  const originalExit = (process as any).exit.bind(process);
  (process as any).exit = ((code?: any) => {
    const finalCode = typeof code === 'number' ? code : 0;
    return originalExit(finalCode);
  }) as any;
}