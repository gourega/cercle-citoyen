
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // On mappe les noms exacts de votre capture d'écran Cloudflare vers le code
    'process.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env['Url Supabase'] || 
      process.env.VITE_SUPABASE_URL || 
      ''
    ),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env['Clé public Supabase'] || 
      process.env.VITE_SUPABASE_ANON_KEY || 
      ''
    ),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  }
});
