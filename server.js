const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3000;

// Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Uploads
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

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

// API - barcha e'lonlar
app.get('/api/elonlar', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('elonlar')
            .select('*')
            .order('sana', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Server xatosi" });
    }
});

// API - yangi e'lon
app.post('/api/elonlar', async (req, res) => {
    try {
        const yangi = {
            id: Date.now(),
            rasmlar: [],
            jihozlar: [],
            kommunalka: [],
            sana: new Date().toISOString(),
            views: 0,
            ...req.body
        };
        const { data, error } = await supabase
            .from('elonlar')
            .insert([yangi])
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Server xatosi" });
    }
});

// API - bitta e'lon (views++)
app.get('/api/elonlar/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { data, error } = await supabase
            .from('elonlar')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) return res.status(404).json({ xato: "E'lon topilmadi" });

        // Views++
        await supabase
            .from('elonlar')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id);

        res.json({ ...data, views: (data.views || 0) + 1 });
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Server xatosi" });
    }
});

// API - e'lonni tahrirlash
app.put('/api/elonlar/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { data, error } = await supabase
            .from('elonlar')
            .update(req.body)
            .eq('id', id)
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Server xatosi" });
    }
});

// API - e'lonni o'chirish
app.delete('/api/elonlar/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { error } = await supabase
            .from('elonlar')
            .delete()
            .eq('id', id);
        if (error) throw error;
        res.json({ xabar: "O'chirildi" });
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Server xatosi" });
    }
});

// API - rasm yuklash
app.post('/api/rasm/:id', upload.array('rasmlar', 15), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { data: elon } = await supabase
            .from('elonlar')
            .select('rasmlar')
            .eq('id', id)
            .single();

        const rasmlar = elon?.rasmlar || [];
        req.files.forEach(f => rasmlar.push(`/uploads/${f.filename}`));

        const { error } = await supabase
            .from('elonlar')
            .update({ rasmlar })
            .eq('id', id);
        if (error) throw error;

        res.json({ rasmlar });
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Server xatosi" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ HomeUZ server ishga tushdi!`);
    console.log(`🌐 http://localhost:${PORT}`);
});