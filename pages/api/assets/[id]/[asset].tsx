"use client";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  const { id, asset } = req.query;
  
  // 문자열 타입 확인
  const idStr = Array.isArray(id) ? id[0] : id;
  const assetStr = Array.isArray(asset) ? asset[0] : asset;

  if (!idStr || !assetStr) {
    return res.status(400).send('Missing id or asset parameter');
  }

  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return res.status(500).send('Missing S3 credentials');
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `${idStr}/${assetStr}`,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response body');
    }
    
    const contentType = response.ContentType || "application/octet-stream";
    
    // 바이너리 데이터를 가져오는 보다 안정적인 방법
    let responseData: Uint8Array;
    try {
      responseData = await response.Body.transformToByteArray();
    } catch (e) {
      // 대체 방법 사용
      const stream = response.Body.transformToWebStream();
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // 청크들을 하나의 Uint8Array로 병합
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      responseData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        responseData.set(chunk, offset);
        offset += chunk.length;
      }
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(responseData));
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(404).send("Asset not found");
  }
}