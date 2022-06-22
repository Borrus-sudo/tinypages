<head>
<title>My Blog!</title>
</head>

## (JS/TS)Gandalf's blog!

{% for blog in data %}
[{{blog.meta}}](/{{blog._id}})
{% endfor %}

<i-mdi-github/>
<Counter client:only/>
