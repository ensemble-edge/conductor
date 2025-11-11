/**
 * Blog Post Handler
 *
 * Demonstrates dynamic data fetching based on route parameters.
 * This handler fetches blog post data from:
 * 1. KV storage (if BLOG_POSTS binding exists)
 * 2. D1 database (if DB binding exists)
 * 3. Falls back to mock data for demonstration
 *
 * The handler receives:
 * - params: { slug: string } - Route parameters from /blog/:slug
 * - query: { preview?: string } - Query parameters like ?preview=true
 * - headers: Record<string, string> - All request headers
 * - request: Request - Full request object
 * - env: Env - Cloudflare Workers environment (KV, D1, R2, etc.)
 * - ctx: ExecutionContext - Worker execution context
 */

import type { HandlerContext } from '@ensemble-edge/conductor'

interface BlogPost {
  title: string
  author: string
  date: string
  readingTime: number
  publishDate: string
  coverImage?: string
  excerpt: string
  content: string
  tags: string[]
  url: string
  slug: string
}

export async function handler(context: HandlerContext) {
  const { params, query, env } = context
  const slug = params.slug

  // Check if preview mode is enabled via query param
  const isPreview = query.preview === 'true'

  // Try to fetch from KV first (if BLOG_POSTS binding exists)
  if (env.BLOG_POSTS) {
    try {
      const post = await env.BLOG_POSTS.get(`post:${slug}`, 'json')
      if (post) {
        // Add related posts
        const relatedPosts = await fetchRelatedPosts(env, (post as BlogPost).tags, slug)
        return { post, relatedPosts }
      }
    } catch (error) {
      console.error('KV fetch error:', error)
    }
  }

  // Try to fetch from D1 database (if DB binding exists)
  if (env.DB) {
    try {
      const result = await env.DB.prepare(
        'SELECT * FROM blog_posts WHERE slug = ? AND (published = 1 OR ? = 1)'
      )
        .bind(slug, isPreview ? 1 : 0)
        .first()

      if (result) {
        const post = {
          ...result,
          tags: JSON.parse(result.tags as string),
        } as BlogPost

        // Fetch related posts from same category
        const relatedResult = await env.DB.prepare(
          'SELECT slug, title, excerpt FROM blog_posts WHERE category = ? AND slug != ? AND published = 1 LIMIT 3'
        )
          .bind(result.category, slug)
          .all()

        return {
          post,
          relatedPosts: relatedResult.results,
        }
      }
    } catch (error) {
      console.error('D1 fetch error:', error)
    }
  }

  // Fallback to mock data for demonstration
  const mockPosts: Record<string, BlogPost> = {
    'getting-started-with-conductor': {
      title: 'Getting Started with Conductor',
      author: 'Jane Developer',
      date: 'December 15, 2024',
      readingTime: 5,
      publishDate: '2024-12-15T10:00:00Z',
      coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop',
      excerpt: 'Learn how to build and deploy edge-native AI applications with Conductor',
      content: `
        <p>Conductor is a powerful framework for building edge-native AI applications. In this post, we'll explore the basics of getting started.</p>

        <h2>What is Conductor?</h2>
        <p>Conductor is an orchestration framework that helps you coordinate AI members and build complex workflows that run at the edge.</p>

        <h2>Key Features</h2>
        <ul>
          <li>Edge-native deployment on Cloudflare Workers</li>
          <li>Simple YAML configuration</li>
          <li>Built-in member types for common tasks</li>
          <li>Automatic API generation</li>
          <li>Dynamic pages with route parameters</li>
        </ul>

        <h2>Getting Started</h2>
        <p>To get started with Conductor, simply run:</p>
        <pre><code>npx @ensemble-edge/conductor init my-project</code></pre>

        <h2>Dynamic Pages</h2>
        <p>This blog post demonstrates dynamic page routing. The slug "${slug}" is passed as a route parameter, allowing one page template to handle infinite blog posts!</p>
      `,
      tags: ['conductor', 'edge-computing', 'tutorial'],
      url: `/blog/${slug}`,
      slug,
    },
    'advanced-patterns': {
      title: 'Advanced Conductor Patterns',
      author: 'John Architect',
      date: 'December 20, 2024',
      readingTime: 8,
      publishDate: '2024-12-20T14:00:00Z',
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop',
      excerpt: 'Deep dive into advanced orchestration patterns and best practices',
      content: `
        <p>Once you've mastered the basics of Conductor, it's time to explore advanced patterns that will help you build production-grade applications.</p>

        <h2>Error Handling Strategies</h2>
        <p>Learn how to implement robust error handling across your members and ensembles.</p>

        <h2>State Management</h2>
        <p>Using Durable Objects for stateful workflows and long-running processes.</p>

        <h2>Performance Optimization</h2>
        <p>Tips for optimizing your edge applications for maximum performance.</p>
      `,
      tags: ['conductor', 'advanced', 'best-practices'],
      url: `/blog/${slug}`,
      slug,
    },
    'deploying-to-production': {
      title: 'Deploying to Production',
      author: 'Sarah DevOps',
      date: 'December 25, 2024',
      readingTime: 6,
      publishDate: '2024-12-25T09:00:00Z',
      coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop',
      excerpt: 'Learn how to deploy your Conductor apps to production safely',
      content: `
        <p>Ready to ship your Conductor application? This guide covers everything you need to know about production deployments.</p>

        <h2>Environment Configuration</h2>
        <p>Setting up production secrets, bindings, and environment variables.</p>

        <h2>CI/CD Pipeline</h2>
        <p>Automating your deployment process with GitHub Actions.</p>

        <h2>Monitoring & Logging</h2>
        <p>Essential observability practices for edge applications.</p>
      `,
      tags: ['conductor', 'deployment', 'devops'],
      url: `/blog/${slug}`,
      slug,
    },
  }

  const post = mockPosts[slug]

  if (!post) {
    // Return null to trigger 404 page
    return {
      post: null,
      relatedPosts: [],
    }
  }

  // Get related posts based on tags
  const relatedPosts = Object.entries(mockPosts)
    .filter(([key, p]) => key !== slug && p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3)
    .map(([_, p]) => ({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
    }))

  return {
    post,
    relatedPosts,
  }
}

/**
 * Fetch related posts from KV based on tags
 */
async function fetchRelatedPosts(env: any, tags: string[], excludeSlug: string) {
  if (!env.BLOG_POSTS) return []

  try {
    // List all posts with matching tags
    const list = await env.BLOG_POSTS.list({ prefix: 'post:' })

    const related = []
    for (const key of list.keys) {
      if (related.length >= 3) break

      const slug = key.name.replace('post:', '')
      if (slug === excludeSlug) continue

      const post = (await env.BLOG_POSTS.get(key.name, 'json')) as BlogPost
      if (post && post.tags.some((tag) => tags.includes(tag))) {
        related.push({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
        })
      }
    }

    return related
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}
