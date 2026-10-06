import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize the S3 client globally
const region = process.env.REGION as string;
const s3Client = new S3Client({ region });

export const createPresignedUrlWithClient = async (
  bucket: string,
  key: string
) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
