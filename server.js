const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONEXIÓN A TU MONGODB ATLAS
const MONGO_URI = "mongodb+srv://jose1995jusn_db_user:TvdGmnWjlzRE0UJp@joseadmin.gox5yvp.mongodb.net/TelemetriaTESE?appName=joseadmin";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🟢 Servidor enlazado a MongoDB Atlas"))
    .catch(err => console.error("🔴 Error de enlace:", err));

// 2. MODELO DE DATOS (Colección: registros)
const Registro = mongoose.model('Registro', new mongoose.Schema({
    x: Number, 
    y: Number, 
    pagina: String, 
    elemento_clic: String, 
    fecha: { type: Date, default: Date.now }
}, { collection: 'registros' }));

// 3. RUTAS DE CONTROL
app.get('/', (req, res) => res.send('📡 Sistema TESE - En línea y esperando datos.'));

// Recibir clics de la App
app.post('/recibir-clic', async (req, res) => {
    try {
        const nuevo = new Registro(req.body);
        await nuevo.save(); 
        res.status(200).send({ status: "Dato guardado" });
    } catch (e) { res.status(500).send(e); }
});

// Obtener datos
app.get('/obtener-mapa', async (req, res) => {
    try {
        const datos = await Registro.find();
        res.json(datos);
    } catch (e) { res.status(500).send(e); }
});

// Ruta para limpiar basura vieja: /limpiar
app.get('/limpiar', async (req, res) => {
    try { 
        await Registro.deleteMany({}); 
        res.send("Base de datos reseteada con éxito."); 
    } catch (e) { res.status(500).send(e); }
});

// 4. DASHBOARD DE INTELIGENCIA (El reporte visual)
app.get('/reporte', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <title>Dashboard TESE</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: sans-serif; background: #1c2127; color: white; padding: 20px; text-align: center; }
            .card { background: #2d333b; padding: 25px; border-radius: 20px; max-width: 800px; margin: auto; border: 1px solid #444; }
            .chart-container { height: 400px; margin-top: 20px; }
            h1 { color: #ffc107; }
        </style>
    </head>
    <body>
        <h1>📊 Dashboard de Telemetría Real-Time</h1>
        <div class="card">
            <h3>Análisis de Interacción por Producto</h3>
            <div class="chart-container"><canvas id="miGrafica"></canvas></div>
        </div>
        <script>
            fetch('/obtener-mapa').then(r => r.json()).then(datos => {
                const filtrados = datos.filter(d => d.pagina === "Tienda-Master-Jose");
                const conteo = {};
                filtrados.forEach(d => { 
                    let n = d.elemento_clic || "Clic General";
                    conteo[n] = (conteo[n] || 0) + 1; 
                });
                new Chart(document.getElementById('miGrafica'), {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(conteo),
                        datasets: [{ 
                            data: Object.values(conteo), 
                            backgroundColor: ['#00e5ff', '#ffc107', '#ff4d4d', '#33cc33', '#cc33ff'],
                            borderColor: '#1c2127',
                            borderWidth: 3
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: 'white', font: { size: 14 } } } }
                    }
                });
            });
        </script>
    </body>
    </html>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Servidor en puerto " + PORT));
