import { Express } from 'express';
import { DataSource } from 'typeorm';

async function initializeWithRetry(dataSource: DataSource, serviceName: string): Promise<void> {
  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await dataSource.initialize();
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.warn(
        `${serviceName}: database is not ready (${attempt}/${maxAttempts}), retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export async function startService(
  app: Express,
  dataSource: DataSource,
  port: number,
  serviceName: string,
): Promise<void> {
  await initializeWithRetry(dataSource, serviceName);
  app.listen(port, '0.0.0.0', () => {
    console.log(`${serviceName} is running on http://localhost:${port}`);
  });
}
