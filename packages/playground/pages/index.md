<head>
<title>(JS/TS)Gandalf's blog!</title>
</head>

## (JS/TS)Gandalf's blog! [text-blue-500]

In some random text we write *italic [text-red-500]* and prolly bold as well **bold [text-red-500]**

{% for blog in data %}
[{{ blog.meta }}](/{{ blog._id }})
{% endfor %}

<i-mdi-github/>
<Counter/>


