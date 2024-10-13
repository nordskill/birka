const blogSchema = (data) => {
    const {
        blogPosts,
        breadcrumbs,
        host,
        blog_title,
        blog_description,
        blog_slug,
        website_name
    } = data;

    const generateBreadcrumbItems = () => {
        return `
        {
          "@type": "ListItem",
          "position": 1,
          "name": "${breadcrumbs[0].name}",
          "item": "${breadcrumbs[0].url}"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "${breadcrumbs[1].name}",
          "item": "${breadcrumbs[1].url}"
        }
      `;
    };

    const generateBlogPostItems = () => {
        return blogPosts.map((post, index) => `
        {
          "@type": "ListItem",
          "position": ${index + 1},
          "item": {
            "@type": "BlogPosting",
            "headline": "${post.title}",
            "description": "${post.excerpt}",
            "datePublished": "${post.date_published}",
            "author": {
              "@type": "Person",
              "name": "${post.author.username}"
            },
            "image": "${host}${getImgPath(post.img_preview, 1024)}",
            "url": "${host}/${blog_slug}/${post.slug}"
          }
        }
      `).join(',');
    };

    const schema = `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "${blog_title}",
        "description": "${blog_description}",
        "url": "${host}/${blog_slug}",
        "isPartOf": {
            "@type": "WebSite",
            "name": "${website_name}",
            "url": "${host}"
        },
        "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
                ${generateBreadcrumbItems()}
            ]
        },
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": [
                ${generateBlogPostItems()}
            ]
        }
    }
        </script>`;

    return schema;
};

const blogPostSchema = (data) => {
    const {
        post,
        host,
        blog_slug,
        website_name
    } = data;

    const schema = `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${host}/${blog_slug}/${post.slug}"
        },
        "headline": "${post.title}",
        "description": "${post.excerpt}",
        "image": "${host}${getImgPath(post.img_preview, 1024)}",
        "author": {
            "@type": "Person",
            "name": "${post.author.username}"
        },
        "publisher": {
            "@type": "Organization",
            "name": "${website_name}"
        },
        "datePublished": "${post.date_published}",
        "updatedAt": "${post.date}",
        "keywords": "${post.tags.map(tag => tag.name).join(', ')}",
        "articleBody": ${JSON.stringify(html_to_text(post.body_rendered))}
    }
</script>`;

    return schema;
};

function getImgPath(obj, size) {

    const closestSize = findClosestNumber(size, obj.sizes);
    return `/files/${obj.hash.slice(0, 2)}/${closestSize}/${obj.file_name}.${obj.optimized_format}`;

}

function findClosestNumber(target, numbers) {
    return numbers.reduce((closest, num) => Math.abs(num - target) < Math.abs(closest - target) ? num : closest);
}

function html_to_text(html) {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export { blogSchema, blogPostSchema };