// src/index.ts
//import { importData } from '../scripts/import-data.js';

export interface Env {
    bd_autos: D1Database;
}

// Definir interfaces para los datos
interface AutoInput {
    modelo: string;
    marca: string;
    anio: number;
    potencia: number;
    imagen: string;
    fabricante_id: number;
    categoria_id: number;
}

interface FabricanteInput {
    nombre: string;
    pais: string;
    anio_fundacion: number;
    sitio_web: string;
    logo: string;
}

interface CategoriaInput {
    tipo_motor: string;
    traccion: string;
    aceleracion_0_100: number;
    velocidad_maxima: number;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // Configurar CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Manejar preflight requests
        if (method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Endpoint para importar datos
        /*if (path === '/api/import-data' && method === 'POST') {
            try {
                console.log('🚀 Iniciando importación de datos...');
                await importData(env);
                return new Response(JSON.stringify({
                    message: '✅ Datos importados correctamente'
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            } catch (error: any) {
                console.error('❌ Error importando datos:', error);
                return new Response(JSON.stringify({
                    error: '❌ Error importando datos: ' + error.message
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }*/

        // Resto de tus endpoints
        try {
            if (path.startsWith('/api/autos')) {
                return await handleAutos(request, env, path, method, corsHeaders);
            } else if (path.startsWith('/api/fabricantes')) {
                return await handleFabricantes(request, env, path, method, corsHeaders);
            } else if (path.startsWith('/api/categorias')) {
                return await handleCategorias(request, env, path, method, corsHeaders);
            }

            return new Response(
                JSON.stringify({
                    message: '🏎️ API Catálogo de Autos Superdeportivos',
                    endpoints: {
                        autos: '/api/autos',
                        fabricantes: '/api/fabricantes',
                        categorias: '/api/categorias',
                        importar_datos: '/api/import-data (POST)'
                    }
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                }
            );
        } catch (error) {
            console.error(error);
            return new Response(
                JSON.stringify({ error: 'Error interno del servidor' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                }
            );
        }
    },
};

// Manejador para Autos
async function handleAutos(request: Request, env: Env, path: string, method: string, corsHeaders: any) {
    const id = path.split('/')[3];

    // GET /api/autos - Listar todos los autos
    if (method === 'GET' && !id) {
        const query = `
            SELECT a.*, f.nombre as fabricante_nombre, f.pais, 
                   c.tipo_motor, c.traccion, c.aceleracion_0_100, c.velocidad_maxima
            FROM autos a
            JOIN fabricantes f ON a.fabricante_id = f.id
            JOIN categorias c ON a.categoria_id = c.id
            ORDER BY a.id
        `;
        console.log('📝 Query:', query);
        const { results } = await env.bd_autos.prepare(query).all();
        console.log('📊 Resultados:', results.length);

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // GET /api/autos/:id - Obtener auto específico
    if (method === 'GET' && id) {
        const query = `
            SELECT a.*, f.nombre as fabricante_nombre, f.pais, f.sitio_web,
                   c.tipo_motor, c.traccion, c.aceleracion_0_100, c.velocidad_maxima
            FROM autos a
            JOIN fabricantes f ON a.fabricante_id = f.id
            JOIN categorias c ON a.categoria_id = c.id
            WHERE a.id = ?
        `;
        const auto = await env.bd_autos.prepare(query).bind(id).first();

        if (!auto) {
            return new Response(JSON.stringify({ error: 'Auto no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify(auto), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // POST /api/autos - Crear auto
    if (method === 'POST') {
        const body = await request.json() as AutoInput;
        const { modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id } = body;

        const result = await env.bd_autos.prepare(`
            INSERT INTO autos (modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id).run();

        return new Response(JSON.stringify({
            message: 'Auto creado exitosamente',
            id: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // PUT /api/autos/:id - Actualizar auto
    if (method === 'PUT' && id) {
        const body = await request.json() as AutoInput;
        const { modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id } = body;

        await env.bd_autos.prepare(`
            UPDATE autos 
            SET modelo = ?, marca = ?, anio = ?, potencia = ?, imagen = ?, 
                fabricante_id = ?, categoria_id = ?
            WHERE id = ?
        `).bind(modelo, marca, anio, potencia, imagen, fabricante_id, categoria_id, parseInt(id)).run();

        return new Response(JSON.stringify({ message: 'Auto actualizado exitosamente' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // DELETE /api/autos/:id - Eliminar auto
    if (method === 'DELETE' && id) {
        await env.bd_autos.prepare('DELETE FROM autos WHERE id = ?').bind(parseInt(id)).run();

        return new Response(JSON.stringify({ message: 'Auto eliminado exitosamente' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    return new Response('Método no permitido', { status: 405, headers: corsHeaders });
}

// Manejador para Fabricantes
async function handleFabricantes(request: Request, env: Env, path: string, method: string, corsHeaders: any) {
    const id = path.split('/')[3];

    if (method === 'GET' && !id) {
        const { results } = await env.bd_autos.prepare('SELECT * FROM fabricantes ORDER BY nombre').all();
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    if (method === 'GET' && id) {
        const fabricante = await env.bd_autos.prepare('SELECT * FROM fabricantes WHERE id = ?').bind(id).first();
        if (!fabricante) {
            return new Response(JSON.stringify({ error: 'Fabricante no encontrado' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
        return new Response(JSON.stringify(fabricante), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    if (method === 'POST') {
        const body = await request.json() as FabricanteInput;
        const { nombre, pais, anio_fundacion, sitio_web, logo } = body;

        const result = await env.bd_autos.prepare(`
            INSERT INTO fabricantes (nombre, pais, anio_fundacion, sitio_web, logo)
            VALUES (?, ?, ?, ?, ?)
        `).bind(nombre, pais, anio_fundacion, sitio_web, logo).run();

        return new Response(JSON.stringify({
            message: 'Fabricante creado exitosamente',
            id: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

   if (method === 'PUT' && id) {
		const body = await request.json() as FabricanteInput;
		const { nombre, pais, anio_fundacion, sitio_web, logo } = body;

		// Si logo no viene, usar null o vacío
		const logoValue = logo || '';

		await env.bd_autos.prepare(`
			UPDATE fabricantes 
			SET nombre = ?, pais = ?, anio_fundacion = ?, sitio_web = ?, logo = ?
			WHERE id = ?
		`).bind(nombre, pais, anio_fundacion, sitio_web, logoValue, parseInt(id)).run();

		return new Response(JSON.stringify({ message: 'Fabricante actualizado exitosamente' }), {
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	}

    if (method === 'DELETE' && id) {
        await env.bd_autos.prepare('DELETE FROM fabricantes WHERE id = ?').bind(parseInt(id)).run();
        return new Response(JSON.stringify({ message: 'Fabricante eliminado exitosamente' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    return new Response('Método no permitido', { status: 405, headers: corsHeaders });
}

// Manejador para Categorías
async function handleCategorias(request: Request, env: Env, path: string, method: string, corsHeaders: any) {
    const id = path.split('/')[3];

    if (method === 'GET' && !id) {
        const { results } = await env.bd_autos.prepare('SELECT * FROM categorias ORDER BY id').all();
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    if (method === 'GET' && id) {
        const categoria = await env.bd_autos.prepare('SELECT * FROM categorias WHERE id = ?').bind(id).first();
        if (!categoria) {
            return new Response(JSON.stringify({ error: 'Categoría no encontrada' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
        return new Response(JSON.stringify(categoria), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    if (method === 'POST') {
        const body = await request.json() as CategoriaInput;
        const { tipo_motor, traccion, aceleracion_0_100, velocidad_maxima } = body;

        const result = await env.bd_autos.prepare(`
            INSERT INTO categorias (tipo_motor, traccion, aceleracion_0_100, velocidad_maxima)
            VALUES (?, ?, ?, ?)
        `).bind(tipo_motor, traccion, aceleracion_0_100, velocidad_maxima).run();

        return new Response(JSON.stringify({
            message: 'Categoría creada exitosamente',
            id: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    if (method === 'PUT' && id) {
        const body = await request.json() as CategoriaInput;
        const { tipo_motor, traccion, aceleracion_0_100, velocidad_maxima } = body;

        await env.bd_autos.prepare(`
            UPDATE categorias 
            SET tipo_motor = ?, traccion = ?, aceleracion_0_100 = ?, velocidad_maxima = ?
            WHERE id = ?
        `).bind(tipo_motor, traccion, aceleracion_0_100, velocidad_maxima, parseInt(id)).run();

        return new Response(JSON.stringify({ message: 'Categoría actualizada exitosamente' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    if (method === 'DELETE' && id) {
        await env.bd_autos.prepare('DELETE FROM categorias WHERE id = ?').bind(parseInt(id)).run();
        return new Response(JSON.stringify({ message: 'Categoría eliminada exitosamente' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    return new Response('Método no permitido', { status: 405, headers: corsHeaders });
}