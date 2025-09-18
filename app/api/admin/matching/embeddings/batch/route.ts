import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Set up Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
        
        try {
          // Get all pending embedding jobs
          const { data: jobs, error: jobsError } = await supabase
            .from('embedding_jobs')
            .select('*')
            .eq('job_status', 'pending')
            .order('created_at')
          
          if (jobsError) throw jobsError
          
          if (!jobs || jobs.length === 0) {
            sendUpdate({ type: 'complete', message: 'No pending jobs' })
            controller.close()
            return
          }
          
          const totalJobs = jobs.length
          let processedJobs = 0
          
          for (const job of jobs) {
            try {
              // Update job status to processing
              await supabase
                .from('embedding_jobs')
                .update({ job_status: 'processing' })
                .eq('id', job.id)
              
              let embedding: number[] | null = null
              let updateTable: string = ''
              let textToEmbed: string = ''
              
              if (job.job_type === 'choice_embedding') {
                // Get choice text
                const { data: choice } = await supabase
                  .from('survey_choices')
                  .select('choice_label')
                  .eq('id', job.target_id)
                  .single()
                
                if (choice) {
                  textToEmbed = choice.choice_label
                  updateTable = 'survey_choices'
                }
              } else if (job.job_type === 'image_embedding') {
                // Get image label
                const { data: image } = await supabase
                  .from('survey_images')
                  .select('image_label')
                  .eq('id', job.target_id)
                  .single()
                
                if (image) {
                  textToEmbed = image.image_label
                  updateTable = 'survey_images'
                }
              } else if (job.job_type === 'photographer_profile') {
                // Get photographer profile sections
                const { data: profile } = await supabase
                  .from('photographer_profiles')
                  .select(`
                    style_emotion_description,
                    communication_psychology_description,
                    purpose_story_description,
                    companion_description
                  `)
                  .eq('photographer_id', job.target_id)
                  .single()
                
                if (profile) {
                  // Process each dimension separately
                  const dimensions = [
                    { field: 'style_emotion_description', column: 'style_emotion_embedding' },
                    { field: 'communication_psychology_description', column: 'communication_psychology_embedding' },
                    { field: 'purpose_story_description', column: 'purpose_story_embedding' },
                    { field: 'companion_description', column: 'companion_embedding' }
                  ]
                  
                  for (const dim of dimensions) {
                    const text = profile[dim.field as keyof typeof profile]
                    if (text) {
                      const response = await openai.embeddings.create({
                        model: 'text-embedding-3-small',
                        input: text,
                        encoding_format: 'float'
                      })
                      
                      await supabase
                        .from('photographer_profiles')
                        .update({
                          [dim.column]: response.data[0].embedding,
                          embeddings_generated_at: new Date().toISOString()
                        })
                        .eq('photographer_id', job.target_id)
                    }
                  }
                  
                  // Mark job as completed
                  await supabase
                    .from('embedding_jobs')
                    .update({ 
                      job_status: 'completed',
                      processed_at: new Date().toISOString()
                    })
                    .eq('id', job.id)
                  
                  processedJobs++
                  sendUpdate({ 
                    type: 'progress', 
                    progress: (processedJobs / totalJobs) * 100,
                    current: processedJobs,
                    total: totalJobs
                  })
                  continue
                }
              }
              
              // Generate embedding for single text
              if (textToEmbed && updateTable) {
                const response = await openai.embeddings.create({
                  model: 'text-embedding-3-small',
                  input: textToEmbed,
                  encoding_format: 'float'
                })
                
                embedding = response.data[0].embedding
                
                // Update the appropriate table
                if (updateTable === 'survey_choices') {
                  await supabase
                    .from('survey_choices')
                    .update({
                      choice_embedding: JSON.stringify(embedding),
                      embedding_generated_at: new Date().toISOString()
                    })
                    .eq('id', job.target_id)
                } else if (updateTable === 'survey_images') {
                  await supabase
                    .from('survey_images')
                    .update({
                      image_embedding: JSON.stringify(embedding),
                      embedding_generated_at: new Date().toISOString()
                    })
                    .eq('id', job.target_id)
                }
                
                // Mark job as completed
                await supabase
                  .from('embedding_jobs')
                  .update({ 
                    job_status: 'completed',
                    processed_at: new Date().toISOString()
                  })
                  .eq('id', job.id)
              } else {
                throw new Error(`No text found for ${job.job_type} with ID ${job.target_id}`)
              }
              
            } catch (jobError) {
              console.error(`Error processing job ${job.id}:`, jobError)
              
              // Mark job as failed
              await supabase
                .from('embedding_jobs')
                .update({ 
                  job_status: 'failed',
                  error_message: jobError instanceof Error ? jobError.message : 'Unknown error',
                  processed_at: new Date().toISOString()
                })
                .eq('id', job.id)
            }
            
            processedJobs++
            sendUpdate({ 
              type: 'progress', 
              progress: (processedJobs / totalJobs) * 100,
              current: processedJobs,
              total: totalJobs
            })
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
          sendUpdate({ 
            type: 'complete', 
            message: `${processedJobs}/${totalJobs} jobs completed`
          })
          
        } catch (error) {
          console.error('Batch processing error:', error)
          sendUpdate({ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        } finally {
          controller.close()
        }
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    console.error('Batch processing setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}