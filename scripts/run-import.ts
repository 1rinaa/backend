// scripts/run-import.ts
// Este script solo funciona si tienes un entorno de ejecución con D1
// Para importar datos, necesitas ejecutar el Worker

console.log('⚠️ Para importar datos, necesitas ejecutar el Worker con wrangler');
console.log('📝 Sigue estos pasos:');
console.log('1. Inicia el Worker: wrangler dev');
console.log('2. Haz una petición POST a /api/import-data');
console.log('   curl -X POST http://localhost:8787/api/import-data');