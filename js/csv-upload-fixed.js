/**
 * CSV Upload Manager - Version Corregida
 * Maneja la carga masiva de productos desde archivos CSV
 */

class CSVUploadManager {
    constructor() {
        this.csvData = null;
        this.validData = [];
        this.errors = [];
        this.isUploading = false;
        this.uploadStats = {
            processed: 0,
            errors: 0,
            startTime: null,
            total: 0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.setupDragAndDrop();
    }

    initializeElements() {
        // File input elements
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('csvFileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        
        // Display elements
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.fileRows = document.getElementById('fileRows');
        this.removeFileBtn = document.getElementById('removeFile');
        
        // Debug button
        this.debugDataBtn = document.getElementById('debugData');
        this.diagnoseSupabaseBtn = document.getElementById('diagnoseSupabase');
        
        // Configuration elements
        this.uploadConfig = document.getElementById('uploadConfig');
        this.skipErrors = document.getElementById('skipErrors');
        this.updateExisting = document.getElementById('updateExisting');
        this.validateImages = document.getElementById('validateImages');
        this.batchSize = document.getElementById('batchSize');
        
        // Preview elements
        this.dataPreview = document.getElementById('dataPreview');
        this.previewTable = document.getElementById('previewTable');
        this.previewHeader = document.getElementById('previewHeader');
        this.previewBody = document.getElementById('previewBody');
        this.validateDataBtn = document.getElementById('validateData');
        
        // Validation elements
        this.validationErrors = document.getElementById('validationErrors');
        this.errorsList = document.getElementById('errorsList');
        
        // Progress elements
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressDetail = document.getElementById('progressDetail');
        this.progressTime = document.getElementById('progressTime');
        
        // Action elements
        this.uploadActions = document.getElementById('uploadActions');
        this.startUploadBtn = document.getElementById('startUpload');
        this.pauseUploadBtn = document.getElementById('pauseUpload');
        this.cancelUploadBtn = document.getElementById('cancelUpload');
        
        // Results elements
        this.uploadResults = document.getElementById('uploadResults');
        this.resultsSummary = document.getElementById('resultsSummary');
        this.downloadReportBtn = document.getElementById('downloadReport');
        this.resetUploadBtn = document.getElementById('resetUpload');
        
        // Stats elements
        this.uploadStatsDiv = document.getElementById('uploadStats');
        this.processedCount = document.getElementById('processedCount');
        this.errorCount = document.getElementById('errorCount');
        this.processTime = document.getElementById('processTime');
        this.progressPercent = document.getElementById('progressPercent');
        
        // Modal elements
        this.instructionsModal = document.getElementById('instructionsModal');
        this.showInstructionsBtn = document.getElementById('showInstructions');
        this.closeInstructionsBtn = document.getElementById('closeInstructions');
        this.downloadTemplateBtn = document.getElementById('downloadTemplate');
        this.downloadTemplateModalBtn = document.getElementById('downloadTemplateModal');
    }

    bindEvents() {
        // File selection events
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFileBtn.addEventListener('click', () => this.removeFile());
        
        // Validation and preview events
        this.validateDataBtn.addEventListener('click', () => this.validateData());
        
        // Debug events
        if (this.debugDataBtn) {
            this.debugDataBtn.addEventListener('click', () => this.debugData());
        }
        if (this.diagnoseSupabaseBtn) {
            this.diagnoseSupabaseBtn.addEventListener('click', () => this.diagnoseSupabase());
        }
        
        // Upload control events
        this.startUploadBtn.addEventListener('click', () => this.startUpload());
        this.pauseUploadBtn.addEventListener('click', () => this.pauseUpload());
        this.cancelUploadBtn.addEventListener('click', () => this.cancelUpload());
        
        // Results events
        this.downloadReportBtn.addEventListener('click', () => this.downloadReport());
        this.resetUploadBtn.addEventListener('click', () => this.resetUpload());
        
        // Modal events
        this.showInstructionsBtn.addEventListener('click', () => this.showInstructions());
        this.closeInstructionsBtn.addEventListener('click', () => this.hideInstructions());
        this.downloadTemplateBtn.addEventListener('click', () => this.downloadTemplate());
        this.downloadTemplateModalBtn.addEventListener('click', () => this.downloadTemplate());
        
        // Close modal on overlay click
        this.instructionsModal.addEventListener('click', (e) => {
            if (e.target === this.instructionsModal) {
                this.hideInstructions();
            }
        });
    }

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, () => {
                this.uploadZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, () => {
                this.uploadZone.classList.remove('dragover');
            }, false);
        });

        this.uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('Por favor selecciona un archivo CSV válido.');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('El archivo es demasiado grande. Máximo 5MB permitido.');
            return;
        }

        this.showFileInfo(file);
        this.readCSVFile(file);
    }

    showFileInfo(file) {
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileInfo.style.display = 'block';
        this.uploadConfig.style.display = 'block';
        
        // Hide upload zone
        this.uploadZone.style.display = 'none';
        
        // Show info toast
        this.showInfo(`Archivo "${file.name}" cargado correctamente. Ahora puedes configurar las opciones de carga.`);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    readCSVFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                this.parseCSV(csvText);
            } catch (error) {
                this.showError('Error al leer el archivo: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            this.showError('Error al leer el archivo CSV.');
        };
        
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            this.showError('El archivo CSV debe tener al menos una fila de datos además del encabezado.');
            return;
        }

        console.log('📄 === ANÁLISIS DE ARCHIVO CSV ===');
        console.log(`📊 Total de líneas: ${lines.length}`);
        console.log('🔍 Primera línea (header):', lines[0]);
        console.log('🔍 Segunda línea (ejemplo):', lines[1]);
        
        // Detectar formato del archivo
        const firstDataLine = lines[1];
        let csvFormat = 'standard';
        
        if (firstDataLine.startsWith('"') && firstDataLine.endsWith('"') && firstDataLine.includes('","')) {
            csvFormat = 'problematic';
            console.log('⚠️ Formato detectado: PROBLEMÁTICO (comillas envolventes)');
            this.showWarning('Formato CSV problemático detectado. Aplicando parser especial...');
        } else {
            console.log('✅ Formato detectado: ESTÁNDAR');
            this.showInfo('Formato CSV estándar detectado.');
        }

        // Parse header
        const headers = this.parseCSVLine(lines[0]);
        console.log('📋 Headers encontrados:', headers);
        
        // Normalize headers (remove quotes and trim)
        const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
        console.log('📋 Headers normalizados:', normalizedHeaders);
        
        // Validate required headers
        const requiredHeaders = ['nombre', 'marca', 'precio', 'categoria'];
        const missingHeaders = requiredHeaders.filter(header => 
            !normalizedHeaders.includes(header)
        );

        if (missingHeaders.length > 0) {
            console.log('❌ Headers faltantes:', missingHeaders);
            this.showError(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
            return;
        }

        console.log('✅ Todos los headers requeridos están presentes');

        // Parse data rows
        const dataRows = [];
        let skippedRows = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            console.log(`📄 Fila ${i + 1} valores (${values.length} campos):`, values);
            
            if (values.length === headers.length) {
                const rowData = {};
                headers.forEach((header, index) => {
                    const normalizedHeader = header.trim().toLowerCase();
                    rowData[normalizedHeader] = values[index] ? values[index].trim() : '';
                });
                console.log(`✅ Fila ${i + 1} procesada:`, rowData);
                dataRows.push({
                    row: i + 1,
                    data: rowData
                });
            } else {
                console.log(`⚠️ Fila ${i + 1} ignorada - columnas no coinciden: esperadas ${headers.length}, encontradas ${values.length}`);
                skippedRows++;
            }
        }

        console.log(`📊 Resumen procesamiento:`);
        console.log(`  - Filas procesadas: ${dataRows.length}`);
        console.log(`  - Filas ignoradas: ${skippedRows}`);

        if (dataRows.length === 0) {
            this.showError('No se encontraron filas de datos válidas en el archivo.');
            return;
        }

        if (dataRows.length > 1000) {
            this.showError('El archivo contiene demasiados productos. Máximo 1000 productos por archivo.');
            return;
        }

        this.csvData = {
            headers: headers,
            rows: dataRows,
            format: csvFormat
        };

        this.fileRows.textContent = `${dataRows.length} filas detectadas`;
        this.showPreview();
        
        // Validar automáticamente después de cargar
        setTimeout(() => {
            this.validateData();
        }, 500);
        
        this.showSuccess(`CSV procesado correctamente: ${dataRows.length} productos encontrados.`);
    }

    parseCSVLine(line) {
        console.log('🔍 Parseando línea:', line);
        
        // Limpiar línea de caracteres problemáticos
        line = line.trim();
        
        // Detectar si toda la línea está envuelta en comillas
        if (line.startsWith('"') && line.endsWith('"') && line.length > 2) {
            // Remover las comillas externas
            line = line.slice(1, -1);
            console.log('🔧 Línea sin comillas externas:', line);
            
            // Ahora dividir por ,"" que es el patrón en tu CSV
            let fields = line.split('","');
            
            // Limpiar cada campo
            fields = fields.map(field => {
                // Remover comillas dobles al inicio y final si existen
                field = field.replace(/^""/, '').replace(/""$/, '');
                // Convertir comillas dobles escapadas a simples
                field = field.replace(/""/g, '"');
                return field.trim();
            });
            
            console.log('✅ Campos parseados:', fields);
            return fields;
        }
        
        // Fallback: parser estándar para CSVs normales
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Doble comilla escapada ("")
                    current += '"';
                    i += 2;
                    continue;
                } else {
                    // Cambio de estado de comillas
                    inQuotes = !inQuotes;
                    i++;
                    continue;
                }
            } else if (char === ',' && !inQuotes) {
                // Separador de campo
                result.push(current.trim());
                current = '';
                i++;
                continue;
            } else {
                current += char;
                i++;
            }
        }
        
        // Agregar el último campo
        result.push(current.trim());
        
        // Limpiar campos vacíos o con solo comillas
        const cleanedResult = result.map(field => {
            field = field.trim();
            // Remover comillas al inicio y final si están balanceadas
            if (field.startsWith('"') && field.endsWith('"') && field.length > 1) {
                field = field.slice(1, -1);
            }
            // Limpiar comillas dobles escapadas
            field = field.replace(/""/g, '"');
            return field;
        });
        
        console.log('✅ Resultado final parseado:', cleanedResult);
        return cleanedResult;
    }

    showPreview() {
        if (!this.csvData) return;

        // Show preview section
        this.dataPreview.style.display = 'block';
        this.uploadActions.style.display = 'block';
        
        // Show debug buttons
        if (this.debugDataBtn) {
            this.debugDataBtn.style.display = 'inline-block';
        }
        if (this.diagnoseSupabaseBtn) {
            this.diagnoseSupabaseBtn.style.display = 'inline-block';
        }

        // Create table header
        this.previewHeader.innerHTML = '';
        const headerRow = document.createElement('tr');
        this.csvData.headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        this.previewHeader.appendChild(headerRow);

        // Create table body (first 5 rows)
        this.previewBody.innerHTML = '';
        const previewRows = this.csvData.rows.slice(0, 5);
        
        previewRows.forEach(rowItem => {
            const tr = document.createElement('tr');
            this.csvData.headers.forEach(header => {
                const td = document.createElement('td');
                const value = rowItem.data[header.toLowerCase()] || '';
                td.textContent = value.length > 50 ? value.substring(0, 50) + '...' : value;
                td.title = value; // Show full value on hover
                tr.appendChild(td);
            });
            this.previewBody.appendChild(tr);
        });
    }

    validateData() {
        if (!this.csvData) {
            console.log('❌ No hay csvData');
            return;
        }

        console.log('🔍 Iniciando validación de datos...');
        console.log('📊 Datos CSV:', this.csvData);

        this.errors = [];
        this.validData = [];

        this.csvData.rows.forEach((rowItem, index) => {
            console.log(`🔍 Validando fila ${rowItem.row}:`, rowItem.data);
            const errors = this.validateRow(rowItem.data, rowItem.row);
            
            if (errors.length === 0) {
                const normalizedData = this.normalizeRowData(rowItem.data);
                console.log(`✅ Fila ${rowItem.row} válida:`, normalizedData);
                this.validData.push(normalizedData);
            } else {
                console.log(`❌ Fila ${rowItem.row} con errores:`, errors);
                this.errors.push({
                    row: rowItem.row,
                    errors: errors
                });
            }
        });

        console.log(`📈 Resumen validación: ${this.validData.length} válidos, ${this.errors.length} errores`);
        this.showValidationResults();
    }

    validateRow(data, rowNumber) {
        const errors = [];
        
        console.log(`🔍 Validando fila ${rowNumber}:`, data);
        
        // Required fields
        if (!data.nombre || data.nombre.trim() === '') {
            console.log(`❌ Fila ${rowNumber}: Nombre vacío`);
            errors.push('El nombre del producto es requerido');
        }
        
        if (!data.marca || data.marca.trim() === '') {
            console.log(`❌ Fila ${rowNumber}: Marca vacía`);
            errors.push('La marca es requerida');
        }
        
        if (!data.precio || data.precio.trim() === '') {
            console.log(`❌ Fila ${rowNumber}: Precio vacío`);
            errors.push('El precio es requerido');
        } else {
            const precio = parseFloat(data.precio);
            if (isNaN(precio) || precio <= 0) {
                console.log(`❌ Fila ${rowNumber}: Precio inválido:`, data.precio);
                errors.push('El precio debe ser un número mayor a 0');
            }
        }
        
        if (!data.categoria || data.categoria.trim() === '') {
            console.log(`❌ Fila ${rowNumber}: Categoría vacía`);
            errors.push('La categoría es requerida');
        } else {
            const validCategories = ['para-ellos', 'para-ellas', 'unisex'];
            if (!validCategories.includes(data.categoria.toLowerCase().trim())) {
                console.log(`❌ Fila ${rowNumber}: Categoría inválida:`, data.categoria);
                errors.push('Categoría inválida. Debe ser: para-ellos, para-ellas, o unisex');
            }
        }

        console.log(`🔍 Fila ${rowNumber} validación completa. Errores:`, errors.length);
        return errors;
    }

    normalizeRowData(data) {
        return {
            nombre: data.nombre?.trim() || '',
            marca: data.marca?.trim() || '',
            precio: parseFloat(data.precio) || 0,
            categoria: data.categoria?.toLowerCase().trim() || '',
            subcategoria: data.subcategoria?.toLowerCase().trim() || null,
            descripcion: data.descripcion?.trim() || '',
            notas: data.notas?.trim() || '',
            imagen_url: data.imagen_url?.trim() || '',
            ml: data.ml ? parseInt(data.ml) : 100,
            stock: data.stock ? parseInt(data.stock) : 0,
            estado: data.estado?.toLowerCase().trim() || 'disponible',
            descuento: data.descuento ? parseInt(data.descuento) : null,
            luxury: this.parseBoolean(data.luxury),
            activo: data.activo !== undefined ? this.parseBoolean(data.activo) : true
        };
    }

    parseBoolean(value) {
        if (!value || value.trim() === '') return false;
        const val = value.toLowerCase().trim();
        return ['true', '1', 'yes', 'si'].includes(val);
    }

    showValidationResults() {
        console.log(`📊 === RESULTADOS DE VALIDACIÓN ===`);
        console.log(`✅ Datos válidos: ${this.validData.length}`);
        console.log(`❌ Errores: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('📋 Detalle de errores:');
            this.errors.forEach(error => {
                console.log(`  Fila ${error.row}:`, error.errors);
            });
            this.showValidationErrors();
        } else {
            this.hideValidationErrors();
            console.log('🎉 ¡Todos los datos son válidos!');
        }

        // Update upload button state
        if (this.validData.length > 0) {
            this.startUploadBtn.disabled = false;
            this.startUploadBtn.classList.remove('btn-disabled');
            this.startUploadBtn.innerHTML = `
                <i class="fas fa-upload"></i>
                Cargar ${this.validData.length} Productos
            `;
            console.log('🎛️ Botón de carga HABILITADO');
            this.showSuccess(`✅ Validación completada: ${this.validData.length} productos listos para cargar`);
        } else {
            this.startUploadBtn.disabled = true;
            this.startUploadBtn.classList.add('btn-disabled');
            this.startUploadBtn.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                No hay datos válidos para cargar
            `;
            console.log('🎛️ Botón de carga DESHABILITADO');
            this.showError(`❌ No se encontraron datos válidos. Revisa los errores mostrados.`);
        }
    }

    showValidationErrors() {
        this.validationErrors.style.display = 'block';
        this.errorsList.innerHTML = '';

        this.errors.forEach(errorItem => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-item';
            
            const rowDiv = document.createElement('div');
            rowDiv.className = 'error-row';
            rowDiv.textContent = `Fila ${errorItem.row}:`;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'error-message';
            messageDiv.innerHTML = errorItem.errors.map(error => `• ${error}`).join('<br>');
            
            errorDiv.appendChild(rowDiv);
            errorDiv.appendChild(messageDiv);
            this.errorsList.appendChild(errorDiv);
        });
    }

    hideValidationErrors() {
        this.validationErrors.style.display = 'none';
    }

    debugData() {
        console.log('🐛 === DEBUG DE DATOS CSV ===');
        console.log('📊 csvData:', this.csvData);
        console.log('✅ validData:', this.validData);
        console.log('❌ errors:', this.errors);
        
        if (this.csvData && this.csvData.rows) {
            console.log('📋 Ejemplo de primera fila:');
            console.log('  - Row:', this.csvData.rows[0]);
            console.log('  - Headers:', this.csvData.headers);
            
            // Probar validación manual de la primera fila
            if (this.csvData.rows.length > 0) {
                const firstRow = this.csvData.rows[0];
                console.log('🔍 Validando primera fila manualmente...');
                const errors = this.validateRow(firstRow.data, firstRow.row);
                console.log('📝 Errores encontrados:', errors);
                const normalized = this.normalizeRowData(firstRow.data);
                console.log('🔧 Datos normalizados:', normalized);
            }
        }
        
        // Mostrar estado de botones
        console.log('🎛️ Estado botón carga:', this.startUploadBtn.disabled ? 'DESHABILITADO' : 'HABILITADO');
        console.log('🎛️ Texto botón:', this.startUploadBtn.innerHTML);
        
        this.showInfo('Debug info mostrado en la consola del navegador (F12)');
    }

    // Toast notifications
    showError(message) {
        this.showToast('error', 'Error', message);
    }

    showSuccess(message) {
        this.showToast('success', 'Éxito', message);
    }

    showWarning(message) {
        this.showToast('warning', 'Advertencia', message);
    }

    showInfo(message) {
        this.showToast('info', 'Información', message);
    }

    showToast(type, title, message) {
        // Crear contenedor si no existe
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Agregar evento de cierre
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.closeToast(toast);
        });

        // Agregar al contenedor
        container.appendChild(toast);

        // Auto cerrar después de 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                this.closeToast(toast);
            }
        }, 5000);
    }

    closeToast(toast) {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    downloadTemplate() {
        const headers = [
            'nombre', 'marca', 'precio', 'categoria', 'subcategoria',
            'descripcion', 'notas', 'imagen_url', 'ml', 'stock',
            'estado', 'descuento', 'luxury', 'activo'
        ];

        const sampleData = [
            [
                'Polo Blue', 'Ralph Lauren', '89000', 'para-ellos', 'contemporary',
                'Fragancia fresca y marina', 'Notas acuáticas melón mandarina',
                'https://example.com/polo-blue.jpg', '125', '15',
                'disponible', '', 'false', 'true'
            ],
            [
                'Black Opium', 'Yves Saint Laurent', '165000', 'para-ellas', 'designer',
                'Perfume oriental y seductor', 'Café negro vainilla flor de naranja',
                'https://example.com/black-opium.jpg', '90', '8',
                'disponible', '15', 'true', 'true'
            ]
        ];

        let csvContent = headers.join(',') + '\n';
        sampleData.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-productos.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    resetUpload() {
        // Reset all states
        this.csvData = null;
        this.validData = [];
        this.errors = [];
        this.isUploading = false;
        this.uploadStats = {
            processed: 0,
            errors: 0,
            startTime: null,
            total: 0
        };

        // Reset file input
        this.fileInput.value = '';

        // Hide all sections
        this.fileInfo.style.display = 'none';
        this.uploadConfig.style.display = 'none';
        this.dataPreview.style.display = 'none';
        this.validationErrors.style.display = 'none';
        this.progressContainer.style.display = 'none';
        this.uploadActions.style.display = 'none';
        this.uploadResults.style.display = 'none';
        this.uploadStatsDiv.style.display = 'none';
        
        // Hide debug buttons
        if (this.debugDataBtn) {
            this.debugDataBtn.style.display = 'none';
        }
        if (this.diagnoseSupabaseBtn) {
            this.diagnoseSupabaseBtn.style.display = 'none';
        }

        // Show upload zone
        this.uploadZone.style.display = 'block';

        // Reset stats display
        this.updateStatsDisplay();
    }

    removeFile() {
        this.resetUpload();
    }

    showInstructions() {
        this.instructionsModal.classList.add('active');
    }

    hideInstructions() {
        this.instructionsModal.classList.remove('active');
    }

    // Upload functionality
    async startUpload() {
        if (!this.validData || this.validData.length === 0) {
            this.showError('No hay datos válidos para cargar.');
            return;
        }

        if (this.isUploading) {
            this.showWarning('Ya hay una carga en progreso.');
            return;
        }

        // Verificar conexión a Supabase
        if (!window.supabaseClient) {
            this.showError('Error: No hay conexión con la base de datos. Verificando configuración...');
            await this.diagnoseSupabase();
            return;
        }

        // Probar conexión antes de empezar
        try {
            console.log('🔍 Verificando conexión a Supabase antes de la carga...');
            const { error: testError } = await window.supabaseClient
                .from('productos')
                .select('id')
                .limit(1);
            
            if (testError) {
                throw testError;
            }
            console.log('✅ Conexión verificada, iniciando carga...');
        } catch (error) {
            console.error('❌ Error en verificación de conexión:', error);
            this.showError(`Error de conexión: ${error.message}`);
            return;
        }

        console.log('🚀 Iniciando carga masiva...');
        console.log(`📊 Productos a cargar: ${this.validData.length}`);

        this.isUploading = true;
        this.uploadStats = {
            processed: 0,
            errors: 0,
            startTime: Date.now(),
            total: this.validData.length,
            successful: [],
            failed: []
        };

        // Configuración
        const batchSize = parseInt(this.batchSize.value) || 10;
        const skipErrors = this.skipErrors.checked;
        const updateExisting = this.updateExisting.checked;

        console.log('⚙️ Configuración de carga:');
        console.log(`  - Lote: ${batchSize} productos`);
        console.log(`  - Saltar errores: ${skipErrors}`);
        console.log(`  - Actualizar existentes: ${updateExisting}`);

        // Mostrar interfaz de progreso
        this.showProgressInterface();

        try {
            // Procesar en lotes
            for (let i = 0; i < this.validData.length; i += batchSize) {
                if (!this.isUploading) {
                    console.log('⏹️ Carga cancelada por el usuario');
                    break;
                }

                const batch = this.validData.slice(i, i + batchSize);
                console.log(`📦 Procesando lote ${Math.floor(i/batchSize) + 1}: ${batch.length} productos`);

                await this.processBatch(batch, updateExisting, skipErrors);
                
                // Pequeña pausa entre lotes para no sobrecargar
                if (i + batchSize < this.validData.length) {
                    await this.sleep(500);
                }
            }

            this.completeUpload();

        } catch (error) {
            console.error('❌ Error durante la carga:', error);
            this.showError(`Error durante la carga: ${error.message}`);
            this.isUploading = false;
            this.hideProgressInterface();
        }
    }

    async processBatch(batch, updateExisting, skipErrors) {
        for (const producto of batch) {
            if (!this.isUploading) break;

            try {
                console.log(`📝 Procesando: ${producto.nombre} - ${producto.marca}`);
                
                let result;
                if (updateExisting) {
                    // Verificar si existe
                    const { data: existing } = await window.supabaseClient
                        .from('productos')
                        .select('id')
                        .eq('nombre', producto.nombre)
                        .eq('marca', producto.marca)
                        .single();

                    if (existing) {
                        // Actualizar existente
                        result = await window.supabaseClient
                            .from('productos')
                            .update(producto)
                            .eq('id', existing.id);
                        console.log(`🔄 Producto actualizado: ${producto.nombre}`);
                    } else {
                        // Crear nuevo
                        result = await window.supabaseClient
                            .from('productos')
                            .insert([producto]);
                        console.log(`➕ Producto creado: ${producto.nombre}`);
                    }
                } else {
                    // Solo insertar
                    result = await window.supabaseClient
                        .from('productos')
                        .insert([producto]);
                    console.log(`➕ Producto insertado: ${producto.nombre}`);
                }

                if (result.error) {
                    throw result.error;
                }

                this.uploadStats.successful.push({
                    producto: `${producto.nombre} - ${producto.marca}`,
                    action: updateExisting ? 'actualizado' : 'creado'
                });
                this.uploadStats.processed++;

            } catch (error) {
                console.error(`❌ Error con ${producto.nombre}:`, error);
                
                this.uploadStats.failed.push({
                    producto: `${producto.nombre} - ${producto.marca}`,
                    error: error.message
                });
                this.uploadStats.errors++;

                if (!skipErrors) {
                    throw new Error(`Error con ${producto.nombre}: ${error.message}`);
                }
            }

            // Actualizar progreso
            this.updateProgress();
        }
    }

    showProgressInterface() {
        // Ocultar acciones y mostrar progreso
        this.uploadActions.style.display = 'none';
        this.progressContainer.style.display = 'block';
        this.uploadStatsDiv.style.display = 'block';

        // Habilitar botones de control
        this.pauseUploadBtn.style.display = 'inline-block';
        this.cancelUploadBtn.style.display = 'inline-block';

        // Actualizar interfaz inicial
        this.updateProgress();
    }

    hideProgressInterface() {
        this.progressContainer.style.display = 'none';
        this.uploadStatsDiv.style.display = 'none';
        this.pauseUploadBtn.style.display = 'none';
        this.cancelUploadBtn.style.display = 'none';
        this.uploadActions.style.display = 'block';
    }

    updateProgress() {
        const { processed, total, errors, startTime } = this.uploadStats;
        const percentage = Math.round((processed / total) * 100);
        const elapsed = Date.now() - startTime;
        const remaining = processed > 0 ? (elapsed / processed) * (total - processed) : 0;

        // Actualizar barra de progreso
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}%`;

        // Actualizar detalles
        this.progressDetail.textContent = `${processed} de ${total} productos procesados`;
        
        // Actualizar tiempo
        const elapsedMinutes = Math.floor(elapsed / 60000);
        const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
        const remainingMinutes = Math.floor(remaining / 60000);
        const remainingSeconds = Math.floor((remaining % 60000) / 1000);
        
        this.progressTime.textContent = `Transcurrido: ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')} | Restante: ~${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;

        // Actualizar estadísticas
        this.processedCount.textContent = processed;
        this.errorCount.textContent = errors;
        this.progressPercent.textContent = `${percentage}%`;
        this.processTime.textContent = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;
    }

    completeUpload() {
        this.isUploading = false;
        this.hideProgressInterface();

        const { processed, errors, successful, failed } = this.uploadStats;
        const elapsed = Date.now() - this.uploadStats.startTime;
        const elapsedMinutes = Math.floor(elapsed / 60000);
        const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

        console.log('✅ Carga completada');
        console.log(`📊 Resumen: ${successful.length} exitosos, ${failed.length} fallidos`);

        // Mostrar resultados
        this.showUploadResults();

        // Mostrar mensaje final
        if (errors === 0) {
            this.showSuccess(`🎉 ¡Carga completada con éxito! ${processed} productos cargados en ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`);
        } else {
            this.showWarning(`⚠️ Carga completada con ${errors} errores. ${successful.length} productos cargados exitosamente.`);
        }
    }

    showUploadResults() {
        this.uploadResults.style.display = 'block';
        
        const { successful, failed, processed, errors } = this.uploadStats;
        const elapsed = Date.now() - this.uploadStats.startTime;
        const elapsedTime = Math.floor(elapsed / 1000);

        this.resultsSummary.innerHTML = `
            <div class="results-summary">
                <div class="summary-item success">
                    <i class="fas fa-check-circle"></i>
                    <span class="summary-number">${successful.length}</span>
                    <span class="summary-label">Exitosos</span>
                </div>
                <div class="summary-item error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span class="summary-number">${failed.length}</span>
                    <span class="summary-label">Fallidos</span>
                </div>
                <div class="summary-item info">
                    <i class="fas fa-clock"></i>
                    <span class="summary-number">${elapsedTime}s</span>
                    <span class="summary-label">Tiempo</span>
                </div>
            </div>
            
            ${successful.length > 0 ? `
                <div class="results-section">
                    <h4><i class="fas fa-check-circle text-success"></i> Productos cargados exitosamente:</h4>
                    <ul class="results-list success">
                        ${successful.map(item => `<li>${item.producto} (${item.action})</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${failed.length > 0 ? `
                <div class="results-section">
                    <h4><i class="fas fa-exclamation-circle text-error"></i> Productos con errores:</h4>
                    <ul class="results-list error">
                        ${failed.map(item => `<li><strong>${item.producto}:</strong> ${item.error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    pauseUpload() {
        if (this.isUploading) {
            this.isUploading = false;
            this.showInfo('Carga pausada. Puedes reanudar cuando quieras.');
            this.pauseUploadBtn.textContent = 'Reanudar';
        } else {
            this.isUploading = true;
            this.showInfo('Reanudando carga...');
            this.pauseUploadBtn.textContent = 'Pausar';
            // Continuar desde donde se quedó...
        }
    }

    cancelUpload() {
        this.isUploading = false;
        this.hideProgressInterface();
        this.showWarning('Carga cancelada por el usuario.');
        console.log('🛑 Carga cancelada');
    }

    downloadReport() {
        const { successful, failed, processed, errors, startTime } = this.uploadStats;
        const elapsed = Date.now() - startTime;
        const date = new Date().toLocaleString();

        let reportContent = `Reporte de Carga Masiva CSV\n`;
        reportContent += `Fecha: ${date}\n`;
        reportContent += `Tiempo transcurrido: ${Math.floor(elapsed / 1000)}s\n`;
        reportContent += `Total procesados: ${processed}\n`;
        reportContent += `Exitosos: ${successful.length}\n`;
        reportContent += `Errores: ${failed.length}\n\n`;

        if (successful.length > 0) {
            reportContent += `=== PRODUCTOS CARGADOS EXITOSAMENTE ===\n`;
            successful.forEach(item => {
                reportContent += `✅ ${item.producto} (${item.action})\n`;
            });
            reportContent += `\n`;
        }

        if (failed.length > 0) {
            reportContent += `=== PRODUCTOS CON ERRORES ===\n`;
            failed.forEach(item => {
                reportContent += `❌ ${item.producto}: ${item.error}\n`;
            });
        }

        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-carga-csv-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateStatsDisplay() {
        if (this.processedCount) this.processedCount.textContent = this.uploadStats.processed;
        if (this.errorCount) this.errorCount.textContent = this.uploadStats.errors;
    }

    // Función de diagnóstico de Supabase
    async diagnoseSupabase() {
        console.log('🔍 === DIAGNÓSTICO DE SUPABASE ===');
        
        // Verificar disponibilidad de window.supabase
        console.log('1. window.supabase:', typeof window.supabase);
        console.log('2. window.supabaseClient:', typeof window.supabaseClient);
        
        if (window.supabaseClient) {
            try {
                // Probar conexión básica
                console.log('3. Probando conexión...');
                const { data, error } = await window.supabaseClient
                    .from('productos')
                    .select('id')
                    .limit(1);
                
                if (error) {
                    console.error('❌ Error de conexión:', error);
                    this.showError(`Error de conexión a la base de datos: ${error.message}`);
                } else {
                    console.log('✅ Conexión exitosa. Datos:', data);
                    this.showSuccess('Conexión a Supabase verificada correctamente');
                }
            } catch (error) {
                console.error('❌ Error en prueba de conexión:', error);
                this.showError(`Error probando conexión: ${error.message}`);
            }
        } else {
            console.error('❌ Cliente Supabase no disponible');
            this.showError('Cliente Supabase no está inicializado');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the admin panel page and CSV elements exist
    if (document.getElementById('uploadZone')) {
        // Wait for Supabase to be properly initialized
        const initializeCSVManager = () => {
            if (window.supabaseClient) {
                window.csvUploadManager = new CSVUploadManager();
                console.log('✅ CSV Upload Manager inicializado con cliente Supabase');
            } else {
                console.log('⏳ Esperando inicialización de Supabase...');
                setTimeout(initializeCSVManager, 1000);
            }
        };
        
        initializeCSVManager();
    }
});
