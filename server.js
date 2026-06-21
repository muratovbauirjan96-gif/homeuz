const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const app  = express();
const PORT = 3000;

// Uploads papkasi yaratish
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer — rasm saqlash
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename:    (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat rasm yoki video!'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));
app.use(express.json());

// Data fayl
const DATA_FILE = './data.json';

if (!fs.existsSync(DATA_FILE)) {
    const boshlangich = {
        elonlar: [
            { id: 1, nomi: "3 xonali kvartira", narxi: 85000, tur: "sotib", xona: 3, maydon: 85, shahar: "Chilonzor, Toshkent", tavsif: "Yaxshi ta'mirlangan kvartira", ism: "Akbar Toshmatov", telefon: "+998 90 123 45 67", rasmlar: [], jihozlar: ["Muzlatgich", "Konditsioner", "Televizor"], kommunalka: ["Gaz", "Suv", "Elektr", "Internet"] },
            { id: 2, nomi: "2 xonali kvartira", narxi: 400, tur: "ijara", xona: 2, maydon: 62, shahar: "Yunusobod, Toshkent", tavsif: "Qulay joylashgan", ism: "Sardor Rahimov", telefon: "+998 91 234 56 78", rasmlar: [], jihozlar: ["Kravat", "Divan", "Kir yuvish mashinasi"], kommunalka: ["Suv", "Elektr", "Internet", "Lift"] },
            { id: 3, nomi: "4 xonali uy", narxi: 150000, tur: "sotib", xona: 4, maydon: 140, shahar: "Mirzo Ulugbek, Toshkent", tavsif: "Zamonaviy uy", ism: "Jasur Karimov", telefon: "+998 93 345 67 89", rasmlar: [], jihozlar: ["Divan", "Kravat", "Muzlatgich", "Konditsioner", "Televizor", "Plita"], kommunalka: ["Gaz", "Suv", "Elektr", "Internet", "Hovli", "Avtoturargoh"] }
        ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(boshlangich, null, 2));
}

function malumotlarniOl()       { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function malumotlarniSaqla(d)   { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

// API - barcha e'lonlar
app.get('/api/elonlar', (req, res) => {
    res.json(malumotlarniOl().elonlar);
});

// API - yangi e'lon
app.post('/api/elonlar', (req, res) => {
    const data  = malumotlarniOl();
    const yangi = { id: Date.now(), rasmlar: [], jihozlar: [], kommunalka: [], sana: new Date().toISOString(), ...req.body };
    data.elonlar.push(yangi);
    malumotlarniSaqla(data);
    res.json(yangi);
});

// API - bitta e'lon (views++)
app.get('/api/elonlar/:id', (req, res) => {
    const data = malumotlarniOl();
    const elon = data.elonlar.find(e => e.id === parseInt(req.params.id));
    if (!elon) return res.status(404).json({ xato: "E'lon topilmadi" });
    elon.views = (elon.views || 0) + 1;
    malumotlarniSaqla(data);
    res.json(elon);
});

// API - rasm yuklash
app.post('/api/rasm/:id', upload.array('rasmlar', 10), (req, res) => {
    const data = malumotlarniOl();
    const elon = data.elonlar.find(e => e.id === parseInt(req.params.id));
    if (!elon) return res.status(404).json({ xato: "E'lon topilmadi" });
    if (!elon.rasmlar) elon.rasmlar = [];
    req.files.forEach(f => elon.rasmlar.push(`/uploads/${f.filename}`));
    malumotlarniSaqla(data);
    res.json({ rasmlar: elon.rasmlar });
});

// API - e'lonni tahrirlash
app.put('/api/elonlar/:id', (req, res) => {
    const data = malumotlarniOl();
    const index = data.elonlar.findIndex(e => e.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ xato: "E'lon topilmadi" });
    data.elonlar[index] = { ...data.elonlar[index], ...req.body };
    malumotlarniSaqla(data);
    res.json(data.elonlar[index]);
});

// API - e'lon o'chirish
app.delete('/api/elonlar/:id', (req, res) => {
    const data = malumotlarniOl();
    data.elonlar = data.elonlar.filter(e => e.id !== parseInt(req.params.id));
    malumotlarniSaqla(data);
    res.json({ xabar: "O'chirildi" });
});

app.listen(PORT, () => {
    console.log('✅ HomeUZ server ishga tushdi!');
    console.log('🌐 http://localhost:3000');
});