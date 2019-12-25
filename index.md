---
layout: page
title: Flaviu Tamas
description: Flaviu Tamas's personal website.
---

# About Me

I'm mostly a software engineer, but I enjoy learning about pretty much
anything. Most recently, that's meant various electronics.

# Contact

If you have any comments or questions about anything, please [feel free to
email me][Email].

I also have [a GitHub account][Github], where most of the open-source things
I've worked on are.

[Github]: https://github.com/flaviut/
[Email]: mailto:me@flaviutamas.com

# Index
<ul>
{% for post in site.posts %}
  <li>{{ post.date | date: "%b %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a></li>
{% endfor %}
  <li><span style="font-weight: bold"><a href="/tags">Posts by tag</a></span></li>
</ul>

