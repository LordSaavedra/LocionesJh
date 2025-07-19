// Script para corregir la estructura HTML duplicada de resultados de carga masiva

function fixUploadResultsStructure() {
    console.log('🔧 Corrigiendo estructura de resultados de carga...');
    
    const uploadResults = document.getElementById('uploadResults');
    if (!uploadResults) {
        console.log('❌ No se encontró elemento #uploadResults');
        return;
    }
    
    const resultsSummary = document.getElementById('resultsSummary');
    if (!resultsSummary) {
        console.log('❌ No se encontró elemento #resultsSummary');
        return;
    }
    
    // Limpiar contenido duplicado
    resultsSummary.innerHTML = '';
    
    // Estructura correcta para resultados
    const correctStructure = `
        <div class="results-summary">
            <div class="summary-item success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <div class="summary-number" id="successCount">0</div>
                    <div class="summary-label">Exitosos</div>
                </div>
            </div>
            <div class="summary-item error">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <div class="summary-number" id="errorCount">0</div>
                    <div class="summary-label">Fallidos</div>
                </div>
            </div>
            <div class="summary-item info">
                <i class="fas fa-clock"></i>
                <div>
                    <div class="summary-number" id="timeCount">0s</div>
                    <div class="summary-label">Tiempo</div>
                </div>
            </div>
        </div>
        
        <div class="results-section" id="successSection" style="display: none;">
            <h4><i class="fas fa-check-circle text-success"></i> Productos cargados exitosamente:</h4>
            <ul class="results-list success" id="successList"></ul>
        </div>
        
        <div class="results-section" id="errorSection" style="display: none;">
            <h4><i class="fas fa-exclamation-circle text-error"></i> Productos con errores:</h4>
            <ul class="results-list error" id="errorList"></ul>
        </div>
    `;
    
    resultsSummary.innerHTML = correctStructure;
    console.log('✅ Estructura HTML corregida');
    
    return {
        updateCounts: function(success, errors, time) {
            document.getElementById('successCount').textContent = success;
            document.getElementById('errorCount').textContent = errors;
            document.getElementById('timeCount').textContent = time + 's';
        },
        
        addSuccessProduct: function(productName) {
            const successSection = document.getElementById('successSection');
            const successList = document.getElementById('successList');
            
            successSection.style.display = 'block';
            
            const listItem = document.createElement('li');
            listItem.textContent = productName;
            successList.appendChild(listItem);
        },
        
        addErrorProduct: function(productName, error) {
            const errorSection = document.getElementById('errorSection');
            const errorList = document.getElementById('errorList');
            
            errorSection.style.display = 'block';
            
            const listItem = document.createElement('li');
            listItem.textContent = `${productName} - ${error}`;
            errorList.appendChild(listItem);
        },
        
        showResults: function() {
            uploadResults.style.display = 'block';
            // Trigger animation
            uploadResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
}

// Función para usar en el admin panel
function displayUploadResults(results) {
    const resultsManager = fixUploadResultsStructure();
    
    if (!resultsManager) return;
    
    // Contar resultados
    const successCount = results.success ? results.success.length : 0;
    const errorCount = results.errors ? results.errors.length : 0;
    const totalTime = results.time || 0;
    
    // Actualizar contadores
    resultsManager.updateCounts(successCount, errorCount, totalTime);
    
    // Agregar productos exitosos
    if (results.success && results.success.length > 0) {
        results.success.forEach(product => {
            resultsManager.addSuccessProduct(product);
        });
    }
    
    // Agregar productos con errores
    if (results.errors && results.errors.length > 0) {
        results.errors.forEach(error => {
            resultsManager.addErrorProduct(error.product, error.message);
        });
    }
    
    // Mostrar resultados
    resultsManager.showResults();
    
    console.log('✅ Resultados de carga mostrados correctamente');
}

// Ejemplo de uso:
/*
const exampleResults = {
    success: [
        'Polo Blue - Ralph Lauren (creado)',
        'Black Opium - Yves Saint Laurent (creado)'
    ],
    errors: [
        {
            product: 'Chanel No. 5',
            message: 'Error: Precio inválido (línea 4)'
        }
    ],
    time: 2.3
};

displayUploadResults(exampleResults);
*/

// Exportar funciones si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fixUploadResultsStructure, displayUploadResults };
}
