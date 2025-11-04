import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: await headers() })
      if (!session?.user) throw new UploadThingError("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Prefer url; fallback to ufsUrl if needed
      const url = (file as any).url ?? (file as any).ufsUrl
      return { uploadedBy: metadata.userId, url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter


