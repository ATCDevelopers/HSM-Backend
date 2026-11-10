import { statusService } from "../services/status.service.js";

// Idempotent: run with `npm run seed:statuses`; statuses that already exist are skipped.
const inserted = await statusService.seedDefaultStatuses();
console.log(`Statuses seeded: ${inserted.length} new.`);
process.exit(0);
