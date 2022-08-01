<head>
<title>(JS/TS)Gandalf's blog!</title>
</head>

## (JS/TS)Gandalf's blog! [text-blue-500]

In some random text we write _italic [text-red-500]_ and prolly bold as well **bold [text-red-500]**

{% for blog in data %}
[{{ blog.meta }}](/{{ blog._id }})
{% endfor %}

<i-mdi-github/>

<Counter/>

<i-mdi-twitter/>

Some more stuff [text-blue-500]

<i-mdi-twitter/>

some more stuff [text-blue-500]
