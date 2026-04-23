import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: "Body inválido." }, { status: 400 })

  const file = formData.get("file") as File | null
  const courseFolder = (formData.get("courseFolder") as string | null)?.trim()
  const subFolder = (formData.get("subFolder") as string | null)?.trim() || ""
  const relativePath = (formData.get("relativePath") as string | null)?.trim()

  if (!file || !courseFolder) {
    return NextResponse.json({ error: "Arquivo e pasta do curso são obrigatórios." }, { status: 400 })
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

  const objectKey = relativePath
    ? `material-alura/${courseFolder}/${relativePath}`
    : `material-alura/${courseFolder}/${subFolder ? subFolder + "/" : ""}${file.name}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const client = new S3Client({
    region,
    endpoint: `https://${endpoint.replace(/^https?:\/\//, "")}`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: file.type || "application/octet-stream",
        ContentLength: fileBuffer.length,
      })
    )

    const cdnUrl = `${cdnBaseUrl.replace(/^http:\/\//, "https://").replace(/\/$/, "")}/${objectKey}`
    return NextResponse.json({ ok: true, cdnUrl })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Upload falhou: ${message}` }, { status: 500 })
  }
}
