import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Maksimum boyutları ayarla
                const MAX_WIDTH = 1920
                const MAX_HEIGHT = 1080

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        })
                        resolve(compressedFile)
                    } else {
                        reject(new Error('Resim sıkıştırılamadı'))
                    }
                }, 'image/jpeg', 0.7)
            }
            img.onerror = () => {
                reject(new Error('Resim yüklenemedi'))
            }
        }
        reader.onerror = () => {
            reject(new Error('Dosya okunamadı'))
        }
    })
} 