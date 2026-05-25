import * as v from 'valibot';

export const UploadInputSchema = v.object({
  data:     v.pipe(v.string(), v.minLength(1)),
  filename: v.optional(v.string()),
  folder:   v.optional(v.string())
});

export type UploadInput = v.InferInput<typeof UploadInputSchema>;

export type UploadResult = {
  url:         string;
  publicId:    string;
  provider:    'cloudinary';
  size:        number;
  name:        string;
  contentType: string;
};

export type DeleteResult = {
  publicId: string;
  deleted:  true;
};

export type FileListItem = {
  publicId:   string;
  url:        string;
  size:       number;
  uploadedAt: string;
};

export type ListResult = {
  items:     FileListItem[];
  folder:    string | null;
  truncated: boolean;
  cursor:    string | null;
};

export type FileMetadata = {
  publicId:    string;
  url:         string;
  size:        number;
  uploadedAt:  string;
  contentType: string | null;
};

export const MoveInputSchema = v.pipe(
  v.object({
    newKey:   v.optional(v.pipe(v.string(), v.minLength(1))),
    folder:   v.optional(v.pipe(v.string(), v.minLength(1))),
    filename: v.optional(v.pipe(v.string(), v.minLength(1)))
  }),
  v.check(
    (val) => !!(val.newKey || val.folder || val.filename),
    'At least one of newKey, folder, or filename must be provided'
  )
);

export type MoveInput = v.InferInput<typeof MoveInputSchema>;

export type MoveResult = {
  oldPublicId: string;
  publicId:    string;
  url:         string;
  provider:    'cloudinary';
};

export type FileRecord = {
  id:          string;
  name:        string;
  url:         string;
  size:        number;
  contentType: string | null;
  folder:      string | null;
  provider:    string;
  uploadedBy:  string | null;
  pageId:      string | null;
  createdAt:   Date;
  updatedAt:   Date;
};

export interface StorageProvider {
  upload(input: UploadInput, cloudName: string, apiKey: string, apiSecret: string, folder: string): Promise<UploadResult>;
  delete(publicId: string, cloudName: string, apiKey: string, apiSecret: string, contentType?: string | null): Promise<DeleteResult>;
  list(cloudName: string, apiKey: string, apiSecret: string, folder?: string, cursor?: string, limit?: number): Promise<ListResult>;
  move(oldPublicId: string, input: MoveInput, cloudName: string, apiKey: string, apiSecret: string, contentType?: string | null): Promise<MoveResult>;
}
