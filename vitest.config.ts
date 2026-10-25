/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Vitest avec la configuration Vite d'Astro, comme le recommande la documentation (guide « Testing ») : les tests
// importent les modules du site tels que le build les voit (D51).
export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
