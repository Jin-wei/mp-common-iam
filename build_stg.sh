#!/bin/bash
#This script is used to complete the process of build staging

rm which_version || true
git log -1 --format="%H" >> which_version

v_cleanbuild=0
if [  -n "$1"  ]; then
	v_cleanbuild=$1
fi

if [ "$v_cleanbuild" -eq "1" ]; then
    sudo rm -r node_modules || true
fi

sudo npm install
cp conf_stg.json conf.json
grunt

