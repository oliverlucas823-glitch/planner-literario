import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const BUCKET = 'covers'

export async function uploadCover(
  file: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { contentType: mimetype, upsert: true })

  if (error) throw new Error(`Falha no upload: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

export async function deleteCover(filename: string): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).remove([filename])
  } catch (err) {
    console.error('[storage] Falha ao deletar capa:', err)
  }
}

export function getFilenameFromUrl(url: string): string {
  const parts = url.split(`/storage/v1/object/public/${BUCKET}/`)
  return parts.length > 1 ? parts[1] : url.split('/').pop() ?? url
}
