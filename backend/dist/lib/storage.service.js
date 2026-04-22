"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCover = uploadCover;
exports.deleteCover = deleteCover;
exports.getFilenameFromUrl = getFilenameFromUrl;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const BUCKET = 'covers';
const supabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey)
    : null;
async function uploadCover(file, filename, mimetype) {
    if (!supabase)
        throw new Error('Supabase não configurado');
    const { error } = await supabase.storage.from(BUCKET).upload(filename, file, { contentType: mimetype, upsert: true });
    if (error)
        throw new Error(`Erro no upload: ${error.message}`);
    return supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl;
}
async function deleteCover(filename) {
    if (!supabase)
        return;
    try {
        await supabase.storage.from(BUCKET).remove([filename]);
    }
    catch (err) {
        console.error('Erro ao deletar capa:', err);
    }
}
function getFilenameFromUrl(url) {
    return url.split('/').pop() || '';
}
