
{% layout "../layouts/BaseLayout.md" %}

{% block content %}
## (JS/TS)Gandalf's blog!

{% for blog in data %}
 [{{blog.meta}}](/{{blog._id}})
{% endfor %}

<i-mdi-github/>
<Counter client:only/>

{% endblock %}