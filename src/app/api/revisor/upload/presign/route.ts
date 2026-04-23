import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 })

  const { courseFolder, fileName, mimeType, subFolder, relativePath } = body as {
    courseFolder?: string
    fileName?: string
    mimeType?: string
    subFolder?: string
    relativePath?: string
  }

  if (!courseFolder?.trim() || !fileName?.trim()) {
    return NextResponse.json({ error: "courseFolder e fileName são obrigatórios." }, { status: 400 })
  }

  const keys = [
    "revisor_s3_access_key",
    "revisor_s3_secret_key",
    "revisor_s3_endpoint",
    "revisor_s3_region",
    "revisor_s3_bucket",
    "revisor_s3_cdn_base_url",
  ]

  const entries = await prisma.systemConfig
    .findMany({ where: { key: { in: keys } }, select: { key: true, value: true } })
    .catch(() => [])

  const cfg: Record<string, string> = {}
  for (const entry of entries) cfg[entry.key] = decrypt(entry.value)

  const accessKeyId = cfg["revisor_s3_access_key"]
  const secretAccessKey = cfg["revisor_s3_secret_key"]
  const endpoint = cfg["revisor_s3_endpoint"]
  const region = cfg["revisor_s3_region"] || "auto"
  const bucket = cfg["revisor_s3_bucket"]
  const cdnBaseUrl = cfg["revisor_s3_cdn_base_url"]

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucket || !cdnBaseUrl) {
    return NextResponse.json({ error: "Credenciais S3 não configuradas." }, { status: 503 })
  }

  const folder = courseFolder.trim()
  const name = fileName.trim()
  const sub = subFolder?.trim() || ""
  const rel = relativePath?.trim() || ""

  const objectKey = rel
    ? `material-alura/${folder}/${rel}`
    : `material-alura/${folder}/${sub ? sub + "/" : ""}${name}`

  const client = new S3Client({
    region,
    endpoint: `https://${endpoint.replace(/^https?:\/\//, "")}`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: mimeType || "application/octet-stream",
  })

  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  const cdnUrl = `${cdnBaseUrl.replace(/^http:\/\//, "https://").replace(/\/$/, "")}/${objectKey}`

  return NextResponse.json({ presignedUrl, cdnUrl })
}
