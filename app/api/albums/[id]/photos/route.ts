import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const formData = await request.formData()
        const files = formData.getAll('photos')

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'Fotoğraf yüklenmedi' },
                { status: 400 }
            )
        }

        const album = await prisma.album.findUnique({
            where: { id: params.id },
        })

        if (!album) {
            return NextResponse.json(
                { error: 'Albüm bulunamadı' },
                { status: 404 }
            )
        }

        const uploadedPhotos = await Promise.all(
            files.map(async (file: any) => {
                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)

                // Cloudinary'ye yükle
                const uploadResult: any = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'uploads' },
                        (error, result) => {
                            if (error) reject(error)
                            else resolve(result)
                        }
                    )
                    stream.end(buffer)
                })

                // Veritabanına kaydet
                return prisma.image.create({
                    data: {
                        url: uploadResult.secure_url,
                        albumId: params.id,
                    },
                })
            })
        )

        return NextResponse.json(uploadedPhotos)
    } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error)
        return NextResponse.json(
            { error: 'Fotoğraflar yüklenirken bir hata oluştu' },
            { status: 500 }
        )
    }
} 