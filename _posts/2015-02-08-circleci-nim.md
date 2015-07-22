---
layout: post
title: Using Nim with CircleCI
description: "Using CircleCI and the Nim programming language to do continous integration"
---
Using [Nim][] with [CircleCI][] is fairly easy, the same instructions can be
used for bootstrapping as usual.

# What is CircleCI?
CircleCI is a new continuous integration service that is particularly
suitable for open source projects. They allow 1 free VM for all projects, and
4 free VMs if you attach it to a Github repo. It seems to use the same model as
Github and Bitbucket: Free for individuals and OSS, paid for corporations.

# Setting up the environment

``` yaml
dependencies:
  pre:
    - |
        if [ ! -x ~/bin/nim ]; then
          if [ ! -x ~/nim/bin/nim ]; then
            git clone -b devel --depth 1 https://github.com/Araq/Nimrod.git ~/nim/
            git clone -b devel --depth 1 git://github.com/nimrod-code/csources ~/nim/csources/
            cd ~/nim/csources
            sh build.sh
            cd ../
            bin/nim c koch
            ./koch boot
          fi

          ln -s ~/nim/bin/nim ~/bin/nim
        fi

  cache_directories:
    - "~/bin/"
    - "~/nim/"
```

Lets go over that again.

- A bunch of if statements to avoid duplicating work. This is because the
  compilation can be cached so it only needs to be done once. This saves 2-3
  minutes per run.
  - `if [ ! -x ~/bin/nim ]; then` checks if there is an executable symlinked at
    `~/bin/nim`
  - `if [ ! -x ~/nim/bin/nim ]; then` checks if Nim has been compiled. The Nim
    root directory is at `~/nim/`.
- Inside the inner if statement are the standard Nim bootstrapping
  instructions, which were taken from [this page][nim-install].
- `ln -s ~/nim/bin/nim ~/bin/nim` places a symlink to Nim in the `~/bin/`
  directory, which is automatically added to `$PATH` by CircleCI.
- `cache_directories:` tells CircleCI which files should be preserved between
  runs. We don't want to bootstrap Nim each time we compile something, so we
  add `~/nim/` here.

[Nim]: http://nim-lang.org/
[CircleCI]: https://circleci.com/
[nim-install]: http://nim-lang.org/download.html#installation-from-github

# Running tests

``` yaml
test:
  override:
    - nim c -r tests/all
```

This is straightforward, just add the appropriate command to the `circle.yaml`
file. The command you'll have use depends on how you've set up your tests.

# Other notes

You can use Nim from `master` or a tag, just adapt the git commands
appropriately.

You may also want to check out <https://howistart.org/posts/nim/1>. It provides
a guide to getting started with Nim and suggests a similar setup for CI!
