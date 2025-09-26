// pages/blog/index.js
import { getAllPosts } from '../../lib/posts';
import Link from 'next/link';
import Head from 'next/head';

export default function Blog({ allPosts }) {
  return (
    <div>
      <Head>
        <title>Blog | Sapnhap.org</title>
        <meta name="description" content="Các bài viết và hướng dẫn mới nhất từ Sapnhap.org" />
      </Head>
      <h1>Blog</h1>
      <ul>
        {allPosts.map(({ slug, title, date, description }) => (
          <li key={slug}>
            <Link href={`/blog/${slug}`}>
              <a>{title}</a>
            </Link>
            <br />
            <small>{date}</small>
            <p>{description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Hàm này chạy lúc build time trên server
export async function getStaticProps() {
  const allPosts = getAllPosts();
  return {
    props: {
      allPosts,
    },
  };
}