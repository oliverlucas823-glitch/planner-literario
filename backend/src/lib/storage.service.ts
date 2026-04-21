import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''
const BUCKET = 'covers'

const supabase = supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function uploadCover(file: Buffer, filename: string, mimetype: string): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado')
  const { error } = await supabase.storage.from(BUCKET).upload(filename, file, { contentType: mimetype, upsert: true })
  if (error) throw new Error(`Erro no upload: ${error.message}`)
  return supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl
}

export async function deleteCover(filename: string): Promise<void> {
  if (!supabase) return
  try {
    await supabase.storage.from(BUCKET).remove([filename])
  } catch (err) {
    console.error('Erro ao deletar capa:', err)
  }
}

export function getFilenameFromUrl(url: string): string {
  return url.split('/').pop() || ''
}
