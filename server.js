const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const app  = express();
const PORT = process.env.PORT || 3000;

// Uploads papkasi
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','video/mp4','video/webm'];
    cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));
app.use(express.json());

// Data fayl
const DATA_FILE = './data.json';
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        elonlar: [
            { id: 1, nomi: "3 xonali kvartira", narxi: 85000, narxTuri: "umumiy", tur: "sotib", xona: 3, maydon: 85, shahar: "Chilonzor, Toshkent", manzil: "Mustaqillik ko'chasi", tavsif: "Yaxshi ta'mirlangan kvartira", ism: "Akbar Toshmatov", telefon: "+998 90 123 45 67", rasmlar: [], jihozlar: ["Muzlatgich","Konditsioner","Televizor"], kommunalka: ["Gaz","Suv","Elektr","Internet"], sana: "2026-06-10T10:00:00.000Z", views: 0 },
            { id: 2, nomi: "2 xonali kvartira", narxi: 400, narxTuri: "oylik", tur: "ijara", xona: 2, maydon: 62, shahar: "Yunusobod, Toshkent", manzil: "Amir Temur ko'chasi", tavsif: "Qulay joylashgan", ism: "Sardor Rahimov", telefon: "+998 91 234 56 78", rasmlar: [], jihozlar: ["Kravat","Divan","Kir yuvish mashinasi"], kommunalka: ["Suv","Elektr","Internet","Lift"], sana: "2026-06-12T14:00:00.000Z", views: 0 },
            { id: 3, nomi: "4 xonali uy", narxi: 150000, narxTuri: "umumiy", tur: "sotib", xona: 4, maydon: 140, shahar: "Mirzo Ulugbek, Toshkent", manzil: "Universitet ko'chasi", tavsif: "Zamonaviy uy", ism: "Jasur Karimov", telefon: "+998 93 345 67 89", rasmlar: [], jihozlar: ["Divan","Kravat","Muzlatgich","Konditsioner","Televizor","Plita"], kommunalka: ["Gaz","Suv","Elektr","Internet","Hovli","Avtoturargoh"], sana: "2026-06-14T09:00:00.000Z", views: 0 }
        ]
    }, null, 2));
}

function malumotlarniOl() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function malumotlarniSaqla(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

// API
app.get('/api/elonlar', (req, res) => {
    res.json(malumotlarniOl().elonlar);
});

app.post('/api/elonlar', (req, res) => {
    const data  = malumotlarniOl();
    const yangi = { id: Date.now(), rasmlar: [], jihozlar: [], kommunalka: [], sana: new Date().toISOString(), views: 0, ...req.body };
    data.elonlar.push(yangi);
    malumotlarniSaqla(data);
    res.json(yangi);
});

app.get('/api/elonlar/:id', (req, res) => {
    const data = malumotlarniOl();
    const elon = data.elonlar.find(e => e.id === parseInt(req.params.id));
    if (!elon) return res.status(404).json({ xato: "E'lon topilmadi" });
    elon.views = (elon.views || 0) + 1;
    malumotlarniSaqla(data);
    res.json(elon);
});

app.put('/api/elonlar/:id', (req, res) => {
    const data  = malumotlarniOl();
    const index = data.elonlar.findIndex(e => e.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ xato: "E'lon topilmadi" });
    data.elonlar[index] = { ...data.elonlar[index], ...req.body };
    malumotlarniSaqla(data);
    res.json(data.elonlar[index]);
});

app.delete('/api/elonlar/:id', (req, res) => {
    const data = malumotlarniOl();
    data.elonlar = data.elonlar.filter(e => e.id !== parseInt(req.params.id));
    malumotlarniSaqla(data);
    res.json({ xabar: "O'chirildi" });
});

app.post('/api/rasm/:id', upload.array('rasmlar', 15), (req, res) => {
    const data = malumotlarniOl();
    const elon = data.elonlar.find(e => e.id === parseInt(req.params.id));
    if (!elon) return res.status(404).json({ xato: "E'lon topilmadi" });
    if (!elon.rasmlar) elon.rasmlar = [];
    req.files.forEach(f => elon.rasmlar.push(`/uploads/${f.filename}`));
    malumotlarniSaqla(data);
    res.json({ rasmlar: elon.rasmlar });
});

app.listen(PORT, () => {
    console.log(`✅ HomeUZ server ishga tushdi!`);
    console.log(`🌐 http://localhost:${PORT}`);
});