// pages/blog/[slug].js
import { getAllPosts, getPostData } from '../../lib/posts';
import Head from 'next/head';

export default function Post({ postData }) {
  return (
    <article>
      <Head>
        {/* Các thẻ meta quan trọng cho SEO và chia sẻ mạng xã hội */}
        <title>{postData.title}</title>
        <meta name="description" content={postData.description} />
        <meta property="og:title" content={postData.title} />
        <meta property="og:description" content={postData.description} />
        <meta property="og:image" content={`https://sapnhap.org${postData.cover_image}`} />
        <meta property="og:type" content="article" />
      </Head>

      <h1>{postData.title}</h1>
      <div>{postData.date}</div>
      <hr />
      {/* dangerouslySetInnerHTML để render chuỗi HTML từ 'marked' */}
      <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </article>
  );
}

// 1. Lấy danh sách tất cả các slug để Next.js biết cần tạo ra những trang nào
export async function getStaticPaths() {
  const posts = getAllPosts();
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return {
    paths,
    fallback: false, // Nếu truy cập slug không tồn tại sẽ trả về trang 404
  };
}

// 2. Với mỗi slug, lấy dữ liệu tương ứng cho trang đó
export async function getStaticProps({ params }) {
  const postData = await getPostData(params.slug);
  return {
    props: {
      postData,
    },
  };
}