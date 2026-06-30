import BlogEditor from '@/components/BlogEditor'

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BlogEditor postId={id} />
}
