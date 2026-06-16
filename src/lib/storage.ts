import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

const isConfigured = !!(
  accountId &&
  accountId !== "your_cloudflare_account_id_here" &&
  accessKeyId &&
  accessKeyId !== "your_access_key_id_here" &&
  secretAccessKey &&
  secretAccessKey !== "your_secret_access_key_here" &&
  bucketName &&
  bucketName !== "your_bucket_name_here" &&
  publicUrl &&
  publicUrl !== "https://your_public_domain_or_r2_subdomain_here"
);

let r2Client: S3Client | null = null;

function getClient(): S3Client {
  if (!isConfigured) {
    throw new Error(
      "El almacenamiento en la nube no está configurado o tiene valores por defecto. Por favor, define R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME y R2_PUBLIC_URL con tus credenciales reales en tu archivo .env."
    );
  }
  if (!r2Client) {
    r2Client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
      region: "auto",
    });
  }
  return r2Client;
}

function parseBase64(base64Str: string) {
  // Check if it's a Data URL
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches) {
    return {
      contentType: matches[1],
      buffer: Buffer.from(matches[2], "base64"),
    };
  }
  // Fallback if it is a raw base64 string
  return {
    contentType: "application/octet-stream",
    buffer: Buffer.from(base64Str, "base64"),
  };
}

function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

function pathHasExtension(pathStr: string): boolean {
  const base = pathStr.split("/").pop() || "";
  return base.includes(".");
}

/**
 * Uploads a Buffer to the storage bucket.
 * 
 * @param buffer File content buffer
 * @param key Target S3 object key (e.g. "signatures/sig-123.png")
 * @param contentType Mime-type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getClient();
  const normalizedKey = key.replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName!,
      Key: normalizedKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const baseUrl = publicUrl!.endsWith("/") ? publicUrl!.slice(0, -1) : publicUrl!;
  return `${baseUrl}/${normalizedKey}`;
}

/**
 * Decodes a base64 string and uploads it to the storage bucket.
 * 
 * @param base64Str Base64 string (supports data URL format or raw base64)
 * @param key Target S3 object key (extension will be appended if missing)
 * @returns Public URL of the uploaded file
 */
export async function uploadBase64(
  base64Str: string,
  key: string
): Promise<string> {
  const { contentType, buffer } = parseBase64(base64Str);
  let finalKey = key.replace(/^\/+/, "");
  
  if (!pathHasExtension(finalKey)) {
    const ext = getExtensionFromMimeType(contentType);
    finalKey = `${finalKey}.${ext}`;
  }
  
  return uploadBuffer(buffer, finalKey, contentType);
}

/**
 * Deletes a file from the storage bucket.
 * 
 * @param urlOrKey Public URL or raw S3 Key of the object to delete
 */
export async function deleteFile(urlOrKey: string): Promise<void> {
  const client = getClient();
  const key = getKeyFromUrlOrKey(urlOrKey);

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName!,
      Key: key,
    })
  );
}

/**
 * Helper to extract the S3 Key from a public URL or return the key directly.
 */
function getKeyFromUrlOrKey(urlOrKey: string): string {
  if (!urlOrKey.startsWith("http")) {
    return urlOrKey.replace(/^\/+/, "");
  }
  try {
    const url = new URL(urlOrKey);
    return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    const baseUrl = publicUrl!;
    if (urlOrKey.startsWith(baseUrl)) {
      return decodeURIComponent(urlOrKey.replace(baseUrl, "").replace(/^\/+/, ""));
    }
    return urlOrKey;
  }
}
