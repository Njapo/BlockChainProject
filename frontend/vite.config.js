import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The 5 MB proving key lives in public/circuit; raise the asset inline limit
// is unnecessary since it is served as a static file, not bundled.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail instead of silently picking another port. localStorage is keyed by
    // origin (host + port), so a stable port keeps saved events available.
    strictPort: true,
    host: true,
  },
});
