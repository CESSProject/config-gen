#! /usr/bin/env bash

usage() {
    echo "Usage:"
	echo "    $0 -h    display this help message."
	echo "    $0 [options]"
    echo "Options:"
    echo "     -p publish image"
    echo "     -n network profile, options: devnet, testnet, mainnet"
	exit 1;
}

PUBLISH=0
NETWORK="devnet"

while getopts ":hpn:" opt; do
    case ${opt} in
        h )
			usage
            ;;
        p )
            PUBLISH=1
            ;;
        n )
            NETWORK=${OPTARG}
            ;;
        \? )
            echo "Invalid Option: -$OPTARG" 1>&2
            exit 1
            ;;
    esac
done

DOCKER_FILE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
CTX_DIR=$DOCKER_FILE_DIR
IMAGEID="cesslab/config-gen"
if [ x"$NETWORK" == x"devnet" ] || [ x"$NETWORK" == x"testnet" ] || [ x"$NETWORK" == x"mainnet" ]; then
    IMAGEID="$IMAGEID:$NETWORK"
else
    echo "invalid network option, use 'devnet' instead"
    IMAGEID="$IMAGEID:devnet"
fi

docker build -t $IMAGEID -f $DOCKER_FILE_DIR/Dockerfile $CTX_DIR
if [ $? -ne "0" ]; then
    echo "$IMAGEID build failed!"
    exit 1
fi

echo "build success"
if [ "$PUBLISH" -eq "1" ]; then
    echo "will publish $IMAGEID image"
    docker push $IMAGEID
fi