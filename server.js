const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONEXIÓN A TU MONGODB ATLAS
const MONGO_URI = "mongodb+srv://jose1995jusn_db_user:TvdGmnWjlzRE0UJp@joseadmin.gox5yvp.mongodb.net/TelemetriaTESE?appName=joseadmin";

mongoose.connect(MONGO_URI)
    .then(() => console.log("🟢 Conectado a MongoDB Atlas - Equipo TESE"))
    .catch(err => console.error("🔴 Error de conexión:", err));

// 2. MODELO DE DATOS
const Registro = mongoose.model('Registro', new mongoose.Schema({
    x: Number, y: Number, pagina: String, elemento_clic: String, fecha: { type: Date, default: Date.now }
}, { collection: 'clics' }));

// 3. RUTAS
app.get('/', (req, res) => res.send('📡 Servidor TESE Activo'));

app.post('/recibir-clic', async (req, res) => {
    try {
        const nuevo = new Registro(req.body);
        await nuevo.save(); 
        res.status(200).send({ status: "ok" });
    } catch (e) { res.status(500).send(e); }
});

app.get('/obtener-mapa', async (req, res) => {
    try {
        const datos = await Registro.find();
        res.json(datos);
    } catch (e) { res.status(500).send(e); }
});

app.get('/limpiar', async (req, res) => {
    try {
        await Registro.deleteMany({});
        res.send("Base de datos limpia.");
    } catch (e) { res.status(500).send(e); }
});

// 4. DASHBOARD (REPORTE)
app.get('/reporte', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard TESE</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: sans-serif; background: #1c2127; color: white; padding: 20px; text-align: center; }
            .card { background: #2d333b; padding: 20px; border-radius: 15px; max-width: 700px; margin: auto; }
            .chart-container { height: 300px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <h1>📊 Dashboard de Telemetría</h1>
        <div class="card">
            <h3>Interacciones por Producto</h3>
            <div class="chart-container"><canvas id="grafica"></canvas></div>
        </div>
        <script>
            fetch('/obtener-mapa').then(r => r.json()).then(datos => {
                const tienda = datos.filter(d => d.pagina === "Tienda-Final-TESE-Jose");
                const conteo = {};
                tienda.forEach(d => { 
                    let n = d.elemento_clic || "Clic";
                    conteo[n] = (conteo[n] || 0) + 1; 
                });
                new Chart(document.getElementById('grafica'), {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(conteo),
                        datasets: [{ data: Object.values(conteo), backgroundColor: ['#00e5ff', '#ffc107', '#ff4d4d', '#33cc33'] }]
                    },
                    options: { plugins: { legend: { labels: { color: 'white' } } } }
                });
            });
        </script>
    </body>
    </html>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Servidor listo"));
