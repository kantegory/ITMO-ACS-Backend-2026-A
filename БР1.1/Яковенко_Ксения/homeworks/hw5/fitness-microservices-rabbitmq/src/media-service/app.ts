import 'reflect-metadata';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { envInt } from '../shared/env';
import { createServiceApp, finishServiceApp } from '../shared/app';
import {
  AuthenticatedRequest,
  currentUser,
  requireGatewayUser,
  requireInternalToken,
  requireRole,
} from '../shared/auth-context';
import { asyncHandler, HttpError, parsePositiveInt, requireString } from '../shared/http';
import { startService } from '../shared/start';
import { mediaDataSource } from './data-source';
import { MediaFile } from './entities/media-file.entity';

const app = createServiceApp('media-service');
const port = envInt('MEDIA_PORT', 3006);
const uploadsRoot = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsRoot));

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function parseImageData(imageBase64: string, requestedName?: string) {
  let base64Data = imageBase64;
  let mimeType = 'image/png';
  let extension = '.png';
  const match = imageBase64.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (match) {
    const type = match[1].toLowerCase();
    base64Data = match[2];
    mimeType = `image/${type}`;
    extension = type === 'jpeg' || type === 'jpg' ? '.jpg' : type === 'webp' ? '.webp' : '.png';
  } else if (requestedName) {
    const ext = path.extname(requestedName).toLowerCase();
    if (ext) extension = ext;
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    if (ext === '.webp') mimeType = 'image/webp';
  }

  let fileName = requestedName ? sanitizeFileName(requestedName) : `blog-${Date.now()}${extension}`;
  if (!path.extname(fileName)) fileName += extension;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    throw new HttpError(422, 'imageBase64 is invalid', 'VALIDATION_ERROR');
  }
  if (!buffer.length) throw new HttpError(422, 'imageBase64 is empty', 'VALIDATION_ERROR');
  return { fileName, mimeType, buffer };
}

app.post(
  '/api/uploads/blog-image',
  requireGatewayUser,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = currentUser(req);
    const imageBase64 = requireString(req.body.imageBase64, 'imageBase64');
    const requestedName = typeof req.body.fileName === 'string' ? req.body.fileName : undefined;
    const { fileName, mimeType, buffer } = parseImageData(imageBase64, requestedName);
    const directory = path.join(uploadsRoot, 'blog');
    await fs.mkdir(directory, { recursive: true });
    const uniqueName = `${Date.now()}-${fileName}`;
    await fs.writeFile(path.join(directory, uniqueName), buffer);

    const repository = mediaDataSource.getRepository(MediaFile);
    const mediaFile = await repository.save(
      repository.create({
        fileName: uniqueName,
        mimeType,
        storageUrl: `/uploads/blog/${uniqueName}`,
        sizeBytes: buffer.length,
        ownerId: user.id,
      }),
    );
    res.status(201).json({
      mediaFileId: mediaFile.id,
      url: mediaFile.storageUrl,
      fileName: mediaFile.fileName,
      mediaFile,
    });
  }),
);

app.post(
  '/api/internal/files',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const repository = mediaDataSource.getRepository(MediaFile);
    const mediaFile = await repository.save(
      repository.create({
        fileName: requireString(req.body.fileName, 'fileName'),
        mimeType: requireString(req.body.mimeType, 'mimeType'),
        storageUrl: requireString(req.body.storageUrl, 'storageUrl'),
        sizeBytes: parsePositiveInt(req.body.sizeBytes, 'sizeBytes'),
        ownerId: parsePositiveInt(req.body.ownerId, 'ownerId'),
      }),
    );
    res.status(201).json({ mediaFileId: mediaFile.id, mediaFile });
  }),
);

app.get(
  '/api/internal/files/:fileId',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.fileId, 'fileId');
    const mediaFile = await mediaDataSource.getRepository(MediaFile).findOneBy({ id });
    if (!mediaFile) throw new HttpError(404, 'Media file not found', 'MEDIA_FILE_NOT_FOUND');
    res.json({ mediaFile });
  }),
);

finishServiceApp(app);

void startService(app, mediaDataSource, port, 'media-service').catch((error) => {
  console.error(error);
  process.exit(1);
});
