// scripts/import-data.ts
import { parse } from 'csv-parse/sync';

interface Fabricante {
    id: number;
    nombre: string;
    pais: string;
    anio_fundacion: number;
    sitio_web: string;
    logo: string;
}

interface Categoria {
    id: number;
    tipo_motor: string;
    traccion: string;
    aceleracion_0_100: number;
    velocidad_maxima: number;
}

interface Auto {
    id: number;
    modelo: string;
    marca: string;
    anio: number;
    potencia: number;
    imagen: string;
    fabricante_id: number;
    categoria_id: number;
}

// Función para detectar el delimitador
function detectDelimiter(csv: string): string {
    const firstLine = csv.split('\n')[0];
    if (firstLine.includes(';')) return ';';
    if (firstLine.includes('\t')) return '\t';
    return ',';
}

// Función para limpiar valores
function cleanValue(value: any): any {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return null;
        return trimmed;
    }
    return value;
}

async function importData(env: any) {
    try {
        console.log('📥 Iniciando importación de datos desde R2...');
        
        // Leer archivos CSV desde R2
        console.log('📂 Leyendo fabricantes.csv desde R2...');
        const fabricantesObj = await env.DATOS_BUCKET.get('fabricantes.csv');
        console.log('📂 Leyendo categorias.csv desde R2...');
        const categoriasObj = await env.DATOS_BUCKET.get('categorias.csv');
        console.log('📂 Leyendo autos.csv desde R2...');
        const autosObj = await env.DATOS_BUCKET.get('autos.csv');
        
        if (!fabricantesObj || !categoriasObj || !autosObj) {
            throw new Error('No se encontraron los archivos CSV en R2');
        }
        
        const fabricantesCSV = await fabricantesObj.text();
        const categoriasCSV = await categoriasObj.text();
        const autosCSV = await autosObj.text();
        
        // Detectar delimitadores
        const fabDelim = detectDelimiter(fabricantesCSV);
        const catDelim = detectDelimiter(categoriasCSV);
        const autoDelim = detectDelimiter(autosCSV);
        
        console.log(`📊 Delimitadores detectados: fabricantes='${fabDelim}', categorias='${catDelim}', autos='${autoDelim}'`);
        
        // Parsear CSVs
        const fabricantes = parse(fabricantesCSV, { 
            columns: true, 
            skip_empty_lines: true,
            delimiter: fabDelim
        }) as Fabricante[];
        
        const categorias = parse(categoriasCSV, { 
            columns: true, 
            skip_empty_lines: true,
            delimiter: catDelim
        }) as Categoria[];
        
        const autos = parse(autosCSV, { 
            columns: true, 
            skip_empty_lines: true,
            delimiter: autoDelim
        }) as Auto[];
        
        console.log(`📊 Datos encontrados: ${fabricantes.length} fabricantes, ${categorias.length} categorías, ${autos.length} autos`);
        
        // Mostrar primeros registros
        if (fabricantes.length > 0) {
            console.log('📝 Ejemplo fabricante:', JSON.stringify(fabricantes[0]));
        }
        if (categorias.length > 0) {
            console.log('📝 Ejemplo categoría:', JSON.stringify(categorias[0]));
        }
        if (autos.length > 0) {
            console.log('📝 Ejemplo auto:', JSON.stringify(autos[0]));
        }
        
        // Insertar fabricantes CON el campo id
        console.log('📥 Insertando fabricantes...');
        for (const f of fabricantes) {
            const id = cleanValue(f.id) || 0;
            const nombre = cleanValue(f.nombre) || 'Sin nombre';
            const pais = cleanValue(f.pais) || 'Sin país';
            const anio_fundacion = cleanValue(f.anio_fundacion) || 0;
            const sitio_web = cleanValue(f.sitio_web) || '';
            const logo = cleanValue(f.logo) || '';
            
            await env.bd_autos.prepare(
                'INSERT INTO fabricantes (id, nombre, pais, anio_fundacion, sitio_web, logo) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(id, nombre, pais, anio_fundacion, sitio_web, logo).run();
        }
        
        // Insertar categorías CON el campo id
        console.log('📥 Insertando categorías...');
        for (const c of categorias) {
            const id = cleanValue(c.id) || 0;
            const tipo_motor = cleanValue(c.tipo_motor) || 'Sin especificar';
            const traccion = cleanValue(c.traccion) || 'Sin especificar';
            const aceleracion_0_100 = cleanValue(c.aceleracion_0_100) || 0;
            const velocidad_maxima = cleanValue(c.velocidad_maxima) || 0;
            
            await env.bd_autos.prepare(
                'INSERT INTO categorias (id, tipo_motor, traccion, aceleracion_0_100, velocidad_maxima) VALUES (?, ?, ?, ?, ?)'
            ).bind(id, tipo_motor, traccion, aceleracion_0_100, velocidad_maxima).run();
        }
        
        // Insertar autos CON el campo id
        console.log('📥 Insertando autos...');
        for (const a of autos) {
            const id = cleanValue(a.id) || 0;
            const modelo = cleanValue(a.modelo) || 'Sin modelo';
            const marca = cleanValue(a.marca) || 'Sin marca';
            const anio = cleanValue(a.anio) || 0;
            const potencia = cleanValue(a.potencia) || 0;
            const imagen = cleanValue(a.imagen) || '';
            const fabricante_id = cleanValue(a.fabricante_id) || 1;
            const categoria_id = cleanValue(a.categoria_id) || 1;
            
            await env.bd_autos.prepare(
                'INSERT INTO autos (id, modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(id, modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id).run();
        }
        
        console.log('✅ ¡Datos importados correctamente!');
        
        // Verificar cuántos registros se insertaron
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