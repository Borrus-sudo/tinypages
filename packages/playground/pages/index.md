<head>
<title>(JS/TS)Gandalf's blog!</title>
</head>

## (JS/TS)Gandalf's blog! [text-blue-500]

{% for blog in data %}
[{{blog.meta}}](/{{blog._id}})
{% endfor %}

<i-mdi-github/>
<Counter client:only/>
