const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. CONEXIÓN A MONGODB ATLAS
// ==========================================
const MONGO_URI = "mongodb+srv://jose1995jusn_db_user:TvdGmnWjlzRE0UJp@joseadmin.gox5yvp.mongodb.net/TelemetriaTESE?appName=joseadmin";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🟢 Conectado exitosamente a MongoDB Atlas"))
    .catch(err => console.error("🔴 Error fatal al conectar a MongoDB:", err));

// ==========================================
// 2. MODELO DE DATOS
// ==========================================
const esquemaClic = new mongoose.Schema({
    x: Number,
    y: Number,
    pagina: String,
    evento: String,
    dispositivo: String,
    seccion_texto: String, 
    elemento_clic: String, 
    fecha: { type: Date, default: Date.now } 
});

const Registro = mongoose.model('Registro', esquemaClic);

// ==========================================
// 3. RUTAS DEL SERVIDOR (APIs)
// ==========================================

app.get('/', (req, res) => {
    res.send('📡 Servidor de Telemetría TESE - Operativo y listo.');
});

app.post('/recibir-clic', async (req, res) => {
    try {
        const nuevoRegistro = new Registro(req.body);
        await nuevoRegistro.save(); 
        res.status(200).send({ status: "Dato inyectado en MongoDB" });
    } catch (error) {
        console.error("Error al guardar:", error);
        res.status(500).send("Error interno al guardar");
    }
});

app.get('/obtener-mapa', async (req, res) => {
    try {
        const datosHistoricos = await Registro.find();
        res.json(datosHistoricos);
    } catch (error) {
        console.error("Error al leer:", error);
        res.status(500).send("Error al leer la base de datos");
    }
});

app.get('/limpiar', async (req, res) => {
    try {
        await Registro.deleteMany({});
        res.send("Base de datos formateada.");
    } catch (error) {
        res.status(500).send("Error al limpiar");
    }
});

// ==========================================
// RUTA: PANEL DE ADMINISTRACIÓN DUAL
// ==========================================
app.get('/reporte', (req, res) => {
    const htmlDashboard = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="utf-8">
        <title>Dashboard Dual - TESE</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
            .dashboard-card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 90%; max-width: 800px; text-align: center; margin-bottom: 30px; }
            h1 { color: #002147; font-weight: 800; margin-bottom: 5px; }
            h2 { color: #004b93; border-bottom: 2px solid #00e5ff; display: inline-block; padding-bottom: 5px; margin-bottom: 25px; }
            .chart-container { position: relative; height: 300px; width: 100%; display: flex; justify-content: center; margin-bottom: 20px; }
            .status-empty { color: #888; font-style: italic; margin-top: 50px; }
        </style>
    </head>
    <body>
        <h1>📊 Dashboard de Inteligencia de Negocios</h1>
        <p>Administración y Configuración de Redes - Proyecto José 2026</p>

        <div class="dashboard-card">
            <h2>🛒 Telemetría de Ventas (Tienda)</h2>
            <div id="cont-tienda" class="chart-container">
                <canvas id="graficaTienda"></canvas>
            </div>
        </div>

        <div class="dashboard-card">
            <h2>📝 Telemetría de Contenido (Blog IA)</h2>
            <div id="cont-blog" class="chart-container">
                <canvas id="graficaBlog"></canvas>
            </div>
        </div>

        <script>
            fetch('/obtener-mapa')
                .then(res => res.json())
                .then(datos => {
                    
                    // 1. PROCESAR DATOS TIENDA
                    const datosTienda = datos.filter(d => d.pagina === "App-Tienda");
                    if (datosTienda.length > 0) {
                        const conteoT = {};
                        datosTienda.forEach(d => { 
                            let nombre = d.elemento_clic || "Interacción";
                            conteoT[nombre] = (conteoT[nombre] || 0) + 1; 
                        });
                        crearGrafica('graficaTienda', conteoT, 'Interacciones de Compra');
                    } else {
                        document.getElementById('cont-tienda').innerHTML = '<p class="status-empty">Sin datos de la tienda aún.</p>';
                    }

                    // 2. PROCESAR DATOS BLOG
                    const datosBlog = datos.filter(d => d.pagina === "blog-ia-index");
                    if (datosBlog.length > 0) {
                        const conteoB = {};
                        datosBlog.forEach(d => { 
                            let nombre = d.seccion_texto || "Lectura General";
                            conteoB[nombre] = (conteoB[nombre] || 0) + 1; 
                        });
                        crearGrafica('graficaBlog', conteoB, 'Temas de Interés');
                    } else {
                        document.getElementById('cont-blog').innerHTML = '<p class="status-empty">Sin datos de lectura del blog aún.</p>';
                    }
                });

            function crearGrafica(id, conteo, titulo) {
                new Chart(document.getElementById(id), {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(conteo),
                        datasets: [{
                            data: Object.values(conteo),
                            backgroundColor: ['#00e5ff', '#002147', '#ff4d4d', '#ffcc00', '#33cc33', '#cc33ff', '#ff9900'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'right' }
                        }
                    }
                });
            }
        </script>
    </body>
    </html>`;
    res.send(htmlDashboard);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor Backend activo en Puerto ${PORT}`);
});
