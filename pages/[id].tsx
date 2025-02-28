import { S3Client, GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import * as cheerio from "cheerio";
import { useState, useEffect } from "react";

interface Params {
  id: string;
}

interface GetServerSidePropsContext {
  params: Params;
}

export async function getServerSideProps({ params }: GetServerSidePropsContext) {
  const { id } = params;
  
  console.log(`ID received: ${id}`);
  
  // 파일 이름을 ID로 받았을 때 처리
  if (id.endsWith('.webp') || id.endsWith('.json')) {
    return {
      notFound: true,
    };
  }

  // S3 클라이언트 설정
  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("Missing R2 credentials");
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  try {
    // 먼저 버킷에 해당 ID 폴더가 있는지 확인
    const listCommand = new ListObjectsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: `${id}/`,
      MaxKeys: 1
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log(`No contents found for prefix ${id}/`);
      return {
        notFound: true,
      };
    }

    // index.html 가져오기
    const htmlCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `${id}/index.html`,
    });
    
    const htmlResponse = await s3Client.send(htmlCommand);
    if (!htmlResponse.Body) {
      throw new Error("Failed to get HTML content from S3");
    }
    
    const htmlContent = await htmlResponse.Body.transformToString();

    // HTML 파싱 및 수정
    const $ = cheerio.load(htmlContent);
    
    // base 태그 추가하여 상대 경로 해결
    $('head').prepend(`<base href="/api/assets/${id}/">`);
    
    return {
      props: {
        html: $.html(),
        id: id,
      },
    };
  } catch (error) {
    console.error("Error fetching from R2:", error);
    return {
      notFound: true,
    };
  }
}

export default function Page({ html, id }: { html: string, id: string }) {
  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <iframe 
        srcDoc={html}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title={`Content for ${id}`}
      />
    </div>
  );
}