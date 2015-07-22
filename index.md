---
layout: page
title: Me
---

## About Me

I'm currently a student working at [Micromeritics][]. My resume can be found
[here][resume].

[micromeritics]: http://www.micromeritics.com/
[resume]: https://drive.google.com/open?id=0B9O7w68iCyWFVFdHMkJYSUxwLUE

## Contact
<a href="mailto:me@flaviutamas.com"><i class="icon-big icon-mail-squared"></i></a>
<a href="https://github.com/flaviut/"><i class="icon-big icon-github-squared"></i></a>

## Pages
<ul>
{% for post in site.posts %}
  <li>{{ post.date | date: "%b %d, %Y" }} - <a href="{{ post.url }}/">{{ post.title }}</a></li>
{% endfor %}
</ul>
