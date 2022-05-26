<head>
<title>My blog!</title>
</head>

## (JS/TS)Gandalf's blog!


{% for blog in data %}
 [{{blog.meta}}](/{{blog._id}})
{% endfor %}


