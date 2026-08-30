-- schema.sql
-- Eliminar tablas si existen
DROP TABLE IF EXISTS autos;
DROP TABLE IF EXISTS fabricantes;
DROP TABLE IF EXISTS categorias;

-- Tabla de fabricantes
CREATE TABLE fabricantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    pais TEXT,
    anio_fundacion INTEGER,
    sitio_web TEXT,
    logo TEXT
);

-- Tabla de categorías
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_motor TEXT,
    traccion TEXT,
    aceleracion_0_100 REAL,
    velocidad_maxima INTEGER
);

-- Tabla de autos (principal)
CREATE TABLE autos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo TEXT NOT NULL,
    marca TEXT,
    anio INTEGER,
    potencia INTEGER,
    imagen TEXT,
    fabricante_id INTEGER,
    categoria_id INTEGER,
    FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_autos_fabricante ON autos(fabricante_id);
CREATE INDEX idx_autos_categoria ON autos(categoria_id);