// Herramienta de diagnóstico para problemas de CSV
function diagnosticarCSV() {
    const csvContent = `nombre,marca,precio,categoria,subcategoria,descripcion,notas,imagen_url,ml,stock,estado,descuento,luxury,activo
9 AM,AFNAN,95000,para-ellos,nicho,Fragancia fresca y especiada,Limón, lavanda, menta,https://github.com/LordSaavedra/Imagenes_JH/blob/main/9%20AM%20AFNAN.png?raw=true,100,10,disponible,,false,true
9 AM,AFNAN,95000,para-ellos,nicho,Fragancia fresca y especiada,Limón, lavenda, menta,https://github.com/LordSaavedra/Imagenes_JH/blob/main/9%20PM%20AFNAN.png?raw=true,100,10,disponible,,false,true
Just Different,Hugo Boss,105000,para-ellos,designer,Perfume moderno y juvenil,Menta, manzana verde, albahaca,https://github.com/LordSaavedra/Imagenes_JH/blob/main/HUGO%20BOSS%20JUST%20DIFFERENT.png?raw=true,125,7,disponible,10,false,true`;

    console.log('🔍 DIAGNÓSTICO CSV INICIADO');
    console.log('=' .repeat(50));
    
    const lines = csvContent.split('\n');
    console.log(`📄 Total de líneas: ${lines.length}`);
    
    const headers = lines[0].split(',');
    console.log(`📋 Headers encontrados (${headers.length}):`, headers);
    
    const problemasEncontrados = [];
    
    // Analizar cada fila de datos
    for (let i = 1; i < lines.length; i++) {
        console.log(`\n🔍 Analizando fila ${i + 1}:`);
        console.log(`   Contenido: "${lines[i]}"`);
        
        const campos = lines[i].split(',');
        console.log(`   Campos detectados: ${campos.length}`);
        console.log(`   Campos: [${campos.map(c => `"${c}"`).join(', ')}]`);
        
        // Verificar número de campos
        if (campos.length !== headers.length) {
            const problema = `Fila ${i + 1}: ${campos.length} campos encontrados, ${headers.length} esperados`;
            problemasEncontrados.push(problema);
            console.log(`   ❌ ${problema}`);
        } else {
            console.log(`   ✅ Número de campos correcto`);
        }
        
        // Verificar campos requeridos
        const nombre = campos[0] ? campos[0].trim() : '';
        const marca = campos[1] ? campos[1].trim() : '';
        
        if (!nombre) {
            problemasEncontrados.push(`Fila ${i + 1}: Campo 'nombre' vacío`);
            console.log(`   ❌ Campo 'nombre' vacío`);
        }
        
        if (!marca) {
            problemasEncontrados.push(`Fila ${i + 1}: Campo 'marca' vacío`);
            console.log(`   ❌ Campo 'marca' vacío`);
        }
        
        // Detectar productos duplicados
        const productosAnteriores = [];
        for (let j = 1; j < i; j++) {
            const camposAnteriores = lines[j].split(',');
            const nombreAnterior = camposAnteriores[0] ? camposAnteriores[0].trim() : '';
            const marcaAnterior = camposAnteriores[1] ? camposAnteriores[1].trim() : '';
            
            if (nombre === nombreAnterior && marca === marcaAnterior) {
                problemasEncontrados.push(`Fila ${i + 1}: Producto duplicado "${nombre} - ${marca}" (ya existe en fila ${j + 1})`);
                console.log(`   ⚠️ Producto duplicado detectado`);
            }
        }
        
        // Verificar URLs de imagen
        const imagenIndex = headers.indexOf('imagen_url');
        if (imagenIndex >= 0 && campos[imagenIndex]) {
            const url = campos[imagenIndex].trim();
            if (url && !url.startsWith('http')) {
                problemasEncontrados.push(`Fila ${i + 1}: URL de imagen inválida "${url}"`);
                console.log(`   ⚠️ URL de imagen inválida`);
            }
        }
    }
    
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
    console.log('=' .repeat(50));
    
    if (problemasEncontrados.length === 0) {
        console.log('✅ No se encontraron problemas en el CSV');
    } else {
        console.log(`❌ Se encontraron ${problemasEncontrados.length} problemas:`);
        problemasEncontrados.forEach((problema, index) => {
            console.log(`${index + 1}. ${problema}`);
        });
        
        console.log('\n🔧 SOLUCIONES RECOMENDADAS:');
        console.log('1. Corregir productos duplicados (cambiar nombres o marcas)');
        console.log('2. Verificar que todas las filas tengan el mismo número de campos');
        console.log('3. Asegurar que campos requeridos (nombre, marca) no estén vacíos');
        console.log('4. Validar URLs de imágenes');
        console.log('5. Usar CSV sin comillas adicionales o caracteres especiales');
    }
    
    return {
        totalLineas: lines.length,
        headers: headers,
        problemas: problemasEncontrados,
        esValido: problemasEncontrados.length === 0
    };
}

// Función para crear CSV corregido
function crearCSVCorregido() {
    const csvCorregido = `nombre,marca,precio,categoria,subcategoria,descripcion,notas,imagen_url,ml,stock,estado,descuento,luxury,activo
9 AM,AFNAN,95000,para-ellos,nicho,Fragancia fresca matutina,Limón lavanda menta,https://github.com/LordSaavedra/Imagenes_JH/blob/main/9%20AM%20AFNAN.png?raw=true,100,10,disponible,,false,true
9 PM,AFNAN,95000,para-ellos,nicho,Fragancia nocturna especiada,Limón lavanda menta,https://github.com/LordSaavedra/Imagenes_JH/blob/main/9%20PM%20AFNAN.png?raw=true,100,10,disponible,,false,true
Just Different,Hugo Boss,105000,para-ellos,designer,Perfume moderno y juvenil,Menta manzana verde albahaca,https://github.com/LordSaavedra/Imagenes_JH/blob/main/HUGO%20BOSS%20JUST%20DIFFERENT.png?raw=true,125,7,disponible,10,false,true
Arabians Tonka,Montale,210000,unisex,nicho,Perfume intenso y oriental,Haba tonka azafrán oud,https://github.com/LordSaavedra/Imagenes_JH/blob/main/MONTALE%20ARABIANS%20TONKA.png?raw=true,100,5,disponible,,true,true`;

    console.log('✅ CSV CORREGIDO GENERADO:');
    console.log('=' .repeat(50));
    console.log(csvCorregido);
    
    return csvCorregido;
}

// Ejecutar diagnóstico
const resultado = diagnosticarCSV();
console.log('\n🔧 CSV CORREGIDO:');
crearCSVCorregido();
