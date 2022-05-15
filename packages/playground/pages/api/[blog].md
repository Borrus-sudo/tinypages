### Everything else .md in api/

<div x-for="blog in $props.blog">
 <BlogPost title={$props.blog.content} content={$props.blog.content}/>
</div>
