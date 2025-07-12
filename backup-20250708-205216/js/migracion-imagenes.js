// Script de migración - Actualizar productos para URLs de imágenes
// Ejecutar desde la consola del navegador en el admin panel

class MigracionImagenes {
    constructor() {
        this.exampleImages = [
            'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1592946279750-2c9ae2e5c1c7?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1592946279750-2c9ae2e5c1c7?w=400&h=400&fit=crop'
        ];
        
        this.fallbackImage = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop';
    }

    // Obtener una URL de imagen aleatoria
    getRandomImageUrl() {
        const randomIndex = Math.floor(Math.random() * this.exampleImages.length);
        return this.exampleImages[randomIndex];
    }

    // Validar si una URL es válida
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    // Convertir imagen de Supabase Storage a URL directa
    convertSupabaseStorageToUrl(imagen) {
        // Si ya es una URL válida, devolverla
        if (this.isValidUrl(imagen)) {
            return imagen;
        }
        
        // Si es una ruta de Supabase Storage, convertirla
        if (imagen && imagen.includes('supabase.co')) {
            // Extraer solo la parte final si es una URL completa
            const parts = imagen.split('/');
            const filename = parts[parts.length - 1];
            return `https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/productos/${filename}`;
        }
        
        // Si es solo un nombre de archivo, crear URL completa
        if (imagen && !imagen.includes('http')) {
            return `https://xelobsbzytdxrrxgmlta.supabase.co/storage/v1/object/public/productos/${imagen}`;
        }
        
        // Si no se puede convertir, usar imagen por defecto
        return this.getRandomImageUrl();
    }

    // Ejecutar migración completa
    async ejecutarMigracion() {
        console.log('🚀 Iniciando migración de imágenes...');
        
        try {
            // Verificar conexión a Supabase
            if (!supabaseClient) {
                console.error('❌ Supabase no está inicializado');
                return;
            }

            // Obtener todos los productos
            console.log('📋 Obteniendo productos...');
            const { data: productos, error } = await supabaseClient
                .from('productos')
                .select('*')
                .order('id', { ascending: true });

            if (error) {
                console.error('❌ Error obteniendo productos:', error);
                return;
            }

            console.log(`📦 Encontrados ${productos.length} productos`);

            // Procesar cada producto
            let procesados = 0;
            let actualizados = 0;
            let errores = 0;

            for (const producto of productos) {
                try {
                    procesados++;
                    
                    // Determinar nueva URL de imagen
                    let nuevaImagen = producto.imagen;
                    
                    // Si no tiene imagen o es null/undefined
                    if (!nuevaImagen || nuevaImagen === 'null' || nuevaImagen === 'undefined') {
                        nuevaImagen = this.getRandomImageUrl();
                        console.log(`🔄 Producto ${producto.id} - Sin imagen, asignando: ${nuevaImagen}`);
                    }
                    // Si tiene imagen pero no es URL válida
                    else if (!this.isValidUrl(nuevaImagen)) {
                        const imagenOriginal = nuevaImagen;
                        nuevaImagen = this.convertSupabaseStorageToUrl(nuevaImagen);
                        console.log(`🔄 Producto ${producto.id} - Convirtiendo: ${imagenOriginal} -> ${nuevaImagen}`);
                    }
                    // Si ya es URL válida
                    else {
                        console.log(`✅ Producto ${producto.id} - Ya tiene URL válida: ${nuevaImagen}`);
                        continue; // No necesita actualización
                    }

                    // Actualizar producto
                    const { error: updateError } = await supabaseClient
                        .from('productos')
                        .update({ imagen: nuevaImagen })
                        .eq('id', producto.id);

                    if (updateError) {
                        console.error(`❌ Error actualizando producto ${producto.id}:`, updateError);
                        errores++;
                    } else {
                        console.log(`✅ Producto ${producto.id} actualizado exitosamente`);
                        actualizados++;
                    }

                    // Pequeña pausa para no sobrecargar la base de datos
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    console.error(`❌ Error procesando producto ${producto.id}:`, error);
                    errores++;
                }
            }

            // Reporte final
            console.log('\n🎉 Migración completada!');
            console.log(`📊 Resumen:`);
            console.log(`   • Productos procesados: ${procesados}`);
            console.log(`   • Productos actualizados: ${actualizados}`);
            console.log(`   • Errores: ${errores}`);

        } catch (error) {
            console.error('❌ Error durante la migración:', error);
        }
    }

    // Verificar estado de las imágenes
    async verificarImagenes() {
        console.log('🔍 Verificando estado de imágenes...');
        
        try {
            const { data: productos, error } = await supabaseClient
                .from('productos')
                .select('id, nombre, imagen')
                .order('id', { ascending: true });

            if (error) {
                console.error('❌ Error obteniendo productos:', error);
                return;
            }

            let conUrlValida = 0;
            let sinImagen = 0;
            let conRutaInvalida = 0;

            console.log('\n📋 Estado de imágenes:');
            
            productos.forEach(producto => {
                if (!producto.imagen || producto.imagen === 'null') {
                    sinImagen++;
                    console.log(`⚠️  ${producto.id}: ${producto.nombre} - Sin imagen`);
                } else if (!this.isValidUrl(producto.imagen)) {
                    conRutaInvalida++;
                    console.log(`❌ ${producto.id}: ${producto.nombre} - Ruta inválida: ${producto.imagen}`);
                } else {
                    conUrlValida++;
                    console.log(`✅ ${producto.id}: ${producto.nombre} - URL válida`);
                }
            });

            console.log('\n📊 Resumen:');
            console.log(`   • Con URL válida: ${conUrlValida}`);
            console.log(`   • Sin imagen: ${sinImagen}`);
            console.log(`   • Con ruta inválida: ${conRutaInvalida}`);
            console.log(`   • Total productos: ${productos.length}`);

        } catch (error) {
            console.error('❌ Error verificando imágenes:', error);
        }
    }

    // Crear productos de prueba con URLs optimizadas
    async crearProductosPrueba() {
        console.log('🧪 Creando productos de prueba...');
        
        const productosPrueba = [
            {
                nombre: 'Dior Sauvage',
                marca: 'Dior',
                precio: 180000,
                ml: 100,
                categoria: 'para-ellos',
                subcategoria: 'designer',
                imagen: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
                descripcion: 'Fragancia fresca y especiada inspirada en paisajes salvajes.',
                notas: 'Bergamota, Pimienta, Ambroxan',
                estado: 'disponible',
                activo: true
            },
            {
                nombre: 'Chanel No. 5',
                marca: 'Chanel',
                precio: 220000,
                ml: 100,
                categoria: 'para-ellas',
                subcategoria: 'designer',
                imagen: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=400&fit=crop',
                descripcion: 'El perfume más icónico del mundo, elegante y atemporal.',
                notas: 'Aldehídos, Rosa, Sándalo',
                estado: 'disponible',
                activo: true
            },
            {
                nombre: 'Tom Ford Oud Wood',
                marca: 'Tom Ford',
                precio: 350000,
                ml: 50,
                categoria: 'para-ellos',
                subcategoria: 'designer',
                imagen: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=400&fit=crop',
                descripcion: 'Fragancia luxury con notas orientales y amaderadas.',
                notas: 'Oud, Sándalo, Vainilla',
                estado: 'disponible',
                activo: true,
                luxury: true
            }
        ];

        let creados = 0;
        
        for (const producto of productosPrueba) {
            try {
                const { error } = await supabaseClient
                    .from('productos')
                    .insert([producto]);

                if (error) {
                    console.error(`❌ Error creando ${producto.nombre}:`, error);
                } else {
                    console.log(`✅ Producto creado: ${producto.nombre}`);
                    creados++;
                }

                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error) {
                console.error(`❌ Error procesando ${producto.nombre}:`, error);
            }
        }

        console.log(`🎉 Productos de prueba creados: ${creados}/${productosPrueba.length}`);
    }
}

// Crear instancia global
window.migracionImagenes = new MigracionImagenes();

// Funciones de acceso rápido
window.migrarImagenes = () => window.migracionImagenes.ejecutarMigracion();
window.verificarImagenes = () => window.migracionImagenes.verificarImagenes();
window.crearProductosPrueba = () => window.migracionImagenes.crearProductosPrueba();

console.log('🛠️  Script de migración cargado.');
console.log('📝 Comandos disponibles:');
console.log('   • migrarImagenes() - Ejecutar migración completa');
console.log('   • verificarImagenes() - Verificar estado actual');
console.log('   • crearProductosPrueba() - Crear productos de ejemplo');
