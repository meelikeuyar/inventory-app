import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * Metrics authentication: either METRICS_TOKEN header or admin JWT.
 * Prometheus can use the token; browser users need admin login.
 */
function metricsAuth(req: Request, res: Response, next: NextFunction): void {
  const metricsToken = process.env.METRICS_TOKEN;
  const headerToken = req.headers['x-metrics-token'] as string | undefined;

  if (metricsToken && headerToken === metricsToken) {
    return next();
  }

  // Fallback to admin JWT auth
  authenticate(req as AuthRequest, res, (err?: unknown) => {
    if (err) return next(err);
    authorize('admin')(req as AuthRequest, res, next);
  });
}

/**
 * Lightweight Prometheus-compatible metrics endpoint.
 * Protected by metrics token or admin JWT.
 */
router.get('/metrics', metricsAuth, async (_req: Request, res: Response) => {
  try {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const uptime = process.uptime();
    const dbState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting

    const lines = [
      '# HELP process_uptime_seconds Process uptime in seconds',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${uptime.toFixed(2)}`,
      '',
      '# HELP process_memory_rss_bytes Resident set size in bytes',
      '# TYPE process_memory_rss_bytes gauge',
      `process_memory_rss_bytes ${mem.rss}`,
      '',
      '# HELP process_memory_heap_used_bytes Heap used in bytes',
      '# TYPE process_memory_heap_used_bytes gauge',
      `process_memory_heap_used_bytes ${mem.heapUsed}`,
      '',
      '# HELP process_memory_heap_total_bytes Heap total in bytes',
      '# TYPE process_memory_heap_total_bytes gauge',
      `process_memory_heap_total_bytes ${mem.heapTotal}`,
      '',
      '# HELP process_memory_external_bytes External memory in bytes',
      '# TYPE process_memory_external_bytes gauge',
      `process_memory_external_bytes ${mem.external}`,
      '',
      '# HELP process_cpu_user_microseconds CPU user time in microseconds',
      '# TYPE process_cpu_user_microseconds gauge',
      `process_cpu_user_microseconds ${cpu.user}`,
      '',
      '# HELP process_cpu_system_microseconds CPU system time in microseconds',
      '# TYPE process_cpu_system_microseconds gauge',
      `process_cpu_system_microseconds ${cpu.system}`,
      '',
      '# HELP mongodb_connection_state MongoDB connection state (1=connected)',
      '# TYPE mongodb_connection_state gauge',
      `mongodb_connection_state ${dbState}`,
      '',
      '# HELP nodejs_version_info Node.js version',
      '# TYPE nodejs_version_info gauge',
      `nodejs_version_info{version="${process.version}"} 1`,
      '',
    ];

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(lines.join('\n'));
  } catch {
    res.status(500).send('# Error collecting metrics\n');
  }
});

export default router;
