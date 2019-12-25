---
layout: page
title: Flaviu Tamas
description: Flaviu Tamas's personal website.
---

# Contact
[Email][] / [Github][]

[Github]: https://github.com/flaviut/
[Email]: mailto:me@flaviutamas.com

# Index
<ul>
{% for post in site.posts %}
  <li>{{ post.date | date: "%b %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a></li>
{% endfor %}
  <li><span style="font-weight: bold"><a href="/tags">Posts by tag</a></span></li>
</ul>

