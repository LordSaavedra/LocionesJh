/**
 * CSV Upload Manager
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
        this.uploadStats = document.getElementById('uploadStats');
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
        
        // Debug event
        if (this.debugDataBtn) {
            this.debugDataBtn.addEventListener('click', () => this.debugData());
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

        // Parse data rows
        const dataRows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            console.log(`📄 Fila ${i + 1} valores:`, values);
            
            if (values.length === headers.length) {
                const rowData = {};
                headers.forEach((header, index) => {
                    const normalizedHeader = header.trim().toLowerCase();
                    rowData[normalizedHeader] = values[index] ? values[index].trim() : '';
                });
                console.log(`📄 Fila ${i + 1} procesada:`, rowData);
                dataRows.push({
                    row: i + 1,
                    data: rowData
                });
            } else {
                console.log(`⚠️ Fila ${i + 1} ignorada - columnas no coinciden: esperadas ${headers.length}, encontradas ${values.length}`);
            }
        }

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
        
        // Show debug button
        if (this.debugDataBtn) {
            this.debugDataBtn.style.display = 'inline-block';
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

        // Optional field validations
        if (data.subcategoria && data.subcategoria.trim()) {
            const validSubcategories = ['designer', 'arabic', 'contemporary', 'vintage'];
            if (!validSubcategories.includes(data.subcategoria.toLowerCase().trim())) {
                console.log(`❌ Fila ${rowNumber}: Subcategoría inválida:`, data.subcategoria);
                errors.push('Subcategoría inválida. Debe ser: designer, arabic, contemporary, o vintage');
            }
        }

        if (data.ml && data.ml.trim()) {
            const ml = parseInt(data.ml);
            if (isNaN(ml) || ml < 1 || ml > 1000) {
                console.log(`❌ Fila ${rowNumber}: ML inválido:`, data.ml);
                errors.push('ML debe ser un número entre 1 y 1000');
            }
        }

        if (data.stock && data.stock.trim()) {
            const stock = parseInt(data.stock);
            if (isNaN(stock) || stock < 0) {
                console.log(`❌ Fila ${rowNumber}: Stock inválido:`, data.stock);
                errors.push('Stock debe ser un número mayor o igual a 0');
            }
        }

        if (data.descuento && data.descuento.trim()) {
            const descuento = parseInt(data.descuento);
            if (isNaN(descuento) || descuento < 1 || descuento > 99) {
                console.log(`❌ Fila ${rowNumber}: Descuento inválido:`, data.descuento);
                errors.push('Descuento debe ser un número entre 1 y 99');
            }
        }

        if (data.estado && data.estado.trim()) {
            const validEstados = ['disponible', 'agotado', 'proximo', 'oferta'];
            if (!validEstados.includes(data.estado.toLowerCase().trim())) {
                console.log(`❌ Fila ${rowNumber}: Estado inválido:`, data.estado);
                errors.push('Estado inválido. Debe ser: disponible, agotado, proximo, u oferta');
            }
        }

        if (data.luxury && data.luxury.trim()) {
            const luxury = data.luxury.toLowerCase().trim();
            if (!['true', 'false', '1', '0', 'yes', 'no', 'si', 'no'].includes(luxury)) {
                console.log(`❌ Fila ${rowNumber}: Luxury inválido:`, data.luxury);
                errors.push('Luxury debe ser true/false o 1/0');
            }
        }

        if (data.activo && data.activo.trim()) {
            const activo = data.activo.toLowerCase().trim();
            if (!['true', 'false', '1', '0', 'yes', 'no', 'si', 'no'].includes(activo)) {
                console.log(`❌ Fila ${rowNumber}: Activo inválido:`, data.activo);
                errors.push('Activo debe ser true/false o 1/0');
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

    async startUpload() {
        if (!this.validData || this.validData.length === 0) {
            this.showError('No hay datos válidos para cargar.');
            return;
        }

        this.isUploading = true;
        this.uploadStats.startTime = Date.now();
        this.uploadStats.total = this.validData.length;
        this.uploadStats.processed = 0;
        this.uploadStats.errors = 0;

        // Show progress elements
        this.progressContainer.style.display = 'block';
        this.uploadStats.style.display = 'block';
        this.startUploadBtn.style.display = 'none';
        this.pauseUploadBtn.style.display = 'inline-block';
        this.cancelUploadBtn.style.display = 'inline-block';

        // Get configuration
        const config = {
            skipErrors: this.skipErrors.checked,
            updateExisting: this.updateExisting.checked,
            validateImages: this.validateImages.checked,
            batchSize: parseInt(this.batchSize.value)
        };

        try {
            await this.processBatches(this.validData, config);
            this.showUploadResults(true);
            this.showSuccess(`¡Carga completada! Se procesaron ${this.uploadStats.processed} productos exitosamente.`);
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Error durante la carga: ' + error.message);
            this.showUploadResults(false);
        } finally {
            this.isUploading = false;
            this.hideUploadControls();
        }
    }

    async processBatches(data, config) {
        const batches = [];
        
        // Split data into batches
        for (let i = 0; i < data.length; i += config.batchSize) {
            batches.push(data.slice(i, i + config.batchSize));
        }

        // Process each batch
        for (let i = 0; i < batches.length; i++) {
            if (!this.isUploading) break; // Check if cancelled
            
            const batch = batches[i];
            this.updateProgress(`Procesando lote ${i + 1} de ${batches.length}...`);
            
            try {
                await this.uploadBatch(batch, config);
            } catch (error) {
                console.error(`Error in batch ${i + 1}:`, error);
                if (!config.skipErrors) {
                    throw error;
                }
            }
            
            // Update progress
            const progress = ((i + 1) / batches.length) * 100;
            this.updateProgressBar(progress);
        }
    }

    async uploadBatch(batch, config) {
        const promises = batch.map(item => this.uploadSingleProduct(item, config));
        await Promise.allSettled(promises);
    }

    async uploadSingleProduct(productData, config) {
        try {
            // Check if product exists (if updateExisting is enabled)
            let existingProduct = null;
            if (config.updateExisting) {
                existingProduct = await this.findExistingProduct(productData.nombre, productData.marca);
            }

            let result;
            if (existingProduct) {
                // Update existing product
                result = await supabaseClient
                    .from('productos')
                    .update(productData)
                    .eq('id', existingProduct.id);
            } else {
                // Insert new product
                result = await supabaseClient
                    .from('productos')
                    .insert([productData]);
            }

            if (result.error) {
                throw new Error(result.error.message);
            }

            this.uploadStats.processed++;
            this.updateStatsDisplay();

        } catch (error) {
            console.error('Error uploading product:', error);
            this.uploadStats.errors++;
            this.updateStatsDisplay();
            throw error;
        }
    }

    async findExistingProduct(nombre, marca) {
        try {
            const { data, error } = await supabaseClient
                .from('productos')
                .select('id')
                .eq('nombre', nombre)
                .eq('marca', marca)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error finding existing product:', error);
            return null;
        }
    }

    updateProgress(message) {
        this.progressDetail.textContent = message;
        
        // Update time estimate
        if (this.uploadStats.startTime) {
            const elapsed = (Date.now() - this.uploadStats.startTime) / 1000;
            const remaining = this.uploadStats.total - this.uploadStats.processed;
            const rate = this.uploadStats.processed / elapsed;
            const estimate = remaining / rate;
            
            this.progressTime.textContent = `Tiempo estimado: ${this.formatTime(estimate)}`;
        }
    }

    updateProgressBar(percentage) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${Math.round(percentage)}%`;
        this.progressPercent.textContent = `${Math.round(percentage)}%`;
    }

    updateStatsDisplay() {
        this.processedCount.textContent = this.uploadStats.processed;
        this.errorCount.textContent = this.uploadStats.errors;
        
        if (this.uploadStats.startTime) {
            const elapsed = (Date.now() - this.uploadStats.startTime) / 1000;
            this.processTime.textContent = this.formatTime(elapsed);
        }
    }

    formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.round(seconds % 60);
            return `${minutes}m ${secs}s`;
        }
    }

    pauseUpload() {
        this.isUploading = false;
        this.pauseUploadBtn.style.display = 'none';
        this.startUploadBtn.style.display = 'inline-block';
        this.startUploadBtn.innerHTML = '<i class="fas fa-play"></i> Continuar Carga';
    }

    cancelUpload() {
        this.isUploading = false;
        this.hideUploadControls();
        this.progressContainer.style.display = 'none';
        this.resetUpload();
    }

    hideUploadControls() {
        this.startUploadBtn.style.display = 'inline-block';
        this.pauseUploadBtn.style.display = 'none';
        this.cancelUploadBtn.style.display = 'none';
        this.startUploadBtn.innerHTML = '<i class="fas fa-upload"></i> Iniciar Carga Masiva';
    }

    showUploadResults(success) {
        this.uploadResults.style.display = 'block';
        
        const totalProcessed = this.uploadStats.processed;
        const totalErrors = this.uploadStats.errors;
        const totalTime = this.uploadStats.startTime ? 
            (Date.now() - this.uploadStats.startTime) / 1000 : 0;

        this.resultsSummary.innerHTML = `
            <div class="results-grid">
                <div class="result-item ${success ? 'success' : 'error'}">
                    <h4>
                        <i class="fas fa-${success ? 'check-circle' : 'exclamation-circle'}"></i>
                        ${success ? 'Carga Completada' : 'Carga con Errores'}
                    </h4>
                    <p><strong>Productos procesados:</strong> ${totalProcessed}</p>
                    <p><strong>Errores:</strong> ${totalErrors}</p>
                    <p><strong>Tiempo total:</strong> ${this.formatTime(totalTime)}</p>
                    <p><strong>Tasa de éxito:</strong> ${Math.round((totalProcessed / (totalProcessed + totalErrors)) * 100)}%</p>
                </div>
            </div>
        `;
    }

    downloadReport() {
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.uploadStats,
            validData: this.validData,
            errors: this.errors
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `upload-report-${new Date().toISOString().split('T')[0]}.json`;
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
        this.uploadStats.style.display = 'none';
        
        // Hide debug button
        if (this.debugDataBtn) {
            this.debugDataBtn.style.display = 'none';
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

    downloadTemplate() {
        const headers = [
            'nombre', 'marca', 'precio', 'categoria', 'subcategoria',
            'descripcion', 'notas', 'imagen_url', 'ml', 'stock',
            'estado', 'descuento', 'luxury', 'activo'
        ];

        const sampleData = [
            [
                'Polo Blue', 'Ralph Lauren', '89000', 'para-ellos', 'contemporary',
                'Fragancia fresca y marina', 'Notas acuáticas, melón, mandarina',
                'https://example.com/polo-blue.jpg', '125', '15',
                'disponible', '', 'false', 'true'
            ],
            [
                'Black Opium', 'Yves Saint Laurent', '165000', 'para-ellas', 'designer',
                'Perfume oriental y seductor', 'Café negro, vainilla, flor de naranja',
                'https://example.com/black-opium.jpg', '90', '8',
                'disponible', '15', 'true', 'true'
            ],
            [
                'Acqua Di Gio', 'Giorgio Armani', '149000', 'para-ellos', 'designer',
                'Fragancia fresca y acuática', 'Bergamota, neroli, cedro',
                'https://example.com/acqua-di-gio.jpg', '100', '10',
                'disponible', '10', 'true', 'true'
            ],
            [
                'La Vie Est Belle', 'Lancôme', '172000', 'para-ellas', 'designer',
                'Fragancia floral y dulce', 'Iris, jazmín, flor de azahar',
                'https://example.com/la-vie-est-belle.jpg', '75', '12',
                'disponible', '', 'true', 'true'
            ],
            [
                '1 Million', 'Paco Rabanne', '135000', 'para-ellos', 'designer',
                'Fragancia intensa y especiada', 'Canela, cuero, mandarina roja',
                'https://example.com/1-million.jpg', '100', '20',
                'disponible', '5', 'false', 'true'
            ]
        ];

        let csvContent = headers.join(',') + '\n';
        sampleData.forEach(row => {
            // Escapar comillas dobles dentro del contenido y envolver en comillas
            csvContent += row.map(field => {
                const cleanField = String(field).replace(/"/g, '""'); // Escapar comillas dobles
                return `"${cleanField}"`; // Envolver en comillas
            }).join(',') + '\n';
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the admin panel page and CSV elements exist
    if (document.getElementById('uploadZone')) {
        window.csvUploadManager = new CSVUploadManager();
    }
});
