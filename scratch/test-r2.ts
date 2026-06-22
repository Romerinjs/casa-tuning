import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

async function checkLogo() {
  console.log("Bucket Name:", bucketName);
  const client = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
    region: "auto",
  });

  try {
    const res = await client.send(
      new HeadObjectCommand({
        Bucket: bucketName!,
        Key: "logo-ct.png",
      })
    );
    console.log("Logo exists! Metadata:", res);
  } catch (err) {
    console.error("Logo not found or error:", err);
  }
}

checkLogo();
