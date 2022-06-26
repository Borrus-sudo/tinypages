<head>
<title>My Blog!</title>
</head>

## (JS/TS)Gandalf's blog! [text-blue-500]

{% for blog in data %}
[{{blog.meta}}](/{{blog._id}})
{% endfor %}

<i-mdi-github/>
<Counter client:only/>
