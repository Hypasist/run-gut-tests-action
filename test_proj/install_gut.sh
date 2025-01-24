#!/usr/bin/env bash

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
mkdir -p $dir/addons
cp -r $dir/../contrib/Gut/addons/gut $dir/addons/gut
