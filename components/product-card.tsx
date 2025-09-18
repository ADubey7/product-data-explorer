"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Product {
  id: string
  title: string
  author: string
  price: string
  image: string
  link: string
}

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}?url=${encodeURIComponent(product.link)}`}>
      <Card
        className={`h-full hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden ${className}`}
      >
        <div className="aspect-[3/4] relative overflow-hidden">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground mb-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{product.author}</p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs font-bold">
              {product.price}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">4.2</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
