// scripts/import-data.ts
// ✅ SIN csv-parse - usa split manual para evitar Buffer
async function importData(env: any) {
    try {
        console.log('📥 Iniciando importación de datos desde R2...');
        
        // Leer archivos CSV desde R2
        console.log('📂 Leyendo fabricantes.csv desde R2...');
        const fabricantesObj = await env.DATOS_BUCKET.get('fabricantes.csv');
        const categoriasObj = await env.DATOS_BUCKET.get('categorias.csv');
        const autosObj = await env.DATOS_BUCKET.get('autos.csv');
        
        if (!fabricantesObj || !categoriasObj || !autosObj) {
            throw new Error('No se encontraron los archivos CSV en R2');
        }
        
        const fabricantesCSV = await fabricantesObj.text();
        const categoriasCSV = await categoriasObj.text();
        const autosCSV = await autosObj.text();
        
        // Función para parsear CSV manualmente
        function parseCSV(csv: string, delimiter: string = ';') {
            const lines = csv.trim().split('\n');
            const headers = lines[0].split(delimiter);
            const result = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(delimiter);
                const obj: any = {};
                headers.forEach((header, index) => {
                    obj[header.trim()] = values[index]?.trim() || '';
                });
                result.push(obj);
            }
            return result;
        }
        
        const fabricantes = parseCSV(fabricantesCSV);
        const categorias = parseCSV(categoriasCSV);
        const autos = parseCSV(autosCSV);
        
        console.log(`📊 Datos encontrados: ${fabricantes.length} fabricantes, ${categorias.length} categorías, ${autos.length} autos`);
        
        // Insertar fabricantes
        console.log('📥 Insertando fabricantes...');
        for (const f of fabricantes) {
            await env.bd_autos.prepare(
                'INSERT INTO fabricantes (id, nombre, pais, anio_fundacion, sitio_web, logo) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(
                parseInt(f.id) || 0,
                f.nombre || 'Sin nombre',
                f.pais || 'Sin país',
                parseInt(f.anio_fundacion) || 0,
                f.sitio_web || '',
                f.logo || ''
            ).run();
        }
        
        // Insertar categorías
        console.log('📥 Insertando categorías...');
        for (const c of categorias) {
            await env.bd_autos.prepare(
                'INSERT INTO categorias (id, tipo_motor, traccion, aceleracion_0_100, velocidad_maxima) VALUES (?, ?, ?, ?, ?)'
            ).bind(
                parseInt(c.id) || 0,
                c.tipo_motor || 'Sin especificar',
                c.traccion || 'Sin especificar',
                parseFloat(c.aceleracion_0_100) || 0,
                parseInt(c.velocidad_maxima) || 0
            ).run();
        }
        
        // Insertar autos
        console.log('📥 Insertando autos...');
        for (const a of autos) {
            await env.bd_autos.prepare(
                'INSERT INTO autos (id, modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
                parseInt(a.id) || 0,
                a.modelo || 'Sin modelo',
                a.marca || 'Sin marca',
                parseInt(a.anio) || 0,
                parseInt(a.potencia) || 0,
                a.imagen || '',
                parseInt(a.fabricante_id) || 1,
                parseInt(a.categoria_id) || 1
            ).run();
        }
        
        console.log('✅ ¡Datos importados correctamente!');
        
        // Verificar
        const fabricantesCount = await env.bd_autos.prepare('SELECT COUNT(*) as count FROM fabricantes').first();
        const categoriasCount = await env.bd_autos.prepare('SELECT COUNT(*) as count FROM categorias').first();
        const autosCount = await env.bd_autos.prepare('SELECT COUNT(*) as count FROM autos').first();
        
        console.log(`📊 Resumen: ${fabricantesCount.count} fabricantes, ${categoriasCount.count} categorías, ${autosCount.count} autos`);
        
    } catch (error) {
        console.error('❌ Error importando datos:', error);
        throw error;
    }
}

export { importData };