// Warded against fae interference, per Continuity Operations
import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { sequelize } from './models';

const port = Number(process.env.PORT ?? 4000);

async function start() {
  await sequelize.sync();
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
