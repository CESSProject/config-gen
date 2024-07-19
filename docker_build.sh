#! /usr/bin/env bash

usage() {
    echo "Usage:"
	echo "    $0 -h    display this help message."
	echo "    $0 [options]"
    echo "Options:"
    echo "     -p publish image"
    echo "     -n network profile, options: devnet, testnet, mainnet, ownnet"
    echo "     -x use http proxy"
	exit 1;
}

PUBLISH=0
NETWORK="devnet"
PROXY=0

while getopts ":n:hpx" opt; do
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
        x )
            PROXY=1
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
if [ x"$NETWORK" == x"devnet" ] || [ x"$NETWORK" == x"testnet" ] || [ x"$NETWORK" == x"mainnet" ] || [ x"$NETWORK" == x"ownnet" ]; then
    IMAGEID="$IMAGEID:$NETWORK"
else
    echo "invalid network option, use 'devnet' instead"
    IMAGEID="$IMAGEID:devnet"
fi
if [ $PROXY -eq 1 ]; then
    docker build -t $IMAGEID -f $DOCKER_FILE_DIR/Dockerfile --build-arg http_proxy=$http_proxy --build-arg https_proxy=$https_proxy $CTX_DIR
else
    docker build -t $IMAGEID -f $DOCKER_FILE_DIR/Dockerfile $CTX_DIR
fi

if [ $? -ne "0" ]; then
    echo "$IMAGEID build failed!"
    exit 1
fi

echo "build success"
if [ "$PUBLISH" -eq "1" ]; then
    echo "will publish $IMAGEID image"
    docker push $IMAGEID
fi