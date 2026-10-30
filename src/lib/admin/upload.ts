/** Uploads a file through /admin/uploads and resolves to its public URL. */
export async function uploadFile(file: Blob, filename: string): Promise<string> {
	const body = new FormData();
	body.set('file', file, filename);
	const response = await fetch('/admin/uploads', { method: 'POST', body });
	const result = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(result.message ?? 'Upload failed.');
	return result.url;
}
