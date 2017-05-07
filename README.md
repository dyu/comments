# comments app
A simple, self-hosted comment engine

The [demo](https://netlify-comments.dyuproject.com) is running on a $2.5 vultr plan located in SG, with the app [configured](ARGS.txt) to use a max memory of 128mb (to leave most of the available memory to the filesystem cache).

![screenshot](https://github.com/dyu/comments/raw/master/screenshot.png)

## Deployment on your site/blog
Put this anywhere in the body (although it is advisable to put it last)
```html
<div id="comments"></div>
<script>
window.rpc_host = 'https://rpc.dyuproject.com';
window.comments_post_id = 1; // pick any number greater than zero
window.comments_max_depth = 4; // max: 127
</script>
<script src="https://netlify-comments.dyuproject.com/build.js"></script>
<link rel="stylesheet" href="https://netlify-comments.dyuproject.com/build.css" />
```
> *Note*: do not use 1 as the comments_post_id. Otherwise, you'll see the comments from the demo on your site/blog.

## Server runtime dependencies
- jdk7

## Dev requirements
- [node](https://nodejs.org/en/download/) 6.9.0 or higher
- yarn (npm install -g yarn)
- jdk7 (at /usr/lib/jvm/java-7-oracle)
- [maven](https://maven.apache.org/download.cgi)
- [protostuffdb](https://gitlab.com/dyu/protostuffdb) (downloaded below)

## Setup
```sh
mkdir -p target/data/main
echo "Your data lives in user/ dir.  Feel free to back it up." > target/data/main/README.txt

# download protostuffdb
yarn add protostuffdb@0.10.2 && mv node_modules/protostuffdb/dist/* target/ && rm -f package.json yarn.lock && rm -r node_modules

wget -O target/fbsgen-ds.jar https://repo1.maven.org/maven2/com/dyuproject/fbsgen/ds/fbsgen-ds-fatjar/1.0.5/fbsgen-ds-fatjar-1.0.5.jar
./modules/codegen.sh
mvn install

npm install -g http-server clean-css-cli
cd comments-ts
yarn install
```

## Dev mode
```sh
# produces a single jar the first time (comments-all/target/comments-all-jarjar.jar)
./run.sh

# on another terminal
cd comments-ts
# serves the ui via http://localhost:8080/
yarn run dev
```

## Production mode
```sh
cd comments-ts
# produces a single js and other assets in comments-ts/dist/
yarn run build
```

