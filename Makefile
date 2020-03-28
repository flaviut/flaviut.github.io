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

build-site: install-ruby $(shell find _layouts _posts _includes -type f)
	bundle exec jekyll build

assets/all.min.css: install-node build-site assets/all.css $(shell find _site -iname '*.html')
	yarn run -s postcss assets/all.css --use postcss-import --use autoprefixer -b '>0.25%%, not ie 11, not op_mini all' --use cssnano --no-map > assets/all.min.css
	yarn run -s purifycss assets/all.min.css $(shell find _site -iname '*.html') --min --info -o assets/all.min.css
.PHONY: min-css
min-css: assets/all.min.css

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
