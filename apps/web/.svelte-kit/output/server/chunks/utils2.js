//#region src/lib/utils.ts
/**
* Derives a human-readable name from a Cloudinary public ID.
* Strips the folder path, random suffix, and underscores.
*
* @example
* nameFromPublicId('notion-clone/my_document_ab12cd') // → 'my document'
*/
function nameFromPublicId(publicId) {
	const last = publicId.split("/").pop() ?? publicId;
	return last.replace(/_[a-z0-9]{6,}$/i, "").replace(/_/g, " ") || last;
}
/**
* Returns true if the URL points to a common image format or a Cloudinary image upload.
*/
function isImageUrl(url) {
	return /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url) || url.includes("/image/upload/");
}
/**
* Formats a byte count into a human-readable string (B / KB / MB).
*/
function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}
//#endregion
export { isImageUrl as n, nameFromPublicId as r, formatBytes as t };
