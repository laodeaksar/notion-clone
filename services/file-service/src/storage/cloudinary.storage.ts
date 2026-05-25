import type {
  UploadInput,
  UploadResult,
  DeleteResult,
  ListResult,
  FileListItem,
  MoveInput,
  MoveResult
} from '../types/file.types';

const apiBase = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${cloudName}`;

async function sha1hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const buffer  = await crypto.subtle.digest('SHA-1', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildSignature(
  params: Record<string, string | number>,
  apiSecret: string
): Promise<string> {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return sha1hex(sorted + apiSecret);
}

function basicAuth(apiKey: string, apiSecret: string): string {
  return 'Basic ' + btoa(`${apiKey}:${apiSecret}`);
}

function resourceTypeFromMime(contentType?: string | null): 'image' | 'video' | 'raw' {
  if (!contentType) return 'image';
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return 'raw';
}

function mimeFromFormat(format: string): string {
  const map: Record<string, string> = {
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    gif:  'image/gif',
    webp: 'image/webp',
    svg:  'image/svg+xml',
    pdf:  'application/pdf',
    mp4:  'video/mp4',
    mov:  'video/quicktime',
    avi:  'video/x-msvideo',
    mp3:  'audio/mpeg',
    wav:  'audio/wav',
    zip:  'application/zip',
    txt:  'text/plain',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[format.toLowerCase()] ?? 'application/octet-stream';
}

export async function uploadToCloudinary(
  input: UploadInput,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  defaultFolder: string
): Promise<UploadResult> {
  const folder    = input.folder ?? defaultFolder;
  const timestamp = Math.floor(Date.now() / 1000);
  const baseName  = input.filename
    ? input.filename.replace(/\.[^.]+$/, '')
    : crypto.randomUUID();
  const publicId = `${folder}/${baseName}`;

  const paramsToSign: Record<string, string | number> = {
    folder,
    public_id: publicId,
    timestamp,
  };

  const signature = await buildSignature(paramsToSign, apiSecret);

  const form = new FormData();
  form.append('file',      input.data);
  form.append('api_key',   apiKey);
  form.append('timestamp', timestamp.toString());
  form.append('signature', signature);
  form.append('folder',    folder);
  form.append('public_id', publicId);

  const res = await fetch(`${apiBase(cloudName)}/auto/upload`, {
    method: 'POST',
    body:   form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const data = await res.json() as {
    public_id:         string;
    secure_url:        string;
    bytes:             number;
    original_filename: string;
    format:            string;
    resource_type:     string;
  };

  return {
    url:         data.secure_url,
    publicId:    data.public_id,
    provider:    'cloudinary',
    size:        data.bytes,
    name:        input.filename ?? `${data.original_filename}.${data.format}`,
    contentType: mimeFromFormat(data.format),
  };
}

export async function uploadFileToCloudinary(
  file: File,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  defaultFolder: string,
  folder?: string,
  filename?: string
): Promise<UploadResult> {
  const resolvedFolder = folder ?? defaultFolder;
  const baseName = filename
    ? filename.replace(/\.[^.]+$/, '')
    : (file.name ? file.name.replace(/\.[^.]+$/, '') : crypto.randomUUID());
  const publicId  = `${resolvedFolder}/${baseName}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    folder:    resolvedFolder,
    public_id: publicId,
    timestamp,
  };

  const signature = await buildSignature(paramsToSign, apiSecret);

  const form = new FormData();
  form.append('file',      file);
  form.append('api_key',   apiKey);
  form.append('timestamp', timestamp.toString());
  form.append('signature', signature);
  form.append('folder',    resolvedFolder);
  form.append('public_id', publicId);

  const res = await fetch(`${apiBase(cloudName)}/auto/upload`, {
    method: 'POST',
    body:   form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  const data = await res.json() as {
    public_id:         string;
    secure_url:        string;
    bytes:             number;
    original_filename: string;
    format:            string;
    resource_type:     string;
  };

  return {
    url:         data.secure_url,
    publicId:    data.public_id,
    provider:    'cloudinary',
    size:        data.bytes,
    name:        filename ?? file.name ?? `${data.original_filename}.${data.format}`,
    contentType: file.type || mimeFromFormat(data.format),
  };
}

export async function deleteFromCloudinary(
  publicId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  contentType?: string | null
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { public_id: publicId, timestamp };
  const signature    = await buildSignature(paramsToSign, apiSecret);

  const body = new URLSearchParams({
    public_id: publicId,
    api_key:   apiKey,
    timestamp: timestamp.toString(),
    signature,
  });

  const primary  = resourceTypeFromMime(contentType);
  const fallbacks = (['image', 'video', 'raw'] as const).filter(t => t !== primary);

  for (const type of [primary, ...fallbacks]) {
    const res = await fetch(`${apiBase(cloudName)}/${type}/destroy`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    if (res.ok) {
      const result = await res.json() as { result: string };
      if (result.result === 'ok') return;
    }
  }

  throw new Error(`Object not found: ${publicId}`);
}

export async function listFromCloudinary(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  folder?: string,
  cursor?: string,
  limit: number = 100
): Promise<{ items: FileListItem[]; truncated: boolean; cursor: string | null }> {
  const params = new URLSearchParams({ max_results: limit.toString() });
  if (folder) params.set('prefix', folder);
  if (cursor) params.set('next_cursor', cursor);

  const res = await fetch(
    `${apiBase(cloudName)}/resources?${params}`,
    { headers: { Authorization: basicAuth(apiKey, apiSecret) } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary list failed: ${text}`);
  }

  const data = await res.json() as {
    resources: Array<{
      public_id:  string;
      secure_url: string;
      bytes:      number;
      created_at: string;
    }>;
    next_cursor?: string;
  };

  const items: FileListItem[] = data.resources.map(r => ({
    publicId:   r.public_id,
    url:        r.secure_url,
    size:       r.bytes,
    uploadedAt: r.created_at,
  }));

  return {
    items,
    truncated: !!data.next_cursor,
    cursor:    data.next_cursor ?? null,
  };
}

export async function headFromCloudinary(
  publicId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string
): Promise<{ publicId: string; url: string; size: number; uploadedAt: string; contentType: string | null }> {
  const encodedId = encodeURIComponent(publicId);

  for (const resType of ['image', 'video', 'raw'] as const) {
    const res = await fetch(
      `${apiBase(cloudName)}/resources/${resType}/${encodedId}`,
      { headers: { Authorization: basicAuth(apiKey, apiSecret) } }
    );
    if (res.ok) {
      const data = await res.json() as {
        public_id:  string;
        secure_url: string;
        bytes:      number;
        created_at: string;
        format:     string;
      };
      return {
        publicId:    data.public_id,
        url:         data.secure_url,
        size:        data.bytes,
        uploadedAt:  data.created_at,
        contentType: mimeFromFormat(data.format),
      };
    }
    if (res.status !== 404) {
      const text = await res.text();
      throw new Error(`Cloudinary head failed: ${text}`);
    }
  }

  throw new Error(`Object not found: ${publicId}`);
}

export async function moveInCloudinary(
  oldPublicId: string,
  newPublicId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  contentType?: string | null
): Promise<MoveResult> {
  if (oldPublicId === newPublicId) {
    throw new Error('newKey is identical to the current key — nothing to move');
  }

  const timestamp    = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    from_public_id: oldPublicId,
    timestamp,
    to_public_id:   newPublicId,
  };
  const signature = await buildSignature(paramsToSign, apiSecret);

  const body = new URLSearchParams({
    from_public_id: oldPublicId,
    to_public_id:   newPublicId,
    api_key:        apiKey,
    timestamp:      timestamp.toString(),
    signature,
  });

  const primary   = resourceTypeFromMime(contentType);
  const fallbacks = (['image', 'video', 'raw'] as const).filter(t => t !== primary);

  for (const type of [primary, ...fallbacks]) {
    const res = await fetch(`${apiBase(cloudName)}/${type}/rename`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    });
    if (res.ok) {
      const data = await res.json() as { public_id: string; secure_url: string };
      return {
        oldPublicId,
        publicId: data.public_id,
        url:      data.secure_url,
        provider: 'cloudinary',
      };
    }
  }

  throw new Error(`Object not found: ${oldPublicId}`);
}
