---
layout: post
title: Tags
---
{% assign tags = site.tags | sort %}

{% for tag in tags %}
  <h2 id="{{ tag[0] | slugify }}">{{ tag[0] }}</h2>
  <ul class="tags-expo-posts">
  {% for post in tag[1] %}
  <li>{{ post.date | date: "%b %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
  </ul>
{% endfor %}
