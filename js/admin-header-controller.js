/**
 * ADMIN PANEL HEADER - JavaScript Controller
 * Manejo dinámico del estado de conexión y funcionalidad del header
 * Fecha: 13 Enero 2025
 */

class AdminHeaderController {
    constructor() {
        this.connectionStatus = document.getElementById('connectionStatus');
        this.refreshButton = document.getElementById('refreshData');
        this.connectionState = 'connecting'; // connecting, connected, disconnected, error, maintenance
        this.lastStatusUpdate = Date.now();
        this.statusCheckInterval = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startStatusMonitoring();
        this.setInitialState();
    }

    setupEventListeners() {
        // Botón de actualizar
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRefresh();
            });
        }

        // Click en estado de conexión para mostrar detalles
        if (this.connectionStatus) {
            this.connectionStatus.addEventListener('click', () => {
                this.showConnectionDetails();
            });
        }

        // Monitorear cambios de red
        window.addEventListener('online', () => {
            this.updateConnectionStatus('connected', 'Conectado');
        });

        window.addEventListener('offline', () => {
            this.updateConnectionStatus('disconnected', 'Sin conexión');
        });
    }

    setInitialState() {
        // Iniciar con estado de conexión
        this.updateConnectionStatus('connecting', 'Conectando...');
        
        // Simular verificación de conexión inicial
        setTimeout(() => {
            this.checkConnection();
        }, 1500);
    }

    startStatusMonitoring() {
        // Verificar estado cada 30 segundos
        this.statusCheckInterval = setInterval(() => {
            this.checkConnection();
        }, 30000);
    }

    async checkConnection() {
        try {
            // Verificar conexión a Supabase si está disponible
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('productos')
                    .select('id')
                    .limit(1);

                if (error) {
                    throw error;
                }

                this.updateConnectionStatus('connected', 'Conectado');
                this.lastStatusUpdate = Date.now();
            } else {
                // Verificar conexión básica de red
                const response = await fetch('https://www.google.com/favicon.ico', {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache'
                });

                this.updateConnectionStatus('connected', 'Conectado');
                this.lastStatusUpdate = Date.now();
            }
        } catch (error) {
            console.warn('Error de conexión:', error);
            this.updateConnectionStatus('error', 'Error de conexión');
        }
    }

    updateConnectionStatus(state, message) {
        if (!this.connectionStatus) return;

        // Remover clases de estado anteriores
        this.connectionStatus.classList.remove(
            'connected', 'connecting', 'disconnected', 'error', 'maintenance'
        );

        // Agregar nueva clase de estado
        this.connectionStatus.classList.add(state);
        this.connectionState = state;

        // Actualizar icono y mensaje
        const icon = this.connectionStatus.querySelector('i');
        const span = this.connectionStatus.querySelector('span');

        if (icon && span) {
            // Configurar icono según estado
            icon.className = this.getIconForState(state);
            span.textContent = message;
        }

        // Actualizar título para accesibilidad
        this.connectionStatus.title = `Estado: ${message} - ${new Date().toLocaleTimeString()}`;
    }

    getIconForState(state) {
        const icons = {
            connected: 'fas fa-circle',
            connecting: 'fas fa-sync-alt',
            disconnected: 'fas fa-exclamation-circle',
            error: 'fas fa-times-circle',
            maintenance: 'fas fa-tools'
        };

        return icons[state] || 'fas fa-question-circle';
    }

    async handleRefresh() {
        if (!this.refreshButton) return;

        // Agregar clase loading
        this.refreshButton.classList.add('loading');
        this.refreshButton.disabled = true;

        const originalText = this.refreshButton.querySelector('span')?.textContent || 'Actualizar';

        try {
            // Actualizar texto del botón
            const buttonText = this.refreshButton.querySelector('span');
            if (buttonText) {
                buttonText.textContent = 'Actualizando...';
            }

            // Verificar conexión
            await this.checkConnection();

            // Disparar evento personalizado para que otros componentes se actualicen
            window.dispatchEvent(new CustomEvent('adminRefresh', {
                detail: { timestamp: Date.now() }
            }));

            // Mostrar mensaje de éxito temporal
            if (buttonText) {
                buttonText.textContent = '¡Actualizado!';
                setTimeout(() => {
                    buttonText.textContent = originalText;
                }, 1500);
            }

        } catch (error) {
            console.error('Error al actualizar:', error);
            
            // Mostrar mensaje de error temporal
            const buttonText = this.refreshButton.querySelector('span');
            if (buttonText) {
                buttonText.textContent = 'Error';
                setTimeout(() => {
                    buttonText.textContent = originalText;
                }, 2000);
            }
        } finally {
            // Remover estado loading después de un delay
            setTimeout(() => {
                this.refreshButton.classList.remove('loading');
                this.refreshButton.disabled = false;
            }, 1000);
        }
    }

    showConnectionDetails() {
        const details = {
            estado: this.connectionState,
            ultimaActualizacion: new Date(this.lastStatusUpdate).toLocaleString(),
            navegadorOnline: navigator.onLine,
            timestamp: Date.now()
        };

        // Mostrar detalles en consola para debugging
        console.log('Estado de conexión:', details);

        // Opcional: Mostrar modal o tooltip con detalles
        this.showConnectionTooltip(details);
    }

    showConnectionTooltip(details) {
        // Crear tooltip temporal
        const tooltip = document.createElement('div');
        tooltip.className = 'connection-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <h4>Estado de Conexión</h4>
                <p><strong>Estado:</strong> ${this.getStateText(details.estado)}</p>
                <p><strong>Última verificación:</strong> ${details.ultimaActualizacion}</p>
                <p><strong>Navegador online:</strong> ${details.navegadorOnline ? 'Sí' : 'No'}</p>
            </div>
        `;

        // Estilos del tooltip
        tooltip.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            font-size: 0.8rem;
            z-index: 1000;
            min-width: 200px;
            margin-top: 0.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.3s ease;
        `;

        // Agregar al status
        this.connectionStatus.style.position = 'relative';
        this.connectionStatus.appendChild(tooltip);

        // Remover después de 3 segundos
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    tooltip.remove();
                }, 300);
            }
        }, 3000);
    }

    getStateText(state) {
        const stateTexts = {
            connected: 'Conectado correctamente',
            connecting: 'Estableciendo conexión...',
            disconnected: 'Desconectado',
            error: 'Error de conexión',
            maintenance: 'En mantenimiento'
        };

        return stateTexts[state] || 'Estado desconocido';
    }

    // Método para forzar un estado específico (útil para testing)
    forceState(state, message) {
        this.updateConnectionStatus(state, message || this.getStateText(state));
    }

    // Método para simular mantenimiento
    setMaintenanceMode(message = 'Mantenimiento programado') {
        this.updateConnectionStatus('maintenance', message);
    }

    // Cleanup
    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }

        // Remover event listeners
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
    }
}

// Estilos CSS para el tooltip (agregados dinámicamente)
const tooltipStyles = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    .connection-tooltip h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #f093fb;
    }
    
    .connection-tooltip p {
        margin: 0.25rem 0;
        font-size: 0.75rem;
    }
`;

// Agregar estilos al documento
if (!document.getElementById('header-tooltip-styles')) {
    const style = document.createElement('style');
    style.id = 'header-tooltip-styles';
    style.textContent = tooltipStyles;
    document.head.appendChild(style);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para asegurar que otros scripts se hayan cargado
    setTimeout(() => {
        window.adminHeaderController = new AdminHeaderController();
    }, 500);
});

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminHeaderController;
}
