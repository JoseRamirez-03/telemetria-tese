const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// MODIFICACIÓN: CORS configurado para aceptar cualquier origen (vital para la App de Android)
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

// Ruta de prueba para saber si el servidor está vivo en internet
app.get('/', (req, res) => {
    res.send('📡 Servidor de Telemetría TESE - Operativo y listo.');
});

// Guardar un nuevo dato
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

// Enviar los datos al frontend
app.get('/obtener-mapa', async (req, res) => {
    try {
        const datosHistoricos = await Registro.find();
        res.json(datosHistoricos);
    } catch (error) {
        console.error("Error al leer:", error);
        res.status(500).send("Error al leer la base de datos");
    }
});

// Botón de pánico
app.get('/limpiar', async (req, res) => {
    try {
        await Registro.deleteMany({});
        res.send("Base de datos formateada.");
    } catch (error) {
        res.status(500).send("Error al limpiar");
    }
});

// ==========================================
// RUTA SECRETA: PANEL DE ADMINISTRACIÓN
// ==========================================
app.get('/reporte', (req, res) => {
    const htmlDashboard = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="utf-8">
        <title>Dashboard Admin - TESE</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 40px; display: flex; justify-content: center; }
            .dashboard-card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 800px; width: 100%; text-align: center; }
            h1 { color: #002147; font-weight: 800; margin-bottom: 10px; }
            p { color: #666; font-size: 1.1rem; margin-bottom: 40px; }
            .chart-container { position: relative; height: 400px; width: 100%; display: flex; justify-content: center; }
        </style>
    </head>
    <body>
        <div class="dashboard-card">
            <h1>📊 Inteligencia de Negocios</h1>
            <p>Análisis de interacciones en tiempo real - Proyecto TESE</p>
            <div class="chart-container">
                <canvas id="miGrafica"></canvas>
            </div>
        </div>
        <script>
            fetch('/obtener-mapa')
                .then(res => res.json())
                .then(datos => {
                    const datosTienda = datos.filter(d => d.pagina === "App-Tienda");
                    if (datosTienda.length === 0) {
                        document.querySelector('.chart-container').innerHTML = '<h3 style="color:#ff4d4d; margin-top:100px;">⚠️ No hay clics registrados aún.</h3>';
                        return; 
                    }
                    const conteo = {};
                    datosTienda.forEach(d => { 
                        let nombre = d.elemento_clic || "Clic genérico";
                        conteo[nombre] = (conteo[nombre] || 0) + 1; 
                    });
                    new Chart(document.getElementById('miGrafica'), {
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
                                legend: { position: 'right' },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            let valor = context.raw;
                                            let total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                            let porcentaje = ((valor / total) * 100).toFixed(1) + '%';
                                            return context.label + ': ' + valor + ' clics (' + porcentaje + ')';
                                        }
                                    }
                                }
                            }
                        }
                    });
                })
        </script>
    </body>
    </html>`;
    res.send(htmlDashboard);
});

// ==========================================
// 4. INICIO DEL MOTOR (MODIFICADO PARA LA NUBE)
// ==========================================
const PORT = process.env.PORT || 3000;
// Escuchamos en 0.0.0.0 para que acepte conexiones externas (App Android)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Servidor Backend activo en Puerto ${PORT}`);
});