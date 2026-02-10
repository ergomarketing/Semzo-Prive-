// Script to recover blog posts from Blob storage
import { list } from '@vercel/blob'

async function recoverBlogPosts() {
  console.log('[v0] Starting blog post recovery from Blob...')
  
  try {
    // List all blobs with blog/ prefix
    const { blobs } = await list({ prefix: 'blog/' })
    
    console.log(`[v0] Found ${blobs.length} files in Blob storage`)
    
    const posts = []
    
    for (const blob of blobs) {
      if (blob.pathname.endsWith('.md')) {
        console.log(`[v0] Recovering: ${blob.pathname}`)
        console.log(`[v0] URL: ${blob.url}`)
        
        try {
          // Try to fetch the content
          const response = await fetch(blob.url)
          
          if (response.ok) {
            const content = await response.text()
            const slug = blob.pathname.replace('blog/', '').replace('.md', '')
            
            posts.push({
              slug,
              pathname: blob.pathname,
              url: blob.url,
              size: blob.size,
              uploadedAt: blob.uploadedAt,
              contentPreview: content.substring(0, 200) + '...',
              fullContent: content
            })
            
            console.log(`[v0] ✓ Recovered: ${slug}`)
          } else {
            console.log(`[v0] ✗ Failed to fetch ${blob.pathname}: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.log(`[v0] ✗ Error fetching ${blob.pathname}:`, error.message)
        }
      }
    }
    
    console.log(`\n[v0] Recovery Summary:`)
    console.log(`[v0] Total files in Blob: ${blobs.length}`)
    console.log(`[v0] Successfully recovered: ${posts.length}`)
    
    if (posts.length > 0) {
      console.log(`\n[v0] Recovered posts:`)
      posts.forEach(post => {
        console.log(`\n--- ${post.slug} ---`)
        console.log(`Size: ${post.size} bytes`)
        console.log(`Uploaded: ${post.uploadedAt}`)
        console.log(`Preview:\n${post.contentPreview}`)
        console.log(`\n--- Full Content ---`)
        console.log(post.fullContent)
        console.log(`\n--- End of ${post.slug} ---\n`)
      })
    }
    
    return posts
  } catch (error) {
    console.error('[v0] Error during recovery:', error)
    throw error
  }
}

recoverBlogPosts()
  .then((posts) => {
    console.log(`[v0] Recovery completed: ${posts.length} posts recovered`)
  })
  .catch((error) => {
    console.error('[v0] Recovery failed:', error)
    process.exit(1)
  })
