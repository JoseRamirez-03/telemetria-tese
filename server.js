const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

// 1. CONEXIÓN A TU MONGODB
const MONGO_URI = "mongodb+srv://jose1995jusn_db_user:TvdGmnWjlzRE0UJp@joseadmin.gox5yvp.mongodb.net/TelemetriaTESE?appName=joseadmin";
mongoose.connect(MONGO_URI).then(() => console.log("✅ Conectado")).catch(err => console.log(err));

// 2. MODELO
const Registro = mongoose.model('Registro', new mongoose.Schema({
    x: Number, y: Number, pagina: String, elemento_clic: String, fecha: { type: Date, default: Date.now }
}, { collection: 'registros' })); // Usamos tu colección 'registros'

// 3. RUTAS
app.get('/', (req, res) => res.send('📡 Servidor TESE Activo'));

app.post('/recibir-clic', async (req, res) => {
    try {
        const nuevo = new Registro(req.body);
        await nuevo.save();
        res.status(200).send({ status: "Dato guardado" });
    } catch (e) { res.status(500).send(e); }
});

app.get('/obtener-mapa', async (req, res) => {
    try {
        const datos = await Registro.find();
        res.json(datos);
    } catch (e) { res.status(500).send(e); }
});

app.get('/limpiar', async (req, res) => {
    try { await Registro.deleteMany({}); res.send("BD Limpia"); } catch (e) { res.status(500).send(e); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Puerto: " + PORT));
