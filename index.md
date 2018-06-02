---
layout: page
title: Flaviu Tamas
description: Flaviu Tamas's personal website.
---

# About Me

I'm a Computer Science student at [Georgia State][gsu], and a co-op at [Georgia
Tech Research Institute][gtri].

[micromeritics]: http://www.micromeritics.com/
[gtri]: https://gtri.gatech.edu/
[resume]: https://drive.google.com/open?id=0B1lFilx0211ITmZEa1gyZy1sVjA
[gsu]: http://www.gsu.edu/

# Contact
[Email][] / [Github][]

[Github]: https://github.com/flaviut/
[Email]: mailto:me@flaviutamas.com

# Index
<ul>
{% for post in site.posts %}
  <li>{{ post.date | date: "%b %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a></li>
{% endfor %}
</ul>
