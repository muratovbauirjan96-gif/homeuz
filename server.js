const express = require('express');
const path    = require('path');
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3000;

// Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://imfkvkhwgdpxhdeishtb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_-mCnI51rxeDY-ktcYjB0Bg_yEc9XdKL';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Multer — xotiraga saqlash
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname)));
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

// API - bitta e'lon
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
        await supabase.from('elonlar').update({ views: (data.views || 0) + 1 }).eq('id', id);
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
        const { error } = await supabase.from('elonlar').delete().eq('id', id);
        if (error) throw error;
        res.json({ xabar: "O'chirildi" });
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Server xatosi" });
    }
});

// API - rasm yuklash (Supabase Storage)
app.post('/api/rasm/:id', upload.array('rasmlar', 15), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { data: elon } = await supabase.from('elonlar').select('rasmlar').eq('id', id).single();
        const rasmlar = elon?.rasmlar || [];

        for (const file of req.files) {
            const fileName = `${id}/${Date.now()}_${file.originalname}`;
            const { error: uploadError } = await supabase.storage
                .from('rasmlar')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('rasmlar').getPublicUrl(fileName);
            rasmlar.push(urlData.publicUrl);
        }

        await supabase.from('elonlar').update({ rasmlar }).eq('id', id);
        res.json({ rasmlar });
    } catch(err) {
        console.error(err);
        res.status(500).json({ xato: "Rasm yuklashda xato: " + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ HomeUZ server ishga tushdi!`);
    console.log(`🌐 http://localhost:${PORT}`);
});