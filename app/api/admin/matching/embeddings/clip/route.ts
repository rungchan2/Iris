import { NextRequest, NextResponse } from 'next/server'
import { adminLogger } from "@/lib/logger"
import { createClient } from '@/lib/supabase/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageId } = await request.json()

    if (!imageUrl || !imageId) {
      return NextResponse.json(
        { error: 'Missing imageUrl or imageId' },
        { status: 400 }
      )
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN not configured' },
        { status: 500 }
      )
    }

    adminLogger.info(`Generating CLIP embedding for image: ${imageId}`)

    // Generate CLIP embedding using Replicate
    const input = {
      image: imageUrl
    }

    const output = await replicate.run("openai/clip:4f2ce5e6aac5b8db5e32b41aa4329e0b0c0d77d3dc5b41f0e5d8f8bbbbec6a24", { input }) as { embedding: number[] }

    if (!output || !output.embedding) {
      throw new Error('Failed to generate embedding from CLIP model')
    }

    const embedding = output.embedding

    // Save embedding to database
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('survey_images')
      .update({ 
        image_embedding: JSON.stringify(embedding),
        embedding_generated_at: new Date().toISOString()
      })
      .eq('id', imageId)

    if (updateError) {
      adminLogger.error('Error updating image embedding:', updateError)
      throw updateError
    }

    adminLogger.info(`✅ Successfully generated CLIP embedding for image ${imageId}`)

    return NextResponse.json({
      success: true,
      imageId,
      embeddingDimensions: embedding.length,
      message: 'CLIP embedding generated successfully'
    })

  } catch (error) {
    adminLogger.error('Error generating CLIP embedding:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate CLIP embedding',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Batch process multiple images
export async function PUT(request: NextRequest) {
  try {
    const { imageIds } = await request.json()

    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid imageIds array' },
        { status: 400 }
      )
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const imageId of imageIds) {
      try {
        // Get image details
        const { data: image, error: fetchError } = await supabase
          .from('survey_images')
          .select('image_url')
          .eq('id', imageId)
          .single()

        if (fetchError || !image?.image_url) {
          results.push({ imageId, success: false, error: 'Image not found or missing URL' })
          errorCount++
          continue
        }

        // Generate CLIP embedding
        const input = { image: image.image_url }
        const output = await replicate.run("openai/clip:4f2ce5e6aac5b8db5e32b41aa4329e0b0c0d77d3dc5b41f0e5d8f8bbbbec6a24", { input }) as { embedding: number[] }

        if (!output || !output.embedding) {
          results.push({ imageId, success: false, error: 'Failed to generate embedding' })
          errorCount++
          continue
        }

        // Save embedding
        const { error: updateError } = await supabase
          .from('survey_images')
          .update({ 
            image_embedding: JSON.stringify(output.embedding),
            embedding_generated_at: new Date().toISOString()
          })
          .eq('id', imageId)

        if (updateError) {
          results.push({ imageId, success: false, error: updateError.message })
          errorCount++
        } else {
          results.push({ imageId, success: true, dimensions: output.embedding.length })
          successCount++
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        results.push({ 
          imageId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: imageIds.length,
      successCount,
      errorCount,
      results
    })

  } catch (error) {
    adminLogger.error('Error in batch CLIP embedding generation:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process batch CLIP embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}