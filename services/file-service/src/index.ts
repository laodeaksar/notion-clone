import { Elysia } from 'elysia';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = new Elysia();

const uploadSchema = z.object({
  data: z.string().min(1)
});

app.get('/', () => ({ status: 'ok', service: 'file-service' }));

app.post('/upload', async ({ body }) => {
  const { data } = uploadSchema.parse(body);
  const result = await cloudinary.uploader.upload(data, { folder: 'notion-clone' });
  return { url: result.secure_url, publicId: result.public_id };
});

app.listen(process.env.PORT ? Number(process.env.PORT) : 8084);
