export PATH := $(PWD)/node_modules/.bin:$(PATH)

.PHONY: all
all: min-css min-images

.PHONY: install
install: install-ruby install-node

RUBY_DEP_HASH = vendor/bundle/$(shell cat Gemfile Gemfile.lock | sha256sum | cut -d' ' -f1)
$(RUBY_DEP_HASH): Gemfile.lock Gemfile
	bundle install --path vendor/bundle
	touch $(RUBY_DEP_HASH)
.PHONY: install-ruby
install-ruby: $(RUBY_DEP_HASH)

NODE_DEP_HASH = node_modules/$(shell cat package.json yarn.lock | sha256sum | cut -d' ' -f1)
$(NODE_DEP_HASH): package.json yarn.lock
	yarn --frozen-lockfile
	touch $(NODE_DEP_HASH)
.PHONY: install-node
install-node: $(NODE_DEP_HASH)

build-site: install-ruby $(shell find _layouts _posts _includes -type f) min-images
	bundle exec jekyll build

_includes/all.min.css: install-node build-site assets/all.css $(shell find _site -iname '*.html')
	postcss assets/all.css -o _includes/all.min.css
	purifycss _includes/all.min.css $(shell find _site -iname '*.html') --info -o _includes/all.min.css
	postcss _includes/all.min.css --replace
.PHONY: min-css
min-css: _includes/all.min.css

IMAGES = $(shell find assets/images/ \( -name '*.jpeg' -o -name '*.jpg' -o -name '*.png' \) -a ! -name '*.min.*' -type f)
IMAGES_MIN_1 = $(patsubst %.jpg,%.min.jpg,$(IMAGES))
IMAGES_MIN_2 = $(patsubst %.jpeg,%.min.jpeg,$(IMAGES_MIN_1))
IMAGES_MIN = $(patsubst %.png,%.min.png,$(IMAGES_MIN_2))
%.min.jpg: %.jpg
	convert $< \( -resize "570x>" -quality 85 -strip \) $@
%.min.jpeg: %.jpeg
	convert $< \( -resize "570x>" -quality 85 -strip \) $@
%.min.png: %.png
	convert $< \( -resize "570x>" -quality 85 -strip \) $@
.PHONY: min-images
min-images: $(IMAGES_MIN)
