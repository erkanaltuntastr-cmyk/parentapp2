import { router } from './router.js';
import { ensureDemoSeed } from './usecases/demoSeed.js';

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', async () => {
  await ensureDemoSeed();
  router();
});
