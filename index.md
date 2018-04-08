---
layout: page
title: Flaviu Tamas
description: Flaviu Tamas's personal website.
---

## About Me

I'm a Computer Science student at [Georgia State][gsu], and a intern at
[Georgia Tech Research Corporation][gtri].

[My resume can be found here.][resume]

[micromeritics]: http://www.micromeritics.com/
[gtri]: https://gtri.gatech.edu/
[resume]: https://drive.google.com/open?id=0B1lFilx0211ITmZEa1gyZy1sVjA
[ksu]: https://www.kennesaw.edu/
[gsu]: http://www.gsu.edu/

## Contact
<a href="mailto:me@flaviutamas.com"><i class="icon-big icon-mail-squared"></i></a>
<a href="https://github.com/flaviut/"><i class="icon-big icon-github-squared"></i></a>

## Articles
<ul>
{% for post in site.posts %}
  <li>{{ post.date | date: "%b %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a></li>
{% endfor %}
</ul>
