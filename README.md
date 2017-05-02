# comments app

## Server runtime dependencies
- jdk7

## Desktop runtime dependencies
- jdk7
- [nwjs](https://nwjs.io/) [0.19.5](https://dl.nwjs.io/v0.19.5/) or higher

## Dev requirements
- [protostuffdb](https://gitlab.com/dyu/protostuffdb)
  * download the [binaries](https://1drv.ms/f/s!Ah8UGrNGpqlzeAVPYtkNffvNZBo) (protostuffdb and protostuffdb.exe) into the ```target/``` dir
- [node](https://nodejs.org/en/download/) 6.9.0 or higher
- yarn (npm install -g yarn)
- jdk7 (at /usr/lib/jvm/java-7-oracle)
- [maven](https://maven.apache.org/download.cgi)

## Setup
```sh
mkdir -p target/data/main
echo "Your data lives in user/ dir.  Feel free to back it up." > target/data/main/README.txt
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
If ```run.sh``` is still running, stop that process (ctrl+c)
```sh
cd comments-ts
# produces a single js and other assets in comments-ts/dist/
yarn run build
# finally, run your production app
nw .
```

## Packaging for desktop (nwjs)
Exec
```sh
./scripts/archive.sh
```

That script generates:
- target/comments-linux-x64.tar.gz
- target/comments-win-x64.zip

